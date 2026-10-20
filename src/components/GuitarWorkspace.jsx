import { createPortal } from 'react-dom';
import StagePlaceholder from './StagePlaceholder.jsx';
import ChordCard from './ChordCard.jsx';
import OpenStringsCard from './OpenStringsCard.jsx';
import { chordPositionLabel, chordTone } from '../lib/strings/guitarPresentation.js';
import { guitarFeedback, visibleFrets } from '../lib/strings/instrumentView.js';
import { PHONE_QUERY, useMediaQuery } from '../hooks/useMediaQuery.js';
import ViewOptions from './ViewOptions.jsx';
import { lazy, Suspense, useEffect, useState } from 'react';
import StringTab from './StringTab.jsx';
import { studyGroups } from './StudyOptions.jsx';
import Listbox from './Listbox.jsx';
import Icon from './Icon.jsx';
import TypeSwitch from './TypeSwitch.jsx';
import { stringKit } from '../lib/instruments.js';
import { keyPitchClassSet, noteName, pitchClass } from '../lib/music/theory.js';
import { useStringInput } from '../hooks/useGuitarInput.js';
import { stageTierHere, webglAvailable } from '../lib/stage/webgl.js';
import { normalizeStageQuality, STAGE_TIERS } from '../lib/stage/quality.js';
import { STAGE_THEME } from '../lib/stage/stageColors.js';

const GuitarStage = lazy(() => import('./GuitarStage.jsx'));
const FrettedModelStage = lazy(() => import('./FrettedModelStage.jsx'));
const INLAYS = [3, 5, 7, 9, 12];

/** Real fret spacing: each fret is 2^(-1/12) the width of the one before. */
function fretColumns(maxFret) {
  const widths = Array.from({ length: maxFret }, (_, i) => 2 ** (-i / 12) - 2 ** (-(i + 1) / 12));
  const first = widths[0];
  return `var(--control-h) minmax(var(--control-h),.62fr) ${widths.map(w => `minmax(var(--control-h),${(w / first).toFixed(3)}fr)`).join(' ')}`;
}

/**
 * What the free-play card is about, in the one line it folds to on a phone (`.folded-card`, so free play opens on the
 * instrument): the chords, or the open strings (by swara on the veena, string 1 first, as its card says them).
 */
export const foldedSummary = (kit, chord) => {
  if (chord) return 'Chords · pick a shape and strum';
  const strings = kit.tuning.map((_, s) => s);
  const names = kit.swara ? strings.reverse().map(s => kit.swara(kit.tuning[s])) : strings.map(s => kit.stringName(s).note);
  return `Open strings · ${names.join(' ')}`;
};

/**
 * The studio of a fretted instrument: the guitar, the bass or the veena.
 *
 * What the 3D stage shows depends on the instrument (`kit.stage`): the guitar
 * has the one built in code and its model (GuitarStage.jsx); the bass and the
 * veena are played on their downloaded models at full detail (FrettedModelStage.jsx).
 * Wherever there is no 3D stage, and whenever one gives out, the drawn
 * fretboard below is the instrument, and it is always one click away for
 * keyboard players.
 *
 * @param {object} props
 * @param {string} [props.instrument] 'guitar', 'bass' or 'veena'
 */
/** The View pop-over's choices. */
const FRET_CHOICES = [{ value: 5, label: '0–5 · first position' }, { value: 12, label: '0–12 · full neck' }];
const TEXT_CHOICES = [{ value: 14, label: 'Standard' }, { value: 18, label: 'Large' }];

