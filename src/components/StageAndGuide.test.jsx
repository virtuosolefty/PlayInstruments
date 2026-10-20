/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BarInspector from './BarInspector.jsx';
import StageViews, { StageAppearance } from './StageViews.jsx';
import TermText from './TermText.jsx';
import TonightPractice from './TonightPractice.jsx';
import ShortcutLegend from './ShortcutLegend.jsx';

vi.mock('../lib/stage/webgl.js', () => ({ webglAvailable: () => true }));

let container, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = node => act(() => root.render(node));
const button = name => [...container.querySelectorAll('button')].find(b => (b.getAttribute('aria-label') ?? b.textContent) === name);

describe('terms you can tap', () => {
  it('opens a word’s meaning under its line, and closes it on a second tap', () => {
    render(<TermText text="One note per beat." instrument="piano" />);
    const term = container.querySelector('.term');
    expect(term.textContent).toBe('beat');
    const meaning = container.querySelector('.term-meaning');
    expect(meaning.textContent).toBe('');
    expect(meaning.getAttribute('aria-live')).toBe('polite');
    act(() => term.click());
    expect(term.getAttribute('aria-expanded')).toBe('true');
    expect(meaning.textContent).toMatch(/^Beat: The steady pulse/);
    act(() => term.click());
    expect(meaning.textContent).toBe('');
  });
});

describe('the view switch on the stage', () => {
  it('sets the piano’s view and 2D or 3D, keeping the full names', () => {
    const settings = { view: 'roll', renderer: 'canvas' };
    const setSettings = vi.fn(fn => Object.assign(settings, fn(settings)));
    render(<StageViews settings={settings} setSettings={setSettings} />);
    expect(container.querySelector('[role="group"][aria-label="How to show the music"]')).not.toBeNull();
    act(() => button('Sheet music').click());
    expect(settings.view).toBe('staff');
    act(() => button('3D Stage').click());
    expect(settings.renderer).toBe('gl');
  });

  it('offers only 2D and 3D in free play', () => {
    render(<StageViews settings={{ view: 'roll', renderer: 'gl' }} setSettings={() => {}} freePlay />);
    expect(container.querySelector('[aria-label="How to show the music"]')).toBeNull();
    expect(button('3D Stage').getAttribute('aria-pressed')).toBe('true');
  });

  it('is one switch for any instrument', () => {
    render(<StageAppearance settings={{ renderer: 'canvas' }} setSettings={() => {}} />);
    expect(container.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Stage appearance');
    expect(button('2D Trainer').textContent).toBe('2D');
  });
});

describe('the keys in the footer', () => {
  it('lists Space first, then the rest', () => {
    render(<ShortcutLegend />);
    const items = [...container.querySelectorAll('.shortcut')].map(s => s.textContent);
    expect(items[0]).toBe('Spaceplay / pause');
    expect(items).toContain('[loop');
  });
});

const score = {
  bpm: 60, timeSignature: [4, 4], duration: 8,
  notes: [
    { midi: 60, name: 'C4', time: 0, duration: 1, hand: 'right', finger: 1 },
    { midi: 64, name: 'E4', time: 4, duration: 1, hand: 'right', finger: 3 },
  ],
};

describe('the inspector', () => {
  it('shows a bar’s notes, fingers and slips, and hears or loops it', () => {
    const onHear = vi.fn(), onLoop = vi.fn(), onSelect = vi.fn(), onClose = vi.fn();
    render(<BarInspector score={score} bar={1} troubleSpots={[{ time: 0.5, missed: 2, wrong: 0, late: 1 }]} onHear={onHear} onLoop={onLoop} onSelect={onSelect} onClose={onClose} />);
    expect(container.querySelector('h2').textContent).toBe('C');
    expect(container.textContent).toContain('SELECTED · BAR 1 OF 2');
    expect(container.textContent).toContain('2 missed · 1 late');
    act(() => button('Hear bar 1').click());
    expect(onHear).toHaveBeenCalledWith(0, 4);
    act(() => button('Loop bars 1–2').click());
    expect(onLoop).toHaveBeenCalledWith(0, 8);
    act(() => button('Bar 2').click());
    expect(onSelect).toHaveBeenCalledWith(2);
    act(() => button('Close bar details').click());
    expect(onClose).toHaveBeenCalled();
  });
});

describe('tonight’s checklist', () => {
  const learning = (daily) => ({
    record: { daily },
    entries: [{ id: 'a', approxDuration: 28 }, { id: 'b', approxDuration: 58 }],
    dailyItems: [{ songId: 'a', kind: 'work', label: 'Home Five' }, { songId: 'b', kind: 'preview', label: 'Left Hand' }],
    startDaily: vi.fn(),
  });
  const path = { progress: { done: 1, goal: 3 } };

  it('says how long tonight is, with each item’s minutes and today’s runs', () => {
    render(<TonightPractice learning={learning(null)} path={path} size="full" onSize={() => {}} complete={false} />);
    expect(container.textContent).toContain('Tonight, about 3 minutes.');
    expect([...container.querySelectorAll('.mins')].map(m => m.textContent)).toEqual(['1 min', '2 min']);
    expect(container.querySelector('.tonight-ring').getAttribute('aria-label')).toBe('1 of 3 runs today');
  });

  it('ticks the items today’s practice has moved past', async () => {
    const { dayKey } = await import('../lib/learning/streaks.js');
    render(<TonightPractice learning={learning({ day: dayKey(), ids: ['a', 'b'], index: 1, complete: false })} path={path} size="full" onSize={() => {}} complete={false} />);
    expect([...container.querySelectorAll('.tonight-list li')].map(li => li.className)).toEqual(['done', '']);
  });

  it('keeps one item for one phrase', () => {
    render(<TonightPractice learning={learning(null)} path={path} size="short" onSize={() => {}} complete={false} />);
    expect(container.querySelectorAll('.tonight-list li')).toHaveLength(1);
    expect(container.textContent).toContain('One short run.');
  });
});
