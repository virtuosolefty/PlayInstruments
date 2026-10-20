import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * The View pop-over on the guitar, bass, violin and cello: the options you set
 * once and leave (frets or reach, labels, label size, handedness), kept out of
 * the row you look at every run.
 *
 * A disclosure rather than a dialog, so the controls stay in the page's tab
 * order. It closes on Escape and on a press anywhere outside it, as a menu
 * does; `<details>` alone does neither. A list inside it closes first.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children the labelled controls
 */
export default function ViewOptions({ children }) {
  const [open, setOpen] = useState(false);
  const host = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    // A list opened from inside is portaled to the body, so a press in it is not outside.
    const outside = event => { if (!host.current?.contains(event.target) && !event.target.closest?.('.listbox-list')) setOpen(false); };
    const escape = event => {
      // Escape on an open list closes the list, not the pop-over around it.
      if (event.key !== 'Escape' || event.target.closest?.('[role="combobox"][aria-expanded="true"]')) return;
      event.stopPropagation();
      setOpen(false);
      host.current?.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', outside);
    host.current?.addEventListener('keydown', escape);
    const el = host.current;
    return () => { document.removeEventListener('pointerdown', outside); el?.removeEventListener('keydown', escape); };
  }, [open]);
  return (
    <details className="view-options" ref={host} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary title="Frets, labels and handedness"><Icon name="sliders" size={14} /><span className="tool-label">View</span></summary>
      <div className="view-options-panel">{children}</div>
    </details>
  );
}
