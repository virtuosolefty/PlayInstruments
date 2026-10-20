/**
 * audioOutput.js — the last stage every sound passes through.
 *
 * Many notes struck hard at once (a hand rolled across the handpan, a full piano chord, a controller sending
 * velocity 127) add up past full scale, and the browser clips them into harsh distortion. Two stages stop that:
 *
 * - a limiter just under full scale, which turns sustained loud passages down;
 * - a soft safety stage after it, which leaves everything below 85% of full scale exactly as it is and rounds off
 *   only a peak the limiter was too slow for (a pile of strikes in a few milliseconds), so nothing can pass full
 *   scale. Rounding a rare peak off sounds like a slightly fuller note; clipping it sounds like a crackle.
 *
 * @param {object} Tone the tone module (passed in so a test, or an offline render, can use its own)
 * @param {object} [destination] where the output goes; the speakers unless given
 * @returns {{ master: object, limiter: object, safety: object }}
 */
export function buildOutput(Tone, destination = Tone.getDestination()) {
  const safety = new Tone.WaveShaper(safetyCurve(), CURVE_POINTS);
  safety.oversample = '4x';
  const into = new Tone.Gain(1 / HEADROOM).connect(safety);
  safety.connect(destination);
  const limiter = new Tone.Limiter(LIMIT_DB).connect(into);
  const master = new Tone.Gain(MASTER_GAIN).connect(limiter);
  return { master, limiter, safety };
}

/** Just under full scale, so a peak the limiter catches a moment late still stays clean. */
export const LIMIT_DB = -1;
export const MASTER_GAIN = 0.9;
/** Below this share of full scale the safety stage changes nothing. */
export const KNEE = 0.85;
/** The loudest input the safety stage shapes smoothly: four times full scale. A wave shaper reads -1 to 1, so the signal is scaled into that range and the curve scales it back. */
const HEADROOM = 4;
const CURVE_POINTS = 8193;

/** Unchanged up to the knee, then bent smoothly towards full scale, never past it. */
export const safety = x => {
  const size = Math.abs(x);
  if (size <= KNEE) return x;
  return Math.sign(x) * (KNEE + (1 - KNEE) * Math.tanh((size - KNEE) / (1 - KNEE)));
};

/** The safety stage as a wave shaper's curve, over inputs of -HEADROOM to HEADROOM. */
export const safetyCurve = () => Float32Array.from({ length: CURVE_POINTS }, (_, i) => safety(((i / (CURVE_POINTS - 1)) * 2 - 1) * HEADROOM));
