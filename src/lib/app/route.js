/**
 * route.js — an address for every screen (ui-ux-pro-max deep-linking and
 * back-behavior). The app kept one address, /, for all of them, so Back left
 * the app and nothing could be bookmarked.
 *
 *   #/home/<instrument>                 the learning home
 *   #/lesson/<instrument>/<lesson id>   a guided lesson
 *   #/studio/<instrument>/<piece id>    the studio on a piece
 *   #/studio/<instrument>/free          free play
 *   #/library/<instrument>              the library, over the studio
 *
 * Pure, so the addresses can be tested without a browser. The lesson links
 * people already share (?instrument=…&lesson=…) are left to Entry.jsx.
 */
import { INSTRUMENTS } from '../instruments.js';

const VIEWS = ['home', 'lesson', 'studio', 'library'];
const FREE = 'free';

/** The address of a screen. */
export function routeHash({ view, instrument, id = null, free = false }) {
  const at = encodeURIComponent(instrument);
  if (view === 'home' || view === 'library') return `#/${view}/${at}`;
  if (view === 'lesson') return `#/lesson/${at}/${encodeURIComponent(id ?? '')}`;
  return `#/studio/${at}/${free ? FREE : encodeURIComponent(id ?? '')}`.replace(/\/$/, '');
}

/** The screen an address names, or null when it names none (an old link, a typo, an instrument the app does not have). */
export function parseRoute(hash) {
  const parts = String(hash ?? '').replace(/^#\/?/, '').split('/').filter(Boolean).map(part => {
    try { return decodeURIComponent(part); } catch { return null; }
  });
  const [view, instrument, rest] = parts;
  if (!VIEWS.includes(view) || !INSTRUMENTS.includes(instrument) || parts.includes(null)) return null;
  if (view === 'lesson') return rest ? { view, instrument, id: rest, free: false } : null;
  if (view === 'studio') return { view, instrument, id: rest && rest !== FREE ? rest : null, free: rest === FREE };
  return { view, instrument, id: null, free: false };
}

/** Whether moving between two routes changes screen, which is what Back steps over. A new piece or instrument is not. */
export const changesScreen = (from, to) => !from || from.view !== to.view;
