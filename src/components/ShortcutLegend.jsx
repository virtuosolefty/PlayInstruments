import { FOOTER_KEYS } from '../lib/app/shortcuts.js';

/**
 * The keys that work while you practise, as key caps in the studio's footer,
 * the way a desktop tool's status bar lists its shortcuts. They were printed
 * only on the buttons, and only on wide screens. Space always shows; the rest
 * give way on narrower windows and on touch screens (studio-layout.css).
 */
export default function ShortcutLegend() {
  return (
    <span className="shortcut-legend" role="group" aria-label="Keyboard shortcuts">
      {FOOTER_KEYS.map(({ keys, label }) => (
        <span key={label} className="shortcut">
          {keys.map(key => <kbd key={key}>{key}</kbd>)}
          <span>{label}</span>
        </span>
      ))}
    </span>
  );
}
