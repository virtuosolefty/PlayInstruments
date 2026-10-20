/**
 * pieceNotes.js — one line you write after a run, shown when you next open the piece.
 *
 * Teachers ask pupils to write down what to fix before the next practice; the
 * app kept runs and stars but never your own words. Notes live in settings
 * (so a backup carries them) as { [pieceId]: { text, at } }, and are cleared
 * with the piece's history.
 */
import { barCount } from './barInspect.js';
import { secondsPerBar } from '../music/passages.js';
import { RATE_MAX, RATE_MIN } from '../app/shortcuts.js';

export const MAX_NOTE = 200;

/** Trimmed, one line, at most MAX_NOTE characters. */
export const cleanNote = text => String(text ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE);

/** The notes with this piece's set to `text`, or removed when it is empty. Never changes `notes`. */
export function withNote(notes = {}, id, text, at = new Date().toISOString()) {
  const clean = cleanNote(text);
  const { [id]: _old, ...rest } = notes ?? {};
  return clean ? { ...rest, [id]: { text: clean, at } } : rest;
}

/** The notes without this piece's. */
export const withoutNote = (notes, id) => withNote(notes, id, '');

/**
 * What a note asks for, when it names a bar: "bar 5", "bars 5-6", optionally a
 * tempo ("at 70", "70 bpm"). Returns { fromBar, toBar, loop: [from, to] seconds,
 * rate | null } or null when it names no bar that this piece has.
 */
export function noteAction(text, score) {
  if (!score?.duration) return null;
  const bars = /\bbars?\s*(\d{1,3})(?:\s*(?:-|–|to)\s*(\d{1,3}))?/i.exec(text ?? '');
  if (!bars) return null;
  const last = barCount(score);
  const fromBar = Number(bars[1]);
  const toBar = Math.max(fromBar, Number(bars[2] ?? fromBar));
  if (fromBar < 1 || toBar > last) return null;
  const span = secondsPerBar(score);
  const tempo = /\bat\s+(\d{2,3})\b|\b(\d{2,3})\s*bpm\b/i.exec(text);
  const bpm = tempo ? Number(tempo[1] ?? tempo[2]) : null;
  const rate = bpm && score.bpm ? Math.min(RATE_MAX, Math.max(RATE_MIN, Math.round((bpm / score.bpm) * 100) / 100)) : null;
  return Object.freeze({ fromBar, toBar, loop: [(fromBar - 1) * span, Math.min(score.duration, toBar * span)], rate, bpm: rate ? Math.round(rate * score.bpm) : null });
}

/** The words on the note's button: "Loop bar 5 at 70 bpm". */
export const actionLabel = a => `Loop bar${a.toBar > a.fromBar ? `s ${a.fromBar}–${a.toBar}` : ` ${a.fromBar}`}${a.bpm ? ` at ${a.bpm} bpm` : ''}`;
