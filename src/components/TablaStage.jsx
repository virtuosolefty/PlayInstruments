import { useEffect, useRef, useState } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { buildDrumModelRig } from '../lib/stage/drumModelRig.js';
import { buildTablaZones } from '../lib/stage/tablaZones.js';
import { DRUM_OF } from '../lib/struck/tablaMap.js';
import { castShadows } from '../lib/stage/modelFinish.js';
import { collectResources, loadInstrumentModel } from '../lib/stage/models.js';
import { midiInput } from '../lib/input/midiInput.js';
import { createStudio, disposeResources } from '../lib/stage/studio.js';
import { NO_TURN, attachTurntable, isTurned } from '../lib/stage/turntable.js';
import { STAGE_COLORS, STAGE_THEME } from '../lib/stage/stageColors.js';
import { reducedMotion } from '../lib/practice/beatPulse.js';
import ModelCredit from './ModelCredit.jsx';

/** The prepared model (scripts/models/recipes.mjs): the dayan and the bayan, each a part of its own. */
const MODEL = 'tabla';
/** The stroke a tap on each drum plays, away from the rings that mark where each stroke is struck (tablaZones.js). */
const TAP = Object.freeze({ dayan: 'na', bayan: 'ge' });
/** Tun and Te share the dayan's centre; a tap there plays the open stroke, Tun. */
const UNTAPPED = new Set(['te']);
/** The pair from the player's seat, a little above, as a player looks down at the heads. */
const SHOT = Object.freeze({ azimuthDeg: 0, elevationDeg: 40 });
const VIEW = Object.freeze({ fovDeg: 30 });
const TURN = Object.freeze({ yaw: Object.freeze([-0.8, 0.8]), pitch: Object.freeze([-0.2, 0.3]) });
const FLASH_COLORS = Object.freeze({ correct: STAGE_COLORS.hit, timing: STAGE_COLORS.late, wrong: STAGE_COLORS.miss, free: STAGE_COLORS.hitLine });

/**
 * The 3D tabla: the downloaded pair (credited CC BY-NC), each drum lit and moved when one of its strokes sounds,
 * from the drums, the pads, the keys or a controller. Each stroke's place on the head is a ring (tablaZones.js), the
 * same places the 2D picture marks: the next stroke's ring glows, and a struck one flashes. A tap plays the stroke
 * whose ring it lands on (the dayan's centre plays Tun); elsewhere on a drum, Na or Ge. If the model cannot load,
 * the 2D picture carries on.
 */
