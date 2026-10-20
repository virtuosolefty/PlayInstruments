import { easyStudies } from '../music/easySongs.js';
import { noteName, pitchClass } from '../music/theory.js';

/**
 * fretted.js — the bass guitar and the veena: four strings each, with frets.
 *
 * They share the guitar's studio (GuitarWorkspace.jsx), its tablature and its
 * `{ string, fret }` places; what differs is here: the tuning and the lessons.
 * The guitar itself stays in guitar.js.
 *
 * Strings are listed low to high, as tablature numbers them from the bottom
 * line up.
 */

export const BASS_TUNING = Object.freeze([28, 33, 38, 43]); // E1 A1 D2 G2
/**
 * The Saraswati veena's four playing strings with Sa on D, as Carnatic players often tune it: anumandaram (Pa),
 * mandaram (Sa), panchamam (Pa) and sarani (Sa), the thinnest, where most of the music is played.
 */
export const VEENA_TUNING = Object.freeze([33, 38, 45, 50]); // A1 D2 A2 D3
const FRETS = 12;

const TUNINGS = Object.freeze({ bass: BASS_TUNING, veena: VEENA_TUNING });
const LABELS = Object.freeze({ bass: 'Bass', veena: 'Veena' });
/** A string of the same name keeps the colour the guitar gives it. */
const COLORS = Object.freeze({
  bass: Object.freeze(['#e9b870', '#eb9c9b', '#c2a6f4', '#76b8f3']),
  veena: Object.freeze(['#d9a25f', '#e58f7b', '#b9a3ef', '#7cc0ef']),
});

export function frettedMidi(instrument, string, fret) {
  const tuning = TUNINGS[instrument];
  if (!tuning || !Number.isInteger(string) || string < 0 || string >= tuning.length ||
      !Number.isInteger(fret) || fret < 0 || fret > FRETS) return null;
  return tuning[string] + fret;
}

/** One finger to a fret in first position; an open string needs none. */
const finger = fret => (fret === 0 ? 0 : Math.min(4, fret));
/** The veena's left hand slides one finger along the frets: the index, unless a note is open. */
const veenaFinger = fret => (fret === 0 ? 0 : 1);
const FINGERS = Object.freeze({ bass: finger, veena: veenaFinger });

/** A raga is named before its Sa ("Mayamalavagowla on D"), a key after its tonic ("G major"). */
const RAGA_NAMES = Object.freeze({ mayamalavagowla: 'Mayamalavagowla' });
const keyOf = (tonic, mode) => {
  const note = noteName(60 + tonic).replace(/\d/g, '');
  return { tonic, mode, name: RAGA_NAMES[mode] ? `${RAGA_NAMES[mode]} on ${note}` : `${note} ${mode}`, confidence: 1 };
};
const rangeOf = notes => [Math.min(...notes.map(note => note.midi)), Math.max(...notes.map(note => note.midi))];

// Each place is [string, fret] or [string, fret, beats].
function study(instrument, id, title, description, places, { bpm = 72, tonic = 0, mode = 'major' } = {}) {
  const beat = 60 / bpm;
  let time = 0;
  const notes = places.map(([string, fret, beats = 1], index) => {
    const midi = frettedMidi(instrument, string, fret);
    const note = {
      id: index, midi, name: noteName(midi), string, fret, finger: FINGERS[instrument](fret),
      time, duration: beat * beats * 0.8, velocity: 0.72, hand: 'right', track: 0,
    };
    time += beat * beats;
    return note;
  });
  return {
    id: `${instrument}-${id}`, title, description, composer: `${LABELS[instrument]} essentials`,
    source: `authored-${instrument}-study`, instrument, variant: `${instrument}:standard:${FRETS}`,
    bpm, timeSignature: [4, 4], key: keyOf(tonic, mode),
    notes, noteCount: notes.length, duration: notes.at(-1).time + notes.at(-1).duration, range: rangeOf(notes),
  };
}

const upAndBack = places => [...places, ...places.slice(0, -1).reverse()];
const twice = places => [...places, ...places];

