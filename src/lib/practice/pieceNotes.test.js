import { describe, expect, it } from 'vitest';
import { actionLabel, cleanNote, MAX_NOTE, noteAction, withNote, withoutNote } from './pieceNotes.js';

const score = { bpm: 100, timeSignature: [4, 4], duration: 24 }; // 2.4 s a bar, 10 bars

describe('notes', () => {
  it('keeps one trimmed line of at most MAX_NOTE characters', () => {
    expect(cleanNote('  bar 5:\n  left hand  ')).toBe('bar 5: left hand');
    expect(cleanNote('x'.repeat(500))).toHaveLength(MAX_NOTE);
  });

  it('sets and removes a note without changing the old object', () => {
    const before = { a: { text: 'old', at: 't0' } };
    const after = withNote(before, 'b', ' new ', 't1');
    expect(after).toEqual({ a: { text: 'old', at: 't0' }, b: { text: 'new', at: 't1' } });
    expect(before).toEqual({ a: { text: 'old', at: 't0' } });
    expect(withNote(after, 'b', '   ')).toEqual({ a: { text: 'old', at: 't0' } });
    expect(withoutNote(after, 'a')).toEqual({ b: { text: 'new', at: 't1' } });
    expect(withoutNote(undefined, 'a')).toEqual({});
  });
});

describe('noteAction', () => {
  it('turns a bar and a tempo into a loop and a speed', () => {
    const a = noteAction('Bar 5: the left hand comes in early. Try it at 70 first.', score);
    expect(a.fromBar).toBe(5);
    expect(a.loop[0]).toBeCloseTo(9.6);
    expect(a.loop[1]).toBeCloseTo(12);
    expect(a.rate).toBeCloseTo(0.7);
    expect(actionLabel(a)).toBe('Loop bar 5 at 70 bpm');
  });

  it('reads a range of bars and a bpm written after the number', () => {
    const a = noteAction('bars 3-4 feel rushed, 80 bpm', score);
    expect([a.fromBar, a.toBar, a.bpm]).toEqual([3, 4, 80]);
    expect(actionLabel(a)).toBe('Loop bars 3–4 at 80 bpm');
  });

  it('keeps the tempo inside what the slider allows, and loops at the current tempo when none is named', () => {
    expect(noteAction('bar 2 at 20', score).rate).toBe(0.4);
    expect(noteAction('bar 2', score).rate).toBeNull();
    expect(actionLabel(noteAction('bar 2', score))).toBe('Loop bar 2');
  });

  it('offers nothing for a note without a bar, or a bar the piece does not have', () => {
    expect(noteAction('slow down', score)).toBeNull();
    expect(noteAction('bar 11', score)).toBeNull();
    expect(noteAction('bar 0', score)).toBeNull();
    expect(noteAction('bar 2', null)).toBeNull();
  });
});
