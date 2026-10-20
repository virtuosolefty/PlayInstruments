/**
 * technique.js — how a bowed instrument is played: with the bow (arco), or plucked with the fingers (pizzicato).
 *
 * The two sound different and are played differently: a bowed note sounds while the bow moves and stops when it
 * lifts; a plucked one rings from the moment of the pluck and dies away on its own. The choice is kept for each
 * instrument in `settings.bowedTechnique`.
 */

export const TECHNIQUES = Object.freeze([
  Object.freeze({ id: 'bow', label: 'Bow', hint: 'Press and hold to bow' }),
  Object.freeze({ id: 'fingers', label: 'Fingers', hint: 'Press to pluck' }),
]);
const BOWED = new Set(['violin', 'cello']);

/** 'bow' or 'fingers' for a bowed instrument; always 'bow' for the rest, which have no choice to make. */
export const techniqueFor = (settings, instrument) =>
  (BOWED.has(instrument) && settings?.bowedTechnique?.[instrument] === 'fingers' ? 'fingers' : 'bow');

/** The settings with `instrument` played with `technique`. Never changes `settings`. */
export const withTechnique = (settings, instrument, technique) =>
  ({ ...settings, bowedTechnique: { ...settings.bowedTechnique, [instrument]: technique === 'fingers' ? 'fingers' : 'bow' } });

/** The audio engine's voice: a plucked cello is its own voice (audio.js), the bowed one the instrument's. */
export const voiceFor = (instrument, technique) => (BOWED.has(instrument) && technique === 'fingers' ? `${instrument}-pizz` : instrument);

/**
 * Models the whole-instrument view can show in place of the instrument practised (stageModels.js) that sound unlike
 * it. The bass guitar answers to the guitar's strings of the same name, so it sounds an octave below them, as a
 * bass does; the electric violin has no wooden body to soften it; the electronic kit is pads and samples. The
 * antique cello and the grand piano sound as the instrument practised does.
 */
const MODEL_VOICES = Object.freeze({
  'guitar-bass': Object.freeze({ voice: 'bass', transpose: -12 }),
  'violin-electric': Object.freeze({ voice: 'violin-electric', transpose: 0 }),
  'drums-electronic': Object.freeze({ voice: 'drums-electronic', transpose: 0 }),
});

/**
 * What is heard: the instrument practised, played with its technique, or the model shown in its place. A violin
 * plucked with the fingers is plucked whichever violin is shown.
 *
 * @returns {{ voice: string, transpose: number }}
 */
export function soundFor(instrument, technique, shown = null) {
  const plucked = BOWED.has(instrument) && technique === 'fingers';
  return (!plucked && MODEL_VOICES[shown]) || { voice: voiceFor(instrument, technique), transpose: 0 };
}

/** How long a pluck is held before it is let go, by which time its sound has mostly died away. */
export const PLUCK_MS = Object.freeze({ violin: 700, cello: 1100 });
