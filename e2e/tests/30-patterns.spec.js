import { test, expect } from '@playwright/test';
import { collectErrors, seedSettings } from '../helpers/studio.js';

/**
 * The 19 October pattern plan: a dark accent that is not purple (ivory by
 * default, silver and copper, or the old violet), true black, larger text, the
 * Ctrl+K palette, the studio's first-visit tour, the chrome stepping back while
 * a run plays, and a note for next time.
 */

const STORAGE = 'piano-practice-coach:v1';
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).settings, STORAGE);
const STUDIO = { learningView: 'studio', renderer: 'canvas', theme: 'dark', practiceInstrument: 'piano' };

test.use({ viewport: { width: 1280, height: 800 } });

test('the dark accent is ivory, and Appearance changes accent, theme and text size at once', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, STUDIO);
  await page.goto('/');
  const play = page.locator('.pad-play');
  await expect(play).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'ivory');
  await expect(play).toHaveCSS('background-color', 'rgb(236, 227, 207)');

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Appearance' }).click();
  const dialog = page.getByRole('dialog', { name: 'Appearance' });
  await dialog.getByRole('group', { name: 'Accent in the dark' }).getByRole('button', { name: 'Copper' }).click();
  await expect(play).toHaveCSS('background-color', 'rgb(232, 149, 107)');
  await dialog.getByRole('group', { name: 'Accent in the dark' }).getByRole('button', { name: 'Violet' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-accent', /.+/);
  await expect(play).toHaveCSS('background-color', 'rgb(165, 148, 255)');

  await dialog.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'True black' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await dialog.getByRole('group', { name: 'Text size' }).getByRole('button', { name: 'Large' }).click();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fs-md').trim())).toBe('18px');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();

  const after = await saved(page);
  expect([after.darkAccent, after.trueBlack, after.textSize, after.theme]).toEqual(['violet', true, 'large', 'dark']);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'large', { timeout: 30_000 });
  await expect(page.locator('html')).toHaveAttribute('data-black', '');
  expect(errors).toEqual([]);
});

