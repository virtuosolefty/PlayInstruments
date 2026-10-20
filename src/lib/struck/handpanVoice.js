import { HANDPAN } from './handpan.js';

/**
 * The handpan, synthesized, like the app's other built-in voices: nothing to download.
 *
 * What makes a handpan sound like one, and not like a bell, a marimba or an electric piano:
 *
 * - Each field is hammered to sound three notes at once: its own, the octave above and the twelfth (the fifth
 *   above the octave). The note leads; the octave is a little quieter, the twelfth well below it.
 * - The upper two fade first. A fingertip strike makes the steel speak in a few milliseconds with a soft thud; the
 *   overtones are gone within a second or two and the note rings on, for longer the lower it is: about six seconds
 *   at the ding.
 * - Two nearly equal vibrations of the dome beat against each other, so the note shimmers slowly as it fades.
 * - The fields tuned to a struck note's octave or twelfth ring along with it, quietly, through the shell.
 * - Nothing above a few kilohertz: the steel is soft and the strike is the flesh of a finger.
 *
 * A handpan cannot be stopped by letting go, so a release does nothing; the note rings until it fades. Each partial
 * is its own sine with its own fade, shaped directly (Tone's envelope decays far faster than its `decay` says).
 * Partials that have died away are let go at the next strike, not as they stop: rendered offline, Tone runs every
 * stop callback before it renders a sound, so letting go there would silence the notes.
 *
 * It answers the same calls as the other voices, so the engine, the scheduler and live input use it unchanged.
 *
 * @param {object} Tone the tone module (passed in so a test can stand in for it)
 * @param {object} output the node to play into
 */
export function buildHandpanVoice(Tone, output) {
  const bus = new Tone.Filter({ type: 'lowpass', frequency: SOFT_ABOVE_HZ, Q: 0.5 }).connect(output);
  const thudFilter = new Tone.Filter({ type: 'lowpass', frequency: 900, Q: 0.7 }).connect(bus);
  const thud = new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.001, decay: 0.035, sustain: 0, release: 0.01 }, volume: -27 }).connect(thudFilter);
  const ringing = new Set();

  /** One partial: a sine that rises in `attack` seconds to `level` and falls 60 dB in `seconds`. */
  const partial = (frequency, seconds, time, level, attack = ATTACK) => {
    const gain = new Tone.Gain(0).connect(bus);
    const sine = new Tone.Oscillator({ frequency, type: 'sine' }).connect(gain);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(level, time + attack);
    gain.gain.setTargetAtTime(0, time + attack, seconds / FALL_60_DB);
    ringing.add({ sine, gain, until: time + attack + seconds });
    sine.start(time).stop(time + attack + seconds);
  };
  const letGoOfSilent = now => {
    for (const sound of ringing) {
      if (sound.until > now - 0.5) continue;
      ringing.delete(sound);
      sound.sine.dispose();
      sound.gain.dispose();
    }
  };

  const strike = (name, time, velocity = 0.8) => {
    const frequency = Tone.Frequency(name);
    const f = frequency.toFrequency(), midi = Math.round(frequency.toMidi());
    const strength = Math.min(1, Math.max(0.05, velocity));
    const ring = ringSeconds(f);
    letGoOfSilent(Tone.now());
    partial(f, ring, time, LEVELS.note * strength);
    partial(f + beatHz(f), ring * 0.85, time, LEVELS.beat * strength);
    // Struck harder, the overtones speak more.
    partial(f * 2 * OCTAVE_STRETCH, ring * 0.4, time, LEVELS.octave * strength ** 1.3);
    partial(f * 3, ring * 0.22, time, LEVELS.twelfth * strength ** 1.6);
    for (const along of sympathetic(midi)) partial(Tone.Frequency(along, 'midi').toFrequency(), ring * 0.6, time + 0.02, LEVELS.sympathy * strength, 0.09);
    try {
      thud.triggerAttackRelease(0.035, time, strength * 0.7);
    } catch {
      // The thud is one voice and refuses a strike timed before its last; the note still sounds.
    }
  };

  /** Lets every ringing note fade out at once: the pan is damped with both hands. */
  const damp = () => {
    const now = Tone.now();
    for (const { sine, gain } of ringing) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, 0.03);
      sine.stop(now + 0.2);
    }
  };

  return {
    triggerAttackRelease: (name, _duration, time, velocity) => strike(name, time ?? Tone.now(), velocity),
    triggerAttack: (name, time, velocity) => strike(name, time ?? Tone.now(), velocity),
    triggerRelease() {},
    releaseAll: damp,
    dispose() {
      for (const { sine, gain } of ringing) { sine.dispose(); gain.dispose(); }
      ringing.clear();
      [thud, thudFilter, bus].forEach(node => node.dispose());
    },
  };
}

/** Everything above this is softened: a finger on soft steel has no sizzle. */
const SOFT_ABOVE_HZ = 5200;
/** How quickly the steel speaks once struck. */
const ATTACK = 0.005;
/** A fall of 60 dB takes this many time constants (ln 1000). */
const FALL_60_DB = Math.log(1000);
/** Each part's loudness, as a gain: the note, its shimmering twin, the octave, the twelfth, the fields ringing along. */
/** Set so five notes struck together at medium strength stay well under full scale; the output's limiter (audioOutput.js) catches the rest. */
const LEVELS = Object.freeze({ note: 0.2, beat: 0.1, octave: 0.11, twelfth: 0.04, sympathy: 0.02 });
/** A handpan's octaves are tuned a hair wide, a few cents, as tuners do so they ring together. */
const OCTAVE_STRETCH = 2 ** (3 / 1200);
const D3_HZ = 146.83;

/** How long a note rings, to 60 dB down: about six seconds at the ding, about three at the top. */
export const ringSeconds = f => Math.min(7, Math.max(2.4, 6 * (D3_HZ / f) ** 0.45));

/** How fast the note shimmers: a slow beat, a little quicker for a higher note. */
export const beatHz = f => 0.5 + f / 600;

/** The pan's other notes that ring along with `midi`: its octave above and below, and its twelfth. */
export const sympathetic = midi => HANDPAN.pieces.map(piece => piece.midi).filter(other => [12, 19, -12].includes(other - midi));
