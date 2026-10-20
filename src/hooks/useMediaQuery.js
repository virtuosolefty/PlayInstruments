import { useEffect, useState } from 'react';

/**
 * Layout decisions that CSS cannot make.
 *
 * Most of the responsive work belongs in the stylesheet, and is there. This is
 * for the cases where a control has to move to a *different place in the tree*
 * rather than change how it looks — the view and hand switches leave the
 * toolbar and reappear inside the options popover on a tablet, and rendering
 * both copies and hiding one would put two live controls on the same state.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(query).matches
      : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const list = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(list.matches);
    // `addListener` is the Safari < 14 spelling; still worth keeping, since an
    // iPad is exactly the device this hook exists for.
    if (list.addEventListener) list.addEventListener('change', onChange);
    else list.addListener(onChange);
    return () => {
      if (list.removeEventListener) list.removeEventListener('change', onChange);
      else list.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/** Below this the feedback panel becomes a slide-over rather than a column. */
export const NARROW_QUERY = '(max-width: 900px)';
/** An upright phone: the same test phone.css lays the studio out for. */
export const PHONE_QUERY = '(max-width: 600px) and (min-height: 521px)';
/** A short landscape screen, such as a phone held sideways: the same test landscape.css lays the studio out for; 960px wide at most, so a short desktop window keeps its layout. */
export const SHORT_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 520px) and (max-width: 960px)';
