import { test, expect } from '@playwright/test';

test.describe('THORChain Wiki Protocol Smoke Tests', () => {
  test('protocol page renders key content', async ({ page }) => {
    await page.goto('/protocol');
    await expect(page.getByRole('heading', { name: /Protocol Overview/i })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByText(/Threshold Signature Schemes/i)).toBeVisible();
    await expect(page.getByText(/2026-07-06 chain-catalog review/i)).toBeVisible();
    await expect(page.getByText(/Availability, routing, signing, LP actions, and pause state remain live\/current-only/i)).toBeVisible();
    await expect(page.locator('#chain-catalog-boundary')).toBeVisible();
    await expect(page.getByText('catalog is not availability')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Catalog Listed/i })).toBeVisible();
    await expect(page.getByText(/Swaps, LP actions, signing, gas, outbound availability, or route quoteability right now/i)).toBeVisible();
    await expect(page.locator('#chain-catalog-boundary').getByRole('link', { name: /Check a route/i })).toHaveAttribute('href', '/network#check-a-route');
    await expect(page.locator('#supported-chain-finder')).toBeVisible();
    const chainFinder = page.getByRole('group', { name: /Supported Chain Finder/i });
    await expect(chainFinder).toBeVisible();
    await expect(page.getByText(/Showing 12 of 12 catalog chain records/i)).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.locator('#chain-sol').getByText(/EdDSA/i)).toBeVisible();
    await expect(page.locator('#chain-sol').getByText(/catalog listed/i)).toBeVisible();
    await expect(page.locator('#chain-sol').getByRole('link', { name: /Check live state/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.locator('#chain-sol').getByRole('link', { name: /Check a route/i })).toHaveAttribute('href', '/network?from_asset=SOL.SOL&to_asset=BTC.BTC&amount=0.01#check-a-route');
    await expect(page.locator('#chain-btc').getByRole('link', { name: /Check a route/i })).toHaveAttribute('href', '/network?from_asset=BTC.BTC&to_asset=ETH.ETH&amount=0.01#check-a-route');
  });

  test('supported chain finder filters and preserves URL state', async ({ page }) => {
    await page.goto('/protocol');

    const chainFinder = page.getByRole('group', { name: /Supported Chain Finder/i });
    await chainFinder.getByLabel('Find supported chains').fill('sol');
    await expect(page).toHaveURL(/\/protocol\?q=sol$/);
    await expect(page.getByText(/Showing 1 of 12 catalog chain records/i)).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Search: sol')).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.locator('#chain-btc')).toHaveCount(0);

    await page.getByRole('button', { name: /Reset/i }).click();
    await expect(page).toHaveURL(/\/protocol$/);
    await expect(chainFinder.getByLabel('Find supported chains')).toHaveValue('');
    await expect(page.getByText(/Showing 12 of 12 catalog chain records/i)).toBeVisible();

    await chainFinder.getByLabel('Address format').selectOption('EIP-55');
    await expect(page).toHaveURL(/\/protocol\?format=EIP-55$/);
    await expect(page.getByText(/Showing 4 of 12 catalog chain records/i)).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Address format: EIP-55')).toBeVisible();
    await expect(page.locator('#chain-eth')).toBeVisible();
    await expect(page.locator('#chain-base')).toBeVisible();
    await expect(page.locator('#chain-sol')).toHaveCount(0);
  });

  test('supported chain finder hydrates direct filtered URLs and empty states', async ({ page }) => {
    await page.goto('/protocol?q=BTC.BTC');

    let chainFinder = page.getByRole('group', { name: /Supported Chain Finder/i });
    await expect(chainFinder.getByLabel('Find supported chains')).toHaveValue('BTC.BTC');
    await expect(page.getByLabel('Active supported-chain filters').getByText('Search: BTC.BTC')).toBeVisible();
    await expect(page.locator('#chain-btc')).toBeVisible();
    await expect(page.locator('#chain-sol')).toHaveCount(0);

    await page.evaluate(() => {
      window.history.pushState(window.history.state, '', '/protocol?q=sol&format=Base58&notes=has-note');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await expect(chainFinder.getByLabel('Find supported chains')).toHaveValue('sol');
    await expect(chainFinder.getByLabel('Address format')).toHaveValue('Base58');
    await expect(chainFinder.getByLabel('Review notes')).toHaveValue('has-note');
    await expect(page.getByLabel('Active supported-chain filters').getByText('Search: sol')).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Address format: Base58')).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Notes: Has review note')).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.locator('#chain-btc')).toHaveCount(0);

    await page.goto('/protocol?q=sol&format=Base58&notes=has-note');

    chainFinder = page.getByRole('group', { name: /Supported Chain Finder/i });
    await expect(chainFinder.getByLabel('Find supported chains')).toHaveValue('sol');
    await expect(chainFinder.getByLabel('Address format')).toHaveValue('Base58');
    await expect(chainFinder.getByLabel('Review notes')).toHaveValue('has-note');
    await expect(page.getByLabel('Active supported-chain filters').getByText('Search: sol')).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Address format: Base58')).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Notes: Has review note')).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.getByText(/Showing 1 of 12 catalog chain records/i)).toBeVisible();

    await page.goto('/protocol?q=sol&format=EIP-55');
    await expect(page.getByText(/No supported-chain catalog entries match Search: sol \+ Address format: EIP-55/i)).toBeVisible();
    await page.getByRole('button', { name: /Reset filters/i }).click();
    await expect(page).toHaveURL(/\/protocol$/);
    await expect(page.getByText(/Showing 12 of 12 catalog chain records/i)).toBeVisible();
  });

  test('supported chain finder remains readable on narrow viewports', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/protocol?q=sol&notes=has-note');

    await expect(page.locator('#supported-chain-finder')).toBeVisible();
    await expect(page.getByLabel('Active supported-chain filters').getByText('Search: sol')).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.locator('#chain-sol').getByText(/Catalog Boundary/i)).toBeVisible();
    await expect(page.locator('#chain-sol').getByText(/EdDSA/i)).toBeVisible();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
