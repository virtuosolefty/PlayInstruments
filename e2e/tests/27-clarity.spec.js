import { test, expect } from '@playwright/test';
import { collectErrors, seedSettings } from '../helpers/studio.js';

/**
 * The 18 October pass (src/styles/clarity.css): what a unit test cannot see.
 * The phone's deck is one row until More opens it, and at full detail the
 * drum stage plays the downloaded acoustic kit.
 */

test.describe('on an upright phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('the deck is one row of Play, mode and More; the tools and tempo open beneath it', async ({ page }) => {
    const errors = collectErrors(page);
    await seedSettings(page, { practiceInstrument: 'piano', renderer: 'canvas', learningView: 'studio' });
    await page.goto('/');
    const deck = page.locator('.controls.deck');
    await expect(deck).toBeVisible({ timeout: 30_000 });
    const play = deck.getByRole('button', { name: /Play/ }).first();
    const more = deck.getByRole('button', { name: 'More controls' });
    const wait = deck.getByRole('button', { name: 'Wait for me' });
    const loop = deck.getByRole('button', { name: /Loop/ });
    for (const control of [play, more, wait]) await expect(control).toBeVisible();
    const tops = await Promise.all([play, more, wait].map(async control => Math.round((await control.boundingBox()).y)));
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(4);
    expect((await deck.boundingBox()).height).toBeLessThanOrEqual(72);
    await expect(loop).toBeHidden();
    await more.click();
    await expect(more).toHaveAttribute('aria-expanded', 'true');
    await expect(loop).toBeVisible();
    await expect(deck.getByRole('slider', { name: 'Playback speed' })).toBeVisible();
    for (const control of [play, more, wait, loop]) {
      const box = await control.boundingBox();
      expect(box.x + box.width).toBeLessThanOrEqual(390);
    }
    expect(errors).toEqual([]);
  });
});

test('at full detail the drum stage plays the acoustic kit, with the next drum named', async ({ page }) => {
  test.slow();
  await seedSettings(page, { practiceInstrument: 'drums', renderer: 'gl', stageQuality: 'full', learningView: 'studio' });
  await page.goto('/');
  const stage = page.locator('.drum-stage[data-ready="true"]');
  await expect(stage).toHaveAttribute('data-stage-kit', 'drums-acoustic', { timeout: 90_000 });
  // The next drum's name is lit with it.
  await expect(stage.locator('.drum-label.next')).toHaveCount(1, { timeout: 10_000 });
  await expect(stage.locator('.drum-label.next')).toContainText('Kick');
});

test('the piano\'s whole view shows the grand, whose keys go down as you play', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await seedSettings(page, { practiceInstrument: 'piano', renderer: 'gl', stageQuality: 'full', learningView: 'studio', entryFreePlay: true });
  await page.goto('/');
  const views = page.getByRole('group', { name: 'Stage view' });
  await expect(views.getByRole('button', { name: 'Whole instrument' })).toHaveText('Whole instrument', { timeout: 60_000 });
  await views.getByRole('button', { name: 'Whole instrument' }).click();
  await page.getByRole('dialog', { name: 'Whole instrument' }).locator('.model-card', { has: page.getByText('Grand piano', { exact: true }) }).click();
  const viewer = page.locator('.model-viewer[data-model="piano-grand"][data-ready="true"]');
  await expect(viewer).toBeVisible({ timeout: 90_000 });
  await expect(page.locator('.model-caption')).toContainText('EastSeaSaltfishnet');
  // The computer keys still play: A, D and G are C4, E4 and G4.
  await page.locator('#practice-stage').focus();
  for (const key of ['a', 'd', 'g']) await page.keyboard.down(key);
  await expect(viewer).toHaveAttribute('data-keys-down', '3');
  for (const key of ['a', 'd', 'g']) await page.keyboard.up(key);
  await expect(viewer).toHaveAttribute('data-keys-down', '0');
  expect(errors).toEqual([]);
});
