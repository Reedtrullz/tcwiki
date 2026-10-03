import { test, expect, type Locator } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

async function checkRoute(quotePanel: Locator) {
  await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeEnabled({ timeout: 15_000 });
  await quotePanel.getByRole('button', { name: /Check route/i }).click();
}

test.describe('THORChain Wiki Network Smoke Tests', () => {
  test('manual comparison makes two fixed requests and distinguishes verified field conflict', async ({ page }) => {
    await mockSwapperFirstNetwork(page, { mimir: { HALTTRADING: 0 } });
    let comparisons: string[] = [];
    await page.route(/\/thorchain\/mimir(?:\?.*)?$/, async route => {
      const url = new URL(route.request().url());
      const requested = url.searchParams.get('height');
      if (requested === '777') comparisons.push(url.href);
      await route.fulfill({ contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'grpc-metadata-x-cosmos-block-height', 'grpc-metadata-x-cosmos-block-height': requested ?? '101' }, body: JSON.stringify({ HALTTRADING: requested === '777' && url.hostname === 'thornode.thorchain.network' ? 1 : 0 }) });
    });
    await page.goto('/network');
    await expect(page.getByRole('button', { name: 'Open search', exact: true })).toBeEnabled();
    expect(comparisons).toEqual([]);
    await page.locator('summary').filter({ hasText: 'Compare two control providers manually' }).click();
    const panel = page.getByRole('region', { name: 'Two-provider control comparison' });
    await panel.getByLabel('Optional requested THORChain height').fill('777');
    const submit = panel.getByRole('button', { name: 'Compare control providers now', exact: true });
    await submit.focus(); await page.keyboard.press('Enter');
    const row = panel.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'HALTTRADING', exact: true }) });
    await expect(row).toContainText('conflict-at-verified-height');
    expect(comparisons).toHaveLength(2);
    expect(new Set(comparisons.map(url => new URL(url).hostname))).toEqual(new Set(['gateway.liquify.com', 'thornode.thorchain.network']));
    await expect(panel.getByText(/pinning verified/)).toHaveCount(2);
    await page.setViewportSize({ width: 320, height: 844 });
    const width = await panel.evaluate(node => ({ content: node.scrollWidth, available: node.clientWidth }));
    expect(width.content).toBeLessThanOrEqual(width.available + 2);
    await page.clock.install(); await page.clock.fastForward(31000);
    await expect(panel.getByText(/stale retained receipt/)).toHaveCount(2);
    await expect(row).toContainText('unavailable');
    expect(comparisons).toHaveLength(2);
    comparisons = [];
  });
  test('observed control exports preserve unsupported proof and offer a clipboard fallback without requests', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Clipboard unavailable')) } }); });
    await mockSwapperFirstNetwork(page, { version: '3.21.0', mimir: { HALTTRADING: 100, RAWPRECISION: '9007199254740993' } });
    let reads = 0;
    page.on('request', request => { if (/\/thorchain\/mimir(?:\?|$)/.test(request.url())) reads += 1; });
    await page.goto('/network');
    await expect(page.getByText('Review applicability', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Open search', exact: true })).toBeEnabled();
    const evidence = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Operational evidence' }) });
    await evidence.locator(':scope > summary').click();
    await expect(evidence).toContainText('"RAWPRECISION": "9007199254740993"');
    const before = reads;
    await page.locator('summary').filter({ hasText: 'Export observed network controls' }).click();
    const panel = page.getByRole('region', { name: 'Observed control evidence export' });
    const capture = panel.getByRole('button', { name: 'Capture JSON evidence' });
    await capture.focus();
    await page.keyboard.press('Enter');
    const output = panel.getByLabel('Observed evidence text');
    await expect(output).toBeVisible();
    const text = await output.inputValue();
    const snapshot = JSON.parse(text);
    expect(snapshot.format).toBe('tcwiki-network-controls');
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.rawMimir.values.HALTTRADING).toBe(100);
    expect(snapshot.rawMimir.values.RAWPRECISION).toBe('9007199254740993');
    expect(snapshot.warnings.join(' ')).toMatch(/3\.21\.0/);
    expect(snapshot.runtime).toEqual({ version: null, commit: null, image: null });
    expect(snapshot.sources.some((source: { heightPinning?: { verification: string } }) => source.heightPinning?.verification === 'unverified')).toBe(true);
    await panel.getByRole('button', { name: 'Copy observed evidence' }).click();
    await expect(panel.getByRole('status')).toHaveText('Clipboard unavailable. Select and copy the evidence below.');
    await expect(output).toHaveValue(text);
    const downloadPromise = page.waitForEvent('download');
    await panel.getByRole('button', { name: 'Download observed evidence' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('tcwiki-network-controls-v1.json');
    const path = await download.path();
    if (!path) throw new Error('Evidence download unavailable');
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(snapshot);
    await panel.getByRole('button', { name: 'Capture Markdown evidence' }).click();
    await expect(output).toHaveValue(/# THORChain Wiki observed network controls/);
    expect(reads).toBe(before);
    await page.setViewportSize({ width: 320, height: 844 });
    const width = await panel.evaluate(node => ({ content: node.scrollWidth, available: node.clientWidth }));
    expect(width.content).toBeLessThanOrEqual(width.available + 2);
  });
  test('unreviewed protocol versions retain raw controls and require applicability review', async ({ page }) => {
    await mockSwapperFirstNetwork(page, { version: '3.21.0', mimir: { HALTTRADING: 100 } });
    await page.goto('/network');
    await expect(page.getByText('Review applicability', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/raw Mimir observations do not prove swap availability/i).first()).toBeVisible();
    await expect(page.getByText('No swap blocker', { exact: true })).toHaveCount(0);
    const evidence = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Operational evidence' }) });
    await evidence.locator('summary').click();
    await expect(evidence).toContainText('"HALTTRADING": 100');
    await expect(evidence).toContainText('"PAUSELP": 1');
  });
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
    await expect(page.getByRole('region', { name: 'Source and freshness' })).toBeVisible();


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

  test('THORNode coverage labels independent samples and supports keyboard table search', async ({ page }) => {
    const nodeRows = [
      { node_address: 'thor1active', status: 'Active', version: '3.20.3', ip_address: '198.51.100.8' },
      { node_address: 'thor1standby', status: 'Standby', version: '3.20.2' },
      { node_address: 'thor1observer', status: 'Observer', version: 'release-x' },
      { node_address: 'thor1missing', status: null, version: '' },
      ...Array.from({ length: 21 }, (_, index) => ({
        node_address: `thor1extra${index}`,
        status: 'Active',
        version: '3.20.3',
      })),
    ];
    await mockSwapperFirstNetwork(page, { nodeRows });
    await page.route(/\/v2\/network$/, route => fulfillJson(route, { totalPooledRune: '100000000000', totalReserve: '200000000000', activeNodeCount: 100, standbyNodeCount: 20, bondingAPY: '0.1', liquidityAPY: '0.05', nextChurnHeight: 123, bondMetrics: {} }));
    await page.goto('/network');

    const coverage = page.getByRole('region', { name: 'THORChain node coverage' });
    await expect(coverage.getByText('Rows in loaded THORNode /nodes response:', { exact: false })).toBeVisible();
    await expect(coverage.getByRole('list', { name: 'Observed status counts' }).getByText('Observer', { exact: true })).toBeVisible();
    await expect(coverage.getByRole('list', { name: 'Observed version counts' }).getByText('release-x', { exact: true })).toBeVisible();
    await expect(coverage.getByText(/A difference alone does not indicate an outage\./)).toBeVisible();
    await expect(coverage.getByRole('link', { name: 'Liquify THORNode node set' })).toHaveAttribute(
      'href',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/nodes'
    );
    await expect(coverage.getByRole('link', { name: 'Liquify Midgard' })).toHaveAttribute(
      'href',
      'https://gateway.liquify.com/chain/thorchain_midgard/v2/network'
    );
    await expect(coverage.getByText(/3\.20\.3/).first()).toBeVisible();

    const disclosure = coverage.locator('details > summary');
    await disclosure.focus();
    await expect(disclosure).toBeFocused();
    await page.keyboard.press('Enter');
    const table = coverage.getByRole('table');
    await expect(table).toBeVisible();
    await expect(coverage.getByText('Showing 20 of 25 matching rows (25 loaded).')).toBeVisible();

    const search = coverage.getByRole('searchbox', { name: 'Search address, status, or version' });
    await search.focus();
    await search.pressSequentially('thor1observer');
    await expect(table.getByRole('row').filter({ hasText: 'thor1observer' })).toHaveCount(1);
    await expect(coverage.getByText('Showing 1 of 1 matching rows (25 loaded).')).toBeVisible();

    await search.press('ControlOrMeta+A');
    await search.press('Backspace');
    const rowLimit = coverage.getByLabel('Rows shown');
    await rowLimit.focus();
    await expect(rowLimit).toBeFocused();
    await rowLimit.press('5');
    await rowLimit.press('Tab');
    await expect(rowLimit).not.toBeFocused();
    await expect(rowLimit).toHaveValue('50');
    await expect(coverage.getByText('Showing 25 of 25 matching rows (25 loaded).')).toBeVisible();
    await expect(coverage).not.toContainText('198.51.100.8');
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
    await expect(page.getByText(/Node-level state and operator tooling are separate checks./i)).toBeVisible();
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
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(quotePanel.getByText(/Quote returned for this route/i)).toBeVisible();
    await expect(quotePanel.getByText(/Expected output/i)).toBeVisible();
    await expect(quotePanel.getByText(/Fee bps|Total fee bps/i)).toBeVisible();
    await expect(quotePanel.getByText(/same fresh quote flow/i)).toBeVisible();

    await page.waitForTimeout(1100);
    await quotePanel.getByLabel(/From asset/i).selectOption('BSC.BNB');
    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await checkRoute(quotePanel);
    await expect(quotePanel.getByText(/Quote limited/i)).toBeVisible({ timeout: 15_000 });
    await expect(quotePanel.getByText(/Quote check failed or was limited/i)).toBeVisible();
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
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toHaveCount(0);
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
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
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
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
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
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/Amount/i).fill('0.010000001');
    await expect(quotePanel.getByText(/Previous quote result was cleared/i)).toBeVisible();
    await expect(quotePanel.getByText(/Enter a positive amount with up to 8 decimals/i)).toBeVisible();
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toHaveCount(0);
    await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeDisabled();
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/Amount/i).fill('0.01');
    await quotePanel.getByLabel(/To asset/i).selectOption('BTC.BTC');
    await expect(quotePanel.getByText(/Choose two different assets/i)).toBeVisible();
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toHaveCount(0);
    await expect(quotePanel.getByRole('button', { name: /Check route/i })).toBeDisabled();
    expect(quoteRequests).toBe(1);

    await quotePanel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await expect(quotePanel.getByText(/Choose two different assets/i)).toHaveCount(0);
    await expect(quotePanel.getByText(/Previous quote result was cleared/i)).toBeVisible();
    await page.waitForTimeout(1100);

    const checkButton = quotePanel.getByRole('button', { name: /Check route/i });
    await expect(checkButton).toBeEnabled();
    await checkButton.dblclick();
    await expect(quotePanel.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
    expect(quoteRequests).toBe(2);
  });
  for (const resume of [false, true]) {
    test(`quote expires without an automatic probe (${resume ? 'tab resume' : 'deadline'})`, async ({ page }) => {
      const now = Date.now(); const expiry = Math.floor(now / 1000) + 30;
      await page.clock.install({ time: now });
      await mockSwapperFirstNetwork(page, { quoteExpiry: expiry });
      let probes = 0;
      page.on('request', request => { if (request.url().includes('/quote/swap')) probes += 1; });
      await page.goto('/network');
      const panel = page.locator('section[aria-labelledby="route-check-heading"]');
      await expect(panel.getByLabel(/From asset/i)).toBeEnabled({ timeout: 15_000 });
      await panel.getByLabel(/From asset/i).selectOption('BTC.BTC');
      await panel.getByLabel(/To asset/i).selectOption('ETH.ETH');
      await checkRoute(panel);
      await expect(panel.getByText('Quote returned', { exact: true })).toBeVisible();
      if (resume) {
        await page.clock.setSystemTime((expiry + 1) * 1000);
        await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      } else await page.clock.fastForward(31_000);
      await expect(panel.getByText('Quote expired', { exact: true })).toBeVisible();
      await expect(panel.getByText('Quote returned for this route', { exact: true })).toHaveCount(0);
      await expect(panel.getByText(/recorded quote has expired/)).toBeVisible();
      expect(probes).toBe(1);
    });
  }
  test('missing quote expiry stays review-only', async ({ page }) => {
    await mockSwapperFirstNetwork(page, { quoteExpiry: null });
    await page.goto('/network');
    const panel = page.locator('section[aria-labelledby="route-check-heading"]');
    await expect(panel.getByLabel(/From asset/i)).toBeEnabled({ timeout: 15_000 });
    await panel.getByLabel(/From asset/i).selectOption('BTC.BTC');
    await panel.getByLabel(/To asset/i).selectOption('ETH.ETH');
    await checkRoute(panel);
    await expect(panel.getByText('Quote expiry unknown', { exact: true })).toBeVisible();
    await expect(panel.getByText('Quote returned for this route', { exact: true })).toHaveCount(0);
  });

});

