import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import StagePlaceholder from './StagePlaceholder.jsx';
import { createPortal } from 'react-dom';
import BowCard from './BowCard.jsx';
import BowedStage from './BowedStage.jsx';
import StringTab from './StringTab.jsx';
import { studyGroups } from './StudyOptions.jsx';
import Listbox from './Listbox.jsx';
import Icon from './Icon.jsx';
import ViewOptions from './ViewOptions.jsx';
import TypeSwitch from './TypeSwitch.jsx';
import { bowedReach } from '../lib/strings/bowed.js';
import { stringKit } from '../lib/instruments.js';
import { noteInstruction } from '../lib/learning/learning.js';
import { normalizeStageQuality, STAGE_TIERS } from '../lib/stage/quality.js';
import { stageTierHere, webglAvailable } from '../lib/stage/webgl.js';
import { STAGE_THEME } from '../lib/stage/stageColors.js';
import { useStringInput } from '../hooks/useGuitarInput.js';
import { PLUCK_MS, TECHNIQUES, techniqueFor, withTechnique } from '../lib/audio/technique.js';

const BowedStage3D = lazy(() => import('./BowedStage3D.jsx'));

/**
 * The violin and cello studio: finger chart, fingerboard and scale explorer.
 *
 * On the 3D Stage at full detail the instrument is the downloaded model
 * (BowedStage3D.jsx); otherwise, and whenever the model or the graphics give
 * out, it is the 2D fingerboard (BowedStage.jsx). Under the 3D stage the 2D
 * fingerboard stays one click away for keyboard players.
 */
