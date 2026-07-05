import { test, expect, type Locator, type Page, type Route } from '@playwright/test';

function expectStrictCsp(headers: Record<string, string>) {
  const enforced = process.env.CSP_ENFORCE === '1';
  const expectedHeader = enforced ? 'content-security-policy' : 'content-security-policy-report-only';
  const unexpectedHeader = enforced ? 'content-security-policy-report-only' : 'content-security-policy';
  const csp = headers[expectedHeader];

  expect(csp).toBeTruthy();
  expect(headers[unexpectedHeader]).toBeUndefined();
  expect(csp).toContain('/api/csp-report');
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).not.toContain('unsafe-inline');
  expect(csp).toContain("'nonce-");
}

function expectPermissionsPolicy(headers: Record<string, string>) {
  const value = headers['permissions-policy'];

  expect(value).toBeTruthy();
  expect(value).toContain('camera=()');
  expect(value).toContain('microphone=()');
  expect(value).toContain('geolocation=()');
  expect(value).toContain('payment=()');
  expect(value).toContain('usb=()');
}

async function expectAnyVisible(locator: Locator) {
  await expect.poll(async () => {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible()) {
        return true;
      }
    }
    return false;
  }).toBe(true);
}

function expectStringArray(value: unknown) {
  expect(Array.isArray(value)).toBe(true);
  for (const item of value as unknown[]) {
    expect(typeof item).toBe('string');
  }
}

function expectWarningDetails(value: unknown) {
  expect(Array.isArray(value)).toBe(true);
  for (const item of value as unknown[]) {
    expect(item).toEqual(expect.objectContaining({
      severity: expect.stringMatching(/^(critical|warning|review)$/),
      category: expect.any(String),
      message: expect.any(String),
      action: expect.any(String),
    }));
    const detail = item as { keys?: unknown; scopes?: unknown };
    if (detail.keys !== undefined) {
      expectStringArray(detail.keys);
    }
    if (detail.scopes !== undefined) {
      expectStringArray(detail.scopes);
    }
  }
}

function sourceUrls(value: unknown) {
  expect(Array.isArray(value)).toBe(true);
  return (value as Array<{ url?: unknown }>).map((source, index) => {
    expect(typeof source.url, `sources[${index}].url`).toBe('string');
    return source.url as string;
  });
}

function hasLatestBlockSource(urls: string[]) {
  return urls.some((url) => {
    try {
      return new URL(url).pathname.endsWith('/base/tendermint/v1beta1/blocks/latest');
    } catch {
      return false;
    }
  });
}

function hasPinnedSource(urls: string[], suffix: string) {
  return urls.some((url) => {
    try {
      const parsed = new URL(url);
      return parsed.pathname.endsWith(suffix) && parsed.searchParams.has('height');
    } catch {
      return false;
    }
  });
}

async function fulfillJson(route: Route, value: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(value),
  });
}

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
  await page.route(/gateway\.liquify\.com\/chain\/thorchain_midgard\/v2\/history\/earnings.*/, async (route) => {
    await fulfillJson(route, {
      intervals: Array.from({ length: 8 }, (_, index) => earningsInterval(index)),
    });
  });
  await page.route(/gateway\.liquify\.com\/chain\/thorchain_midgard\/v2\/network$/, async (route) => {
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
  await page.route(/gateway\.liquify\.com\/chain\/thorchain_midgard\/v2\/health$/, async (route) => {
    await fulfillJson(route, {
      database: true,
      inSync: true,
      scannerHeight: 101,
      lastAggregated: { height: 100, timestamp: 1_704_153_600 },
      lastThorNode: { height: 101, timestamp: 1_704_153_605 },
    });
  });
}

const VISUAL_SAFETY_ROUTES: Array<{ path: string; heading: string | RegExp }> = [
  { path: '/', heading: /THORChain Wiki/i },
  { path: '/protocol', heading: /Protocol Overview/i },
  { path: '/network', heading: /Network & Security/i },
  { path: '/economics', heading: /Economics/i },
  { path: '/dynamic-fees', heading: /Dynamic L1 Fees/i },
  { path: '/ecosystem', heading: /Ecosystem/i },
  { path: '/governance', heading: /Governance & History/i },
  { path: '/stats', heading: /Network Statistics/i },
  { path: '/rune', heading: /RUNE/i },
  { path: '/tcy', heading: /TCY/i },
  { path: '/deep-dives', heading: 'Deep Dives' },
  { path: '/deep-dives/tss', heading: /Threshold Signatures/i },
  { path: '/docs', heading: 'Documentation' },
  { path: '/glossary', heading: /Glossary/i },
  { path: '/search', heading: /Search/i },
];

const ANCHOR_TARGETS: Array<{ href: string; selector: string }> = [
  { href: '/network#network-diagnostics', selector: '#network-diagnostics' },
  { href: '/stats#stats-look-here-first', selector: '#stats-look-here-first' },
  { href: '/dynamic-fees#dynamic-fees-live', selector: '#dynamic-fees-live' },
  { href: '/protocol#chain-sol', selector: '#chain-sol' },
  { href: '/ecosystem#interface-use-checklist', selector: '#interface-use-checklist' },
  { href: '/docs#current-protocol-state', selector: '#current-protocol-state' },
  { href: '/docs#developer-integration', selector: '#developer-integration' },
  { href: '/docs#third-party-interfaces-wallets', selector: '#third-party-interfaces-wallets' },
  { href: '/governance#current-recovery', selector: '#current-recovery' },
  { href: '/deep-dives#deep-dive-reader-paths', selector: '#deep-dive-reader-paths' },
  { href: '/deep-dives#deep-dive-path-network-security', selector: '#deep-dive-path-network-security' },
];

async function readLayoutSafety(page: Page) {
  return page.locator('body').evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pageWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const overflowing = Array.from(document.querySelectorAll('body *'))
      .flatMap((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.right <= viewportWidth + 2) {
          return [];
        }
        const id = element.id ? `#${element.id}` : '';
        const className = typeof element.className === 'string'
          ? `.${element.className.trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.')}`
          : '';
        return [`${element.tagName.toLowerCase()}${id}${className} right=${Math.round(rect.right)}`];
      })
      .slice(0, 5);

    return {
      hasFrameworkOverlay: /Application error|Unhandled Runtime Error|Hydration failed/i.test(document.body.textContent ?? ''),
      overflowing,
      pageWidth,
      viewportHeight,
      viewportWidth,
    };
  });
}

