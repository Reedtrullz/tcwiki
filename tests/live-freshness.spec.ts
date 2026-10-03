import { expect, test } from '@playwright/test';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

test('operation evidence retains its receipt through offline failure, ages on resume and recovers manually', async ({ page, context }) => {
  const now = Date.now();
  await page.clock.install({ time: now });
  await mockSwapperFirstNetwork(page);
  let fail = false;
  let blockTime = now;
  await page.route(/\/base\/tendermint\/v1beta1\/blocks\/latest(?:\?.*)?$/, async route => {
    if (fail) await route.fulfill({ status: 503, body: 'offline provider' });
    else await fulfillJson(route, { block: { header: { height: '101', time: new Date(blockTime).toISOString() } } });
  });
  let quoteRequests = 0;
  page.on('request', request => { if (request.url().includes('/quote/swap')) quoteRequests += 1; });
  await page.goto('/network');
  const refresh = page.locator('#network-diagnostics').getByRole('button', { name: /Refresh .*THORNode.* data/i }).first();
  await expect(refresh).toBeEnabled({ timeout: 15000 });
  const sourceLine = refresh.locator('..');
  const checked = sourceLine.locator('span').filter({ hasText: /^Checked / }).first();
  // Wait for the mount revalidation to replace the real server seed with this browser fixture.
  // Browser revalidation uses the browser's one-block lag in both runtimes;
  // the Worker's server seed has its separate ten-block policy.
  const expectedHeight = 100;
  await expect(page.locator('#network-diagnostics').locator(`a[href*='/mimir?height=${expectedHeight}']`)).toHaveCount(1);
  await expect(refresh).toBeEnabled();
  const receipt = await checked.innerText();
  const source = await sourceLine.getByRole('link').first().getAttribute('href');
  fail = true;
  await context.setOffline(true);
  await refresh.click();
  await expect(page.getByText('Last good sample', { exact: true }).first()).toBeVisible();
  await expect(checked).toHaveText(receipt);
  await expect(sourceLine.getByRole('link').first()).toHaveAttribute('href', source!);
  await page.clock.setSystemTime(now + 31000);
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByText('Stale context', { exact: true }).first()).toBeVisible();
  await expect(page.locator('section[aria-labelledby="chain-availability-heading"]').locator('span:visible', { hasText: 'Dated context' }).first()).toBeVisible();
  fail = false;
  blockTime = now + 31000;
  await context.setOffline(false);
  await refresh.click();
  await expect(page.getByText('Stale context', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Last good sample', { exact: true })).toHaveCount(0);
  await expect(checked).not.toHaveText(receipt);
  expect(quoteRequests).toBe(0);
});
