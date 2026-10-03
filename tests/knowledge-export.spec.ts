import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('builder can read checksummed metadata and follow its existing evidence links', async ({ page, request }) => {
  const response = await request.get('/knowledge/v1.json');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  const body = await response.text();
  expect(body).toBe(readFileSync('public/knowledge/v1.json', 'utf8'));
  expect(Buffer.byteLength(body)).toBeLessThanOrEqual(256 * 1024);
  const { checksum, ...payload } = JSON.parse(body);
  expect(checksum).toEqual({ algorithm: 'sha256', value: createHash('sha256').update(JSON.stringify(payload)).digest('hex') });
  expect(payload.schemaVersion).toBe(1);
  expect(payload.entities).toHaveLength(3);
  for (const entity of payload.entities) {
    await page.goto(entity.route);
    const claim = page.locator(`#${entity.route.split('#')[1]}`);
    await expect(claim).toBeVisible();
    await expect(claim).toContainText(entity.summary);
    await expect(claim.getByRole('link', { name: entity.source.label, exact: true })).toHaveAttribute('href', entity.source.url);
  }
  const pointers = await request.get('/llms.txt');
  expect(pointers.ok()).toBe(true);
  expect(pointers.headers()['content-type']).toContain('text/plain');
  expect(await pointers.text()).toBe(readFileSync('public/llms.txt', 'utf8'));
  await page.goto('/deep-dives/build-query-data#query-plan');
  await expect(page.locator('#query-plan')).toBeVisible();
});
