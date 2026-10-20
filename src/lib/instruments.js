import { BOWED, bowedFinger, bowedMidi, bowedStringName } from './strings/bowed.js';
import { DRUM_BEATS, DRUM_PATH_STAGES, DRUM_STUDIES } from './struck/drums.js';
import { FRETTED, frettedMidi, veenaSwara } from './strings/fretted.js';
import { GUITAR_CHORDS, GUITAR_COLORS, GUITAR_PATH_STAGES, GUITAR_SONGS, GUITAR_STUDIES, GUITAR_TUNING, guitarMidi } from './strings/guitar.js';
import { HANDPAN_PATH_STAGES, HANDPAN_SONGS, HANDPAN_STUDIES } from './struck/handpan.js';
import { struckSetFor } from './struck/struckSets.js';
import { TABLA_PATH_STAGES, TABLA_SONGS, TABLA_STUDIES } from './struck/tabla.js';
import { noteName } from './music/theory.js';

/**
 * One place that knows which instruments exist.
 *
 * Most of the studio only needs to ask "does this instrument bring a kit of
 * its own studies?" — the lessons, library, path and matcher are shared by
 * every kit. The string kits also share the tab; the drums have their own
 * lanes and stage; the piano keeps its own roll and keyboard.
 *
 * A string kit is either `fretted` (guitar, bass: plucked, played in
 * GuitarWorkspace.jsx) or `bowed` (violin, cello: BowedWorkspace.jsx).
 * The pickers list the instruments in this order, families side by side.
 *
 * A kit's `studies` are everything it can put on the stage: its `lessons`,
 * which the path is made of, then its `songs`, the ten easy tunes (or, on the
 * drums, beats) that are open from the start and belong to no stage.
 */
export const INSTRUMENTS = ['piano', 'guitar', 'bass', 'violin', 'cello', 'veena', 'drums', 'tabla', 'handpan'];

/**
 * What the pickers list: one button an instrument, eight in all, as the player chose. The bass is a kind of guitar, so it
 * sits behind the guitar's button, chosen with a small switch beside the
 * studio's controls (`TypeSwitch.jsx`). Underneath it stays an instrument of
 * its own, with its own tuning, lessons, path and saved place, so everything
 * keyed by an instrument id still works.
 */
export const PICKER = ['piano', 'guitar', 'violin', 'cello', 'veena', 'drums', 'tabla', 'handpan'];
const FAMILIES = Object.freeze({ guitar: Object.freeze(['guitar', 'bass']) });

/** The picker button an instrument sits behind: the bass's is the guitar's. */
export const familyOf = id => Object.keys(FAMILIES).find(family => FAMILIES[family].includes(id)) ?? normalizeInstrument(id);
/** The kinds an instrument's family has, or null when it has only the one. */
export const variantsOf = id => FAMILIES[familyOf(id)] ?? null;
/**
 * The instrument a picker button opens: the kind the player used last, so that
 * someone who plays bass is not sent back to the guitar every time.
 *
 * @param {Record<string, string> | undefined} remembered the saved choice for each family
 * @param {string} family a picker id
 */
export const chooseVariant = (remembered, family) => (FAMILIES[family]?.includes(remembered?.[family]) ? remembered[family] : family);

const INFO = {
  piano: { label: 'Piano', tagline: 'Falling notes & sheet music', detail: 'On-screen keys and MIDI input' },
  guitar: { label: 'Guitar', tagline: 'Tab, fretboard & chords', detail: 'Standard tuning · E A D G B E' },
  bass: { label: 'Bass', tagline: 'Low notes & bass lines', detail: 'Standard tuning · E A D G' },
  violin: { label: 'Violin', tagline: 'Fingerboard, tapes & bowing', detail: 'Tuned in fifths · G D A E' },
  cello: { label: 'Cello', tagline: 'Deep strings & first scales', detail: 'Tuned in fifths · C G D A' },
  veena: { label: 'Veena', tagline: 'Swaras, varisais & a 3D veena', detail: 'Sa on D · Sa Pa Sa Pa' },
  drums: { label: 'Drums', tagline: 'Beats, fills & a 3D kit', detail: 'Nine pieces · pads, keys and MIDI' },
  tabla: { label: 'Tabla', tagline: 'Bols, thekas & taals', detail: 'Dayan and bayan · six strokes' },
  handpan: { label: 'Handpan', tagline: 'Ringing steel & grooves', detail: 'D Aegean · 18 notes' },
};

export const normalizeInstrument = id => (INSTRUMENTS.includes(id) ? id : 'piano');
/** Every instrument but the piano: its pieces are its own authored studies, played in its own workspace. */
export const usesKit = id => normalizeInstrument(id) !== 'piano';
export const instrumentInfo = id => ({ id: normalizeInstrument(id), ...INFO[normalizeInstrument(id)] });

const stringNamer = tuning => s => ({ note: noteName(tuning[s]).replace(/\d/g, ''), number: tuning.length - s });

/**
 * What the fretted kits share. `stage` says what the 3D stage has for the
 * instrument: 'drawn' (the guitar built in code, with its model for the whole
 * view) or 'model' (a downloaded model that is played directly). `wound(s)`
 * is whether string s is a wound one.
 */
const fretted = (id, kit) => ({
  id, label: INFO[id].label, fretted: true, bowed: false, frets: 12, songsLabel: 'Songs you know',
  studyKey: `${id}StudyId`, placeWord: 'fret', stringName: stringNamer(kit.tuning), ...kit,
});

