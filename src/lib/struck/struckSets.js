import { DRUM_KEYS, DRUM_PIECES, canonicalDrumMidi, drumForMidi, drumInstruction, drumLanes, drumPiece } from './drums.js';
import { HANDPAN } from './handpan.js';
import { TABLA } from './tabla.js';

/**
 * Which instruments are played by striking, and the set (struck.js) each is played with. The drum kit keeps its own
 * module (drums.js), wrapped here in the same shape as the tabla's and the handpan's.
 */
const DRUMS = Object.freeze({
  id: 'drums', word: 'drum', composer: 'Drum essentials',
  pieces: Object.freeze(DRUM_PIECES.map(piece => Object.freeze({ ...piece, side: piece.limb === 'foot' ? 'left' : 'right' }))),
  piece: drumPiece, forMidi: drumForMidi, canonical: canonicalDrumMidi, keys: DRUM_KEYS, lanes: drumLanes,
  instruction: drumInstruction,
  upNext: notes => notes.map(drumInstruction).join('  +  '),
  noteNames: Object.freeze(Object.fromEntries(DRUM_PIECES.map(piece => [piece.midi, piece.short]))),
  card: {
    eyebrow: 'DRUM KIT',
    title: 'Nine pieces, nine keys',
    intro: 'Each drum is played by the letter it starts with. Hold a steady pulse on the kick, then answer it on the snare.',
    hint: 'A pad controller or an electronic kit plays too: it sends the standard drum notes, kick on 36 and snare on 38.',
  },
  // The studio and its exercise list say "Drum", as they always have, not "Drums".
  noun: 'Drum', padsLabel: 'Drum pads', lanesCaption: 'DRUM LANES', testMidi: 38,
});

const SETS = Object.freeze({ drums: DRUMS, tabla: TABLA, handpan: HANDPAN });

/** The struck instruments, in picker order. */
export const STRUCK = Object.freeze(Object.keys(SETS));
/** The set an instrument is struck with, or null when it is not struck. */
export const struckSetFor = instrument => SETS[instrument] ?? null;
export const isStruck = instrument => Object.hasOwn(SETS, instrument ?? '');
