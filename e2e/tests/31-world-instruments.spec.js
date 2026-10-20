import { test, expect } from '@playwright/test';
import { collectErrors, seedSettings } from '../helpers/studio.js';

/**
 * The tabla, the handpan and the veena (19 October 2026): their own picker buttons, lessons on lanes, pads and keys
 * that play the two struck ones, and their 3D stages, which a struck note lights; the veena's lessons in swaras on
 * its fretboard and its downloaded model. Played on the 2D pads and fretboard unless a test asks for the stage.
 */

const STORAGE = 'piano-practice-coach:v1';
const saved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)).settings, STORAGE);
const lastPlayed = page => page.locator('.free-play-bar');

test.use({ viewport: { width: 1280, height: 800 } });

test('the pickers offer the tabla and the handpan, each on a button of its own', async ({ page }) => {
  await seedSettings(page, { learningView: 'home', renderer: 'canvas' });
  await page.goto('/');
  const picker = page.getByRole('group', { name: /instrument/i }).first();
  await expect(picker.getByRole('button', { name: 'Tabla' })).toBeVisible({ timeout: 30_000 });
  await picker.getByRole('button', { name: 'Handpan' }).click();
  await expect.poll(async () => (await saved(page)).practiceInstrument).toBe('handpan');
  await expect(page.locator('.learning-home')).toContainText('Meet the ding');
});

test('the tabla: a lesson names its bols, the keys play them, Dha is two strokes at once', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'tabla', tablaStudyId: 'tabla-dha-both-hands' });
  await page.goto('/');
  await expect(page.locator('.studio-heading h1')).toHaveText('Dha: both hands', { timeout: 30_000 });
  await expect(page.locator('.drum-lanes')).toHaveAttribute('aria-label', /^Tabla bols, top to bottom: Na, Ge\./);
  await expect(page.locator('.guitar-next strong')).toHaveText('Dha · Na + Ge · press N + G');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  await expect(page.getByRole('group', { name: 'Tabla strokes' }).getByRole('button')).toHaveCount(6);
  await page.keyboard.press('g');
  await expect(lastPlayed(page)).toContainText('Ge');
  await page.getByRole('group', { name: 'Tabla strokes' }).getByRole('button', { name: /^Tin/ }).click();
  await expect(lastPlayed(page)).toContainText('Tin');
  expect(errors).toEqual([]);
});

test('the handpan: the keys climb the top, the bottom row plays the underside', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'handpan' });
  await page.goto('/');
  await expect(page.locator('.studio-heading h1')).toHaveText('Meet the ding', { timeout: 30_000 });
  await expect(page.locator('.guitar-next strong')).toHaveText('D3 · press A');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  await expect(page.getByRole('group', { name: 'Handpan notes' }).getByRole('button')).toHaveCount(18);
  // The pan has its own voice, which rings on after a key is let go.
  await expect.poll(() => page.evaluate(async () => (await import('/src/lib/audio/audio.js')).audio.instrumentType)).toBe('handpan');
  for (const [key, note] of [['a', 'D3'], ['s', 'F#3'], ["'", 'F#5'], ['z', 'B2'], ['m', 'E5']]) {
    await page.keyboard.press(key);
    await expect(lastPlayed(page), key).toContainText(note);
  }
  expect(errors).toEqual([]);
});

test('the veena: lessons name the swara, the fretboard plays Sa and Pa, free play has its own words', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'veena', veenaStudyId: 'veena-sa-pa' });
  await page.goto('/');
  await expect(page.locator('.studio-heading h1')).toHaveText('Sa, Pa, and Sa above', { timeout: 30_000 });
  await expect(page.locator('.guitar-next strong')).toHaveText('Sa · D3 · string 1 · open');
  const board = page.getByRole('group', { name: 'Playable veena fretboard' });
  // Sarani, the highest, is string 1.
  await expect(board.locator('.string-name')).toHaveText(['D3', 'A2', 'D2', 'A1']);
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  await expect(page.getByRole('region', { name: 'Open strings' })).toContainText('Sa, Pa, Sa, Pa');
  await board.getByRole('button', { name: 'String 1, fret 7, A3' }).click();
  await expect(lastPlayed(page)).toContainText('A3');
  expect(errors).toEqual([]);
});

