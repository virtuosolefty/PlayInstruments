import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * The three stops, in order. A stop whose control is not on screen (a phone's folded header) is passed over.
 * `touch` is the wording for a touch screen, where there is no space bar and no number keys.
 */
const TOUR_STOPS = Object.freeze([
  Object.freeze({ target: '.pad-play', title: 'Start when you are ready', body: 'Press Play, or the space bar. In Wait for me the notes hold at the line until you play them, so there is no rush.',
    touch: 'Tap Play when you are ready. In Wait for me the notes hold at the line until you play them, so there is no rush.' }),
  Object.freeze({ target: '.zone-mode .mode-switch', title: 'Three ways to practise', body: 'Listen plays the piece to you. Practice keeps time and scores your run. Wait for me stops at each note. Keys 1, 2 and 3 switch between them.',
    touch: 'Listen plays the piece to you. Practice keeps time and scores your run. Wait for me stops at each note until you play it.' }),
  Object.freeze({ target: '.setup-trigger', title: 'How you play', body: 'Input & sound is where you choose a MIDI keyboard, your microphone or the computer keys, and check that you are heard.' }),
]);

const GAP = 12;
/** The tour waits for the studio to settle (and to finish placing focus on the stage) before it speaks. */
const TOUR_DELAY_MS = 600;
const visibleRect = selector => {
  const el = document.querySelector(selector);
  const r = el?.getBoundingClientRect();
  return r && r.width > 0 && r.height > 0 ? r : null;
};

/**
 * A first-visit tour of the studio: one spotlight at a time on the three
 * controls that matter first. It blocks nothing — the page stays usable under
 * it — and Escape, Skip or finishing ends it for good (Help can replay it).
 */
export default function CoachTour({ onDone }) {
  const stops = TOUR_STOPS.filter(stop => visibleRect(stop.target));
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [tipHeight, setTipHeight] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), TOUR_DELAY_MS); return () => clearTimeout(t); }, []);
  const nextRef = useRef(null);
  const tipRef = useRef(null);
  const stop = stops[index];
  const touch = !!globalThis.matchMedia?.('(pointer: coarse)').matches;

  const measure = useCallback(() => { setRect(stop ? visibleRect(stop.target) : null); }, [stop]);
  useLayoutEffect(() => { measure(); }, [measure, ready]);
  useLayoutEffect(() => { setTipHeight(tipRef.current?.offsetHeight ?? 0); }, [index, rect]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [measure]);
  useEffect(() => { if (ready) nextRef.current?.focus({ preventScroll: true }); }, [index, ready]);
  useEffect(() => {
    if (!ready) return undefined;
    const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); onDone(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onDone, ready]);
  useEffect(() => { if (!stops.length) onDone(); }, [stops.length, onDone]);
  if (!ready || !stop || !rect) return null;

  const last = index === stops.length - 1;
  const width = Math.min(320, window.innerWidth - 2 * GAP);
  const left = Math.max(GAP, Math.min(rect.left, window.innerWidth - width - GAP));
  const above = rect.top - GAP - tipHeight >= GAP;
  const top = above ? rect.top - GAP - tipHeight : Math.min(rect.bottom + GAP, window.innerHeight - tipHeight - GAP);
  return <div className="coach-tour">
    <div className="coach-hole" aria-hidden="true" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />
    <section className={`coach-tip ${above ? 'above' : 'below'}`} ref={tipRef} role="dialog" aria-modal="false" aria-labelledby="coach-title" aria-describedby="coach-body"
      style={{ left, top, width, '--arrow-x': `${Math.max(16, Math.min(width - 28, rect.left + rect.width / 2 - left - 6))}px` }}>
      <h2 id="coach-title">{stop.title}</h2>
      <p id="coach-body">{touch && stop.touch ? stop.touch : stop.body}</p>
      <div className="coach-row">
        <span className="coach-count">{index + 1} of {stops.length}</span>
        <button type="button" onClick={onDone}>Skip tour</button>
        <button type="button" className="primary" ref={nextRef} onClick={() => (last ? onDone() : setIndex(i => i + 1))}>{last ? 'Done' : 'Next'}</button>
      </div>
    </section>
  </div>;
}
