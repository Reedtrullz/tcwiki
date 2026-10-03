import { test, expect, type Page } from '@playwright/test';
import axe from 'axe-core';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';

const ACCESSIBILITY_ROUTES = [
  '/',
  '/protocol',
  '/network',
  '/economics',
  '/dynamic-fees',
  '/governance',
  '/stats',
  '/search',
];

async function runColorContrastAudit(page: Page) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runner = (window as unknown as {
      axe: { run: (context: Document, options: { runOnly: { type: 'rule'; values: string[] } }) => Promise<unknown> };
    }).axe;
    return runner.run(document, { runOnly: { type: 'rule', values: ['color-contrast'] } });
  });
}

test.describe('Wiki accessibility smoke tests', () => {
  test('common routes have no color-contrast violations', async ({ page }) => {
    test.slow();
    const failures: Array<{ route: string; violations: unknown }> = [];

    for (const route of ACCESSIBILITY_ROUTES) {
      if (route === '/network') await mockSwapperFirstNetwork(page);
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(250);
      const result = await runColorContrastAudit(page);
      const violations = (result as { violations: unknown[] }).violations;
      if (violations.length > 0) {
        failures.push({ route, violations });
      }
    }

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });

  test('expanded mobile navigation keeps text readable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.waitForTimeout(150);
    const result = await runColorContrastAudit(page);
    const violations = (result as { violations: unknown[] }).violations;
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});

async function mockAccessibleLoadedState(page: Page) {
  await mockSwapperFirstNetwork(page);
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/network$/, route => fulfillJson(route, {
    totalPooledRune: '100000000000', totalReserve: '200000000000', activeNodeCount: 100, standbyNodeCount: 20,
    bondingAPY: '0.10', liquidityAPY: '0.05', nextChurnHeight: 123, bondMetrics: {},
  }));
  await page.route(/(?:gateway\.liquify\.com\/chain\/thorchain_midgard|midgard\.thorchain\.network)\/v2\/health$/, route => fulfillJson(route, {
    database: true, inSync: true, scannerHeight: 100,
    lastAggregated: { height: 100, timestamp: Math.floor(Date.now() / 1000) },
    lastThorNode: { height: 100, timestamp: Math.floor(Date.now() / 1000) },
  }));
}

async function auditLoadedState(page: Page) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const runner = (window as unknown as { axe: typeof import('axe-core') }).axe;
    const result = await runner.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return result.violations.map(violation => ({ rule: violation.id, impact: violation.impact, help: violation.help, helpUrl: violation.helpUrl,
      nodes: violation.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) }));
  });
}

