import { describe, expect, it } from 'vitest';
import { HANDPAN } from './handpan.js';
import { beatHz, buildHandpanVoice, ringSeconds, sympathetic } from './handpanVoice.js';

/** A stand-in for Tone that records every partial: its frequency, when it starts, its level and how fast it falls. */
function fakeTone() {
  const partials = [], thuds = [];
  const param = () => {
    const p = { ramps: [] };
    p.setValueAtTime = () => p;
    p.linearRampToValueAtTime = (value, time) => { p.peak = value; p.peakAt = time; return p; };
    p.setTargetAtTime = (value, time, constant) => { p.ramps.push({ value, time, constant }); return p; };
    p.cancelScheduledValues = () => { p.cancelled = true; return p; };
    return p;
  };
  class Node { constructor(options) { this.options = options; this.disposed = false; } connect(to) { this.to = to; return this; } dispose() { this.disposed = true; } }
  class Gain extends Node { constructor(v) { super(v); this.gain = param(); } }
  class Oscillator extends Node {
    constructor(options) { super(options); partials.push(this); }
    start(time) { this.startAt = time; return this; }
    stop(time) { this.stopAt = time; return this; }
  }
  class NoiseSynth extends Node { triggerAttackRelease(duration, time, velocity) { thuds.push({ time, velocity }); } }
  const Frequency = name => {
    const midi = Number(name);
    return { toMidi: () => midi, toFrequency: () => 440 * 2 ** ((midi - 69) / 12) };
  };
  return { Tone: { Gain, Oscillator, Filter: Node, NoiseSynth, Frequency, now: () => 0 }, partials, thuds };
}

const D3 = 50;
const hz = midi => 440 * 2 ** ((midi - 69) / 12);

describe('the handpan voice', () => {
  it('sounds each note three ways at once: the note, its octave and its twelfth, with a strike', () => {
    const { Tone, partials, thuds } = fakeTone();
    buildHandpanVoice(Tone, {}).triggerAttack(String(D3), 1, 0.8);
    const near = (f, ratio) => partials.find(p => Math.abs(p.options.frequency / (f * ratio) - 1) < 0.002 && p.startAt === 1);
    const note = near(hz(D3), 1), octave = near(hz(D3), 2), twelfth = near(hz(D3), 3);
    expect(note && octave && twelfth).toBeTruthy();
    expect(thuds).toHaveLength(1);
    // The note leads; the octave is quieter, the twelfth quieter still.
    const level = osc => osc.to.gain.peak;
    expect(level(note)).toBeGreaterThan(level(octave));
    expect(level(octave)).toBeGreaterThan(level(twelfth));
    // The octave is tuned a hair wide, as tuners do.
    expect(octave.options.frequency).toBeGreaterThan(2 * hz(D3));
  });

  it('lets the overtones die first and the note ring on for seconds, longer the lower it is', () => {
    const { Tone, partials } = fakeTone();
    buildHandpanVoice(Tone, {}).triggerAttack(String(D3), 0, 0.8);
    const lasts = ratio => partials.find(p => Math.abs(p.options.frequency / (hz(D3) * ratio) - 1) < 0.002).stopAt;
    expect(lasts(1)).toBeGreaterThan(5);
    expect(lasts(1)).toBeGreaterThan(lasts(2));
    expect(lasts(2)).toBeGreaterThan(lasts(3));
    expect(ringSeconds(hz(50))).toBeGreaterThan(ringSeconds(hz(78)));
    expect(ringSeconds(hz(78))).toBeGreaterThanOrEqual(2.4);
  });

  it('shimmers: a twin of the note a beat apart, slow', () => {
    const { Tone, partials } = fakeTone();
    buildHandpanVoice(Tone, {}).triggerAttack(String(D3), 0, 0.8);
    const twin = partials.find(p => Math.abs(p.options.frequency - (hz(D3) + beatHz(hz(D3)))) < 1e-6);
    expect(twin).toBeTruthy();
    expect(beatHz(hz(D3))).toBeGreaterThan(0.4);
    expect(beatHz(hz(D3))).toBeLessThan(2);
  });

  it('rings the fields tuned to the note’s octave and twelfth along with it, and only those', () => {
    // The ding, D3: D4 an octave up and A4 a twelfth up are on the pan.
    expect(sympathetic(D3).sort()).toEqual([62, 69]);
    for (const piece of HANDPAN.pieces) for (const other of sympathetic(piece.midi)) expect(HANDPAN.forMidi(other)).toBeTruthy();
  });

  it('rings on when the key is let go, and stops when it is damped', () => {
    const { Tone, partials } = fakeTone();
    const voice = buildHandpanVoice(Tone, {});
    voice.triggerAttack(String(D3), 0, 0.8);
    const stops = partials.map(p => p.stopAt);
    voice.triggerRelease(String(D3), 0.1);
    expect(partials.map(p => p.stopAt)).toEqual(stops);
    voice.releaseAll();
    expect(partials.every(p => p.stopAt <= 0.2)).toBe(true);
  });

  it('lets go of partials that have died away when the next note is struck', () => {
    const { Tone, partials } = fakeTone();
    let now = 0;
    Tone.now = () => now;
    const voice = buildHandpanVoice(Tone, {});
    voice.triggerAttack(String(78), 0, 0.8);
    const first = [...partials];
    now = 30;
    voice.triggerAttack(String(78), 30, 0.8);
    expect(first.every(p => p.disposed)).toBe(true);
  });
});
