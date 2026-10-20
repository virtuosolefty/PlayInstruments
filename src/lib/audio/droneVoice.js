/**
 * The drone's sound: a tanpura, synthesized like the app's other built-in voices (nothing to download).
 *
 * A tanpura is never strummed and never stops: its strings are plucked one after another, evenly, and each rings
 * on through the next, so the four overlap into one steady sound. Its wide, curved bridge (jivari) makes every pluck
 * bloom with high partials, which the rich spectrum and soft low-pass here stand in for. The cycle runs on its own
 * timer, never the practice transport, so it sounds the same whether a run is playing, paused or in free play.
 *
 * @param {object} Tone the tone module (passed in so a test can stand in for it)
 * @param {object} output the node to play into
 */
export function buildDroneVoice(Tone, output, { setTimer = globalThis.setInterval, clearTimer = globalThis.clearInterval } = {}) {
  const level = new Tone.Gain(0).connect(output);
  const body = new Tone.Filter({ type: 'lowpass', frequency: 2600, Q: 0.4 }).connect(level);
  const strings = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    oscillator: { type: 'custom', partials: [1, 0.72, 0.56, 0.46, 0.38, 0.3, 0.24, 0.18, 0.12, 0.08] },
    envelope: { attack: 0.03, decay: 2.6, sustain: 0.28, release: 2.2 },
    volume: -6,
  }).connect(body);
  let timer = null, step = 0, notes = [], db = -12;

  const pluck = () => {
    if (!notes.length) return;
    const name = Tone.Frequency(notes[step % notes.length], 'midi').toNote();
    step += 1;
    try { strings.triggerAttackRelease(name, RING_SECONDS, Tone.now() + 0.03, 0.6); } catch { /* a pluck dropped is not heard missing */ }
  };

  return {
    /** Starts the cycle over `midiNotes`, or carries on if it is already running over them. */
    start(midiNotes) {
      notes = [...midiNotes];
      level.gain.rampTo(Tone.dbToGain(db), FADE_SECONDS);
      if (timer !== null) return;
      step = 0;
      pluck();
      timer = setTimer(pluck, PLUCK_SECONDS * 1000);
    },
    /** Lets the drone fade out, as a tanpura player stops plucking. */
    stop() {
      if (timer !== null) { clearTimer(timer); timer = null; }
      level.gain.rampTo(0, FADE_SECONDS);
    },
    setLevel(decibels) {
      db = decibels;
      if (timer !== null) level.gain.rampTo(Tone.dbToGain(db), 0.1);
    },
    get running() { return timer !== null; },
    dispose() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      [strings, body, level].forEach(node => node.dispose());
    },
  };
}

/** A pluck every this many seconds: slow and even, as a tanpura is played. */
const PLUCK_SECONDS = 1.2;
/** How long each string is held before it is let go to ring away. */
const RING_SECONDS = 3.4;
const FADE_SECONDS = 0.8;
