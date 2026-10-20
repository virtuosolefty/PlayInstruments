import { drumForMidi } from './drums.js';

/**
 * How each kit is tuned. The acoustic kit is the one practised; the electronic one is heard when the whole-instrument
 * view shows the electronic kit (technique.js): a long, booming kick that sweeps down, a snappy snare, toms that
 * sweep like a drum machine's, and short, bright cymbals.
 */
const KITS = Object.freeze({
  acoustic: {
    kick: { pitchDecay: 0.045, octaves: 7, decay: 0.38, volume: -2, note: 'C1' },
    snare: { note: 'G2', pitchDecay: 0.02, octaves: 3, decay: 0.12, volume: -12, rattle: [{ type: 'highpass', frequency: 1800 }, 0.19, -9] },
    toms: { pitchDecay: 0.08, octaves: 2.5, decay: 0.34, notes: ['A2', 'E2', 'B1'] },
    closedHat: [{ type: 'highpass', frequency: 7500 }, 0.05, -14],
    openHat: [{ type: 'highpass', frequency: 7000 }, 0.38, -15],
    crash: [{ type: 'bandpass', frequency: 6500, Q: 0.4 }, 1.5, -11],
    ride: [{ type: 'bandpass', frequency: 9000, Q: 1.2 }, 0.55, -15],
  },
  electronic: {
    kick: { pitchDecay: 0.09, octaves: 5, decay: 0.75, volume: -1, note: 'A0' },
    snare: { note: 'D3', pitchDecay: 0.01, octaves: 1.5, decay: 0.16, volume: -10, rattle: [{ type: 'bandpass', frequency: 3200, Q: 0.7 }, 0.16, -7] },
    toms: { pitchDecay: 0.18, octaves: 3, decay: 0.5, notes: ['C3', 'G2', 'D2'] },
    closedHat: [{ type: 'highpass', frequency: 9500 }, 0.035, -13],
    openHat: [{ type: 'highpass', frequency: 9000 }, 0.26, -14],
    crash: [{ type: 'highpass', frequency: 5000 }, 1.1, -12],
    ride: [{ type: 'bandpass', frequency: 10500, Q: 2 }, 0.42, -15],
  },
});

/**
 * A drum kit, synthesized: no samples to download, like the app's other
 * built-in voices. Drums are a pitched thump (a membrane) and cymbals and the
 * snare's rattle are filtered noise.
 *
 * It answers the same calls as the pitched instruments, so the audio engine,
 * the reference scheduler and live input use it unchanged. A drum cannot be
 * held, so releases do nothing.
 *
 * @param {object} Tone the tone module (passed in so a test can stand in for it)
 * @param {object} output the node to play into
 * @param {'acoustic'|'electronic'} [kitName] which kit it sounds like
 */
export function buildDrumVoice(Tone, output, kitName = 'acoustic') {
  const kit = KITS[kitName] ?? KITS.acoustic;
  const nodes = [];
  const keep = node => { nodes.push(node); return node; };
  const bus = keep(new Tone.Gain(0.9)).connect(output);

  const membrane = (label, options) => keep(new Tone.MembraneSynth({ label, ...options })).connect(bus);
  const noise = (label, filter, decay, volume) => {
    const shaped = keep(new Tone.Filter(filter)).connect(bus);
    return keep(new Tone.NoiseSynth({ label, noise: { type: 'white' }, envelope: { attack: 0.001, decay, sustain: 0, release: 0.05 }, volume })).connect(shaped);
  };
  const tom = label => membrane(label, { pitchDecay: kit.toms.pitchDecay, octaves: kit.toms.octaves, envelope: { attack: 0.001, decay: kit.toms.decay, sustain: 0, release: 0.2 }, volume: -6 });

  const kick = membrane('kick', { pitchDecay: kit.kick.pitchDecay, octaves: kit.kick.octaves, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: kit.kick.decay, sustain: 0, release: 0.2 }, volume: kit.kick.volume });
  const snareBody = membrane('snare', { pitchDecay: kit.snare.pitchDecay, octaves: kit.snare.octaves, envelope: { attack: 0.001, decay: kit.snare.decay, sustain: 0, release: 0.1 }, volume: kit.snare.volume });
  const snareRattle = noise('snare', ...kit.snare.rattle);
  const [high, mid, floor] = kit.toms.notes;
  const toms = { 'tom-high': [tom('tom-high'), high], 'tom-mid': [tom('tom-mid'), mid], 'tom-floor': [tom('tom-floor'), floor] };
  const closedHat = noise('hihat', ...kit.closedHat);
  const openHat = noise('hihat-open', ...kit.openHat);
  const crash = noise('crash', ...kit.crash);
  const ride = noise('ride', ...kit.ride);

  const hits = {
    kick: (time, strength) => kick.triggerAttackRelease(kit.kick.note, 0.3, time, strength),
    snare: (time, strength) => { snareBody.triggerAttackRelease(kit.snare.note, 0.1, time, strength); snareRattle.triggerAttackRelease(kit.snare.rattle[1], time, strength); },
    // Closing the hats cuts off an open one, as the pedal does.
    hihat: (time, strength) => { openHat.triggerRelease(time); closedHat.triggerAttackRelease(kit.closedHat[1], time, strength); },
    'hihat-open': (time, strength) => openHat.triggerAttackRelease(kit.openHat[1], time, strength),
    crash: (time, strength) => crash.triggerAttackRelease(kit.crash[1], time, strength),
    ride: (time, strength) => ride.triggerAttackRelease(kit.ride[1], time, strength),
    ...Object.fromEntries(Object.entries(toms).map(([id, [voice, pitch]]) => [id, (time, strength) => voice.triggerAttackRelease(pitch, 0.25, time, strength)])),
  };

  const strike = (name, time, velocity = 0.8) => {
    const piece = drumForMidi(Tone.Frequency(name).toMidi());
    if (!piece) return;
    try {
      hits[piece.id](time, Math.min(1, Math.max(0.05, velocity)));
    } catch {
      // A monophonic voice refuses a hit timed before its last one, which a live
      // hit landing just ahead of a scheduled one can be. That hit is dropped.
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
