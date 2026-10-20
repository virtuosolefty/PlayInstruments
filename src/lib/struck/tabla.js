import { parseBeats, struckSet, struckStudy } from './struck.js';

/**
 * The tabla: the dayan (the smaller, right-hand drum, tuned to the tonic) and the bayan (the bigger, left-hand
 * bass drum). Tabla is spoken before it is played: every stroke has a syllable, a bol, and a rhythm cycle (a taal)
 * is learnt as its theka, the bols that mark it.
 *
 * Six strokes, each a note of its own: Na, Tin, Tun and Te on the dayan, Ge and Ke on the bayan. The bols that
 * strike both drums at once are written as their two strokes together: Dha is Na with Ge, Dhin is Tin with Ge.
 * Each stroke's key is the letter it is spoken with (Te is E, Tun is U, so that T stays Tin).
 */
export const TABLA = struckSet({
  id: 'tabla', composer: 'Tabla essentials', keyName: 'tabla', word: 'bol',
  pieces: [
    { id: 'na', short: 'Na', label: 'Na, the rim', midi: 62, key: 'n', side: 'right', group: 'Dayan · right hand' },
    { id: 'tin', short: 'Tin', label: 'Tin, near the rim', midi: 63, key: 't', side: 'right', group: 'Dayan · right hand' },
    { id: 'tun', short: 'Tun', label: 'Tun, open centre', midi: 64, key: 'u', side: 'right', group: 'Dayan · right hand' },
    { id: 'te', short: 'Te', label: 'Te, closed centre', midi: 65, key: 'e', side: 'right', group: 'Dayan · right hand' },
    { id: 'ge', short: 'Ge', label: 'Ge, open bass', midi: 48, key: 'g', side: 'left', group: 'Bayan · left hand' },
    { id: 'ke', short: 'Ke', label: 'Ke, closed bass', midi: 49, key: 'k', side: 'left', group: 'Bayan · left hand' },
  ],
  card: {
    eyebrow: 'TABLA · DAYAN AND BAYAN',
    title: 'Six strokes, spoken and played',
    intro: 'Each stroke is the key it is spoken with: N for Na, T for Tin, U for Tun, E for Te on the dayan; G for Ge and K for Ke on the bayan. Dha is N and G together.',
    hint: 'Say the bols out loud as you play them. That is how tabla is learnt.',
  },
  padsLabel: 'Tabla strokes', lanesCaption: 'TABLA BOLS', testMidi: 62,
  legend: 'Blue ring: strike next · Blue tiles are the dayan, amber the bayan',
  /** The next beat as its bol and the keys for it: "Dha · Na + Ge · press N + G". */
  upNext(notes) {
    if (!notes.length) return '';
    const pieces = notes.map(note => this.forMidi(note.midi)).filter(Boolean);
    const strokes = pieces.map(piece => piece.short).join(' + ');
    const bol = notes[0].stroke ?? strokes;
    // A bol that is one stroke by its own name (Ge, Na) is said once; Dha is said as what it is made of.
    return `${bol}${bol.toLowerCase() === strokes.toLowerCase() ? '' : ` · ${strokes}`} · press ${pieces.map(piece => piece.key.toUpperCase()).join(' + ')}`;
  },
});

/** The bols the lessons are written in, and the strokes each one is. */
const BOLS = Object.freeze({
  dha: ['na', 'ge'], dhin: ['tin', 'ge'], dhi: ['tin', 'ge'],
  na: ['na'], ta: ['na'], tin: ['tin'], tun: ['tun'], tu: ['tun'],
  te: ['te'], ti: ['te'], tit: ['te'],
  ge: ['ge'], ghe: ['ge'], ga: ['ge'], ke: ['ke'], ka: ['ke'], kat: ['ke'],
});
const strokes = token => {
  const pieces = BOLS[token.toLowerCase()];
  if (!pieces) throw new Error(`tabla: no bol called "${token}"`);
  return { pieces, name: token };
};

const tablaStudy = (id, title, description, text, { bpm = 72, beatsPerBar = 4, repeat = 1, difficulty, easy } = {}) => {
  const { events, beats } = parseBeats(Array.from({ length: repeat }, () => text).join(' '), strokes);
  return struckStudy(TABLA, { id, title, description, events, beats, bpm, beatsPerBar, difficulty, easy });
};

const TEENTAAL = 'Dha Dhin Dhin Dha | Dha Dhin Dhin Dha | Dha Tin Tin Ta | Ta Dhin Dhin Dha';
const KEHERWA = 'Dha Ge Na Ti | Na Ke Dhi Na';
const DADRA = 'Dha Dhin Na | Dha Tin Na';