test('provider Retry-After enables a manual quote retry without an automatic request', async ({ page }) => {
  await page.clock.install({ time: new Date() });
  await mockSwapperFirstNetwork(page);
  let probes = 0;
  await page.route(/\/quote\/swap\?.*$/, async (route) => {
    probes += 1;
    await route.fulfill({ status: 429, contentType: 'application/json', headers: { 'Retry-After': '2', 'Access-Control-Expose-Headers': 'Retry-After' }, body: JSON.stringify({ code: 429, message: 'too many requests' }) });
  });
  await page.goto('/network');
  const panel = page.locator('#check-a-route');
  await panel.getByRole('button', { name: 'Check route', exact: true }).click();
  await expect(panel.getByRole('button', { name: 'Retry later', exact: true })).toBeDisabled();
  await expect(panel.getByText(/Manual retry available after/)).toBeVisible();
  expect(probes).toBe(2);
  await page.clock.runFor(2001);
  await expect(panel.getByRole('button', { name: 'Check route', exact: true })).toBeEnabled();
  expect(probes).toBe(2);
  await panel.getByRole('button', { name: 'Check route', exact: true }).click();
  await expect.poll(() => probes).toBe(4);
});

test('returned quote retains its body while later controls and diagnostics require explicit recheck', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  const mimir = { BURNSYNTHS: undefined, HALTETHTRADING: 0 };
  await mockSwapperFirstNetwork(page, { mimir });
  let quotes = 0;
  page.on('request', request => { if (request.url().includes('/quote/swap')) quotes += 1; });
  await page.goto('/network#check-a-route');
  const checker = page.locator('#check-a-route');
  const check = checker.getByRole('button', { name: 'Check route', exact: true });
  await expect(check).toBeEnabled();
  await check.click();
  await expect(checker.getByText('Quote returned', { exact: true })).toBeVisible();
  const refresh = page.getByRole('button', { name: /Refresh .*THORNode.* data/i }).first();
  mimir.HALTETHTRADING = 1;
  await page.clock.fastForward(1100);
  await refresh.click();
  await expect(checker.getByText('Quote returned; controls limit execution', { exact: true })).toBeVisible();
  await expect(checker).toContainText('ETH: Trading halted');
  await expect(checker.getByText('Expected output', { exact: true })).toBeVisible();
  await expect(checker).toContainText('Quote: Liquify THORNode');
  await expect(checker).toContainText('Operations: Liquify THORNode');
  expect(quotes).toBe(1);
  mimir.HALTETHTRADING = 0;
  await refresh.click();
  await expect(checker.getByText('Quote returned; recheck required', { exact: true })).toBeVisible();
  expect(quotes).toBe(1);
  await check.click();
  await expect(checker.getByText('Quote returned', { exact: true })).toBeVisible();
  expect(quotes).toBe(2);
  await page.route(/\/base\/tendermint\/v1beta1\/blocks\/latest(?:\?.*)?$/, route => route.fulfill({ status: 503 }));
  await refresh.click();
  await expect(checker.getByText('Quote returned; execution unconfirmed', { exact: true })).toBeVisible();
  await expect(checker.getByText('Expected output', { exact: true })).toBeVisible();
  expect(quotes).toBe(2);
});


