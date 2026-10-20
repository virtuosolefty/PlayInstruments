/**
 * teacherReport.js — a progress page a pupil can hand to a teacher, made on the
 * device from what it already keeps: no account, no server (the audit's
 * "teacher mode without a server"). One self-contained HTML file that opens in
 * any browser and prints cleanly: practice days, the pieces practised with
 * their runs, best result and last date, and the bars that keep going wrong.
 *
 * Pure, so it can be tested without a browser; the caller saves the file.
 */
import { barAt } from '../music/passages.js';

const DAY_MS = 86_400_000;
const WINDOW_DAYS = 28;
const MAX_SPOTS = 3;

const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateOf = iso => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const percent = value => (value == null ? '' : `${Math.round(value * 100)}%`);

/** The practice in the last WINDOW_DAYS: days practised, minutes and runs. */
export function recentPractice(days = {}, now = new Date()) {
  const since = now.getTime() - WINDOW_DAYS * DAY_MS;
  const recent = Object.entries(days).filter(([day]) => new Date(`${day}T12:00:00`).getTime() >= since);
  return {
    days: recent.length,
    minutes: Math.round(recent.reduce((sum, [, d]) => sum + (d.seconds ?? 0), 0) / 60),
    runs: recent.reduce((sum, [, d]) => sum + (d.runs ?? 0), 0),
  };
}

/**
 * One row per piece practised, most recent first.
 *
 * @param {object} songs the stored history, keyed by piece id
 * @param {Map<string, object>} pieces what is known about each piece (title, composer, bpm, timeSignature)
 * @param {Record<string, number>} stars best stars per piece
 */
export function pieceRows(songs = {}, pieces = new Map(), stars = {}) {
  return Object.entries(songs)
    .filter(([, entry]) => entry?.sessions?.length)
    .map(([id, entry]) => {
      const piece = pieces.get(id) ?? { title: id };
      const sessions = entry.sessions;
      const best = sessions.reduce((top, s) => (s.score ?? 0) > (top?.score ?? -1) ? s : top, null);
      const spots = Object.values(entry.troubleMap ?? {})
        .map(t => ({ ...t, weight: (t.missed ?? 0) * 2 + (t.wrong ?? 0) * 1.5 + (t.late ?? 0) }))
        .filter(t => t.weight > 0)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, MAX_SPOTS)
        .map(t => ({ bar: piece.bpm ? barAt(t.time, piece) : null, missed: t.missed ?? 0, wrong: t.wrong ?? 0, late: t.late ?? 0 }));
      return {
        id, title: piece.title, composer: piece.composer ?? '', runs: sessions.length, stars: stars[id] ?? 0,
        best: best?.score ?? null, last: sessions[sessions.length - 1]?.at ?? null, spots,
      };
    })
    .sort((a, b) => String(b.last).localeCompare(String(a.last)));
}

function spotText(spot) {
  const parts = [spot.missed && `${spot.missed} missed`, spot.wrong && `${spot.wrong} wrong`, spot.late && `${spot.late} late`].filter(Boolean).join(', ');
  return `${spot.bar ? `Bar ${spot.bar}` : 'A passage'}: ${parts}`;
}

/** The page itself. */
export function teacherReport({ songs, days, pieces, stars, now = new Date() }) {
  const practice = recentPractice(days, now);
  const rows = pieceRows(songs, pieces, stars);
  const body = rows.length
    ? rows.map(r => `<tr><td><b>${escape(r.title)}</b>${r.composer ? `<br><small>${escape(r.composer)}</small>` : ''}</td><td class="n">${r.runs}</td><td class="n">${r.stars ? '★'.repeat(r.stars) : '–'}</td><td class="n">${percent(r.best)}</td><td>${escape(dateOf(r.last))}</td><td>${r.spots.map(s => escape(spotText(s))).join('<br>') || '<small>No slips recorded</small>'}</td></tr>`).join('\n')
    : '<tr><td colspan="6">No finished runs yet.</td></tr>';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Practice progress, ${escape(dateOf(now.toISOString()))}</title>
<style>
:root { color-scheme: light; --ink: #25243b; --dim: #595b70; --line: #cbcbd7; --accent: #6251b7; }
body { margin: 0 auto; max-width: 900px; padding: 32px 20px; font: 15px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); background: #fffefa; }
h1 { font: 600 30px/1.2 Georgia, serif; margin: 0 0 4px; } h2 { font: 600 20px/1.3 Georgia, serif; margin: 28px 0 8px; }
p, small { color: var(--dim); } .facts { display: flex; flex-wrap: wrap; gap: 24px; margin: 16px 0; }
.facts div { border: 1px solid var(--line); border-radius: 10px; padding: 12px 16px; } .facts b { display: block; font-size: 24px; color: var(--accent); }
table { width: 100%; border-collapse: collapse; } th, td { text-align: left; vertical-align: top; padding: 8px 6px; border-bottom: 1px solid var(--line); }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--dim); } .n { font-variant-numeric: tabular-nums; white-space: nowrap; }
@media print { body { padding: 0; } .facts div { break-inside: avoid; } tr { break-inside: avoid; } }
</style></head><body>
<h1>Practice progress</h1>
<p>Made by Practice Deck on ${escape(dateOf(now.toISOString()))}, from what this device has saved. Nothing was uploaded.</p>
<div class="facts"><div><b>${practice.days}</b>days practised in the last 4 weeks</div><div><b>${practice.minutes}</b>minutes practised</div><div><b>${practice.runs}</b>runs played</div></div>
<h2>Pieces</h2>
<p>Stars are the best finished run; the score is the best run’s overall result. The last column is where runs most often went wrong.</p>
<table><thead><tr><th>Piece</th><th>Runs</th><th>Best</th><th>Score</th><th>Last practised</th><th>Where it goes wrong</th></tr></thead><tbody>
${body}
</tbody></table>
</body></html>
`;
}
