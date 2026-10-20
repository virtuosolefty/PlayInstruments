import { test, expect } from '@playwright/test';
import { collectErrors, seedSettings } from '../helpers/studio.js';

/**
 * The 19 October pass, after the best AI-built apps: the view switch and the
 * inspector on the studio's stage, the transport under the keys, the lesson's
 * step as a card on the stage with its guide in tappable cues, and tonight's
 * checklist on the learning home. What a unit test cannot see: where things
 * sit, and that they drive the real app.
 */

test.use({ viewport: { width: 1280, height: 800 } });

test('the studio: views on the stage, the transport under the keys, Practice settings beside Focus', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { practiceInstrument: 'piano', renderer: 'canvas', learningView: 'studio', view: 'roll' });
  await page.goto('/');
  const views = page.getByRole('group', { name: 'How to show the music' });
  await expect(views).toBeVisible({ timeout: 30_000 });
  await views.getByRole('button', { name: 'Sheet music', exact: true }).click();
  await expect(views.getByRole('button', { name: 'Sheet music', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.staff-view')).toBeVisible();
  await views.getByRole('button', { name: 'Falling notes', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Stage appearance' }).getByRole('button', { name: '2D Trainer', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // The deck sits under the keys; Practice settings is in the header, beside Focus.
  const stage = await page.locator('#practice-stage').boundingBox();
  const deck = await page.locator('.controls.deck').boundingBox();
  expect(deck.y).toBeGreaterThanOrEqual(stage.y + stage.height - 1);
  await expect(page.locator('.studio-header').getByRole('button', { name: 'Practice settings' })).toBeVisible();
  await expect(page.locator('.controls.deck').getByRole('button', { name: 'Practice settings' })).toHaveCount(0);

  // The footer lists the keys that work.
  await expect(page.locator('.shortcut-legend .shortcut:visible')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('the inspector: a bar chosen in the timeline, heard, looped, and let go of when a run starts', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { practiceInstrument: 'piano', renderer: 'canvas', learningView: 'studio' });
  await page.goto('/');
  const map = page.locator('.minimap');
  await expect(map).toBeVisible({ timeout: 30_000 });
  const box = await map.boundingBox();
  await page.mouse.click(box.x + box.width * 0.3, box.y + box.height / 2);
  const inspector = page.locator('.inspector');
  await expect(inspector).toBeVisible();
  await expect(inspector).toContainText(/SELECTED · BAR \d+ OF \d+/);
  await inspector.getByRole('button', { name: 'Bar 1', exact: true }).click();
  await expect(inspector).toContainText('SELECTED · BAR 1 OF');
  await inspector.getByRole('button', { name: /^Loop bars 1/ }).click();
  await expect(page.getByRole('button', { name: 'Clear loop' })).toBeVisible();
  await page.getByRole('button', { name: 'Close bar details' }).click();
  await expect(inspector).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a lesson: the step on the stage, the guide in cues, a term explained where it appears', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { practiceInstrument: 'piano', renderer: 'canvas', learningView: 'lesson', learning: { piano: { lessonId: 'path-01-home-five-right', step: 'sound' } } });
  await page.goto('/');
  const card = page.locator('.step-card');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText('STEP 1 OF 6');
  await expect(card.getByRole('button', { name: 'Play a test note', exact: true })).toBeVisible();
  // The button is on the card only, not in the guide as well.
  await expect(page.getByRole('button', { name: 'Play a test note', exact: true })).toHaveCount(1);

  const cues = page.locator('.lesson-cues li');
  await expect(cues).toHaveCount(3);
  await expect(cues.first()).toContainText('Fingers 1–5 rest on C–G');
  await page.locator('.lesson-cues').getByRole('button', { name: 'beat', exact: true }).click();
  await expect(page.locator('.lesson-cues .term-meaning:visible')).toContainText('The steady pulse');
  // The pager names only the current step, and every step keeps its name.
  await expect(page.locator('.lesson-bar').getByRole('button', { name: /Follow along/ })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('the learning home: tonight in minutes, a ring of runs, an item per line', async ({ page }) => {
  const errors = collectErrors(page);
  await seedSettings(page, { practiceInstrument: 'piano', renderer: 'canvas', learningView: 'home' });
  await page.goto('/');
  const card = page.locator('.daily-learning-card');
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText(/Tonight, about \d+ minutes?\./);
  await expect(card.getByRole('img', { name: /\d+ of \d+ runs today/ })).toBeVisible();
  await expect(card.locator('.tonight-list .mins').first()).toHaveText(/\d+ min/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A clear path to your first song.');
  expect(errors).toEqual([]);
});