export default function TablaStage({ set, engine, score, onHit, onUnavailable, freePlay = false, listening = false, quality = 'auto' }) {
  const host = useRef(null);
  const latest = useRef(null);
  latest.current = { set, engine, score, onHit, onUnavailable, freePlay, listening };
  const [labels, setLabels] = useState([]);
  const [nextDrums, setNextDrums] = useState('');
  const [ready, setReady] = useState(false);
  const [turned, setTurned] = useState(false);
  const reset = useRef(() => {});

  useEffect(() => {
    const el = host.current;
    let studio;
    try {
      studio = createStudio(el, { theme: STAGE_THEME, quality });
    } catch (error) {
      console.warn('[stage] the 3D tabla could not start, keeping to the pads:', error.message);
      latest.current.onUnavailable(error.message);
      return undefined;
    }
    const canvas = studio.renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    el.dataset.stageTier = studio.tier;
    let rig = null, zones = null, root = null, anchors = [], shot = null;
    let dirty = true, marked = '', lastTime = 0, raf = 0, stopped = false, turn = NO_TURN;

    const placeLabels = () => {
      if (!rig) return;
      const project = studio.projector(studio.scene);
      setLabels(anchors.map(({ id, at }) => ({ id, ...project(at.x, at.y, at.z) })));
    };
    const frame = () => {
      if (!shot || !studio.frame(shot, { view: VIEW, turn })) return;
      placeLabels();
      dirty = true;
    };
    const strike = (pieceId, type = 'free', strength = 0.8) => {
      const drum = DRUM_OF[pieceId];
      if (!rig || !drum) return;
      // The ring shows where the stroke landed; the drum itself only gives a little under the hand.
      rig.hit(drum, FLASH_COLORS[type] ?? FLASH_COLORS.free, zones ? 0.3 : strength);
      zones?.flash(pieceId, FLASH_COLORS[type] ?? FLASH_COLORS.free, strength);
      dirty = true;
    };

    loadInstrumentModel(MODEL).then(loaded => {
      if (stopped) { if (loaded) disposeResources(collectResources(loaded.scene)); return; }
      if (!loaded) { latest.current.onUnavailable('the tabla model could not be loaded'); return; }
      castShadows(loaded.scene);
      root = new Group();
      root.add(loaded.scene);
      // Stage units are large (24 across); the studio is built for an instrument about a metre across.
      const box = new Box3().setFromObject(root), size = box.getSize(new Vector3());
      const scale = 0.9 / Math.max(size.x, size.z);
      root.scale.setScalar(scale);
      root.position.set(-((box.min.x + box.max.x) / 2) * scale, -box.min.y * scale, -((box.min.z + box.max.z) / 2) * scale);
      studio.scene.add(root);
      root.updateMatrixWorld(true);
      rig = buildDrumModelRig(loaded.scene, { reducedMotion });
      const drums = new Map();
      loaded.scene.traverse(node => { const id = /^drum-([a-z]+)-/.exec(node.name)?.[1]; if (id) drums.set(id, [...(drums.get(id) ?? []), node]); });
      zones = buildTablaZones(drums);
      zones.group.forEach(ring => studio.scene.add(ring));
      zones.resources.geometries.forEach(item => studio.owned.geometries.add(item));
      zones.resources.materials.forEach(item => studio.owned.materials.add(item));
      const found = collectResources(loaded.scene);
      for (const kind of ['geometries', 'materials', 'textures']) found[kind].forEach(item => studio.owned[kind].add(item));
      anchors = [...new Map(rig.anchors.map(anchor => [anchor.id, anchor])).values()]
        .map(({ id, box: drumBox }) => ({ id, at: new Vector3((drumBox.min.x + drumBox.max.x) / 2, drumBox.max.y + 0.02, (drumBox.min.z + drumBox.max.z) / 2) }));
      const fitted = new Box3().setFromObject(root);
      studio.fitGround({ min: fitted.min.toArray(), max: fitted.max.toArray() });
      shot = { box: { min: fitted.min.toArray(), max: fitted.max.toArray() }, ...SHOT };
      studio.refreshShadow?.();
      el.dataset.ready = 'true';
      setReady(true);
      frame();
    }, error => {
      console.warn('[stage] the tabla model could not be loaded, keeping to the pads:', error.message);
      latest.current.onUnavailable(error.message);
    });

    const tick = now => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden || !rig) return;
      const { engine: e, score: study, set: strokes, freePlay: free, listening: hearing } = latest.current;
      // The drums of the next beat still to be struck glow, as the drum kit's do.
      let next = new Set(), nextStrokes = new Set();
      if (!free && study) {
        const t = Math.max(0, e.transportRef.current?.now() ?? 0);
        const waiting = (e.sessionRef.current?.targets ?? study.notes).filter(note => (note.status ?? 'pending') === 'pending' && note.time >= t - 0.12);
        nextStrokes = new Set(waiting.filter(note => note.time === waiting[0].time).map(note => strokes.forMidi(note.midi)?.id).filter(Boolean));
        next = new Set([...nextStrokes].map(id => DRUM_OF[id]).filter(Boolean));
      }
      const key = [...nextStrokes].sort().join(',');
      if (key !== marked) {
        marked = key;
        setNextDrums([...next].sort().join(','));
        // With the rings, the next stroke's place glows rather than its whole drum.
        rig.mark(zones ? new Set() : next, STAGE_COLORS.noteRight);
        zones?.mark(nextStrokes, STAGE_COLORS.noteRight);
        dirty = true;
      }
      const time = e.transportRef.current?.now() ?? 0;
      if (hearing && e.playing && study && time > lastTime && time - lastTime < 0.5) {
        for (const note of study.notes) if (note.time > lastTime && note.time <= time) strike(strokes.forMidi(note.midi)?.id);
      }
      lastTime = time;
      if (rig.update(now)) dirty = true;
      if (zones?.update(now)) dirty = true;
      if (!dirty) return;
      dirty = false;
      studio.render();
    };

    const off = midiInput.onMessage(message => {
      if (message.type !== 'noteon') return;
      const piece = latest.current.set.forMidi(message.midi);
      if (!piece) return;
      strike(piece.id, latest.current.engine.activeInputRef.current.get(piece.midi)?.type, message.velocity);
    });
    const drumAt = event => (rig ? studio.pick(event, rig.targets)?.userData.drum : null);
    // The stroke whose ring is under the pointer, if any: the rings lie just above the skin, so they are met first.
    const strokeAt = event => {
      if (!zones) return null;
      const ring = studio.pick(event, zones.group.filter(mesh => !UNTAPPED.has(mesh.name.replace('tabla-zone-', ''))));
      return ring ? ring.name.replace('tabla-zone-', '') : null;
    };
    const table = attachTurntable(canvas, {
      limits: () => (latest.current.freePlay ? TURN : null),
      canGrab: event => !drumAt(event),
      onTurn: next => { turn = next; setTurned(isTurned(next)); if (shot && studio.aim(shot, { view: VIEW, turn })) { placeLabels(); dirty = true; } },
      reducedMotion,
    });
    const onDown = event => {
      if (event.button > 0) return;
      const stroke = strokeAt(event), drum = stroke ? null : drumAt(event);
      if (stroke || (drum && TAP[drum])) { event.preventDefault(); latest.current.onHit(stroke ?? TAP[drum]); }
    };
    const onMove = event => { if (!table.dragging) canvas.style.cursor = strokeAt(event) || drumAt(event) ? 'pointer' : latest.current.freePlay ? 'grab' : ''; };
    const onLost = event => { event.preventDefault(); latest.current.onUnavailable('the graphics context was lost'); };
    reset.current = () => table.reset();
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('webglcontextlost', onLost);
    const resize = new ResizeObserver(frame);
    resize.observe(el);
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      off();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
      table.stop();
      reset.current = () => {};
      delete el.dataset.ready;
      studio.dispose();
    };
  }, [quality]);
  useEffect(() => { if (!freePlay) reset.current(); }, [freePlay]);

  const keysFor = drum => set.pieces.filter(piece => DRUM_OF[piece.id] === drum);
  return <div className="guitar-stage drum-stage tabla-stage" ref={host} role="group" aria-label="Three-dimensional tabla: the dayan on the right, the bayan on the left" data-view={freePlay ? 'freePlay' : 'lesson'}>
    <div className="drum-labels" aria-hidden="true">
      {labels.map(label => <span key={label.id} className={`drum-label ${nextDrums.split(',').includes(label.id) ? 'next' : ''}`} style={{ left: `${label.x}px`, top: `${label.y}px` }}>
        {label.id === 'dayan' ? 'Dayan' : 'Bayan'}{keysFor(label.id).map(piece => <kbd key={piece.id} title={piece.short}>{piece.key.toUpperCase()}</kbd>)}
      </span>)}
    </div>
    {!ready && <div className="bowed-stage-preparing" role="status">Setting up your tabla…</div>}
    <div className="guitar-stage-bottom">
      <span className="guitar-stage-legend">{freePlay ? <><i className="played" />Struck</> : <><i className="played" />Struck <i className="next" />Next</>}</span>
      <span className="guitar-stage-end">
        {freePlay && turned && <button type="button" className="guitar-reset-view" onClick={() => reset.current()}>Reset view</button>}
        {ready && <ModelCredit id={MODEL} />}
        <span className="guitar-stage-hint">{freePlay ? 'Tap a drum: the dayan plays Na, the bayan Ge · drag to turn' : 'Tap a drum, or press a bol’s letter'}</span>
      </span>
    </div>
  </div>;
}
