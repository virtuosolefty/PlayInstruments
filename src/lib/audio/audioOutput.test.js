import { describe, expect, it } from 'vitest';
import { KNEE, LIMIT_DB, MASTER_GAIN, buildOutput, safety, safetyCurve } from './audioOutput.js';

describe('the output', () => {
  it('runs the master gain into a limiter, then a safety stage, then out', () => {
    const wires = [];
    class Node { constructor(value) { this.value = value; } connect(to) { wires.push([this.constructor.name, to.constructor?.name ?? 'out']); return this; } }
    class Limiter extends Node {}
    class Gain extends Node {}
    class WaveShaper extends Node {}
    const { master, limiter, safety: shaper } = buildOutput({ Limiter, Gain, WaveShaper }, {});
    expect(master.value).toBe(MASTER_GAIN);
    expect(limiter.value).toBe(LIMIT_DB);
    expect(shaper.oversample).toBe('4x');
    expect(wires).toEqual([['Gain', 'WaveShaper'], ['WaveShaper', 'Object'], ['Limiter', 'Gain'], ['Gain', 'Limiter']]);
  });

  it('leaves ordinary playing exactly as it is', () => {
    for (const x of [0, 0.1, -0.3, 0.5, -0.8, KNEE]) expect(safety(x)).toBe(x);
  });

  it('never lets a peak past full scale, and bends it smoothly', () => {
    for (const x of [0.9, 1, 1.35, 2, 4, -4]) expect(Math.abs(safety(x))).toBeLessThanOrEqual(1);
    expect(safety(1.35)).toBeGreaterThan(safety(1));
    const curve = safetyCurve();
    expect(Math.max(...curve.map(Math.abs))).toBeLessThanOrEqual(1);
    // The curve's middle point is silence, and it rises steadily.
    expect(curve[(curve.length - 1) / 2]).toBe(0);
    for (let i = 1; i < curve.length; i++) expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1]);
  });
});