for (const state of ['loaded', 'degraded'] as const) {
  test(`WCAG rules cover deterministic ${state} dashboards, search and deep-dive tables`, async ({ page }) => {
    test.slow();
    await mockAccessibleLoadedState(page);
    let browserRequestsFail = false;
    if (state === 'degraded') {
      await page.route(/\/v2\/pools\?/, route => browserRequestsFail
        ? route.fulfill({ status: 503, body: 'Accessibility fixture browser failure' })
        : route.fallback());
      await page.route(/\/thorchain\/inbound_addresses(?:\?.*)?$/, route => browserRequestsFail
        ? route.fulfill({ status: 503, body: 'Accessibility fixture browser failure' })
        : route.fallback());
    }
    const failures = [];
    for (const route of ['/network', '/stats', '/search?q=quote+expiry', '/deep-dives/build-query-data']) {
      await page.goto(route);
      if (route === '/network') {
        if (state === 'loaded') await expect(page.locator('#check-a-route').getByLabel('From asset')).toBeEnabled({ timeout: 15_000 });
        else {
          await expect(page.locator('#check-a-route').getByLabel('From asset')).toBeEnabled({ timeout: 15_000 });
          browserRequestsFail = true;
          await page.getByRole('button', { name: /Refresh .* data/i }).first().click();
          await expect(page.getByText('Browser refresh failed; retained operation values are dated context until a new read succeeds.', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
          await expect(page.getByText(/^Checked /).first()).toBeVisible();
        }
      }
      if (route === '/stats') {
        if (state === 'loaded') await expect(page.locator('#available-pools').getByLabel('Pool sort')).toBeEnabled({ timeout: 15_000 });
        else await expect(page.getByText(/Midgard available-pool rows unavailable from live sources/i)).toBeVisible({ timeout: 15_000 });
      }
      const violations = await auditLoadedState(page);
      if (violations.length) failures.push({ route, state, violations });
    }
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  });
}

test('keyboard users can enter and leave search, disclosures and the route checker', async ({ page }) => {
  await mockAccessibleLoadedState(page);
  await page.goto('/network?from_asset=BTC.BTC&to_asset=ETH.ETH&amount=0.01#check-a-route');
  const quote = page.locator('#check-a-route');
  const amount = quote.getByLabel('Amount', { exact: true });
  await expect(quote.getByRole('button', { name: 'Check route', exact: true })).toBeEnabled({ timeout: 15_000 });
  await amount.focus();
  await amount.press('ControlOrMeta+A');
  await page.keyboard.insertText('0.015');
  await amount.press('Tab');
  const submit = quote.getByRole('button', { name: 'Check route', exact: true });
  await expect(submit).toBeFocused();
  await submit.press('Enter');
  await expect(quote.getByText('Quote returned', { exact: true })).toBeVisible({ timeout: 15_000 });
  await submit.press('Tab');
  await expect(submit).not.toBeFocused();
  const searchButton = page.getByRole('button', { name: 'Open search', exact: true });
  await searchButton.focus();
  await searchButton.press('Enter');
  const search = page.getByRole('search', { name: 'Site search' }).getByLabel('Search the wiki');
  await expect(search).toBeFocused();
  await search.press('Escape');
  await expect(searchButton).toBeFocused();
  await searchButton.press('Enter');
  await expect(search).toBeEnabled();
  await search.pressSequentially('quote expiry');
  await search.press('Enter');
  await expect(page).toHaveURL(/q=quote(%20|\+)expiry/);
  await expect(page.locator('main').getByRole('textbox', { name: 'Search the wiki', exact: true })).toHaveValue('quote expiry');
  const trigger = page.getByRole('button', { name: 'Open navigation menu', exact: true });
  if (await trigger.isVisible()) {
    await trigger.focus(); await trigger.press('Enter');
    await expect(page.locator('#mobile-navigation')).toBeVisible();
    await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
    await expect(page.locator('#mobile-navigation')).toBeHidden();
  } else {
    const tools = page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('button', { name: 'Tools', exact: true });
    await tools.focus(); await tools.press('Enter');
    await expect(page.locator('#nav-panel-tools')).toBeVisible();
    await tools.press('Escape'); await expect(tools).toBeFocused();
    await expect(page.locator('#nav-panel-tools')).toBeHidden();
  }
});

for (const width of [640, 320]) {
  test(`loaded dashboards reflow at a ${width}px CSS viewport with reduced motion`, async ({ page }) => {
    await mockAccessibleLoadedState(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width, height: 800 });
    for (const route of ['/stats', '/network', '/deep-dives/build-query-data']) {
      await page.goto(route);
      if (route === '/stats') await expect(page.locator('#available-pools').getByLabel('Pool sort')).toBeEnabled({ timeout: 15_000 });
      if (route === '/network') await expect(page.locator('#check-a-route').getByLabel('Amount')).toBeEnabled({ timeout: 15_000 });
      const layout = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
      expect(layout.width, `${route} should reflow; tables may scroll within their container`).toBeLessThanOrEqual(layout.viewport + 2);
      const transitions = await page.locator('button').evaluateAll(buttons => buttons.filter(button => {
        const rect = button.getBoundingClientRect(); return rect.width > 0 && rect.height > 0;
      }).map(button => getComputedStyle(button).transitionDuration));
      expect(transitions.every(value => value.split(',').every(duration => Number.parseFloat(duration) === 0))).toBe(true);
    }
  });
}

test('loaded operation tables can be scrolled from the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop table; the mobile view uses cards');
  await mockAccessibleLoadedState(page);
  await page.setViewportSize({ width: 900, height: 800 });
  await page.goto('/network');
  const table = page.getByRole('region', { name: 'Per-chain operation table', exact: true });
  await expect(table).toBeVisible({ timeout: 15_000 });
  await table.focus();
  await expect(table).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await expect(table).not.toBeFocused();
});


test('operation announcements change once for a meaningful update and stay quiet on identical refreshes', async ({ page }) => {
  await page.clock.install({ time: Date.now() });
  const mimir = { BURNSYNTHS: undefined, HALTETHTRADING: 0 };
  await mockSwapperFirstNetwork(page, { mimir });
  let reads = 0;
  page.on('request', request => { if (request.url().includes('/thorchain/mimir')) reads += 1; });
  await page.goto('/network');
  await expect(page.locator('#check-a-route').getByLabel('Amount')).toBeEnabled({ timeout: 15_000 });
  await expect(page.getByText('BSC and SOL are swap-limited.', { exact: true })).toBeVisible();
  const announcement = page.getByRole('status').filter({ has: page.getByRole('heading', { level: 2 }) }).first();
  await expect(announcement).toBeVisible();
  await announcement.evaluate(element => {
    const state = window as unknown as { operationAnnouncements: string[] };
    state.operationAnnouncements = [];
    let previous = element.textContent;
    new MutationObserver(() => {
      const next = element.textContent;
      if (next !== previous) { state.operationAnnouncements.push(next ?? ''); previous = next; }
    }).observe(element, { subtree: true, childList: true, characterData: true });
  });
  const refresh = page.getByRole('button', { name: /Refresh .*THORNode.* data/i }).first();
  const before = reads;
  await page.clock.fastForward(1100);
  await refresh.click();
  await expect.poll(() => reads).toBeGreaterThan(before);
  await expect(refresh).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { operationAnnouncements: string[] }).operationAnnouncements)).toEqual([]);
  mimir.HALTETHTRADING = 1;
  await page.clock.fastForward(1100);
  await refresh.click();
  await expect(announcement).toContainText('ETH');
  await expect.poll(() => page.evaluate(() => (window as unknown as { operationAnnouncements: string[] }).operationAnnouncements.length)).toBe(1);
  const changedReads = reads;
  await page.clock.fastForward(1100);
  await refresh.click();
  await expect.poll(() => reads).toBeGreaterThan(changedReads);
  await expect(refresh).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { operationAnnouncements: string[] }).operationAnnouncements.length)).toBe(1);
});
