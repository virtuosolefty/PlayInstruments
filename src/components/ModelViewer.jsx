import { useEffect, useRef, useState } from 'react';
import { castShadows } from '../lib/stage/modelFinish.js';
import { barEdges, clearOfBars } from '../lib/stage/stageBars.js';
import { buildDrumModelRig } from '../lib/stage/drumModelRig.js';
import { buildPianoModelRig } from '../lib/stage/pianoModelRig.js';
import { midiInput } from '../lib/input/midiInput.js';
import { playInput } from '../lib/input/playInput.js';
import { STAGE_COLORS } from '../lib/stage/stageColors.js';
import { CYMBAL_BRONZE } from '../lib/struck/drumKitModel.js';
import { collectResources, loadInstrumentModel } from '../lib/stage/models.js';
import { createStudio, disposeResources } from '../lib/stage/studio.js';
import { NO_TURN, attachTurntable, isTurned } from '../lib/stage/turntable.js';
import { STAGE_THEME } from '../lib/stage/stageColors.js';
import { VIEWER_LENS, VIEWER_TURN, showcaseShot } from '../lib/stage/showcaseView.js';
import { drumPiece } from '../lib/struck/drums.js';
import ResetViewButton from './ResetViewButton.jsx';

/** A kit with every bolt modelled is several megabytes; it may take a slow connection this long. */
const DOWNLOAD_LIMIT_MS = 60000;
/** The voice a press on the modelled piano's keys plays in (playInput.js): one key at a time, held while the pointer is down. */
const KEY_VOICE = 'model-piano-key';

/**
 * A model that is only shown, standing where the stage's own instrument was:
 * framed whole between the stage's bottom bar and its own caption, and turned
 * by dragging on the stage's turntable (turntable.js). It has its own studio,
 * so the stage beneath is left exactly as it was for the way back to Learn.
 *
 * A frame is drawn only when something changed. The model's files are fetched
 * once a page (models.js); a stalled or broken download calls `onFailed`.
 *
 * A drum kit (`struck` in stageModels.js) answers to the hits it is told of
 * through `hits`: each drum lights and moves (drumModelRig.js). A piano
 * (`keyed`) hears every note played, from any input: each key goes down and
 * lights while its note sounds (pianoModelRig.js), and a key on the model can
 * be pressed to play it.
 *
 * @param {object} props
 * @param {{ id: string, label: string, struck?: boolean, keyed?: boolean }} props.model from stageModels.js
 * @param {'auto'|'full'|'light'} [props.quality]
 * @param {(why: string) => void} props.onFailed
 * @param {(listener: (hit: { id: string, color: string, strength: number }) => void) => () => void} [props.hits] subscribes to the drum hits; gives back a way to stop
 */
