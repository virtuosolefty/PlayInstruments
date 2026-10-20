import { describe, expect, it } from 'vitest';
import { SphereGeometry } from 'three';
import { simplifyParts } from './simplify.mjs';

const part = name => {
  const g = new SphereGeometry(1, 64, 32);
  return { part: name, material: 2, positions: g.attributes.position.array, normals: g.attributes.normal.array, uvs: g.attributes.uv.array, indices: g.index.array };
};
describe('model simplification', () => {
  it('reduces a curved surface, keeping finite positions, normals, UVs and valid indices', async () => {
    const original = part('drum-snare-0');
    const [result] = await simplifyParts([original], { ratio: .3, error: .01 });
    expect(result.indices.length).toBeLessThan(original.indices.length * .6);
    expect(Math.max(...result.indices)).toBeLessThan(result.positions.length / 3);
    expect(result.normals.length).toBe(result.positions.length);
    expect(result.uvs.length).toBe(result.positions.length / 3 * 2);
    expect([...result.positions].every(Number.isFinite)).toBe(true);
    expect(result.part).toBe('drum-snare-0');
    expect(result.material).toBe(2);
  });
  it('keeps measured playable hardware and part boundaries intact', async () => {
    const strings = part('stringEnds'), frets = part('frets'), bridge = part('bridge');
    const output = await simplifyParts([strings, frets, bridge, part('drum-crash-0'), part('drum-crash-1')], { ratio: .3, error: .01 });
    expect(output.slice(0, 3)).toEqual([strings, frets, bridge]);
    expect(output.slice(3).map(p => p.part)).toEqual(['drum-crash-0', 'drum-crash-1']);
  });
});
