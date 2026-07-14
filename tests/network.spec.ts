import { test, expect, type Locator } from '@playwright/test';
import { mockSwapperFirstNetwork } from './helpers/thornode-mocks';

async function checkRoute(quotePanel: Locator) {
  await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeEnabled({ timeout: 15_000 });
  await quotePanel.getByRole('button', { name: /Check route/i }).click();
}

test.describe('THORChain Wiki Network Smoke Tests', () => {
  test('network page uses explicit live-state labels', async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /Network & Security/i })).toBeVisible();
    await expect(page.getByText('Ordinary swaps', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Chain availability/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Current Operation Snapshot/i })).toBeVisible();
    await page.locator('details[aria-labelledby="current-operation-snapshot-heading"] > summary').click();
    await expect(page.getByRole('heading', { name: /Node Operator Guide/i })).toBeVisible();
    const managingNodesLink = page.getByRole('link', { name: /Managing THORNodes/i });
    await expect(managingNodesLink).toBeVisible();
    await expect(managingNodesLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.getByRole('heading', { name: /Swap execution/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /TCY and RUNEPool/i })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Use This Page For/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Related Checks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Mimir halt guide/i })).toHaveAttribute('href', '/deep-dives/mimir-halt-controls#what-mimirs-can-prove');
    const nodeTypesHeading = page.getByRole('heading', { name: 'Node Types', exact: true });
    await expect(nodeTypesHeading).toBeVisible();
    const nodeTypes = nodeTypesHeading.locator('xpath=following-sibling::div[1]');
    await expect(nodeTypes.locator('[data-node-status="Standby"]')).toContainText(/only Standby nodes outside vault migration may unbond/i);
    await expect(nodeTypes.locator('[data-node-status="Ready"]')).toContainText(/eligible for churn selection.*cannot unbond while Ready/i);
    await expect(nodeTypes.locator('[data-node-status="Active"]')).toContainText(/cannot unbond until churned to Standby/i);
    await expect(nodeTypes.locator('[data-node-status="Disabled"]')).toContainText(/cannot rejoin with the same node account/i);
  });

  test('network status module has compact and diagnostic tiers @docker-smoke', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }
    await mockSwapperFirstNetwork(page, {
      mimir: {
        BURNSYNTHS: undefined,
        PauseBond: 1,
        PauseUnbond: 0,
        HaltRebond: 0,
        HaltOperatorRotate: 1,
      },
    });

    await page.goto('/');
    await expect(page.getByText(/Look here first/i).first()).toBeVisible();
    await expect(page.getByText(/BSC and SOL are swap-limited/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open diagnostics', exact: true })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByText(/Operational evidence/i)).toHaveCount(0);

    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open diagnostics', exact: true })).toHaveAttribute('href', '/network#network-diagnostics');

    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /Network & Security/i })).toBeVisible();
    await expect(page.getByText(/Look here first/i).first()).toBeVisible();
    await expect(page.getByText(/BSC and SOL are swap-limited/i).first()).toBeVisible();
    await expect(page.getByText(/No global swap halt/i).first()).toBeVisible();
    await expect(page.getByText(/Swaps appear open/i)).toHaveCount(0);
    await expect(page.getByText(/No source warnings/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Chain availability/i })).toBeVisible();
    await expect(page.getByText(/BSC: Trading halted/i).first()).toBeVisible();
    await expect(page.getByText(/SOL: Chain halted/i).first()).toBeVisible();
    const chainAvailability = page.locator('section[aria-labelledby="chain-availability-heading"]');
    await expect(chainAvailability.locator('span:visible', { hasText: 'No swap blocker' }).first()).toBeVisible();
    await expect(chainAvailability.locator('span:visible', { hasText: 'Network-wide' }).first()).toBeVisible();
    await expect(chainAvailability.locator('span:visible', { hasText: 'No deposit pause' }).first()).toBeVisible();
    await expect(chainAvailability.locator('span:visible', { hasText: 'No chain warnings' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Node operator actions/i })).toBeVisible();
    await expect(page.getByText(/PauseBond is active in current Mimir/i)).toBeVisible();
    await expect(page.getByText(/HaltOperatorRotate is active in current Mimir/i)).toBeVisible();
    await expect(page.getByText(/does not prove a specific node can leave safely/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Check A Route/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Refund \/ failed swap triage/i })).toBeVisible();
    await expect(page.getByText(/Refund diagnosis: insufficient evidence/i)).toBeVisible();
    await expect(page.getByText(/Transaction and refund proof/i)).toBeVisible();
    await expect(page.getByText(/actual transaction evidence/i)).toBeVisible();
    await expect(page.getByText(/Network-wide LP pause/i).first()).toBeVisible();
    await expect(page.getByText(/Priority Mimir controls/i)).toBeVisible();
    await expect(page.getByText(/Operational evidence|Source warnings and Mimir review queue/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Current Operation Snapshot/i })).toBeVisible();
    const currentOperationDetails = page.locator('details[aria-labelledby="current-operation-snapshot-heading"]');
    await expect(currentOperationDetails).toBeVisible();
    await expect(currentOperationDetails.getByText(/Additional context for node counts/i)).toBeVisible();
    await expect(currentOperationDetails.getByText('Control enabled', { exact: true })).toBeHidden();
    await currentOperationDetails.locator(':scope > summary').click();
    await expect(page.getByText(/Grouped by the decision a reader is trying to make/i)).toBeVisible();
    await expect(currentOperationDetails.getByText('Open', { exact: true })).toHaveCount(0);
    await expect(currentOperationDetails.getByText('Control enabled').first()).toBeVisible();
    await expect(currentOperationDetails.getByText('Enabled', { exact: true })).toHaveCount(0);
    await expect(currentOperationDetails.getByText(/Enablement flag only; deposit, withdrawal, maturity, and wallet paths are separate checks/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Swap execution/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Liquidity actions/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /TCY and RUNEPool/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /App and asset rails/i })).toBeVisible();
    await expect(page.getByText(/one paused rail does not look like a global swap halt/i)).toBeVisible();
    await expect(page.getByText(/Current-Only Numbers/i)).toHaveCount(0);
    await expect(page.getByText(/Direct:/i)).toHaveCount(0);
    await expect(page.getByText(/Inherited:/i)).toHaveCount(0);
    await expect(page.getByText(/evidence items/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Live-source failover/i })).toHaveAttribute('href', '/docs#runtime-live-data-failover');
    await expect(page.getByRole('link', { name: /Stats dashboard/i })).toHaveAttribute('href', '/stats#stats-look-here-first');

    const quotePanel = page.locator('section[aria-labelledby="route-check-heading"]');
    await expect(quotePanel.getByLabel(/From asset/i)).toBeEnabled({ timeout: 15_000 });
    await expect(quotePanel.getByLabel(/To asset/i)).toBeEnabled({ timeout: 15_000 });
    await quotePanel.getByLabel(/From asset/i).selectOption('BTC.BTC');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await quotePanel.getByLabel(/Amount/i).fill('0.01');
    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Current quote returned/i)).toBeVisible({ timeout: 15_000 });
    await expect(quotePanel.getByText(/Current route is quoteable; past refund still needs proof/i)).toBeVisible();
    await expect(quotePanel.getByText(/Expected output/i)).toBeVisible();
    await expect(quotePanel.getByText(/Fee bps|Total fee bps/i)).toBeVisible();
    await expect(quotePanel.getByText(/same fresh quote flow/i)).toBeVisible();

    await page.waitForTimeout(1100);
    await quotePanel.getByLabel(/From asset/i).selectOption('BSC.BNB');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Quote limited/i)).toBeVisible({ timeout: 15_000 });
    await expect(quotePanel.getByText(/Current quote failed or was limited/i)).toBeVisible();
    await expect(quotePanel.getByText(/trading is halted on BSC/i).first()).toBeVisible();

    await page.waitForTimeout(1100);
    await quotePanel.getByLabel(/From asset/i).selectOption('BTC.BTC');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await quotePanel.getByLabel(/Amount/i).fill('0.02');
    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Quote probe unavailable/i)).toBeVisible({ timeout: 15_000 });
    await expect(quotePanel.getByText(/Quote probe unusable; insufficient evidence/i)).toBeVisible();
    await expect(quotePanel.getByText(/missing expected_amount_out/i).first()).toBeVisible();
    await expect(quotePanel.getByText(/do not treat the fallback route context as a successful quote/i)).toBeVisible();

    const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? bodyWidth;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('route checker hydrates shareable URL state without auto-submitting quotes', async ({ page }) => {
    let quoteRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/thorchain/quote/swap')) {
        quoteRequests += 1;
      }
    });
    await mockSwapperFirstNetwork(page);

    await page.goto('/network?from_asset=SOL.SOL&to_asset=BTC.BTC&amount=0.015#check-a-route');

    const quotePanel = page.locator('section[aria-labelledby="route-check-heading"]');
    await expect(quotePanel.getByLabel(/From asset/i)).toHaveValue('SOL.SOL', { timeout: 15_000 });
    await expect(quotePanel.getByLabel(/To asset/i)).toHaveValue('BTC.BTC');
    await expect(quotePanel.getByLabel(/Amount/i)).toHaveValue('0.015');
    const viewportHeight = page.viewportSize()?.height ?? 0;
    await expect.poll(async () => {
      const currentBox = await quotePanel.boundingBox();
      return currentBox?.y ?? Number.POSITIVE_INFINITY;
    }, {
      message: 'route checker should land in the first viewport after hydration',
      timeout: 4_000,
    }).toBeLessThan(viewportHeight);
    const quotePanelBox = await quotePanel.boundingBox();
    expect(quotePanelBox, 'shareable route checker link should land on the route checker').not.toBeNull();
    expect(quotePanelBox?.y ?? -1, 'route checker should clear the fixed header').toBeGreaterThanOrEqual(52);
    await expect(quotePanel.getByText(/Current quote returned/i)).toHaveCount(0);
    expect(quoteRequests).toBe(0);

    await quotePanel.getByLabel(/From asset/i).selectOption('BTC.BTC');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await quotePanel.getByLabel(/Amount/i).fill('0.01');
    await expect(page).toHaveURL(/from_asset=BTC\.BTC/);
    await expect(page).toHaveURL(/to_asset=ETH\.ETH/);
    await expect(page).toHaveURL(/amount=0\.01/);
    await expect(page).toHaveURL(/#check-a-route$/);
    expect(quoteRequests).toBe(0);

    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Current quote returned/i)).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(1);
  });

  test('route checker preserves native RUNE shareable routes', async ({ page }) => {
    let quoteRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/thorchain/quote/swap')) {
        quoteRequests += 1;
      }
    });
    await mockSwapperFirstNetwork(page);

    await page.goto('/network?from_asset=THOR.RUNE&to_asset=BTC.BTC&amount=0.015#check-a-route');

    const quotePanel = page.locator('section[aria-labelledby="route-check-heading"]');
    await expect(quotePanel.getByLabel(/From asset/i)).toHaveValue('THOR.RUNE', { timeout: 15_000 });
    await expect(quotePanel.getByLabel(/To asset/i)).toHaveValue('BTC.BTC');
    await expect(quotePanel.getByLabel(/Amount/i)).toHaveValue('0.015');
    await expect(quotePanel.getByText(/Pool not listed/i)).toHaveCount(0);
    await expect(page).toHaveURL(/from_asset=THOR\.RUNE/);
    expect(quoteRequests).toBe(0);

    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Current quote returned/i)).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(1);
  });

  test('route checker clears stale quote proof after input changes', async ({ page }) => {
    let quoteRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('/thorchain/quote/swap')) {
        quoteRequests += 1;
      }
    });
    await mockSwapperFirstNetwork(page);

    await page.goto('/network#check-a-route');

    const quotePanel = page.locator('section[aria-labelledby="route-check-heading"]');
    await expect(quotePanel.getByLabel(/From asset/i)).toBeEnabled({ timeout: 15_000 });
    await quotePanel.getByLabel(/From asset/i).selectOption('BTC.BTC');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await quotePanel.getByLabel(/Amount/i).fill('0.01');

    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Current quote returned/i)).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/Amount/i).fill('0.010000001');
    await expect(quotePanel.getByText(/Previous quote result was cleared/i)).toBeVisible();
    await expect(quotePanel.getByText(/Enter a positive amount with up to 8 decimals/i)).toBeVisible();
    await expect(quotePanel.getByText(/Current quote returned/i)).toHaveCount(0);
    await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeDisabled();
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/Amount/i).fill('0.01');
    await quotePanel.getByLabel(/To asset/i).selectOption('BTC.BTC');
    await expect(quotePanel.getByText(/Choose two different assets/i)).toBeVisible();
    await expect(quotePanel.getByText(/Current quote returned/i)).toHaveCount(0);
    await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeDisabled();
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await expect(quotePanel.getByText(/Choose two different assets/i)).toHaveCount(0);
    await expect(quotePanel.getByText(/Previous quote result was cleared/i)).toBeVisible();
    await page.waitForTimeout(1100);

    const checkButton = quotePanel.getByRole('button', { name: /Check route/i });
    await expect(checkButton).toBeEnabled();
    await checkButton.dblclick();
    await expect(quotePanel.getByText(/Current quote returned/i)).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(2);
  });
});
