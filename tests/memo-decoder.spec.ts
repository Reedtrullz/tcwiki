import { expect, test } from '@playwright/test';
import axe from 'axe-core';

test('memo input is keyboard-usable and stays local to the page', async ({ page }) => {
  await page.goto('/deep-dives/build-query-data#local-memo-decoder');
  const decoder = page.locator('section[aria-labelledby="local-memo-decoder"]');
  const input = decoder.getByRole('textbox', { name: 'Existing memo' });
  await expect(input).toBeVisible();
  await expect(input).toBeEnabled();

  const sent: Array<{ url: string; body: string | null }> = [];
  page.on('request', request => sent.push({ url: request.url(), body: request.postData() }));
  await input.focus();
  await page.keyboard.type('MIGRATE:17894403');

  await expect(decoder.getByRole('status')).toContainText('Read as migrate memo intent');
  await expect(decoder.locator('pre code')).toHaveText('MIGRATE:17894403');
  await expect(decoder.getByText('17894403', { exact: true })).toBeVisible();
  expect(sent.filter(request => request.url.includes('MIGRATE') || request.body?.includes('MIGRATE'))).toEqual([]);
  expect(sent.filter(request => new URL(request.url).origin !== new URL(page.url()).origin)).toEqual([]);
});

test('reviewed examples load without leaving the builder guide', async ({ page }) => {
  await page.goto('/deep-dives/build-query-data#local-memo-decoder');
  const decoder = page.locator('section[aria-labelledby="local-memo-decoder"]');
  const examples = decoder.getByRole('button');

  await expect(examples).toHaveCount(4);
  await expect(examples.nth(0)).toBeEnabled();
  await examples.nth(0).focus();
  await page.keyboard.press('Enter');
  await expect(decoder.locator('pre code')).toHaveText('=:tr:TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya:0/1/0');
});

test('decoder remains readable at 320px and passes a scoped WCAG axe scan', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto('/deep-dives/build-query-data#local-memo-decoder');
  const decoder = page.locator('section[aria-labelledby="local-memo-decoder"]');
  await expect(decoder).toBeVisible();

  const dimensions = await decoder.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);

  await page.addScriptTag({ content: axe.source });
  const result = await page.evaluate(async () => {
    const root = document.querySelector('section[aria-labelledby="local-memo-decoder"]');
    const axeApi = (window as unknown as {
      axe: {
        run: (
          context: Element | Document,
          options: { runOnly: { type: 'tag'; values: string[] } }
        ) => Promise<{ violations: unknown[] }>;
      };
    }).axe;
    return axeApi.run(root ?? document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  });
  expect(result.violations, JSON.stringify(result.violations, null, 2)).toEqual([]);
});

test('oversized and unsupported memos remain unchanged and can recover', async ({ page }) => {
  await page.goto('/deep-dives/build-query-data#local-memo-decoder');
  const decoder = page.locator('section[aria-labelledby="local-memo-decoder"]');
  const input = decoder.getByRole('textbox', { name: 'Existing memo' });
  await expect(input).toBeEnabled();
  const oversized = 'é'.repeat(126);
  await input.fill(oversized);
  await expect(decoder.getByRole('status')).toContainText('Memo exceeds the local parsing bound');
  await expect(decoder.locator('pre code')).toHaveText(oversized);
  await input.fill('=:BTC.BTC:destination:0|suffix');
  await expect(decoder.getByRole('status')).toContainText('Syntax outside the supported subset');
  await input.fill('MIGRATE:17894403');
  await expect(decoder.getByRole('status')).toContainText('Read as migrate memo intent');
});
