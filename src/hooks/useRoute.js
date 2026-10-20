import { useEffect, useRef, useState } from 'react';
import { changesScreen, parseRoute, routeHash } from '../lib/app/route.js';

/** How long an address from the bar is given to arrive (an instrument, then a library, then a piece). */
const ARRIVE_MS = 4000;

/**
 * Keeps the address bar and the screen in step (ui-ux-pro-max deep-linking,
 * back-behavior).
 *
 * The screen writes its address: a change of screen is a new history entry,
 * so Back steps back to the last screen; a new piece or instrument replaces
 * the entry. An address from the bar (a bookmark on load, or Back and
 * Forward) is applied through `apply`, one step at a time: a step is taken
 * only when the screen has moved since the last one (an instrument changed,
 * a piece loaded), so a step that waits on a load is not repeated. `apply`
 * returns false for an address the app cannot reach (a lesson that is not
 * there), which is let go at once; one that never arrives is let go after
 * ARRIVE_MS. Either way the screen's own address is written instead.
 *
 * @param {{ view: string, instrument: string, id?: string|null, free?: boolean }} route the screen now
 * @param {(target: object) => boolean|void} apply moves the app one step toward `target`; false when it cannot get there
 * @param {boolean} [ready] false while the app cannot be steered yet (its library not loaded)
 */
export function useRoute(route, apply, ready = true) {
  const written = useRef(null);
  const wanted = useRef(null);
  const since = useRef(0);
  const steppedFrom = useRef(null);
  // A render once the time is up, since an idle app does not render on its own.
  const [, recheck] = useState(0);
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const hash = routeHash(route);

  // Read: the address on load, and on Back and Forward.
  useEffect(() => {
    const take = () => {
      const target = parseRoute(window.location.hash);
      if (!target) return;
      wanted.current = target;
      since.current = Date.now();
      steppedFrom.current = null;
    };
    take();
    // Back and Forward fire popstate; an address typed into the bar fires hashchange. Either way, render to steer.
    const onMove = () => { take(); recheck(n => n + 1); };
    window.addEventListener('popstate', onMove);
    window.addEventListener('hashchange', onMove);
    return () => { window.removeEventListener('popstate', onMove); window.removeEventListener('hashchange', onMove); };
  }, []);

  // Steer toward an address from the bar, or write the screen's own.
  useEffect(() => {
    if (!ready) return;
    const target = wanted.current;
    if (target) {
      if (routeHash(target) === hash) { wanted.current = null; written.current = route; return; }
      if (Date.now() - since.current < ARRIVE_MS) {
        let reachable = true;
        if (steppedFrom.current !== hash) {
          steppedFrom.current = hash;
          reachable = applyRef.current(target) !== false;
        }
        if (reachable) {
          const timer = setTimeout(() => recheck(n => n + 1), ARRIVE_MS + 50);
          return () => clearTimeout(timer);
        }
      }
      wanted.current = null;
    }
    if (window.location.hash === hash) { written.current = route; return; }
    const method = changesScreen(written.current, route) && written.current ? 'pushState' : 'replaceState';
    window.history[method](null, '', hash);
    written.current = route;
  });
}
