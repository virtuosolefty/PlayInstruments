import { describe, expect, it } from 'vitest';
import { changesScreen, parseRoute, routeHash } from './route.js';

describe('an address for every screen', () => {
  it('writes each screen, and reads it back', () => {
    const screens = [
      { view: 'home', instrument: 'piano', id: null, free: false },
      { view: 'lesson', instrument: 'guitar', id: 'guitar-open-strings', free: false },
      { view: 'studio', instrument: 'piano', id: 'path-01-home-five-right', free: false },
      { view: 'studio', instrument: 'drums', id: null, free: true },
      { view: 'library', instrument: 'violin', id: null, free: false },
    ];
    for (const screen of screens) expect(parseRoute(routeHash(screen))).toEqual(screen);
    expect(routeHash(screens[1])).toBe('#/lesson/guitar/guitar-open-strings');
    expect(routeHash(screens[3])).toBe('#/studio/drums/free');
  });

  it('keeps an id with unusual characters intact', () => {
    const screen = { view: 'studio', instrument: 'piano', id: 'my file (2).mid', free: false };
    expect(parseRoute(routeHash(screen))).toEqual(screen);
  });

  it('names no screen for an address it does not know', () => {
    for (const hash of ['', '#', '#/', '#/nowhere/piano', '#/studio/kazoo/x', '#/lesson/piano', '#/studio/piano/%E0%A4%A']) expect(parseRoute(hash)).toBeNull();
  });

  it('counts a change of screen, not of piece or instrument, as a step Back undoes', () => {
    const studio = { view: 'studio', instrument: 'piano', id: 'a' };
    expect(changesScreen(null, studio)).toBe(true);
    expect(changesScreen(studio, { ...studio, id: 'b', instrument: 'guitar' })).toBe(false);
    expect(changesScreen(studio, { ...studio, view: 'library' })).toBe(true);
  });
});
