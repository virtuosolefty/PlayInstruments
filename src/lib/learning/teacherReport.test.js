import { describe, expect, it } from 'vitest';
import { pieceRows, recentPractice, teacherReport } from './teacherReport.js';

const now = new Date('2026-10-19T12:00:00Z');
const pieces = new Map([['ode', { title: 'Ode to Joy', composer: 'Beethoven', bpm: 60, timeSignature: [4, 4] }]]);
const songs = {
  ode: {
    sessions: [{ at: '2026-10-10T10:00:00Z', score: 0.6 }, { at: '2026-10-18T10:00:00Z', score: 0.82 }],
    troubleMap: { '4.50': { time: 4.5, missed: 2, wrong: 0, late: 1 }, '0.00': { time: 0, missed: 0, wrong: 1, late: 0 } },
  },
  '<script>': { sessions: [{ at: '2026-10-01T10:00:00Z', score: 0.4 }], troubleMap: {} },
  empty: { sessions: [], troubleMap: {} },
};

describe('a progress page for a teacher', () => {
  it('counts the last four weeks of practice', () => {
    const days = { '2026-10-18': { seconds: 600, runs: 3 }, '2026-10-10': { seconds: 300, runs: 2 }, '2026-08-01': { seconds: 900, runs: 9 } };
    expect(recentPractice(days, now)).toEqual({ days: 2, minutes: 15, runs: 5 });
  });

  it('lists the pieces practised, newest first, with their worst bars', () => {
    const rows = pieceRows(songs, pieces, { ode: 3 });
    expect(rows.map(r => r.id)).toEqual(['ode', '<script>']);
    expect(rows[0]).toMatchObject({ title: 'Ode to Joy', runs: 2, stars: 3, best: 0.82, last: '2026-10-18T10:00:00Z' });
    expect(rows[0].spots[0]).toEqual({ bar: 2, missed: 2, wrong: 0, late: 1 });
  });

  it('makes one page that escapes what it is given', () => {
    const html = teacherReport({ songs, days: {}, pieces, stars: { ode: 3 }, now });
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('Ode to Joy');
    expect(html).toContain('Bar 2: 2 missed, 1 late');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
