import { test, expect } from '@playwright/test';
import axe from 'axe-core';

test('educational execution map keeps stage boundaries readable in order', async ({ page }) => {
  await page.goto('/deep-dives/build-query-data#swap-execution-and-evidence-map');
  const map = page.getByRole('figure', { name: 'Swap execution and evidence map' });
  await expect(map).toBeVisible();
  const stages = map.getByRole('list', { name: 'Evidence stages in reading order' });
  await expect(stages.getByRole('listitem')).toHaveCount(5);
  await expect(map).toContainText('not a live transaction');
  await expect(map).toContainText('independently');
  await expect(map).toContainText('refund');
  await expect(map.getByRole('link', { name: 'Read the stage explanation' })).toHaveCount(5);
  const width = await map.evaluate(node => ({ width: node.scrollWidth, available: node.clientWidth }));
  expect(width.width).toBeLessThanOrEqual(width.available + 2);
  await page.addScriptTag({ content: axe.source });
  const violations = await map.evaluate(async node => {
    const runner = (window as unknown as { axe: typeof import('axe-core') }).axe;
    return (await runner.run(node, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations;
  });
  expect(violations).toEqual([]);
  const stageLink = map.getByRole('link', { name: 'Read the stage explanation' }).first();
  await stageLink.focus();
  await expect(stageLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/streaming-swaps-refunds/);
});
