import { webglAvailable } from '../lib/stage/webgl.js';

/**
 * 2D or 3D, on the stage itself rather than inside Instrument settings: how
 * you see the piece is a question you ask while looking at the stage. The
 * buttons read 2D and 3D; their names keep the full words a screen reader and
 * the browser tests know them by.
 *
 * @param {{ settings: object, setSettings: Function }} props
 */
export function StageAppearance({ settings, setSettings }) {
  const available = webglAvailable();
  const renderer = available ? settings.renderer : 'canvas';
  return (
    <div className="stage-appearance" role="group" aria-label="Stage appearance">
      {['canvas', 'gl'].map(value => (
        <button key={value} type="button" aria-pressed={renderer === value} aria-label={value === 'gl' ? '3D Stage' : '2D Trainer'}
          disabled={value === 'gl' && !available}
          title={value === 'gl' ? (available ? 'The 3D stage' : '3D is unavailable on this browser. The 2D trainer is ready to use.') : 'The 2D trainer'}
          onClick={() => setSettings(s => ({ ...s, renderer: value }))}>{value === 'gl' ? '3D' : '2D'}</button>
      ))}
    </div>
  );
}

/** The piano's three ways to show the music, as `settings.view` names them. */
const PIANO_VIEWS = [
  { value: 'roll', label: 'Falling notes', short: 'Notes', title: 'Falling notes only.' },
  { value: 'both', label: 'Notes + score', short: 'Score', title: 'Notation above the falling notes.' },
  { value: 'staff', label: 'Sheet music', short: 'Sheet', title: 'Notation only. Read it properly.' },
];

/**
 * The piano's view switch, centred at the top of its stage the way a design
 * tool puts "2D plan | 3D view" on its canvas. Falling notes, notes with the
 * score, or sheet music, then 2D or 3D. In free play there is no score, so
 * only 2D and 3D remain; in a lesson, which keeps to its falling notes, only
 * 2D and 3D too, at the top left, clear of the step card.
 *
 * @param {{ settings: object, setSettings: Function, freePlay?: boolean }} props
 */
export default function StageViews({ settings, setSettings, freePlay = false, lesson = false }) {
  return (
    <div className="stage-views-anchor">
      <div className={`stage-views ${lesson ? 'in-lesson' : ''}`}>
        {!freePlay && !lesson && (
          <div className="stage-music-view" role="group" aria-label="How to show the music">
            {PIANO_VIEWS.map(view => (
              <button key={view.value} type="button" aria-pressed={settings.view === view.value} aria-label={view.label} title={view.title}
                onClick={() => setSettings(s => ({ ...s, view: view.value }))}>
                <span className="view-long">{view.label}</span><span className="view-short">{view.short}</span>
              </button>
            ))}
          </div>
        )}
        <StageAppearance settings={settings} setSettings={setSettings} />
      </div>
    </div>
  );
}
