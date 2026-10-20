/**
 * @vitest-environment jsdom
 */
import { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Listbox from './Listbox.jsx';

let container, root, changes;
const OPTIONS = [{ value: 'fit', label: 'Fit piece' }, { value: 'two', label: '2 octaves' }, { value: 'full', label: 'Full range' }];

function Harness({ start = 'two' }) {
  const [value, setValue] = useState(start);
  return <Listbox label="Piano visible range" value={value} options={OPTIONS} onChange={next => { changes.push(next); setValue(next); }} />;
}

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  changes = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const trigger = () => container.querySelector('[role="combobox"]');
const listbox = () => document.querySelector('[role="listbox"]');
const key = name => act(() => trigger().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true })));

describe('a list in place of a native select', () => {
  it('is a combobox with the control\'s name, showing the chosen value', () => {
    expect(trigger().getAttribute('aria-label')).toBe('Piano visible range');
    expect(trigger().textContent).toBe('2 octaves');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().dataset.value).toBe('two');
    expect(listbox()).toBeNull();
  });

  it('opens over the page, marks the chosen option, and chooses with a click', () => {
    act(() => trigger().click());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(listbox().parentElement).toBe(document.body);
    expect(listbox().querySelector('[aria-selected="true"]').textContent).toBe('2 octaves');
    act(() => listbox().querySelector('[data-value="full"]').click());
    expect(changes).toEqual(['full']);
    expect(listbox()).toBeNull();
    expect(trigger().textContent).toBe('Full range');
  });

  it('moves with the arrows and Home and End, and chooses with Enter, keeping the focus on the trigger', () => {
    trigger().focus();
    key('ArrowDown');
    expect(listbox()).not.toBeNull();
    const active = () => trigger().getAttribute('aria-activedescendant');
    const at = () => document.getElementById(active()).dataset.value;
    expect(at()).toBe('two');
    key('ArrowDown');
    expect(at()).toBe('full');
    key('Home');
    expect(at()).toBe('fit');
    key('End');
    expect(at()).toBe('full');
    key('Enter');
    expect(changes).toEqual(['full']);
    expect(document.activeElement).toBe(trigger());
  });

  it('jumps to the next choice that starts with a typed letter', () => {
    act(() => trigger().click());
    key('f');
    expect(document.getElementById(trigger().getAttribute('aria-activedescendant')).dataset.value).toBe('full');
  });

  it('closes without choosing on Escape, and on a press outside it', () => {
    const escape = vi.fn();
    document.addEventListener('keydown', escape);
    act(() => trigger().click());
    key('Escape');
    expect(listbox()).toBeNull();
    expect(escape).not.toHaveBeenCalled();
    document.removeEventListener('keydown', escape);
    act(() => trigger().click());
    act(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(listbox()).toBeNull();
    expect(changes).toEqual([]);
  });

  it('shows group headings, and gives numbers back as text as a select would', () => {
    const picks = [];
    act(() => root.render(<Listbox label="Exercise" value={18} groups={[{ label: 'Lessons', options: [{ value: 14, label: 'Standard' }] }, { label: 'Songs', options: [{ value: 18, label: 'Large' }] }]} onChange={v => picks.push(v)} />));
    act(() => trigger().click());
    expect([...listbox().querySelectorAll('.listbox-group')].map(g => g.textContent)).toEqual(['Lessons', 'Songs']);
    expect(listbox().querySelectorAll('[role="group"]')).toHaveLength(2);
    act(() => listbox().querySelector('[data-value="14"]').click());
    expect(picks).toEqual(['14']);
  });

  it('keeps the keys it uses to itself, so a letter or an arrow never reaches the shortcuts of the app', () => {
    const heard = vi.fn();
    window.addEventListener('keydown', heard);
    trigger().focus();
    key('ArrowDown');
    key('f');
    key('ArrowUp');
    window.removeEventListener('keydown', heard);
    expect(heard).not.toHaveBeenCalled();
  });

  it('never points past the end when the choices shrink while it is open, and does not open with none', () => {
    act(() => root.render(<Listbox label="MIDI output" value="c" options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }]} onChange={() => {}} />));
    act(() => trigger().click());
    key('End');
    act(() => root.render(<Listbox label="MIDI output" value="a" options={[{ value: 'a', label: 'A' }]} onChange={() => {}} />));
    const active = trigger().getAttribute('aria-activedescendant');
    expect(document.getElementById(active)?.dataset.value).toBe('a');
    act(() => root.render(<Listbox label="MIDI output" value="" options={[]} onChange={() => {}} />));
    key('Escape');
    act(() => trigger().click());
    expect(listbox()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });
});
