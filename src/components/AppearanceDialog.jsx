import { useDialog } from '../hooks/useDialog.js';
import { ACCENTS, appearanceFor } from '../lib/app/appearance.js';

const THEMES = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'black', label: 'True black' },
];

/** One row of pressed/unpressed buttons: a small segmented choice. */
function Choice({ label, options, value, onChoose, swatches = false }) {
  return <div className={`appearance-choice ${swatches ? 'swatches' : ''}`} role="group" aria-label={label}>
    {options.map(o => <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChoose(o.id)}>
      {swatches && <i className="swatch" style={{ background: o.swatch }} aria-hidden="true" />}{o.label}
    </button>)}
  </div>;
}

/**
 * Theme, the dark room's accent, true black and the text size, behind More.
 * Each choice applies at once, so the page behind the dialog is the preview.
 */
export default function AppearanceDialog({ settings, setSettings, onClose }) {
  const ref = useDialog({ onClose });
  const look = appearanceFor(settings);
  const set = patch => setSettings(s => ({ ...s, ...patch }));
  const theme = look.theme === 'light' ? 'light' : look.black ? 'black' : 'dark';
  return <div className="report-overlay"><section className="report appearance-dialog" role="dialog" aria-modal="true" aria-labelledby="appearance-title" ref={ref} tabIndex={-1}>
    <header className="settings-heading"><h2 id="appearance-title">Appearance</h2><button aria-label="Close appearance" onClick={onClose}>×</button></header>
    <div className="appearance-row">
      <h3>Theme</h3>
      <Choice label="Theme" options={THEMES} value={theme} onChoose={id => set({ theme: id === 'light' ? 'light' : 'dark', trueBlack: id === 'black' })} />
      <p className="hint">True black switches an OLED screen’s pixels off around the stage.</p>
    </div>
    <div className="appearance-row">
      <h3>Accent in the dark</h3>
      <Choice label="Accent in the dark" options={ACCENTS} value={look.accent} onChoose={darkAccent => set({ darkAccent })} swatches />
      <p className="hint">{look.theme === 'light' ? 'Used by the dark theme, and on the stage in both themes.' : 'Blue, green, red and amber stay for the music: now, right, missed and late.'}</p>
    </div>
    <div className="appearance-row">
      <h3>Text size</h3>
      <Choice label="Text size" options={[{ id: 'standard', label: 'Standard' }, { id: 'large', label: 'Large' }]} value={look.text} onChoose={textSize => set({ textSize })} />
      <p className="hint">Large is easier to read from the instrument. The stage and keys keep their size.</p>
    </div>
    <button onClick={onClose}>Done</button>
  </section></div>;
}