const BASS_LESSONS = [
  study('bass', 'open-strings', 'Meet the four strings',
    'Pluck each open string, from low E up to G and back. Rest your thumb on the body and pluck with your first two fingers.',
    twice([0, 1, 2, 3, 2, 1, 0, 3].map(string => [string, 0])), { bpm: 66, tonic: 4, mode: 'minor' }),
  study('bass', 'first-frets', 'Your first fretted notes',
    'Play the low E string open, then fret 1 with your index finger and fret 3 with your ring finger: E, F and G.',
    [[0, 0], [0, 1], [0, 3], [0, 1], [0, 0], [0, 1], [0, 3], [0, 0]], { bpm: 60, tonic: 4, mode: 'minor' }),
  study('bass', 'string-crossings', 'Two strings, one steady pulse',
    'Alternate open A and D, then place fingers 1–4 on the D string slowly. Move the hand comfortably instead of forcing a stretch.',
    [[1,0],[2,0],[1,0],[2,0],[2,1],[2,2],[2,3],[2,4]], { bpm: 56, tonic: 2 }),
  study('bass', 'g-major', 'G major · one octave',
    'From G on the lowest string up to the open G string, and back. Open strings give your hand a moment to move.',
    upAndBack([[0, 3], [1, 0], [1, 2], [1, 3], [2, 0], [2, 2], [2, 4], [3, 0]]), { bpm: 72, tonic: 7 }),
  study('bass', 'root-notes', 'Roots on the beat',
    'A bass player’s first job: the name-note of each chord, once a beat. Four of G, four of C, four of D, and home to G.',
    [...Array(4).fill([0, 3]), ...Array(4).fill([1, 3]), ...Array(4).fill([2, 0]), [0, 3], [0, 3], [0, 3, 2]], { bpm: 80, tonic: 7 }),
  study('bass', 'root-and-fifth', 'Root and fifth',
    'Rock between each chord’s root and the note five steps above it. It is the sound of half the bass lines ever played.',
    [[0, 3], [2, 0], [0, 3], [2, 0], [1, 3], [3, 0], [1, 3], [3, 0], [2, 0], [3, 2], [2, 0], [3, 2], [0, 3, 2], [0, 3, 2]], { bpm: 80, tonic: 7 }),
  study('bass', 'walking-line', 'Walking up · your first bass line',
    'An original line that climbs through the chord and walks back down. Keep every note the same length.',
    [...twice([[0, 3], [1, 2], [2, 0], [2, 2], [3, 0], [2, 2], [2, 0], [1, 2]]), [0, 3, 2], [0, 3, 2]], { bpm: 84, tonic: 7 }),
];

/** Sa, as a pitch class: the veena is tuned with Sa on D. */
const SA = 2;
/**
 * The veena's swaras, as frets on the sarani (string 3), in Mayamalavagowla, the raga every Carnatic student
 * starts in. A capital S is the Sa above. Each swara is a beat; a digit after it holds it longer.
 */
const SWARA_FRETS = Object.freeze({ s: 0, r: 1, g: 4, m: 5, p: 7, d: 8, n: 11, S: 12 });
const SARANI = 3;
const swaras = text => text.split(/\s+/).filter(Boolean).map(token => {
  const fret = SWARA_FRETS[token[0]];
  if (fret === undefined) throw new Error(`No swara called "${token[0]}"`);
  return [SARANI, fret, Number(token.slice(1)) || 1];
});
const RAGA = Object.freeze({ tonic: SA, mode: 'mayamalavagowla' });
/** The swara a note is, counted from Sa on D: what a veena player calls it before its letter name. */
const SWARA_NAMES = Object.freeze(['Sa', 'Ri', 'Ri', 'Ga', 'Ga', 'Ma', 'Ma', 'Pa', 'Dha', 'Dha', 'Ni', 'Ni']);
export const veenaSwara = midi => SWARA_NAMES[pitchClass(midi - SA)];

