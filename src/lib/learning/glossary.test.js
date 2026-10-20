import { describe, expect, it } from 'vitest';
import { cueLines, glossaryFor, splitTerms } from './glossary.js';

describe('the words a lesson explains', () => {
  it('marks a word the first time it appears, and keeps the text whole', () => {
    const text = 'Up 1-2-3-4-5, one note per beat. Keep the beat steady.';
    const parts = splitTerms(text, glossaryFor('piano'));
    expect(parts.map(p => p.text).join('')).toBe(text);
    expect(parts.filter(p => p.term === 'beat')).toHaveLength(1);
    expect(parts.find(p => p.term)?.text).toBe('beat');
  });

  it('gives an instrument its own meaning before the shared one', () => {
    const finger = instrument => glossaryFor(instrument).find(t => t.term === 'finger').meaning;
    expect(finger('piano')).toMatch(/thumb/);
    expect(finger('guitar')).toMatch(/index/);
    expect(glossaryFor('bass').find(t => t.term === 'string').meaning).toMatch(/\(4\)/);
  });

  it('prefers the longer word where two start together', () => {
    const parts = splitTerms('Pick the open string twice.', glossaryFor('guitar'));
    expect(parts.find(p => p.term)?.term).toBe('open string');
  });

  it('marks nothing in text without a glossary word', () => {
    expect(splitTerms('Take your time.', glossaryFor('drums'))).toEqual([{ text: 'Take your time.' }]);
    expect(splitTerms('', glossaryFor('drums'))).toEqual([]);
  });
});

describe('a description as cue lines', () => {
  it('gives one line per sentence', () => {
    expect(cueLines('Fingers 1–5 rest on C–G and stay there. Up 1-2-3-4-5, down 5-4-3-2-1. No finger leaves its key.'))
      .toEqual(['Fingers 1–5 rest on C–G and stay there.', 'Up 1-2-3-4-5, down 5-4-3-2-1.', 'No finger leaves its key.']);
    expect(cueLines(undefined)).toEqual([]);
  });
});
