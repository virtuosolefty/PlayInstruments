/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CommandPalette from './CommandPalette.jsx';
import AppearanceDialog from './AppearanceDialog.jsx';

let container, root;
const render = ui => act(() => root.render(ui));
const key = (el, k) => act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
const type = (input, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  Element.prototype.scrollIntoView = () => {};
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

it('ranks a title start above a word start, moves with the arrows and runs the chosen one on Enter', () => {
  const ode = vi.fn(), joyful = vi.fn(), onClose = vi.fn();
  render(<CommandPalette onClose={onClose} commands={[
    { id: 'a', group: 'piece', title: 'Ode to Joy', run: ode },
    { id: 'b', group: 'piece', title: 'Joyful Noise', run: joyful },
  ]} />);
  const input = container.querySelector('[role="combobox"]');
  expect(document.activeElement).toBe(input);
  type(input, 'joy');
  const options = () => [...container.querySelectorAll('[role="option"]')];
  expect(options().map(o => o.querySelector('.palette-title').textContent)).toEqual(['Joyful Noise', 'Ode to Joy']);
  expect(input.getAttribute('aria-activedescendant')).toBe('palette-b');
  key(input, 'ArrowDown');
  expect(options()[1].getAttribute('aria-selected')).toBe('true');
  key(input, 'ArrowDown');
  expect(options()[0].getAttribute('aria-selected')).toBe('true');
  key(input, 'ArrowUp');
  key(input, 'Enter');
  expect(onClose).toHaveBeenCalled();
  expect(ode).toHaveBeenCalled();
  expect(joyful).not.toHaveBeenCalled();
});

it('says so when nothing matches', () => {
  render(<CommandPalette onClose={() => {}} commands={[{ id: 'a', group: 'piece', title: 'Ode to Joy', run() {} }]} />);
  type(container.querySelector('[role="combobox"]'), 'zzz');
  expect(container.querySelector('[role="status"]').textContent).toMatch(/Nothing matches/);
});

it('Appearance writes the theme, accent and text size it is given', () => {
  let settings = { theme: 'light' };
  const setSettings = fn => { settings = fn(settings); render(<AppearanceDialog settings={settings} setSettings={setSettings} onClose={() => {}} />); };
  render(<AppearanceDialog settings={settings} setSettings={setSettings} onClose={() => {}} />);
  const press = (group, name) => act(() => [...container.querySelector(`[aria-label="${group}"]`).querySelectorAll('button')].find(b => b.textContent === name).click());
  press('Theme', 'True black');
  expect([settings.theme, settings.trueBlack]).toEqual(['dark', true]);
  press('Accent in the dark', 'Copper');
  expect(settings.darkAccent).toBe('copper');
  press('Text size', 'Large');
  expect(settings.textSize).toBe('large');
  press('Theme', 'Light');
  expect([settings.theme, settings.trueBlack]).toEqual(['light', false]);
  expect(container.querySelector('[aria-label="Accent in the dark"] [aria-pressed="true"]').textContent).toBe('Copper');
});
