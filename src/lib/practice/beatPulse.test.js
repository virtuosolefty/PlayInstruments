import { describe, expect, it, vi } from 'vitest';
import { beatPulse, OFFBEAT, paintBeatPulse, PULSE_LENGTH } from './beatPulse.js';

const score = { bpm: 60, timeSignature: [4, 4] }; // one beat a second

describe('beatPulse', () => {
  it('is full on a downbeat and weaker on the other beats', () => {
    expect(beatPulse(0, score, { countIn: true })).toBeCloseTo(1);
    expect(beatPulse(1, score, { countIn: true })).toBeCloseTo(OFFBEAT);
    expect(beatPulse(4, score, { metronome: true, playing: true })).toBeCloseTo(1);
  });

  it('fades over the first part of the beat and is dark for the rest', () => {
    expect(beatPulse(PULSE_LENGTH / 2, score, { countIn: true })).toBeCloseTo(0.5);
    expect(beatPulse(0.5, score, { countIn: true })).toBe(0);
  });

  it('counts the bar through the count-in, before the piece starts', () => {
    expect(beatPulse(-4, score, { countIn: true })).toBeCloseTo(1);
    expect(beatPulse(-3, score, { countIn: true })).toBeCloseTo(OFFBEAT);
  });

  it('stays dark without a count-in or a running metronome, and for reduced motion', () => {
    expect(beatPulse(0, score, {})).toBe(0);
    expect(beatPulse(0, score, { metronome: true, playing: false })).toBe(0);
    expect(beatPulse(0, score, { countIn: true, calm: true })).toBe(0);
    expect(beatPulse(0, null, { countIn: true })).toBe(0);
  });
});

describe('paintBeatPulse', () => {
  it('draws nothing at zero and a line when lit', () => {
    const ctx = { save: vi.fn(), restore: vi.fn(), createLinearGradient: () => ({ addColorStop() {} }), fillRect: vi.fn(), beginPath() {}, moveTo() {}, lineTo() {}, stroke: vi.fn() };
    paintBeatPulse(ctx, { pulse: 0, from: { x: 0, y: 10 }, to: { x: 100, y: 10 }, colour: '#fff' });
    expect(ctx.stroke).not.toHaveBeenCalled();
    paintBeatPulse(ctx, { pulse: 1, from: { x: 0, y: 10 }, to: { x: 100, y: 10 }, colour: '#fff' });
    expect(ctx.stroke).toHaveBeenCalledOnce();
    expect(ctx.fillRect).toHaveBeenCalledOnce();
  });

  it('glows to the right of an upright line, where the string tab notes come from', () => {
    const ctx = { save() {}, restore() {}, createLinearGradient: () => ({ addColorStop() {} }), fillRect: vi.fn(), beginPath() {}, moveTo() {}, lineTo() {}, stroke() {} };
    paintBeatPulse(ctx, { pulse: 1, from: { x: 100, y: 24 }, to: { x: 100, y: 200 }, colour: '#fff', glow: 26 });
    expect(ctx.fillRect).toHaveBeenCalledWith(100, 24, 26, 176);
  });
});
