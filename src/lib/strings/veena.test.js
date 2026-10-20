import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FRETTED, VEENA_TUNING, frettedMidi, veenaSwara } from './fretted.js';
import { fretX } from './guitarNeck.js';
import { instrumentInfo, stringKit } from '../instruments.js';
import { noteInstruction } from '../learning/learning.js';
import { keyPitchClassSet, noteName } from '../music/theory.js';

const veena = FRETTED.veena;
const fit = JSON.parse(readFileSync('public/models/veena.json', 'utf8'));

describe('the veena', () => {
  it('is tuned Pa Sa Pa Sa with Sa on D, the sarani highest', () => {
    expect(VEENA_TUNING.map(noteName)).toEqual(['A1', 'D2', 'A2', 'D3']);
    expect(VEENA_TUNING.map(veenaSwara)).toEqual(['Pa', 'Sa', 'Pa', 'Sa']);
    expect(frettedMidi('veena', 3, 12)).toBe(62);
    expect(stringKit('veena')).toMatchObject({ fretted: true, stage: 'model', model: 'veena', tuningLabel: 'Sa on D' });
    expect(instrumentInfo('veena').label).toBe('Veena');
  });

  it('starts in Mayamalavagowla, and knows its swaras are in the raga', () => {
    const sarali = veena.lessons.find(l => l.id === 'veena-sarali-1');
    expect(sarali.key.name).toBe('Mayamalavagowla on D');
    expect(sarali.notes.slice(0, 8).map(n => veenaSwara(n.midi))).toEqual(['Sa', 'Ri', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'Sa']);
    expect(sarali.notes.slice(0, 8).map(n => n.fret)).toEqual([0, 1, 4, 5, 7, 8, 11, 12]);
    const raga = keyPitchClassSet(2, 'mayamalavagowla');
    for (const lesson of veena.lessons.filter(l => l.key.mode === 'mayamalavagowla')) {
      expect(lesson.notes.every(n => raga.has(n.midi % 12)), lesson.id).toBe(true);
    }
  });

  it('names a note by its swara first, and slides one finger along the frets', () => {
    const note = veena.lessons.find(l => l.id === 'veena-sa-pa').notes[1];
    expect(noteInstruction(note, 'veena')).toBe('Pa · A3 · string 1 · fret 7 · finger 1');
    expect(veena.lessons.flatMap(l => l.notes).every(n => n.finger === (n.fret === 0 ? 0 : 1))).toBe(true);
  });

  it('has seven lessons on its path, and the ten songs in D within its frets', () => {
    expect(veena.lessons).toHaveLength(7);
    expect(veena.songs).toHaveLength(10);
    for (const stage of veena.pathStages) for (const id of stage.exercises) expect(veena.lessons.some(l => l.id === id), id).toBe(true);
    for (const song of veena.songs) {
      expect(song.key.tonic, song.id).toBe(2);
      expect(song.notes.every(n => n.fret >= 0 && n.fret <= 12 && n.midi === frettedMidi('veena', n.string, n.fret)), song.id).toBe(true);
    }
  });
});

describe('the veena model', () => {
  it('has four playing strings, the highest nearest the player', () => {
    expect(fit.strings).toHaveLength(4);
    const across = fit.strings.map(s => s.nut[2]);
    expect([...across].sort((a, b) => a - b)).toEqual(across);
  });

  it('has its frets moved to where the stage plays them', () => {
    expect(fit.frets.length).toBeGreaterThanOrEqual(12);
    fit.frets.forEach((x, i) => expect(x, `fret ${i + 1}`).toBeCloseTo(fretX(i + 1), 2));
  });
});
