import { test, expect } from '@playwright/test';

test('claim citations retain scope, dates and superseding evidence links', async ({ page }) => {
  await page.goto('/governance#incident-memoless-spam-2026-08');
  const incident = page.locator('#incident-memoless-spam-2026-08');
  await incident.getByText('Claim evidence (3)', { exact: true }).click();
  const release = page.locator('#claim-memoless-v320-handler-work');
  await expect(release).toContainText('historical · supported · THORNode v3.20.0');
  await expect(release).toContainText('claim reviewed 2026-10-03');
  await expect(release.getByRole('link')).toHaveAttribute('href', 'https://gitlab.com/thorchain/thornode/-/releases/v3.20.0');
  const current = page.locator('#claim-memoless-current-availability');
  await expect(current).toContainText('current-only · needs-live-evidence');
  await current.getByRole('link', { name: 'memoless-august-cycle', exact: true }).click();
  await expect(page).toHaveURL(/#claim-memoless-august-cycle$/);
  await expect(page.locator('#claim-memoless-august-cycle')).toContainText('still needs retained dated evidence');
  await expect(incident).toContainText('Checked 2026-08-26');
});
