import { useEffect, useState } from 'react';

/** How long the chrome stays back at full strength after the pointer moves. */
const AWAKE_MS = 2500;

/**
 * While `active` (a run is playing), true for a moment after each pointer
 * movement, so the faded chrome comes back when someone reaches for it and
 * steps back again when they return to the keys.
 */
export function useAwake(active, ms = AWAKE_MS) {
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!active) { setAwake(false); return undefined; }
    let timer = null;
    const wake = () => {
      setAwake(true);
      clearTimeout(timer);
      timer = setTimeout(() => setAwake(false), ms);
    };
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener('pointermove', wake); window.removeEventListener('pointerdown', wake); };
  }, [active, ms]);
  return awake;
}
