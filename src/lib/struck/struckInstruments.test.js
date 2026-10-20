import { describe, expect, it } from 'vitest';
import { parseBeats, struckSet, struckStudy } from './struck.js';
import { struckSetFor, isStruck, STRUCK } from './struckSets.js';
import { TABLA, TABLA_PATH_STAGES, TABLA_SONGS, TABLA_STUDIES } from './tabla.js';
import { HANDPAN, HANDPAN_PATH_STAGES, HANDPAN_SONGS, HANDPAN_STUDIES } from './handpan.js';
import { buildTablaVoice } from './tablaVoice.js';
import { buildHandpan } from './handpanModel.js';
import { noteName } from '../music/theory.js';
import { playedMidi } from '../../hooks/usePracticeEngine.js';

describe('a struck set', () => {
  const set = struckSet({ id: 'test', pieces: [
    { id: 'hi', short: 'Hi', label: 'High', midi: 70, key: 'h', side: 'right' },
    { id: 'lo', short: 'Lo', label: 'Low', midi: 40, key: 'l', side: 'left' },
  ], aliases: { 41: 'lo' } });

  it('finds a piece by id, note, alias and key', () => {
    expect(set.piece('hi').midi).toBe(70);
    expect(set.forMidi(41).id).toBe('lo');
    expect(set.canonical(41)).toBe(40);
    expect(set.canonical(12)).toBeNull();
    expect(set.keys).toEqual({ h: 70, l: 40 });
    expect(set.instruction({ midi: 70 })).toBe('Hi · press H');
  });

  it('reads beats as text: a dash rests, a plus splits a beat', () => {
    const { events, beats } = parseBeats('a - b+c | d', token => ({ pieces: [token], name: token }));
    expect(beats).toBe(4);
    expect(events.map(e => [e.beat, e.name])).toEqual([[0, 'a'], [2, 'b'], [2.5, 'c'], [3, 'd']]);
  });

  it('turns beats into a score the matcher and history understand', () => {
    const study = struckStudy(set, { id: 'one', title: 'One', description: '', bpm: 60, beats: 2, events: [{ beat: 0, pieces: ['lo', 'hi'] }, { beat: 1, pieces: ['hi'] }] });
    expect(study.id).toBe('test-one');
    expect(study.instrument).toBe('test');
    expect(study.duration).toBe(2);
    // Two pieces on one beat sound together, top lane first.
    expect(study.notes.map(n => [n.time, n.midi])).toEqual([[0, 70], [0, 40], [1, 70]]);
    expect(study.notes[1].hand).toBe('left');
    expect(() => struckStudy(set, { id: 'bad', beats: 1, events: [{ beat: 0, pieces: ['none'] }] })).toThrow(/no piece called "none"/);
  });
});

describe('the struck instruments', () => {
  it('are the drums, the tabla and the handpan, each with its set', () => {
    expect(STRUCK).toEqual(['drums', 'tabla', 'handpan']);
    expect(isStruck('tabla')).toBe(true);
    expect(isStruck('guitar')).toBe(false);
    expect(struckSetFor('handpan')).toBe(HANDPAN);
    expect(struckSetFor('drums').forMidi(38).id).toBe('snare');
  });

  it('take a controller’s note as the piece it means, and nothing else as anything', () => {
    expect(playedMidi({ practiceInstrument: 'tabla' }, 62)).toBe(62);
    expect(playedMidi({ practiceInstrument: 'drums' }, 40)).toBe(38);
    expect(playedMidi({ practiceInstrument: 'guitar', inputTranspose: 2 }, 60)).toBe(62);
  });

  for (const [set, lessons, songs, stages] of [[TABLA, TABLA_STUDIES, TABLA_SONGS, TABLA_PATH_STAGES], [HANDPAN, HANDPAN_STUDIES, HANDPAN_SONGS, HANDPAN_PATH_STAGES]]) {
    it(`${set.id}: every piece its own note and key, every study playable, ten songs`, () => {
      expect(new Set(set.pieces.map(p => p.midi)).size).toBe(set.pieces.length);
      expect(new Set(set.pieces.map(p => p.key)).size).toBe(set.pieces.length);
      expect(songs).toHaveLength(10);
      for (const study of [...lessons, ...songs]) {
        expect(study.id.startsWith(`${set.id}-`), study.id).toBe(true);
        expect(study.notes.length, study.id).toBeGreaterThan(0);
        expect(study.notes.every(n => set.forMidi(n.midi)), study.id).toBe(true);
        expect(study.duration, study.id).toBeGreaterThan(study.notes.at(-1).time);
      }
      for (const stage of stages) for (const id of stage.exercises) expect(lessons.some(l => l.id === id), id).toBe(true);
    });
  }
});