export default function BowedWorkspace({ instrument, onInstrument, onTuner, score, engine, settings, setSettings, onStudy, freePlay, onFreePlay, inspector, appearance = null }) {
  const kit = stringKit(instrument);
  const { bow, pluck, lift, silence, activePositions } = useStringInput(instrument);
  const [scale, setScale] = useState(kit.scales[0]);
  // Set when the 3D stage could not show the instrument; this workspace then keeps to the 2D fingerboard.
  const [flat, setFlat] = useState(false);
  const [, refresh] = useState(0);
  const live = useRef(null);
  live.current = { engine, activePositions };
  // Redraw only while something moves or sounds, plus once after it stops.
  useEffect(() => {
    let wasBusy = false;
    const id = setInterval(() => {
      if (document.hidden) return;
      const { engine: e, activePositions: held } = live.current;
      const busy = e.playing || held.current.size > 0 || e.activeInputRef.current.size > 0;
      if (busy || wasBusy) refresh(v => v + 1);
      wasBusy = busy;
    }, 80);
    return () => clearInterval(id);
  }, []);
  const reach = bowedReach(instrument);
  const maxFret = settings.bowedRange === 'octave' ? 12 : reach;
  const quality = normalizeStageQuality(settings.stageQuality);
  useEffect(() => { silence(); }, [score.id, engine.playing, maxFret, settings.renderer, quality, silence]);
  const strength = settings.bowPressure ?? 0.7;
  // With the bow a note sounds while it is held; with the fingers a press plucks it and it rings away by itself.
  const technique = techniqueFor(settings, instrument);
  const plucked = technique === 'fingers';
  useEffect(() => { silence(); }, [technique, silence]);
  const play = position => (plucked ? pluck([position], { strength, spread: 0, hold: PLUCK_MS[instrument] }) : bow(position, strength));
  const stop = plucked ? () => {} : lift;
  const now = Math.max(0, engine.songTime);
  const next = freePlay ? null : (engine.sessionRef.current?.targets ?? score.notes).find(n => n.status !== 'hit' && n.time >= now - 0.1);
  const labelMode = settings.bowedLabels ?? 'fingers';
  const labelSize = settings.instrumentLabelSize ?? 14;
  const solid = !flat && settings.renderer === 'gl' && webglAvailable() && stageTierHere(quality) === STAGE_TIERS.FULL;
  const card = <BowCard kit={kit} scale={scale} onScale={setScale} onBow={play} onLift={stop} silence={silence} settings={settings} setSettings={setSettings} activePositions={activePositions} technique={technique} />;
  const stage = { kit, engine, maxFret, labelMode, labelSize, target: next, selection: freePlay ? scale.positions : null, activePositions, onBow: play, onLift: stop, technique };
  const giveUp = why => {
    console.warn(`[stage] the 3D ${kit.label.toLowerCase()} is unavailable, showing the 2D fingerboard:`, why);
    silence();
    setFlat(true);
  };
  // 2D or 3D, Tuner and View: in the Up next row while there is a study, in the toolbar in free play.
  const tools = <span className="string-tools">
    {appearance}
    {onTuner && !freePlay && <button type="button" className="view-tool" onClick={onTuner} title="Tune your instrument with the microphone"><Icon name="tuner" size={14} /><span className="tool-label">Tuner</span></button>}
    <ViewOptions>
      <label>Reach<Listbox label="Visible finger places" value={maxFret === 12 ? 'octave' : 'first'} options={[{ value: 'first', label: `First position · 0–${reach}` }, { value: 'octave', label: 'Up to the octave · 0–12' }]} onChange={v => setSettings(s => ({ ...s, bowedRange: v }))} /></label>
      <label>Labels<Listbox label="Fingerboard labels" value={labelMode} options={[{ value: 'fingers', label: 'Fingers' }, { value: 'notes', label: 'Notes' }]} onChange={v => setSettings(s => ({ ...s, bowedLabels: v }))} /></label>
      <label>Text<Listbox label="Instrument label size" value={labelSize} options={[{ value: 14, label: 'Standard' }, { value: 18, label: 'Large' }]} onChange={v => setSettings(s => ({ ...s, instrumentLabelSize: +v }))} /></label>
    </ViewOptions>
  </span>;
  return (
    <section className={`guitar-workspace bowed-workspace stage-dark ${instrument}-workspace`} aria-label={`${kit.label} studio`}>
      {!freePlay && <StringTab instrument={instrument} score={score} engine={engine} pps={settings.pps} metronome={!!settings.metronome} />}
      {!freePlay && <div className="guitar-next"><span>UP NEXT</span><strong>{next ? noteInstruction(next, instrument) : 'Study complete'}</strong><span className="guitar-tab-key">0 = open string · numbers are fingers</span>{tools}</div>}
      <div className="guitar-view-controls">
        {onInstrument && <TypeSwitch instrument={instrument} onChange={onInstrument} />}
        <div className="type-switch technique-switch" role="group" aria-label={`How to play the ${kit.label.toLowerCase()}`}>
          {TECHNIQUES.map(t => <button key={t.id} type="button" aria-pressed={technique === t.id} title={t.hint} onClick={() => setSettings(s => withTechnique(s, instrument, t.id))}>{t.label}</button>)}
        </div>
        {!freePlay && <label className="guitar-exercise">Exercise<Listbox label={`${kit.label} exercise`} value={score.id} groups={studyGroups(kit)} onChange={onStudy} /></label>}
        {freePlay && tools}
      </div>
      {solid ? <>
        <Suspense fallback={<StagePlaceholder shape="bowed">Preparing your {kit.label.toLowerCase()}…</StagePlaceholder>}>
          <BowedStage3D {...stage} theme={STAGE_THEME} quality={quality} view={freePlay ? 'freePlay' : 'lesson'} onUnavailable={giveUp} />
        </Suspense>
        <details className="guitar-fret-controls with-stage bowed-finger-controls">
          <summary>Show finger buttons · keyboard accessible</summary>
          <BowedStage {...stage} />
        </details>
      </> : <BowedStage {...stage} />}
      {freePlay ? (inspector ? createPortal(card, inspector) : card)
        : <div className="guitar-chords"><button onClick={onFreePlay}>Explore scales in Free play →</button><span>Tapes mark first-position fingers · Outline: next note · Filled: played</span></div>}
    </section>
  );
}