test('Ctrl+K finds a piece and opens it, runs an action, and Escape closes it', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, STUDIO);
  await page.goto('/');
  await expect(page.locator('.studio-heading h1')).toBeVisible({ timeout: 30_000 });

  await page.keyboard.press('Control+k');
  const field = page.getByRole('combobox', { name: 'Find a piece, lesson or action' });
  await expect(field).toBeFocused();
  await field.fill('ode to');
  await expect(page.getByRole('option').first()).toContainText('Ode to Joy');
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Find anything' })).toBeHidden();
  await expect(page.locator('.studio-heading h1')).toHaveText('Ode to Joy');

  await page.getByRole('button', { name: /Search/ }).click();
  await field.fill('metronome');
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page)).metronome).toBe(true);

  await page.keyboard.press('Control+k');
  await field.fill('zzzz');
  await expect(page.getByRole('status').filter({ hasText: 'Nothing matches' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Find anything' })).toBeHidden();
  // Typing in the palette played no notes and changed no mode.
  expect((await saved(page)).mode).not.toBe('listen');
  expect(errors).toEqual([]);
});

test('the first studio visit shows a three-stop tour, once, and Help can show it again', async ({ page }) => {
  await seedSettings(page, { ...STUDIO, studioTourDone: false });
  await page.goto('/');
  const tip = page.locator('.coach-tip');
  await expect(tip).toBeVisible({ timeout: 30_000 });
  await expect(tip.locator('h2')).toHaveText('Start when you are ready');
  await expect(tip.getByRole('button', { name: 'Next' })).toBeFocused();
  await tip.getByRole('button', { name: 'Next' }).click();
  await expect(tip.locator('h2')).toHaveText('Three ways to practise');
  await tip.getByRole('button', { name: 'Next' }).click();
  await expect(tip.locator('h2')).toHaveText('How you play');
  await tip.getByRole('button', { name: 'Done' }).click();
  await expect(tip).toBeHidden();
  expect((await saved(page)).studioTourDone).toBe(true);

  await page.reload();
  await expect(page.locator('.studio-heading h1')).toBeVisible({ timeout: 30_000 });
  await expect(tip).toBeHidden();

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('button', { name: 'Show the studio tour again' }).click();
  await expect(tip).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(tip).toBeHidden();
});

test('while a run plays the chrome fades back, and the pointer or a pause brings it back', async ({ page }) => {
  await seedSettings(page, { ...STUDIO, mode: 'listen' });
  await page.goto('/');
  const topbar = page.locator('.topbar');
  await expect(page.locator('.pad-play')).toBeVisible({ timeout: 30_000 });
  await page.mouse.move(640, 400);
  await page.locator('.pad-play').click();
  await expect(topbar).toHaveCSS('opacity', '0.2', { timeout: 8_000 });
  await page.mouse.move(500, 300);
  await expect(topbar).toHaveCSS('opacity', '1');
  await page.keyboard.press('Space');
  await expect(page.locator('.studio-app')).not.toHaveClass(/receded/);
});

test('a note for next time is shown before the next run, and its bar becomes a loop', async ({ page }) => {
  await seedSettings(page, { ...STUDIO, lastPianoId: 'c-major-scale', pieceNotes: { 'c-major-scale': { text: 'Bar 3: the left hand comes in early. Try it at 70 first.', at: new Date().toISOString() } } });
  await page.goto('/');
  const note = page.getByRole('note', { name: 'Your note from last time' });
  await expect(note).toContainText('Bar 3: the left hand comes in early', { timeout: 30_000 });
  await expect(note).toContainText('Today');
  await note.getByRole('button', { name: 'Loop bar 3 at 70 bpm' }).click();
  await expect(page.locator('.session-goal')).toContainText('bar 3');
  await expect(page.locator('.session-goal')).toContainText('70 bpm');
  await note.getByRole('button', { name: 'Clear note' }).click();
  await expect(note).toBeHidden();
  expect((await saved(page)).pieceNotes).toEqual({});
});

test('the keys play through the tuner, its string cards sound their notes, and Help still stops the keys', async ({ page }) => {
  await seedSettings(page, { ...STUDIO, practiceInstrument: 'bass' });
  await page.goto('/');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  const lastPlayed = page.locator('.free-play-bar');
  await expect(lastPlayed).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Tuner', exact: true }).first().click();
  const tuner = page.getByRole('dialog', { name: 'Tuner' });
  await expect(tuner).toBeVisible();
  const face = tuner.locator('.tuner-face');

  // A computer key, with the tuner open: it sounds, and the tuner shows it as the reference.
  await page.keyboard.press('h');
  await expect(lastPlayed).toContainText('A4');
  await expect(face).toHaveAttribute('data-reference', 'A4');

  // A string card plays that open string.
  await tuner.getByRole('button', { name: 'Play string 4, E1' }).click();
  await expect(lastPlayed).toContainText('E1');
  await expect(face).toHaveAttribute('data-reference', 'E1');
  await tuner.getByRole('button', { name: 'Done' }).click();

  // A dialog that is not for playing into still keeps the keys from playing under it.
  await page.getByRole('button', { name: 'More', exact: true }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.keyboard.press('d');
  await expect(lastPlayed).not.toContainText('E4');
});

test('the cello is bowed or plucked: plucked, a press rings by itself and no bow is drawn', async ({ page }) => {
  await seedSettings(page, { ...STUDIO, practiceInstrument: 'cello' });
  await page.goto('/');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  const how = page.getByRole('group', { name: 'How to play the cello' });
  await expect(how.getByRole('button', { name: 'Bow' })).toHaveAttribute('aria-pressed', 'true', { timeout: 30_000 });
  const card = page.locator('.bow-card');

  // Bowed: the note sounds while it is held, with the bow on the string.
  const openC = card.getByRole('button', { name: 'Bow the open C string' });
  const box = await openC.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator('.bowed-bow')).toHaveCount(1);
  await page.mouse.up();

  // Plucked: a press, no bow, and the string stops sounding by itself.
  await how.getByRole('button', { name: 'Fingers' }).click();
  await expect(how.getByRole('button', { name: 'Fingers' })).toHaveAttribute('aria-pressed', 'true');
  await card.getByRole('button', { name: 'Pluck the open G string' }).click();
  await expect(page.locator('.free-play-bar')).toContainText('G2');
  await expect(page.locator('.bowed-bow')).toHaveCount(0);
  await expect(card.locator('.sounding')).toHaveCount(0, { timeout: 3_000 });
  expect((await saved(page)).bowedTechnique).toEqual({ cello: 'fingers' });
});

/**
 * Every "pick one" row (a trough of buttons in one line): each segment inside its trough and centred top to bottom.
 * The trough is sized by its segments; a fixed trough height once let the chosen segment stand 5px out of it.
 */
const segmentsOutOfLine = page => page.evaluate(() => {
  const found = [];
  for (const box of document.querySelectorAll('body *')) {
    if (!box.offsetParent || box.matches('[role="tablist"]')) continue;
    const shown = [...box.children].filter(k => k.offsetParent);
    if (shown.length < 2 || !shown.every(k => k.matches('button'))) continue;
    const cs = getComputedStyle(box);
    if (!(parseFloat(cs.borderTopWidth) > 0 || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor))) continue;
    if (new Set(shown.map(k => Math.round(k.getBoundingClientRect().top))).size > 1) continue;
    const r = box.getBoundingClientRect();
    const top = r.top + parseFloat(cs.borderTopWidth), bottom = r.bottom - parseFloat(cs.borderBottomWidth);
    for (const k of shown) {
      const q = k.getBoundingClientRect();
      const above = q.top - top, below = bottom - q.bottom;
      if (above < -0.5 || below < -0.5 || Math.abs(above - below) > 1.5) found.push(`${box.className || box.getAttribute('aria-label')}: "${k.textContent.trim()}" ${above.toFixed(1)}/${below.toFixed(1)}`);
    }
  }
  return found;
});

