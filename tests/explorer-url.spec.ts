import { test, expect } from '@playwright/test';
import { mockSwapperFirstNetwork } from './helpers/thornode-mocks';

const cases = [
  { route: '/protocol', name: 'Find supported chains', key: 'q', fragment: 'supported-chain-finder' },
  { route: '/docs', name: 'Filter source map', key: 'source_q', fragment: 'source-map-chooser' },
  { route: '/glossary', name: 'Filter glossary terms', key: 'q', fragment: 'glossary-explorer' },
  { route: '/ecosystem', name: 'Find', key: 'q', fragment: 'ecosystem-filter-heading' },
  { route: '/deep-dives', name: 'Filter deep dives', key: 'q', fragment: 'deep-dive-library' },
  { route: '/governance', name: 'Filter security incidents', key: 'q', fragment: 'security-incidents' },
  { route: '/stats', name: 'Filter Midgard available-pool rows', key: 'pool_q', fragment: 'available-pools' },
];
for (const entry of cases) {
  test(`${entry.route} explorer preserves edits, fragments and browser restoration`, async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.goto(`${entry.route}?keep=proof#${entry.fragment}`);
    const input = page.getByRole('searchbox', { name: entry.name, exact: true });
    await expect(input).toBeVisible({ timeout: 15_000 });
    await expect(input).toBeEnabled({ timeout: 15_000 });
    const initialHistory = await page.evaluate(() => history.length);
    await input.pressSequentially('quote expiry', { delay: 0 });
    await expect(input).toHaveValue('quote expiry');
    await expect.poll(() => new URL(page.url()).searchParams.get(entry.key)).toBe('quote expiry');
    expect(new URL(page.url()).searchParams.get('keep')).toBe('proof');
    expect(new URL(page.url()).hash).toBe(`#${entry.fragment}`);
    expect(await page.evaluate(() => history.length)).toBe(initialHistory);
    const copied = page.url();
    await page.reload();
    await expect(input).toHaveValue('quote expiry', { timeout: 15_000 });
    await page.goto('/rune');
    await page.goBack();
    await expect(page).toHaveURL(copied);
    await expect(input).toHaveValue('quote expiry', { timeout: 15_000 });
    await page.goForward();
    await expect(page).toHaveURL(/\/rune$/);
    await page.goBack();
    await expect(input).toHaveValue('quote expiry', { timeout: 15_000 });
  });
}
