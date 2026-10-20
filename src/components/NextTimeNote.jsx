import { useEffect, useId, useRef, useState } from 'react';
import { actionLabel, cleanNote, MAX_NOTE, noteAction } from '../lib/practice/pieceNotes.js';

const DAY_MS = 86_400_000;
/** "Today", "Yesterday", a weekday within the week, a date after that. */
export function whenWritten(at, now = Date.now()) {
  const then = new Date(at);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(then).setHours(0, 0, 0, 0)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return then.toLocaleDateString(undefined, days < 7 ? { weekday: 'long' } : { day: 'numeric', month: 'short' });
}

/** In the guide, before a run: your own words from last time, and a one-press loop when they name a bar. */
export function NextTimeNote({ note, score, onAction, onClear }) {
  if (!note?.text) return null;
  const action = noteAction(note.text, score);
  return <div className="next-time-note" role="note" aria-label="Your note from last time">
    <span className="eyebrow"><span>From last time</span><span>{whenWritten(note.at)}</span></span>
    <q>{note.text}</q>
    <div className="actions">
      {action && <button type="button" className="text-button" onClick={() => onAction(action)}>{actionLabel(action)}</button>}
      <button type="button" className="text-button quiet" onClick={onClear}>Clear note</button>
    </div>
  </div>;
}

/**
 * In the report: one line for next time. Saved when you leave the field, press
 * Enter or close the report, so nothing typed is lost to a stray Escape. Always
 * saved against the piece the report opened for, even if another is picked first.
 */
export function ReportNote({ pieceId, note, onChange }) {
  const id = useId();
  const piece = useRef(pieceId);
  const [draft, setDraft] = useState(note?.text ?? '');
  const saved = useRef(note?.text ?? '');
  const latest = useRef(draft);
  latest.current = draft;
  const save = () => {
    const text = cleanNote(latest.current);
    if (text === saved.current) return;
    saved.current = text;
    onChange(piece.current, text);
  };
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => () => saveRef.current(), []);
  return <div className="report-note">
    <label htmlFor={id}>Note for next time</label>
    <input id={id} type="text" maxLength={MAX_NOTE} value={draft} placeholder="Bar 5: the left hand comes in early. Try it at 70."
      onChange={e => setDraft(e.target.value)} onBlur={save} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }} />
  </div>;
}
