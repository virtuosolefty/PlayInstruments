import { useEffect, useId, useMemo, useState } from 'react';
import { glossaryFor, splitTerms } from '../lib/learning/glossary.js';

/**
 * Text whose musical words can be tapped for a one-line meaning, shown under
 * the line that holds them, the way a good reference app does it, instead of a
 * glossary paragraph at the bottom of the guide. A second tap, or Escape, hides
 * the meaning again.
 *
 * @param {object} props
 * @param {string} props.text
 * @param {string} [props.instrument] whose meanings to use
 * @param {'p'|'li'|'span'} [props.as] the element that holds the line
 * @param {string} [props.className]
 */
export default function TermText({ text, instrument = 'piano', as: Tag = 'p', className }) {
  const id = useId();
  const parts = useMemo(() => splitTerms(text, glossaryFor(instrument)), [text, instrument]);
  const [open, setOpen] = useState(null);
  useEffect(() => { setOpen(null); }, [text]);
  const shown = parts.find(p => p.term === open);
  return (
    <Tag className={className}>
      {parts.map((part, i) => (part.term
        ? <button key={i} type="button" className="term" aria-expanded={open === part.term} aria-controls={`${id}-meaning`}
            onClick={() => setOpen(o => (o === part.term ? null : part.term))}
            onKeyDown={e => { if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(null); } }}>{part.text}</button>
        : <span key={i}>{part.text}</span>))}
      <span id={`${id}-meaning`} className="term-meaning" aria-live="polite">
        {shown && <><b>{shown.term[0].toUpperCase() + shown.term.slice(1)}:</b> {shown.meaning}</>}
      </span>
    </Tag>
  );
}
