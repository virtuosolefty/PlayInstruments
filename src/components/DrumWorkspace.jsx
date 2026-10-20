import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import StagePlaceholder from './StagePlaceholder.jsx';
import HandpanMap from './HandpanMap.jsx';
import TablaMap from './TablaMap.jsx';
import { PHONE_QUERY, useMediaQuery } from '../hooks/useMediaQuery.js';
import { createPortal } from 'react-dom';
import DrumLanes from './DrumLanes.jsx';
import DrumPads from './DrumPads.jsx';
import { studyGroups } from './StudyOptions.jsx';
import Listbox from './Listbox.jsx';
import { struckSetFor } from '../lib/struck/struckSets.js';
import { instrumentKit } from '../lib/instruments.js';
import { normalizeStageQuality } from '../lib/stage/quality.js';
import { webglAvailable } from '../lib/stage/webgl.js';
import { useDrumInput } from '../hooks/useDrumInput.js';

const DrumStage = lazy(() => import('./DrumStage.jsx'));
const HandpanStage = lazy(() => import('./HandpanStage.jsx'));
const TablaStage = lazy(() => import('./TablaStage.jsx'));
/** The 3D stage each struck instrument is played on, and what its placeholder outlines while it loads. */
const STAGES = { drums: [DrumStage, 'drums', 'Setting up your kit…'], tabla: [TablaStage, 'drums', 'Setting up your tabla…'], handpan: [HandpanStage, 'drums', 'Setting up your handpan…'] };

/** The drums of the next beat that are still to be hit. */
function nextHits(engine, score) {
  const now = Math.max(0, engine.songTime);
  const waiting = (engine.sessionRef.current?.targets ?? score.notes).filter(note => (note.status ?? 'pending') === 'pending' && note.time >= now - 0.12);
  return waiting.filter(note => note.time === waiting[0].time);
}

/**
 * The pieces as a player meets them: a set with groups (the tabla's two drums, the handpan's two shells) group by
 * group in the order the groups come, low to high within each, so the handpan's card starts at the ding. A set
 * without groups (the drum kit) keeps its own order.
 */
function cardOrder(pieces) {
  if (!pieces[0]?.group) return pieces;
  const groups = [...new Set(pieces.map(piece => piece.group))];
  return [...pieces].sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group) || a.midi - b.midi);
}

/** The instrument at a glance for free play: every piece, the key that plays it, and a button to hear it. */
/** A card listing more pieces than this shows the first `FOLDED_SHOWS`, and the rest on request: the pads already carry every name and key. */
const FOLD_OVER = 9, FOLDED_SHOWS = 2;

function StruckCard({ set, label, onHit }) {
  const { card } = set;
  const [all, setAll] = useState(false);
  const order = cardOrder(set.pieces);
  const folds = order.length > FOLD_OVER;
  const shown = folds && !all ? order.slice(0, FOLDED_SHOWS) : order;
  const listId = `${set.id}-card-keys`;
  return <section className="drum-card" aria-label={label}>
    <header><span className="eyebrow">{card.eyebrow}</span><h3>{card.title}</h3><p>{card.intro}</p></header>
    <ul id={listId}>{shown.map(piece => <li key={piece.id}>
      <button type="button" onClick={() => onHit(piece.id)} aria-label={`Hear ${set.id === 'drums' ? `the ${piece.label.toLowerCase()}` : piece.label}`}><kbd>{piece.key.toUpperCase()}</kbd><span>{piece.label}</span><small>{piece.limb ?? piece.group ?? (piece.side === 'left' ? 'left hand' : 'right hand')}</small></button>
    </li>)}</ul>
    {folds && <button type="button" className="drum-card-more" aria-expanded={all} aria-controls={listId} onClick={() => setAll(open => !open)}>{all ? 'Show fewer keys' : `Show all ${order.length} keys`}</button>}
    <p className="hint">{card.hint}</p>
  </section>;
}

/**
 * The studio for a struck instrument (struck.js): the drums, the tabla, the handpan. The lanes to read, the 3D
 * instrument to strike, and the pads; which instrument it is comes only from its set.
 *
 * On the 3D Stage the kit is the model built in code (DrumStage.jsx); in a
 * lesson it stands beside the lanes, where a wide window has room for both. On
 * the 2D Trainer, and whenever 3D cannot start or is lost, the pads are the
 * whole instrument. The pads are always reachable, so touch, keyboard and
 * screen-reader players never depend on the model: under the 3D kit they fold
 * away on a wide screen and stay out on a narrow one, where they are the
 * easier thing to hit.
 *
 * @param {boolean} [props.compact] a narrow screen
 */