async function expectRouteVisualSafety(page: Page, path: string, heading: string | RegExp) {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('main')).toBeVisible();

  const routeHeading = page.getByRole('heading', { name: heading }).first();
  await expect(routeHeading).toBeVisible();

  const layout = await readLayoutSafety(page);

  expect(layout.hasFrameworkOverlay, `${path} must not render a framework error overlay`).toBe(false);
  expect(
    layout.pageWidth,
    `${path} horizontal overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toBeLessThanOrEqual(layout.viewportWidth + 2);

  const headingBox = await routeHeading.boundingBox();
  expect(headingBox, `${path} heading must be measurable`).not.toBeNull();
  expect(headingBox?.y ?? Number.POSITIVE_INFINITY, `${path} heading should be in the first viewport`).toBeLessThan(layout.viewportHeight);
}

async function expectAnchorTargetVisualSafety(page: Page, href: string, selector: string) {
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await expect(page.locator('main')).toBeVisible();

  const target = page.locator(selector);
  await expect(target).toBeVisible();

  const layout = await readLayoutSafety(page);
  expect(layout.hasFrameworkOverlay, `${href} must not render a framework error overlay`).toBe(false);
  expect(
    layout.pageWidth,
    `${href} horizontal overflow ${JSON.stringify({ viewportWidth: layout.viewportWidth, overflowing: layout.overflowing })}`
  ).toBeLessThanOrEqual(layout.viewportWidth + 2);

  const targetBox = await target.boundingBox();
  expect(targetBox, `${href} target must be measurable`).not.toBeNull();
  expect(targetBox?.y ?? -1, `${href} target should clear the fixed header`).toBeGreaterThanOrEqual(52);
  expect(targetBox?.y ?? Number.POSITIVE_INFINITY, `${href} target should land in the first viewport`).toBeLessThan(layout.viewportHeight);
}

test.describe('THORChain Wiki Smoke Tests', () => {
  test('top-level routes stay visually safe on desktop and mobile', async ({ page }) => {
    for (const route of VISUAL_SAFETY_ROUTES) {
      await expectRouteVisualSafety(page, route.path, route.heading);
    }
  });

  test('key decision anchors stay visually safe below the fixed header', async ({ page }) => {
    for (const target of ANCHOR_TARGETS) {
      await expectAnchorTargetVisualSafety(page, target.href, target.selector);
    }
  });

  test('home page loads and shows key sections', async ({ page, isMobile }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /THORChain Wiki/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Skip to content/i })).toHaveAttribute('href', '#main');
    await expect(page.getByText(/Community-maintained encyclopedia/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Check The Right Thing First/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Can I use THORChain now/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('link', { name: /Which number matters/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
    await expect(page.getByRole('link', { name: /Is ADR-026 relevant/i })).toHaveAttribute('href', '/dynamic-fees#dynamic-fees-live');
    await expect(page.getByRole('link', { name: /Which interface should I inspect/i })).toHaveAttribute('href', '/ecosystem#interface-use-checklist');
    await expect(page.getByRole('heading', { name: /Learn in Sequence/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Network Security/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-network-security');
    await expect(page.getByText(/Verify before claiming: Current signing/i)).toBeVisible();
    await expect(page.getByText(/live sources|checking live network status|source degraded/i).first()).toBeVisible();
    await expect(page.getByRole('status').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /THORChain Swap/i })).toHaveAttribute('href', '/ecosystem#ecosystem-thorchain-swap');
    if (!isMobile) {
      await page.getByRole('button', { name: /Guides/i }).click();
      const guides = page.getByRole('navigation', { name: /Guide links/i });
      await expect(guides.getByText(/Reader Paths/i)).toBeVisible();
      await expect(guides.getByText(/Common Tasks/i)).toBeVisible();
      await expect(guides.getByRole('link', { name: /New to THORChain/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
      await expect(guides.getByRole('link', { name: /Can I swap right now/i })).toHaveAttribute('href', '/network#network-diagnostics');
      await expect(guides.getByRole('link', { name: /Learning paths/i })).toHaveAttribute('href', '/deep-dives#deep-dive-reader-paths');
      await expect(guides.getByRole('link', { name: /Live metrics/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
      await expect(guides.getByRole('link', { name: /Build\/query/i })).toHaveAttribute('href', '/docs#developer-integration');
      await page.keyboard.press('Escape');
      await expect(page.locator('#desktop-guides-panel')).toHaveCount(0);
    }
  });

  test('stats page loads with data or graceful error state', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Midgard v2 Health/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    await expect(page.getByText(/Headline metrics/i)).toBeVisible();
    await expect(page.getByText(/Midgard health/i)).toBeVisible();
    await expect(page.getByText('Operations', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Related Checks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Source map/i })).toHaveAttribute('href', '/docs#current-protocol-state');
    await expect(page.getByRole('link', { name: /Build\/query path/i })).toHaveAttribute('href', '/search?q=Midgard%20API&filter=task');
    await expect(page.getByRole('heading', { name: /Earnings History/i })).toBeVisible();
    await expect(page.getByText(/Loading Midgard daily earnings intervals|Showing .* Midgard daily earnings intervals|Earnings history unavailable/i).first()).toBeVisible();
    await expect(page.getByText(/Liquidity depth signal/i)).toBeVisible();
    await expect(page.getByText(/Security-set signal/i)).toBeVisible();
    await expect(page.getByText(/Usable intervals/i)).toBeVisible();
    await expect(page.getByText(/not as durable revenue proof/i)).toBeVisible();
    await expect(page.getByText(/Current-only|Source warning|Source degraded|Degraded|Loading live source/i).first()).toBeVisible();
  });

  test('stats earnings history uses mobile cards for loaded intervals', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile cards are only rendered below the md breakpoint');

    await mockStatsMidgard(page);
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByText(/Showing 8 Midgard daily earnings intervals/i)).toBeVisible();
    await expect(page.getByText(/Latest 7 interval total/i)).toBeVisible();
    await expect(page.getByText(/7\/7 intervals with values/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Recent Daily Earnings Intervals/i })).toBeVisible();
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

  test('network status module has compact and diagnostic tiers', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }

    await page.goto('/');
    await expect(page.getByText(/Look here first/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Open diagnostics/i })).toHaveAttribute('href', '/network');
    await expect(page.getByText(/Operational evidence/i)).toHaveCount(0);

    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open diagnostics/i })).toHaveAttribute('href', '/network');

    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /Network & Security/i })).toBeVisible();
    await expect(page.getByText(/Look here first/i).first()).toBeVisible();
    await expect(page.getByText(/Priority Mimir controls/i)).toBeVisible();
    await expect(page.getByText(/Operational evidence|Source warnings and Mimir review queue/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Live-source failover/i })).toHaveAttribute('href', '/docs#runtime-live-data-failover');
    await expect(page.getByRole('link', { name: /Stats dashboard/i })).toHaveAttribute('href', '/stats#stats-look-here-first');

    const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? bodyWidth;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
  });

  test('dynamic fees page loads with live tracker or graceful degraded state', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        messages.push(message.text());
      }
    });

    await page.goto('/dynamic-fees');
    await expect(page.getByRole('heading', { name: /Dynamic L1 Fees/i })).toBeVisible();
    await expect(page.getByText(/ADR-026 replaces one global L1 minimum slip floor/i)).toBeVisible();
    await expect(page.getByText(/Current-only/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Experiment source map/i })).toHaveAttribute('href', '/docs#dynamic-fee-experiment');
    await expect(page.getByRole('link', { name: /Dynamic fee search/i })).toHaveAttribute('href', '/search?q=dynamic%20L1%20fee&filter=task');
    await expect(page.getByRole('heading', { name: /Historical Results/i })).toBeVisible();
    await expect(page.getByText(/Show controller configuration/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Interpretation Notes/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tracked Records' })).toBeVisible();
    await expect(page.getByText(/Show exact Mimir keys and endpoint fields/i)).toBeVisible();
    await expect(page.getByText(/How the Experiment Works/i)).toBeVisible();
    await expectAnyVisible(page.getByText(/No sealed dynamic-fee records are available|THOR\.RUNE|Source did not respond|dynamic fee sources/i));

    const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? bodyWidth;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
    expect(messages.join('\n')).not.toMatch(/Application error|Unhandled Runtime Error|hydration/i);
  });

  test('search page is functional', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Can I swap right now/i })).toHaveAttribute('href', '/network#network-diagnostics');
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
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();
    await expect(page.getByText(/result/i).first()).toBeVisible();
    await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);

    await page.goto('/search?q=current-only%20snapshots');
    await expect(page.locator('a[href="/docs#current-protocol-state"]').first()).toBeVisible();
    await expect(page.getByText(/Review due/i).first()).toBeVisible();
    await expect(page.getByText(/\+2 sources/i).first()).toBeVisible();

    await page.goto('/search?q=which%20source%20should%20i%20trust');
    const sourceChoiceResult = page.locator('main article').first().locator('a[href="/docs#source-map-chooser"]');
    await expect(sourceChoiceResult).toBeVisible();
    await expect(page.getByText(/Which source should I trust/i).first()).toBeVisible();
    await sourceChoiceResult.click();
    await expect(page).toHaveURL(/\/docs#source-map-chooser$/);
    await expect(page.locator('#source-map-chooser')).toBeVisible();
    await expect(page.getByText(/Something is available, paused, enabled, or healthy right now/i)).toBeVisible();
    await expect(page.getByText(/Static docs explain intended\/design behavior, not proof/i)).toBeVisible();
    await expect(page.getByText(/Community material is useful context/i)).toBeVisible();
    await page.locator('#source-map-chooser a[href="/docs#current-protocol-state"]').first().click();
    await expect(page).toHaveURL(/\/docs#current-protocol-state$/);
    await expect(page.locator('#current-protocol-state')).toBeVisible();
    await page.goto('/docs#source-map-chooser');
    await page.locator('#source-map-chooser a[href="/ecosystem#interface-use-checklist"]').first().click();
    await expect(page).toHaveURL(/\/ecosystem#interface-use-checklist$/);
    await expect(page.locator('#interface-use-checklist')).toBeVisible();

    await page.goto('/search?q=dynamic%20L1%20fee');
    await expect(page.getByRole('heading', { name: /Start Here/i })).toBeVisible();
    const dynamicFilterNav = page.getByRole('navigation', { name: /Filter search results/i });
    await expect(dynamicFilterNav.getByRole('link', { name: /Tasks/i })).toBeVisible();
    await expect(dynamicFilterNav.getByRole('link', { name: /Source Map/i })).toBeVisible();
    await expect(page.locator('main a[href="/dynamic-fees#dynamic-fees-live"]').first()).toBeVisible();
    await expect(page.locator('main article').first().locator('a[href="/dynamic-fees#dynamic-fees-live"]')).toBeVisible();
    await expect(page.getByText(/ADR-026 dynamic L1 fee/i).first()).toBeVisible();
    await dynamicFilterNav.getByRole('link', { name: /Source Map/i }).click();
    await expect(page).toHaveURL(/\/search\?q=dynamic(\+|%20)L1(\+|%20)fee&filter=source-map/);
    await expect(page.getByText(/of .* results/i).first()).toBeVisible();
    await expect(page.locator('main article').first().locator('span').filter({ hasText: /^source map$/ })).toBeVisible();

    await page.goto('/search?q=Midgard%20API');
    await expect(page.locator('main article').first().locator('a[href="/docs#developer-integration"]')).toBeVisible();
    await expect(page.getByText(/Build or query data/i).first()).toBeVisible();

    await page.goto('/search?q=can%20i%20swap%20right%20now');
    await expect(page.locator('main a[href="/network#network-diagnostics"]').first()).toBeVisible();
    await expect(page.locator('main article').first().locator('a[href="/network#network-diagnostics"]')).toBeVisible();
    await expect(page.getByText(/Can I swap right now/i).first()).toBeVisible();

    await page.goto('/search?q=wallet%20safety');
    await expect(page.locator('main article').first().locator('a[href="/ecosystem#interface-use-checklist"]')).toBeVisible();
    await expect(page.getByText(/Choose an interface/i).first()).toBeVisible();

    await page.goto('/search?q=network%20security%20path');
    await expect(page.locator('main a[href="/deep-dives#deep-dive-path-network-security"]').first()).toBeVisible();
    await expect(page.getByText(/Network Security/i).first()).toBeVisible();
  });

  test('search results link to exact record anchors with trust labels', async ({ page }) => {
    await page.goto('/search?q=GG20');
    const incidentLink = page.locator('a[href="/governance#incident-gg20-vault-exploit-2026"]').first();
    await expect(incidentLink).toBeVisible();
    await expect(incidentLink).toHaveAttribute('href', '/governance#incident-gg20-vault-exploit-2026');
    await expect(incidentLink.locator('span').filter({ hasText: /^incident$/ })).toBeVisible();
    await expect(incidentLink.getByText('Official source', { exact: true })).toBeVisible();
    const incidentResult = page.locator('main article').filter({ has: incidentLink }).first();
    await expect(incidentResult.getByRole('link', { name: 'THORChain Exploit Report #2' })).toBeVisible();
    await incidentResult.getByText('source details').click();
    await expect(incidentResult.getByText(/Retrieved 2026-07-04/i).first()).toBeVisible();
    await expect(incidentResult.getByText(/Official root-cause report for the May 2026 GG20\/TSS vault exploit/i)).toBeVisible();
    await page.goto('/governance#incident-gg20-vault-exploit-2026');
    await expect(page).toHaveURL(/\/governance#incident-gg20-vault-exploit-2026$/);
    await expect(page.locator('#incident-gg20-vault-exploit-2026')).toBeVisible();

    await page.goto('/search?q=reduced%20supply%20near%20425M');
    const tokenomicsLink = page.locator('a[href="/rune#tokenomics-rune-supply-framing"]').first();
    await expect(tokenomicsLink).toBeVisible();
    await expect(tokenomicsLink.locator('span').filter({ hasText: /^tokenomics$/ })).toBeVisible();
    await tokenomicsLink.click();
    await expect(page).toHaveURL(/\/rune#tokenomics-rune-supply-framing$/);
    await expect(page.locator('#tokenomics-rune-supply-framing')).toBeVisible();
  });

  test('ecosystem page avoids nested-anchor hydration errors', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        messages.push(message.text());
      }
    });

    await page.goto('/ecosystem');
    await expect(page.getByRole('heading', { name: /Ecosystem/i })).toBeVisible();
    await expect(page.getByText(/not an endorsement list/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Before Using An Interface/i })).toBeVisible();
    await expect(page.getByText(/Check live protocol state/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Open source map/i })).toHaveAttribute('href', '/docs#third-party-interfaces-wallets');
    await expect(page.getByText(/Verify third-party risk/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Open network diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('link', { name: /Open project/i }).first()).toBeVisible();
    await expect(page.getByText(/Use for/i).first()).toBeVisible();
    await expect(page.getByText(/Check before use/i).first()).toBeVisible();
    await expect(page.getByText(/Listed Active/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Live status/i }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByText(/wallet approvals/i)).toBeVisible();
    const ecosystemFilters = page.getByRole('group', { name: /Directory filters/i });
    await ecosystemFilters.getByLabel('Category').selectOption('Developer Tools');
    await expect(page.getByText(/SwapKit/i)).toBeVisible();
    await expect(page.getByText(/production readiness/i)).toBeVisible();
    await expect(page.getByText(/Showing 2 of/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Reset$/ })).toBeVisible();
    await expect(page.getByText('Category: Developer Tools')).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(ecosystemFilters.getByLabel('Category')).toHaveValue('all');
    await expect(page.getByText(/Showing 7 of/i)).toBeVisible();
    await ecosystemFilters.getByLabel('Category').selectOption('Explorer');
    await ecosystemFilters.getByLabel('Chain').selectOption('BTC');
    await expect(page.getByText(/No ecosystem entries match the current filters/i)).toBeVisible();
    await expect(page.getByText(/do not prove an interface is unavailable/i)).toBeVisible();
    await expect(page.getByText(/Showing 0 of 7/i)).toBeVisible();
    await expect(page.getByText('Category: Explorer')).toBeVisible();
    await expect(page.getByText('Chain: BTC')).toBeVisible();
    await page.getByRole('button', { name: /^Reset filters$/ }).click();
    await expect(ecosystemFilters.getByLabel('Category')).toHaveValue('all');
    await expect(ecosystemFilters.getByLabel('Chain')).toHaveValue('all');
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toBeVisible();
    await expect(page.getByText(/Showing 7 of/i)).toBeVisible();
    expect(messages.join('\n')).not.toMatch(/cannot contain a nested|hydration/i);
  });

  test('network page uses explicit live-state labels', async ({ page }) => {
    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /Network & Security/i })).toBeVisible();
    await expect(page.getByText(/Live check/i)).toHaveCount(0);
    await expect(page.getByText('Signing State', { exact: true })).toBeVisible();
    await expect(page.getByText('TCY Claims', { exact: true })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Use This Page For/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Related Checks/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pause search/i })).toHaveAttribute('href', '/search?q=Mimir%20halt&filter=task');
  });

  test('governance page shows incidents and milestones', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.getByRole('heading', { name: /Governance & History/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Current Incident & Recovery Tracker/i })).toBeVisible();
    await expect(page.locator('#current-recovery').getByRole('heading', { name: /ADR-028 Recovery Path/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Security Incidents/i })).toBeVisible();
  });

  test('deep dives index and article pages load', async ({ page }) => {
    await page.goto('/deep-dives');
    await expect(page.getByRole('heading', { name: 'Deep Dives', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Reader Paths/i })).toBeVisible();
    await expect(page.locator('#deep-dive-path-new-to-thorchain')).toBeVisible();
    await expect(page.getByRole('link', { name: /Stats decision panel/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
    await expect(page.getByText(/Verify Before Claiming/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /All Deep Dives/i })).toBeVisible();
    const saversCard = page.locator('a[href="/deep-dives/savers"]').filter({ hasText: /Historical overview/i }).first();
    await expect(saversCard.locator('span').filter({ hasText: /^Historical$/ })).toBeVisible();
    const tssCard = page.locator('a[href="/deep-dives/tss"]').filter({ hasText: /How distributed signing/i }).last();
    await expect(tssCard).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/deep-dives\/tss$/),
      tssCard.click(),
    ]);
    await expect(page.getByRole('heading', { name: /The Problem with Traditional Multisig/i })).toBeVisible();
    const deepDivesNavLink = page.locator('nav[aria-label="Primary navigation"] a[href="/deep-dives"]');
    await expect(deepDivesNavLink).toHaveAttribute('aria-current', 'page');
    await expect(deepDivesNavLink).toHaveClass(/text-accent/);
    await expect(page.getByText('Curated', { exact: true }).first()).toBeVisible();

    await expect(page.getByText('THORChain Docs', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('+4 sources', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('navigation', { name: /Table of contents/i })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Glossary' })).toBeVisible();
    const articlePaths = page.locator('section[aria-labelledby="article-reader-paths"]');
    await expect(articlePaths.getByRole('heading', { name: /Reader Paths For This Article/i })).toBeVisible();
    await expect(articlePaths.getByRole('link', { name: 'Network Security' })).toHaveAttribute('href', '/deep-dives#deep-dive-path-network-security');
    await expect(articlePaths.getByText(/Current signing, observation, trading/i)).toBeVisible();
    await expect(articlePaths.getByRole('link', { name: 'Network diagnostics' }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByText(/Related Reading/i)).toBeVisible();
  });

  test('docs source map and glossary routes load', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What Are You Trying To Prove/i })).toBeVisible();
    await expect(page.locator('#source-map-chooser')).toBeVisible();
    await expect(page.getByText(/Do not claim: Durable uptime, safety, or future availability/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Network diagnostics' }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('link', { name: 'Interface checklist' }).first()).toHaveAttribute('href', '/ecosystem#interface-use-checklist');
    await expect(page.getByRole('heading', { name: /Current Protocol State/i })).toBeVisible();
    await expect(page.locator('#runtime-live-data-failover')).toBeVisible();
    await expect(page.locator('#current-protocol-state').getByText(/current-only snapshots/i)).toBeVisible();
    await expect(page.getByText(/Use For Claims/i).first()).toBeVisible();
    await expect(page.getByText(/Do Not Use Alone To Claim/i).first()).toBeVisible();

    await page.goto('/glossary');
    await expect(page.getByRole('heading', { name: /Glossary/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Term Finder/i })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: /Filter glossary terms/i })).toBeVisible();
    await expect(page.locator('#term-mimir')).toBeVisible();
    await expect(page.getByText(/Operational parameter storage/i)).toBeVisible();
    await expect(page.locator('#term-dynamic-l1-fee')).toBeVisible();
    await expect(page.locator('#term-inbound-address')).toBeVisible();
    await expect(page.getByRole('link', { name: /Dynamic-fee live tracker/i }).first()).toHaveAttribute('href', '/dynamic-fees#dynamic-fees-live');
    await expect(page.getByRole('link', { name: /Current Protocol State/i }).first()).toHaveAttribute('href', '/docs#current-protocol-state');
    await expect(page.getByRole('link', { name: /Network diagnostics/i }).first()).toHaveAttribute('href', '/network#network-diagnostics');

    await page.getByRole('searchbox', { name: /Filter glossary terms/i }).fill('gg20');
    await expect(page.locator('#term-gg20')).toBeVisible();
    await expect(page.locator('#term-mimir')).toHaveCount(0);
    await page.getByRole('button', { name: /Reset/i }).click();
    await expect(page.locator('#term-mimir')).toBeVisible();
    await page.getByRole('button', { name: /Developer/i }).click();
    await expect(page.getByText(/Showing 3 of/i)).toBeVisible();
    await expect(page.locator('#term-cosmwasm')).toBeVisible();
    await expect(page.locator('#term-gg20')).toHaveCount(0);
  });

  test('all deep-dive routes load', async ({ page }) => {
    const routes = [
      ['clp', /Continuous Liquidity Pools/i],
      ['incentive-pendulum', /The Incentive Pendulum/i],
      ['tss', /Threshold Signatures/i],
      ['churning', /Churning and Node Lifecycle/i],
      ['slashing', /Slashing and Economic Security/i],
      ['bifrost', /Bifrost Bridge/i],
      ['app-layer', /App Layer, CosmWasm, and Secured Assets/i],
      ['rune-settlement', /RUNE as the Universal Settlement Asset/i],
      ['savers', /Savers and Lending/i],
    ] as const;

    for (const [slug, heading] of routes) {
      await page.goto(`/deep-dives/${slug}`);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('protocol page renders key content', async ({ page }) => {
    await page.goto('/protocol');
    await expect(page.getByRole('heading', { name: /Protocol Overview/i })).toBeVisible();
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    await expect(page.getByText(/Threshold Signature Schemes/i)).toBeVisible();
    await expect(page.locator('#chain-sol')).toBeVisible();
    await expect(page.locator('#chain-sol').getByText(/EdDSA/i)).toBeVisible();
  });

  test('static education routes expose route source posture', async ({ page }) => {
    const routes: Array<{ path: string; expected?: RegExp }> = [
      { path: '/economics' },
      { path: '/rune' },
      { path: '/tcy', expected: /Historical/i },
      { path: '/ecosystem' },
      { path: '/governance', expected: /\+4 sources/i },
      { path: '/docs' },
      { path: '/deep-dives' },
      { path: '/glossary' },
    ];

    for (const { path, expected } of routes) {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
      await expect(page.getByText(/Use This Page For/i)).toBeVisible();
      await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
      if (expected) {
        await expect(page.getByText(expected).first()).toBeVisible();
      }
    }
  });

  test('static concept pages expose next-step checks', async ({ page }) => {
    const routes = [
      {
        path: '/protocol',
        link: /New to THORChain/i,
        href: '/deep-dives#deep-dive-path-new-to-thorchain',
        evidence: /Network diagnostics/i,
      },
      {
        path: '/economics',
        link: /Swap Economics/i,
        href: '/deep-dives#deep-dive-path-swap-economics',
        evidence: /Dynamic fee tracker/i,
      },
      {
        path: '/rune',
        link: /RUNE settlement deep dive/i,
        href: '/deep-dives/rune-settlement',
        evidence: /Official source map/i,
      },
      {
        path: '/tcy',
        link: /Historical Recovery/i,
        href: '/deep-dives#deep-dive-path-historical-recovery',
        evidence: /Recovery tracker/i,
      },
      {
        path: '/governance',
        link: /Mimir halt search/i,
        href: '/search?q=Mimir%20halt&filter=task',
        evidence: /Network diagnostics/i,
      },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.getByRole('heading', { name: /Continue From Here/i })).toBeVisible();
      await expect(page.getByText('claim path', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: route.link })).toHaveAttribute('href', route.href);
      await expect(page.getByText(route.evidence).first()).toBeVisible();
    }
  });

  test('health API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.runtime).toBeTruthy();
    expect(typeof json.runtime.verified).toBe('boolean');
  });

  test('version API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/version');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.version).toBeTruthy();
    expect(json.runtime).toBeTruthy();
    expect(json.runtime.version).toBe(json.version);
  });

  test('readiness API endpoint responds with readiness metadata', async ({ request }) => {
    test.setTimeout(60_000);
    const response = await request.get('/api/ready', { timeout: 45_000 });
    expect([200, 503]).toContain(response.status());
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(['ready', 'degraded']).toContain(json.status);
    expect(json.version).toBeTruthy();
    expect(json.runtime).toBeTruthy();
    expect(typeof json.runtime.strict).toBe('boolean');
    expectStringArray(json.reasons);
    expectStringArray(json.warnings);
    expect(json.sources.midgard).toBeTruthy();
    expect(json.sources.thornode).toBeTruthy();
    expectStringArray(json.sources.midgard.healthWarnings);
    expectStringArray(json.sources.midgard.sourceWarnings);
    expectWarningDetails(json.sources.midgard.sourceWarningDetails);
    expectStringArray(json.sources.thornode.sourceWarnings);
    expectWarningDetails(json.sources.thornode.sourceWarningDetails);
    expect(json.sources.thornode.dynamicFees).toBeTruthy();
    expect(['ok', 'degraded']).toContain(json.sources.thornode.dynamicFees.status);
    expectStringArray(json.sources.thornode.dynamicFees.sourceWarnings);
    expectWarningDetails(json.sources.thornode.dynamicFees.sourceWarningDetails);
    if (json.sources.thornode.status === 'ok') {
      const urls = sourceUrls(json.sources.thornode.sources);
      expect(hasLatestBlockSource(urls)).toBe(true);
      expect(hasPinnedSource(urls, '/mimir')).toBe(true);
      expect(hasPinnedSource(urls, '/inbound_addresses')).toBe(true);
      expect(hasPinnedSource(urls, '/version')).toBe(true);
      expect(hasPinnedSource(urls, '/lastblock')).toBe(true);
    }
    if (json.sources.thornode.dynamicFees.status === 'ok') {
      const urls = sourceUrls(json.sources.thornode.dynamicFees.sources);
      expect(hasLatestBlockSource(urls)).toBe(true);
      expect(hasPinnedSource(urls, '/mimir')).toBe(true);
      expect(hasPinnedSource(urls, '/dynamic_l1_fees')).toBe(true);
      expect(hasPinnedSource(urls, '/dynamic_l1_fees_current')).toBe(true);
    }
  });

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-powered-by']).toBeUndefined();
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expectPermissionsPolicy(response.headers());
    expectStrictCsp(response.headers());
  });

  test('normal page loads do not emit CSP reports', async ({ page }) => {
    const reports: string[] = [];
    await page.route('**/api/csp-report', async (route) => {
      reports.push(route.request().postData() ?? '<empty report body>');
      await route.fulfill({ status: 204, body: '' });
    });

    for (const path of ['/', '/search', '/stats', '/network', '/dynamic-fees', '/deep-dives/tss']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(500);
    }

    expect(reports).toEqual([]);
  });

  test('share image routes render', async ({ request }) => {
    const openGraph = await request.get('/opengraph-image');
    const twitter = await request.get('/twitter-image');

    expect(openGraph.ok()).toBeTruthy();
    expect(openGraph.headers()['content-type']).toContain('image/png');
    expect(twitter.ok()).toBeTruthy();
    expect(twitter.headers()['content-type']).toContain('image/png');
  });

  test('robots and sitemap expose canonical public wiki routes', async ({ request }) => {
    const robotsResponse = await request.get('/robots.txt');
    const sitemapResponse = await request.get('/sitemap.xml');

    expect(robotsResponse.ok()).toBeTruthy();
    expect(sitemapResponse.ok()).toBeTruthy();

    const robotsText = await robotsResponse.text();
    const sitemapText = await sitemapResponse.text();

    expect(robotsText).toContain('Allow: /');
    expect(robotsText).toContain('Disallow: /api/');
    expect(robotsText).toContain('Disallow: /search?*');
    expect(robotsText).toContain('Sitemap: https://wiki.thorchain.no/sitemap.xml');

    for (const url of [
      'https://wiki.thorchain.no',
      'https://wiki.thorchain.no/search',
      'https://wiki.thorchain.no/network',
      'https://wiki.thorchain.no/dynamic-fees',
      'https://wiki.thorchain.no/deep-dives/tss',
    ]) {
      expect(sitemapText).toContain(`<loc>${url}</loc>`);
    }

    expect(sitemapText).not.toContain('/api/');
    expect(sitemapText).not.toContain('/opengraph-image');
    expect(sitemapText).not.toContain('/twitter-image');
  });

  test('top-level and deep-dive routes expose route-specific metadata', async ({ page }) => {
    const cases = [
      {
        path: '/',
        title: 'THORChain Wiki | Source-Backed Protocol Encyclopedia',
        description: 'Community-maintained THORChain protocol encyclopedia with curated context, source-backed history, and current-only Midgard and THORNode live status.',
        canonical: 'https://wiki.thorchain.no',
      },
      {
        path: '/network',
        title: 'Network | THORChain Wiki',
        description: 'Node lifecycle, churning, slashing, vault security, and live operational state.',
        canonical: 'https://wiki.thorchain.no/network',
      },
      {
        path: '/stats',
        title: 'Statistics | THORChain Wiki',
        description: 'Current-only Midgard metrics and THORNode operational status.',
        canonical: 'https://wiki.thorchain.no/stats',
      },
      {
        path: '/dynamic-fees',
        title: 'Dynamic L1 Fees | THORChain Wiki',
        description: 'Current-only tracker and source-backed explainer for THORChain ADR-026 dynamic L1 minimum fee floors by thorname and pair.',
        canonical: 'https://wiki.thorchain.no/dynamic-fees',
      },
      {
        path: '/search',
        title: 'Search | THORChain Wiki',
        description: 'Search source-backed THORChain wiki sections, deep dives, glossary terms, incidents, ecosystem entries, governance records, and research.',
        canonical: 'https://wiki.thorchain.no/search',
      },
      {
        path: '/deep-dives/tss',
        title: 'Threshold Signatures (TSS) | THORChain Wiki',
        description: 'How distributed signing protects cross-chain vault keys and why GG20, DKLS, Paillier, and key-sign failure wording must be source-backed.',
        canonical: 'https://wiki.thorchain.no/deep-dives/tss',
      },
    ] as const;

    for (const { path, title, description, canonical } of cases) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);

      const headMetadata = await page.locator('head').evaluate((head) => ({
        alternates: Array.from(head.querySelectorAll('link[rel="alternate"]')).map((element) => ({
          href: element.getAttribute('href'),
          hrefLang: element.getAttribute('hreflang'),
        })),
        canonical: Array.from(head.querySelectorAll('link[rel="canonical"]')).map((element) => element.getAttribute('href')),
        description: Array.from(head.querySelectorAll('meta[name="description"]')).map((element) => element.getAttribute('content')),
        openGraphDescription: Array.from(head.querySelectorAll('meta[property="og:description"]')).map((element) => element.getAttribute('content')),
        openGraphTitle: Array.from(head.querySelectorAll('meta[property="og:title"]')).map((element) => element.getAttribute('content')),
        twitterDescription: Array.from(head.querySelectorAll('meta[name="twitter:description"]')).map((element) => element.getAttribute('content')),
        twitterSite: Array.from(head.querySelectorAll('meta[name="twitter:site"]')).map((element) => element.getAttribute('content')),
        twitterTitle: Array.from(head.querySelectorAll('meta[name="twitter:title"]')).map((element) => element.getAttribute('content')),
      }));

      expect(headMetadata).toEqual({
        alternates: [],
        canonical: [canonical],
        description: [description],
        openGraphDescription: [description],
        openGraphTitle: [title],
        twitterDescription: [description],
        twitterSite: [],
        twitterTitle: [title],
      });
    }
  });

  test('mobile navigation and search controls are accessible', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only smoke');
    await page.setViewportSize({ width: 375, height: 320 });
    await page.goto('/');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.locator('#mobile-navigation').getByText('Sections', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Reader Paths', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Common Tasks', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Deep Dives' })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Start here' })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Learning paths' })).toHaveAttribute('href', '/deep-dives#deep-dive-reader-paths');
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'New to THORChain' })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
    await expect(page.locator('#mobile-navigation')).toHaveCSS('overflow-y', 'auto');
    const navBox = await page.locator('#mobile-navigation').boundingBox();
    expect(navBox?.height ?? 0).toBeLessThanOrEqual(268);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await page.getByRole('button', { name: /open search/i }).click();
    await expect(page.locator('#mobile-navigation')).toHaveCount(0);
    const siteSearch = page.getByRole('search', { name: /Site search/i });
    await expect(siteSearch.getByLabel(/Search the wiki/i)).toBeVisible();
    await expect(siteSearch.getByRole('button', { name: /Submit site search/i })).toBeVisible();
    await expect(siteSearch.getByRole('link', { name: /Build or query data/i })).toBeVisible();
    await expect(siteSearch.getByRole('link', { name: /Choose an interface/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel(/Search the wiki/i)).toHaveCount(0);
  });

  test('global header search opens from keyboard and submits reader-job queries', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+K');
    const siteSearch = page.getByRole('search', { name: /Site search/i });
    const searchInput = siteSearch.getByLabel(/Search the wiki/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expect(siteSearch.getByRole('link', { name: /New to THORChain/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
    await expect(siteSearch.getByRole('link', { name: /Why did my swap refund/i })).toHaveAttribute('href', '/deep-dives/clp#swap-lifecycle-and-refunds');

    await searchInput.fill('why did my swap refund');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=why(%20|\+)did(%20|\+)my(%20|\+)swap(%20|\+)refund/);
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/clp#swap-lifecycle-and-refunds"]')).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: /Open search/i }).click();
    await expect(siteSearch.getByRole('link', { name: /Which source should I trust/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel(/Search the wiki/i)).toHaveCount(0);
  });
});
