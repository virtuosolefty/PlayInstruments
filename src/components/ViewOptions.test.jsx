/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Listbox from './Listbox.jsx';
import ViewOptions from './ViewOptions.jsx';

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ViewOptions><label>Frets<Listbox label="Visible guitar frets" value="5" options={[{ value: '5', label: '0–5' }, { value: '12', label: '0–12' }]} onChange={() => {}} /></label></ViewOptions>));
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

const details = () => container.querySelector('details');
const combobox = () => container.querySelector('[role="combobox"]');
const open = () => act(() => { details().open = true; details().dispatchEvent(new Event('toggle')); });

describe('the View pop-over', () => {
  it('keeps its controls in the page, named, and opens from its summary', () => {
    expect(container.querySelector('summary').textContent).toBe('View');
    expect(container.querySelector('[aria-label="Visible guitar frets"]')).not.toBeNull();
    open();
    expect(details().open).toBe(true);
  });

  it('closes on Escape, giving focus back to its summary', () => {
    open();
    act(() => combobox().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(details().open).toBe(false);
    expect(document.activeElement).toBe(container.querySelector('summary'));
  });

  it('closes on a press outside it, and not on one inside', () => {
    open();
    act(() => combobox().dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(details().open).toBe(true);
    act(() => document.body.dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(details().open).toBe(false);
  });

  it('stays open while a list inside it is open: Escape and a press in the list belong to the list', () => {
    open();
    act(() => combobox().click());
    act(() => combobox().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(document.querySelector('.listbox-list')).toBeNull();
    expect(details().open).toBe(true);
    act(() => combobox().click());
    act(() => document.querySelector('.listbox-list [role="option"]').dispatchEvent(new Event('pointerdown', { bubbles: true })));
    expect(details().open).toBe(true);
  });
});
