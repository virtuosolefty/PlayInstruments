import Icon from './Icon.jsx';
import { inspectBar, noteNear, notesPerBar } from '../lib/practice/barInspect.js';
import { noteName } from '../lib/music/theory.js';

const MAX_CHART_BARS = 48;
const HAND = { right: 'Right', left: 'Left' };

/** "1 missed · 2 late", or the plain sentence for a clean bar. */
function slips({ missed, wrong, late }) {
  const parts = [missed && `${missed} missed`, wrong && `${wrong} wrong`, late && `${late} late`].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No slips recorded here yet';
}

/**
 * The side panel as an inspector, the way a design tool shows the selected
 * item: the bar you chose in the timeline or on the roll, its notes by hand,
 * their fingers, how your runs have gone there, and what you can do with it.
 * Closing it, or starting a run, brings the piece panel back.
 *
 * @param {object} props
 * @param {object} props.score
 * @param {number} props.bar 1-based
 * @param {{ time: number, midi: number }|null} [props.note] the place on the roll that was clicked, when it was
 * @param {object[]} [props.troubleSpots] stored slips across runs
 * @param {(bar: number) => void} props.onSelect choose another bar
 * @param {(from: number, to: number) => void} props.onHear hear a stretch, on a loop, unjudged
 * @param {(from: number, to: number) => void} props.onLoop loop a stretch to practise
 * @param {() => void} props.onClose
 */
export default function BarInspector({ score, bar, note = null, troubleSpots = [], onSelect, onHear, onLoop, onClose }) {
  const info = inspectBar(score, bar, troubleSpots);
  const picked = noteNear(score, bar, note);
  const density = notesPerBar(score);
  const peak = Math.max(1, ...density);
  const loopEnd = Math.min(info.bars, bar + 1);
  const both = info.hands.length > 1;
  const melody = info.hands[0];
  const title = melody ? `${melody.names.join(' · ')}${melody.more ? ' …' : ''}${both ? ', both hands' : ''}` : 'A rest';
  const fingers = info.hands.filter(h => h.fingers.length);
  return (
    <section className="section inspector" aria-label={`Bar ${bar} details`}>
      <div className="inspector-head">
        <span className="eyebrow">SELECTED · BAR {bar} OF {info.bars}</span>
        <button type="button" className="inspector-close" aria-label="Close bar details" onClick={onClose}><Icon name="close" size={14} /></button>
      </div>
      <h2>{title}</h2>
      {info.bars <= MAX_CHART_BARS && (
        <div className="bar-density" role="group" aria-label="Choose a bar">
          {density.map((count, i) => (
            <button key={i} type="button" aria-label={`Bar ${i + 1}`} aria-pressed={i + 1 === bar} style={{ '--h': `${Math.max(12, (count / peak) * 100)}%` }}
              onClick={() => onSelect(i + 1)} />
          ))}
        </div>
      )}
      <dl>
        {note && <><dt>Chosen note</dt><dd className="chosen-note">{picked ? `${picked.name} · ${picked.hand === 'left' ? 'left' : 'right'} hand${picked.finger ? ` · finger ${picked.finger}` : ''}` : `No ${noteName(note.midi)} in this bar`}</dd></>}
        <dt>Hands</dt><dd>{both ? 'Both' : melody ? HAND[melody.hand] : 'None'}</dd>
        <dt>Notes</dt><dd>{info.count}</dd>
        <dt>Fingers</dt><dd>{fingers.length ? fingers.map(h => <span key={h.hand} className="hand-fingers">{both && <small>{HAND[h.hand]}</small>}{h.fingers.join(' · ')}</span>) : 'Not written for this piece'}</dd>
        <dt>Your runs here</dt><dd>{slips(info.trouble)}</dd>
        <dt>Written tempo</dt><dd>{score?.bpm ? `${Math.round(score.bpm)} bpm` : 'Not given'}</dd>
      </dl>
      <div className="inspector-actions">
        <button type="button" onClick={() => onHear(info.from, info.to)}>Hear bar {bar}</button>
        <button type="button" onClick={() => onLoop(info.from, Math.min(score?.duration ?? Infinity, loopEnd * info.span))}>Loop bars {bar}{loopEnd > bar ? `–${loopEnd}` : ''}</button>
      </div>
      <p className="hint">Click any bar in the timeline, or a place on the roll, to see it here.</p>
    </section>
  );
}
