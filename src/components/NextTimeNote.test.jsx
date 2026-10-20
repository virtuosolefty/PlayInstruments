/**
 * @vitest-environment jsdom
 */
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextTimeNote, ReportNote, whenWritten } from './NextTimeNote.jsx';

let container, root;
const render = ui => act(() => root.render(ui));
const type = (input, value) => act(() => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('whenWritten', () => {
  const now = new Date(2026, 9, 19, 12).getTime();
  it('says today, yesterday, a weekday, then a date', () => {
    expect(whenWritten(new Date(2026, 9, 19, 8).toISOString(), now)).toBe('Today');
    expect(whenWritten(new Date(2026, 9, 18, 23).toISOString(), now)).toBe('Yesterday');
    expect(whenWritten(new Date(2026, 9, 16).toISOString(), now)).toMatch(/^[A-Z][a-z]+day$/);
    expect(whenWritten('not a date', now)).toBe('');
  });
});

describe('the report note', () => {
  it('saves on Enter, and against the piece the report opened for even after another is chosen', () => {
    const onChange = vi.fn();
    render(<ReportNote pieceId="ode" note={null} onChange={onChange} />);
    const input = container.querySelector('input');
    type(input, '  bar 5,  left hand early ');
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    expect(onChange).toHaveBeenLastCalledWith('ode', 'bar 5, left hand early');
    render(<ReportNote pieceId="elise" note={null} onChange={onChange} />);
    type(input, 'bar 6 too');
    act(() => root.render(null));
    expect(onChange).toHaveBeenLastCalledWith('ode', 'bar 6 too');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('does not save what has not changed', () => {
    const onChange = vi.fn();
    render(<ReportNote pieceId="ode" note={{ text: 'same', at: 't' }} onChange={onChange} />);
    act(() => root.render(null));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('the note in the guide', () => {
  const score = { bpm: 100, timeSignature: [4, 4], duration: 24 };
  it('offers the loop its bar names, and clears', () => {
    const onAction = vi.fn(), onClear = vi.fn();
    render(<NextTimeNote note={{ text: 'Bar 2 at 70', at: new Date().toISOString() }} score={score} onAction={onAction} onClear={onClear} />);
    const [loop, clear] = container.querySelectorAll('button');
    expect(loop.textContent).toBe('Loop bar 2 at 70 bpm');
    act(() => loop.click());
    expect(onAction.mock.calls[0][0].fromBar).toBe(2);
    act(() => clear.click());
    expect(onClear).toHaveBeenCalled();
  });

  it('shows nothing without a note, and no loop when no bar is named', () => {
    render(<NextTimeNote note={null} score={score} onAction={() => {}} onClear={() => {}} />);
    expect(container.innerHTML).toBe('');
    render(<NextTimeNote note={{ text: 'slow down', at: '' }} score={score} onAction={() => {}} onClear={() => {}} />);
    expect([...container.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Clear note']);
  });
});
