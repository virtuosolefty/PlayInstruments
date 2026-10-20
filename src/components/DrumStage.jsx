import { useCallback, useEffect, useRef, useState } from 'react';
import { Box3, Group, Vector3 } from 'three';
import { CYMBAL_BRONZE, buildDrumKit, modelPieceFor } from '../lib/struck/drumKitModel.js';
import { buildDrumSticks } from '../lib/struck/drumSticks.js';
import { buildDrumModelRig } from '../lib/stage/drumModelRig.js';
import { castShadows } from '../lib/stage/modelFinish.js';
import { collectResources, loadInstrumentModel } from '../lib/stage/models.js';
import { labelWidth, spreadLabels } from '../lib/struck/drumLabels.js';
import { DRUM_PIECES, drumForMidi } from '../lib/struck/drums.js';
import { midiInput } from '../lib/input/midiInput.js';
import { STAGE_TIERS } from '../lib/stage/quality.js';
import { createStudio, disposeResources } from '../lib/stage/studio.js';
import { NO_TURN, attachTurntable, isTurned } from '../lib/stage/turntable.js';
import { STAGE_COLORS, STAGE_THEME } from '../lib/stage/stageColors.js';
import { reducedMotion } from '../lib/practice/beatPulse.js';
import { otherModels } from '../lib/stage/stageModels.js';
import { useStageView } from '../hooks/useStageView.js';
import StageViewSwitch from './StageViewSwitch.jsx';
import WholeModels from './WholeModels.jsx';

/** The kit from the drummer's stool, looking down at the heads. */
const SHOT = Object.freeze({ azimuthDeg: 0, elevationDeg: 34 });
const VIEW = Object.freeze({ fovDeg: 30 });
/** How far free play lets the view be turned, in radians, on the stage's turntable (turntable.js). */
const TURN = Object.freeze({ yaw: Object.freeze([-0.7, 0.7]), pitch: Object.freeze([-0.22, 0.3]) });
const FLASH_MS = 280;
/** The downloaded kit played on the stage at full detail (stageModels.js); the kit built in code stands in until it loads, and for good if it cannot. */
const STAGED_KIT = 'drums-acoustic';
/** A stage narrower than this, or any stage on a phone or tablet, shows its names without their key badges. */
const TIGHT = 460;
const TOUCH_WIDTH = '(max-width: 900px)';
const isTight = el => el.clientWidth < TIGHT || (globalThis.matchMedia?.(TOUCH_WIDTH).matches ?? false);
const FLASH_COLORS = Object.freeze({ correct: STAGE_COLORS.hit, timing: STAGE_COLORS.late, wrong: STAGE_COLORS.miss, free: STAGE_COLORS.hitLine });

/** The pieces on the model to hit next: every drum of the next beat that is still to be played. */
function nextOnModel(engine, score, freePlay) {
  if (freePlay) return new Set();
  const now = Math.max(0, engine.transportRef.current?.now() ?? 0);
  const waiting = (engine.sessionRef.current?.targets ?? score.notes).filter(note => (note.status ?? 'pending') === 'pending' && note.time >= now - 0.12);
  const first = waiting[0]?.time;
  return new Set(waiting.filter(note => note.time === first).map(note => modelPieceFor(drumForMidi(note.midi)?.id)));
}

/**
 * Puts a loaded drum kit where the kit built in code stands: turned so the stage sees it from the stool, as it sees
 * the built kit (a prepared kit faces its audience), scaled to its width, centred on it and standing on the floor, so the stage's framing, floor and shadow carry on as they were. The built kit's drums go out of sight; its rug
 * stays under the new one. Each drum's name goes over the middle of the first piece of it found.
 */
function stageModelKit(scene, kit, studio) {
  castShadows(scene);
  const turned = new Group();
  turned.rotation.y = Math.PI;
  turned.add(scene);
  const root = new Group();
  root.add(turned);
  const box = new Box3().setFromObject(turned), size = box.getSize(new Vector3()), centre = box.getCenter(new Vector3());
  const scale = (kit.box.max[0] - kit.box.min[0]) / size.x;
  root.scale.setScalar(scale);
  root.position.set(((kit.box.min[0] + kit.box.max[0]) / 2) - centre.x * scale, -box.min.y * scale, ((kit.box.min[2] + kit.box.max[2]) / 2) - centre.z * scale);
  studio.scene.add(root);
  root.updateMatrixWorld(true);
  // The rig gives each drum materials of its own, so it comes before the resources are gathered.
  const rig = buildDrumModelRig(scene, { reducedMotion, cymbalColor: CYMBAL_BRONZE });
  const found = collectResources(scene);
  for (const kind of ['geometries', 'materials', 'textures']) found[kind].forEach(item => studio.owned[kind].add(item));
  for (const child of kit.group.children) if (!child.userData.ground) child.visible = false;
  const anchors = [...new Map(rig.anchors.filter(anchor => NAMES[anchor.id]).map(anchor => [anchor.id, anchor])).values()];
  return { rig, anchors };
}

