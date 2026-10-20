import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

/** Room left between the trigger and its list, and the tallest the list grows before it scrolls. */
const GAP = 6;
const MAX_HEIGHT = 320;

/**
 * A choice from a list, in place of a native <select>.
 *
 * The native control draws its own chevron against its edge and opens a list in
 * the operating system's style, so it could never match the rest of the app
 * (the ux-ui kit's rule, and its lint_native_select gate). This is the ARIA
 * "select-only combobox": the trigger keeps the focus and the control's name
 * (`role="combobox"`, so it is found exactly as the select was), shows the
 * chosen value, and moves through the list with aria-activedescendant. Arrows,
 * Home and End move; typing a letter jumps to the next choice starting with
 * it; Enter or Space chooses; Escape or Tab closes.
 *
 * The list is drawn over everything, in a portal fixed under the trigger (or
 * above it, near the bottom of the window), so a drawer, dialog or pop-over
 * that clips or scrolls cannot cut it off.
 *
 * @param {object} props
 * @param {string} props.label the accessible name, e.g. "Guitar exercise"
 * @param {string|number} props.value
 * @param {{ value: string|number, label: string }[]} [props.options] a flat list
 * @param {{ label?: string, options: { value: string|number, label: string }[] }[]} [props.groups] or headed groups
 * @param {(value: string) => void} props.onChange given the chosen value as a string, as a select's would be
 * @param {string} [props.className] for the trigger
 * @param {string} [props.title]
 * @param {boolean} [props.disabled]
 */
export default function Listbox({ label, value, options, groups, onChange, className = '', title, disabled = false }) {
  const id = useId();
  const listId = `${id}-list`;
  const sections = useMemo(() => groups ?? [{ options: options ?? [] }], [groups, options]);
  const flat = useMemo(() => sections.flatMap(section => section.options), [sections]);
  const chosen = flat.findIndex(option => String(option.value) === String(value));
  const [open, setOpen] = useState(false);
  const [rawActive, setActive] = useState(Math.max(0, chosen));
  // The choices can change while the list is open (a MIDI port unplugged): never point past the end.
  const active = Math.min(rawActive, Math.max(0, flat.length - 1));
  const [place, setPlace] = useState(null);
  // The list is drawn on the body, outside the stage: it takes the stage's dark colours with it when it opens from there.
  const [onStage, setOnStage] = useState(false);
  const trigger = useRef(null), list = useRef(null), typed = useRef({ text: '', at: 0 });

  const close = () => setOpen(false);
  const toggle = () => setOpen(o => !o && flat.length > 0);
  const choose = index => {
    const option = flat[index];
    if (option) onChange(String(option.value));
    close();
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const measure = event => {
      // The list scrolling itself is not a reason to move it.
      if (event?.target instanceof Node && list.current?.contains(event.target)) return;
      const box = trigger.current?.getBoundingClientRect();
      // A trigger hidden (its pop-over closed) or scrolled out of the window takes its list with it.
      if (!box || trigger.current.checkVisibility?.() === false || box.bottom < 0 || box.top > window.innerHeight) { close(); return; }
      const below = window.innerHeight - box.bottom - GAP;
      const up = below < Math.min(MAX_HEIGHT, 200) && box.top > below;
      setOnStage(!!trigger.current.closest('.stage-dark'));
      setPlace({ left: box.left, minWidth: box.width, ...(up ? { bottom: window.innerHeight - box.top + GAP, maxHeight: Math.min(MAX_HEIGHT, box.top - GAP * 2) } : { top: box.bottom + GAP, maxHeight: Math.min(MAX_HEIGHT, below - GAP) }) });
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    // Hiding the trigger (a pop-over closing round it) changes its size, and that closes the list.
    const watch = typeof ResizeObserver === 'function' ? new ResizeObserver(() => measure()) : null;
    watch?.observe(trigger.current);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); watch?.disconnect(); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    setActive(Math.max(0, chosen));
    // A press on the trigger's own <label> is left to the click it becomes, which toggles the list.
    const own = trigger.current?.closest('label');
    const outside = event => { if (!trigger.current?.contains(event.target) && !list.current?.contains(event.target) && !own?.contains(event.target)) close(); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => { if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView?.({ block: 'nearest' }); }, [active, open]);

  const jump = key => {
    const now = Date.now();
    const text = (now - typed.current.at < 700 ? typed.current.text : '') + key.toLowerCase();
    typed.current = { text, at: now };
    const from = text.length > 1 ? active : (active + 1) % flat.length;
    const order = [...flat.slice(from), ...flat.slice(0, from)];
    const hit = order.find(option => option.label.toLowerCase().startsWith(text));
    if (hit) setActive(flat.indexOf(hit));
  };

  const onKeyDown = event => {
    const last = flat.length - 1;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); event.stopPropagation(); toggle(); }
      return;
    }
    const keys = {
      ArrowDown: () => setActive(a => Math.min(last, a + 1)),
      ArrowUp: () => setActive(a => Math.max(0, a - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      PageDown: () => setActive(a => Math.min(last, a + 8)),
      PageUp: () => setActive(a => Math.max(0, a - 8)),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: close,
    };
    if (event.key === 'Tab') { close(); return; }
    if (keys[event.key]) { event.preventDefault(); event.stopPropagation(); keys[event.key](); return; }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); event.stopPropagation(); jump(event.key); }
  };

  let index = -1;
  const popup = open && place && createPortal(
    <ul className={`listbox-list${onStage ? ' stage-dark' : ''}`} role="listbox" id={listId} ref={list} aria-label={label} style={place}>
      {sections.map((section, s) => (
        <li key={section.label ?? s} role="presentation">
          {section.label && <span className="listbox-group" aria-hidden="true">{section.label}</span>}
          <ul role={section.label ? 'group' : 'presentation'} aria-label={section.label}>
            {section.options.map(option => {
              index += 1;
              const i = index;
              const selected = i === chosen;
              return (
                <li key={option.value} id={`${id}-${i}`} data-index={i} data-value={option.value} role="option" aria-selected={selected}
                  className={i === active ? 'active' : undefined} onPointerEnter={() => setActive(i)} onPointerDown={event => event.preventDefault()} onClick={() => choose(i)}>
                  <span>{option.label}</span>{selected && <Icon name="check" size={13} />}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>,
    document.body,
  );

  return <>
    <button type="button" ref={trigger} role="combobox" className={`listbox-trigger ${className}`} aria-label={label} aria-haspopup="listbox" aria-expanded={open}
      aria-controls={open ? listId : undefined} aria-activedescendant={open ? `${id}-${active}` : undefined} data-value={value ?? ''} title={title} disabled={disabled}
      onClick={toggle} onKeyDown={onKeyDown} onKeyUp={event => { if (event.key === ' ') event.preventDefault(); }}>
      <span className="listbox-value">{flat[chosen]?.label ?? ''}</span><Icon name="chevronDown" size={14} />
    </button>
    {popup}
  </>;
}
