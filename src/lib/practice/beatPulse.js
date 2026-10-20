/**
 * beatPulse.js — the hit line brightening on the beat.
 *
 * The grid shows where beats are; nothing showed when one arrives, and with
 * the sound low the count-in was easy to miss. During the count-in, and while
 * the metronome is on, the line flashes on each beat and a little more on the
 * first beat of a bar. Off for reduced motion.
 */

/** How much of a beat the flash takes to fade. */
export const PULSE_LENGTH = 0.2;
/** An off-beat's flash against a downbeat's. */
export const OFFBEAT = 0.55;

/**
 * 0 to 1: how bright the line is at score time `time` (negative through the count-in).
 * @param {number} time seconds of score time
 * @param {{ bpm?: number, timeSignature?: number[] }} score
 * @param {{ countIn?: boolean, metronome?: boolean, playing?: boolean, calm?: boolean }} state
 */
export function beatPulse(time, score, { countIn = false, metronome = false, playing = false, calm = false } = {}) {
  if (calm || !score || !Number.isFinite(time) || !(countIn || (metronome && playing))) return 0;
  const beat = 60 / (score.bpm || 100);
  const perBar = Math.max(1, score.timeSignature?.[0] ?? 4);
  const beats = time / beat + 1e-9;
  const index = Math.floor(beats);
  const phase = beats - index;
  if (phase >= PULSE_LENGTH) return 0;
  const downbeat = ((index % perBar) + perBar) % perBar === 0;
  return (downbeat ? 1 : OFFBEAT) * (1 - phase / PULSE_LENGTH);
}

/**
 * Paints the flash along the line from `from` to `to` (screen points), with a soft glow on the side the notes
 * come from: above a level line (the piano roll), to the right of an upright one (the string tab, the drum lanes).
 */
export function paintBeatPulse(ctx, { pulse, from, to, colour, glow = 26 }) {
  if (!(pulse > 0) || !ctx) return;
  ctx.save();
  const upright = Math.abs(to.x - from.x) < Math.abs(to.y - from.y);
  const fade = upright ? ctx.createLinearGradient(from.x + glow, 0, from.x, 0) : ctx.createLinearGradient(0, Math.min(from.y, to.y) - glow, 0, Math.max(from.y, to.y));
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, colour);
  ctx.globalAlpha = pulse * 0.3;
  ctx.fillStyle = fade;
  if (upright) ctx.fillRect(from.x, Math.min(from.y, to.y), glow, Math.abs(to.y - from.y));
  else ctx.fillRect(from.x, Math.min(from.y, to.y) - glow, to.x - from.x, Math.abs(to.y - from.y) + glow);
  ctx.globalAlpha = pulse * 0.9;
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

/** Has the reader asked for less movement? The query is made once and read live, as it is checked every frame. */
let motionQuery = null;
export function reducedMotion() {
  motionQuery ??= globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
  return !!motionQuery?.matches;
}
