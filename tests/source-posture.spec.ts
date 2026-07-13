import { test, expect } from '@playwright/test';
import {
  getContentEntry,
  ROUTE_SOURCE_POSTURE_ENTRY_IDS,
  type ContentEntry,
} from '../src/lib/content/registry';
import { getConfidenceLabel } from '../src/lib/trust';

function pluralizedSourceCount(count: number) {
  return `+${count} source${count === 1 ? '' : 's'}`;
}

function expectedPrimarySource(entry: ContentEntry) {
  const [primarySource] = entry.sources;
  if (!primarySource) {
    throw new Error(`${entry.id} must have at least one source`);
  }

  return primarySource;
}

test.describe('THORChain Wiki Source Posture Smoke Tests', () => {
  const sourcePostureEntries = ROUTE_SOURCE_POSTURE_ENTRY_IDS.map((entryId) => getContentEntry(entryId));

  test('registry-required routes expose source posture from content metadata', async ({ page }) => {
    test.slow();

    for (const entry of sourcePostureEntries) {
      await page.goto(entry.href, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });

      const posture = page.getByRole('region', { name: 'Page Source Posture' });
      const primarySource = expectedPrimarySource(entry);
      await expect(posture, `${entry.href} should render RouteSourcePosture`).toBeVisible();
      await expect(posture.getByText(entry.description, { exact: true })).toBeVisible();
      await expect(posture.getByText(getConfidenceLabel(entry.confidence), { exact: true }).first()).toBeVisible();
      await expect(posture.getByText(`Checked ${entry.reviewedAt}`, { exact: true })).toBeVisible();
      await expect(posture.getByText(`Review due ${entry.nextReviewDue}`, { exact: true })).toBeVisible();
      await expect(posture.getByRole('link', { name: primarySource.label, exact: true }).first()).toHaveAttribute('href', primarySource.url);
      if (entry.sources.length > 1) {
        await expect(posture.getByText(pluralizedSourceCount(entry.sources.length - 1), { exact: true })).toBeVisible();
      }
      await expect(posture.getByText('Use This Page For', { exact: true })).toBeVisible();
      await expect(posture.getByText('Verify Elsewhere Before Claiming', { exact: true })).toBeVisible();
    }
  });

  test('static concept pages expose next-step checks', async ({ page }) => {
    const routes = [
      {
        path: '/protocol',
        link: /New to THORChain/i,
        href: '/deep-dives#deep-dive-path-new-to-thorchain',
        evidence: /Network diagnostics/i,
      },
      {
        path: '/economics',
        link: /Swap Economics/i,
        href: '/deep-dives#deep-dive-path-swap-economics',
        evidence: /Dynamic fee tracker/i,
      },
      {
        path: '/rune',
        link: /RUNE settlement deep dive/i,
        href: '/deep-dives/rune-settlement',
        evidence: /Official source map/i,
      },
      {
        path: '/tcy',
        link: /TCY timeline/i,
        href: '/deep-dives/tcy-recovery-timeline#what-to-check-now',
        evidence: /Recovery tracker/i,
      },
      {
        path: '/governance',
        link: /Mimir halt guide/i,
        href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
        evidence: /Network diagnostics/i,
      },
    ];

    for (const route of routes) {
      await page.goto(route.path, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.getByRole('heading', { name: /Continue From Here/i })).toBeVisible();
      await expect(page.getByText('claim path', { exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: route.link }).first()).toHaveAttribute('href', route.href);
      await expect(page.getByText(route.evidence).first()).toBeVisible();
      if (route.path === '/protocol') {
        await expect(page.locator('#protocol-claim-checks')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Protocol Claim Checks/i })).toBeVisible();
        await expect(page.getByText(/Architecture explanation/i)).toBeVisible();
        await expect(page.getByText(/Current availability claim/i)).toBeVisible();
        await expect(page.getByText(/Security or vault claim/i)).toBeVisible();
        await expect(page.getByText(/Developer integration claim/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Check live diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
        await expect(page.getByRole('link', { name: /Read security path/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-network-security');
        await expect(page.getByText(/Do not infer live state from supported-chain listings/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Interpret Mimir controls/i })).toHaveAttribute('href', '/deep-dives/mimir-halt-controls#what-mimirs-can-prove');
        await expect(page.getByRole('link', { name: /Check live halts/i })).toHaveAttribute('href', '/network#network-diagnostics');
        await expect(page.getByRole('link', { name: /Review inbound usage/i })).toHaveAttribute('href', '/deep-dives/build-query-data#quotes-inbound-addresses-and-caching');
        await expect(page.getByRole('link', { name: /Check a live route/i })).toHaveAttribute('href', '/network#check-a-route');
        await expect(page.getByRole('link', { name: /Read refund conditions/i })).toHaveAttribute('href', '/deep-dives/streaming-swaps-refunds#why-refunds-happen');
        await expect(page.getByRole('link', { name: /Choose the right API/i })).toHaveAttribute('href', '/deep-dives/midgard-thornode-data#source-roles');
        await expect(page.locator('#chain-catalog-boundary').getByText(/catalog boundary, not a current availability dashboard/i)).toBeVisible();
      }
      if (route.path === '/economics') {
        await expect(page.locator('#economic-claim-checks')).toBeVisible();
        await expect(page.getByText(/Mechanism explanation/i)).toBeVisible();
        await expect(page.getByText(/Current metric claim/i)).toBeVisible();
        await expect(page.getByText(/Fee or revenue claim/i)).toBeVisible();
        await expect(page.getByText(/Tokenomics figure/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Check live metrics/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
        await expect(page.getByRole('link', { name: /Open dynamic fee tracker/i })).toHaveAttribute('href', '/dynamic-fees#dynamic-fees-live');
        await expect(page.getByText(/Do not claim durable revenue lift/i)).toBeVisible();
      }
      if (route.path === '/rune') {
        await expect(page.locator('#rune-number-router')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Which RUNE Number Do You Need/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Live network metrics/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Security constants/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Supply framing/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Price or value claim/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Start with Stats decision panel/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
        await expect(page.getByRole('link', { name: /Start with Network diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
        await expect(page.getByRole('link', { name: /Start with Source map/i })).toHaveAttribute('href', '/docs#rune-tokenomics-and-value');
        await expect(page.getByText(/Do not use live metrics as price, fair value/i)).toBeVisible();
        await expect(page.locator('#rune-claim-checks')).toBeVisible();
        await expect(page.getByRole('heading', { name: /RUNE Claim Checks/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Settlement role/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Current network number/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Tokenomics figure/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Value or investment claim/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Check live RUNE metrics/i })).toHaveAttribute('href', '/stats#stats-look-here-first');
        await expect(page.getByRole('link', { name: /Review dated tokenomics/i })).toHaveAttribute('href', '/rune#tokenomics-rune-supply-framing');
        await expect(page.getByRole('link', { name: /Check source boundary/i })).toHaveAttribute('href', '/docs#rune-tokenomics-and-value');
        await expect(page.getByText(/Do not claim price, fair value, or investment upside/i)).toBeVisible();
      }
    }
  });
});
