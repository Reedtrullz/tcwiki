import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('article citations preserve evidence dates and give visible clipboard fallback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Clipboard denied'); } }, configurable: true }));
  await page.goto('/deep-dives/savers#what-this-page-can-prove');
  await page.getByRole('button', { name: 'Copy citation', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Clipboard unavailable' })).toBeVisible();
  const text = await page.getByRole('textbox', { name: 'Citation text' }).inputValue();
  expect(text).toContain('https://wiki.thorchain.no/deep-dives/savers#what-this-page-can-prove');
  expect(text).toContain('Wiki review:');
  expect(text).toContain('retrieved');
  expect(text).toContain('current protocol state');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save citation' }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('deep-dive-savers-citation.txt');
  expect(await readFile((await download.path())!, 'utf8')).toBe(text);
  await page.getByRole('button', { name: 'Copy Markdown citation' }).click();
  await expect(page.getByRole('textbox', { name: 'Citation text' })).toHaveValue(/\]\(https:\/\/wiki.thorchain.no/);
});

test('printing opens source details, retains boundaries and restores screen disclosure state', async ({ page }) => {
  await page.goto('/deep-dives/midgard-thornode-data');
  const sources = page.locator('.printable-article > details').first();
  await expect(sources).not.toHaveAttribute('open');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print' });
  await expect(sources).toHaveAttribute('open', '');
  await expect(page.locator('.article-print-reference')).toBeVisible();
  await expect(page.locator('.article-print-reference')).toContainText('https://wiki.thorchain.no/deep-dives/midgard-thornode-data');
  await expect(page.locator('.article-print-reference')).toContainText('do not establish current protocol state');
  await expect(page.getByRole('button', { name: 'Print article' })).toBeHidden();
  await expect(page.getByRole('banner')).toBeHidden();
  await expect(page.getByRole('contentinfo')).toBeHidden();
  if (process.env.WIKI_PRINT_PROOF_PNG) await page.screenshot({ path: process.env.WIKI_PRINT_PROOF_PNG, fullPage: true });
  const widths = await page.locator('article table').first().evaluate(table => ({ width: table.getBoundingClientRect().width, available: table.parentElement?.getBoundingClientRect().width ?? 0 }));
  expect(widths.width).toBeLessThanOrEqual(widths.available + 1);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  await expect(sources).not.toHaveAttribute('open');
});
