import { test, expect } from '@playwright/test';
import { readLayoutSafety } from './helpers/layout-safety';

test.describe('THORChain Wiki RUNE Page', () => {
  test('prioritizes the RUNE number router before follow-up links', async ({ page }) => {
    await page.goto('/rune', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: /RUNE Token/i })).toBeVisible();
    const overview = page.locator('#rune-overview');
    const router = page.locator('#rune-number-router');
    const continueLinks = page.locator('#rune-continue-from-here');
    await expect(overview.getByRole('heading', { name: /What is RUNE/i })).toBeVisible();
    await expect(overview.getByRole('heading', { name: /Settlement Asset/i })).toBeVisible();
    await expect(overview.getByRole('heading', { name: /Security Bond/i })).toBeVisible();
    await expect(router.getByRole('heading', { name: /Which RUNE Number Do You Need/i })).toBeVisible();
    await expect(continueLinks.getByRole('heading', { name: /Continue From Here/i })).toBeVisible();

    await expect(router.getByRole('heading', { name: /Live network metrics/i })).toBeVisible();
    await expect(router.getByRole('heading', { name: /Security constants/i })).toBeVisible();
    await expect(router.getByRole('heading', { name: /Supply framing/i })).toBeVisible();
    await expect(router.getByRole('heading', { name: /Price or value claim/i })).toBeVisible();
    await expect(router.getByRole('link', { name: /Start with Stats decision panel/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
    await expect(router.getByRole('link', { name: /Start with Network diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(router.getByRole('link', { name: /Start with Token Economics/i })).toHaveAttribute('href', '/rune#tokenomics-rune-supply-framing');
    await expect(router.getByRole('link', { name: /Start with Source map/i })).toHaveAttribute('href', '/docs#rune-tokenomics-and-value');

    await expect(continueLinks.getByRole('link', { name: /RUNE settlement deep dive/i })).toHaveAttribute('href', '/deep-dives/rune-settlement');
    await expect(continueLinks.getByRole('link', { name: /Stats decision panel/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
    await expect(continueLinks.getByRole('link', { name: /Official source map/i })).toHaveAttribute('href', '/docs#official-protocol-documentation');

    const routerComesFirst = await router.evaluate((element) => {
      const related = document.querySelector('#rune-continue-from-here');
      return related ? Boolean(element.compareDocumentPosition(related) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(routerComesFirst).toBe(true);
    const overviewComesBeforeActionRouter = await overview.evaluate((element) => {
      const actionRouter = document.querySelector('#rune-action-router');
      return actionRouter ? Boolean(element.compareDocumentPosition(actionRouter) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(overviewComesBeforeActionRouter).toBe(true);
  });

  test('routes common RUNE holder actions without implying staking or exchange availability', async ({ page }) => {
    await page.goto('/rune#rune-action-router', { waitUntil: 'domcontentloaded' });

    const actionRouter = page.locator('#rune-action-router');
    await expect(actionRouter.getByRole('heading', { name: /What Do You Want To Do With RUNE/i })).toBeVisible();
    await expect(actionRouter.getByRole('heading', { name: /Swap or acquire RUNE/i })).toBeVisible();
    await expect(actionRouter.getByRole('heading', { name: /Stake or earn with RUNE/i })).toBeVisible();
    await expect(actionRouter.getByRole('heading', { name: /Bond RUNE for a node/i })).toBeVisible();
    await expect(actionRouter.getByRole('link', { name: /Check route availability/i })).toHaveAttribute('href', '/network#check-a-route');
    await expect(actionRouter.getByRole('link', { name: /Review interface checklist/i })).toHaveAttribute('href', '/ecosystem#interface-use-checklist');
    await expect(actionRouter.getByRole('link', { name: /Check RUNEPool evidence/i })).toHaveAttribute('href', '/economics#runepool-pol-live');
    await expect(actionRouter.getByRole('link', { name: /Open node guide/i })).toHaveAttribute('href', '/network#node-operator-guide');
    await expect(actionRouter.getByText(/Do not treat this page as exchange, wallet, staking, yield, or node-operation instructions/i)).toBeVisible();
  });

  test('keeps RUNE source boundaries visible on mobile without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/rune#rune-claim-checks', { waitUntil: 'domcontentloaded' });

    const claimChecks = page.locator('#rune-claim-checks');
    await expect(claimChecks.getByRole('heading', { name: /RUNE Claim Checks/i })).toBeVisible();
    await expect(claimChecks.getByText(/Do not claim price, fair value, or investment upside/i)).toBeVisible();
    await expect(claimChecks.getByText(/Do not quote stale, degraded, or unavailable live snapshots/i)).toBeVisible();
    await expect(claimChecks.getByText(/Do not treat dated tokenomics records as live supply/i)).toBeVisible();
    await expect(claimChecks.getByText(/Do not claim fair value, price targets, investment suitability/i)).toBeVisible();

    const layout = await readLayoutSafety(page);
    expect(layout.hasFrameworkOverlay, '/rune must not render a framework error overlay').toBe(false);
    expect(
      layout.pageWidth,
      `/rune horizontal overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
    ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  });
});
