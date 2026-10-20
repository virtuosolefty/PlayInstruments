import { parseBeats, struckSet, struckStudy } from './struck.js';
import { noteName } from '../music/theory.js';

/**
 * The handpan: a D Aegean 18, the layout of the Ayasa instrument the player pointed us to. Two steel shells; on the
 * top, the ding (a raised dome) in the middle and ten tone fields round it, each a soft dimple with a dome in it; on
 * the underside, seven more and the gu, the hole the sound breathes through. Every field is one note, so the
 * handpan is played the way the drums are: one piece a note, struck and left to ring.
 *
 * The top notes sit on the middle row of the computer keyboard, low to high (A S D F G H J K L ; '), and the
 * underside's on the bottom row (Z X C V B N M).
 */

const TOP = [50, 54, 57, 61, 62, 66, 68, 69, 73, 74, 78]; // D3 ding, F#3 A3 C#4 D4 F#4 G#4 A4 C#5 D5 F#5
const BOTTOM = [47, 52, 56, 59, 64, 71, 76]; // B2 E3 G#3 B3 E4 B4 E5
const TOP_KEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"];
const BOTTOM_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

/** A note's id: its name in lower case, sharps as `s` (f#3 is `fs3`). */
const idOf = midi => noteName(midi).toLowerCase().replace('#', 's');

/**
 * Where each top field sits round the ding, as an angle in degrees: 0 toward the player, going round to the left.
 * Notes climb in a zig-zag, one each side in turn, from the player's side to the far side, as on most handpans.
 */
const TOP_ANGLES = Object.freeze([null, -18, 18, -54, 54, -90, 90, -126, 126, -162, 162]);
/** The underside's seven, evenly round the gu. */
const BOTTOM_ANGLES = Object.freeze(BOTTOM.map((_, i) => (i / BOTTOM.length) * 360));

const top = TOP.map((midi, i) => ({
  id: i === 0 ? 'ding' : idOf(midi), midi, key: TOP_KEYS[i], side: 'right', group: 'Top',
  short: noteName(midi), label: i === 0 ? `${noteName(midi)}, the ding` : `${noteName(midi)}, top field`, angle: TOP_ANGLES[i],
}));
const bottom = BOTTOM.map((midi, i) => ({
  id: `under-${idOf(midi)}`, midi, key: BOTTOM_KEYS[i], side: 'left', group: 'Underside',
  short: noteName(midi), label: `${noteName(midi)}, underside`, angle: BOTTOM_ANGLES[i],
}));

/** Highest first, as every other instrument's lanes are. */
export const HANDPAN = struckSet({
  id: 'handpan', composer: 'Handpan essentials', keyName: 'D Aegean', word: 'note',
  pieces: [...top, ...bottom].sort((a, b) => b.midi - a.midi),
  card: {
    eyebrow: 'HANDPAN · D AEGEAN 18',
    title: 'Eighteen notes, two rows of keys',
    intro: 'The top notes are on the middle row of keys, A to the apostrophe, low to high; the ding is A. The underside notes are on the bottom row, Z to M.',
    hint: 'Strike near the middle of a field and let it ring. Any controller plays too: these are ordinary notes.',
  },
  padsLabel: 'Handpan notes', lanesCaption: 'HANDPAN NOTES', testMidi: 50, pitched: true,
  legend: 'Blue ring: strike next · Blue tiles are top notes, amber the underside',
});

