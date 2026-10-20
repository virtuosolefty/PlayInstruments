import { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { reducedMotion } from '../lib/practice/beatPulse.js';

/** True when a settings update moves to another screen: the learning home, a lesson or the studio. */
export const screenChanged = (before, after) => (before?.learningView ?? 'studio') !== (after?.learningView ?? 'studio');

/** The View Transitions API is there, the page is in view, and nobody asked for less motion. */
export function canTransition(doc = globalThis.document) {
  return typeof doc?.startViewTransition === 'function' && doc.visibilityState === 'visible'
    && !reducedMotion();
}

/**
 * Wraps setSettings so a change of screen cross-fades, with the piece's title
 * carried across (patterns.css), instead of swapping the page in one frame.
 * Any other update goes straight through. Browsers without the API, and
 * reduced motion, change at once as before.
 */
export function useScreenTransition(setSettings, settings) {
  const latest = useRef(settings);
  latest.current = settings;
  return useCallback(update => {
    const now = latest.current;
    const next = typeof update === 'function' ? update(now) : update;
    if (!screenChanged(now, next) || !canTransition()) { setSettings(update); return; }
    const transition = document.startViewTransition(() => { flushSync(() => setSettings(update)); });
    // A second change of screen before this one finishes skips its animation, and the browser rejects its promises
    // ("Transition was skipped"). The update itself still lands; only the cross-fade is dropped.
    for (const done of [transition.ready, transition.finished, transition.updateCallbackDone]) done?.catch?.(() => {});
  }, [setSettings]);
}
