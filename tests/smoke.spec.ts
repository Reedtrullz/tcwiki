import { test, expect } from '@playwright/test';

test.describe('THORChain Wiki Smoke Tests', () => {
  test('home page loads and shows key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /THORChain Wiki/i })).toBeVisible();
    await expect(page.getByText(/Community-maintained encyclopedia/i).first()).toBeVisible();
    await expect(page.getByText(/live sources|checking live network status|source degraded/i).first()).toBeVisible();
  });

  test('stats page loads with data or graceful error state', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Earnings History/i })).toBeVisible();
    await expect(page.getByText(/Showing .* Midgard daily earnings intervals|Earnings history unavailable/i).first()).toBeVisible();
    await expect(page.getByText(/Current-only|Degraded|Loading live source/i).first()).toBeVisible();
  });

  test('search page is functional', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();
    await page.getByLabel(/Search the wiki/i).fill('universal settlement asset');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=universal(\+|%20)settlement(\+|%20)asset/);
    await expect(page.getByText(/result/i).first()).toBeVisible();
    await expect(page.getByText(/RUNE as the Universal Settlement Asset/i).first()).toBeVisible();

    await page.getByLabel(/Search the wiki/i).fill('traditional multisig');
    await page.keyboard.press('Enter');
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
  });

  test('search results link to exact record anchors with trust labels', async ({ page }) => {
    await page.goto('/search?q=GG20');
    const incidentLink = page.locator('a[href="/governance#incident-gg20-vault-exploit-2026"]').first();
    await expect(incidentLink).toBeVisible();
    await expect(incidentLink).toHaveAttribute('href', '/governance#incident-gg20-vault-exploit-2026');
    await expect(incidentLink.locator('span').filter({ hasText: /^incident$/ })).toBeVisible();
    await expect(incidentLink.getByText('Official source', { exact: true })).toBeVisible();
    await page.goto('/governance#incident-gg20-vault-exploit-2026');
    await expect(page).toHaveURL(/\/governance#incident-gg20-vault-exploit-2026$/);
    await expect(page.locator('#incident-gg20-vault-exploit-2026')).toBeVisible();
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
    await expect(page.getByRole('link', { name: /Open project/i }).first()).toBeVisible();
    await page.getByLabel('Category').selectOption('Developer Tools');
    await expect(page.getByText(/SwapKit/i)).toBeVisible();
    await expect(page.getByText(/Showing 2 of/i)).toBeVisible();
    expect(messages.join('\n')).not.toMatch(/cannot contain a nested|hydration/i);
  });

  test('network page uses explicit live-state labels', async ({ page }) => {
    await page.goto('/network');
    await expect(page.getByRole('heading', { name: /Network & Security/i })).toBeVisible();
    await expect(page.getByText(/Live check/i)).toHaveCount(0);
    await expect(page.getByText('Signing State', { exact: true })).toBeVisible();
    await expect(page.getByText('TCY Claims', { exact: true })).toBeVisible();
  });

  test('governance page shows incidents and milestones', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.getByRole('heading', { name: /Governance & History/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Current Incident & Recovery Tracker/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Security Incidents/i })).toBeVisible();
  });

  test('deep dives index and article pages load', async ({ page }) => {
    await page.goto('/deep-dives');
    await expect(page.getByRole('heading', { name: /Deep Dives/i })).toBeVisible();
    await page.getByText(/Threshold Signatures \(TSS\)/i).click();
    await expect(page.getByText(/traditional multisignature/i)).toBeVisible();

    const sources = page.getByRole('list', { name: /Article sources/i });
    await expect(sources).toBeVisible();
    expect(await sources.innerText()).not.toContain('·');
    await expect(page.getByRole('navigation', { name: /Table of contents/i })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Glossary' })).toBeVisible();
    await expect(page.getByText(/Related Reading/i)).toBeVisible();
  });

  test('docs source map and glossary routes load', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'Documentation', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Current Protocol State/i })).toBeVisible();
    await expect(page.getByText(/current-only snapshots/i)).toBeVisible();

    await page.goto('/glossary');
    await expect(page.getByRole('heading', { name: /Glossary/i })).toBeVisible();
    await expect(page.locator('#term-mimir')).toBeVisible();
    await expect(page.getByText(/Operational parameter storage/i)).toBeVisible();
  });

  test('all deep-dive routes load', async ({ page }) => {
    const routes = [
      ['clp', /Continuous Liquidity Pools/i],
      ['incentive-pendulum', /The Incentive Pendulum/i],
      ['tss', /Threshold Signatures/i],
      ['churning', /Churning and Node Lifecycle/i],
      ['slashing', /Slashing and Economic Security/i],
      ['bifrost', /Bifrost Bridge/i],
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
    await expect(page.getByText(/Threshold Signature Schemes/i)).toBeVisible();
  });

  test('health API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.status).toBe('healthy');
  });

  test('version API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/version');
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(json.version).toBeTruthy();
  });

  test('readiness API endpoint responds with readiness metadata', async ({ request }) => {
    const response = await request.get('/api/ready');
    expect([200, 503]).toContain(response.status());
    expect(response.headers()['cache-control']).toContain('no-store');
    const json = await response.json();
    expect(['ready', 'degraded']).toContain(json.status);
    expect(json.version).toBeTruthy();
    expect(json.sources.midgard).toBeTruthy();
    expect(json.sources.thornode).toBeTruthy();
  });

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-powered-by']).toBeUndefined();
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['content-security-policy-report-only']).toContain('/api/csp-report');
  });

  test('share image routes render', async ({ request }) => {
    const openGraph = await request.get('/opengraph-image');
    const twitter = await request.get('/twitter-image');

    expect(openGraph.ok()).toBeTruthy();
    expect(openGraph.headers()['content-type']).toContain('image/png');
    expect(twitter.ok()).toBeTruthy();
    expect(twitter.headers()['content-type']).toContain('image/png');
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
        path: '/search',
        title: 'Search | THORChain Wiki',
        description: 'Search source-backed THORChain wiki sections, deep dives, glossary terms, incidents, ecosystem entries, governance records, and research.',
        canonical: 'https://wiki.thorchain.no/search',
      },
      {
        path: '/deep-dives/tss',
        title: 'Threshold Signatures (TSS) | THORChain Wiki',
        description: 'How distributed signing protects cross-chain vault keys and why GG20/DKLS wording must be source-backed.',
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
    await page.goto('/');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Deep Dives' })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Start here' })).toBeVisible();
    await page.getByRole('button', { name: /open search/i }).click();
    await expect(page.getByLabel(/Search the wiki/i)).toBeVisible();
  });
});