test('the handpan’s 2D view is the pan: the ding in the middle, a tap on a field plays it', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'handpan' });
  await page.goto('/');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  const map = page.getByRole('group', { name: 'Handpan notes' });
  await expect(map.locator('.pan.top .pan-field')).toHaveCount(11);
  await expect(map.locator('.pan.under .pan-field')).toHaveCount(7);
  // The ding sits in the middle of the top.
  const ding = await map.locator('.pan-field.ding').boundingBox(), pan = await map.locator('.pan.top').boundingBox();
  expect(Math.abs(ding.x + ding.width / 2 - (pan.x + pan.width / 2))).toBeLessThan(2);
  await map.getByRole('button', { name: /^E5, underside/ }).click();
  await expect(lastPlayed(page)).toContainText('E5');
  // The long list of keys beside it is folded.
  await expect(page.locator('.drum-card li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Show all 18 keys' }).click();
  await expect(page.locator('.drum-card li')).toHaveCount(18);
  expect(errors).toEqual([]);
});

test('the tabla’s 2D view is the tabla: each bol marked where it is struck', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'tabla' });
  await page.goto('/');
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  const tabla = page.getByRole('group', { name: 'Tabla strokes' });
  await expect(tabla.locator('img')).toBeVisible();
  await expect(tabla.getByRole('button')).toHaveCount(6);
  await tabla.getByRole('button', { name: /^Na, the rim/ }).click();
  await expect(lastPlayed(page)).toContainText('Na');
  // Na on the dayan (right), Ge on the bayan (left).
  const na = await tabla.getByRole('button', { name: /^Na/ }).boundingBox(), ge = await tabla.getByRole('button', { name: /^Ge/ }).boundingBox();
  expect(na.x).toBeGreaterThan(ge.x);
  expect(errors).toEqual([]);
});

test('the veena’s fretboard names the raga’s swaras on the sarani, and a drone plays under it', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'veena', veenaStudyId: 'veena-sarali-1' });
  await page.goto('/');
  const board = page.getByRole('group', { name: 'Playable veena fretboard' });
  // The open Sa is the next note, so it shows its fret; the rest of the raga shows by swara.
  await expect(board.locator('button.swara')).toHaveText(['Ri', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'Sa']);
  await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
  const drone = page.getByRole('toolbar', { name: 'Free play' }).getByRole('button', { name: 'Drone' });
  await drone.click();
  await expect(drone).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('piano-practice-coach:v1')).settings.drone)).toBe(true);
  expect(errors).toEqual([]);
});

