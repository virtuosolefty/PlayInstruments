import { describe, expect, it } from 'vitest';
import { barCount, inspectBar, notesPerBar } from './barInspect.js';

// 60 bpm in 4/4: a bar is four seconds.
const score = {
  bpm: 60, timeSignature: [4, 4], duration: 12,
  notes: [
    { midi: 60, name: 'C4', time: 0, duration: 1, hand: 'right', finger: 1 },
    { midi: 62, name: 'D4', time: 1, duration: 1, hand: 'right', finger: 2 },
    { midi: 48, name: 'C3', time: 0, duration: 2, hand: 'left', finger: 5 },
    { midi: 64, name: 'E4', time: 4, duration: 1, hand: 'right', finger: 3 },
    { midi: 64, name: 'E4', time: 5, duration: 1, hand: 'right', finger: 3 },
    { midi: 67, name: 'G4', time: 8, duration: 1, hand: 'right' },
  ],
};

describe('one bar, inspected', () => {
  it('counts bars and the notes starting in each', () => {
    expect(barCount(score)).toBe(3);
    expect(notesPerBar(score)).toEqual([3, 2, 1]);
  });

  it('names the notes by hand, without repeating a held name, with their fingers', () => {
    const bar = inspectBar(score, 1);
    expect(bar.hands).toEqual([
      { hand: 'right', count: 2, names: ['C', 'D'], more: false, fingers: [1, 2] },
      { hand: 'left', count: 1, names: ['C'], more: false, fingers: [5] },
    ]);
    expect(inspectBar(score, 2).hands[0].names).toEqual(['E']);
    expect(inspectBar(score, 3).hands[0].fingers).toEqual([]);
  });

  it('adds up the slips recorded in that bar only', () => {
    const spots = [{ time: 4.5, missed: 1, wrong: 0, late: 2 }, { time: 5, missed: 0, wrong: 1, late: 0 }, { time: 9, missed: 4, wrong: 0, late: 0 }];
    expect(inspectBar(score, 2, spots).trouble).toEqual({ missed: 1, wrong: 1, late: 2 });
    expect(inspectBar(score, 1, spots).trouble).toEqual({ missed: 0, wrong: 0, late: 0 });
  });

  it('gives the bar its place in time', () => {
    expect(inspectBar(score, 2)).toMatchObject({ bar: 2, bars: 3, from: 4, to: 8, span: 4, count: 2 });
  });
});

describe('the note a click picked', () => {
  it('finds the note at that pitch nearest the click, in the bar only', async () => {
    const { noteNear } = await import('./barInspect.js');
    expect(noteNear(score, 2, { time: 5.2, midi: 64 })).toMatchObject({ time: 5, finger: 3 });
    expect(noteNear(score, 2, { time: 4.1, midi: 64 })).toMatchObject({ time: 4 });
    expect(noteNear(score, 1, { time: 0.5, midi: 64 })).toBeNull();
    expect(noteNear(score, 1, null)).toBeNull();
  });
});
