import { describe, it, expect, beforeEach, vi } from 'vitest';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36';

// The silent loop is made once per page, so each test loads a fresh copy of the module.
let session;
beforeEach(async () => {
  vi.resetModules();
  session = await import('./audioSession.js');
});

function fakeDocument() {
  const made = [];
  return {
    made,
    createElement: tag => {
      const element = { tag, attributes: {}, plays: 0, setAttribute(k, v) { this.attributes[k] = v; }, play() { this.plays += 1; return Promise.resolve(); } };
      made.push(element);
      return element;
    },
  };
}
const fakeUrl = { createObjectURL: () => 'blob:silence' };

describe('isAppleTouch', () => {
  it('knows an iPhone, and an iPad that says it is a Mac', () => {
    expect(session.isAppleTouch({ userAgent: IPHONE })).toBe(true);
    expect(session.isAppleTouch({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  });
  it('leaves a Mac and a Windows PC alone', () => {
    expect(session.isAppleTouch({ userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
    expect(session.isAppleTouch({ userAgent: WINDOWS, platform: 'Win32' })).toBe(false);
    expect(session.isAppleTouch(undefined)).toBe(false);
  });
});

describe('silentWav', () => {
  it('is a well-formed WAV file of silence', () => {
    const bytes = session.silentWav(1600, 16000);
    const text = (at, n) => String.fromCharCode(...bytes.slice(at, at + n));
    const view = new DataView(bytes.buffer);
    expect(bytes.length).toBe(44 + 1600);
    expect([text(0, 4), text(8, 4), text(12, 4), text(36, 4)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
    expect(view.getUint32(4, true)).toBe(bytes.length - 8);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(8);
    expect(view.getUint32(40, true)).toBe(1600);
    // 8-bit samples are unsigned: 128 is the midpoint, so silence.
    expect(bytes.slice(44).every(b => b === 128)).toBe(true);
  });
});

describe('preferPlayback', () => {
  it('asks Safari 17+ for a playback session, which the silent switch leaves alone', () => {
    const navigator = { userAgent: IPHONE, audioSession: { type: 'auto' } };
    const document = fakeDocument();
    expect(session.preferPlayback({ navigator, document, URL: fakeUrl })).toBe('session');
    expect(navigator.audioSession.type).toBe('playback');
    expect(document.made).toEqual([]);
  });

  it('on an older iPhone, loops a moment of silence on an audio element, made once', () => {
    const navigator = { userAgent: IPHONE };
    const document = fakeDocument();
    expect(session.preferPlayback({ navigator, document, URL: fakeUrl })).toBe('element');
    expect(session.preferPlayback({ navigator, document, URL: fakeUrl })).toBe('element');
    expect(document.made).toHaveLength(1);
    const [loop] = document.made;
    expect(loop).toMatchObject({ tag: 'audio', src: 'blob:silence', loop: true, plays: 2 });
    expect(loop.attributes).toHaveProperty('playsinline');
  });

  it('does nothing on a desktop browser', () => {
    const document = fakeDocument();
    expect(session.preferPlayback({ navigator: { userAgent: WINDOWS }, document, URL: fakeUrl })).toBeNull();
    expect(document.made).toEqual([]);
  });

  it('survives a browser that refuses the setting, and a play() that is turned down', () => {
    const audioSession = { get type() { return 'auto'; }, set type(v) { throw new Error('nope'); } };
    expect(session.preferPlayback({ navigator: { audioSession } })).toBeNull();

    const document = fakeDocument();
    const refusing = { ...document, createElement: tag => ({ ...document.createElement(tag), play: () => Promise.reject(new Error('NotAllowedError')) }) };
    expect(session.preferPlayback({ navigator: { userAgent: IPHONE }, document: refusing, URL: fakeUrl })).toBe('element');
  });
});

describe('recording', () => {
  it('lets the browser choose a recording session while the microphone listens, then goes back to playback', () => {
    const navigator = { audioSession: { type: 'playback' } };
    expect(session.allowRecording({ navigator })).toBe(true);
    expect(navigator.audioSession.type).toBe('auto');
    expect(session.afterRecording({ navigator })).toBe(true);
    expect(navigator.audioSession.type).toBe('playback');
  });

  it('is a no-op where there is no audio session', () => {
    expect(session.allowRecording({ navigator: {} })).toBe(false);
    expect(session.afterRecording({ navigator: {} })).toBe(false);
  });
});
