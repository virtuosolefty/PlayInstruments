/**
 * audioSession.js — how a phone treats the app's sound.
 *
 * iOS plays a web page's Web Audio as "ambient" sound, which the ring/silent switch mutes: the app goes on making
 * sound (the level meter moves) and the iPhone's speaker says nothing. A page that is an instrument says it plays
 * media, and then the switch leaves it alone, as it does a video:
 *
 * - Safari 17 and later read `navigator.audioSession.type = 'playback'`;
 * - earlier iOS has no such switch, but a page that is playing an ordinary <audio> element is moved into the same
 *   playback category, so a moment of silence is looped on one, started in the tap that turned sound on.
 *
 * While the microphone listens, the session must be able to record: the choice goes back to the browser
 * (`'auto'`, which picks play-and-record for a page that captures), and comes back to playback when it stops.
 */

const PLAYBACK = 'playback', AUTO = 'auto';
let silentLoop = null;

/** An iPhone, iPad or iPod, including an iPad that presents itself as a Mac. */
export const isAppleTouch = (nav = globalThis.navigator) =>
  !!nav && (/iP(hone|ad|od)/.test(nav.userAgent ?? '') || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1));

/** A tenth of a second of silence as a WAV file: 16 kHz, 8-bit, mono, every sample at the midpoint. */
export function silentWav(samples = 1600, rate = 16000) {
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at, s) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + samples, true); text(8, 'WAVE');
  text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  text(36, 'data'); view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  return bytes;
}

/**
 * Tells the phone that the app plays media, so the silent switch does not mute it. Call it in the tap or key press
 * that turns sound on. Harmless where there is nothing to tell (a desktop browser).
 *
 * @returns {'session' | 'element' | null} how it was told
 */
export function preferPlayback(env = {}) {
  const nav = env.navigator ?? globalThis.navigator, doc = env.document ?? globalThis.document;
  const session = nav?.audioSession;
  if (session && 'type' in session) {
    try { if (session.type !== PLAYBACK) session.type = PLAYBACK; return 'session'; } catch { return null; }
  }
  if (!isAppleTouch(nav) || !doc?.createElement) return null;
  if (!silentLoop) {
    try {
      const url = (env.URL ?? globalThis.URL).createObjectURL(new Blob([silentWav()], { type: 'audio/wav' }));
      silentLoop = Object.assign(doc.createElement('audio'), { src: url, loop: true, preload: 'auto' });
      silentLoop.setAttribute('playsinline', '');
      silentLoop.setAttribute('aria-hidden', 'true');
    } catch { return null; }
  }
  silentLoop.play?.()?.catch?.(() => {});
  return 'element';
}

/** While the microphone listens: let the browser choose a session that can record. */
export function allowRecording(env = {}) {
  const session = (env.navigator ?? globalThis.navigator)?.audioSession;
  if (!session || !('type' in session)) return false;
  try { session.type = AUTO; return true; } catch { return false; }
}

/** When the microphone stops: back to playback, which the silent switch leaves alone. */
export function afterRecording(env = {}) {
  const session = (env.navigator ?? globalThis.navigator)?.audioSession;
  if (!session || !('type' in session)) return false;
  try { session.type = PLAYBACK; return true; } catch { return false; }
}
