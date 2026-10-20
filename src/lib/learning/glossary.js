/**
 * glossary.js — the musical words a lesson uses, and what each means in one
 * plain line, so a word can be explained where it appears instead of in a
 * paragraph at the bottom of the guide.
 *
 * Each instrument gets the shared words plus its own; where both define a
 * word (finger numbers mean different hands on a piano and a guitar), the
 * instrument's wins. Patterns match whole words, case-insensitively.
 */

const SHARED = [
  { term: 'middle C', pattern: /\bmiddle C\b/i, meaning: 'C4, the C nearest the middle of a piano: the white key just left of the pair of black keys there.' },
  { term: 'beat', pattern: /\bbeats?\b/i, meaning: 'The steady pulse you could tap your foot to. The metronome clicks on it.' },
  { term: 'tempo', pattern: /\btempo\b/i, meaning: 'How fast the beat goes, counted in beats per minute (bpm).' },
  { term: 'rhythm', pattern: /\brhythm\b/i, meaning: 'How long each note lasts and when it starts, against the beat.' },
  { term: 'phrase', pattern: /\bphrases?\b/i, meaning: 'A short stretch of music that makes sense on its own, like a sentence.' },
  { term: 'scale', pattern: /\bscales?\b/i, meaning: 'The notes of a key played in order, one step at a time, up or down.' },
  { term: 'chord', pattern: /\bchords?\b/i, meaning: 'Three or more notes played together.' },
  { term: 'octave', pattern: /\boctaves?\b/i, meaning: 'The distance from one note to the next note with the same name, such as C4 to C5.' },
];

const BY_INSTRUMENT = {
  piano: [
    { term: 'finger', pattern: /\bfingers?\b/i, meaning: 'Fingers are numbered on both hands: 1 is the thumb, 5 the little finger.' },
  ],
  guitar: [
    { term: 'fret', pattern: /\bfrets?\b/i, meaning: 'A space on the neck between two metal bars. Press just behind the bar to play it.' },
    { term: 'open string', pattern: /\bopen strings?\b/i, meaning: 'A string played with no finger on it, written 0.' },
    { term: 'string', pattern: /\bstring \d\b/i, meaning: 'Strings are numbered from the thinnest (1), nearest the floor as you hold the guitar, to the thickest (6).' },
    { term: 'finger', pattern: /\bfingers?\b/i, meaning: 'Fretting-hand fingers: 1 index, 2 middle, 3 ring, 4 little.' },
  ],
  violin: [
    { term: 'open string', pattern: /\bopen strings?\b/i, meaning: 'A string bowed with no finger on it, written 0.' },
    { term: 'finger', pattern: /\bfingers?\b/i, meaning: 'Left-hand fingers: 1 index to 4 little finger. The tapes on the fingerboard mark where they go in first position.' },
    { term: 'bow', pattern: /\bbow\b/i, meaning: 'Draw it straight, between the fingerboard and the bridge, with a relaxed hand.' },
  ],
  drums: [
    { term: 'kick', pattern: /\bkick\b/i, meaning: 'The big drum on the floor, played with your foot on the pedal.' },
    { term: 'hi-hat', pattern: /\bhi-hats?\b/i, meaning: 'Two cymbals on a stand. H plays it closed, O open.' },
    { term: 'snare', pattern: /\bsnare\b/i, meaning: 'The drum in front of you, with wires under it that buzz. Most backbeats land on it.' },
  ],
};
BY_INSTRUMENT.bass = BY_INSTRUMENT.guitar.map(t => (t.term === 'string'
  ? { ...t, meaning: 'Strings are numbered from the thinnest (1), nearest the floor as you hold the bass, to the thickest (4).' }
  : t));
BY_INSTRUMENT.cello = BY_INSTRUMENT.violin;

/** The words to explain on an instrument: its own first, then the shared ones it does not redefine. */
export function glossaryFor(instrument = 'piano') {
  const own = BY_INSTRUMENT[instrument] ?? BY_INSTRUMENT.piano;
  const taken = new Set(own.map(t => t.term));
  return [...own, ...SHARED.filter(t => !taken.has(t.term))];
}

/**
 * Splits text into plain runs and glossary words. Only a word's first
 * appearance is marked, so a sentence is not a row of underlines. A match that
 * starts inside an earlier match is skipped.
 *
 * @param {string} text
 * @param {{ term: string, pattern: RegExp, meaning: string }[]} terms
 * @returns {({ text: string } | { text: string, term: string, meaning: string })[]}
 */
export function splitTerms(text, terms) {
  if (!text) return [];
  const hits = terms
    .map(t => {
      const m = t.pattern.exec(text);
      return m ? { start: m.index, end: m.index + m[0].length, term: t.term, meaning: t.meaning } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start || b.end - a.end);
  const parts = [];
  let at = 0;
  for (const hit of hits) {
    if (hit.start < at) continue;
    if (hit.start > at) parts.push({ text: text.slice(at, hit.start) });
    parts.push({ text: text.slice(hit.start, hit.end), term: hit.term, meaning: hit.meaning });
    at = hit.end;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  return parts;
}

/** A lesson description as short cue lines: one per sentence. */
export const cueLines = (text = '') => (text.match(/[^.!?]+(?:[.!?]+|$)/g) ?? []).map(s => s.trim()).filter(Boolean);
