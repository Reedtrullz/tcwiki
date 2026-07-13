import { test, expect, type Page } from '@playwright/test';
import { readLayoutSafety } from './helpers/layout-safety';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

function earningsInterval(index: number) {
  const startTime = 1_704_067_200 + index * 86_400;
  const earnings = (100_000_000 * (index + 1)).toString();
  const bondingEarnings = (60_000_000 * (index + 1)).toString();
  const liquidityEarnings = (40_000_000 * (index + 1)).toString();

  return {
    startTime: String(startTime),
    endTime: String(startTime + 86_400),
    liquidityFees: '0',
    blockRewards: '0',
    earnings,
    bondingEarnings,
    liquidityEarnings,
    avgNodeCount: '100',
    runePriceUSD: '5',
    pools: [],
  };
}

async function mockStatsMidgard(page: Page) {
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/pools\?status=available$/, async (route) => {
    await fulfillJson(route, [
      {
        asset: 'BTC.BTC',
        assetDepth: '100000000',
        runeDepth: '300000000',
        status: 'available',
        liquidityInUSD: '1500000',
        volume24h: '25000000000000',
        poolAPY: '0.12',
      },
      {
        asset: 'ETH.ETH',
        assetDepth: '100000000',
        runeDepth: '200000000',
        status: 'available',
        liquidityInUSD: '1100000',
        volume24h: '30000000000000',
        poolAPY: '0.08',
      },
      {
        asset: 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
        assetDepth: '100000000',
        runeDepth: '50000000',
        status: 'available',
        liquidityInUSD: '450000',
      },
      {
        asset: 'GAIA.ATOM',
        assetDepth: '100000000',
        runeDepth: '100000000',
        status: 'available',
      },
    ]);
  });
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/history\/earnings.*/, async (route) => {
    await fulfillJson(route, {
      intervals: Array.from({ length: 8 }, (_, index) => earningsInterval(index)),
    });
  });
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/network$/, async (route) => {
    await fulfillJson(route, {
      totalPooledRune: '100000000000',
      totalReserve: '200000000000',
      activeNodeCount: 100,
      standbyNodeCount: 20,
      bondingAPY: '0.10',
      liquidityAPY: '0.05',
      nextChurnHeight: 123,
      bondMetrics: {},
    });
  });
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/health$/, async (route) => {
    await fulfillJson(route, {
      database: true,
      inSync: true,
      scannerHeight: 101,
      lastAggregated: { height: 100, timestamp: 1_704_153_600 },
      lastThorNode: { height: 101, timestamp: 1_704_153_605 },
    });
  });
}

async function mockStatsMidgardPoolFailure(page: Page) {
  await mockStatsMidgard(page);
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/pools\?status=available$/, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Midgard pool source unavailable' }),
    });
  });
}

