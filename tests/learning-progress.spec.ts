import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';

const storageKey = 'thorchain-wiki:deep-dive-progress:v1';

test('local learning progress is opt-in, preserves reader URL state, and resumes after reload', async ({ page }) => {
  await page.goto('/deep-dives/clp?keep=reader#evidence-ladder');
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);

  const pathPicker = page.getByRole('combobox', { name: 'Reader path to track' });
  await expect(pathPicker).toBeVisible();
  await expect(pathPicker).toBeEnabled();
  await pathPicker.selectOption('new-to-thorchain');
  await expect.poll(() => new URL(page.url()).searchParams.get('learning_path')).toBe('new-to-thorchain');
  expect(new URL(page.url()).searchParams.get('keep')).toBe('reader');
  expect(new URL(page.url()).hash).toBe('#evidence-ladder');
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();

  await page.getByRole('button', { name: 'Enable local progress on this browser' }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), storageKey)).not.toBeNull();
  await page.getByRole('button', { name: 'Mark this step as read' }).click();
  await page.getByRole('button', { name: 'Bookmark this step' }).click();

  await page.reload();
  await expect(pathPicker).toHaveValue('new-to-thorchain');
  await expect(page.getByText(/Marked as read · article review date/)).toBeVisible();
  await expect(page.getByRole('link', { name: /Resume from bookmark:/ })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('keep')).toBe('reader');
  expect(new URL(page.url()).hash).toBe('#evidence-ladder');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  if (!filePath) throw new Error('Local progress download unavailable');
  const saved = JSON.parse(await readFile(filePath, 'utf8'));
  expect(saved.version).toBe(1);
  expect(saved.paths[0].readSteps[0].entryId).toBe('deep-dive-clp');
  await page.getByRole('button', { name: 'Disable and delete local progress' }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  await page.locator('summary').filter({ hasText: 'Import a progress file' }).click();
  await page.getByLabel('Progress JSON file').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(saved)) });
  await page.getByRole('button', { name: 'Import and save on this browser' }).click();
  await expect(page.getByRole('link', { name: /Resume from bookmark:/ })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  const panel = page.locator('section[aria-labelledby="deep-dive-learning-progress-title"]');
  const layout = await panel.evaluate(node => ({ width: node.scrollWidth, available: node.clientWidth }));
  expect(layout.width).toBeLessThanOrEqual(layout.available + 2);
  await page.addScriptTag({ content: axe.source });
  const violations = await panel.evaluate(async node => (await (window as unknown as { axe: typeof import('axe-core') }).axe.run(node, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations);
  expect(violations).toEqual([]);
});

test('unavailable browser storage leaves reading paths usable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage unavailable'); } }); });
  await page.goto('/deep-dives/clp');
  const panel = page.locator('section[aria-labelledby="deep-dive-learning-progress-title"]');
  await expect(panel).toContainText('Browser storage is unavailable here.');
  await panel.getByRole('combobox', { name: 'Reader path to track' }).selectOption('new-to-thorchain');
  await expect(page).toHaveURL(/learning_path=new-to-thorchain/);
  await panel.getByRole('button', { name: 'Enable local progress on this browser' }).click();
  await expect(panel).toContainText('Progress could not be saved in this browser.');
  await expect(panel.getByRole('link', { name: /Open this path in the reader-path list/ })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
});

test('obsolete imports recover to reader paths and incompatible imports retain existing progress', async ({ page }) => {
  await page.goto('/deep-dives/clp');
  const panel = page.locator('section[aria-labelledby="deep-dive-learning-progress-title"]');
  await panel.locator('summary').filter({ hasText: 'Import a progress file' }).click();
  const upload = panel.getByLabel('Progress JSON file');
  await upload.setInputFiles({ name: 'obsolete.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ version: 1, selectedPathId: 'obsolete', paths: [{ pathId: 'obsolete', pathHref: '/deep-dives#deep-dive-path-obsolete', bookmark: null, readSteps: [] }] })) });
  await panel.getByRole('button', { name: 'Import and save on this browser' }).click();
  await expect(panel).toContainText('obsolete path or article');
  await expect(panel.getByRole('link', { name: /current reader paths/i })).toBeVisible();
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await upload.setInputFiles({ name: 'future.json', mimeType: 'application/json', buffer: Buffer.from('{"version":99}') });
  await panel.getByRole('button', { name: 'Import and save on this browser' }).click();
  await expect(panel).toContainText('version this page cannot read');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
});