test('every segmented control holds its segments inside it, centred, in the studio and its settings', async ({ page }) => {
  await seedSettings(page, STUDIO);
  await page.goto('/');
  await expect(page.locator('.pad-play')).toBeVisible({ timeout: 30_000 });
  expect(await segmentsOutOfLine(page)).toEqual([]);
  await page.getByRole('button', { name: /Practice settings/ }).first().click();
  await expect(page.locator('.hands-switch')).toBeVisible();
  expect(await segmentsOutOfLine(page)).toEqual([]);
});

test.describe('on a phone', () => {
  test('the one-row deck keeps Play, the modes and More level, with the modes centred', async ({ page }) => {
    await seedSettings(page, STUDIO);
    await page.goto('/');
    await expect(page.locator('.pad-play')).toBeVisible({ timeout: 30_000 });
    expect(await segmentsOutOfLine(page)).toEqual([]);
    const heights = await page.evaluate(() => ['.pad-play', '.controls .mode-switch', '.deck-more-toggle'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    expect(new Set(heights).size).toBe(1);
    await page.goto('/#/home/piano');
    await expect(page.locator('.learning-instruments')).toBeVisible({ timeout: 30_000 });
    expect(await segmentsOutOfLine(page)).toEqual([]);
    expect(await page.locator('.learning-instruments').evaluate(row => row.scrollWidth - row.clientWidth)).toBeLessThanOrEqual(0);
  });

  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('the palette fills the screen and nothing scrolls sideways', async ({ page }) => {
    await seedSettings(page, STUDIO);
    await page.goto('/');
    await expect(page.locator('.search-trigger')).toBeVisible({ timeout: 30_000 });
    await page.locator('.search-trigger').click();
    const palette = page.getByRole('dialog', { name: 'Find anything' });
    await expect(palette).toBeVisible();
    const box = await palette.boundingBox();
    expect(Math.round(box.width)).toBe(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });

  test('the tour speaks of tapping, not of keys a phone does not have', async ({ page }) => {
    await seedSettings(page, { ...STUDIO, studioTourDone: false });
    await page.goto('/');
    const tip = page.locator('.coach-tip');
    await expect(tip).toContainText('Tap Play when you are ready', { timeout: 30_000 });
    await tip.getByRole('button', { name: 'Next' }).click();
    await expect(tip.locator('h2')).toHaveText('Three ways to practise');
    await expect(tip).not.toContainText('Keys 1, 2 and 3');
  });
});
