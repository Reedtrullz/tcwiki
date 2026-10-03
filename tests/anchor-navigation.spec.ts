import { expect, test } from '@playwright/test';
import { mockSwapperFirstNetwork } from './helpers/thornode-mocks';

for (const href of ['/economics#runepool-pol-live', '/dynamic-fees#dynamic-fee-controller-config']) {
  test(`direct and reloaded disclosure destination is revealed: ${href}`, async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.goto(href);
    const target = page.locator(href.split('#')[1] ? `#${href.split('#')[1]}` : 'main');
    await expect(target).toBeVisible();
    await expect.poll(async () => (await target.boundingBox())?.y ?? Infinity).toBeLessThan(300);
    await expect.poll(async () => target.evaluate(node => {
      let parent: HTMLElement | null = node as HTMLElement;
      while (parent) { if (parent instanceof HTMLDetailsElement && !parent.open) return false; parent = parent.parentElement; }
      return true;
    })).toBe(true);
    await page.reload();
    await expect(target).toBeVisible();
    await expect.poll(async () => (await target.boundingBox())?.y ?? Infinity).toBeLessThan(300);
    // Reader closing is preserved until another explicit fragment navigation.
    const details = target.locator('xpath=ancestor-or-self::details[1]');
    await details.locator(':scope > summary').click();
    await expect(details).not.toHaveAttribute('open');
    await page.evaluate(() => { window.location.hash = 'main'; });
    await page.goBack();
    await expect(details).toHaveAttribute('open', '');
  });
}
test('same-fragment keyboard links reopen only the requested disclosure and missing targets explain the state', async ({ page }) => {
  await page.goto('/dynamic-fees#dynamic-fee-controller-config');
  const target = page.locator('#dynamic-fee-controller-config');
  await expect(target).toHaveAttribute('open', '');
  await target.locator(':scope > summary').click();
  const link = page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: /Controller config/i });
  if (await link.isVisible()) { await link.focus(); await page.keyboard.press('Enter'); }
  else await page.evaluate(() => { window.location.hash = 'main'; window.location.hash = 'dynamic-fee-controller-config'; });
  await expect(target).toHaveAttribute('open', '');
  await page.evaluate(() => { window.location.hash = 'unavailable-conditional-section'; });
  await expect(page.getByRole('alert').filter({ hasText: 'The linked section' })).toContainText('linked section is unavailable', { timeout: 7000 });
  await page.getByRole('button', { name: 'Dismiss section navigation message' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'The linked section' })).toHaveCount(0);
});
