import { useEffect, useRef, useState } from 'react';
import { buildHandpan } from '../lib/struck/handpanModel.js';
import { midiInput } from '../lib/input/midiInput.js';
import { createStudio } from '../lib/stage/studio.js';
import { NO_TURN, attachTurntable, isTurned } from '../lib/stage/turntable.js';
import { STAGE_COLORS, STAGE_THEME } from '../lib/stage/stageColors.js';
import { reducedMotion } from '../lib/practice/beatPulse.js';
import { ease } from '../lib/struck/drumSticks.js';

/** The pan from the player's seat, looking down onto the top. */
const SHOT = Object.freeze({ azimuthDeg: 0, elevationDeg: 52 });
const VIEW = Object.freeze({ fovDeg: 30 });
const TURN = Object.freeze({ yaw: Object.freeze([-0.8, 0.8]), pitch: Object.freeze([-0.25, 0.3]) });
const FLASH_MS = 520, FLIP_MS = 420;
const FLASH_COLORS = Object.freeze({ correct: STAGE_COLORS.hit, timing: STAGE_COLORS.late, wrong: STAGE_COLORS.miss, free: STAGE_COLORS.hitLine });

/** The notes to strike next: every note of the next beat still to be played. */
function nextOnPan(engine, score, set, freePlay) {
  if (freePlay || !score) return new Set();
  const now = Math.max(0, engine.transportRef.current?.now() ?? 0);
  const waiting = (engine.sessionRef.current?.targets ?? score.notes).filter(note => (note.status ?? 'pending') === 'pending' && note.time >= now - 0.12);
  const first = waiting[0]?.time;
  return new Set(waiting.filter(note => note.time === first).map(note => set.forMidi(note.midi)?.id));
}

/**
 * The 3D handpan (handpanModel.js): strike a field to play its note. Every note, from the pan, the pads, the keys or
 * a controller, lights its field in its verdict's colour and makes its dome give; the next note to strike wears a
 * blue ring. Top or Underside turns the pan over to reach the notes underneath, and in free play the view turns
 * when the background is dragged.
 */
