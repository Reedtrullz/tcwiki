import { expect, test } from '@playwright/test';
import { readLayoutSafety } from './helpers/layout-safety';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

test.describe('THORChain Wiki Economics Smoke Tests', () => {
  test('economics page shows source-labeled RUNEPool POL current snapshot @docker-smoke', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }

    await mockSwapperFirstNetwork(page);
    await page.goto('/economics#runepool-pol-live');
    const panel = page.locator('#runepool-pol-live');

    await expect(panel.getByRole('heading', { name: /RUNEPool\/POL Current Snapshot/i })).toBeVisible();
    await expect(panel.getByText(/current THORNode RUNEPool accounting/i)).toBeVisible();
    await expect(panel.getByText('Read this snapshot first')).toBeVisible();
    await expect(panel.getByText('Deposit / withdraw')).toBeVisible();
    await expect(panel.getByText('Deposit / withdraw')).toBeVisible();
    await expect(panel.getByText('Provider value')).toBeVisible();
    await expect(panel.getByText('Accounting source', { exact: true })).toBeVisible();
    await expect(panel.getByText('Current-only').first()).toBeVisible();
    await expect(panel.getByText('RUNEPool', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText('Control enabled').first()).toBeVisible();
    await expect(panel.getByText(/this is not deposit, withdrawal, wallet, or future-availability proof/i)).toBeVisible();
    await expect(panel.getByText('POL pool scope', { exact: true })).toBeVisible();
    await expect(panel.getByText('POL pool scope', { exact: true })).toBeVisible();
    await expect(panel.getByText('2 active').first()).toBeVisible();
    await expect(panel.getByText('POL current value')).toBeVisible();
    await expect(panel.getByText(/3,740,894 RUNE/).first()).toBeVisible();
    await expect(panel.getByText(/protocol-owned-liquidity bucket current value/i)).toBeVisible();
    await expect(panel.getByText('POL PnL').first()).toBeVisible();
    await expect(panel.getByText(/-1,854,203 RUNE/).first()).toBeVisible();
    await expect(panel.getByText(/not APY or future yield/i)).toBeVisible();
    await expect(panel.getByText('RUNEPoolDepositMaturityBlocks')).toBeVisible();
    await expect(panel.getByText('14,400')).toBeVisible();
    await expect(panel.getByText('RUNEPoolMaxReserveBackstop')).toBeVisible();
    await expect(panel.getByText('2,500,000,000,000')).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Bucket Relationship' })).toBeVisible();
    await expect(panel.getByText('Provider + reserve value')).toBeVisible();
    await expect(panel.getByText('Provider + reserve PnL')).toBeVisible();
    await expect(panel.getByText('Arithmetic matches')).toBeVisible();
    await expect(panel.getByText('Value split')).toBeVisible();
    await expect(panel.getByText('Split parsed')).toBeVisible();
    await expect(panel.getByText('Provider share')).toBeVisible();
    await expect(panel.getByText('48.05%')).toBeVisible();
    await expect(panel.getByText('Reserve share')).toBeVisible();
    await expect(panel.getByText('51.95%')).toBeVisible();
    await panel.getByText('+3 endpoint reads').click();
    await expect(panel.getByText('Liquify THORNode RUNEPool accounting')).toBeVisible();
    await panel.getByText(/Show source warnings/).click();
    await expect(panel.getByText(/User-specific provider balances and post-block wallet actions require separate evidence/i)).toBeVisible();

    const layout = await readLayoutSafety(page);
    expect(layout.hasFrameworkOverlay).toBe(false);
    expect(
      layout.pageWidth,
      `economics RUNEPool panel overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
    ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  });

  test('POL USD price keeps the date of the earlier interval when the latest price is missing', async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.route(/\/history\/earnings\?.*$/, (route) => fulfillJson(route, {
      intervals: [
        { startTime: '1751760000', endTime: '1751846400', earnings: '0', bondingEarnings: '0', liquidityEarnings: '0', runePriceUSD: '0.62' },
        { startTime: '1751846400', endTime: '1751932800', earnings: '0', bondingEarnings: '0', liquidityEarnings: '0', runePriceUSD: '' },
      ],
    }));

    await page.goto('/economics#runepool-pol-live');
    const panel = page.locator('#runepool-pol-live');
    await expect(panel.getByText(/Daily reference valuation: 2025-07-06T00:00:00\.000Z/)).toBeVisible();
    await expect(panel.getByText(/price interval age .* days/)).toBeVisible();
    await expect(panel.getByText('Liquify Midgard')).toBeVisible();
    await expect(panel.getByText(/3,740,894 RUNE/).first()).toBeVisible();
  });

  test('degraded earnings price source withholds POL USD and retains RUNE accounting', async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.route(/\/history\/earnings\?.*$/, (route) => route.fulfill({ status: 503 }));

    await page.goto('/economics#runepool-pol-live');
    const panel = page.locator('#runepool-pol-live');
    await expect(panel.getByText('Price source unavailable; USD valuation withheld.')).toBeVisible();
    await expect(panel.getByText(/3,740,894 RUNE/).first()).toBeVisible();
    await expect(panel.getByText('Degraded').first()).toBeVisible();
  });
});
