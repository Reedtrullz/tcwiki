import { expect, test } from '@playwright/test';
import { readLayoutSafety } from './helpers/layout-safety';
import { mockSwapperFirstNetwork } from './helpers/thornode-mocks';

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
    await expect(panel.getByText('Deposit halt check')).toBeVisible();
    await expect(panel.getByText('No tracked deposit halt')).toBeVisible();
    await expect(panel.getByText('Withdraw halt check')).toBeVisible();
    await expect(panel.getByText('No tracked withdraw halt')).toBeVisible();
    await expect(panel.getByText(/wallet\/interface support or future availability proof/i)).toBeVisible();
    await expect(panel.getByText(/user position, wallet\/interface, and checked block still matter/i)).toBeVisible();
    await expect(panel.getByText('Which value matters?')).toBeVisible();
    await expect(panel.getByText('Provider value/PnL')).toBeVisible();
    await expect(panel.getByText('What not to infer?')).toBeVisible();
    await expect(panel.getByText('No yield proof')).toBeVisible();
    await expect(panel.getByText('Accounting source', { exact: true })).toBeVisible();
    await expect(panel.getByText('Current-only').first()).toBeVisible();
    await expect(panel.getByText('RUNEPool', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText('Control enabled').first()).toBeVisible();
    await expect(panel.getByText(/this is not deposit, withdrawal, wallet, or future-availability proof/i)).toBeVisible();
    await expect(panel.getByText('Deposits', { exact: true }).first()).toBeVisible();
    await expect(panel.getByText('No active halt').first()).toBeVisible();
    await expect(panel.getByText('POL pool scope', { exact: true })).toBeVisible();
    await expect(panel.getByText('2 active').first()).toBeVisible();
    await expect(panel.getByText('POL current value')).toBeVisible();
    await expect(panel.getByText(/3,740,894 RUNE/).first()).toBeVisible();
    await expect(panel.getByText(/protocol-owned-liquidity bucket current value/i)).toBeVisible();
    await expect(panel.getByText('POL PnL')).toBeVisible();
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
    await panel.getByText('Show source warnings and non-claims').click();
    await expect(panel.getByText(/does not prove future yield/i)).toBeVisible();

    const layout = await readLayoutSafety(page);
    expect(layout.hasFrameworkOverlay).toBe(false);
    expect(
      layout.pageWidth,
      `economics RUNEPool panel overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
    ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  });
});