export default function HandpanStage({ set, engine, score, onHit, onUnavailable, freePlay = false, listening = false, quality = 'auto' }) {
  const host = useRef(null);
  const latest = useRef(null);
  latest.current = { set, engine, score, onHit, onUnavailable, freePlay, listening };
  const [labels, setLabels] = useState([]);
  const [nextKey, setNextKey] = useState('');
  const [turned, setTurned] = useState(false);
  const [underside, setUnderside] = useState(false);
  const flip = useRef(() => {});
  const reset = useRef(() => {});

  useEffect(() => {
    const el = host.current;
    let studio;
    try {
      studio = createStudio(el, { theme: STAGE_THEME, quality });
    } catch (error) {
      console.warn('[stage] the 3D handpan could not start, keeping to the pads:', error.message);
      latest.current.onUnavailable(error.message);
      return undefined;
    }
    const model = buildHandpan({ highlight: STAGE_COLORS.noteRight });
    model.resources.geometries.forEach(geometry => studio.owned.geometries.add(geometry));
    model.resources.materials.forEach(material => studio.owned.materials.add(material));
    // Raised on an invisible stand, so the underside has room when the pan is turned over.
    model.group.position.y = 0.16;
    studio.scene.add(model.group);
    studio.fitGround({ min: [-0.4, 0, -0.4], max: [0.4, 0.4, 0.4] });
    const canvas = studio.renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    el.dataset.stageTier = studio.tier;

    const shot = { box: { min: [-0.3, 0.02, -0.3], max: [0.3, 0.34, 0.3] }, ...SHOT };
    const flashes = new Map();
    let dirty = true, marked = '', lastTime = 0, raf = 0, stopped = false, turn = NO_TURN;
    // Turning over: from the angle it was at to the one it is going to.
    let flipFrom = 0, flipTo = 0, flipAt = -Infinity, showingUnder = false;

    const placeLabels = () => {
      const project = studio.projector(model.pan);
      setLabels([...model.pieces.values()].filter(piece => piece.under === showingUnder)
        .map(piece => ({ id: piece.id, ...project(piece.anchor.x, piece.anchor.y, piece.anchor.z) })));
    };
    const frame = () => {
      if (!studio.frame(shot, { view: VIEW, turn })) return;
      placeLabels();
      dirty = true;
    };
    const flash = (id, type = 'free', strength = 0.8) => {
      if (!model.pieces.has(id)) return;
      flashes.set(id, { at: performance.now(), color: FLASH_COLORS[type] ?? FLASH_COLORS.free, strength: Math.min(1, Math.max(0.3, strength)) });
      dirty = true;
    };
    flip.current = under => {
      if (under === showingUnder) return;
      showingUnder = under;
      flipFrom = model.pan.rotation.z;
      flipTo = under ? Math.PI : 0;
      flipAt = reducedMotion() ? -Infinity : performance.now();
      if (reducedMotion()) { model.pan.rotation.z = flipTo; placeLabels(); }
      dirty = true;
    };

    const tick = now => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const { engine: e, score: study, set: notes, freePlay: free, listening: hearing } = latest.current;
      const next = nextOnPan(e, study, notes, free);
      const key = [...next].sort().join(',');
      if (key !== marked) {
        marked = key;
        setNextKey(key);
        for (const piece of model.pieces.values()) piece.ring.visible = next.has(piece.id);
        dirty = true;
      }
      // While the app plays the study, the pan shows each written note as it sounds.
      const time = e.transportRef.current?.now() ?? 0;
      if (hearing && e.playing && study && time > lastTime && time - lastTime < 0.5) {
        for (const note of study.notes) if (note.time > lastTime && note.time <= time) flash(notes.forMidi(note.midi)?.id);
      }
      lastTime = time;

      // A turn over finishes on the first frame after its time is up, however late that frame comes (a slow device
      // can go longer than the turn between two frames).
      if (Number.isFinite(flipAt)) {
        const flipAge = Math.min(1, Math.max(0, (now - flipAt) / FLIP_MS));
        model.pan.rotation.z = flipFrom + (flipTo - flipFrom) * ease(flipAge);
        if (flipAge >= 1) { placeLabels(); flipAt = -Infinity; }
        dirty = true;
      }
      if (flashes.size) {
        const still = reducedMotion();
        for (const [id, hit] of flashes) {
          const piece = model.pieces.get(id), age = (now - hit.at) / FLASH_MS;
          if (age >= 1) {
            piece.surface.material.emissive.set('#000000');
            piece.surface.scale.y = piece.rest;
            flashes.delete(id);
            continue;
          }
          const fade = (1 - age) * hit.strength;
          piece.surface.material.emissive.set(hit.color).multiplyScalar(fade * 0.85);
          // The steel gives under the hand and springs back, ringing.
          if (!still) piece.surface.scale.y = piece.rest * (1 - 0.35 * fade * Math.cos(age * 18) * Math.exp(-age * 3));
        }
        dirty = true;
      }
      if (!dirty) return;
      dirty = false;
      studio.render();
    };

    const off = midiInput.onMessage(message => {
      if (message.type !== 'noteon') return;
      const piece = latest.current.set.forMidi(message.midi);
      if (!piece) return;
      const verdict = latest.current.engine.activeInputRef.current.get(piece.midi)?.type;
      flash(piece.id, verdict, message.velocity);
    });

    const table = attachTurntable(canvas, {
      limits: () => (latest.current.freePlay ? TURN : null),
      canGrab: event => !studio.pick(event, model.targets),
      onTurn: next => {
        turn = next;
        setTurned(isTurned(next));
        if (studio.aim(shot, { view: VIEW, turn })) { placeLabels(); dirty = true; }
      },
      reducedMotion,
    });
    const onDown = event => {
      if (event.button > 0) return;
      const struck = studio.pick(event, model.targets);
      if (struck) { event.preventDefault(); latest.current.onHit(struck.userData.piece); }
    };
    const onMove = event => {
      if (!table.dragging) canvas.style.cursor = studio.pick(event, model.targets) ? 'pointer' : latest.current.freePlay ? 'grab' : '';
    };
    const onLost = event => {
      event.preventDefault();
      console.warn('[stage] the 3D handpan lost its graphics context, keeping to the pads');
      latest.current.onUnavailable('the graphics context was lost');
    };
    reset.current = () => table.reset();

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('webglcontextlost', onLost);
    const resize = new ResizeObserver(frame);
    resize.observe(el);
    frame();
    el.dataset.ready = 'true';
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      off();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      table.stop();
      canvas.removeEventListener('webglcontextlost', onLost);
      flip.current = () => {};
      reset.current = () => {};
      delete el.dataset.ready;
      studio.dispose();
    };
  }, [quality]);

  useEffect(() => { flip.current(underside); }, [underside]);
  // A lesson that wants an underside note turns the pan over by itself; one on top turns it back.
  useEffect(() => {
    if (!nextKey) return;
    const ids = nextKey.split(',');
    const under = ids.every(id => set.piece(id)?.group === 'Underside');
    if (under !== underside && ids.every(id => set.piece(id))) setUnderside(under);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextKey]);
  useEffect(() => { if (!freePlay) reset.current(); }, [freePlay]);

  return <div className="guitar-stage drum-stage handpan-stage" ref={host} role="group" aria-label={`Three-dimensional handpan, ${underside ? 'underside' : 'top'} showing`} data-view={freePlay ? 'freePlay' : 'lesson'} data-side={underside ? 'underside' : 'top'}>
    <div className="drum-labels" aria-hidden="true">
      {labels.map(label => {
        const piece = set.piece(label.id);
        return <span key={label.id} className={`drum-label ${nextKey.split(',').includes(label.id) ? 'next' : ''}`} style={{ left: `${label.x}px`, top: `${label.y}px` }}>
          {piece.id === 'ding' ? 'Ding' : piece.short}<kbd>{piece.key.toUpperCase()}</kbd>
        </span>;
      })}
    </div>
    <div className="guitar-stage-bottom">
      <span className="guitar-stage-legend">{freePlay ? <><i className="played" />Struck</> : <><i className="played" />Struck <i className="next" />Next</>}</span>
      <span className="guitar-stage-end">
        <span className="type-switch handpan-side" role="group" aria-label="Side of the handpan">
          <button type="button" aria-pressed={!underside} onClick={() => setUnderside(false)}>Top</button>
          <button type="button" aria-pressed={underside} onClick={() => setUnderside(true)}>Underside</button>
        </span>
        {freePlay && turned && <button type="button" className="guitar-reset-view" onClick={() => reset.current()}>Reset view</button>}
        <span className="guitar-stage-hint">{freePlay ? 'Tap a note to play · drag the background to turn' : 'Tap a note, or press its key'}</span>
      </span>
    </div>
  </div>;
}
