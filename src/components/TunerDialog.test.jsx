/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import TunerDialog from './TunerDialog.jsx';
import { emitSyntheticMidi } from '../lib/input/midiInput.js';
import { playInput } from '../lib/input/playInput.js';

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.restoreAllMocks(); });

it('lets the keys play through it, and each string card sounds that open string', () => {
  const press = vi.spyOn(playInput, 'press').mockImplementation(() => Promise.resolve());
  act(() => root.render(<TunerDialog instrument="bass" onClose={() => {}} />));
  expect(container.querySelector('[role="dialog"]').hasAttribute('data-play-through')).toBe(true);
  const cards = [...container.querySelectorAll('.tuner-strings button')];
  expect(cards.map(b => b.getAttribute('aria-label'))).toEqual(['Play string 4, E1', 'Play string 3, A1', 'Play string 2, D2', 'Play string 1, G2']);
  act(() => cards[0].click());
  expect(press).toHaveBeenCalledWith('tuner-reference', 28, 0.7, expect.objectContaining({ string: 0, fret: 0 }));
});

it('shows a note played on the keys or a controller as the reference, but not one the microphone heard', () => {
  act(() => root.render(<TunerDialog instrument="bass" onClose={() => {}} />));
  const face = () => container.querySelector('.tuner-face');
  act(() => emitSyntheticMidi({ type: 'noteon', midi: 45, source: 'mic' }));
  expect(face().dataset.reference).toBe('');
  act(() => emitSyntheticMidi({ type: 'noteon', midi: 33, source: 'typing' }));
  expect(face().dataset.reference).toBe('A1');
  expect(container.querySelector('.tuner-note').textContent).toBe('A1');
  expect(container.querySelector('.tuner-verdict').textContent).toMatch(/^A1 played here, in tune/);
});
