import { test, expect } from '@playwright/test';
import { publicSitemapRoutes } from '../src/lib/sitemap';
import { routeUrl } from '../src/lib/site';

let assertReadinessContract: (json: unknown) => void;

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

test.describe('THORChain Wiki Runtime Smoke Tests', () => {
  test.beforeAll(async () => {
    const readinessContract = await import('../scripts/lib/readiness-contract.mjs') as {
      assertReadinessContract: (json: unknown) => void;
    };
    assertReadinessContract = readinessContract.assertReadinessContract;
  });

  test('health API endpoint responds @docker-smoke', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.runtime).toBeTruthy();
    expect(typeof json.runtime.verified).toBe('boolean');
  });

  test('version API endpoint responds @docker-smoke', async ({ request }) => {
    const response = await request.get('/api/version');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.version).toBeTruthy();
    expect(json.runtime).toBeTruthy();
    expect(json.runtime.version).toBe(json.version);
  });

  test('readiness API endpoint responds with readiness metadata @docker-smoke', async ({ request }) => {
    test.setTimeout(60_000);
    const response = await request.get('/api/ready', { timeout: 45_000 });
    expect([200, 503]).toContain(response.status());
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    assertReadinessContract(json);
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
    expect(json.sources.thornode.runePoolPol).toBeTruthy();
    expect(['ok', 'degraded']).toContain(json.sources.thornode.runePoolPol.status);
    expectStringArray(json.sources.thornode.runePoolPol.sourceWarnings);
    expectWarningDetails(json.sources.thornode.runePoolPol.sourceWarningDetails);
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
    if (json.sources.thornode.runePoolPol.status === 'ok') {
      const urls = sourceUrls(json.sources.thornode.runePoolPol.sources);
      expect(hasLatestBlockSource(urls)).toBe(true);
      expect(hasPinnedSource(urls, '/mimir')).toBe(true);
      expect(hasPinnedSource(urls, '/runepool')).toBe(true);
    }
  });

  test('security headers are present @docker-smoke', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-powered-by']).toBeUndefined();
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expectPermissionsPolicy(response.headers());
    expectStrictCsp(response.headers());
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

    for (const route of publicSitemapRoutes()) {
      expect(sitemapText).toContain(`<loc>${routeUrl(route.path)}</loc>`);
    }

    expect(sitemapText).not.toContain('/api/');
    expect(sitemapText).not.toContain('/opengraph-image');
    expect(sitemapText).not.toContain('/twitter-image');
  });
});