const GUITAR_KIT = fretted('guitar', {
  tuning: GUITAR_TUNING, colors: GUITAR_COLORS, chords: GUITAR_CHORDS,
  lessons: GUITAR_STUDIES, songs: GUITAR_SONGS, studies: [...GUITAR_STUDIES, ...GUITAR_SONGS],
  pathStages: GUITAR_PATH_STAGES, firstLesson: 'guitar-open-strings', midi: guitarMidi,
  finger: (fret, note) => note?.finger ?? (fret === 0 ? 0 : Math.min(4, fret)),
  stage: 'drawn', wound: s => s < 3,
});

const BASS_KIT = fretted('bass', {
  ...FRETTED.bass, midi: (string, fret) => frettedMidi('bass', string, fret),
  // Played on the downloaded bass guitar (stageModels.js), which the guitar's whole view also shows.
  stage: 'model', model: 'guitar-bass', wound: () => true,
});

const VEENA_KIT = fretted('veena', {
  ...FRETTED.veena, midi: (string, fret) => frettedMidi('veena', string, fret),
  // Played on the downloaded veena (stageModels.js). Its two lower strings are wound, as on the real one.
  stage: 'model', model: 'veena', wound: s => s < 2, tuningLabel: 'Sa on D',
  // A note's swara, which a veena player names it by before its letter.
  swara: veenaSwara,
  openStrings: { lead: 'Sa, Pa, Sa, Pa, with the three drones beside them.', hint: 'Pluck the open sarani for Sa, then find Pa at the seventh fret and the Sa above at the twelfth.' },
});

const BOWED_COLORS = {
  violin: ['#e8b87a', '#d9a0c9', '#8fc2f0', '#b7e39a'],
  cello: ['#e79f7c', '#e8c27a', '#9fc8ee', '#a6dcc0'],
};

/** `model` is the downloaded model the 3D stage plays the instrument on. */
const bowedKit = id => ({
  id, label: INFO[id].label, bowed: true, fretted: false, tuning: BOWED[id].tuning, colors: BOWED_COLORS[id], model: id,
  lessons: BOWED[id].lessons, songs: BOWED[id].songs, songsLabel: 'Songs you know', studies: BOWED[id].studies,
  pathStages: BOWED[id].pathStages, firstLesson: BOWED[id].firstLesson,
  scales: BOWED[id].scales, studyKey: `${id}StudyId`, placeWord: 'finger',
  midi: (string, fret) => bowedMidi(id, string, fret),
  stringName: s => bowedStringName(id, s),
  finger: fret => bowedFinger(id, fret),
});

const DRUM_KIT = {
  id: 'drums', label: 'Drums', drums: true, struck: true, set: struckSetFor('drums'), bowed: false, fretted: false,
  lessons: DRUM_STUDIES, songs: DRUM_BEATS, songsLabel: 'Beats to play along to', studies: [...DRUM_STUDIES, ...DRUM_BEATS],
  pathStages: DRUM_PATH_STAGES, firstLesson: 'drums-meet-the-kit',
  studyKey: 'drumsStudyId', placeWord: 'drum',
};

/**
 * A struck instrument (struck.js): the drums above, the tabla and the handpan. `set` is what it is played with,
 * its pieces, keys and words; the studio, lanes and pads read the set.
 */
const struckKit = (id, { lessons, songs, songsLabel, pathStages }) => ({
  id, label: INFO[id].label, struck: true, drums: false, bowed: false, fretted: false, set: struckSetFor(id),
  lessons, songs, songsLabel, studies: [...lessons, ...songs], pathStages, firstLesson: lessons[0].id,
  studyKey: `${id}StudyId`, placeWord: struckSetFor(id).word,
});
const TABLA_KIT = struckKit('tabla', { lessons: TABLA_STUDIES, songs: TABLA_SONGS, songsLabel: 'Thekas to play along to', pathStages: TABLA_PATH_STAGES });
const HANDPAN_KIT = struckKit('handpan', { lessons: HANDPAN_STUDIES, songs: HANDPAN_SONGS, songsLabel: 'Tunes to play along to', pathStages: HANDPAN_PATH_STAGES });

const STRING_KITS = {
  guitar: GUITAR_KIT, bass: BASS_KIT, veena: VEENA_KIT,
  violin: bowedKit('violin'), cello: bowedKit('cello'),
};
const KITS = { ...STRING_KITS, drums: DRUM_KIT, tabla: TABLA_KIT, handpan: HANDPAN_KIT };

export const isStringed = id => normalizeInstrument(id) in STRING_KITS;

/** Everything the shared string studio needs, or null for the piano and the drums. */
export const stringKit = id => STRING_KITS[normalizeInstrument(id)] ?? null;

/** The studies, path and saved-study key of any instrument that has a kit, or null for the piano. */
export const instrumentKit = id => KITS[normalizeInstrument(id)] ?? null;

/** The saved study for an instrument, or its first lesson when none is valid. */
export function studyIdFor(settings, id) {
  const kit = instrumentKit(id);
  if (!kit) return null;
  const saved = settings?.[kit.studyKey];
  return kit.studies.some(s => s.id === saved) ? saved : kit.lessons[0].id;
}

/** Which string instrument a study belongs to, or null for a piano piece. */
export function instrumentForStudy(id) {
  return Object.values(KITS).find(kit => kit.studies.some(s => s.id === id))?.id ?? null;
}
