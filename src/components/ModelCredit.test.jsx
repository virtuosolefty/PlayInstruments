/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it } from 'vitest';
import ModelCredit from './ModelCredit.jsx';
import ModelChooser from './ModelChooser.jsx';
import HelpDialog from './HelpDialog.jsx';
import { MODEL_CREDITS } from '../lib/stage/modelCredits.js';
import { modelsFor } from '../lib/stage/stageModels.js';

let container, root;
const render = ui => act(() => root.render(ui));

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

it('names the artist of a downloaded model, linked to their page, and nothing for one built in code', () => {
  render(<ModelCredit id="violin" />);
  const link = container.querySelector('.model-credit a');
  expect(container.textContent).toBe('3D model by Voldepreuss');
  expect(link.getAttribute('href')).toBe('https://sketchfab.com/Voldepreuss');
  expect(link.querySelector('strong').textContent).toBe('Voldepreuss');
  render(<ModelCredit id="drums" />);
  expect(container.innerHTML).toBe('');
});

it('puts the artist on every chooser card that shows a downloaded model', () => {
  render(<ModelChooser models={modelsFor('drums')} value="drums" onChoose={() => {}} onClose={() => {}} />);
  const by = [...document.querySelectorAll('.model-by')].map(el => el.textContent);
  expect(by).toEqual(['3D model by art.katja', '3D model by SINNIK']);
});

it('lists every artist in Help, each name a link to their page', () => {
  render(<HelpDialog onClose={() => {}} />);
  const names = [...container.querySelectorAll('.artist-list .artist-name')];
  expect(names.map(a => a.textContent)).toEqual(MODEL_CREDITS.map(c => c.author));
  expect(names.map(a => a.getAttribute('href'))).toEqual(MODEL_CREDITS.map(c => c.authorUrl));
  expect(container.querySelector('#model-credits-title').textContent).toBe('3D artists');
});
