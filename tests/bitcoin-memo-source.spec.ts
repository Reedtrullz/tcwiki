import { test, expect } from '@playwright/test';

test('Bitcoin memo source stays an external pointer with coverage and settlement limits', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => { if (new URL(request.url()).hostname === 'opreturn.xyz') requests.push(request.url()); });
  await page.goto('/docs#bitcoin-memo-archive');
  const entry = page.locator('#bitcoin-memo-archive');
  await expect(entry).toContainText('Bitcoin-only and third-party');
  await expect(entry).toContainText('destination settlement');
  await expect(entry.getByRole('link', { name: 'OP_RETURN Bitcoin memo archive', exact: true })).toHaveAttribute('href', 'https://opreturn.xyz/p/thorchain');
  expect(requests).toEqual([]);
  for (const slug of ['streaming-swaps-refunds','build-query-data']) {
    await page.goto(`/deep-dives/${slug}#bitcoin-memo-archive-pointer`);
    await expect(page.getByRole('link', { name: 'curated OP_RETURN source entry', exact: true })).toHaveAttribute('href', '/docs#bitcoin-memo-archive');
    await expect(page.getByText(/does not prove memo validation/)).toBeVisible();
  }
});