test('quote disclosure describes the exact manual request before its parameters leave the browser', async ({ page }) => {
  await mockSwapperFirstNetwork(page);
  const sent: string[] = [];
  page.on('request', request => { if (request.url().includes('/quote/swap')) sent.push(request.url()); });
  await page.goto('/network?from_asset=BTC.BTC&to_asset=ETH.ETH&amount=0.015#check-a-route');
  const checker = page.locator('#check-a-route');
  await expect(checker.getByRole('button', { name: 'Check route', exact: true })).toBeEnabled({ timeout: 15_000 });
  await expect(checker.locator('#quote-request-disclosure')).toContainText('selected asset pair and amount');
  expect(sent).toHaveLength(0);
  await checker.getByText('What the quote request shares', { exact: true }).click();
  await expect(checker.getByLabel('Quote provider destinations')).toContainText('https://gateway.liquify.com/chain/thorchain_api/thorchain');
  await expect(checker).toContainText('from_asset, to_asset and amount in 1e8 base units');
  await checker.getByRole('button', { name: 'Check route', exact: true }).click();
  await expect.poll(() => sent.length).toBe(1);
  const request = new URL(sent[0]);
  expect([...request.searchParams.keys()].sort()).toEqual(['amount', 'from_asset', 'to_asset']);
  expect(request.searchParams.get('amount')).toBe('1500000');
  expect(request.searchParams.get('from_asset')).toBe('BTC.BTC');
  expect(request.searchParams.get('to_asset')).toBe('ETH.ETH');
});
