import { describe, expect, it } from 'vitest';
import { EASY_TUNES, pianoTune } from '../music/easySongs.js';
import { dailySet, pathState } from './path.js';
import { GUITAR_PATH_STAGES, GUITAR_STUDIES, GUITAR_SONGS } from '../strings/guitar.js';
import { lessonOutcome, lessonPurpose, beginnerFoundation, recommendedLesson } from './learning.js';
import { BOWED } from '../strings/bowed.js';
import { FRETTED } from '../strings/fretted.js';
import { DRUM_BEATS } from '../struck/drums.js';
import { noteInstruction } from './learning.js';

describe('beginner improvements', () => {
  it('ends a new daily sequence with an open tune for enjoyment', () => {
    const state = pathState(() => [], GUITAR_PATH_STAGES);
    const library = [...GUITAR_STUDIES, ...GUITAR_SONGS];
    const set = dailySet(state, { library });
    expect(set.at(-1)).toMatchObject({ kind: 'enjoyment' });
    expect(library.find(song => song.id === set.at(-1).songId).easy).toBe(true);
    expect(new Set(set.map(item => item.songId)).size).toBe(set.length);
  });
  it('explains the violin high third finger and introduces drum coordination gradually', () => {
    const song = BOWED.violin.studies.find(song => song.id === 'violin-happy-birthday');
    const high = song.notes.find(note => note.fret === 6);
    expect(noteInstruction(high, 'violin')).toMatch(/high.*3/i);
    expect(DRUM_BEATS.findIndex(song => song.id === 'drums-one-drop')).toBeLessThan(DRUM_BEATS.findIndex(song => song.id === 'drums-four-on-the-snare'));
  });
  it('teaches long notes before half beats, with explicit fingering for every piano tune', () => {
    expect(EASY_TUNES[0].id).toBe('au-clair-de-la-lune');
    for (const tune of EASY_TUNES) {
      expect(pianoTune(tune).notes.every(n => n.finger >= 1 && n.finger <= 5), tune.id).toBe(true);
    }
    expect(pianoTune(EASY_TUNES.find(t => t.id === 'london-bridge')).handChanges.length).toBeGreaterThan(0);
  });

  it('reviews a finished guided lesson without requiring mastery stars', () => {
    const state = pathState(id => id === 'guitar-open-strings' ? [{ stars: 5, rate: .65, mode: 'wait' }] : [], GUITAR_PATH_STAGES);
    const set = dailySet(state, { library: GUITAR_STUDIES, dayKey: '2026-10-12' });
    expect(set[0]).toMatchObject({ kind: 'warmup', songId: 'guitar-open-strings' });
    expect(set[0].why).toMatch(/finished|familiar/i);
  });
  it('does not lock returning users out when a bridge lesson is inserted', () => {
    const state = pathState(id => ['guitar-open-strings','guitar-first-frets','guitar-c-major','guitar-first-em'].includes(id) ? [{ stars: 5, rate: .65, mode: 'wait' }] : [], GUITAR_PATH_STAGES);
    expect(state.exercises['guitar-first-am'].unlocked).toBe(true);
    expect(state.currentId).toBe('guitar-first-am');
    expect(recommendedLesson(state)).toBe('guitar-first-am');
    expect(state.exercises['guitar-string-crossings']).toMatchObject({ unlocked: true, finished: false, passed: false });
  });

  it('introduces string crossings before full scales on every string instrument', () => {
    for (const stages of [GUITAR_PATH_STAGES, FRETTED.bass.pathStages, BOWED.violin.pathStages, BOWED.cello.pathStages]) {
      const ids = stages.flatMap(s => s.exercises);
      expect(ids.findIndex(id => id.endsWith('string-crossings'))).toBeGreaterThan(0);
      expect(ids.findIndex(id => id.endsWith('string-crossings'))).toBeLessThan(ids.findIndex(id => /major/.test(id)));
    }
  });

  it('connects every lesson goal to its previous skill and gives physical preparation separately', () => {
    const lesson = GUITAR_STUDIES.find(s => s.id === 'guitar-first-frets');
    const purpose = lessonPurpose(lesson, GUITAR_PATH_STAGES, GUITAR_STUDIES);
    expect(purpose.goal).toBeTruthy();
    expect(purpose.why).toMatch(/open string/i);
    expect(beginnerFoundation('violin').join(' ')).toMatch(/bow|shoulder/);
    expect(beginnerFoundation('piano').join(' ')).toMatch(/middle C/);
  });

  it('gives a specific note correction without blaming rhythm or awarding guided stars', () => {
    const outcome = lessonOutcome({ mode: 'wait', rate: .65, grade: { complete: true, stars: 3 }, summary: { hit: 8, missed: 0, wrongNotes: 4 } });
    expect(outcome.strength).toMatch(/8/);
    expect(outcome.nextAction).toMatch(/4|note/);
    expect(outcome.nextAction).not.toMatch(/rhythm/);
    expect(outcome.kind).toBe('guided');
  });
});
