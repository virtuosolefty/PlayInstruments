import { useEffect, useMemo, useRef, useState } from 'react';
import { useDialog } from '../hooks/useDialog.js';
import { bestIndex, flatten, searchCommands } from '../lib/app/commands.js';
import Icon from './Icon.jsx';

const GROUP_ICON = { recent: 'music', piece: 'music', lesson: 'target', instrument: 'sliders', screen: 'arrowRight', action: 'sparkle' };

/**
 * Ctrl+K: one box that finds pieces, lessons, instruments, screens and actions.
 * A combobox over a grouped listbox; focus stays in the field and the arrow keys
 * move the highlighted option, as in every palette people already know.
 */
export default function CommandPalette({ commands, onClose }) {
  const ref = useDialog({ onClose });
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef(null);
  const sections = useMemo(() => searchCommands(commands, query), [commands, query]);
  const items = useMemo(() => flatten(sections), [sections]);
  useEffect(() => { setActive(bestIndex(items, query)); }, [items, query]);
  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' }); }, [active]);

  const choose = item => { if (!item) return; onClose(); item.run(); };
  const onKeyDown = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (items.length ? (i + 1) % items.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (items.length ? (i - 1 + items.length) % items.length : 0)); }
    else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && e.ctrlKey) { e.preventDefault(); setActive(Math.max(0, items.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(items[active]); }
  };

  let index = -1;
  return <div className="palette-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="palette" role="dialog" aria-modal="true" aria-label="Find anything" ref={ref} tabIndex={-1}>
      <div className="palette-field">
        <Icon name="search" size={18} />
        <input type="text" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autoComplete="off" spellCheck={false}
          aria-activedescendant={items[active] ? `palette-${items[active].id}` : undefined} aria-label="Find a piece, lesson or action"
          placeholder="Find a piece, lesson or action…" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown} />
        <kbd>Esc</kbd>
      </div>
      <div className="palette-list" id="palette-list" role="listbox" aria-label="Results" ref={listRef}>
        {sections.map(section => <div role="group" key={section.group} aria-labelledby={`palette-group-${section.group}`}>
          <h3 id={`palette-group-${section.group}`} role="presentation">{section.label}</h3>
          {section.items.map(item => {
            index += 1;
            const at = index;
            return <div key={item.id} id={`palette-${item.id}`} role="option" aria-selected={at === active} className="palette-option"
              onMouseMove={() => { if (at !== active) setActive(at); }} onClick={() => choose(item)}>
              <span className="palette-icon" aria-hidden="true"><Icon name={GROUP_ICON[item.group] ?? 'arrowRight'} size={14} /></span>
              <span className="palette-title">{item.title}</span>
              {item.detail && <span className="palette-detail">{item.detail}</span>}
              {item.keys?.length > 0 && <span className="palette-keys" aria-label={`Shortcut ${item.keys.join(' ')}`}>{item.keys.map(k => <kbd key={k}>{k}</kbd>)}</span>}
            </div>;
          })}
        </div>)}
        {!items.length && <p className="palette-empty" role="status">Nothing matches “{query}”. Try a piece’s title, a composer or an instrument.</p>}
      </div>
      <footer className="palette-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Ctrl</kbd><kbd>K</kbd> from anywhere</span></footer>
    </section>
  </div>;
}