describe('the tabla', () => {
  it('plays Dha as Na and Ge together, and names the bol', () => {
    const dha = TABLA_STUDIES.find(s => s.id === 'tabla-dha-both-hands');
    const first = dha.notes.filter(n => n.time === 0);
    expect(first.map(n => n.piece).sort()).toEqual(['ge', 'na']);
    expect(TABLA.upNext(first)).toBe('Dha · Na + Ge · press N + G');
    expect(TABLA.upNext([{ midi: 48, stroke: 'Ge' }])).toBe('Ge · press G');
  });

  it('writes Teentaal as sixteen beats with its empty third group', () => {
    const teentaal = TABLA_STUDIES.find(s => s.id === 'tabla-teentaal');
    const beat = 60 / teentaal.bpm;
    expect(teentaal.duration).toBeCloseTo(16 * beat);
    const khali = teentaal.notes.filter(n => n.time >= 8 * beat - 1e-6 && n.time < 12 * beat - 1e-6);
    // Dha Tin Tin Ta: one bayan stroke (the Dha), the rest on the dayan.
    expect(khali.filter(n => n.piece === 'ge')).toHaveLength(1);
  });

  it('has a sound for every stroke', () => {
    const calls = [];
    class Node { constructor(options) { this.options = options; } connect() { return this; } dispose() {} triggerAttackRelease(...args) { calls.push(this.options?.label); } }
    const Tone = { Gain: Node, Filter: Node, NoiseSynth: Node, MembraneSynth: Node, Synth: Node, PolySynth: class extends Node { constructor(_v, options) { super(options); } }, Frequency: name => ({ toMidi: () => Number(name) }) };
    const voice = buildTablaVoice(Tone, {});
    for (const piece of TABLA.pieces) {
      const before = calls.length;
      voice.triggerAttackRelease(String(piece.midi), 0.1, 1, 0.8);
      expect(calls.length, piece.id).toBeGreaterThan(before);
    }
  });
});

describe('the handpan', () => {
  it('is a D Aegean 18: the ding D3, ten notes round it, seven underneath', () => {
    const top = HANDPAN.pieces.filter(p => p.group === 'Top').sort((a, b) => a.midi - b.midi);
    const under = HANDPAN.pieces.filter(p => p.group === 'Underside').sort((a, b) => a.midi - b.midi);
    expect(top.map(p => noteName(p.midi))).toEqual(['D3', 'F#3', 'A3', 'C#4', 'D4', 'F#4', 'G#4', 'A4', 'C#5', 'D5', 'F#5']);
    expect(under.map(p => noteName(p.midi))).toEqual(['B2', 'E3', 'G#3', 'B3', 'E4', 'B4', 'E5']);
    expect(top[0].id).toBe('ding');
    expect(top.map(p => p.key).join('')).toBe("asdfghjkl;'");
    expect(under.map(p => p.key).join('')).toBe('zxcvbnm');
  });

  it('builds a field for every note, the underside ones under the rim', () => {
    const pan = buildHandpan();
    expect(pan.pieces.size).toBe(18);
    for (const piece of HANDPAN.pieces) {
      const field = pan.pieces.get(piece.id);
      expect(field.root.position.y < 0, piece.id).toBe(piece.group === 'Underside');
      expect(field.ring.visible).toBe(false);
    }
    expect(pan.pieces.get('ding').root.position.x).toBe(0);
    expect(new Set(pan.targets.map(t => t.userData.piece)).size).toBe(18);
  });
});
