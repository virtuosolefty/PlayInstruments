import { Color, DoubleSide, Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from 'three';
import { DRUM_OF, STROKE_PLACES } from '../struck/tablaMap.js';

/** How long a struck zone glows, and how bright the waiting (next) zone stays. */
const FLASH_MS = 520, NEXT_OPACITY = 0.55, FLASH_OPACITY = 0.95;
/** Just above the skin, so the ring is never hidden in it. */
const LIFT = 0.002;
/** A zone reaching beyond this share of the radius is on the rim. */
const RIM_FROM = 0.95;
/** The top this share of a drum's height is its head. */
const HEAD_SHARE = 0.06;

/**
 * Each drum's head, measured from its own vertices: its centre, its height and its radius (the ring of its highest
 * points, as the picture in TablaMap.jsx was measured), in world units.
 *
 * @param {Map<string, object[]>} drums the nodes of each drum, by its id
 */
export function measureHeads(drums) {
  const heads = {};
  const v = new Vector3();
  for (const [id, nodes] of drums) {
    const points = [];
    for (const node of nodes) node.traverse(object => {
      if (!object.isMesh) return;
      const position = object.geometry.attributes.position;
      for (let i = 0; i < position.count; i += 3) points.push(v.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld).clone());
    });
    if (!points.length) continue;
    const top = Math.max(...points.map(p => p.y)), low = Math.min(...points.map(p => p.y));
    const head = points.filter(p => p.y > top - (top - low) * HEAD_SHARE);
    const cx = head.reduce((sum, p) => sum + p.x, 0) / head.length, cz = head.reduce((sum, p) => sum + p.z, 0) / head.length;
    const radii = head.map(p => Math.hypot(p.x - cx, p.z - cz)).sort((a, b) => a - b);
    const r = radii[Math.floor(radii.length * 0.95)];
    // The skin sits below the rim and its rope: its height is the highest point well inside the rim.
    const skin = points.filter(p => Math.hypot(p.x - cx, p.z - cz) < r * 0.5);
    heads[id] = { cx, cz, y: top, skinY: skin.length ? Math.max(...skin.map(p => p.y)) : top, r };
  }
  return heads;
}

/**
 * Rings on the tabla's heads, one for each stroke where it is played (tablaMap.js): the rim for Na, inside it for
 * Tin, the black centre for Tun and Te, the bayan's open skin for Ge and its centre for Ke. The next stroke's ring
 * glows; a struck one flashes in its verdict's colour and fades.
 *
 * @param {Map<string, object[]>} drums the nodes of each drum, by its id (from the model's `drum-<id>-<n>` parts)
 * @returns {{ group: object[], resources: object, mark(ids: Set<string>, color: string): void, flash(id: string, color: string, strength: number, now?: number): void, update(now: number): boolean }}
 */
export function buildTablaZones(drums) {
  const heads = measureHeads(drums);
  const zones = new Map();
  const resources = { geometries: new Set(), materials: new Set() };
  for (const [id, place] of Object.entries(STROKE_PLACES)) {
    const head = heads[DRUM_OF[id]];
    if (!head) continue;
    const { inner, outer, centre: [u, v] } = place.zone;
    const geometry = new RingGeometry(Math.max(inner * head.r, 0.0001), outer * head.r, 48, 1);
    const material = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide });
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    // The rim's ring lies on the rim; the others on the skin inside it.
    mesh.position.set(head.cx + u * head.r, (outer > RIM_FROM ? head.y : head.skinY) + LIFT, head.cz + v * head.r);
    mesh.renderOrder = 2;
    mesh.name = `tabla-zone-${id}`;
    resources.geometries.add(geometry);
    resources.materials.add(material);
    zones.set(id, { mesh, material, next: false, nextColor: new Color(), flash: null });
  }
  const rest = zone => {
    zone.material.color.copy(zone.nextColor);
    zone.material.opacity = zone.next ? NEXT_OPACITY : 0;
  };
  return {
    group: [...zones.values()].map(zone => zone.mesh),
    resources,
    heads,
    mark(ids, color) {
      for (const [id, zone] of zones) {
        zone.next = ids.has(id);
        zone.nextColor.set(color);
        if (!zone.flash) rest(zone);
      }
    },
    flash(id, color, strength = 0.8, now = performance.now()) {
      const zone = zones.get(id);
      if (zone) zone.flash = { at: now, color: new Color(color), strength: Math.min(1, Math.max(0.3, strength)) };
    },
    /** Moves every flash on to `now`; true while one is still fading. */
    update(now) {
      let moving = false;
      for (const zone of zones.values()) {
        if (!zone.flash) continue;
        const age = (now - zone.flash.at) / FLASH_MS;
        if (age >= 1) { zone.flash = null; rest(zone); continue; }
        moving = true;
        zone.material.color.copy(zone.flash.color);
        zone.material.opacity = Math.max(zone.next ? NEXT_OPACITY : 0, FLASH_OPACITY * zone.flash.strength * (1 - age));
      }
      return moving;
    },
  };
}
