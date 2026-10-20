/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useAwake } from './useAwake.js';

let container, root, seen;
function Probe({ on }) { seen = useAwake(on, 1000); return null; }
const render = on => act(() => root.render(<Probe on={on} />));
const fire = type => act(() => { window.dispatchEvent(new Event(type)); });

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });

it('wakes on pointer movement while active, and sleeps again after the delay', () => {
  render(true);
  expect(seen).toBe(false);
  fire('pointermove');
  expect(seen).toBe(true);
  act(() => { vi.advanceTimersByTime(999); });
  expect(seen).toBe(true);
  act(() => { vi.advanceTimersByTime(2); });
  expect(seen).toBe(false);
});

it('ignores the pointer while inactive, and resets when it stops being active', () => {
  render(false);
  fire('pointermove');
  expect(seen).toBe(false);
  render(true);
  fire('pointerdown');
  expect(seen).toBe(true);
  render(false);
  expect(seen).toBe(false);
});
