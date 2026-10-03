import { test, expect } from '@playwright/test';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

test('network renders dated server evidence and a native reference path without JavaScript', async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: info.project.use.baseURL });
  const page = await context.newPage();
  const response = await page.goto('/network');
  expect(response?.headers()['content-security-policy']).toContain("'nonce-");
  expect(response?.headers()['cache-control']).toMatch(/no-store|private/);
  await expect(page.getByRole('heading', { name: 'Network evidence without JavaScript' })).toBeVisible();
  const fallback = page.locator('noscript section');
  await expect(fallback).toContainText(/checked at \d{4}-\d{2}-\d{2}T/);
  await expect(fallback).toContainText('cannot prove that a route will execute');
  await expect(fallback.getByRole('link', { name: 'Source map', exact: true })).toHaveAttribute('href', '/docs#current-protocol-state');
  await expect(fallback.getByRole('link', { name: /current controls/ })).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Source and freshness' })).not.toContainText('Loading live source');
  await fallback.getByRole('searchbox', { name: 'Search reference material' }).fill('quote expiry');
  await fallback.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=quote(?:\+|%20)expiry/);
  await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
  await context.close();
});

test('hydration replaces the dated seed and manual refresh reads new operation evidence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockSwapperFirstNetwork(page, { mimir: { HALTTRADING: 0 } });
  await page.goto('/network');
  await expect(page.getByText(/No global swap halt/i).first()).toBeVisible({ timeout: 15000 });
  await page.route(/\/thorchain\/mimir(?:\?.*)?$/, route => fulfillJson(route, { HALTTRADING: 1 }));
  const source = page.locator('#network-diagnostics');
  await expect(source.getByRole('button', { name: /Refresh .* data/ })).toBeEnabled({ timeout: 15000 });
  await source.getByRole('button', { name: /Refresh .* data/ }).click();
  await expect(page.getByText('Swaps paused', { exact: true }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/No global swap halt/i)).toHaveCount(0);
  expect(errors).toEqual([]);
});
