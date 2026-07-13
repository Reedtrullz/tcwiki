import { test, expect } from '@playwright/test';

test.describe('THORChain Wiki Navigation Smoke Tests', () => {
  test('mobile navigation and search controls are accessible', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only smoke');
    await page.setViewportSize({ width: 375, height: 320 });
    await page.goto('/');
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    await expect(page.locator('#mobile-navigation').getByText('Sections', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Reader Paths', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Common Tasks', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Use Now', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Learn & Explain', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Build & Inspect', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByText('Trust & Recovery', { exact: true })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Deep Dives' })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Start here' })).toBeVisible();
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'Learning paths' })).toHaveAttribute('href', '/deep-dives#deep-dive-reader-paths');
    await expect(page.locator('#mobile-navigation').getByRole('link', { name: 'All guided answers' })).toHaveAttribute('href', '/search#search-guided-answers');
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
    await expect(siteSearch.getByRole('link', { name: /Node operator actions/i })).toHaveAttribute('href', '/network#node-operator-actions');
    await page.keyboard.press('Escape');
    await expect(page.getByLabel(/Search the wiki/i)).toHaveCount(0);
  });

  test('desktop primary navigation stays single-row and routes deep dives through guides', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only smoke');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    const primaryNavigation = page.locator('nav[aria-label="Primary navigation"]');
    await expect(primaryNavigation.getByRole('link', { name: 'Search' })).toHaveAttribute('href', '/search');
    await expect(page.locator('button[aria-controls="site-search-panel"] span', { hasText: 'Search' })).toBeHidden();
    await expect(primaryNavigation.getByRole('link', { name: 'Stats' })).toHaveAttribute('href', '/stats');
    await expect(primaryNavigation.getByRole('link', { name: 'Live Stats' })).toHaveCount(0);
    await expect(primaryNavigation.getByRole('link', { name: 'Deep Dives' })).toHaveCount(0);

    const navItems = await primaryNavigation.locator('a,button').evaluateAll((items) => (
      items.map((item) => {
        const rect = item.getBoundingClientRect();
        return {
          height: rect.height,
          text: item.textContent?.trim() ?? '',
          top: rect.top,
        };
      })
    ));
    expect(navItems.length).toBeGreaterThan(0);
    const firstRowTop = Math.min(...navItems.map((item) => item.top));
    for (const item of navItems) {
      expect(item.height, `${item.text} should stay on one desktop nav row`).toBeLessThanOrEqual(38);
      expect(Math.abs(item.top - firstRowTop), `${item.text} should not wrap below the first row`).toBeLessThanOrEqual(2);
    }

    await primaryNavigation.getByRole('button', { name: /Guides/i }).click();
    const guides = page.getByRole('navigation', { name: /Guide links/i });
    await expect(guides.getByRole('link', { name: /Learning paths/i })).toHaveAttribute('href', '/deep-dives#deep-dive-reader-paths');
    await page.goto('/deep-dives');
    await expect(primaryNavigation.getByRole('button', { name: /Guides/i })).toHaveClass(/bg-accent\/10/);
  });

  test('compact header is used where full desktop nav would collide with search', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop breakpoint smoke');

    for (const width of [1024, 1080, 1279]) {
      await page.setViewportSize({ width, height: 720 });
      await page.goto('/');

      const primaryNavigation = page.locator('nav[aria-label="Primary navigation"]');
      await expect(primaryNavigation).toBeHidden();
      await expect(page.getByRole('button', { name: /Open navigation menu/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Open search/i })).toBeVisible();
      await expect(page.locator('button[aria-controls="site-search-panel"] span', { hasText: 'Search' })).toBeVisible();

      const headerLayout = await page.locator('header').evaluate((header) => {
        const searchButton = header.querySelector('button[aria-controls="site-search-panel"]')?.getBoundingClientRect();
        const menuButton = header.querySelector('button[aria-controls="mobile-navigation"]')?.getBoundingClientRect();
        return {
          width: window.innerWidth,
          searchRight: searchButton?.right ?? 0,
          menuRight: menuButton?.right ?? 0,
        };
      });
      expect(headerLayout.searchRight, `search control should fit at ${width}px`).toBeLessThanOrEqual(headerLayout.width);
      expect(headerLayout.menuRight, `menu control should fit at ${width}px`).toBeLessThanOrEqual(headerLayout.width);
    }
  });

  test('global header search opens from keyboard and submits reader-job queries', async ({ page }) => {
    await page.goto('/');

    await page.keyboard.press('Control+K');
    const siteSearch = page.getByRole('search', { name: /Site search/i });
    const searchInput = siteSearch.getByLabel(/Search the wiki/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
    await expect(siteSearch.getByText('Use Now', { exact: true })).toBeVisible();
    await expect(siteSearch.getByText('Learn & Explain', { exact: true })).toBeVisible();
    await expect(siteSearch.getByText('Build & Inspect', { exact: true })).toBeVisible();
    await expect(siteSearch.getByText('Trust & Recovery', { exact: true })).toBeVisible();
    await expect(siteSearch.getByRole('link', { name: /Browse guided answers/i })).toHaveAttribute('href', '/search#search-guided-answers');
    await expect(siteSearch.getByRole('link', { name: /New to THORChain/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
    await expect(siteSearch.getByRole('link', { name: /Why did my swap refund/i })).toHaveAttribute('href', '/deep-dives/streaming-swaps-refunds#what-to-check-first');
    await expect(siteSearch.getByRole('link', { name: /Node operator actions/i })).toHaveAttribute('href', '/network#node-operator-actions');

    await searchInput.fill('why did my swap refund');
    await searchInput.press('Enter');
    await expect(page).toHaveURL(/\/search\?q=why(%20|\+)did(%20|\+)my(%20|\+)swap(%20|\+)refund/);
    await expect(page.locator('main article').first().locator('a[href="/deep-dives/streaming-swaps-refunds#what-to-check-first"]')).toBeVisible();

    await page.goto('/');
    await page.getByRole('button', { name: /Open search/i }).click();
    await expect(siteSearch.getByRole('link', { name: /Which source should I trust/i })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByLabel(/Search the wiki/i)).toHaveCount(0);
  });
});
