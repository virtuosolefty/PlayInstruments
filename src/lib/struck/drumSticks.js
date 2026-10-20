import { CylinderGeometry, Group, Mesh, MeshStandardMaterial, Quaternion, SphereGeometry, Vector3 } from 'three';
import { KIT_LAYOUT } from './drumKitModel.js';

/**
 * drumSticks.js — a pair of sticks on the 3D kit (drumKitModel.js), striking each drum as it is hit.
 *
 * A hit is shown after it sounds, so a stroke is the end of one: the tip drops onto the place a drummer
 * strikes, bounces off it and drifts back to rest above the snare. The kick's beater swings into its head.
 * Lengths are in metres, in the kit's own space: the drummer sits at +z, looking toward -z.
 */

/** A 7A stick: 40 cm, thinning to the tip, in hickory. */
const LENGTH = 0.4, BUTT = 0.0075, NECK = 0.0042, BEAD = 0.0085;
const WOOD = '#d8b585', TIP = '#e8d2ad';
/** Each stroke's three parts, in milliseconds: down onto the drum, the bounce, the drift back to rest. */
export const STROKE = Object.freeze({ down: 45, bounce: 170, home: 420 });
const LIFT = 0.13;

/** Which hand plays which piece, for a right-handed drummer: the right crosses over to the hi-hat. */
const RIGHT = new Set(['hihat', 'ride', 'tom-mid', 'tom-floor']);
export const handFor = id => (RIGHT.has(id) ? 'right' : 'left');

/** Where the sticks hold when nothing is played: hands a little in front of the snare, tips hovering over it. */
const REST = Object.freeze({
  left: Object.freeze({ grip: [-0.2, 0.86, 0.6], tip: [-0.42, 0.74, 0.27] }),
  right: Object.freeze({ grip: [0.18, 0.88, 0.6], tip: [-0.3, 0.77, 0.2] }),
});

const spec = id => KIT_LAYOUT.find(piece => piece.id === id);

/**
 * The place on a piece a drummer strikes, in kit space: a drum's batter head a little toward the player, a
 * cymbal's bow nearer its edge, the hi-hat's top. Follows the piece's tilt. Null for the kick (the foot plays it).
 */
export function strikePoint(id) {
  const piece = spec(id);
  if (!piece || piece.kind === 'kick') return null;
  const local = piece.kind === 'cymbal' ? new Vector3(0, 0.012, piece.radius * 0.62)
    : piece.kind === 'hihat' ? new Vector3(0, 0.014, piece.radius * 0.55)
      : new Vector3(0, piece.depth / 2 + 0.006, piece.radius * 0.3);
  const [tx = 0, tz = 0] = piece.tilt ?? [];
  // The same turn the kit gives the piece's root (rotation x then z, as Three's default XYZ order applies it).
  local.applyAxisAngle(new Vector3(1, 0, 0), tx).applyAxisAngle(new Vector3(0, 0, 1), tz);
  return local.add(new Vector3(...piece.position));
}

/** The stick's pose on the drum: the tip on the strike point, the grip back toward the player and above it. */
export function contactPose(hand, point) {
  const rest = new Vector3(...REST[hand].grip);
  const toward = new Vector3(point.x + (rest.x - point.x) * 0.5, point.y + 0.2, point.z + 0.32);
  const along = point.clone().sub(toward).normalize();
  return { grip: point.clone().sub(along.multiplyScalar(LENGTH)), tip: point.clone() };
}

export const ease = t => 1 - (1 - t) ** 3;
const mix = (a, b, t) => a.clone().lerp(b, t);
const lifted = pose => ({ grip: pose.grip.clone().add(new Vector3(0, LIFT * 0.4, 0.02)), tip: pose.tip.clone().add(new Vector3(0, LIFT, 0.04)) });

/**
 * Where a stick is `elapsed` ms into a stroke that began from `from` and lands on `contact`; null once it is home.
 * @returns {{ grip: Vector3, tip: Vector3 } | null}
 */
export function strokePose({ from, contact, rest }, elapsed) {
  const { down, bounce, home } = STROKE;
  if (elapsed < 0) return from;
  if (elapsed < down) { const t = ease(elapsed / down); return { grip: mix(from.grip, contact.grip, t), tip: mix(from.tip, contact.tip, t) }; }
  const up = lifted(contact);
  if (elapsed < down + bounce) { const t = ease((elapsed - down) / bounce); return { grip: mix(contact.grip, up.grip, t), tip: mix(contact.tip, up.tip, t) }; }
  if (elapsed < down + bounce + home) { const t = ease((elapsed - down - bounce) / home); return { grip: mix(up.grip, rest.grip, t), tip: mix(up.tip, rest.tip, t) }; }
  return null;
}

