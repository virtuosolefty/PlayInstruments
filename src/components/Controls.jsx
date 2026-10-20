import Icon from './Icon.jsx';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialog } from '../hooks/useDialog.js';
import { MODES } from '../hooks/usePracticeEngine.js';
import { FIT_MODES, HAND_FILTERS } from '../lib/music/arrange.js';
import { ACTIONS, LEGENDS } from '../lib/app/shortcuts.js';
import { DRONE_LEVEL, droneFor, droneLevel } from '../lib/audio/drone.js';

// The clock runs negative through the count-in; floor-dividing that would
// render "-1:-3". Clamp instead — the countdown itself is on the roll.
const fmt = (s) => {
  const total = Math.max(0, s || 0);
  const m = Math.floor(total / 60);
  const sec = Math.floor(total % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const MODE_LABELS = [
  [MODES.LISTEN, 'Listen', 'Hear the reference performance. Nothing is scored.', ACTIONS.MODE_LISTEN],
  [MODES.PRACTICE, 'Practice', 'The clock runs. Pitch, timing and harmony are all scored.', ACTIONS.MODE_PRACTICE],
  [MODES.WAIT, 'Wait for me', 'The playhead stops at every chord until you play it correctly.', ACTIONS.MODE_WAIT, 'Wait'],
];

const HAND_LABELS = [
  [HAND_FILTERS.BOTH, 'Both hands', 'Practise the whole texture.'],
  [HAND_FILTERS.RIGHT, 'Right hand', 'Right hand only, usually narrow enough for a 25-key controller.'],
  [HAND_FILTERS.LEFT, 'Left hand', 'Left hand only.'],
];

export default function Controls({
  settings,
  setSettings,
  engine,
  score,
  onShowFeedback = null,
  // Lifted into App so the pad and the keyboard shortcut run the same code —
  // two implementations of one behaviour is the bug this codebase keeps
  // warning itself about.
  onHearOrTry,
  onToggleLoop,
  // On a wide screen Practice settings sits in the studio header beside Focus; the deck below the keys keeps the run.
  headerSlot = false,
}) {
  const { playing } = engine;
  const listening = settings.mode === MODES.LISTEN;
  const hasDrone = !!droneFor(settings.practiceInstrument);
  const patch = (p) => setSettings((s) => ({ ...s, ...p }));
  const fittingActive = settings.fit !== FIT_MODES.OFF;
  const referenceLocked = settings.mode === MODES.WAIT;
  const [open, setOpen] = useState(false);
  // On a phone the deck is one row (Play, mode, More); the tools, tempo and settings open beneath it.
  const [more, setMore] = useState(false);

  const optionsRef = useDialog({ open, onClose: () => setOpen(false) });
  // Looked up on every render, so a header that re-mounts never leaves the button in a detached node. The header's
  // slot is committed with this deck, so the first render puts the button inline; one more render once mounted moves it.
  const [, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const slot = headerSlot && typeof document !== 'undefined' ? document.getElementById('practice-settings-slot') : null;
  const inHeader = node => (slot ? createPortal(node, slot) : node);

  const loopActive = !!settings.loop;

  const handsSwitch = settings.practiceInstrument && settings.practiceInstrument !== 'piano' ? null : (
    <>
      {/* Falling notes, notes with the score or sheet music is chosen on the
          stage itself now (StageViews.jsx). */}
      <div className="mode-switch hands-switch" title="Which hand to practise">
        {HAND_LABELS.map(([value, label, title]) => (
          <button
            key={value}
            className={settings.hands === value ? 'on' : ''}
            onClick={() => patch({ hands: value })}
            title={title}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className={`controls deck ${more ? 'more-open' : ''}`}>
      {/* Four zones, in the order you use them: what kind of run this is, then
          starting it, then the dials you reach for mid-session, then the sound.
          One flat row of nine controls gave the metronome the same visual
          weight as Play; grouping is what tells you where to look without
          reading a single label.

          The legends are announced but not drawn — see .zone-label in the
          stylesheet. A machined groove between the plates says the same thing
          to the eye, and says it without costing the roll any height. */}
      <section className="zone zone-mode">
        <span className="zone-label">Mode</span>
        <div className="mode-switch">
          {MODE_LABELS.map(([value, label, title, action, short]) => (
            <button
              key={value}
              aria-pressed={settings.mode === value}
              className={settings.mode === value ? 'on' : ''}
              onClick={() => patch({ mode: value })}
              title={`${title}  (${LEGENDS[action]})`}
            >
              <i className="keycap" aria-hidden="true">
                {LEGENDS[action]}
              </i>
              {short ? <>{short}<span className="mode-rest">{label.slice(short.length)}</span></> : label}
            </button>
          ))}
        </div>
        {listening && <button className="pad your-turn" onClick={onHearOrTry} title="Start practising the phrase you just heard (backslash)"><span className="cap">Your turn</span><Icon name="turn" /></button>}
      </section>

      <section className="zone zone-transport">
        <span className="zone-label">Transport</span>
        <div className="pads">
          {/* Icon over word rather than icon alone. This is read from a metre
              away, sitting at a keyboard — far enough that a bare glyph is a
              guess unless you already speak DAW.

              `armed` goes on the instant a run starts and comes off when it
              stops, so the flash keyframe fires exactly once per run without a
              timer to take it back off again. */}
          <button
            className={`pad pad-play primary transport-toggle ${playing ? 'armed' : ''}`}
            onClick={() => (playing ? engine.actions.pause() : engine.actions.play())}
            title={`${playing ? 'Pause' : 'Play'}  (space)`}
          >
            <i className="keycap" aria-hidden="true">
              {LEGENDS[ACTIONS.PLAY_PAUSE]}
            </i>
            <i className="glyph" aria-hidden="true">
              <Icon name={playing ? 'pause' : 'play'} />
            </i>
            <span className="cap">{playing ? 'Pause' : 'Play'}</span>
          </button>

          <button
            className="pad"
            onClick={engine.actions.stop}
            disabled={!playing}
            title={`Stop and save this run  (${LEGENDS[ACTIONS.STOP]})`}
          >
            <i className="keycap" aria-hidden="true">
              {LEGENDS[ACTIONS.STOP]}
            </i>
            <i className="glyph" aria-hidden="true">
              <Icon name="stop" />
            </i>
            <span className="cap">Stop</span>
          </button>

          <button className="pad" onClick={engine.actions.restart} title="Restart and clear this run's score. No shortcut: it cannot be undone">
            <i className="glyph" aria-hidden="true">
              <Icon name="restart" />
            </i>
            <span className="cap">Restart</span>
          </button>

          <button
            className={`pad ${loopActive ? 'lit' : ''}`}
            onClick={onToggleLoop}
            aria-pressed={loopActive}
            disabled={!score?.duration}
            title={`Loop four bars from here  (${LEGENDS[ACTIONS.LOOP]})`}
          >
            <i className="keycap" aria-hidden="true">
              {LEGENDS[ACTIONS.LOOP]}
            </i>
            <i className="glyph" aria-hidden="true">
              <Icon name="loop" />
            </i>
            <span className="cap">Loop</span>
          </button>

          {/* Promoted out of the options popover. A metronome is something you
              reach for in the middle of a run, which is the definition of a
              transport control — it was sitting two clicks deep next to the
              things you set once a year. */}
          <button
            className={`pad pad-metronome ${settings.metronome ? 'lit' : ''}`}
            onClick={() => patch({ metronome: !settings.metronome })}
            aria-pressed={!!settings.metronome}
            title={`Metronome  (${LEGENDS[ACTIONS.METRONOME]})`}
          >
            <i className="keycap" aria-hidden="true">
              {LEGENDS[ACTIONS.METRONOME]}
            </i>
            <i className="glyph" aria-hidden="true">
              <Icon name="metronome" />
            </i>
            <span className="cap">Metronome</span>
          </button>

          {/* A drone to play over, for the veena and the handpan (drone.js): reached for mid-run like the metronome. */}
          {hasDrone && <button
            className={`pad pad-drone ${settings.drone ? 'lit' : ''}`}
            onClick={() => patch({ drone: !settings.drone })}
            aria-pressed={!!settings.drone}
            title="Drone: Sa and Pa on D, plucked as a tanpura holds them"
          >
            <i className="glyph" aria-hidden="true">
              <Icon name="drone" />
            </i>
            <span className="cap">Drone</span>
          </button>}
        </div>
      </section>

      <section className="zone zone-perf">
        <span className="zone-label">Performance</span>
        <div className="zone-row">
          {/* The clock earns a screen of its own. It was a run of grey text
              between two buttons, which is not how you read a number you glance
              at forty times a run. */}
          <div className="lcd" title="Position in the piece">
            <span className="lcd-time">{fmt(engine.songTime)}</span>
            <span className="lcd-total">/ {fmt(score?.duration ?? 0)}</span>
            <span className="lcd-bpm">{Math.round((score?.bpm ?? 0) * settings.rate)} bpm</span>
          </div>

          <span className="field" title="Playback speed: slow it down until it's clean, then push it up">
            Tempo
            {/* The mark is the written tempo: stars count toward the path only at or above it. */}
            <span className="tempo-slider">
              <input
                type="range"
                aria-label="Playback speed"
                min="0.4"
                max="1.5"
                step="0.05"
                value={settings.rate}
                onChange={(e) => patch({ rate: Number(e.target.value) })}
              />
              <i className="tempo-target" aria-hidden="true" />
            </span>
            <span className="val">{Math.round(settings.rate * 100)}%</span>
            {Math.abs(settings.rate - 1) > 0.001 && <button type="button" className="tempo-reset" onClick={() => patch({ rate: 1 })} title="Back to the written tempo. Stars count toward your path at 100% or faster.">Written tempo</button>}
          </span>
        </div>
      </section>

      <div className="spacer" />

      <section className="zone zone-sound">
        <span className="zone-label">Sound &amp; view</span>
        <div className="zone-row">
          

          {/* Only on the widths where the feedback column has been folded away. */}
          {onShowFeedback && (
            <button className="show-feedback" onClick={onShowFeedback} title="Show this run's feedback">
              <Icon name="panel" /> <span>This run</span>
            </button>
          )}

          {/* Everything you set once and forget lives behind here. Twenty
              controls in one row gave the metronome checkbox the same visual
              weight as Play, which is the wrong answer to "what do I press?". */}
          {inHeader(<div className="popover-host practice-settings-host">
            <button
              className={`options-toggle ${open ? 'on' : ''}`}
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open} aria-haspopup="dialog"
              title="Hands, reference audio, note labels and zoom"
            >
              <Icon name="target" /> <span>Practice settings</span>
            </button>

        {open && (
          <>
            <div className="popover-scrim" onClick={() => setOpen(false)} />
            <div className="popover" ref={optionsRef} role="dialog" aria-modal="true" aria-label="Practice settings" tabIndex={-1}>
              <div className="settings-heading"><strong>Practice settings</strong><button aria-label="Close practice settings" onClick={() => setOpen(false)}>×</button></div>
              {(settings.practiceInstrument ?? 'piano') === 'piano' && (
                <div className="popover-switches">
                  <span className="popover-label">Hands</span>
                  {handsSwitch}
                </div>
              )}
              <label
                className={`toggle ${referenceLocked ? 'disabled' : ''}`}
                title={
                  referenceLocked
                    ? 'Wait for me never plays the score to you. The playhead stops on the chord you have to find, so hearing it first would give the answer away.'
                    : 'Play the reference performance under your own playing'
                }
              >
                <input
                  type="checkbox"
                  disabled={referenceLocked}
                  checked={referenceLocked ? false : settings.referenceAudio}
                  onChange={(e) => patch({ referenceAudio: e.target.checked })}
                />
                Reference audio
              </label>

              {/* Metronome used to sit here. It is a lit pad in the transport
                  zone now — moved rather than duplicated, because two live
                  controls bound to one piece of state is a bug waiting for a
                  maintainer. */}
              <label className="toggle" title="Audible cue when you play a wrong note">
                <input
                  type="checkbox"
                  checked={settings.errorCues}
                  onChange={(e) => patch({ errorCues: e.target.checked })}
                />
                Error cues
              </label>

              <hr />

              {/* Two views, and the difference is not cosmetic — see the note
                  at the top of rollScene.js. The wording says what the second
                  one costs rather than leaving you to find out mid-run.

                  There were briefly three: a tilted orthographic "3D" sat
                  between these. It was removed because an orthographic camera
                  is affine, so tilting one produces a skewed 2D picture and
                  not depth — it was a worse version of both its neighbours. */}
              {/* Fingering answers "how do I play this?", which nothing else in
                  the app addresses. Only one label fits on a note, so it is a
                  choice rather than an addition. */}
              {(settings.practiceInstrument ?? 'piano') === 'piano' && <><div className="field stacked">
                <span>On each note</span>
                <div className="fit-switch">
                  {[
                    ['note', 'Name', 'The pitch: C4, F♯3.'],
                    ['finger', 'Finger', 'Which finger to use, 1 is the thumb. Only on pieces that carry fingering.'],
                    ['none', 'Nothing', 'Just the falling blocks.'],
                  ].map(([value, label, title]) => (
                    <button
                      key={value}
                      className={settings.noteLabels === value ? 'on' : ''}
                      onClick={() => patch({ noteLabels: value })}
                      title={title}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <hr />

              <label
                className="field stacked"
                title={
                  fittingActive
                    ? 'Fitting is placing the piece on your keyboard automatically. Use the octave arrows in Library ▸ Your keyboard instead.'
                    : "Shift the whole score in octaves, handy for the MPK Mini's 25 keys"
                }
              >
                <span>
                  Octave
                  <em>
                    {settings.transpose > 0 ? `+${settings.transpose / 12}` : settings.transpose / 12}
                  </em>
                </span>
                <input
                  type="range"
                  min="-24"
                  max="24"
                  step="12"
                  disabled={fittingActive}
                  value={settings.transpose}
                  onChange={(e) => patch({ transpose: Number(e.target.value) })}
                />
              </label></>}

              {hasDrone && <label className="field stacked" title="How loud the drone plays under your instrument">
                <span>
                  Drone volume<em>{droneLevel(settings)} dB</em>
                </span>
                <input
                  type="range"
                  min={DRONE_LEVEL.min}
                  max={DRONE_LEVEL.max}
                  step={DRONE_LEVEL.step}
                  value={droneLevel(settings)}
                  onChange={(e) => patch({ droneLevel: Number(e.target.value) })}
                />
              </label>}

              <label className="field stacked" title="Zoom the practice timeline">
                <span>
                  Zoom<em>{Math.round((settings.pps / 180) * 100)}%</em>
                </span>
                <input
                  type="range"
                  min="80"
                  max="380"
                  step="10"
                  value={settings.pps}
                  onChange={(e) => patch({ pps: Number(e.target.value) })}
                />
              </label>
            </div>
          </>
        )}
          </div>)}
        </div>
      </section>

      <button type="button" className="deck-more-toggle" aria-expanded={more} aria-label="More controls" title="Stop, restart, loop, metronome, tempo and settings" onClick={() => setMore(v => !v)}>
        <Icon name="more" />
      </button>
    </div>
  );
}
