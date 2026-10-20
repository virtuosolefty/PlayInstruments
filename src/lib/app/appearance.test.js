/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { appearanceFor, applyAppearance, chromeColour } from './appearance.js';

describe('appearanceFor', () => {
  it('defaults to ivory and standard text, and falls back on values it does not know', () => {
    expect(appearanceFor({ theme: 'dark' })).toEqual({ theme: 'dark', accent: 'ivory', black: false, text: 'standard' });
    expect(appearanceFor({ theme: 'sepia', darkAccent: 'teal', textSize: 'huge' })).toEqual({ theme: 'light', accent: 'ivory', black: false, text: 'standard' });
  });

  it('only makes the page black in the dark theme', () => {
    expect(appearanceFor({ theme: 'dark', trueBlack: true }).black).toBe(true);
    expect(appearanceFor({ theme: 'light', trueBlack: true }).black).toBe(false);
  });
});

describe('applyAppearance', () => {
  it('sets and clears the root attributes the tokens key on', () => {
    const root = document.documentElement;
    document.head.innerHTML = '<meta name="theme-color" content="#fff" media="(prefers-color-scheme: light)">';
    applyAppearance(root, appearanceFor({ theme: 'dark', darkAccent: 'copper', trueBlack: true, textSize: 'large' }));
    expect({ ...root.dataset }).toEqual({ theme: 'dark', accent: 'copper', black: '', text: 'large' });
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#000000');
    expect(document.querySelector('meta[name="theme-color"]').hasAttribute('media')).toBe(false);
    applyAppearance(root, appearanceFor({ theme: 'light', darkAccent: 'violet' }));
    expect({ ...root.dataset }).toEqual({ theme: 'light' });
    expect(chromeColour({ theme: 'dark', black: false })).toBe('#0b0b10');
  });
});
