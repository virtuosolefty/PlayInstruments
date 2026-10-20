import { test, expect } from '@playwright/test';

async function seed(page, instrument, extra = {}) {
  await page.addInitScript(({ instrument, extra }) => {
    if (!localStorage.getItem('piano-practice-coach:v1')) localStorage.setItem('piano-practice-coach:v1', JSON.stringify({ version: 1, songs: {}, settings: {
      settingsVersion: 5, onboarded: true, studioTourDone: true, practiceInstrument: instrument, learningView: 'lesson', renderer: 'gl', stageQuality: 'full', theme: 'dark',
      learning: { [instrument]: { lessonId: instrument === 'piano' ? 'path-01-home-five-right' : instrument === 'drums' ? 'drums-meet-the-kit' : `${instrument}-open-strings`, step: 'note', soundConfirmed: true } }, ...extra,
    } }));
  }, { instrument, extra });
}

for (const instrument of ['piano', 'guitar', 'bass', 'violin', 'cello', 'drums']) {
  test(`phone ${instrument}: instructions and the playable instrument fit together`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page, instrument);
    await page.goto('/');
    await expect(page.locator('.lesson-dock')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('.pane.right')).not.toBeInViewport();
    const canvas = page.locator(instrument === 'piano' ? '.roll-area canvas' : '.guitar-stage[data-stage-tier] > canvas').first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect.poll(async () => {
      const box = await canvas.boundingBox();
      const pane = await page.locator('.pane.center').boundingBox();
      return Math.min(box.y + box.height, pane.y + pane.height) - Math.max(box.y, pane.y);
    }).toBeGreaterThanOrEqual(180);
    await expect(page.locator('.lesson-dock')).toContainText(instrument === 'drums' ? 'Kick' : instrument === 'piano' ? 'C4' : 'open');
    if (instrument === 'piano') {
      await page.locator('.lesson-dock').getByRole('button', { name: 'Play C4 on screen' }).click();
      await expect(page.locator('.lesson-bar [aria-current="step"]')).toContainText('Listen');
    }
    if (instrument === 'guitar' || instrument === 'bass') {
      await page.locator('.guitar-fret-controls > summary').click();
      const sizes = await page.locator('.guitar-string button').evaluateAll(buttons => buttons.map(button => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      expect(sizes.every(size => size.width >= 40 && size.height >= 40)).toBe(true);
    }
  });
}

test('phone home offers its primary lesson action before scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, 'bass', { learningView: 'home', learning: {} });
  await page.goto('/');
  const button = page.getByRole('button', { name: /Start my first lesson/ });
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box.y + box.height).toBeLessThan(776);
});

test('downloaded kit: tapping a head plays it and keyboard reset keeps focus', async ({ page }) => {
  test.setTimeout(120_000);
  await seed(page, 'drums', { learningView: 'studio' });
  await page.goto('/');
  await page.getByRole('group', { name: 'Workspace', exact: true }).getByRole('button', { name: 'Free play', exact: true }).click();
  await page.getByRole('group', { name: 'Stage view' }).getByRole('button', { name: 'Whole instrument' }).click();
  await page.getByRole('dialog', { name: 'Whole instrument', exact: true }).waitFor();
  await page.locator('.model-card', { has: page.getByText('Acoustic kit', { exact: true }) }).click();
  const viewer = page.locator('.model-viewer');
  await expect(viewer).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await viewer.getByRole('button', { name: 'Play Snare drum', exact: true }).click();
  await expect(page.locator('.free-play-last strong')).toHaveText('Snare drum');
  const box = await viewer.locator('canvas').boundingBox();
  await page.mouse.move(box.x + 12, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const reset = viewer.getByRole('button', { name: 'Reset view' });
  await reset.focus(); await page.keyboard.press('Enter');
  await expect(reset).toHaveAttribute('aria-disabled', 'true');
  await expect(reset).toBeFocused();
});
