import { test, expect } from '@playwright/test';
import { readLayoutSafety } from './helpers/layout-safety';

test.describe('THORChain Wiki Search Smoke Tests', () => {
  test('search page is functional', async ({ page }) => {
    test.slow();
    await page.goto('/search');
    await expect(page.getByRole('heading', { level: 1, name: 'Search And Guided Answers' })).toBeVisible();
    await expect(page.locator('#search-look-here-first')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Look Here First', exact: true })).toBeVisible();
    const searchSectionOrder = await page.locator('main').evaluate((main) => {
      const sectionIds = Array.from(main.querySelectorAll('section[id]')).map((section) => section.id);
      return {
        primer: sectionIds.indexOf('search-look-here-first'),
        guidedAnswers: sectionIds.indexOf('search-guided-answers'),
      };
    });
    expect(searchSectionOrder.primer, 'decision primer should precede the longer guided-answer catalogue').toBeGreaterThanOrEqual(0);
    expect(searchSectionOrder.guidedAnswers, 'guided-answer catalogue should be present').toBeGreaterThan(searchSectionOrder.primer);
    await expect(page.getByRole('link', { name: /Can this route quote/i })).toHaveAttribute('href', '/network#check-a-route');
    await expect(page.getByRole('link', { name: /Which proof fits/i })).toHaveAttribute('href', '/docs#source-map-chooser');
    await expect(page.getByRole('link', { name: /What does this term mean/i })).toHaveAttribute('href', '/glossary#glossary-definition-map');
    await expect(page.getByRole('link', { name: /Which endpoint should I use/i })).toHaveAttribute('href', '/deep-dives/build-query-data#query-plan');
    await expect(page.getByRole('heading', { name: 'Example Queries', exact: true })).toBeVisible();
    const exampleQueries = page.locator('section[aria-labelledby="search-example-queries-heading"]');
    await expect(exampleQueries.getByRole('heading', { name: 'Use Now', exact: true })).toBeVisible();
    await expect(exampleQueries.getByRole('heading', { name: 'Proof Boundaries', exact: true })).toBeVisible();
    await expect(exampleQueries.getByRole('heading', { name: 'Builder Terms', exact: true })).toBeVisible();
    await expect(exampleQueries.getByRole('link', { name: 'current TCY controls' })).toHaveAttribute('href', /\/search\?q=current\+TCY\+controls/);
    await expect(exampleQueries.getByRole('link', { name: 'App Layer claim checks' })).toHaveAttribute('href', /\/search\?q=App\+Layer\+claim\+checks/);
    await expect(exampleQueries.getByRole('link', { name: 'recommended_min_amount_in' })).toHaveAttribute('href', '/search?q=recommended_min_amount_in');
    await expect(page.getByRole('heading', { name: 'Guided Answers', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Reader Paths/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Common Tasks/i })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Search, guided reader paths, task guides/i)).toBeVisible();
    await expect(page.getByText(/high-ranked result proves the claim/i)).toBeVisible();
    await expect(page.locator('#search-common-tasks')).toBeVisible();
    await page.goto('/search#search-common-tasks');
    await expect(page.locator('#search-common-tasks')).toBeVisible();
    const commonTasksBox = await page.locator('#search-common-tasks').boundingBox();
    expect(commonTasksBox?.y ?? 0).toBeGreaterThanOrEqual(52);
    const commonTasks = page.locator('#search-common-tasks');
    await expect(commonTasks.getByText('Use Now', { exact: true })).toBeVisible();
    await expect(commonTasks.getByText('Trust & Recovery', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Learning paths/i })).toHaveAttribute('href', '/deep-dives#deep-dive-reader-paths');
    await expect(commonTasks.getByRole('link', { name: /Can I swap right now/i })).toHaveAttribute('href', '/network#check-a-route');
    const searchForm = page.getByRole('search', { name: /Search wiki content/i });
    await expect(searchForm).toBeVisible();
    const searchInput = searchForm.getByLabel(/Search the wiki/i);
    await searchInput.fill('universal settlement asset');
    await expect(searchInput).toHaveValue('universal settlement asset');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=universal(\+|%20)settlement(\+|%20)asset/);
    await expect(page.getByText(/result/i).first()).toBeVisible();
    await expect(page.getByText(/RUNE as the Universal Settlement Asset/i).first()).toBeVisible();

    await searchInput.fill('traditional multisig');
    await expect(searchInput).toHaveValue('traditional multisig');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=traditional(\+|%20)multisig/);
    await expect(page.getByText(/Threshold Signatures/i).first()).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(/\/search\?q=universal(\+|%20)settlement(\+|%20)asset/);
    await expect(page.getByText(/RUNE as the Universal Settlement Asset/i).first()).toBeVisible();
    await expect(page.getByText(/Tip: Press|⌘K|Ctrl\+K/i)).toHaveCount(0);
    await expect(page.getByText(/Relevance:/i)).toHaveCount(0);

    await page.goto('/search?q=rune%3A');
    await expect(page.getByRole('heading', { level: 1, name: 'Search And Guided Answers' })).toBeVisible();
    await expect(page.getByText(/result/i).first()).toBeVisible();
    await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);

    await page.goto('/search?q=current-only%20snapshots');
    const resultBoundary = page.locator('#search-result-boundary');
    await expect(resultBoundary.getByRole('heading', { name: /Ranking is a starting point, not proof/i })).toBeVisible();
    await expect(resultBoundary.getByText(/Check each result source, review date, and live evidence/i)).toBeVisible();
    await expect(resultBoundary.getByRole('link', { name: /Full source posture/i })).toHaveAttribute('href', '#search-page-source-posture');
    const resultBoundaryBox = await resultBoundary.boundingBox();
    const firstResultBox = await page.locator('main article').first().boundingBox();
    expect(resultBoundaryBox?.y ?? Number.POSITIVE_INFINITY).toBeLessThan(firstResultBox?.y ?? 0);
    await expect(page.locator('main article').first().locator('a[href="/docs#current-protocol-state"]')).toBeVisible();
    await expect(page.getByText(/Next wiki review/i).first()).toBeVisible();
    await expect(page.getByText(/2026-07-04 to 2026-07-05/i).first()).toBeVisible();
    await expect(page.getByText(/\+4 sources/i).first()).toBeVisible();
    await resultBoundary.getByText('+4 sources', { exact: true }).click();
    const boundaryLayout = await readLayoutSafety(page);
    expect(
      boundaryLayout.overflowing,
      `search boundary source disclosure should stay contained ${JSON.stringify(boundaryLayout)}`
    ).toEqual([]);

    await page.goto('/search?q=which%20source%20should%20i%20trust');
    const sourceChoiceResult = page.locator('main article').first().locator('a[href="/docs#source-map-chooser"]');
    await expect(sourceChoiceResult).toBeVisible();
    await expect(page.getByText(/Which source should I trust/i).first()).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/docs#source-map-chooser$/, { timeout: 15_000 }),
      sourceChoiceResult.click(),
    ]);
    await expect(page.locator('#source-map-chooser')).toBeVisible();
    await expect(page.locator('#source-map-chooser').getByRole('heading', { name: /Something is available, paused, enabled, or healthy right now/i })).toBeVisible();
    await expect(page.locator('#source-map-chooser p').filter({ hasText: /Static docs explain intended\/design behavior, not proof/i })).toBeVisible();
    await expect(page.locator('#source-map-chooser p').filter({ hasText: /Community material is useful context/i })).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/docs#current-protocol-state$/, { timeout: 15_000 }),
      page.locator('#source-map-chooser a[href="/docs#current-protocol-state"]').first().click(),
    ]);
    await expect(page.locator('#current-protocol-state')).toBeVisible();
    await page.goto('/docs#source-map-chooser');
    await Promise.all([
      page.waitForURL(/\/ecosystem#interface-use-checklist$/, { timeout: 15_000 }),
      page.locator('#source-map-chooser a[href="/ecosystem#interface-use-checklist"]').first().click(),
    ]);
    await expect(page.locator('#interface-use-checklist')).toBeVisible();

    await page.goto('/search?q=current%20TCY%20claim');
    await expect(page.locator('main article').first().locator('a[href="/tcy#tcy-current-controls"]')).toBeVisible();

    await page.goto('/search?q=can%20I%20borrow');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/tcy-recovery-timeline#what-to-check-now"]')).toBeVisible();

    await page.goto('/search?q=current%20protocol%20evidence');
    await expect(page.locator('main article').first().locator('a[href="/docs#current-protocol-state"]')).toBeVisible();

    await page.goto('/search?q=source%20freshness');
    await expect(page.locator('main article').first().locator('a[href="/docs#source-map-chooser"]')).toBeVisible();
    await expect(page.getByText(/Which source should I trust/i).first()).toBeVisible();

    await page.goto('/search?q=where%20did%20this%20number%20come%20from');
    await expect(page.locator('main article').first().locator('a[href="/docs#source-map-chooser"]')).toBeVisible();
    await expect(page.getByText(/Which source should I trust/i).first()).toBeVisible();

    await page.goto('/search?q=provider%20mismatch');
    await expect(page.locator('main article').first().locator('a[href="/docs#runtime-live-data-failover"]')).toBeVisible();
    await expect(page.getByText(/Runtime Live-Data Failover/i).first()).toBeVisible();

    await page.goto('/search?q=current%20protocol%20source');
    await expect(page.locator('main article').first().locator('a[href="/docs#current-protocol-state"]')).toBeVisible();
    await expect(page.getByText(/Current Protocol State/i).first()).toBeVisible();

    await page.goto('/search?q=is%20ShapeShift%20safe');
    await expect(page.locator('main article').first().locator('a[href="/ecosystem#interface-use-checklist"]')).toBeVisible();

    await page.goto('/search?q=are%20THORChain%20vaults%20safe');
    const vaultSafetyStartHere = page.locator('section[aria-labelledby="search-start-here"]');
    await expect(vaultSafetyStartHere.locator('article').first().getByRole('link', { name: /TSS security claims/i })).toHaveAttribute('href', '/deep-dives/tss');
    await expect(vaultSafetyStartHere.locator('a[href="/ecosystem#interface-use-checklist"]')).toHaveCount(0);
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/tss"]')).toBeVisible();

    await page.goto('/search?q=wallet%20safety');
    await expect(page.locator('main article').first().locator('a[href="/ecosystem#interface-use-checklist"]')).toBeVisible();
    const walletSafetyStartHere = page.locator('section[aria-labelledby="search-start-here"]');
    await expect(walletSafetyStartHere.locator('a[href="/deep-dives/tss"]')).toHaveCount(0);

    await page.goto('/search?q=vault%20exploit');
    await expect(page.locator('section[aria-labelledby="search-start-here"]')).toHaveCount(0);
    await expect(page.locator('main article').first().locator('a[href="/governance#incident-gg20-vault-exploit-2026"]')).toBeVisible();

    await page.goto('/search?q=which%20chains%20are%20supported');
    const supportedChainsStartHere = page.locator('section[aria-labelledby="search-start-here"]');
    await expect(supportedChainsStartHere.locator('article').first().getByRole('link', { name: /Find catalog-listed chains/i })).toHaveAttribute('href', '/protocol#supported-chain-finder');
    await expect(supportedChainsStartHere.locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(supportedChainsStartHere.locator('a[href="/docs#current-protocol-state"]')).toBeVisible();

    await page.goto('/search?q=is%20TON%20supported');
    await expect(page.locator('main article').first().locator('a[href="/protocol#supported-chain-finder"]')).toBeVisible();
    await expect(page.locator('main article').first().locator('a[href="/protocol#chain-tron"]')).toHaveCount(0);

    await page.goto('/search?q=dynamic%20L1%20fee');
    await expect(page.getByRole('heading', { name: /Start Here/i })).toBeVisible();
    const dynamicFilterNav = page.getByRole('navigation', { name: /Filter search results/i });
    await expect(dynamicFilterNav.getByRole('link', { name: /Tasks/i })).toBeVisible();
    await expect(dynamicFilterNav.getByRole('link', { name: /Source Map/i })).toBeVisible();
    await expect(page.locator('main a[href="/dynamic-fees#dynamic-fees-live"]').first()).toBeVisible();
    await expect(page.locator('main article').first().locator('a[href="/dynamic-fees#dynamic-fees-live"]')).toBeVisible();
    await expect(page.getByText(/ADR-026 dynamic L1 fee/i).first()).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/search\?q=dynamic(\+|%20)L1(\+|%20)fee&filter=source-map/),
      dynamicFilterNav.getByRole('link', { name: /Source Map/i }).click(),
    ]);
    await expect(page.getByText(/of .* results/i).first()).toBeVisible();
    await expect(page.locator('main article').first().locator('span').filter({ hasText: /^Source Map$/ })).toBeVisible();

    await page.goto('/search?q=Symbiosis%20dynamic%20fee');
    await expect(page.locator('main article').first().locator('a[href="/dynamic-fees#dynamic-fees-live"]')).toBeVisible();

    await page.goto('/search?q=pending%20outbound');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Why did my swap refund/i).first()).toBeVisible();

    await page.goto('/search?q=outbound%20sent%20but%20not%20received');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Why did my swap refund/i).first()).toBeVisible();

    await page.goto('/search?q=why%20are%20fees%20high');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Fee and quote mechanics/i).first()).toBeVisible();

    await page.goto('/search?q=outbound%20gas%20fee');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Fee and quote mechanics/i).first()).toBeVisible();

    await page.goto('/search?q=minimum%20receive');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Why did my swap refund/i).first()).toBeVisible();

    await page.goto('/search?q=memo%20too%20long');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Why did my swap refund/i).first()).toBeVisible();

    await page.goto('/search?q=quote%20warning');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/build-query-data#query-plan"]')).toBeVisible();
    await expect(page.getByText(/Build or query data/i).first()).toBeVisible();

    await page.goto('/search?q=what%20is%20thorname');
    await expect(page.locator('main article').first().locator('a[href="/glossary#term-thorname"]')).toBeVisible();
    await expect(page.getByText(/THORName/i).first()).toBeVisible();

    await page.goto('/search?q=dynamic%20fee%20thorname');
    await expect(page.locator('main article').first().locator('a[href="/dynamic-fees#dynamic-fees-live"]')).toBeVisible();
    await expect(page.getByText(/ADR-026 dynamic fees/i).first()).toBeVisible();

    await page.goto('/search?q=withdraw%20bond');
    await expect(page.locator('main article').first().locator('a[href="/network#node-operator-actions"]')).toBeVisible();
    await expect(page.getByText(/Node operator actions/i).first()).toBeVisible();

    await page.goto('/search?q=node%20operator%20guide');
    const nodeOperatorGuideResult = page.locator('main article').first();
    await expect(nodeOperatorGuideResult.locator('a[href="/network#node-operator-guide"]')).toBeVisible();
    await expect(nodeOperatorGuideResult.getByText(/Run or operate a node/i)).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/network#node-operator-guide$/, { timeout: 15_000 }),
      nodeOperatorGuideResult.locator('a[href="/network#node-operator-guide"]').click(),
    ]);
    await expect(page.locator('#node-operator-guide')).toBeVisible();

    await page.goto('/search?q=ADR-028');
    const adr028Result = page.locator('main article').first();
    await expect(adr028Result.getByRole('link', { name: /Governance Needs review ADR-028 Recovery Path/i })).toHaveAttribute('href', '/governance#governance-adr-028-recovery');
    const adr028FilterNav = page.getByRole('navigation', { name: /Filter search results/i });
    await expect(adr028FilterNav.getByRole('link', { name: /Needs Review/i })).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/search\?q=ADR-028&filter=needs-review/),
      adr028FilterNav.getByRole('link', { name: /Needs Review/i }).click(),
    ]);
    await expect(page.getByText(/of .* results/i).first()).toBeVisible();
    await expect(page.locator('main article').first().getByRole('link', { name: /Governance Needs review ADR-028 Recovery Path/i })).toHaveAttribute('href', '/governance#governance-adr-028-recovery');

    await page.goto('/search?q=submit%20proposal');
    const governanceProposalResult = page.locator('main article').first();
    await expect(governanceProposalResult.locator('a[href="/governance#governance-proposal-status"]')).toBeVisible();
    await expect(governanceProposalResult.getByText(/Governance and proposals/i)).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/governance#governance-proposal-status$/, { timeout: 15_000 }),
      governanceProposalResult.locator('a[href="/governance#governance-proposal-status"]').click(),
    ]);
    await expect(page.locator('#governance-proposal-status')).toBeVisible();

    await page.goto('/search?q=vote%20proposal');
    await expect(page.locator('main article').first().locator('a[href="/governance#governance-proposal-status"]')).toBeVisible();
    await expect(page.getByText(/Governance and proposals/i).first()).toBeVisible();

    await page.goto('/search?q=dynamic%20fee%20source%20map');
    const dynamicFeeSourceMapLink = page.locator('main article').first().locator('a[href="/docs#dynamic-fee-experiment"]');
    await expect(dynamicFeeSourceMapLink).toBeVisible();
    await expect(page.getByText(/Dynamic Fee Experiment/i).first()).toBeVisible();

    await page.goto('/search?q=Midgard%20API');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/build-query-data#query-plan"]')).toBeVisible();
    await expect(page.getByText(/Build or query data/i).first()).toBeVisible();

    await page.goto('/search?q=Midgard%20vs%20THORNode');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/midgard-thornode-data"]')).toBeVisible();
    await expect(page.getByText(/Midgard And THORNode Data/i).first()).toBeVisible();

    await page.goto('/search?q=can%20i%20swap%20right%20now');
    await expect(page.locator('main a[href="/network#check-a-route"]').first()).toBeVisible();
    await expect(page.locator('main article').first().locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=is%20swapping%20enabled');
    await expect(page.locator('main article').first().locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=route%20available');
    await expect(page.locator('main article').first().locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=current%20quote');
    await expect(page.locator('main article').first().locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=ETH%20to%20BTC%20swap');
    await expect(page.locator('main article').first().locator('a[href="/network#check-a-route"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=is%20THORChain%20down');
    await expect(page.locator('main article').first().locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(page.getByText(/Why is something paused/i).first()).toBeVisible();

    await page.goto('/search?q=is%20pool%20open');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/liquidity-actions#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Add or withdraw liquidity/i).first()).toBeVisible();

    await page.goto('/search?q=missing%20outbound');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();
    await expect(page.getByText(/Why did my swap refund/i).first()).toBeVisible();

    await page.goto('/search?q=current%20protocol%20state');
    await expect(page.locator('main article').first().locator('a[href="/docs#current-protocol-state"]')).toBeVisible();
    await expect(page.getByText(/Current Protocol State/i).first()).toBeVisible();

    await page.goto('/search?q=current%20protocol%20state&filter=live');
    await expect(page.locator('main article').first().locator('a[href="/docs#current-protocol-state"]')).toBeVisible();
    await expect(page.getByText(/Current Protocol State/i).first()).toBeVisible();

    await page.goto('/search?q=HaltWasmContract');
    const mimirControlResult = page.locator('main article').filter({ hasText: 'Mimir halt and enablement controls (current diagnostics)' });
    await expect(mimirControlResult.locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(mimirControlResult.getByText('Mimir Control', { exact: true })).toBeVisible();
    await expect(mimirControlResult.getByText(/HaltWasmContract-\*/i)).toBeVisible();
    await expect(mimirControlResult.getByText(/Next wiki review.*2026-08-08/i)).toBeVisible();

    await page.goto('/search?q=PauseLP');
    const pauseLpResult = page.locator('main article').first();
    await expect(pauseLpResult.locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(pauseLpResult.getByText(/Mimir halt and enablement controls/i)).toBeVisible();
    await expect(pauseLpResult.getByText(/PAUSELP/i)).toBeVisible();

    await page.goto('/search?q=PauseAsymWithdrawal-BTC');
    const pauseAsymResult = page.locator('main article').first();
    await expect(pauseAsymResult.locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(pauseAsymResult.getByText(/Mimir halt and enablement controls/i)).toBeVisible();
    await expect(pauseAsymResult.getByText(/PauseAsymWithdrawal-\*/i)).toBeVisible();

    await page.goto('/search?q=why%20is%20BSC%20halted');
    await expect(page.locator('main article').first().locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(page.locator('main article').first().getByText(/Why is something paused|Can I swap right now/i)).toBeVisible();

    await page.goto('/search?q=which%20chains%20are%20halted');
    await expect(page.locator('main article').first().locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(page.locator('main article').first().getByText(/Why is something paused/i)).toBeVisible();

    await page.goto('/search?q=HALTBSCTRADING');
    const bscHaltResult = page.locator('main article').first();
    await expect(bscHaltResult.locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(bscHaltResult.getByText(/Mimir halt and enablement controls/i)).toBeVisible();
    await expect(bscHaltResult.getByText(/HALTBSCTRADING/i)).toBeVisible();

    await page.goto('/search?q=start%20with%20the%20claim');
    await expect(page.locator('main a[href="/"]').filter({ hasText: /THORChain Wiki Home/i }).first()).toBeVisible();
    await expect(page.getByText(/THORChain Wiki Home/i).first()).toBeVisible();

    await page.goto('/search?q=quote%20expiry');
    const quoteExpiryResult = page.locator('main article').first().locator('a[href="/glossary#term-quote-expiry"]');
    await expect(quoteExpiryResult).toBeVisible();
    await expect(page.getByText(/Expired quotes need a fresh quote/i).first()).toBeVisible();

    await page.goto('/search?q=wallet%20safety');
    await expect(page.locator('main article').first().locator('a[href="/ecosystem#interface-use-checklist"]')).toBeVisible();
    await expect(page.getByText(/Choose an interface/i).first()).toBeVisible();

    await page.goto('/search?q=current%20TCY%20controls');
    await expect(page.locator('main article').first().locator('a[href="/tcy#tcy-current-controls"]')).toBeVisible();
    await expect(page.getByText(/Current TCY controls/i).first()).toBeVisible();
    await expect(page.locator('main a[href="/deep-dives/tcy-recovery-timeline#what-to-check-now"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/tcy"]').first()).toBeVisible();

    await page.goto('/search?q=TCY%20distribution%20now');
    await expect(page.locator('main article').first().locator('a[href="/tcy#tcy-current-controls"]')).toBeVisible();
    await expect(page.getByText(/Current TCY controls/i).first()).toBeVisible();

    await page.goto('/search?q=TCY%20trading%20halted');
    await expect(page.locator('main article').first().locator('a[href="/tcy#tcy-current-controls"]')).toBeVisible();
    await expect(page.getByText(/Current TCY controls/i).first()).toBeVisible();

    await page.goto('/search?q=RUNEPool%20live&filter=live');
    await expect(page.locator('main article').first().locator('a[href="/economics#runepool-pol-live"]')).toBeVisible();
    await expect(page.getByText(/RUNEPool and POL evidence/i).first()).toBeVisible();

    await page.goto('/search?q=current%20TCY%20controls&filter=live');
    await expect(page.locator('main article').first().locator('a[href="/tcy#tcy-current-controls"]')).toBeVisible();
    await expect(page.getByText(/Current TCY controls/i).first()).toBeVisible();

    await page.goto('/search?q=App%20Layer%20claim%20checks');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/app-layer#what-to-verify-before-claiming"]')).toBeVisible();
    await expect(page.getByText(/App Layer and secured assets/i).first()).toBeVisible();
    await expect(page.locator('main a[href="/docs#source-map-chooser"]').first()).toBeVisible();

    await page.goto('/search?q=secured%20asset%20deposit%20available');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/app-layer#what-to-verify-before-claiming"]')).toBeVisible();
    await expect(page.getByText(/App Layer and secured assets/i).first()).toBeVisible();

    await page.goto('/search?q=trade%20account%20deposit%20halted');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/app-layer#what-to-verify-before-claiming"]')).toBeVisible();
    await expect(page.getByText(/App Layer and secured assets/i).first()).toBeVisible();

    await page.goto('/search?q=app%20layer%20route%20available');
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/app-layer#what-to-verify-before-claiming"]')).toBeVisible();
    await expect(page.getByText(/App Layer and secured assets/i).first()).toBeVisible();

    await page.goto('/search?q=HaltWasmContract');
    await expect(page.locator('main article').first().locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(page.locator('main article').first().getByText(/Mimir halt and enablement controls/i)).toBeVisible();

    await page.goto('/search?q=totallynotawikithing');
    await expect(page.getByText(/No results for/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Reader Paths/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Common Tasks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Which source should I trust/i })).toHaveAttribute('href', '/docs#source-map-chooser');

    await page.goto('/search?q=RUNE%20fair%20value');
    await expect(page.locator('main article').first().locator('a[href="/rune#rune-number-router"]')).toBeVisible();
    await expect(page.getByText(/RUNE and tokenomics claims/i).first()).toBeVisible();
    await expect(page.locator('main a[href="/docs#rune-tokenomics-and-value"]').first()).toBeVisible();
    await expect(page.getByText(/RUNE Tokenomics And Value/i).first()).toBeVisible();

    await page.goto('/search?q=which%20RUNE%20number');
    await expect(page.locator('main a[href="/rune"]').first()).toBeVisible();
    await expect(page.getByText(/RUNE number router/i).first()).toBeVisible();

    await page.goto('/search?q=which%20RUNE%20number&filter=live');
    await expect(page.locator('main article').first().locator('a[href="/rune#rune-number-router"]')).toBeVisible();
    await expect(page.getByText(/RUNE and tokenomics claims/i).first()).toBeVisible();

    await page.goto('/search?q=rune%20staking');
    const runeActionStartHere = page.locator('section[aria-labelledby="search-start-here"] article').first();
    await expect(runeActionStartHere.getByRole('link', { name: /RUNE holder actions/i })).toHaveAttribute('href', '/rune#rune-action-router');
    await expect(page.locator('main article').first().locator('a[href="/rune#rune-action-router"]')).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/rune#rune-action-router$/),
      runeActionStartHere.getByRole('link', { name: /RUNE holder actions/i }).click(),
    ]);
    await expect(page.locator('#rune-action-router')).toBeVisible();

    await page.goto('/search?q=network%20security%20path');
    const pathStartHere = page.locator('section[aria-labelledby="search-start-here"]');
    await expect(pathStartHere.getByText(/reader-path matches/i)).toBeVisible();
    await expect(pathStartHere.locator('article').first().locator('span').filter({ hasText: /^Reader Path$/ })).toBeVisible();
    await expect(page.getByText(/deep dive-path/i)).toHaveCount(0);
    const networkSecurityPathLink = pathStartHere.getByRole('link', { name: /Network Security/i }).first();
    await expect(networkSecurityPathLink).toHaveAttribute('href', '/deep-dives#deep-dive-path-network-security');
    await Promise.all([
      page.waitForURL(/\/deep-dives#deep-dive-path-network-security$/),
      networkSecurityPathLink.click(),
    ]);
    await expect(page.locator('#deep-dive-path-network-security')).toBeVisible();

    await page.goto('/search?q=DKLS');
    const tssStartHere = page.locator('section[aria-labelledby="search-start-here"] article').first();
    await expect(tssStartHere.getByRole('link', { name: /TSS security claims/i })).toHaveAttribute('href', '/deep-dives/tss');
    await expect(page.locator('main a[href="/deep-dives#deep-dive-path-network-security"]').first()).toBeVisible();
  });

  test('search results link to exact record anchors with trust labels', async ({ page }) => {
    await page.goto('/search?q=GG20');
    const incidentLink = page.locator('a[href="/governance#incident-gg20-vault-exploit-2026"]').first();
    await expect(incidentLink).toBeVisible();
    await expect(incidentLink).toHaveAttribute('href', '/governance#incident-gg20-vault-exploit-2026');
    await expect(incidentLink.locator('span').filter({ hasText: /^Incident$/ })).toBeVisible();
    await expect(incidentLink.getByText('Official source', { exact: true })).toBeVisible();
    const incidentResult = page.locator('main article').filter({ has: incidentLink }).first();
    const incidentMeta = incidentResult.locator('dl').first();
    await expect(incidentMeta).toContainText(/Wiki reviewed\s*2026-07-05/i);
    await expect(incidentMeta).toContainText(/Next wiki review\s*2026-08-05/i);
    await expect(incidentMeta).toContainText(/Source retrieved\s*2026-07-04 to 2026-07-05/i);
    await expect(incidentResult.getByText(/Sources used/i)).toBeVisible();
    await expect(incidentResult.getByRole('link', { name: 'THORChain Exploit Report #2' })).toBeVisible();
    await incidentResult.getByText('source retrieval details').click();
    await expect(incidentResult.getByText(/Source retrieved 2026-07-04/i).first()).toBeVisible();
    await expect(incidentResult.getByText(/Official root-cause report for the May 2026 GG20\/TSS vault exploit/i)).toBeVisible();
    await page.goto('/governance#incident-gg20-vault-exploit-2026');
    await expect(page).toHaveURL(/\/governance#incident-gg20-vault-exploit-2026$/);
    await expect(page.locator('#incident-gg20-vault-exploit-2026')).toBeVisible();

    await page.goto('/search?q=reduced%20supply%20near%20425M');
    const tokenomicsLink = page.locator('a[href="/rune#tokenomics-rune-supply-framing"]').first();
    await expect(tokenomicsLink).toBeVisible();
    await expect(tokenomicsLink.locator('span').filter({ hasText: /^Tokenomics$/ })).toBeVisible();
    await tokenomicsLink.click();
    await expect(page).toHaveURL(/\/rune#tokenomics-rune-supply-framing$/);
    await expect(page.locator('#tokenomics-rune-supply-framing')).toBeVisible();
  });
});
