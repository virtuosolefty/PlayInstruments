import { Color } from 'three';

/**
 * pianoModelRig.js — a downloaded piano whose keys go down as their notes play.
 *
 * scripts/models/prepare.mjs puts each key of such a piano in a part of its
 * own, named `key-<midi>` (keyParts, showcase.mjs). This finds those parts in
 * the loaded scene; while a note sounds its key is held down and lit in the
 * colour it was played in, and when the note ends it comes back up. A part's
 * node sits at the middle of its box, so lowering it moves the key alone.
 *
 * Materials are cloned for the keys, because the piano's own is one textured
 * material for the whole instrument, and lighting it would light everything.
 * The clones are plain ivory and ebony: a key covers a few texels of a shared
 * texture, and at a picture's size the colours beside them bleed in (one
 * piano's white keys came out pink from the felt next to them).
 */

const PART = /^key-(\d+)$/;
/** How far a key goes down, in stage units (the piano is 24 long), and how long the travel takes each way, in ms. */
const DEPTH = 0.22;
const DOWN_MS = 45;
const UP_MS = 140;
const GLOW = 0.55;
const IVORY = '#f2eee4';
const EBONY = '#141217';
const isBlack = midi => [1, 3, 6, 8, 10].includes(midi % 12);

const cloned = material => (Array.isArray(material) ? material.map(each => each.clone()) : material.clone());

/**
 * @param {import('three').Object3D} scene a loaded piano (models.js)
 * @param {{ reducedMotion?: () => boolean }} [options] when true a key is lit but does not move
 * @returns {{ keys: number[], targets: import('three').Mesh[], press: (midi: number, color: string, now?: number) => void,
 *   release: (midi: number, now?: number) => void, update: (now: number) => boolean }}
 *   `update` moves what is moving and says whether anything was, so the caller draws a frame
 */
export function buildPianoModelRig(scene, { reducedMotion = () => false } = {}) {
  const keys = new Map();
  const targets = [];
  scene.traverse(node => {
    const found = PART.exec(node.name);
    if (!found) return;
    const midi = Number(found[1]);
    const materials = [];
    node.traverse(object => {
      if (!object.isMesh) return;
      object.userData.midi = midi;
      object.material = cloned(object.material);
      for (const material of [object.material].flat()) {
        material.map = null;
        material.color?.set(isBlack(midi) ? EBONY : IVORY);
        material.roughness = isBlack(midi) ? 0.32 : 0.38;
        material.needsUpdate = true;
      }
      materials.push(...[object.material].flat());
      targets.push(object);
    });
    keys.set(midi, { node, materials, restY: node.position.y, down: false, color: new Color(), from: 0, at: 0, progress: 0 });
  });
  targets.sort((a, b) => a.userData.midi - b.userData.midi);

  const move = (key, down, now) => {
    if (key.down === down) return;
    key.from = key.progress;
    key.down = down;
    key.at = now;
  };

  return {
    keys: [...keys.keys()].sort((a, b) => a - b),
    targets,
    press(midi, color, now = performance.now()) {
      const key = keys.get(midi);
      if (!key) return;
      key.color.set(color);
      move(key, true, now);
    },
    release(midi, now = performance.now()) {
      const key = keys.get(midi);
      if (key) move(key, false, now);
    },
    update(now) {
      let moving = false;
      const still = reducedMotion();
      for (const key of keys.values()) {
        const target = key.down ? 1 : 0;
        if (key.progress === target) continue;
        const span = key.down ? DOWN_MS : UP_MS;
        const t = Math.min(1, Math.max(0, (now - key.at) / span));
        const eased = t * t * (3 - 2 * t);
        key.progress = t >= 1 ? target : key.from + (target - key.from) * eased;
        key.node.position.y = still ? key.restY : key.restY - DEPTH * key.progress;
        for (const material of key.materials) material.emissive?.copy(key.color).multiplyScalar(GLOW * key.progress);
        moving = true;
      }
      return moving;
    },
  };
}
