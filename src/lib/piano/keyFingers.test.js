import { describe, expect, it } from 'vitest';
import { fingersSignature, keyFingers } from './keyFingers.js';

const notes = [
  { midi: 60, time: 0, duration: 0.5, finger: 1, hand: 'right' },
  { midi: 62, time: 0.5, duration: 0.5, finger: 2, hand: 'right' },
  { midi: 60, time: 1, duration: 0.5, finger: 3, hand: 'right' },
  { midi: 48, time: 1, duration: 0.5, finger: 5, hand: 'left' },
  { midi: 64, time: 1.5, duration: 0.5 },
];

describe('the finger on each key', () => {
  it('shows the finger of the next note on a key', () => {
    expect(keyFingers(notes, 0).get(60)).toEqual({ finger: 1, hand: 'right' });
    expect(keyFingers(notes, 0.8).get(60)).toEqual({ finger: 3, hand: 'right' });
  });

  it('keeps the hand, and shows nothing where the score has no fingering', () => {
    expect(keyFingers(notes, 0).get(48)).toEqual({ finger: 5, hand: 'left' });
    expect(keyFingers(notes, 0).has(64)).toBe(false);
    expect(keyFingers(undefined).size).toBe(0);
  });

  it('drops a key once its last note has passed', () => {
    expect(keyFingers(notes, 1.2).has(62)).toBe(false);
  });

  it('gives one signature per set of numbers', () => {
    expect(fingersSignature(keyFingers(notes, 0))).toBe(fingersSignature(keyFingers(notes, 0.1)));
    expect(fingersSignature(keyFingers(notes, 0))).not.toBe(fingersSignature(keyFingers(notes, 0.8)));
  });
});