/** Notes for a lesson, as `D3 A3 - F#3`: a note name (or `ding`) strikes its top field; `u:B2` its underside one. */
const notes = token => {
  const under = token.startsWith('u:');
  const name = under ? token.slice(2) : token;
  if (name === 'ding') return { pieces: ['ding'], name: 'ding' };
  const id = idOf(nameToMidi(name));
  const piece = under ? `under-${id}` : id === 'd3' ? 'ding' : id;
  return { pieces: [piece], name };
};
const NAMES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function nameToMidi(name) {
  const [, letter, sharp, octave] = /^([A-G])(#?)(\d)$/.exec(name) ?? [];
  if (!letter) throw new Error(`handpan: not a note "${name}"`);
  return 12 * (Number(octave) + 1) + NAMES[letter] + (sharp ? 1 : 0);
}

const KEY = { tonic: 2, mode: 'major', name: 'D Aegean', confidence: 1 };
const handpanStudy = (id, title, description, text, { bpm = 72, beatsPerBar = 4, difficulty, easy } = {}) => {
  const { events, beats } = parseBeats(text, notes);
  return struckStudy(HANDPAN, { id, title, description, events, beats, bpm, beatsPerBar, key: KEY, difficulty, easy });
};

export const HANDPAN_STUDIES = [
  handpanStudy('meet-the-ding', 'Meet the ding',
    'The raised dome in the middle is the ding, the lowest note on top. Strike it once a beat and let it ring. Press A, or tap the middle.',
    'ding - ding - ding - ding -', { bpm: 66 }),
  handpanStudy('around-the-ding', 'Round the ding',
    'From the ding, round the circle: each note is the next one up, one side and then the other. Press A, S, D, F, G, H.',
    'ding F#3 A3 C#4 D4 F#4 - - D4 C#4 A3 F#3 ding - - -', { bpm: 66 }),
  handpanStudy('ding-and-fifth', 'Ding and fifth',
    'The ding and A3 answer each other: low, high, low, high. Keep the gaps even and let each note fade into the next.',
    'ding A3 ding A3 ding A3 D4 - ding A3 ding A3 ding A3 D4 -', { bpm: 72 }),
  handpanStudy('up-the-scale', 'Up the top row',
    'Every top note in order, low to high and back: A S D F G H J K L ; and the apostrophe. A two-octave D Lydian scale.',
    'ding F#3 A3 C#4 D4 F#4 G#4 A4 C#5 D5 F#5 - F#5 D5 C#5 A4 G#4 F#4 D4 C#4 A3 F#3 ding -', { bpm: 80 }),
  handpanStudy('groove-with-ding', 'A first groove',
    'Ding on the beat, two quick notes after it. This bounce is the pulse most handpan music rides on.',
    'ding A3+D4 ding A3+F#4 ding A3+D4 ding C#4+A4', { bpm: 70 }),
  handpanStudy('meet-the-underside', 'Under the shell',
    'The underside has seven more notes, deep and soft. Turn the handpan to see them, or press Z to M. B2 is the lowest note it has.',
    'u:B2 - u:E3 - u:G#3 - u:B3 - u:E4 - u:B4 - u:E5 - - -', { bpm: 66, difficulty: 2 }),
  handpanStudy('aegean-melody', 'An Aegean melody',
    'A short tune that climbs to the top of the pan and floats back down over the ding. Take it slowly first.',
    'ding A3 D4 F#4 A4 - G#4 F#4 D4 - C#4 D4 A3 - ding - ding F#3 A3 C#4 D4 F#4 D4 - C#4 A3 F#3 A3 ding - - -', { bpm: 76, difficulty: 2 }),
];

/** Tunes to play along to, open from the start: the handpan's answer to the other instruments' easy songs. */
export const HANDPAN_SONGS = [
  handpanStudy('heartbeat', 'Heartbeat', 'The ding twice, like a heartbeat, then a high note to answer.',
    'ding+ding - A4 - ding+ding - F#4 - ding+ding - A4 - ding+ding - D5 -', { bpm: 64, easy: true }),
  handpanStudy('rain', 'Rain on the shell', 'Quick notes falling from the top down, like rain on the steel.',
    'F#5+D5 C#5+A4 G#4+F#4 D4 F#5+D5 C#5+A4 G#4+F#4 D4 A4+F#4 D4+C#4 A3+F#3 ding - - - -', { bpm: 66, easy: true }),
  handpanStudy('lullaby', 'Aegean lullaby', 'A slow, rocking tune over the ding, for when the room is quiet.',
    'ding F#3 A3 F#3 ding F#3 A3 D4 ding F#3 A3 C#4 D4 - - - ding A3 F#4 D4 C#4 A3 F#3 A3 ding - - -', { bpm: 60, easy: true }),
  handpanStudy('deep-water', 'Deep water', 'The underside’s low B and E under the top notes, for a deeper sound.',
    'u:B2 D4 F#4 D4 u:E3 C#4 F#4 C#4 u:B2 D4 A4 D4 u:E3 ding - -', { bpm: 66, easy: true, difficulty: 2 }),
  handpanStudy('ocean', 'Ocean', 'Slow waves out from the ding and back, with a rest to let each one fade.',
    'ding - A3 - C#4 - A3 - ding - F#3 - A3 - - -', { bpm: 60, easy: true }),
  handpanStudy('stepping-stones', 'Stepping stones', 'Up three notes and down again, a little higher each time.',
    'D4 F#4 A4 F#4 D4 - C#4 F#4 G#4 F#4 C#4 - A3 D4 F#4 D4 ding - - -', { bpm: 72, easy: true }),
  handpanStudy('evening-star', 'Evening star', 'A tune that starts high on the far side of the pan and drifts down to the ding.',
    'A4 C#5 D5 F#5 D5 C#5 A4 - G#4 A4 F#4 D4 C#4 A3 ding -', { bpm: 70, easy: true, difficulty: 2 }),
  handpanStudy('bounce', 'Bounce', 'The ding on the beat and a quick double note after it, climbing.',
    'ding A3+A3 ding D4+D4 ding F#4+F#4 ding A4 -', { bpm: 72, easy: true }),
  handpanStudy('circle-song', 'Circle song', 'Once round the ding, low to high and back: the zig-zag every handpan player learns.',
    'ding F#3 A3 C#4 D4 C#4 A3 F#3 ding - ding F#3 A3 D4 F#4 D4 A3 F#3 ding - - -', { bpm: 72, easy: true }),
  handpanStudy('underneath', 'Underneath', 'The low underside notes carry the beat while the top answers.',
    'u:B2 u:E3 D4 F#4 u:B2 u:E3 C#4 F#4 u:B2 u:E3 D4 A4 u:B2 - ding -', { bpm: 66, easy: true, difficulty: 2 }),
];

export const HANDPAN_PATH_STAGES = [
  { id: 'ding', name: 'Meet the handpan', goal: 'Find the ding and the notes round it, and let each one ring.', exercises: ['handpan-meet-the-ding', 'handpan-around-the-ding'] },
  { id: 'pulse', name: 'Keep a pulse', goal: 'Answer the ding with a high note, evenly, then add a bounce.', exercises: ['handpan-ding-and-fifth', 'handpan-groove-with-ding'] },
  { id: 'range', name: 'Every note', goal: 'Climb the top row and find the notes underneath.', exercises: ['handpan-up-the-scale', 'handpan-meet-the-underside'] },
  { id: 'melody', name: 'A first melody', goal: 'Play a tune across the whole pan.', exercises: ['handpan-aegean-melody'] },
];
