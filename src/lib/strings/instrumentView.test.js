import { describe, expect, it } from 'vitest';
import { visibleFrets } from './instrumentView.js';

describe('how many frets a fretted stage shows', () => {
  it('is first position on an upright phone and the whole neck elsewhere, until the player chooses', () => {
    expect(visibleFrets(undefined, true)).toBe(5);
    expect(visibleFrets(undefined, false)).toBe(12);
    expect(visibleFrets(12, true)).toBe(12);
    expect(visibleFrets(5, false)).toBe(5);
  });
});
