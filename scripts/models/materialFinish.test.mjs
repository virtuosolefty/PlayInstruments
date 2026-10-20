import { expect, it } from 'vitest';
import { liftDarkMaterial, retoneMaterial } from './materialFinish.mjs';
import { RECIPES } from './recipes.mjs';

it('makes untextured black surfaces reflect light while preserving other finishes and transparency', () => {
  expect(RECIPES['drums-electronic'].liftDarkMaterials).toBe(true);
  expect(RECIPES['violin-electric'].liftDarkMaterials).toBe(true);
  const black = { name: 'Rubber', pbrMetallicRoughness: { baseColorFactor: [0, 0, 0, 1], roughnessFactor: .5 } };
  expect(liftDarkMaterial(black).pbrMetallicRoughness.baseColorFactor[0]).toBeGreaterThan(0);
  expect(black.pbrMetallicRoughness.baseColorFactor[0]).toBe(0);
  expect(liftDarkMaterial({ ...black, alphaMode: 'BLEND' }).pbrMetallicRoughness).toBe(black.pbrMetallicRoughness);
  const textured = { pbrMetallicRoughness: { ...black.pbrMetallicRoughness, baseColorTexture: { index: 0 } } };
  expect(liftDarkMaterial(textured)).toBe(textured);
  const chrome = { pbrMetallicRoughness: { baseColorFactor: [.7, .7, .7, 1], metallicFactor: 1 } };
  expect(liftDarkMaterial(chrome)).toBe(chrome);
});

it('re-tones the materials a recipe names, keeping their opacity, and leaves the rest alone', () => {
  const shell = { name: 'Main_Color', pbrMetallicRoughness: { baseColorFactor: [.04, .11, .15, 1], metallicFactor: 0, roughnessFactor: 0 } };
  const finish = { Main_Color: { color: [.1, .006, .016], metallic: .2, roughness: .3 } };
  const toned = retoneMaterial(shell, finish);
  expect(toned.pbrMetallicRoughness).toMatchObject({ baseColorFactor: [.1, .006, .016, 1], metallicFactor: .2, roughnessFactor: .3 });
  expect(shell.pbrMetallicRoughness.baseColorFactor[0]).toBe(.04);
  const other = { name: 'Metal', pbrMetallicRoughness: { baseColorFactor: [.5, .5, .5, 1] } };
  expect(retoneMaterial(other, finish)).toBe(other);
  expect(retoneMaterial(shell, undefined)).toBe(shell);
  // The acoustic kit's teal shells become the stage kit's wine lacquer, its plain cymbals bronze, and its platform goes.
  const acoustic = RECIPES['drums-acoustic'];
  expect(Object.keys(acoustic.retone)).toEqual(expect.arrayContaining(['Main_Color']));
  expect(acoustic.omit('', 'Plane.001__0')).toBe(true);
  expect(acoustic.omit('Main_Color', 'Cylinder.002')).toBe(false);
});
