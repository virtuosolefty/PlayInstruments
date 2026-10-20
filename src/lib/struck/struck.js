/**
 * struck.js — the instruments played by striking: the drum kit, the tabla and the handpan.
 *
 * Each is a fixed set of pieces (a drum, a bol, a tone field), every piece a MIDI note of its own, so the matcher,
 * the grading and the history stay shared with the other instruments: a lesson is a score whose "notes" are strikes.
 * A set describes its pieces and how to talk about them; the studio (StruckWorkspace.jsx), its lanes and pads read
 * the set and never the instrument's name.
 */

/**
 * @typedef {object} Piece
 * @property {string} id
 * @property {string} label   the full name, for screen readers and the free-play card
 * @property {string} short   the name on a lane, a pad and a note
 * @property {number} midi
 * @property {string} key     the computer key that strikes it
 * @property {string} side    'left' or 'right': which hand (or for the kick, the foot), and the tile colour it takes
 * @property {string} [group] a heading the pads are gathered under (the tabla's two drums, the handpan's two shells)
 */

/** Builds a set's lookups from its pieces (top lane first) and the other notes that mean the same piece. */
export function struckSet({ id, pieces, aliases = {}, ...about }) {
  const frozen = Object.freeze(pieces.map(piece => Object.freeze({ ...piece })));
  const byId = new Map(frozen.map(piece => [piece.id, piece]));
  const byMidi = new Map([
    ...Object.entries(aliases).map(([midi, pieceId]) => [Number(midi), byId.get(pieceId)]),
    ...frozen.map(piece => [piece.midi, piece]),
  ]);
  const forMidi = midi => (Number.isInteger(midi) ? byMidi.get(midi) ?? null : null);
  return Object.freeze({
    id,
    pieces: frozen,
    piece: pieceId => byId.get(pieceId) ?? null,
    forMidi,
    /** The note the lessons are written in, for whatever note a controller sent; null when it is not in the set. */
    canonical: midi => forMidi(midi)?.midi ?? null,
    /** Computer key to note. */
    keys: Object.freeze(Object.fromEntries(frozen.map(piece => [piece.key, piece.midi]))),
    /** The pieces a score uses, top lane first; all of them when there is no score to go by. */
    lanes(score) {
      const used = new Set((score?.notes ?? []).map(note => forMidi(note.midi)?.id));
      const lanes = frozen.filter(piece => used.has(piece.id));
      return lanes.length ? lanes : frozen;
    },
    /** What to strike and how, for the lesson guide. */
    instruction(note) {
      const piece = forMidi(note?.midi);
      return piece ? `${piece.short} · press ${piece.key.toUpperCase()}` : 'Preparing your first note…';
    },
    /** The next beat's strikes in one line: a set that names its strokes (the tabla's bols) says it its own way. */
    upNext(notes) {
      return notes.map(note => this.instruction(note)).join('  +  ');
    },
    noteNames: Object.freeze(Object.fromEntries(frozen.map(piece => [piece.midi, piece.short]))),
    ...about,
  });
}

/**
 * A study from beats: each event a beat number (from 0, fractions allowed) and the pieces struck on it.
 *
 * @param {object} set the instrument's set
 * @param {object} spec
 * @param {string} spec.id without the instrument's prefix
 * @param {Array<{ beat: number, pieces: string[], name?: string }>} spec.events
 * @param {number} spec.beats how many beats the study lasts
 * @param {number} [spec.beatsPerBar]
 */
export function struckStudy(set, { id, title, description, events, beats, bpm = 72, beatsPerBar = 4, composer, key, difficulty, easy }) {
  const beat = 60 / bpm;
  const order = new Map(set.pieces.map((piece, index) => [piece.id, index]));
  const strikes = events.flatMap(event => event.pieces.map(pieceId => {
    const piece = set.piece(pieceId);
    if (!piece) throw new Error(`${set.id} study ${id}: no piece called "${pieceId}"`);
    return { piece, time: event.beat * beat, name: event.name };
  }));
  const notes = strikes
    .sort((a, b) => a.time - b.time || order.get(a.piece.id) - order.get(b.piece.id))
    .map(({ piece, time, name }, index) => ({
      id: index, midi: piece.midi, name: piece.short, piece: piece.id, ...(name ? { stroke: name } : {}),
      // A strike has no length; this is only how long its tile is drawn.
      time, duration: Math.min(0.18, beat * 0.4), velocity: 0.8, hand: piece.side === 'left' ? 'left' : 'right', track: 0,
    }));
  const midis = notes.map(note => note.midi);
  return {
    id: `${set.id}-${id}`, title, description, composer: composer ?? set.composer,
    source: `authored-${set.id}-study`, instrument: set.id, variant: `${set.id}:kit`,
    bpm, timeSignature: [beatsPerBar, 4], key: key ?? { tonic: 0, mode: 'major', name: set.keyName ?? set.id, confidence: 1 },
    notes, noteCount: notes.length, duration: beats * beat,
    range: [Math.min(...midis), Math.max(...midis)],
    noteNames: set.noteNames,
    ...(difficulty ? { difficulty } : {}), ...(easy ? { easy: true } : {}),
  };
}

/**
 * Beats written as text, one token a beat: `Dha Dhin - Na` or `D3 A3 - F#3`. A dash is a rest; `a+b` splits a beat
 * in two (or more) equal parts. `strokes(token)` turns one token into the pieces it strikes, and the name to show.
 * @returns {{ events: Array<{ beat: number, pieces: string[], name: string }>, beats: number }}
 */
export function parseBeats(text, strokes) {
  const tokens = text.split(/[\s|]+/).filter(Boolean);
  const events = [];
  tokens.forEach((token, beat) => {
    const parts = token.split('+');
    parts.forEach((part, index) => {
      if (part === '-' || part === '') return;
      const { pieces, name } = strokes(part);
      events.push({ beat: beat + index / parts.length, pieces, name });
    });
  });
  return { events, beats: tokens.length };
}
