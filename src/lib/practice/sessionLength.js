/**
 * sessionLength.js — how long tonight's practice takes, said in minutes, the
 * way a practice stand says "Warmup · 90s" before you start.
 *
 * A daily item is heard once and played once at least, with a few seconds to
 * find your place between, so its time is its length twice plus a little.
 * Rounded to whole minutes, never under one: an estimate, said as "about".
 */

const PLAYS = 2;
const SETTLE_SECONDS = 20;

/** Minutes one item of today's practice takes, from the piece's length in seconds. */
export function itemMinutes(entry) {
  const seconds = Math.max(0, entry?.approxDuration ?? entry?.duration ?? 0);
  return Math.max(1, Math.round((seconds * PLAYS + SETTLE_SECONDS) / 60));
}

/** Minutes the whole list takes. */
export const sessionMinutes = entries => entries.reduce((sum, entry) => sum + itemMinutes(entry), 0);
