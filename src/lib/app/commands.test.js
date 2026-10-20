import { describe, expect, it } from 'vitest';
import { bestIndex, flatten, fold, scoreCommand, searchCommands } from './commands.js';

const run = () => {};
const COMMANDS = [
  { id: 'r-ode', group: 'recent', title: 'Ode to Joy', run },
  { id: 'p-ode', group: 'piece', title: 'Ode to Joy', detail: 'Piano · Ludwig van Beethoven', run },
  { id: 'p-ode2', group: 'piece', title: 'Ode to Joy (two-octave version)', detail: 'Piano', run },
  { id: 'p-elise', group: 'piece', title: 'Für Elise (opening)', detail: 'Piano · Beethoven', run },
  { id: 'p-code', group: 'piece', title: 'Barcode Blues', detail: 'Guitar', run },
  { id: 'l-left', group: 'lesson', title: 'Home Five — Left Hand', detail: 'Lesson', run },
  { id: 'i-cello', group: 'instrument', title: 'Cello', run },
  { id: 's-lib', group: 'screen', title: 'Library', run },
  { id: 'a-met', group: 'action', title: 'Turn the metronome on', keys: [']'], keywords: ['click', 'beat'], run },
];

describe('fold', () => {
  it('drops case and accents so a plain keyboard finds every title', () => {
    expect(fold('Für Élise')).toBe('fur elise');
  });
});

describe('scoreCommand', () => {
  it('ranks a title that starts with the query above one that only contains it', () => {
    const starts = scoreCommand({ title: 'Barcode Blues' }, 'barc');
    const contains = scoreCommand({ title: 'Barcode Blues' }, 'code');
    expect(starts).toBeGreaterThan(contains);
    expect(contains).toBeGreaterThan(0);
  });

  it('needs every word of the query to match', () => {
    expect(scoreCommand({ title: 'Ode to Joy' }, 'ode joy')).toBeGreaterThan(0);
    expect(scoreCommand({ title: 'Ode to Joy' }, 'ode cello')).toBe(0);
  });

  it('finds keywords and details, and the initials of a title as a last resort', () => {
    expect(scoreCommand(COMMANDS[8], 'click')).toBe(40);
    expect(scoreCommand({ title: 'Ode to Joy' }, 'otj')).toBe(20);
    expect(scoreCommand({ title: 'Yankee Doodle' }, 'ode')).toBe(0);
    expect(scoreCommand({ title: 'London Bridge' }, 'ode')).toBe(0);
    expect(scoreCommand({ title: 'Ode to Joy' }, 'q')).toBe(0);
    expect(scoreCommand({ title: 'Listen mode', keywords: ['mode'] }, 'ode')).toBe(0);
    expect(scoreCommand({ title: 'Barcode Blues' }, 'ode')).toBe(0);
    expect(scoreCommand({ title: 'Ode to Joy', detail: 'Piano · Beethoven' }, 'beet')).toBe(40);
  });
});

describe('searchCommands', () => {
  it('shows recent pieces, screens and actions, and no catalogue, when nothing is typed', () => {
    const groups = searchCommands(COMMANDS, '  ').map(s => s.group);
    expect(groups).toEqual(['recent', 'screen', 'action']);
  });

  it('groups matches in a fixed order, best match first within each group', () => {
    const sections = searchCommands(COMMANDS, 'ode');
    expect(sections.map(s => s.group)).toEqual(['recent', 'piece']);
    expect(sections[1].items.map(c => c.id)).toEqual(['p-ode', 'p-ode2']);
  });

  it('finds a title with an accent from plain letters', () => {
    expect(flatten(searchCommands(COMMANDS, 'fur')).map(c => c.id)).toEqual(['p-elise']);
  });

  it('returns nothing for a query nothing answers', () => {
    expect(searchCommands(COMMANDS, 'zzz')).toEqual([]);
  });
});

describe('a lesson found by what it is about', () => {
  it('matches a word of its description, below any title match', () => {
    const lesson = { title: 'Under the shell', keywords: ['lesson', 'The underside has seven more notes, deep and soft.'] };
    expect(scoreCommand(lesson, 'underside')).toBeGreaterThan(0);
    expect(scoreCommand(lesson, 'underside')).toBeLessThan(scoreCommand(lesson, 'under'));
  });
});

describe('where the highlight starts', () => {
  it('is on the best answer, not the first section’s', () => {
    const items = [{ title: 'Sarali varisai 1', keywords: ['lesson', 'Play it with the metronome on.'] }, { title: 'Turn the metronome on', keywords: ['click'] }];
    expect(bestIndex(items, 'metronome')).toBe(1);
    expect(bestIndex(items, '')).toBe(0);
  });
});
