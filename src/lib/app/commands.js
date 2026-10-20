/**
 * commands.js — what the Ctrl+K palette can find, and how it ranks a search.
 *
 * Pure: the studio builds the list (each entry carries its own `run`), this
 * module only orders and filters it, so the ranking is tested without a page.
 */

/** The groups, in the order the palette shows them, and how many of each a search returns. */
const GROUPS = Object.freeze([
  Object.freeze({ id: 'recent', label: 'Recent and favourites', limit: 5 }),
  Object.freeze({ id: 'piece', label: 'Pieces', limit: 6 }),
  Object.freeze({ id: 'lesson', label: 'Lessons', limit: 4 }),
  Object.freeze({ id: 'instrument', label: 'Instruments', limit: 6 }),
  Object.freeze({ id: 'screen', label: 'Go to', limit: 5 }),
  Object.freeze({ id: 'action', label: 'Actions', limit: 6 }),
]);

/** Lower case, accents gone, so "fur elise" finds "Für Elise". */
export const fold = text => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * How well one command answers the query, 0 when it does not. Each word of the
 * query has to match somewhere; the score is the weakest word's, so a title
 * that starts with what you typed beats one that only contains it. A detail or
 * keyword counts only from the start of a word, and a title from the middle of a
 * word only for four letters or more, so "ode" does not find "Listen mode".
 */
export function scoreCommand(command, query) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const title = fold(command.title);
  const titleWords = title.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const extra = fold([command.detail, ...(command.keywords ?? [])].join(' ')).split(/[^\p{L}\p{N}]+/u);
  let worst = Infinity;
  for (const word of words) {
    const score = title.startsWith(word) ? 100
      : titleWords.some(w => w.startsWith(word)) ? 80
        : word.length >= 4 && title.includes(word) ? 60
          : extra.some(w => w.startsWith(word)) ? 40
            : word.length > 1 && titleWords.map(w => w[0]).join('').startsWith(word) ? 20 : 0;
    if (!score) return 0;
    worst = Math.min(worst, score);
  }
  return worst;
}

/**
 * The palette's sections for a query: [{ group, label, items }], empty sections
 * left out. With no query, recent pieces first, then the screens and actions.
 */
export function searchCommands(commands, query) {
  const searching = fold(query).trim().length > 0;
  return GROUPS.map(group => {
    const own = commands.filter(c => c.group === group.id);
    const items = searching
      ? own.map(c => ({ c, s: scoreCommand(c, query) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.c)
      : group.id === 'piece' || group.id === 'lesson' || group.id === 'instrument' ? [] : own;
    return { group: group.id, label: group.label, items: items.slice(0, group.limit) };
  }).filter(section => section.items.length);
}

/** The sections flattened, in the order arrow keys move through them. */
export const flatten = sections => sections.flatMap(section => section.items);

/**
 * Where the palette's highlight starts: on the best answer to the query, wherever its section is, so Enter runs the
 * action whose name was typed rather than a lesson that only mentions it. The first item when nothing is typed.
 */
export function bestIndex(items, query) {
  if (!fold(query).trim()) return 0;
  let best = 0, bestScore = -1;
  items.forEach((item, i) => { const score = scoreCommand(item, query); if (score > bestScore) { best = i; bestScore = score; } });
  return best;
}
