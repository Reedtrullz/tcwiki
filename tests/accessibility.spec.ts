import { test, expect, type Page } from '@playwright/test';
import axe from 'axe-core';

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
