import { test, expect } from '@playwright/test';
import { mockSwapperFirstNetwork } from './helpers/thornode-mocks';

test.describe('THORChain Wiki TCY Smoke Tests', () => {
  test('tcy page keeps recovery caveats decision-shaped', async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.goto('/tcy');
    await expect(page.getByRole('heading', { name: /TCY, Savers, and THORFi History/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Current TCY controls/i })).toHaveAttribute('href', '/tcy#tcy-current-controls');
    const panel = page.locator('#tcy-current-controls');
    await expect(panel.getByRole('heading', { name: /Current TCY Controls/i })).toBeVisible();
    await expect(panel.getByText('Read these controls first')).toBeVisible();
    await expect(panel.getByText('Claim halt check')).toBeVisible();
    await expect(panel.getByText('Staking halt check')).toBeVisible();
    await expect(panel.getByText('Trading halt check')).toBeVisible();
    await expect(panel.getByText('Source quality')).toBeVisible();
    await expect(panel.getByText('Non-claim')).toBeVisible();
    await expect(panel.getByText(/Use it as a halt-control check/i)).toBeVisible();
    await expect(panel.getByText('Can I claim?')).toHaveCount(0);
    await expect(panel.getByText('Can I stake?')).toHaveCount(0);
    await expect(panel.getByText('Can I trade?')).toHaveCount(0);
    await expect(panel.getByText('Needs review').first()).toBeVisible();
    await expect(panel.getByText('No recovery proof')).toBeVisible();
    await expect(panel.getByText('Tracked TCY halt controls', { exact: true })).toBeVisible();
    await expect(panel.getByText('Needs review').first()).toBeVisible();
    await expect(panel.getByText('TCY claiming', { exact: true })).toBeVisible();
    await expect(panel.getByText('TCYCLAIMINGHALT').first()).toBeVisible();
    await expect(panel.getByText('TCY trading', { exact: true })).toBeVisible();
    await expect(panel.getByText('HALTTCYTRADING').first()).toBeVisible();
    await expect(panel.getByRole('link', { name: /Open full Network diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('heading', { name: /Reader Decision Matrix/i })).toBeVisible();
    await expect(page.getByText('Recovery not guaranteed')).toBeVisible();
    await expect(page.getByText(/Did TCY fully recover creditors/i)).toBeVisible();
    await expect(page.getByText(/Developer docs state full debt recovery is market dependent and not guaranteed/i)).toBeVisible();
    await expect(page.getByText(/Do not describe TCY as governance power/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /TCY timeline/i })).toHaveAttribute('href', '/deep-dives/tcy-recovery-timeline#what-to-check-now');
    await expect(page.getByRole('link', { name: /TCY Recovery Timeline/i })).toHaveAttribute('href', '/deep-dives/tcy-recovery-timeline');
  });

  test('tcy page shows active claim and trading halts from current Mimir evidence', async ({ page }) => {
    await mockSwapperFirstNetwork(page, {
      mimir: {
        TCYCLAIMINGSWAPHALT: 1,
        HALTTCYTRADING: 100,
      },
    });

    await page.goto('/tcy#tcy-current-controls');
    const panel = page.locator('#tcy-current-controls');

    await expect(panel.getByText('Read these controls first')).toBeVisible();
    await expect(panel.getByText('Claim path halted')).toBeVisible();
    await expect(panel.getByText('Trading halted').first()).toBeVisible();
    await expect(panel.getByText('2 halted')).toBeVisible();
    await expect(panel.getByText('TCYCLAIMINGSWAPHALT').first()).toBeVisible();
    await expect(panel.getByText('TCYCLAIMINGSWAPHALT is active in the checked network snapshot')).toBeVisible();
    await expect(panel.getByText('HALTTCYTRADING').first()).toBeVisible();
    await expect(panel.getByText('HALTTCYTRADING is active in the checked network snapshot')).toBeVisible();
    await expect(panel.getByText('No recovery proof')).toBeVisible();
    await expect(panel.getByText(/does not prove an official claim interface is live/i)).toBeVisible();
  });
});
