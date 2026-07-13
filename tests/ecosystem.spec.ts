import { test, expect } from '@playwright/test';

test.describe('THORChain Wiki Ecosystem Smoke Tests', () => {
  test('ecosystem preserves legacy status links as source-posture filters', async ({ page }) => {
    await page.goto('/ecosystem?status=Active');
    const filters = page.getByRole('group', { name: /Directory filters/i });
    await expect(filters.getByLabel('Directory posture')).toHaveValue('listed');
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ViewBlock' })).toHaveCount(0);

    await page.goto('/ecosystem?status=Needs%20review');
    await expect(filters.getByLabel('Directory posture')).toHaveValue('needs-review');
    await expect(page.getByRole('heading', { name: 'ViewBlock' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toHaveCount(0);

    await filters.getByLabel('Find').fill('ViewBlock');
    await expect(page).toHaveURL(/posture=needs-review/);
    await expect(page).not.toHaveURL(/status=/);
  });

  test('ecosystem page frames third-party surfaces and filters clearly', async ({ page }) => {
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        messages.push(message.text());
      }
    });

    await page.goto('/ecosystem');
    await expect(page.getByRole('heading', { name: /Ecosystem/i })).toBeVisible();
    await expect(page.getByText(/not an endorsement list/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Before Using An Interface/i })).toBeVisible();
    await expect(page.getByText(/interface trust journey/i)).toBeVisible();
    await expect(page.getByText(/Pointer list, not endorsement/i)).toBeVisible();
    await expect(page.locator('[aria-label="Choose ecosystem surface by intent"]')).toBeVisible();
    await expect(page.getByText('Swap or quote', { exact: true })).toBeVisible();
    await expect(page.getByText('Wallet or app', { exact: true })).toBeVisible();
    await expect(page.getByText('Transaction or refund evidence', { exact: true })).toBeVisible();
    await expect(page.getByText('Build an integration', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Check a route/i })).toHaveAttribute('href', '/network#check-a-route');
    await expect(page.getByRole('link', { name: /Open refund triage/i })).toHaveAttribute('href', '/deep-dives/streaming-swaps-refunds#evidence-ladder');
    await expect(page.getByText(/Do not infer wallet safety/i)).toBeVisible();
    await expect(page.getByText(/Do not treat a listed SDK as proof/i)).toBeVisible();
    await expect(page.getByText('Choose the surface', { exact: true })).toBeVisible();
    await expect(page.getByText('Check live protocol state', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Open source map/i })).toHaveAttribute('href', '/docs#third-party-interfaces-wallets');
    await expect(page.getByText('Inspect signing risk', { exact: true })).toBeVisible();
    await expect(page.getByText(/release source, wallet permissions, quoted route/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Open network diagnostics/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('link', { name: /Open external project/i }).first()).toBeVisible();
    await expect(page.getByText(/Use filters to find a surface to inspect/i)).toBeVisible();
    await expect(page.getByText(/This listing can indicate/i).first()).toBeVisible();
    await expect(page.getByText(/Still verify/i).first()).toBeVisible();
    await expect(page.getByText(/Not a safety proof/i).first()).toBeVisible();
    await expect(page.getByText(/Use for/i).first()).toBeVisible();
    await expect(page.getByText(/Check before use/i).first()).toBeVisible();
    const ecosystemFilters = page.getByRole('group', { name: /Directory filters/i });
    await expect(page.locator('#ecosystem-thorchain-swap').getByText('Catalog listed', { exact: true })).toBeVisible();
    await expect(page.getByText(/Directory posture describes this wiki record only/i)).toBeVisible();
    await expect(ecosystemFilters.getByLabel('Directory posture')).toBeVisible();
    await expect(page.getByText(/Listed Active/i)).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Check protocol route/i }).first()).toHaveAttribute('href', /\/network\?from_asset=.*#check-a-route/);
    await expect(page.getByRole('link', { name: /Open diagnostics/i }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByText(/wallet approvals/i).first()).toBeVisible();

    await ecosystemFilters.getByLabel('Find').fill('ShapeShift');
    await expect(page).toHaveURL(/q=ShapeShift/);
    await expect(page.getByRole('heading', { name: 'ShapeShift' })).toBeVisible();
    await expect(page.getByText(/Showing 1 of/i)).toBeVisible();
    await expect(page.getByLabel('Active ecosystem filters').getByText('Search: ShapeShift')).toBeVisible();
    await expect(page.getByText('This filtered view is reflected in the URL.')).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Find')).toHaveValue('');
    await expect(page.getByText(/Showing 12 of/i)).toBeVisible();

    await ecosystemFilters.getByLabel('Find').fill('Vultisig');
    await expect(page).toHaveURL(/q=Vultisig/);
    const vultisigCard = page.locator('#ecosystem-vultisig');
    await expect(vultisigCard.getByRole('heading', { name: 'Vultisig' })).toBeVisible();
    await expect(vultisigCard.getByText(/Self-custodial MPC wallet/i)).toBeVisible();
    await expect(vultisigCard.getByText(/not a wallet-security audit/i)).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Find')).toHaveValue('');

    await ecosystemFilters.getByLabel('Find').fill('thorchain-swap');
    await expect(page).toHaveURL(/q=thorchain-swap/);
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toBeVisible();
    await expect(page.getByText(/Showing 1 of/i)).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Find')).toHaveValue('');

    await ecosystemFilters.getByLabel('Category').selectOption('Developer Tools');
    await expect(page).toHaveURL(/category=Developer\+Tools/);
    await expect(page.getByRole('heading', { name: 'SwapKit', exact: true })).toBeVisible();
    await expect(page.getByText(/production readiness/i).first()).toBeVisible();
    await expect(page.getByText(/Showing 2 of/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Reset$/ })).toBeVisible();
    await expect(page.getByLabel('Active ecosystem filters').getByText('Category: Developer Tools')).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Category')).toHaveValue('all');
    await expect(page.getByText(/Showing 12 of/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ShapeShift' })).toBeVisible();

    await ecosystemFilters.getByLabel('Directory posture').selectOption('needs-review');
    await expect(page).toHaveURL(/posture=needs-review/);
    await expect(page.locator('#ecosystem-viewblock').getByRole('heading', { name: 'ViewBlock' })).toBeVisible();
    await expect(page.locator('#ecosystem-viewblock').getByText('Needs source review')).toBeVisible();
    await expect(page.locator('#ecosystem-viewblock').getByText('Needs review', { exact: true }).first()).toBeVisible();
    await expect(page.locator('#ecosystem-viewblock').getByText(/Direct source refresh needs review/i)).toBeVisible();
    await expect(page.locator('#ecosystem-viewblock').getByText(/Review before relying on this entry/i)).toBeVisible();
    await expect(page.locator('#ecosystem-viewblock').getByRole('link', { name: /Review source posture/i })).toHaveAttribute('href', '/docs#third-party-interfaces-wallets');
    await expect(page.locator('#ecosystem-viewblock').getByRole('link', { name: /Open unreviewed external source/i })).toHaveAttribute('href', 'https://viewblock.io/thorchain');
    await expect(page.locator('#ecosystem-viewblock').getByRole('link', { name: /Check sample route/i })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'RuneScan' })).toHaveCount(0);
    await expect(page.getByLabel('Active ecosystem filters').getByText('Directory posture: Needs source review')).toBeVisible();
    await page.getByRole('button', { name: /^Reset$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Directory posture')).toHaveValue('all');

    await ecosystemFilters.getByLabel('Category').selectOption('Explorer');
    await ecosystemFilters.getByLabel('Chain').selectOption('BTC');
    await expect(page).toHaveURL(/category=Explorer/);
    await expect(page).toHaveURL(/chain=BTC/);
    await expect(page.getByText(/No ecosystem entries match Category: Explorer \+ Chain: BTC/i)).toBeVisible();
    await expect(page.getByText(/do not prove an interface is unavailable, unsafe, unsupported, or offline/i)).toBeVisible();
    await expect(page.getByText(/Showing 0 of 12/i)).toBeVisible();
    await expect(page.getByLabel('Active ecosystem filters').getByText('Category: Explorer')).toBeVisible();
    await expect(page.getByLabel('Active ecosystem filters').getByText('Chain: BTC')).toBeVisible();
    await page.getByRole('button', { name: /^Reset filters$/ }).click();
    await expect(page).toHaveURL(/\/ecosystem$/);
    await expect(ecosystemFilters.getByLabel('Category')).toHaveValue('all');
    await expect(ecosystemFilters.getByLabel('Chain')).toHaveValue('all');
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toBeVisible();
    await expect(page.getByText(/Showing 12 of/i)).toBeVisible();

    await page.goto('/ecosystem?q=ShapeShift&category=Interface');
    const hydratedFilters = page.getByRole('group', { name: /Directory filters/i });
    await expect(hydratedFilters.getByLabel('Find')).toHaveValue('ShapeShift');
    await expect(hydratedFilters.getByLabel('Category')).toHaveValue('Interface');
    await expect(page.getByLabel('Active ecosystem filters').getByText('Search: ShapeShift')).toBeVisible();
    await expect(page.getByLabel('Active ecosystem filters').getByText('Category: Interface')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ShapeShift' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toHaveCount(0);

    await page.evaluate(() => {
      window.history.pushState(window.history.state, '', '/ecosystem?chain=BTC');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await expect(hydratedFilters.getByLabel('Find')).toHaveValue('');
    await expect(hydratedFilters.getByLabel('Category')).toHaveValue('all');
    await expect(hydratedFilters.getByLabel('Chain')).toHaveValue('BTC');
    await expect(page.getByLabel('Active ecosystem filters').getByText('Chain: BTC')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'ShapeShift' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'THORChain Swap' })).toBeVisible();
    expect(messages.join('\n')).not.toMatch(/cannot contain a nested|hydration/i);
  });
});
