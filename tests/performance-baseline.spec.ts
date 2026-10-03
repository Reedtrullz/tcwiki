import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { cpus, platform, release, totalmem } from 'node:os';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { fulfillJson, mockSwapperFirstNetwork } from './helpers/thornode-mocks';
import { assertReadinessContract } from '../scripts/lib/readiness-contract.mjs';

const sizes = (body: Buffer) => ({ decodedBytes: body.length, modeledGzipBytes: gzipSync(body).length, modeledBrotliBytes: brotliCompressSync(body).length });

test('bounded local candidate performance baseline', async ({ browser, request }, testInfo) => {
  test.skip(process.env.WIKI_PERF_REPORT !== '1', 'explicit local measurement; no hardware-dependent CI thresholds');
  test.setTimeout(180_000);
  const runtime = process.env.PLAYWRIGHT_RUNTIME === 'cloudflare' ? 'cloudflare' : 'next';
  const receiptBytes = readFileSync(runtime === 'cloudflare' ? '.artifacts/cloudflare-manifest.json' : '.next/standalone/.tcwiki-inputs.json');
  const version = await (await request.get('/api/version')).json();
  const reports = [];
  const queries = ['quote expiry', 'HALTTCYTRADING', 'BTC.BTC'];
  for (const route of ['/', '/search', '/stats']) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await mockSwapperFirstNetwork(page);
    await page.route(/\/v2\/network$/, route => fulfillJson(route, { totalPooledRune: '100000000000', totalReserve: '200000000000', activeNodeCount: 100, standbyNodeCount: 20, bondingAPY: '0.1', liquidityAPY: '0.05', nextChurnHeight: 123, bondMetrics: {} }));
    await page.route(/\/v2\/health$/, route => fulfillJson(route, { database: true, inSync: true, scannerHeight: 100, lastAggregated: { height: 100, timestamp: Math.floor(Date.now() / 1000) }, lastThorNode: { height: 100, timestamp: Math.floor(Date.now() / 1000) } }));
    const assets: Array<{ path: string; body: Buffer }> = [];
    const pending: Promise<void>[] = [];
    const seen = new Set<string>();
    page.on('response', response => {
      if (!['script', 'stylesheet'].includes(response.request().resourceType()) || !response.url().includes('/_next/static/') || seen.has(response.url())) return;
      seen.add(response.url());
      pending.push(response.body().then(body => {
        expect(body.length, 'per-asset measurement bound').toBeLessThanOrEqual(2 * 1024 * 1024);
        assets.push({ path: new URL(response.url()).pathname, body });
      }));
    });
    const started = performance.now();
    const response = await page.goto(new URL(route, testInfo.project.use.baseURL).href);
    expect(response).not.toBeNull();
    expect(response?.headers()['content-security-policy']).toContain("'nonce-");
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible();
    const loadToHeadingMs = performance.now() - started;
    const interactions = [];
    if (route === '/search') {
      const form = page.getByRole('search', { name: 'Search wiki content' });
      const input = form.getByLabel('Search the wiki', { exact: true });
      await expect(input).toBeEnabled();
      for (const query of queries) {
        const start = performance.now();
        await input.fill(query); await input.press('Enter');
        await expect(page).toHaveURL(new RegExp('q=' + encodeURIComponent(query).replace('%20', '(?:%20|\\+)')));
        await expect(page.getByTestId('search-results-list').locator('article').first()).toBeVisible();
        interactions.push({ query, fillSubmitToResultsMs: performance.now() - start });
      }
    }
    if (route === '/stats') await expect(page.locator('#available-pools').getByLabel('Pool sort')).toBeEnabled({ timeout: 15_000 });
    await page.waitForTimeout(500); // bounded collection window after the relevant hydrated control
    await Promise.all(pending);
    const indexConstructionMs = await page.evaluate(() => performance.getEntriesByName('wiki-search-index-construction').map(entry => entry.duration));
    const html = await response!.body();
    expect(html.length).toBeLessThanOrEqual(2 * 1024 * 1024);
    reports.push({ route, loadToHeadingMs, html: sizes(html), assets: assets.map(({ path, body }) => ({ path, ...sizes(body) })).sort((a, b) => a.path.localeCompare(b.path)), indexConstructionMs, interactions });
    await context.close();
  }
  const mixed = [];
  for (const pass of ['initial', 'warm']) {
    const start = performance.now();
    const rows = await Promise.all(['/docs', '/protocol', '/docs', '/protocol', '/api/ready', '/api/ready', '/api/ready', '/api/ready'].map(async path => {
      const started = performance.now();
      const response = await request.get(path, { timeout: 30_000 });
      const body = await response.body();
      expect(body.length).toBeLessThanOrEqual(2 * 1024 * 1024);
      if (path === '/api/ready') assertReadinessContract(JSON.parse(body.toString()));
      else expect(response.headers()['content-security-policy']).toContain("'nonce-");
      return { path, status: response.status(), durationMs: performance.now() - started, bytes: body.length };
    }));
    mixed.push({ pass, concurrency: 8, elapsedMs: performance.now() - start, rows });
  }
  const report = { measuredAt: new Date().toISOString(), runtime, version, receiptSha256: createHash('sha256').update(receiptBytes).digest('hex'), device: { platform: platform(), release: release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryGiB: totalmem() / 1024 ** 3, browser: browser.version() }, conditions: { transport: 'loopback; no network or CPU throttling; fresh browser context and disabled HTTP cache per route', clientPayload: 'deterministic four available pools plus fixed public network/health/quote fixtures; missing analytics fields remain unavailable', compression: 'gzip/Brotli modeled from decoded response bodies; not negotiated wire size', collectionWindowMs: 500, mixedReadiness: 'live server-side upstream reads; initial cache state is not assumed cold', concurrentOtherWork: 'record in accompanying review; local timings do not establish production DO serialization or Core Web Vitals' }, reports, mixed };
  await testInfo.attach('performance-baseline.json', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log('WIKI_PERFORMANCE_BASELINE=' + JSON.stringify(report));
});
