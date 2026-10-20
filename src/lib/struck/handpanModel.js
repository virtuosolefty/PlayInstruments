import { CircleGeometry, DoubleSide, Group, LatheGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, Vector2, Vector3 } from 'three';
import { HANDPAN } from './handpan.js';

/**
 * The handpan on the 3D stage, built in code: two lathe-turned steel shells joined at a rim, the ding a raised dome
 * in the middle of the top, the tone fields soft dimples each with a dome of its own, and underneath seven more
 * fields round the gu, the hole the sound breathes through. Modelled on the D Aegean 18 the player showed us, in the
 * same satin gold, but drawn here from simple solids: nothing is downloaded.
 *
 * Lengths are in metres. The player sits at +z looking toward -z, as at the drum kit; the top is +y.
 */

/** A 53 cm pan, about 24 cm tall: the top shell is the higher, rounder one. */
const PAN = Object.freeze({ radius: 0.265, top: 0.155, bottom: 0.115, ring: 0.165, underRing: 0.16, ding: 0.062 });
const GOLD = Object.freeze({ color: '#c08a36', metalness: 0.88, roughness: 0.3, clearcoat: 0.35, clearcoatRoughness: 0.4 });
const SEGMENTS = 72;

/** The top shell's height at distance `r` from the middle: flat-ish near the rim, then rising to a soft crown. */
const topHeight = r => PAN.top * (1 - Math.min(1, r / PAN.radius) ** 2.3) ** 0.8;
const bottomDepth = r => PAN.bottom * (1 - Math.min(1, r / PAN.radius) ** 2.1) ** 0.75;

/** A field's size by its pitch: the lowest notes take the most steel. */
const fieldSize = midi => {
  const t = Math.min(1, Math.max(0, (midi - 50) / 28));
  return { a: 0.06 - t * 0.026, b: 0.045 - t * 0.02 };
};

/**
 * @param {object} [options]
 * @param {string} [options.highlight] the colour of the ring that marks the next note to strike
 * @returns {{ group: Group, pan: Group, pieces: Map<string, object>, targets: Mesh[], box: object, resources: { geometries: Set, materials: Set } }}
 *   `pan` is the instrument itself (it turns over to show the underside); `pieces` holds, by note id, `root` (the
 *   field), `surface` (the dome that flashes), `ring` (the next-note marker), `anchor` (where its name goes, in the
 *   pan's own units), `under` (on the underside) and `rest` (the dome's resting height).
 */
export function buildHandpan({ highlight = '#5ab8ff' } = {}) {
  const resources = { geometries: new Set(), materials: new Set() };
  const geometry = made => { resources.geometries.add(made); return made; };
  const material = made => { resources.materials.add(made); return made; };
  const steel = material(new MeshPhysicalMaterial({ ...GOLD, side: DoubleSide }));
  const mesh = (shape, skin) => { const made = new Mesh(shape, skin); made.castShadow = true; made.receiveShadow = true; return made; };

  const group = new Group();
  const pan = new Group();
  pan.name = 'handpan';
  group.add(pan);

  // The shells, turned on a lathe from their profiles.
  const profile = (height, sign) => Array.from({ length: 40 }, (_, i) => {
    const r = PAN.radius * (1 - i / 39);
    return new Vector2(Math.max(r, 0.0001), sign * height(r));
  });
  pan.add(mesh(geometry(new LatheGeometry(profile(topHeight, 1), SEGMENTS)), steel));
  pan.add(mesh(geometry(new LatheGeometry(profile(bottomDepth, -1).reverse(), SEGMENTS)), steel));
  // The rim where the shells are joined: a bright band all round.
  const band = mesh(geometry(new TorusGeometry(PAN.radius, 0.0055, 10, SEGMENTS)), material(new MeshStandardMaterial({ color: '#f1ece2', metalness: 0.7, roughness: 0.22 })));
  band.rotation.x = Math.PI / 2;
  pan.add(band);
  // The gu: a dark opening in the middle of the underside, with a lip.
  const gu = mesh(geometry(new CircleGeometry(0.058, 48)), material(new MeshBasicMaterial({ color: '#0c0905' })));
  gu.rotation.x = Math.PI / 2;
  gu.position.y = -PAN.bottom - 0.002;
  const lip = mesh(geometry(new TorusGeometry(0.06, 0.006, 8, 48)), steel);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -PAN.bottom + 0.001;
  pan.add(gu, lip);

  const pieces = new Map();
  const targets = [];
  const dimple = material(new MeshPhysicalMaterial({ ...GOLD, color: '#a8742a', roughness: 0.42 }));
  const ringFor = (a, b) => {
    const made = new Mesh(geometry(new TorusGeometry(1, 0.06, 8, 48)), material(new MeshBasicMaterial({ color: highlight, transparent: true, opacity: 0.95, depthTest: false })));
    // The ring's tube scales with it on every axis, or it stands up from the steel as a solid band.
    made.scale.set(a * 1.18, b * 1.18, Math.min(a, b));
    made.rotation.x = Math.PI / 2;
    made.visible = false;
    made.renderOrder = 2;
    return made;
  };

  for (const piece of HANDPAN.pieces) {
    const under = piece.group === 'Underside';
    const ding = piece.id === 'ding';
    const field = new Group();
    field.name = `field-${piece.id}`;
    const { a, b } = ding ? { a: PAN.ding, b: PAN.ding } : fieldSize(piece.midi);
    let surface, dimpleMesh;
    if (ding) {
      // The ding stands up from the crown rather than sitting in a dimple.
      surface = mesh(geometry(new SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2)), material(steel.clone()));
      surface.scale.set(a, 0.03, a);
      field.position.set(0, topHeight(0) - 0.004, 0);
    } else {
      const angle = (piece.angle * Math.PI) / 180;
      const reach = under ? PAN.underRing : PAN.ring;
      const x = Math.sin(angle) * reach, z = Math.cos(angle) * reach;
      const y = under ? -bottomDepth(reach) : topHeight(reach);
      field.position.set(x, y, z);
      // Face the field out of the shell: tip it by the shell's slope there, toward the rim.
      const h = under ? bottomDepth : topHeight, d = 0.002;
      const slope = Math.atan2(h(reach - d) - h(reach + d), 2 * d);
      field.rotation.set(0, angle, 0);
      field.rotateX(under ? Math.PI - slope : slope);
      // The long side of the oval points to the middle, as on a real pan.
      dimpleMesh = mesh(geometry(new SphereGeometry(1, 32, 12)), dimple);
      dimpleMesh.scale.set(b, 0.006, a);
      surface = mesh(geometry(new SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)), material(steel.clone()));
      surface.scale.set(b * 0.5, 0.012, a * 0.5);
      surface.position.y = 0.002;
      field.add(dimpleMesh);
    }
    field.add(surface);
    const ring = ringFor(ding ? a : b, ding ? a : a);
    ring.position.y = ding ? 0.032 : 0.016;
    field.add(ring);
    pan.add(field);
    for (const made of [surface, dimpleMesh].filter(Boolean)) { made.userData.piece = piece.id; targets.push(made); }
    const anchor = field.position.clone().add(new Vector3(0, under ? -0.03 : 0.03, 0));
    pieces.set(piece.id, { id: piece.id, root: field, surface, ring, anchor, under, rest: surface.scale.y });
  }

  return {
    group, pan, pieces, targets, resources,
    box: { min: [-PAN.radius, -PAN.bottom, -PAN.radius], max: [PAN.radius, PAN.top + 0.04, PAN.radius] },
  };
}