/**
 * Where the sticks strike a downloaded kit: the top of each drum's box, a little toward the player, and a cymbal
 * further out on its bow. The kick is left to its pedal.
 */
function stickTargets(anchors) {
  const byId = new Map(anchors.map(anchor => [anchor.id, anchor]));
  return id => {
    const anchor = byId.get(id);
    if (!anchor?.box || id === 'kick') return null;
    const toward = id === 'crash' || id === 'ride' ? 0.1 : 0.05;
    return new Vector3(anchor.at.x, anchor.box.max.y + 0.004, anchor.at.z + toward);
  };
}

const NAMES = Object.freeze(Object.fromEntries(DRUM_PIECES.filter(piece => piece.id !== 'hihat-open').map(piece => [piece.id, piece])));
/** The key badges beside a name: its own, and on the hi-hat the one that opens it. */
const keysOn = id => (id === 'hihat' ? 2 : 1);

/**
 * The 3D drum kit that can be hit: at full detail the downloaded acoustic kit, fitted to the footprint of the kit built
 * in code (drumKitModel.js), which is drawn until the model arrives and on the light tier.
 *
 * Every hit lights the drum it landed on, whether it came from the model, the
 * pads, the computer keys or a MIDI controller, in the colour of its verdict.
 * In a lesson the drum to hit next carries a blue ring. In free play the view
 * turns when the floor is dragged, and at full detail Whole instrument offers
 * the other kits there are to see (WholeModels.jsx).
 *
 * @param {object} props
 * @param {object} props.engine the practice engine
 * @param {object} props.score the study on the lanes
 * @param {(id: string) => void} props.onHit
 * @param {(why: string) => void} props.onUnavailable called when 3D cannot start or is lost; the pads carry on
 * @param {boolean} [props.freePlay]
 * @param {boolean} [props.listening] the app is playing the study, so the kit shows each written hit
 * @param {'auto'|'full'|'light'} [props.quality]
 */
