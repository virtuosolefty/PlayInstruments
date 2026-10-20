/**
 * Picks a choice from a Listbox, the app's stand-in for a native select
 * (src/components/Listbox.jsx): opens it, then clicks the option with that
 * value in the list it opened. The list is portaled to the body, so it is
 * found through the trigger's aria-controls rather than inside the trigger.
 *
 * @param {import('@playwright/test').Locator} combobox the trigger, e.g. getByRole('combobox', { name: 'Guitar exercise' })
 * @param {string} value the option's value, as a select's option value was
 */
export async function choose(combobox, value) {
  // getByLabel also finds the open list, which carries the same name: keep to the trigger.
  const trigger = combobox.and(combobox.page().locator('[role="combobox"]'));
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  const list = trigger.page().locator(`[id="${await trigger.getAttribute('aria-controls')}"]`);
  await list.locator(`[role="option"][data-value="${value}"]`).click();
}

/**
 * Opens a Listbox and returns its list, to count or read the choices in it.
 *
 * @param {import('@playwright/test').Locator} combobox
 * @returns {Promise<import('@playwright/test').Locator>}
 */
export async function openList(combobox) {
  const trigger = combobox.and(combobox.page().locator('[role="combobox"]'));
  if ((await trigger.getAttribute('aria-expanded')) !== 'true') await trigger.click();
  return trigger.page().locator(`[id="${await trigger.getAttribute('aria-controls')}"]`);
}
