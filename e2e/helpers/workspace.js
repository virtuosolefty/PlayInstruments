/**
 * Chooses Learn or Free play.
 *
 * On an upright phone the workspace switch lives in the sheet the header's
 * button opens; everywhere else it is in the header itself.
 *
 * @param {import('@playwright/test').Page} page
 * @param {'Learn' | 'Free play'} name
 */
export async function chooseWorkspace(page, name) {
  await page.locator('.studio-header').waitFor();
  const sheet = page.getByRole('button', { name: /Change instrument or workspace/ });
  if (await sheet.isVisible()) await sheet.click();
  await page.getByRole('group', { name: 'Workspace', exact: true }).getByRole('button', { name, exact: true }).click();
}

/**
 * Opens the View pop-over on a guitar, bass, violin or cello stage, where the
 * options set once live: frets or reach, labels, label size, left-handed.
 * Leaves it open if it already is.
 *
 * @param {import('@playwright/test').Page} page
 */
export async function openView(page) {
  const view = page.locator('.view-options').first();
  if (!(await view.evaluate(el => el.open))) await view.locator('summary').click();
}

/**
 * Chooses 2D Trainer or 3D Stage with the switch on the stage itself (over
 * the piano's roll, or in a string or drum workspace's tool row).
 *
 * @param {import('@playwright/test').Page} page
 * @param {'2D Trainer' | '3D Stage'} name
 */
export async function setRenderer(page, name) {
  await page.getByRole('group', { name: 'Stage appearance' }).first().getByRole('button', { name, exact: true }).click();
}