export default function DrumStage({ engine, score, onHit, onUnavailable, freePlay = false, listening = false, quality = 'auto' }) {
  const host = useRef(null);
  const latest = useRef(null);
  latest.current = { engine, score, onHit, onUnavailable, freePlay, listening };
  // Whoever shows another kit in place of this one is told of each hit, so it can move its drums.
  const hearers = useRef(new Set());
  const hear = useCallback(listener => {
    hearers.current.add(listener);
    return () => hearers.current.delete(listener);
  }, []);
  const [labels, setLabels] = useState([]);
  // The drums to hit next, as their ids joined: their name tags light with the ring, so the eye finds the name as well as the drum.
  const [nextKey, setNextKey] = useState('');
  const [turned, setTurned] = useState(false);
  const reset = useRef(() => {});
  // The other kits are downloaded models, which are for the full tier, as on the string stages.
  const [full, setFull] = useState(false);
  const [stageView, setStageView] = useStageView(freePlay ? 'freePlay' : 'lesson');
  const offersWhole = freePlay && full && otherModels('drums').length > 0;
  const whole = offersWhole && stageView === 'whole';
  // Another kit is being shown over this one: it is there to look at, not to hit.
  const [looking, setLooking] = useState(false);

  useEffect(() => {
    const el = host.current;
    let studio;
    try {
      studio = createStudio(el, { theme: STAGE_THEME, quality });
    } catch (error) {
      console.warn('[stage] the 3D drum kit could not start, keeping to the pads:', error.message);
      latest.current.onUnavailable(error.message);
      return undefined;
    }
    const kit = buildDrumKit({ highlight: STAGE_COLORS.noteRight });
    kit.resources.geometries.forEach(geometry => studio.owned.geometries.add(geometry));
    kit.resources.materials.forEach(material => studio.owned.materials.add(material));
    // The sticks and the kick's beater, which strike each drum as it is hit (drumSticks.js).
    const sticks = buildDrumSticks({ beater: kit.pieces.get('kick')?.beater });
    sticks.resources.geometries.forEach(geometry => studio.owned.geometries.add(geometry));
    sticks.resources.materials.forEach(material => studio.owned.materials.add(material));
    // On the stage itself, not in the kit: the kit is hidden when the downloaded one stands in for it, and the sticks
    // play that one too. The kit's group sits at the stage's origin, so both share its space.
    studio.scene.add(kit.group, sticks.group);
    studio.fitGround(kit.box);
    const canvas = studio.renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    el.dataset.stageTier = studio.tier;
    setFull(studio.tier === STAGE_TIERS.FULL);

    const shot = { box: kit.box, ...SHOT };
    const flashes = new Map();
    let dirty = true, marked = '', lastTime = 0, raf = 0, stopped = false, turn = NO_TURN;

    // Once the downloaded kit is on the stage: its rig, which lights and moves each drum, and where each drum's name goes.
    let staged = null;
    const placeLabels = () => {
      const bare = isTight(el);
      const named = (id, at) => ({ id, width: labelWidth(NAMES[id].short, bare ? 0 : keysOn(id)), ...at });
      if (staged) {
        const project = studio.projector(studio.scene);
        setLabels(spreadLabels(staged.anchors.map(({ id, at }) => named(id, project(at.x, at.y, at.z)))));
        return;
      }
      const project = studio.projector(kit.group);
      setLabels(spreadLabels([...kit.pieces.values()].map(piece => named(piece.id, project(piece.anchor.x, piece.anchor.y, piece.anchor.z)))));
    };
    const frame = () => {
      el.classList.toggle('tight', isTight(el));
      if (!studio.frame(shot, { view: VIEW, turn })) return;
      placeLabels();
      dirty = true;
    };
    const flash = (id, type = 'free', strength = 0.8) => {
      const piece = kit.pieces.get(modelPieceFor(id));
      if (!piece) return;
      const color = FLASH_COLORS[type] ?? FLASH_COLORS.free;
      flashes.set(piece.id, { at: performance.now(), color, strength: Math.min(1, Math.max(0.3, strength)) });
      sticks.strike(piece.id, performance.now());
      staged?.rig.hit(piece.id, color, strength);
      for (const listener of hearers.current) listener({ id: piece.id, color, strength });
      dirty = true;
    };
    const settle = piece => {
      piece.surface.material.emissive.set('#000000');
      piece.root.rotation.copy(piece.rest);
      piece.root.scale.setScalar(1);
    };

    const tick = now => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const { engine: e, score: study, freePlay: free, listening: hearing } = latest.current;

      const next = nextOnModel(e, study, free);
      const key = [...next].sort().join(',');
      if (key !== marked) {
        marked = key;
        setNextKey(key);
        for (const piece of kit.pieces.values()) piece.ring.visible = next.has(piece.id);
        staged?.rig.mark(next, STAGE_COLORS.noteRight);
        dirty = true;
      }

      // While the app plays the study, the kit shows each written hit as it sounds.
      const time = e.transportRef.current?.now() ?? 0;
      if (hearing && e.playing && time > lastTime && time - lastTime < 0.5) {
        for (const note of study.notes) if (note.time > lastTime && note.time <= time) flash(drumForMidi(note.midi)?.id);
      }
      lastTime = time;

      if (staged?.rig.update(now)) dirty = true;
      if (sticks.update(now, reducedMotion())) dirty = true;
      if (flashes.size) {
        const still = !reducedMotion();
        for (const [id, hit] of flashes) {
          const piece = kit.pieces.get(id), age = (now - hit.at) / FLASH_MS;
          if (age >= 1) { settle(piece); flashes.delete(id); continue; }
          const fade = (1 - age) * hit.strength;
          piece.surface.material.emissive.set(hit.color).multiplyScalar(fade * 0.9);
          if (!still) continue;
          // A cymbal rocks on its stand; a drum's head gives.
          if (piece.kind === 'cymbal' || piece.kind === 'hihat') piece.root.rotation.x = piece.rest.x + Math.sin(age * 22) * 0.1 * fade;
          else piece.root.scale.setScalar(1 + 0.03 * fade);
        }
        dirty = true;
      }
      if (!dirty) return;
      dirty = false;
      studio.render();
    };

    const off = midiInput.onMessage(message => {
      if (message.type !== 'noteon') return;
      const piece = drumForMidi(message.midi);
      if (!piece) return;
      const verdict = latest.current.engine.activeInputRef.current.get(piece.midi)?.type;
      flash(piece.id, verdict, message.velocity);
    });

    // Only free play turns the kit, and only by the floor: a press on a drum is a hit.
    const table = attachTurntable(canvas, {
      limits: () => (latest.current.freePlay ? TURN : null),
      canGrab: event => !studio.pick(event, targets()),
      onTurn: next => {
        turn = next;
        setTurned(isTurned(next));
        if (studio.aim(shot, { view: VIEW, turn })) { placeLabels(); dirty = true; }
      },
      reducedMotion,
    });
    const onDown = event => {
      if (event.button > 0) return;
      const struck = studio.pick(event, targets());
      if (struck) { event.preventDefault(); latest.current.onHit(struck.userData.piece ?? struck.userData.drum); }
    };
    const onMove = event => {
      if (!table.dragging) canvas.style.cursor = studio.pick(event, targets()) ? 'pointer' : latest.current.freePlay ? 'grab' : '';
    };
    const onLost = event => {
      event.preventDefault();
      console.warn('[stage] the 3D drum kit lost its graphics context, keeping to the pads');
      latest.current.onUnavailable('the graphics context was lost');
    };
    reset.current = () => table.reset();

    if (studio.tier === STAGE_TIERS.FULL) {
      loadInstrumentModel(STAGED_KIT).then(loaded => {
        if (!loaded) return;
        if (stopped) { disposeResources(collectResources(loaded.scene)); return; }
        try {
          staged = stageModelKit(loaded.scene, kit, studio);
          sticks.aimAt(stickTargets(staged.anchors));
          staged.rig.mark(new Set(marked ? marked.split(',') : []), STAGE_COLORS.noteRight);
          el.dataset.stageKit = STAGED_KIT;
          studio.refreshShadow();
          placeLabels();
          dirty = true;
        } catch (error) {
          console.warn('[stage] the acoustic kit could not go on the stage, keeping the kit built in code:', error.message);
        }
      }, error => console.warn('[stage] the acoustic kit could not be loaded, keeping the kit built in code:', error.message));
    }
    const targets = () => staged?.rig.targets ?? kit.targets;

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
      reset.current = () => {};
      delete el.dataset.ready;
      delete el.dataset.stageKit;
      studio.dispose();
    };
  }, [quality]);

  // Leaving free play puts the view back where a lesson expects it.
  useEffect(() => { if (!freePlay) reset.current(); }, [freePlay]);

  return <div className="guitar-stage drum-stage" ref={host} role="group" aria-label="Three-dimensional drum kit" data-view={freePlay ? 'freePlay' : 'lesson'}>
    <div className="drum-labels" aria-hidden="true">
      {labels.map(label => <span key={label.id} className={`drum-label ${nextKey.split(',').includes(label.id) ? 'next' : ''}`} style={{ left: `${label.x}px`, top: `${label.y}px` }}>
        {NAMES[label.id].short}<kbd>{NAMES[label.id].key.toUpperCase()}</kbd>{label.id === 'hihat' && <kbd title="Open hi-hat">O</kbd>}
      </span>)}
    </div>
    <WholeModels instrument="drums" active={whole} quality={quality} onShowing={setLooking} hits={hear} onHit={onHit} />
    <div className="guitar-stage-bottom">
      <span className="guitar-stage-legend">{freePlay ? <><i className="played" />Hit</> : <><i className="played" />Hit <i className="next" />Next</>}</span>
      <span className="guitar-stage-end">
        {offersWhole && <StageViewSwitch label="Practice kit" short="Kit" value={whole ? 'whole' : 'learn'} onChange={setStageView} />}
        {freePlay && turned && <button type="button" className="guitar-reset-view" onClick={() => reset.current()}>Reset view</button>}
        <span className="guitar-stage-hint">{whole && looking ? 'Tap a drum to play · drag the background to turn' : freePlay ? 'Tap a drum to play · drag the floor to turn' : 'Tap a drum, or press its letter'}</span>
      </span>
    </div>
  </div>;
}