const VEENA_LESSONS = [
  study('veena', 'open-strings', 'Meet the four strings',
    'Sa, Pa, Sa, Pa: the four strings you play, from sarani, the thinnest and nearest you, out to the deepest. Pluck each one with your index finger.',
    twice([3, 2, 1, 0, 1, 2, 3, 3].map(string => [string, 0])), { bpm: 60, tonic: SA }),
  study('veena', 'sa-pa', 'Sa, Pa, and Sa above',
    'Every song comes home to Sa. Pluck the open sarani, then press your index finger at the seventh fret for Pa and the twelfth for the Sa above.',
    twice(swaras('s p S2 p s2')), { bpm: 60, tonic: SA }),
  study('veena', 'sarali-1', 'Sarali varisai 1',
    'The first exercise every Carnatic student plays: up the raga Mayamalavagowla, Sa to the Sa above, and back down. Slide your finger from fret to fret.',
    upAndBack(swaras('s r g m p d n S')), { bpm: 60, ...RAGA }),
  study('veena', 'sarali-2', 'Sarali varisai 2',
    'Sa and Ri three times, then up the raga; the Sa above and Ni three times, then down. Keep every swara the same length.',
    swaras('s r s r s r g m s r g m p d n S S n S n S n d p S n d p m g r s2'), { bpm: 66, ...RAGA }),
  study('veena', 'janta-1', 'Janta varisai · each swara twice',
    'Janta means twin: every swara played twice, pluck after pluck, up and down. Make the second pluck as clear as the first.',
    swaras('s s r r g g m m p p d d n n S S S S n n d d p p m m g g r r s2'), { bpm: 72, ...RAGA }),
  study('veena', 'below-sa', 'Below Sa, on the Pa string',
    'Next to the sarani, the panchamam string is Pa. On it find Dha at the first fret and Ni at the fourth, then step back up to Sa.',
    twice([[3, 0], [2, 4], [2, 1], [2, 0], [2, 1], [2, 4], [3, 0, 2]]), { bpm: 60, ...RAGA }),
  study('veena', 'climbing-fours', 'Climbing in fours',
    'A pattern in the way of an alankaram: four swaras up from each step of the raga, then four down from each step back.',
    [...swaras('s r g m r g m p g m p d m p d n p d n S'), ...swaras('S n d p n d p m d p m g p m g r m g r s2')], { bpm: 72, ...RAGA }),
];

/** How the easy songs (easySongs.js) are arranged: first position, a finger to a fret, friendliest keys first. */
const SONG_SPECS = Object.freeze({
  bass: Object.freeze({ instrument: 'bass', label: 'Bass', tuning: BASS_TUNING, reach: 4, variant: `bass:standard:${FRETS}`, tonics: [36, 31, 38, 33, 28, 29], finger }),
  // Sa is do: a tune is played from D, mostly up the sarani, as a veena player would.
  veena: Object.freeze({ instrument: 'veena', label: 'Veena', tuning: VEENA_TUNING, reach: FRETS, variant: `veena:standard:${FRETS}`, tonics: [50, 45, 38], finger: veenaFinger }),
});

const stages = {
  bass: [
    { id: 'strings', name: 'Meet your strings', goal: 'Find all four open strings, from low E to G.', exercises: ['bass-open-strings'] },
    { id: 'frets', name: 'Find your first notes', goal: 'Use open strings and frets 1–4 with a relaxed hand.', exercises: ['bass-first-frets', 'bass-string-crossings', 'bass-g-major'] },
    { id: 'groove', name: 'Hold down the chords', goal: 'Play each chord’s root on the beat, then add its fifth.', exercises: ['bass-root-notes', 'bass-root-and-fifth'] },
    { id: 'first-tune', name: 'Play your first bass line', goal: 'Walk through a chord and back, evenly.', exercises: ['bass-walking-line'] },
  ],
  veena: [
    { id: 'strings', name: 'Meet your strings', goal: 'Pluck the four strings, Sa and Pa, high and low.', exercises: ['veena-open-strings'] },
    { id: 'swaras', name: 'Find Sa, Pa and the raga', goal: 'Press the frets for Pa and the Sa above, then climb the raga.', exercises: ['veena-sa-pa', 'veena-sarali-1'] },
    { id: 'varisai', name: 'Play the varisais', goal: 'Sarali and janta varisai, and the swaras below Sa.', exercises: ['veena-sarali-2', 'veena-janta-1', 'veena-below-sa'] },
    { id: 'pattern', name: 'Climb in fours', goal: 'Rise and fall through the raga in fours, evenly.', exercises: ['veena-climbing-fours'] },
  ],
};

const kit = (instrument, lessons) => {
  const songs = easyStudies(SONG_SPECS[instrument]);
  return Object.freeze({
    tuning: TUNINGS[instrument], frets: FRETS, colors: COLORS[instrument], chords: [], lessons, songs, studies: [...lessons, ...songs],
    pathStages: stages[instrument], firstLesson: `${instrument}-open-strings`, finger: FINGERS[instrument],
  });
};

export const FRETTED = Object.freeze({
  bass: kit('bass', BASS_LESSONS),
  veena: kit('veena', VEENA_LESSONS),
});
