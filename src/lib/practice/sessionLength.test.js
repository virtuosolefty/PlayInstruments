import { describe, expect, it } from 'vitest';
import { itemMinutes, sessionMinutes } from './sessionLength.js';

describe('how long tonight takes', () => {
  it('counts a piece twice and a little between, in whole minutes', () => {
    expect(itemMinutes({ approxDuration: 27.9 })).toBe(1);
    expect(itemMinutes({ approxDuration: 58 })).toBe(2);
    expect(itemMinutes({ duration: 80 })).toBe(3);
  });

  it('never says less than a minute, even without a length', () => {
    expect(itemMinutes({})).toBe(1);
    expect(itemMinutes(undefined)).toBe(1);
  });

  it('adds the items up', () => {
    expect(sessionMinutes([{ approxDuration: 28 }, { approxDuration: 58 }, {}])).toBe(4);
    expect(sessionMinutes([])).toBe(0);
  });
});
