import { MeshoptSimplifier } from 'three/addons/libs/meshopt_simplifier.module.js';

// Measured hardware stays untouched; simplification never crosses material or playable-part boundaries.
const KEEP = new Set(['stringEnds', 'strings', 'frets', 'bridge', 'hardware']);

export async function simplifyParts(parts, options) {
  if (!options) return parts;
  await MeshoptSimplifier.ready;
  return parts.map(part => {
    if (KEEP.has(part.part) || part.indices.length < 384) return part;
    const target = Math.max(3, Math.floor(part.indices.length * options.ratio / 3) * 3);
    const [indices] = MeshoptSimplifier.simplify(part.indices, part.positions, 3, target, options.error, ['LockBorder']);
    const remap = new Map();
    const compact = Uint32Array.from(indices, index => {
      if (!remap.has(index)) remap.set(index, remap.size);
      return remap.get(index);
    });
    const copy = (array, stride) => array && Float32Array.from([...remap.keys()].flatMap(index => Array.from(array.subarray(index * stride, (index + 1) * stride))));
    return { ...part, indices: remap.size > 65535 ? compact : Uint16Array.from(compact), positions: copy(part.positions, 3), normals: copy(part.normals, 3), uvs: copy(part.uvs, 2), tangents: copy(part.tangents, 4) };
  });
}
