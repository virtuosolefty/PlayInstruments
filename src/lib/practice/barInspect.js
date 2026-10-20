/**
 * barInspect.js — what is in one bar, and how it has gone, for the studio's
 * inspector: the panel that answers "what is in this bar, and how have I
 * played it?" when a bar in the timeline or a place on the roll is chosen.
 */
import { secondsPerBar } from '../music/passages.js';

const MAX_NAMES = 8;

/** How many bars a score has. */
export const barCount = score => (score?.duration ? Math.max(1, Math.ceil(score.duration / secondsPerBar(score) - 1e-6)) : 1);

/** Notes starting in each bar, for the panel's small density chart. */
export function notesPerBar(score) {
  const bars = barCount(score), span = secondsPerBar(score);
  const counts = new Array(bars).fill(0);
  for (const note of score?.notes ?? []) counts[Math.min(bars - 1, Math.floor(note.time / span + 1e-6))] += 1;
  return counts;
}

/**
 * @param {object} score
 * @param {number} bar 1-based
 * @param {{ time: number, missed: number, wrong: number, late: number }[]} [troubleSpots] from storage, across runs
 */
export function inspectBar(score, bar, troubleSpots = []) {
  const span = secondsPerBar(score);
  const from = (bar - 1) * span, to = bar * span;
  const inBar = time => time >= from - 1e-3 && time < to - 1e-3;
  const notes = (score?.notes ?? []).filter(note => inBar(note.time));
  const hands = ['right', 'left'].map(hand => {
    const own = notes.filter(note => (note.hand === 'left' ? 'left' : 'right') === hand);
    const names = [];
    for (const note of own) if (names[names.length - 1] !== note.name.replace(/\d+$/, '')) names.push(note.name.replace(/\d+$/, ''));
    return { hand, count: own.length, names: names.slice(0, MAX_NAMES), more: names.length > MAX_NAMES, fingers: own.map(note => note.finger).filter(Boolean) };
  }).filter(h => h.count > 0);
  const trouble = troubleSpots.filter(spot => inBar(spot.time)).reduce(
    (sum, spot) => ({ missed: sum.missed + spot.missed, wrong: sum.wrong + spot.wrong, late: sum.late + spot.late }),
    { missed: 0, wrong: 0, late: 0 },
  );
  return { bar, bars: barCount(score), from, to: Math.min(to, score?.duration ?? to), span, count: notes.length, hands, trouble };
}

/**
 * The note a click on the roll picked: the one at that pitch in the bar nearest the clicked time, or null when the
 * bar has none there (a click in an empty lane).
 *
 * @param {object} score
 * @param {number} bar 1-based
 * @param {{ time: number, midi: number }} pick
 */
export function noteNear(score, bar, pick) {
  if (!pick) return null;
  const span = secondsPerBar(score);
  const from = (bar - 1) * span, to = bar * span;
  let best = null;
  for (const note of score?.notes ?? []) {
    if (note.midi !== pick.midi || note.time < from - 1e-3 || note.time >= to - 1e-3) continue;
    if (!best || Math.abs(note.time - pick.time) < Math.abs(best.time - pick.time)) best = note;
  }
  return best;
}

