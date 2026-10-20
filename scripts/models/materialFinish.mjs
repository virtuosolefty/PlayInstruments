import { readFileSync } from 'node:fs';
import { Color } from 'three';

const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const floor = new Color(tokens.match(/--model-dark-material:\s*(#[\da-f]{6})/i)[1]);

/** Pure black cannot reflect the studio lights; keep plain dark finishes readable. */
export function liftDarkMaterial(material) {
  const pbr = material.pbrMetallicRoughness, color = pbr?.baseColorFactor;
  if (!color || pbr.baseColorTexture || material.alphaMode === 'BLEND' || color.slice(0, 3).some(value => value >= floor.r)) return material;
  return { ...material, pbrMetallicRoughness: { ...pbr, baseColorFactor: [floor.r, floor.g, floor.b, color[3]], roughnessFactor: Math.max(.3, pbr.roughnessFactor ?? .5) } };
}

/**
 * A recipe's own finish for the materials it names: `{ [name]: { color: [r, g, b] linear, metallic, roughness } }`.
 * For a model whose colours fight the rest of the stage, such as a teal kit beside the wine-red one built in code.
 */
export function retoneMaterial(material, finish) {
  const wanted = finish?.[material.name];
  if (!wanted) return material;
  const pbr = material.pbrMetallicRoughness ?? {};
  const alpha = pbr.baseColorFactor?.[3] ?? 1;
  return { ...material, pbrMetallicRoughness: { ...pbr, baseColorFactor: [...wanted.color, alpha], metallicFactor: wanted.metallic, roughnessFactor: wanted.roughness } };
}
