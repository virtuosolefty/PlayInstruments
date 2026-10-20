/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useScreenTransition } from './useScreenTransition.js';

let container, root, set;
function Probe({ settings, store }) { set = useScreenTransition(store, settings); return null; }

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); delete document.startViewTransition; });

it('runs a change of screen inside a view transition, and a skipped one raises nothing', async () => {
  const skipped = () => Promise.reject(new DOMException('Transition was skipped', 'AbortError'));
  document.startViewTransition = vi.fn(update => { update(); return { ready: skipped(), finished: skipped(), updateCallbackDone: Promise.resolve() }; });
  const store = vi.fn();
  act(() => root.render(<Probe settings={{ learningView: 'home' }} store={store} />));
  act(() => set(s => ({ ...s, learningView: 'studio' })));
  expect(document.startViewTransition).toHaveBeenCalledOnce();
  expect(store).toHaveBeenCalledOnce();
  // Any other update goes straight through.
  act(() => set(s => ({ ...s, rate: 0.8 })));
  expect(document.startViewTransition).toHaveBeenCalledOnce();
  expect(store).toHaveBeenCalledTimes(2);
  await new Promise(r => setTimeout(r, 0)); // an unhandled rejection would fail the run here
});
