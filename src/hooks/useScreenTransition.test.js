import { describe, expect, it } from 'vitest';
import { canTransition, screenChanged } from './useScreenTransition.js';

describe('screenChanged', () => {
  it('is true only when the learning view moves', () => {
    expect(screenChanged({ learningView: 'home' }, { learningView: 'lesson' })).toBe(true);
    expect(screenChanged({ learningView: 'studio', rate: 1 }, { learningView: 'studio', rate: 0.8 })).toBe(false);
    expect(screenChanged({}, { learningView: 'studio' })).toBe(false);
  });
});

describe('canTransition', () => {
  it('needs the API and a visible page', () => {
    expect(canTransition({ visibilityState: 'visible' })).toBe(false);
    expect(canTransition({ startViewTransition() {}, visibilityState: 'hidden' })).toBe(false);
    expect(canTransition({ startViewTransition() {}, visibilityState: 'visible' })).toBe(true);
  });
});

