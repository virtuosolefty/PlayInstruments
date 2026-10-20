/**
 * drone.js — the drone a student practises against, for the instruments that are played over one.
 *
 * A Carnatic student plays varisais against a tanpura (or a shruti box) holding Sa and Pa, and hears from it whether
 * each swara sits right in the raga; a handpan is played over its own ding. Practice Deck tunes both with Sa on D, so
 * one drone serves both: a tanpura's four strings, plucked in the order a tanpura player plucks them.
 */

/** Pa (A2), Sa (D3) twice, then the low Sa (D2): a tanpura's strings, in the order they are plucked. */
export const TANPURA = Object.freeze([45, 50, 50, 38]);
const INSTRUMENTS = new Set(['veena', 'handpan']);

/** The drone `instrument` is practised against, or null when it has none. */
export const droneFor = instrument => (INSTRUMENTS.has(instrument) ? TANPURA : null);

/** The drone's loudness, in decibels: soft by default, under the instrument. */
export const DRONE_LEVEL = Object.freeze({ min: -30, max: 0, step: 1, default: -12 });
export const droneLevel = settings => Math.min(DRONE_LEVEL.max, Math.max(DRONE_LEVEL.min, Number(settings?.droneLevel ?? DRONE_LEVEL.default)));
