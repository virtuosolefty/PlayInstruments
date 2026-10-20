import { TABLA } from './tabla.js';

/**
 * The tabla, synthesized, like the app's other built-in voices: nothing to download.
 *
 * The dayan is tuned: its strokes are pitched (Na rings bright with overtones, Tin softer, Tun the open
 * fundamental), with a click of the finger at the start; Te is a dry, closed tap. The bayan's Ge is a deep membrane
 * whose pitch slides down, as the heel of the hand presses the skin; Ke is a flat, damped slap.
 *
 * It answers the same calls as the pitched voices, so the engine, the scheduler and live input use it unchanged.
 *
 * @param {object} Tone the tone module (passed in so a test can stand in for it)
 * @param {object} output the node to play into
 */
export function buildTablaVoice(Tone, output) {
  const nodes = [];
  const keep = node => { nodes.push(node); return node; };
  const bus = keep(new Tone.Gain(0.9)).connect(output);
  /** The dayan's tonic: Sa, here C#5, a common pitch for a dayan. */
  const SA = 'C#5';

  const ring = (label, partials, decay, volume) => keep(new Tone.PolySynth(Tone.Synth, {
    label, maxPolyphony: 4, oscillator: { type: 'custom', partials }, envelope: { attack: 0.001, decay, sustain: 0, release: 0.08 }, volume,
  })).connect(bus);
  const noise = (label, filter, decay, volume) => {
    const shaped = keep(new Tone.Filter(filter)).connect(bus);
    return keep(new Tone.NoiseSynth({ label, noise: { type: 'pink' }, envelope: { attack: 0.001, decay, sustain: 0, release: 0.02 }, volume })).connect(shaped);
  };

  const na = ring('na', [1, 0.7, 0.55, 0.42, 0.3, 0.2], 0.45, -12);
  const tin = ring('tin', [1, 0.45, 0.25, 0.12], 0.7, -13);
  const tun = ring('tun', [1, 0.2, 0.06], 1.1, -10);
  const finger = noise('finger', { type: 'bandpass', frequency: 3200, Q: 0.8 }, 0.025, -20);
  const te = noise('te', { type: 'bandpass', frequency: 1800, Q: 1.4 }, 0.06, -12);
  const ge = keep(new Tone.MembraneSynth({ label: 'ge', pitchDecay: 0.32, octaves: 1.3, oscillator: { type: 'sine' }, envelope: { attack: 0.002, decay: 0.9, sustain: 0, release: 0.3 }, volume: -4 })).connect(bus);
  const ke = noise('ke', { type: 'lowpass', frequency: 700 }, 0.07, -8);

  const strokes = {
    na: (time, strength) => { na.triggerAttackRelease(SA, 0.4, time, strength); finger.triggerAttackRelease(0.02, time, strength * 0.6); },
    tin: (time, strength) => tin.triggerAttackRelease(SA, 0.6, time, strength),
    tun: (time, strength) => tun.triggerAttackRelease('C#4', 1, time, strength),
    te: (time, strength) => te.triggerAttackRelease(0.06, time, strength),
    // The bayan's skin is struck a little above its rest pitch and sinks to it.
    ge: (time, strength) => ge.triggerAttackRelease('D2', 0.8, time, strength),
    ke: (time, strength) => ke.triggerAttackRelease(0.07, time, strength),
  };

  const strike = (name, time, velocity = 0.8) => {
    const piece = TABLA.forMidi(Tone.Frequency(name).toMidi());
    if (!piece) return;
    try {
      strokes[piece.id](time, Math.min(1, Math.max(0.05, velocity)));
    } catch {
      // A monophonic voice refuses a stroke timed before its last one; that stroke is dropped.
    }
  };

  return {
    triggerAttackRelease: (name, _duration, time, velocity) => strike(name, time, velocity),
    triggerAttack: (name, time, velocity) => strike(name, time, velocity),
    triggerRelease() {},
    releaseAll() {},
    dispose() { nodes.forEach(node => node.dispose()); },
  };
}
