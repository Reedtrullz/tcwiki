import { test, expect } from '@playwright/test';

test('curated updates distinguish wiki review dates from historical protocol events', async ({ page, request }) => {
  await page.goto('/updates');
  await expect(page.getByRole('heading', { name: 'Wiki updates', exact: true })).toBeVisible();
  await expect(page.getByText(/they do not turn historical protocol events into current news/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /impermanent loss protection is historical/i })).toBeVisible();
  await expect(page.getByText('Source observation:', { exact: false }).first()).toBeVisible();
  expect(await page.getByRole('link', { name: 'Read the affected wiki content' }).evaluateAll(links => links.map(link => link.getAttribute('href')).sort())).toEqual(['/deep-dives/clp', '/deep-dives/governance-comprehensive', '/governance#incident-memoless-spam-2026-08', '/protocol#supported-chain-finder']);

  const feedResponse = await request.get('/updates/feed.xml');
  expect(feedResponse.ok()).toBeTruthy();
  expect(feedResponse.headers()['content-type']).toContain('application/rss+xml');
  const xml = await feedResponse.text();
  expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  expect(xml).toContain('<rss version="2.0">');
  const parsed = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, 'application/xml');
    return { hasError: document.querySelector('parsererror') !== null, itemCount: document.querySelectorAll('rss > channel > item').length };
  }, xml);
  expect(parsed).toEqual({ hasError: false, itemCount: 4 });
  expect(xml).toContain('urn:tcwiki:update:ilp-history-boundary-2026-10-02');
  expect(xml).toContain('urn:tcwiki:update:memoless-claim-evidence-2026-10-03');
  expect(xml).toContain('Source observation: 2026-10-03. Wiki review: 2026-11-08.');
  expect(xml).toContain('urn:tcwiki:update:governance-october-november-2026-11-08');
  expect(xml).toContain('urn:tcwiki:update:zec-chain-coverage-2026-11-08');
  expect(xml).toContain('historical halt sequence');
  expect(xml).not.toContain('new exploit today');
});
