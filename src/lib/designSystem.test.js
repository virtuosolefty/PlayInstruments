import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('keeps the standalone design-system mirror identical to the app tokens', () => {
  const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8').trim();
  const artifact = readFileSync(new URL('../../docs/design/design-system.html', import.meta.url), 'utf8');
  expect(artifact.match(/<style data-design-tokens>([\s\S]*?)<\/style>/)[1].trim()).toBe(css);
});
