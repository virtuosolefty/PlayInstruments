/**
 * shoot.mjs — look at the running app.
 *
 * The gap this closes: nothing in `npm test` can see. jsdom stubs the canvas
 * and has no WebGL at all, so a roll that draws nothing, a lane in the wrong
 * colour or a control that throws the moment you touch it all pass the suite
 * without complaint. Two bugs shipped that way in a day — a suspended audio
 * clock behind a green light, and a renderer that crashed on its own toggle.
 *
 * Not a test framework. It opens the dev server in a real Chromium, drives it,
 * and writes PNGs plus every console message and page error to
 * `shots/`. What it is for is being *looked at*.
 *
 *   node scripts/dev/shoot.mjs [url]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'http://localhost:5199/';
const OUT = 'shots';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: process.platform === 'win32' ? ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'] : [] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

/** Everything the page says about itself, kept whether or not it looks fatal. */
const log = [];
page.on('console', (m) => log.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => log.push(`[pageerror] ${e.message}`));
page.on('requestfailed', (r) => log.push(`[requestfailed] ${r.url()} — ${r.failure()?.errorText}`));

const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`  wrote ${OUT}/${name}.png`);
};

try {
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await wait(1200);
  await shot('01-boot');

  const welcome = page.locator('.welcome-page');
  if (await welcome.count()) {
    await page.getByRole('button', { name: 'Explore freely', exact: true }).click();
    await page.getByRole('group', { name: 'Workspace', exact: true }).getByRole('button', { name: 'Learn', exact: true }).click();
    await shot('02-after-welcome');
  }

  const appearance = async (name) => {
    await page.getByRole('button', { name: 'Instrument settings', exact: true }).click();
    await page.getByRole('group', { name: 'Stage appearance' }).getByRole('button', { name, exact: true }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  };
  await appearance('2D Trainer');
  await shot('03-canvas-roll');
  await page.getByRole('button', { name: 'Instrument settings', exact: true }).click();
  await shot('04-options-open');
  await page.keyboard.press('Escape');
  await appearance('3D Stage');
  await page.locator('.roll-area canvas').first().waitFor();
  await shot('05-gl-roll');

  // Exercise renderer teardown and recreation in a real browser.
  for (let i = 0; i < 6; i += 1) await appearance(i % 2 === 0 ? '2D Trainer' : '3D Stage');
  await shot('07-after-toggling');

  // Playing, so the hit line, keys and level meter have something to show.
  await page.locator('#practice-stage').focus();
  await page.keyboard.press('Space');
  await wait(2500);
  await page.locator('.count-in').waitFor({ state: 'hidden', timeout: 20000 });
  await wait(800);
  await shot('06-gl-playing');
  await page.keyboard.press('Space');
} catch (err) {
  process.exitCode = 1;
  log.push(`[shoot] ${err.message}`);
  await shot('99-failed');
} finally {
  writeFileSync(`${OUT}/console.log`, log.join('\n') + '\n');
  console.log(`\n--- page output (${log.length} lines) ---`);
  console.log(log.join('\n') || '  (silent)');
  if (log.some(line => line.startsWith('[pageerror]'))) process.exitCode = 1;
  await browser.close();
}
