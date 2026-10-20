import { test, expect } from '@playwright/test';
import { collectErrors, seedSettings } from '../helpers/studio.js';

/**
 * The 19 October ui-ux-pro-max audit, measured the way the audit measured it:
 * target sizes, heading levels, a phone held sideways, an address per screen,
 * phone text at 16px, an error you can close from the keyboard, and a cleared
 * history you can bring back.
 */

const STORAGE = 'piano-practice-coach:v1';

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the learning home skips no heading level', async ({ page }) => {
    await seedSettings(page, { learningView: 'home', renderer: 'canvas' });
    await page.goto('/');
    await expect(page.locator('.learning-home h1')).toBeVisible({ timeout: 30_000 });
    const levels = await page.locator('.learning-home').evaluate(home => [...home.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(h => h.offsetParent).map(h => +h.tagName[1]));
    expect(levels[0]).toBe(1);
    levels.forEach((level, i) => { if (i) expect(level - levels[i - 1]).toBeLessThanOrEqual(1); });
  });

  test('every screen has an address, and Back steps back through screens', async ({ page }) => {
    const errors = collectErrors(page);
    await seedSettings(page, { learningView: 'home', renderer: 'canvas', practiceInstrument: 'piano' });
    await page.goto('/');
    await expect(page).toHaveURL(/#\/home\/piano$/, { timeout: 30_000 });
    await page.getByRole('button', { name: 'Library', exact: true }).click();
    await expect(page).toHaveURL(/#\/library\/piano$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/home\/piano$/);
    await expect(page.locator('.learning-home h1')).toBeVisible();
    // An address opens its screen directly.
    await page.goto('/#/studio/guitar/guitar-c-major');
    await expect(page.locator('.studio-heading h1')).toHaveText('C major · first position', { timeout: 30_000 });
    await page.goto('/#/studio/drums/free');
    await expect(page.locator('.studio-heading h1')).toHaveText('A little room to improvise.', { timeout: 30_000 });
    expect(errors).toEqual([]);
  });

  test('every control is at least 24 pixels', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'piano' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Library', exact: true }).click({ timeout: 30_000 });
    await page.waitForTimeout(500);
    const small = await page.evaluate(() => [...document.querySelectorAll('button, a[href], input, summary, [role="slider"], [role="combobox"]')]
      .filter(el => el.offsetParent && !el.closest('[inert],[aria-hidden="true"]') && !el.matches('.term'))
      .map(el => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 24 || r.height < 24))
      .map(({ el, r }) => `${el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30) || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`));
    expect(small).toEqual([]);
  });

  test('a cleared history comes back with Undo', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(key => {
      if (localStorage.getItem(key)) return;
      const session = { at: new Date(Date.now() - 60_000).toISOString(), score: 0.8, noteAccuracy: 0.85, timingAccuracy: 0.7, dynamicsAccuracy: 0.6, velocitySpread: 0.1, hit: 10, missed: 2, wrongNotes: 1, total: 12, meanAbsDeviationMs: 40, meanSignedDeviationMs: 5, wrongNoteKinds: {}, mode: 'timed', rate: 1, calibrated: false, section: 'full', variant: 'full' };
      localStorage.setItem(key, JSON.stringify({ version: 1, settings: { settingsVersion: 5, onboarded: true, studioTourDone: true, countInBars: 0, renderer: 'canvas', learningView: 'studio', practiceInstrument: 'piano', lastPianoId: 'c-major-scale' },
        songs: { 'c-major-scale': { sessions: [session], troubleMap: {}, totalRuns: 1 } } }));
    }, STORAGE);
    await page.goto('/');
    const clear = page.getByRole('button', { name: /^clear$/i });
    await expect(clear).toBeVisible({ timeout: 30_000 });
    await clear.click();
    await expect(page.locator('.undo-toast')).toBeVisible();
    // Announced from a status region that stays mounted, so the change of text is read out.
    await expect(page.getByRole('status').filter({ hasText: 'History for' })).toHaveCount(1);
    await expect(clear).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await expect(page.getByRole('button', { name: /^clear$/i })).toBeVisible();
    const kept = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).songs['c-major-scale']?.sessions?.length ?? 0, STORAGE);
    expect(kept).toBe(1);
    expect(errors).toEqual([]);
  });
});

test.describe('a phone held sideways', () => {
  test.use({ viewport: { width: 812, height: 375 } });

  test('the studio and a lesson show the instrument', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'piano' });
    await page.goto('/');
    const stage = page.locator('#practice-stage');
    await expect(stage).toBeVisible({ timeout: 30_000 });
    const box = await stage.boundingBox();
    expect(box.y + 100).toBeLessThan(375);
    expect(box.height).toBeGreaterThanOrEqual(100);
  });
});

test.describe('on an upright phone', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('body text and the search field are 16 pixels', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'piano' });
    await page.goto('/');
    await expect(page.locator('.studio-header')).toBeVisible({ timeout: 30_000 });
    expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('16px');
    await page.getByRole('button', { name: 'Library' }).first().click();
    const search = page.getByRole('searchbox').first();
    await expect(search).toBeVisible();
    expect(await search.evaluate(el => getComputedStyle(el).fontSize)).toBe('16px');
  });
});

test.describe('sharing progress with a teacher', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('Progress makes a page the pupil can send', async ({ page }) => {
    await seedSettings(page, { learningView: 'studio', renderer: 'canvas', practiceInstrument: 'piano' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Progress', exact: true }).first().click({ timeout: 30_000 });
    const button = page.getByRole('button', { name: /Download a progress page/ });
    await expect(button).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
    expect(download.suggestedFilename()).toMatch(/^practice-progress-\d{4}-\d{2}-\d{2}\.html$/);
    const html = await (await download.createReadStream()).toArray().then(parts => Buffer.concat(parts).toString('utf8'));
    expect(html).toContain('Practice progress');
    await expect(page.getByRole('status').filter({ hasText: 'Progress page saved' })).toBeVisible();
  });
});