export default function DrumWorkspace({ instrument = 'drums', score, engine, settings, onStudy, freePlay, onFreePlay, inspector, listening = false, compact = false, onError, appearance = null }) {
  const set = struckSetFor(instrument);
  const kit = instrumentKit(instrument);
  const hit = useDrumInput(onError, set);
  const [Stage, shape, preparing] = STAGES[instrument] ?? STAGES.drums;
  // Set when the 3D kit could not be shown; the workspace then keeps to the pads.
  const [flat, setFlat] = useState(false);
  const [, refresh] = useState(0);
  const live = useRef(engine);
  live.current = engine;
  // The next-hit marks move with the music, so redraw while it plays and once after it stops.
  useEffect(() => {
    let wasBusy = false;
    const id = setInterval(() => {
      if (document.hidden) return;
      const busy = live.current.playing || live.current.activeInputRef.current.size > 0;
      if (busy || wasBusy) refresh(count => count + 1);
      wasBusy = busy;
    }, 80);
    return () => clearInterval(id);
  }, []);

  const quality = normalizeStageQuality(settings.stageQuality);
  const solid = !flat && settings.renderer === 'gl' && webglAvailable();
  const coming = freePlay ? [] : nextHits(engine, score);
  const next = new Set(coming.map(note => set.forMidi(note.midi)?.id));
  const card = <StruckCard set={set} label={kit.label} onHit={hit} />;
  const phone = useMediaQuery(PHONE_QUERY);
  // The handpan and the tabla are played on pictures of themselves, each note or stroke where it is struck; the drums on their pads.
  const MAPS = { handpan: HandpanMap, tabla: TablaMap };
  const Map = MAPS[instrument];
  const pads = Map ? <Map set={set} onHit={hit} next={next} /> : <DrumPads set={set} onHit={hit} next={next} large={!solid} />;
  const giveUp = why => {
    console.warn(`[stage] the 3D ${kit.label.toLowerCase()} is unavailable, showing the pads:`, why);
    setFlat(true);
  };

  return (
    <section className={`guitar-workspace drums-workspace ${instrument}-workspace stage-dark ${solid ? 'with-kit' : 'pads-only'}`} aria-label={`${set.noun ?? kit.label} studio`}>
      {freePlay && appearance && <div className="guitar-view-controls drum-view-controls"><span className="string-tools">{appearance}</span></div>}
      {(!freePlay || solid) && <div className="drum-board" style={{ '--drum-lanes': set.lanes(score).length }}>
        {!freePlay && <DrumLanes set={set} score={score} engine={engine} pps={settings.pps} metronome={!!settings.metronome} />}
        {solid && <Suspense fallback={<StagePlaceholder shape={shape} className="drum-stage">{preparing}</StagePlaceholder>}>
          <Stage set={set} engine={engine} score={score} onHit={hit} onUnavailable={giveUp} freePlay={freePlay} listening={listening} quality={quality} />
        </Suspense>}
      </div>}
      {!freePlay && <div className="guitar-next"><span>UP NEXT</span><strong>{coming.length ? set.upNext(coming) : 'Study complete'}</strong>
        <label className="guitar-exercise drum-exercise">Exercise<Listbox label={`${set.noun ?? kit.label} exercise`} value={score.id} groups={studyGroups(kit)} onChange={onStudy} /></label>
        {appearance && <span className="string-tools">{appearance}</span>}
      </div>}
      {solid && !compact
        ? <details className="guitar-fret-controls with-stage drum-pad-controls"><summary>Show {set.padsLabel.toLowerCase()} · keyboard accessible</summary>{pads}</details>
        : pads}
      {freePlay ? (inspector ? createPortal(card, inspector) : phone ? <details className="folded-card"><summary>{`Keys and tips · ${set.card.title}`}</summary>{card}</details> : card)
        : <div className="guitar-chords"><button onClick={onFreePlay}>Explore the {instrument === 'drums' ? 'kit' : kit.label.toLowerCase()} in Free play →</button><span>{set.legend ?? 'Blue ring: hit next · Blue tiles are hands, amber is the kick'}</span></div>}
    </section>
  );
}