test.describe('THORChain Wiki Stats Smoke Tests', () => {
  test('stats page loads with data or graceful error state', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    const sourcePosture = page.getByRole('region', { name: 'Page Source Posture' });
    await expect(sourcePosture).toBeVisible();
    await expect(page.getByText(/Midgard v2 Health/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    const sourcePosturePrecedesLookHereFirst = await sourcePosture.evaluate((posture) => {
      const lookHereFirst = document.querySelector('#stats-look-here-first');
      return lookHereFirst ? Boolean(posture.compareDocumentPosition(lookHereFirst) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(sourcePosturePrecedesLookHereFirst).toBe(true);
    await expect(page.getByText(/Headline metrics/i)).toBeVisible();
    await expect(page.getByText('Midgard health', { exact: true })).toBeVisible();
    await expect(page.getByText('Operations', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Midgard pool rows/i).first()).toBeVisible();
    const numberGuide = page.locator('section[aria-labelledby="stats-number-guide-heading"]');
    await expect(numberGuide.getByRole('heading', { name: /Which Numbers Matter/i })).toBeVisible();
    await expect(numberGuide.getByRole('heading', { name: /Liquidity depth/i })).toBeVisible();
    await expect(numberGuide.getByRole('heading', { name: /Security set/i })).toBeVisible();
    await expect(numberGuide.getByText(/Do Not Use For/i).first()).toBeVisible();
    await expect(numberGuide.getByRole('link', { name: /Read CLP evidence/i })).toHaveAttribute('href', '/deep-dives/clp#evidence-ladder');
    await expect(numberGuide.getByRole('link', { name: /Check operations/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(numberGuide.getByRole('link', { name: /Check fee experiment/i })).toHaveAttribute('href', '/dynamic-fees#dynamic-fees-live');
    await expect(page.getByRole('heading', { name: /Related Checks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Live data guide/i })).toHaveAttribute('href', '/deep-dives/midgard-thornode-data');
    await expect(page.getByRole('link', { name: /Liquidity actions/i })).toHaveAttribute('href', '/deep-dives/liquidity-actions#what-to-check-first');
    await expect(page.getByRole('link', { name: /Build\/query path/i })).toHaveAttribute('href', '/deep-dives/build-query-data#query-plan');
    await expect(page.getByRole('heading', { name: /Earnings History/i })).toBeVisible();
    await expect(page.getByText(/Loading Midgard daily earnings intervals|Showing .* Midgard daily earnings intervals|Earnings history unavailable/i).first()).toBeVisible();
    await expect(page.getByText(/Liquidity depth signal/i)).toBeVisible();
    await expect(page.getByText(/Security-set signal/i)).toBeVisible();
    await expect(page.getByText(/Usable intervals/i)).toBeVisible();
    await expect(page.getByText(/not as durable revenue proof/i)).toBeVisible();
    await expect(page.getByText(/Current-only|Source warning|Source degraded|Degraded|Loading live source/i).first()).toBeVisible();
  });

  test('stats page prioritizes a loaded metric snapshot with source boundaries @docker-smoke', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }

    await mockSwapperFirstNetwork(page);
    await mockStatsMidgard(page);
    await page.goto('/stats');

    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    await expect(page.getByText(/First check whether the sources are usable/i)).toBeVisible();
    const operationalCheck = page.locator('#stats-operational-check');
    await expect(operationalCheck.getByRole('heading', { name: /Operational Check/i })).toBeVisible();
    await expect(operationalCheck.getByText(/Check network status before treating loaded metrics as route-ready/i)).toBeVisible();
    const operationalCheckPrecedesNumberGuide = await operationalCheck.evaluate((section) => {
      const numberGuide = document.querySelector('#stats-number-guide-heading');
      return numberGuide ? Boolean(section.compareDocumentPosition(numberGuide) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(operationalCheckPrecedesNumberGuide).toBe(true);
    await expect(page.getByRole('heading', { name: /Which Numbers Matter/i })).toBeVisible();
    await expect(page.getByText(/none of them alone proves route availability/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Live Metrics/i })).toBeVisible();
    await expect(page.getByText(/These are current Midgard snapshot numbers/i)).toBeVisible();
    const liveMetrics = page.locator('section[aria-labelledby="stats-live-metrics-heading"]');
    await expect(liveMetrics.getByText('Pooled RUNE', { exact: true })).toBeVisible();
    await expect(page.getByText(/1[,\s.]000/).first()).toBeVisible();
    await expect(liveMetrics.getByText('Bonding APY', { exact: true })).toBeVisible();
    await expect(page.getByText('10.00%').first()).toBeVisible();
    await expect(liveMetrics.getByText('Active Nodes', { exact: true })).toBeVisible();
    await expect(page.getByText('100').first()).toBeVisible();
    await expect(liveMetrics.getByText('Reserve RUNE', { exact: true })).toBeVisible();
    await expect(page.getByText(/2[,\s.]000/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Midgard Available-Pool Rows/i })).toBeVisible();
    await expect(page.getByText(/Showing 4 Midgard available-pool rows across 3 chains/i)).toBeVisible();
    await expect(page.getByText(/not proof that a specific route will quote/i)).toBeVisible();
    await expect(page.getByText(/Route proof is separate/i)).toBeVisible();
    await expect(page.getByText(/A current route still needs a THORNode quote/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Check a route/i })).toHaveAttribute('href', '/network#check-a-route');
    await expect(page.getByRole('searchbox', { name: /Filter Midgard available-pool rows/i })).toBeVisible();
    await expect(page.getByLabel(/Pool chain/i)).toBeVisible();
    await expect(page.getByLabel(/Pool sort/i)).toBeVisible();
    await expect(page.getByText('Top Pools By RUNE Depth')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Loaded Row List' })).toBeVisible();
    await expect(page.getByText('BTC.BTC').first()).toBeVisible();
    await expect(page.getByText('Unavailable').first()).toBeVisible();
    await expect(page.getByText(/BSC and SOL are swap-limited/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Related Checks/i })).toBeVisible();

    const layout = await readLayoutSafety(page);
    expect(layout.hasFrameworkOverlay).toBe(false);
    expect(
      layout.pageWidth,
      `stats loaded snapshot overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
    ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  });

  test('stats pool counts stay unavailable when both Midgard pool providers fail', async ({ page }) => {
    await mockSwapperFirstNetwork(page);
    await mockStatsMidgardPoolFailure(page);
    await page.goto('/stats');

    await expect(page.getByRole('heading', { name: /Midgard Available-Pool Rows/i })).toBeVisible();
    await expect(page.getByTestId('stats-pool-row-count')).toHaveText('Unavailable');
    await expect(page.getByTestId('stats-pool-chain-count')).toHaveText('Unavailable');
    await expect(page.getByText(/Live data is degraded/i)).toBeVisible();
    await expect(page.getByText(/Midgard source did not provide usable data/i).first()).toBeVisible();
    await expect(page.getByText(/Midgard available-pool rows unavailable from live sources/i)).toBeVisible();
  });

  test('available pool finder filters, sorts, and hydrates from the URL', async ({ page, isMobile }) => {
    await mockSwapperFirstNetwork(page);
    await mockStatsMidgard(page);
    await page.goto('/stats?pool_q=eth&pool_chain=ETH&pool_sort=volume#available-pools');

    const pools = page.locator('#available-pools');
    await expect(pools.getByRole('heading', { name: /Midgard Available-Pool Rows/i })).toBeVisible();
    await expect(pools.getByRole('searchbox', { name: /Filter Midgard available-pool rows/i })).toHaveValue('eth');
    await expect(pools.getByLabel(/Pool chain/i)).toHaveValue('ETH');
    await expect(pools.getByLabel(/Pool sort/i)).toHaveValue('volume24hRune');
    await expect(pools.getByText('Search: eth')).toBeVisible();
    await expect(pools.getByText('Chain: ETH')).toBeVisible();
    await expect(pools.getByText('Sort: 24h volume (RUNE)')).toBeVisible();
    await expect(pools.getByText(/Showing 2 of 4 pool rows after filters/i)).toBeVisible();
    if (isMobile) {
      await expect(pools.getByRole('listitem').filter({ hasText: 'ETH.ETH' })).toBeVisible();
      await expect(pools.getByRole('listitem').filter({ hasText: 'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48' })).toBeVisible();
      await expect(pools.getByRole('listitem').filter({ hasText: 'BTC.BTC' })).toHaveCount(0);
    } else {
      await expect(pools.getByRole('row', { name: /ETH\.ETH/i })).toBeVisible();
      await expect(pools.getByRole('row', { name: /ETH\.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48/i })).toBeVisible();
      await expect(pools.getByRole('row', { name: /BTC\.BTC/i })).toHaveCount(0);
    }
    await expect(pools.getByText(/Full loaded row list stays in this wiki view/i)).toBeVisible();

    await pools.getByRole('searchbox', { name: /Filter Midgard available-pool rows/i }).fill('atom');
    await expect(page).toHaveURL(/pool_q=atom/);
    await expect(pools.getByText(/No pools match "atom" on ETH/i)).toBeVisible();

    await pools.getByRole('button', { name: /Reset pool filters/i }).click();
    await expect(page).toHaveURL(/\/stats#available-pools$/);
    await expect(pools.getByRole('searchbox', { name: /Filter Midgard available-pool rows/i })).toHaveValue('');
    await expect(pools.getByText('BTC.BTC').first()).toBeVisible();
  });

  test('stats earnings history uses mobile cards for loaded intervals', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile cards are only rendered below the md breakpoint');

    await mockSwapperFirstNetwork(page);
    await mockStatsMidgard(page);
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByText(/Showing 8 Midgard daily earnings intervals/i)).toBeVisible();
    await expect(page.getByText(/Latest valid-window total/i)).toBeVisible();
    await expect(page.getByText('Valid loaded-interval total', { exact: true })).toBeVisible();
    await expect(page.getByText('30-day valid total', { exact: true })).toHaveCount(0);
    await expect(page.getByText(/7\/7 intervals with values/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recent Daily Earnings Intervals/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Midgard Available-Pool Rows/i })).toBeVisible();
    await expect(page.getByRole('list', { name: /Midgard available-pool rows/i })).toBeVisible();
    const recentList = page.getByRole('list', { name: /Recent daily earnings intervals/i });
    await expect(recentList).toBeVisible();
    await expect(recentList.getByRole('listitem').first().getByText('8 RUNE', { exact: true })).toBeVisible();
    await expect(page.getByText(/Node operators/i).first()).toBeVisible();
    await expect(page.getByText('LPs', { exact: true }).first()).toBeVisible();
    await expect(page.locator('table').first()).toBeHidden();

    const layout = await readLayoutSafety(page);
    expect(layout.hasFrameworkOverlay).toBe(false);
    expect(
      layout.pageWidth,
      `mobile stats loaded state overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
    ).toBeLessThanOrEqual(layout.viewportWidth + 2);
  });
});