export default function ModelViewer({ model, quality = 'auto', onFailed, hits, onHit }) {
  const host = useRef(null);
  const latest = useRef(null);
  latest.current = { onFailed, hits, onHit };
  const reset = useRef(() => {});
  const [ready, setReady] = useState(false);
  const [turned, setTurned] = useState(false);
  const [resetFocused, setResetFocused] = useState(false);
  const [labels, setLabels] = useState([]);
  const name = model.label.toLowerCase();

  useEffect(() => {
    const el = host.current;
    let studio;
    try {
      studio = createStudio(el, { theme: STAGE_THEME, quality });
    } catch (error) {
      latest.current.onFailed(error.message);
      return undefined;
    }
    const canvas = studio.renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    let stopped = false, raf = 0, dirty = false, shot = null, turn = NO_TURN, bounds, rig = null;
    // The viewer covers the stage, whose bars lie over it: the caption at the top, the view switch at the bottom.
    const stage = el.parentElement ?? el;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReady(false);
    setTurned(false);
    setLabels([]);
    const placeLabels = () => {
      if (!rig?.anchors) return;
      const project = studio.projector(studio.scene);
      setLabels(rig.anchors.map(anchor => ({ ...anchor, ...project(anchor.at.x, anchor.at.y, anchor.at.z) })));
    };

    const frame = () => {
      bounds = clearOfBars(barEdges(stage, { top: '.model-caption' }));
      if (shot && studio.frame(shot, { view: VIEWER_LENS, turn, bounds })) dirty = true;
      placeLabels();
    };
    const tick = now => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      if (rig?.update(now)) dirty = true;
      if (!dirty) return;
      dirty = false;
      studio.render();
    };
    // Nothing turns until there is a model to turn.
    const table = attachTurntable(canvas, {
      limits: () => (shot ? VIEWER_TURN : null),
      canGrab: event => !rig || !studio.pick(event, rig.targets),
      onTurn: next => {
        turn = next;
        setTurned(isTurned(next));
        if (shot && studio.aim(shot, { view: VIEWER_LENS, turn, bounds })) dirty = true;
        placeLabels();
      },
      reducedMotion: () => calm.matches,
    });
    reset.current = () => table.reset();

    loadInstrumentModel(model.id, { timeoutMs: DOWNLOAD_LIMIT_MS }).then(loaded => {
      if (stopped) { if (loaded) disposeResources(collectResources(loaded.scene)); return; }
      if (!loaded) { latest.current.onFailed('its files could not be loaded'); return; }
      try {
        castShadows(loaded.scene);
        // Before the resources are gathered: the rig gives each drum materials of its own.
        if (model.struck) rig = buildDrumModelRig(loaded.scene, { reducedMotion: () => calm.matches, cymbalColor: CYMBAL_BRONZE });
        if (model.keyed) rig = buildPianoModelRig(loaded.scene, { reducedMotion: () => calm.matches });
        const found = collectResources(loaded.scene);
        for (const kind of ['geometries', 'materials', 'textures']) found[kind].forEach(item => studio.owned[kind].add(item));
        studio.scene.add(loaded.scene);
        studio.fitGround(loaded.fit.bounds);
        shot = showcaseShot(loaded.fit);
        frame();
        el.dataset.ready = 'true';
        setReady(true);
      } catch (error) {
        latest.current.onFailed(error.message);
      }
    }, error => { if (!stopped) latest.current.onFailed(error.message); });

    const stopHits = model.struck ? latest.current.hits?.(({ id, color, strength }) => {
      if (!rig) return;
      rig.hit(id, color, strength);
      dirty = true;
    }) : undefined;
    // Every note, from the screen, the computer keys or a controller, holds its key down until the note ends.
    // `data-keys-down` says how many, for anyone checking from outside.
    const held = new Set();
    const stopNotes = model.keyed ? midiInput.onMessage(message => {
      if (!rig || (message.type !== 'noteon' && message.type !== 'noteoff')) return;
      if (message.type === 'noteon' && message.velocity > 0) { rig.press(message.midi, STAGE_COLORS.noteRight); held.add(message.midi); }
      else { rig.release(message.midi); held.delete(message.midi); }
      el.dataset.keysDown = String(held.size);
      dirty = true;
    }) : undefined;
    const onLost = event => { event.preventDefault(); latest.current.onFailed('the graphics context was lost'); };
    const onDown = event => {
      if (event.button !== 0 || !rig) return;
      const target = studio.pick(event, rig.targets);
      if (!target) return;
      event.preventDefault();
      if (target.userData.midi != null) playInput.press(KEY_VOICE, target.userData.midi);
      else latest.current.onHit?.(target.userData.drum);
    };
    const onUp = () => { if (model.keyed) playInput.release(KEY_VOICE); };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    canvas.addEventListener('webglcontextlost', onLost);
    const resize = new ResizeObserver(frame);
    resize.observe(el);
    raf = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      resize.disconnect();
      stopHits?.();
      stopNotes?.();
      onUp();
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      table.stop();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('pointerdown', onDown);
      reset.current = () => {};
      delete el.dataset.ready;
      studio.dispose();
    };
  }, [model.id, quality]);

  return <div className="model-viewer" ref={host} role="group" aria-label={`Three-dimensional ${name}`} data-model={model.id}>
    {!ready && <div className="model-viewer-preparing" role="status"><span>Preparing the {name}…</span></div>}
    {model.struck && <div className="model-drum-labels">{labels.map(label => <button key={label.key} className="model-drum-label" style={{ left: label.x, top: label.y }} aria-label={`Play ${drumPiece(label.id).label}`} onClick={() => onHit?.(label.id)}>{drumPiece(label.id).short}</button>)}</div>}
    {(turned || resetFocused) && <div className="model-reset"><ResetViewButton turned={turned} onReset={event => { reset.current(); if (event.detail > 0) event.currentTarget.blur(); }} onFocusChange={setResetFocused} /></div>}
  </div>;
}