/**
 * Builds the two sticks and the kick's beater swing, added to the kit's own group.
 * @param {{ beater?: import('three').Object3D }} options the kick's beater arm, from buildDrumKit
 * @returns {{ group: Group, strike(id: string, now: number): void, aimAt(pointFor: Function): void, update(now: number, still: boolean): boolean, resources: { geometries: Set, materials: Set } }}
 */
export function buildDrumSticks({ beater = null } = {}) {
  const resources = { geometries: new Set(), materials: new Set() };
  const wood = new MeshStandardMaterial({ color: WOOD, roughness: 0.55, metalness: 0 });
  const tipWood = new MeshStandardMaterial({ color: TIP, roughness: 0.5, metalness: 0 });
  resources.materials.add(wood).add(tipWood);
  // Along +y from the grip (y 0) to the tip (y LENGTH), so a stick is placed by its grip and turned toward its tip.
  const shaft = new CylinderGeometry(NECK, BUTT, LENGTH - BEAD, 12);
  shaft.translate(0, (LENGTH - BEAD) / 2, 0);
  const bead = new SphereGeometry(BEAD, 12, 10);
  bead.translate(0, LENGTH - BEAD, 0);
  resources.geometries.add(shaft).add(bead);

  const group = new Group();
  group.name = 'drum-sticks';
  const rest = { left: { grip: new Vector3(...REST.left.grip), tip: new Vector3(...REST.left.tip) }, right: { grip: new Vector3(...REST.right.grip), tip: new Vector3(...REST.right.tip) } };
  const sticks = {};
  for (const hand of ['left', 'right']) {
    const stick = new Group();
    stick.name = `stick-${hand}`;
    for (const [shape, skin] of [[shaft, wood], [bead, tipWood]]) {
      const made = new Mesh(shape, skin);
      made.castShadow = true;
      stick.add(made);
    }
    group.add(stick);
    sticks[hand] = { object: stick, pose: rest[hand], stroke: null, placed: '' };
  }
  const up = new Vector3(0, 1, 0), turn = new Quaternion();
  const place = (stick, pose) => {
    const key = `${pose.grip.toArray().map(n => n.toFixed(4))}|${pose.tip.toArray().map(n => n.toFixed(4))}`;
    if (key === stick.placed) return false;
    stick.placed = key;
    stick.object.position.copy(pose.grip);
    stick.object.quaternion.copy(turn.setFromUnitVectors(up, pose.tip.clone().sub(pose.grip).normalize()));
    stick.pose = pose;
    return true;
  };
  place(sticks.left, rest.left);
  place(sticks.right, rest.right);

  // Where each piece is struck: the built kit's own layout, unless another kit stands in its place (aimAt).
  let aim = null;
  // The beater arm pivots at the pedal: turned back toward the drum, its ball meets the head.
  const SWING = -0.3;
  let beaterAt = -Infinity;

  return {
    group,
    resources,
    /** A hit on piece `id` at `now` (performance.now()): the hand that plays it strikes, or the other if it is mid-stroke. */
    strike(id, now) {
      if (id === 'kick') { beaterAt = now; return; }
      const point = aim?.(id) ?? strikePoint(id);
      if (!point) return;
      let hand = handFor(id);
      const busy = h => sticks[h].stroke && now - sticks[h].stroke.at < STROKE.down + STROKE.bounce * 0.5;
      if (busy(hand) && !busy(hand === 'left' ? 'right' : 'left')) hand = hand === 'left' ? 'right' : 'left';
      const stick = sticks[hand];
      stick.stroke = { at: now, from: stick.pose, contact: contactPose(hand, point), rest: rest[hand] };
    },
    /** Strikes another kit's drums: `pointFor(id)` gives where, in the same space, or null to keep the built kit's. */
    aimAt(pointFor) { aim = pointFor; },
    /** Moves whatever is mid-stroke; with `still` (reduced motion) everything stays at rest. @returns whether anything moved */
    update(now, still = false) {
      let moved = false;
      for (const hand of ['left', 'right']) {
        const stick = sticks[hand];
        if (!stick.stroke) continue;
        const pose = still ? null : strokePose(stick.stroke, now - stick.stroke.at);
        if (!pose) stick.stroke = null;
        if (place(stick, pose ?? rest[hand])) moved = true;
      }
      if (beater) {
        const age = now - beaterAt;
        // Onto the head in a quick swing and back, a little slower.
        const angle = still || age > 260 ? 0 : SWING * (age < 60 ? ease(age / 60) : 1 - ease((age - 60) / 200));
        if (beater.rotation.x !== angle) { beater.rotation.x = angle; moved = true; }
      }
      return moved;
    },
  };
}