test.describe('on the 3D stage', () => {
  test.slow();

  test('the handpan turns over to its underside, and a struck note lights its field', async ({ page }) => {
    const errors = collectErrors(page);
    await seedSettings(page, { learningView: 'studio', renderer: 'gl', stageQuality: 'light', practiceInstrument: 'handpan' });
    await page.goto('/');
    await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
    const stage = page.locator('.handpan-stage');
    await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await expect(stage.locator('.drum-label')).toHaveCount(11);
    await stage.getByRole('button', { name: 'Underside', exact: true }).click();
    await expect(stage).toHaveAttribute('data-side', 'underside');
    await expect(stage.locator('.drum-label')).toHaveCount(7, { timeout: 5_000 });
    await page.keyboard.press('z');
    await expect(lastPlayed(page)).toContainText('B2');
    expect(errors).toEqual([]);
  });

  test('the veena is played on its model: four strings named at the nut, the next note marked', async ({ page }) => {
    const errors = collectErrors(page);
    await seedSettings(page, { learningView: 'studio', renderer: 'gl', stageQuality: 'full', practiceInstrument: 'veena' });
    await page.goto('/');
    const stage = page.locator('.fretted-model-stage');
    await expect(stage).toHaveAttribute('data-stage-model', 'veena', { timeout: 90_000 });
    await expect(page.locator('.guitar-position-label.string')).toHaveText(['4 A1', '3 D2', '2 A2', '1 D3'], { timeout: 60_000 });
    await expect(stage).toHaveAttribute('data-target-positions', '1', { timeout: 30_000 });
    await expect(stage.locator('.model-credit')).toHaveText('3D model by mayam3D');
    expect(errors).toEqual([]);
  });

  test('the tabla stands on the stage with its credit, the dayan and the bayan named with their keys', async ({ page }) => {
    const errors = collectErrors(page);
    await seedSettings(page, { learningView: 'studio', renderer: 'gl', stageQuality: 'light', practiceInstrument: 'tabla' });
    await page.goto('/');
    await page.locator('button:visible', { hasText: /^Free play$/ }).first().click();
    const stage = page.locator('.tabla-stage');
    await expect(stage).toHaveAttribute('data-ready', 'true', { timeout: 90_000 });
    await expect(stage.locator('.drum-label')).toHaveCount(2);
    expect((await stage.locator('.drum-label').allInnerTexts()).map(t => t.split('\n')[0]).sort()).toEqual(['Bayan', 'Dayan']);
    // Its strokes' keys beside each drum: G and K on the bayan, N T U E on the dayan.
    await expect(stage.locator('.drum-label kbd')).toHaveCount(6);
    await expect(stage.locator('.model-credit')).toHaveText('3D model by Marcel Porsiel');
    expect(errors).toEqual([]);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('free play opens on the instrument, its card folded to one line under it', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'veena' });
    await page.goto('/');
    await page.getByRole('button', { name: /Change instrument or workspace/ }).click();
    await page.getByRole('group', { name: 'Workspace', exact: true }).getByRole('button', { name: 'Free play', exact: true }).click();
    const board = page.getByRole('group', { name: 'Playable veena fretboard' });
    const folded = page.locator('.folded-card');
    await expect(folded.locator(':scope > summary')).toHaveText('Open strings · Sa Pa Sa Pa');
    expect((await board.boundingBox()).y).toBeLessThan((await folded.boundingBox()).y);
    await folded.locator(':scope > summary').click();
    await expect(page.getByRole('region', { name: 'Open strings' })).toBeVisible();
  });

  test('the library shows all eight instruments in two rows', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'tabla' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Library', exact: true }).first().click();
    const row = page.getByRole('group', { name: 'Library instrument' });
    await expect(row.getByRole('button')).toHaveCount(8);
    const tops = await row.getByRole('button').evaluateAll(buttons => [...new Set(buttons.map(b => Math.round(b.getBoundingClientRect().top)))]);
    expect(tops).toHaveLength(2);
    expect(await row.getByRole('button').evaluateAll(buttons => buttons.every(b => b.getBoundingClientRect().right <= innerWidth))).toBe(true);
  });

  test('the welcome page does not move as its fonts arrive', async ({ page }) => {
    await page.addInitScript(() => { window.__shift = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shift += entry.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await page.goto('/');
    await expect(page.locator('.welcome-page h1')).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.__shift)).toBeLessThan(0.05);
  });

  test('the home row holds every instrument in two rows of four, nothing to scroll', async ({ page }) => {
    await seedSettings(page, { learningView: 'home', renderer: 'canvas' });
    await page.goto('/');
    const row = page.locator('.learning-instruments');
    await expect(row).toBeVisible({ timeout: 30_000 });
    const tops = await row.locator('button').evaluateAll(buttons => [...new Set(buttons.map(b => Math.round(b.getBoundingClientRect().top)))]);
    expect(tops).toHaveLength(2);
    expect(await row.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
  });
});
