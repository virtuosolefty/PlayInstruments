import { describe, expect, it } from 'vitest';
import { PLUCK_MS, soundFor, techniqueFor, voiceFor, withTechnique } from './technique.js';
import { setShownModel, shownModel } from '../stage/shownModel.js';

describe('bow or fingers', () => {
  it('is the bow until the fingers are chosen, for each bowed instrument on its own', () => {
    expect(techniqueFor({}, 'cello')).toBe('bow');
    const plucked = withTechnique({ theme: 'dark' }, 'cello', 'fingers');
    expect(techniqueFor(plucked, 'cello')).toBe('fingers');
    expect(techniqueFor(plucked, 'violin')).toBe('bow');
    expect(plucked.theme).toBe('dark');
    expect(techniqueFor(withTechnique(plucked, 'cello', 'nonsense'), 'cello')).toBe('bow');
  });

  it('has no choice for an instrument that is not bowed', () => {
    expect(techniqueFor({ bowedTechnique: { guitar: 'fingers' } }, 'guitar')).toBe('bow');
  });

  it('plays a plucked cello or violin on its own voice, everything else on the instrument’s', () => {
    expect(voiceFor('cello', 'fingers')).toBe('cello-pizz');
    expect(voiceFor('violin', 'fingers')).toBe('violin-pizz');
    expect(voiceFor('cello', 'bow')).toBe('cello');
    expect(voiceFor('guitar', 'fingers')).toBe('guitar');
    expect(PLUCK_MS.cello).toBeGreaterThan(PLUCK_MS.violin);
  });
});

describe('what is heard is what is seen', () => {
  it('plays a model shown in the whole-instrument view on its own voice', () => {
    expect(soundFor('guitar', 'bow', null)).toEqual({ voice: 'guitar', transpose: 0 });
    // The bass guitar answers to the guitar's strings of the same name, an octave below them.
    expect(soundFor('guitar', 'bow', 'guitar-bass')).toEqual({ voice: 'bass', transpose: -12 });
    expect(soundFor('violin', 'bow', 'violin-electric')).toEqual({ voice: 'violin-electric', transpose: 0 });
    expect(soundFor('drums', 'bow', 'drums-electronic')).toEqual({ voice: 'drums-electronic', transpose: 0 });
  });

  it('keeps the instrument practised where the model shown sounds the same, or the violin is plucked', () => {
    expect(soundFor('cello', 'bow', 'cello-antique')).toEqual({ voice: 'cello', transpose: 0 });
    expect(soundFor('piano', 'bow', 'piano-grand')).toEqual({ voice: 'piano', transpose: 0 });
    expect(soundFor('drums', 'bow', 'drums-acoustic')).toEqual({ voice: 'drums', transpose: 0 });
    expect(soundFor('violin', 'fingers', 'violin-electric')).toEqual({ voice: 'violin-pizz', transpose: 0 });
  });

  it('remembers the model shown until it is put away', () => {
    setShownModel('guitar-bass');
    expect(shownModel()).toBe('guitar-bass');
    setShownModel(undefined);
    expect(shownModel()).toBeNull();
  });
});