export default function GuitarWorkspace({ instrument = 'guitar', onInstrument, onTuner, score, engine, settings, setSettings, onStudy, onContextLost, freePlay, onFreePlay, inspector, appearance = null }) {
  const kit = stringKit(instrument);
  const count = kit.tuning.length, label = kit.label, name = label.toLowerCase();
  const strings = Array.from({ length: count }, (_, s) => count - 1 - s);
  const [chord, setChord] = useState(kit.chords[0] ?? null);
  // Set when the model the instrument is played on could not be shown; the drawn fretboard takes over.
  const [flat, setFlat] = useState(false);
  const leftHanded = !!settings.guitarLeftHanded;
  const { pluck, silence, activePositions } = useStringInput(instrument);
  useEffect(() => { silence(); }, [score.id, engine.playing, settings.guitarFrets, settings.renderer, settings.stageQuality, silence]);
  const [focusPosition,setFocusPosition]=useState({string:0,fret:0});
  const [navActive,setNavActive]=useState(false);
  const phone = useMediaQuery(PHONE_QUERY);
  const maxFret=visibleFrets(settings.guitarFrets, phone);
  const [,refresh]=useState(0);
  useEffect(()=>{const id=setInterval(()=>refresh(v=>v+1),80);return()=>clearInterval(id);},[]);
  const pick = position => pluck([position],{strength:settings.guitarStrength??.72});
  const strum = direction => { silence(); pluck(chord.frets.flatMap((fret,string)=>fret==null?[]:[{string,fret}]),{direction,strength:settings.guitarStrength??.72,spread:settings.guitarSpread??32}); };
  const card = chord
    ? <ChordCard kit={kit} chord={chord} onChord={c=>{silence();setChord(c);}} onStrum={strum} onPick={pick} activePositions={activePositions} settings={settings} setSettings={setSettings} leftHanded={leftHanded}/>
    : <OpenStringsCard kit={kit} onPick={pick} activePositions={activePositions} settings={settings} setSettings={setSettings} leftHanded={leftHanded}/>;
  const navigate=(e,string,fret)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;
    e.preventDefault(); e.stopPropagation();
    const direction=leftHanded?-1:1;
    const next={string:Math.min(count-1,Math.max(0,string+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0))),fret:Math.min(maxFret,Math.max(0,e.key==='Home'?0:e.key==='End'?maxFret:fret+(e.key==='ArrowRight'?direction:e.key==='ArrowLeft'?-direction:0)))};
    setFocusPosition(next);e.currentTarget.closest('.guitar-fretboard').querySelector('[data-position="'+next.string+'-'+next.fret+'"]').focus();
  };
  // On the veena, the sarani's frets in the piece's raga or scale carry their swara, so Ga is found by name.
  const raga = kit.swara && score?.key ? keyPitchClassSet(score.key.tonic, score.key.mode) : null;
  const swaraAt = (s, fret) => { const midi = kit.midi(s, fret); return raga && s === count - 1 && raga.has(pitchClass(midi)) ? kit.swara(midi) : null; };
  const now = Math.max(0, engine.songTime);
  const next = (engine.sessionRef.current?.targets ?? score.notes).find(n => n.status !== 'hit' && n.time >= now - 0.1);
  const quality = normalizeStageQuality(settings.stageQuality);
  const gl = settings.renderer === 'gl' && webglAvailable();
  // The drawn guitar runs on either tier; a model that is played directly needs the full one.
  const stage = !gl ? null : kit.stage === 'drawn' ? 'drawn' : kit.stage === 'model' && !flat && stageTierHere(quality) === STAGE_TIERS.FULL ? 'model' : null;
  const giveUp = why => {
    console.warn(`[stage] the 3D ${name} is unavailable, showing the drawn fretboard:`, why);
    silence();
    setFlat(true);
  };
  const shared = { engine, score, onPluck: pick, activePositions, maxFret, labelSize: settings.instrumentLabelSize??14, focusPosition: navActive?focusPosition:null, leftHanded, theme: STAGE_THEME, quality, view: freePlay ? 'freePlay' : 'lesson' };
  // 2D or 3D, Tuner and View: in the Up next row while there is a study, in the toolbar in free play.
  const tools = <span className="string-tools">{appearance}{onTuner && !freePlay && <button type="button" className="view-tool" onClick={onTuner} title="Tune your instrument with the microphone"><Icon name="tuner" size={14} /><span className="tool-label">Tuner</span></button>}<ViewOptions><label>Frets<Listbox label={`Visible ${name} frets`} value={maxFret} options={FRET_CHOICES} onChange={v=>{setFocusPosition({string:0,fret:0});setSettings(s=>({...s,guitarFrets:+v}));}} /></label><label>Text<Listbox label="Instrument label size" value={settings.instrumentLabelSize??14} options={TEXT_CHOICES} onChange={v=>setSettings(s=>({...s,instrumentLabelSize:+v}))} /></label>{!freePlay && stage === 'drawn' && <label className="guitar-height-control">Neck height<input aria-label="Fretboard height" type="range" min="180" max="300" step="5" value={settings.guitarHeight??230} onChange={e=>setSettings(s=>({...s,guitarHeight:+e.target.value}))}/></label>}<label className="guitar-left-toggle"><input type="checkbox" aria-label="Left-handed" checked={leftHanded} onChange={e=>setSettings(s=>({...s,guitarLeftHanded:e.target.checked}))}/>Left-handed</label></ViewOptions></span>;
  return (
    <section className={`guitar-workspace stage-dark ${instrument}-workspace`} aria-label={`${label} studio`} style={{"--fretboard-height":(settings.guitarHeight??230)+"px"}}>
      {!freePlay && <StringTab instrument={instrument} score={score} engine={engine} pps={settings.pps} metronome={!!settings.metronome} />}
      {!freePlay && <div className="guitar-next"><span>UP NEXT</span><strong>{next ? `${kit.swara ? `${kit.swara(next.midi)} · ` : ''}${next.name} · string ${kit.stringName(next.string).number} · ${next.fret === 0 ? 'open' : `fret ${next.fret}`}` : 'Study complete'}</strong><span className="guitar-tab-key">0 = open string</span>{tools}</div>}
      <div className="guitar-view-controls">{onInstrument && <TypeSwitch instrument={instrument} onChange={onInstrument} />}{!freePlay && <label className="guitar-exercise">Exercise<Listbox label={`${label} exercise`} value={score.id} groups={studyGroups(kit)} onChange={onStudy} /></label>}{freePlay && tools}</div>

      {stage === 'drawn' && <Suspense fallback={<StagePlaceholder shape="strings">Preparing your fretboard…</StagePlaceholder>}>
        <GuitarStage {...shared} labelMode={settings.guitarLabels??'fingers'} onContextLost={onContextLost} chord={freePlay ? chord : null} />
      </Suspense>}
      {stage === 'model' && <Suspense fallback={<StagePlaceholder shape="strings">Preparing your {name}…</StagePlaceholder>}>
        <FrettedModelStage {...shared} kit={kit} onUnavailable={giveUp} />
      </Suspense>}
      <details className={`guitar-fret-controls ${stage ? 'with-stage' : ''}`} open={!stage} key={stage ? 'stage' : 'trainer'}>
      <summary>Show fret buttons · keyboard accessible</summary>
      <div className={`guitar-fretboard ${leftHanded ? 'left-handed' : ''}`} aria-label={`Playable ${name} fretboard`} role="group" data-instrument-navigation="true" style={{"--strings":count,"--frets":maxFret+1,"--fret-columns":fretColumns(maxFret),"--instrument-label-size":(settings.instrumentLabelSize??14)+"px"}} onFocus={()=>setNavActive(true)} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setNavActive(false);}}>
        <div className="fret-numbers"><span />{Array.from({length:maxFret+1}, (_, i) => <span key={i} className={INLAYS.includes(i) ? 'inlay-fret' : undefined}>{i === 0 ? 'OPEN' : i}</span>)}</div>
        <div className="fretboard-surface" aria-hidden="true"><span />{Array.from({length:maxFret+1}, (_, i) => <span key={i} className={i === 12 ? 'double' : INLAYS.includes(i) ? 'single' : undefined} />)}</div>
        {strings.map(s => <div className={`guitar-string ${kit.wound(s) ? 'wound' : 'plain'}`} key={s} style={{'--string-color': kit.colors[s], '--gauge': (1 + (count - 1 - s) * 0.42).toFixed(2) + 'px'}}>
          <span className="string-name">{noteName(kit.tuning[s])}</span>
          {Array.from({length:maxFret+1}, (_, fret) => {
            const target = !freePlay && next?.string === s && next?.fret === fret;
            const shaped = freePlay && !!chord && chord.frets[s] === fret;
            const feedback=guitarFeedback({midi:kit.midi(s,fret),string:s,fret},engine.activeInputRef.current,activePositions.current,target,shaped,false);
            // A place showing the next note, a chord shape or a held note keeps that; otherwise the swara shows.
            const swara = !target && !shaped && !['held','possible'].includes(feedback) ? swaraAt(s, fret) : null;
            return <button data-position={s+"-"+fret} tabIndex={focusPosition.string===s&&focusPosition.fret===fret?0:-1} key={fret} className={`${feedback} ${freePlay && chordTone(chord,s,kit.midi)?.root ? 'chord-root' : ''} ${target ? 'target' : ''} ${shaped ? 'chord-position' : ''} ${swara ? 'swara' : ''}`}
              aria-label={`String ${kit.stringName(s).number}, ${fret === 0 ? 'open' : `fret ${fret}`}, ${noteName(kit.midi(s, fret))}`}
              onKeyDown={e=>{if(e.key===' ')e.stopPropagation();navigate(e,s,fret);}} onFocus={()=>setFocusPosition({string:s,fret})}
              onClick={() => pick({string:s,fret})}><span>{shaped ? chordPositionLabel(chord,s,settings.guitarLabels??'fingers',kit.midi) : target ? fret : feedback==='held'?'●':feedback==='possible'?'○':swara ?? noteName(kit.midi(s,fret)).replace(/\d/g,'')}</span></button>;
          })}
        </div>)}
      </div>
      </details>
      {freePlay ? (inspector ? createPortal(card,inspector) : phone ? <details className="folded-card"><summary>{foldedSummary(kit, chord)}</summary>{card}</details> : card) : <div className="guitar-chords"><button onClick={onFreePlay}>{chord ? 'Explore chords in Free play →' : 'Explore the neck in Free play →'}</button><span>{kit.swara ? 'Labelled: the swaras of the raga on the sarani · Outline: next note · Filled: played' : 'Outline: next note · Filled: played · Faint: possible MIDI position'}</span></div>}
    </section>
  );
}
