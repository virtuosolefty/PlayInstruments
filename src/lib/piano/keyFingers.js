/**
 * keyFingers.js — which finger plays each key next, for the finger numbers a
 * lesson shows on the keys themselves.
 *
 * The fingering is the authored one the app's own pieces carry (score.js puts
 * it on each note); imported files carry none, so they show none. A key played
 * by different fingers in one piece shows the finger of its next note, so the
 * number is always the one about to matter.
 */

/** The draw loops ask every frame; the answer changes at most with a note, so it is kept per 50 ms of song time. */
const BUCKETS_PER_SECOND = 20;
let kept = { notes: null, bucket: NaN, map: null };
const signatures = new WeakMap();

/** A key's coming finger and hand, or nothing, keyed by MIDI number. */
export function keyFingers(notes, now = 0) {
  const bucket = Math.floor(now * BUCKETS_PER_SECOND);
  if (notes && kept.notes === notes && kept.bucket === bucket) return kept.map;
  const out = new Map();
  if (!notes) return out;
  for (const note of notes) {
    if (!note.finger || note.time + (note.duration ?? 0) < now - 0.05) continue;
    if (!out.has(note.midi)) out.set(note.midi, { finger: note.finger, hand: note.hand === 'left' ? 'left' : 'right' });
  }
  kept = { notes, bucket, map: out };
  return out;
}

/** One cache key for a fingers map, so a keyboard layer redraws only when a number changes. */
export function fingersSignature(fingers) {
  let signature = signatures.get(fingers);
  if (signature === undefined) {
    signature = [...fingers].map(([midi, f]) => `${midi}:${f.finger}${f.hand[0]}`).join(',');
    signatures.set(fingers, signature);
  }
  return signature;
}