export const TABLA_STUDIES = [
  tablaStudy('meet-the-tabla', 'Meet the tabla',
    'One of each stroke: Ge and Ke on the big bayan, then Na, Tin, Tun and Te on the small dayan. Say each bol as you play it.',
    'Ge - Ke - Na - Tin - Tun - Te - - -', { bpm: 66 }),
  tablaStudy('na-on-the-dayan', 'Na on the dayan',
    'Na on every beat: the ring finger rests on the black centre while the first finger flicks the rim. Keep it even.',
    'Na Na Na Na | Na Na Na Na', { bpm: 70 }),
  tablaStudy('ge-on-the-bayan', 'Ge on the bayan',
    'Ge on the beat and a rest after it: the middle fingers strike the bayan and lift, so it booms. Let it ring.',
    'Ge - Ge - | Ge - Ge -', { bpm: 70 }),
  tablaStudy('dha-both-hands', 'Dha: both hands',
    'Dha is Na and Ge at the same moment. Two hands, two drums, one bol. Press N and G together.',
    'Dha - Dha - | Dha Dha Dha -', { bpm: 66 }),
  tablaStudy('dadra', 'Dadra: six beats',
    'Dadra taal is six beats, three and three: Dha Dhin Na, Dha Tin Na. The second half turns light, with Tin where Dhin was.',
    DADRA, { bpm: 72, beatsPerBar: 3, repeat: 2 }),
  tablaStudy('keherwa', 'Keherwa: eight beats',
    'Keherwa taal is eight beats, the rhythm under countless songs: Dha Ge Na Ti, Na Ke Dhi Na.',
    KEHERWA, { bpm: 76, repeat: 2 }),
  tablaStudy('teentaal', 'Teentaal: sixteen beats',
    'Teentaal, the most played taal: sixteen beats in four groups of four. The third group is khali, empty: Tin instead of Dhin, no bayan.',
    TEENTAAL, { bpm: 72, difficulty: 2 }),
];

/** Thekas and grooves to play along to, open from the start: the tabla's answer to the other instruments' easy songs. */
export const TABLA_SONGS = [
  tablaStudy('keherwa-groove', 'Keherwa groove', 'The eight-beat song rhythm, a little faster, four times round.', KEHERWA, { bpm: 92, repeat: 4, easy: true }),
  tablaStudy('dadra-sway', 'Dadra sway', 'Six beats that sway like a folk song, four times round.', DADRA, { bpm: 90, beatsPerBar: 3, repeat: 4, easy: true }),
  tablaStudy('rupak', 'Rupak', 'Rupak taal is seven beats, three, two and two, and starts on the light Tin.', 'Tin Tin Na | Dhi Na | Dhi Na', { bpm: 80, beatsPerBar: 7, repeat: 3, easy: true, difficulty: 2 }),
  tablaStudy('jhaptaal', 'Jhaptaal', 'Jhaptaal is ten beats, two, three, two and three.', 'Dhi Na | Dhi Dhi Na | Ti Na | Dhi Dhi Na', { bpm: 80, beatsPerBar: 5, repeat: 2, easy: true, difficulty: 2 }),
  tablaStudy('teentaal-medium', 'Teentaal, medium', 'The sixteen-beat cycle at a medium pace, twice round.', TEENTAAL, { bpm: 96, repeat: 2, easy: true, difficulty: 2 }),
  tablaStudy('teentaal-slow', 'Teentaal, slow', 'The sixteen-beat cycle slowly, so every bol has room to ring.', TEENTAAL, { bpm: 60, easy: true }),
  tablaStudy('dadra-quick', 'Dadra, quick', 'The six-beat cycle quickly, four times round, the way a folk dance takes it.', DADRA, { bpm: 112, beatsPerBar: 3, repeat: 4, easy: true, difficulty: 2 }),
  tablaStudy('dha-ge-call', 'Dha and Ge', 'A practice groove: both drums, then the bayan alone, answering each other.', 'Dha Ge Na Ge | Dha Ge Na Ge', { bpm: 84, repeat: 2, easy: true }),
  tablaStudy('keherwa-doubles', 'Keherwa in doubles', 'The eight-beat cycle with two bols to every beat, twice round.', 'Dha+Ge Na+Ti Na+Ke Dhi+Na', { bpm: 70, repeat: 4, easy: true, difficulty: 2 }),
  tablaStudy('folk-sway', 'Folk sway', 'A practice groove in six with gaps to breathe in: Dha, rest, Dhin; Dha, rest, Na.', 'Dha - Dhin | Dha - Na', { bpm: 96, beatsPerBar: 3, repeat: 4, easy: true }),
];

export const TABLA_PATH_STAGES = [
  { id: 'meet', name: 'Meet the tabla', goal: 'Find the six strokes on the two drums and say each bol.', exercises: ['tabla-meet-the-tabla'] },
  { id: 'hands', name: 'Two hands', goal: 'Na on the dayan, Ge on the bayan, then both together as Dha.', exercises: ['tabla-na-on-the-dayan', 'tabla-ge-on-the-bayan', 'tabla-dha-both-hands'] },
  { id: 'thekas', name: 'First thekas', goal: 'Play Dadra and Keherwa, the cycles under folk songs and film songs.', exercises: ['tabla-dadra', 'tabla-keherwa'] },
  { id: 'teentaal', name: 'Teentaal', goal: 'Play the sixteen-beat cycle, with its empty khali.', exercises: ['tabla-teentaal'] },
];
