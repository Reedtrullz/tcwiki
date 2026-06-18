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
    await expect(page.getByText(/Current-only|Degraded|Loading live source/i).first()).toBeVisible();
  });

  test('search page is functional', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();
    await page.getByLabel(/Search the wiki/i).fill('universal settlement asset');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/result/i).first()).toBeVisible();
    await expect(page.getByText(/RUNE as the Universal Settlement Asset/i).first()).toBeVisible();

    await page.getByLabel(/Search the wiki/i).fill('traditional multisig');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Threshold Signatures/i).first()).toBeVisible();
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
    await expect(page.getByRole('link', { name: /Open project/i }).first()).toBeVisible();
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
    await expect(page.getByRole('heading', { name: /Security Incidents/i })).toBeVisible();
  });

  test('deep dives index and article pages load', async ({ page }) => {
    await page.goto('/deep-dives');
    await expect(page.getByRole('heading', { name: /Deep Dives/i })).toBeVisible();
    await page.getByText(/Incentive Pendulum/i).click();
    await expect(page.getByText(/self-correcting feedback loop/i)).toBeVisible();
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

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-powered-by']).toBeUndefined();
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['content-security-policy-report-only']).toContain('/api/csp-report');
  });

  test('mobile navigation and search controls are accessible', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only smoke');
    await page.goto('/');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Deep Dives' })).toBeVisible();
    await page.getByRole('button', { name: /open search/i }).click();
    await expect(page.getByLabel(/Search the wiki/i)).toBeVisible();
  });
});
