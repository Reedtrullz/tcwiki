import { test, expect } from '@playwright/test';

test.describe('THORChain Wiki Smoke Tests', () => {
  test('home page loads and shows key sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /THORChain Wiki/i })).toBeVisible();
    await expect(page.getByText(/Community-maintained encyclopedia/i).first()).toBeVisible();
  });

  test('stats page loads with data or graceful error state', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByRole('heading', { name: /Network Statistics/i })).toBeVisible();
  });

  test('search page is functional', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: /Search/i })).toBeVisible();
    await page.getByPlaceholder(/Search the wiki/i).fill('RUNE');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/result/i).first()).toBeVisible();
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

  test('protocol page renders key content', async ({ page }) => {
    await page.goto('/protocol');
    await expect(page.getByRole('heading', { name: /Protocol Overview/i })).toBeVisible();
    await expect(page.getByText(/Threshold Signature Schemes/i)).toBeVisible();
  });

  test('health API endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const json = await response.json();
    expect(json.status).toBe('healthy');
  });
});
