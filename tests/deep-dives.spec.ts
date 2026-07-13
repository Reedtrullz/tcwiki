import { test, expect } from '@playwright/test';
import {
  DEEP_DIVE_ENTRIES,
  DEEP_DIVE_READER_PATHS,
  DEEP_DIVE_TOC,
  getContentEntry,
} from '../src/lib/content/registry';
import { getDeepDiveArticleClaimBoundary, getDeepDiveArticleUseCase } from '../src/lib/deep-dive-posture';
import { expectAnchorTargetVisualSafety, expectRouteVisualSafety } from './helpers/layout-safety';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('THORChain Wiki Deep Dive Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  const visualSafetyRoutes: Array<{ path: string; heading: string | RegExp }> = [
    { path: '/deep-dives', heading: 'Deep Dives' },
    ...DEEP_DIVE_ENTRIES.map((entry) => ({
      path: entry.href,
      heading: new RegExp(escapeRegExp(entry.title), 'i'),
    })),
  ];

  const anchorTargets: Array<{ href: string; selector: string }> = [
    { href: '/deep-dives#deep-dive-reader-paths', selector: '#deep-dive-reader-paths' },
    { href: '/deep-dives#deep-dive-path-developer-data-integration', selector: '#deep-dive-path-developer-data-integration' },
    { href: '/deep-dives#deep-dive-path-network-security', selector: '#deep-dive-path-network-security' },
    { href: '/deep-dives#deep-dive-path-liquidity-actions', selector: '#deep-dive-path-liquidity-actions' },
    { href: '/deep-dives/build-query-data#query-plan', selector: '#query-plan' },
    { href: '/deep-dives/clp#evidence-ladder', selector: '#evidence-ladder' },
    { href: '/deep-dives/liquidity-actions#what-to-check-first', selector: '#what-to-check-first' },
    { href: '/deep-dives/runepool-pol#what-this-page-can-prove', selector: '#what-this-page-can-prove' },
    { href: '/deep-dives/streaming-swaps-refunds#what-to-check-first', selector: '#what-to-check-first' },
    { href: '/deep-dives/incentive-pendulum#evidence-ladder', selector: '#evidence-ladder' },
    { href: '/deep-dives/app-layer#what-to-verify-before-claiming', selector: '#what-to-verify-before-claiming' },
    { href: '/deep-dives/tcy-recovery-timeline#what-to-check-now', selector: '#what-to-check-now' },
  ];

  test('deep-dive routes stay visually safe on desktop and mobile', async ({ page }) => {
    test.slow();
    for (const route of visualSafetyRoutes) {
      await expectRouteVisualSafety(page, route.path, route.heading);
    }
  });

  test('deep-dive anchors stay visually safe below the fixed header', async ({ page }) => {
    for (const target of anchorTargets) {
      await expectAnchorTargetVisualSafety(page, target.href, target.selector);
    }
  });

  test('deep dives index renders every reader path and article card', async ({ page }) => {
    test.slow();
    await page.goto('/deep-dives');
    await expect(page.getByRole('heading', { name: 'Deep Dives', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    await expect(page.locator('#deep-dive-start-here').getByRole('link', { name: /Browse article library/i })).toHaveAttribute('href', '#deep-dive-library');
    await expect(page.locator('#deep-dive-start-here').getByRole('link', { name: /Learn the model/i })).toHaveAttribute('href', '/deep-dives#deep-dive-path-new-to-thorchain');
    await expect(page.locator('#deep-dive-start-here').getByRole('link', { name: /Check live availability/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.locator('#deep-dive-start-here').getByRole('link', { name: /Build or query data/i })).toHaveAttribute('href', '/deep-dives/build-query-data#query-plan');
    await expect(page.locator('#deep-dive-start-here').getByRole('link', { name: /Debug swaps or refunds/i })).toHaveAttribute('href', '/deep-dives/streaming-swaps-refunds#what-to-check-first');
    await expect(page.getByText(/Page Source Posture/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Reader Paths/i })).toBeVisible();
    await expect(page.getByText(/Verify Before Claiming/i).first()).toBeVisible();

    for (const readerPath of DEEP_DIVE_READER_PATHS) {
      const pathCard = page.locator(`#deep-dive-path-${readerPath.id}`);
      await expect(pathCard).toBeVisible();
      await expect(pathCard.getByRole('heading', { name: readerPath.title })).toBeVisible();
      await expect(pathCard.getByText(readerPath.audience)).toBeVisible();
      await expect(pathCard.getByText(readerPath.description)).toBeVisible();

      for (const [index, entryId] of readerPath.entryIds.entries()) {
        const entry = getContentEntry(entryId);
        const listItem = pathCard.getByRole('listitem').filter({ hasText: entry.title });
        await expect(listItem.getByText(`${index + 1}.`, { exact: true })).toBeVisible();
        await expect(listItem.getByRole('link', { name: entry.title })).toHaveAttribute('href', entry.href);
      }

      for (const boundary of readerPath.verifyBeforeClaiming) {
        await expect(pathCard.getByText(boundary)).toBeVisible();
      }

      for (const followUp of readerPath.followUpLinks) {
        const followUpLink = pathCard.getByRole('link', { name: new RegExp(escapeRegExp(followUp.label)) });
        await expect(followUpLink).toHaveAttribute('href', followUp.href);
        await expect(pathCard.getByText(followUp.description)).toBeVisible();
      }
    }

    await expect(page.getByRole('heading', { name: /All Deep Dives/i })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: /Filter deep dives/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Data & builders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Swaps & liquidity/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Security & ops/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Apps & recovery/i })).toBeVisible();
    for (const entry of DEEP_DIVE_ENTRIES) {
      const articleCard = page.locator(`#deep-dive-card-${entry.id}`);
      const readerPaths = DEEP_DIVE_READER_PATHS.filter((path) => path.entryIds.includes(entry.id));
      await expect(articleCard).toBeVisible();
      await expect(articleCard.locator('h3 a')).toHaveAttribute('href', entry.href);
      await expect(articleCard.getByText(entry.description)).toBeVisible();
      await expect(articleCard.getByText('Use For')).toBeVisible();
      const useCase = getDeepDiveArticleUseCase(entry.id, entry.title, entry.confidence);
      expect(useCase).not.toMatch(/^(Curated explanation of|Historical context for)/);
      await expect(articleCard.getByText(useCase)).toBeVisible();
      await expect(articleCard.getByText('Verify First')).toBeVisible();
      const claimBoundary = getDeepDiveArticleClaimBoundary(entry.id, entry.confidence, readerPaths);
      expect(claimBoundary).not.toBe('Current protocol constants, live Mimir state, chain availability, quote execution, or product status.');
      await expect(articleCard.getByText(claimBoundary)).toBeVisible();
      await expect(articleCard.getByText(new RegExp(`Checked ${escapeRegExp(entry.reviewedAt)}`))).toBeVisible();
    }

    const finder = page.locator('#deep-dive-library');
    await finder.getByRole('searchbox', { name: /Filter deep dives/i }).fill('recommended_min_amount_in');
    await expect(page).toHaveURL(/q=recommended_min_amount_in/);
    await expect(finder.getByText('Active filters')).toBeVisible();
    await expect(finder.getByText('Search: recommended_min_amount_in')).toBeVisible();
    await expect(finder.getByText('This filtered view is reflected in the URL.')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-build-query-data')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-streaming-swaps-refunds')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-rune-settlement')).toHaveCount(0);
    await finder.getByRole('button', { name: /Reset/i }).click();
    await expect(page).toHaveURL(/\/deep-dives$/);
    await finder.getByRole('searchbox', { name: /Filter deep dives/i }).fill('archived Savers');
    await expect(page).toHaveURL(/q=archived\+Savers/);
    await expect(finder.getByText('Search: archived Savers')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-savers')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-tss')).toHaveCount(0);
    await finder.getByRole('button', { name: /Reset/i }).click();
    await finder.getByRole('button', { name: /Security & ops/i }).click();
    await expect(page).toHaveURL(/topic=security-operations/);
    await expect(finder.getByText('Topic: Security & ops')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-mimir-halt-controls')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-tss')).toBeVisible();
    await expect(finder.locator('#deep-dive-card-deep-dive-runepool-pol')).toHaveCount(0);
    await finder.getByRole('searchbox', { name: /Filter deep dives/i }).fill('recommended_min_amount_in');
    await expect(page).toHaveURL(/topic=security-operations/);
    await expect(page).toHaveURL(/q=recommended_min_amount_in/);
    await expect(finder.getByText('Search: recommended_min_amount_in')).toBeVisible();
    await expect(finder.getByText('No deep dives match "recommended_min_amount_in" inside Security & ops.')).toBeVisible();
    await finder.getByRole('button', { name: 'Reset filters', exact: true }).click();
    await expect(page).toHaveURL(/\/deep-dives$/);
    await expect(finder.getByText('Active filters')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Next Deep-Dive Backlog/i })).toHaveCount(0);

    await page.goto('/deep-dives?topic=security-operations&q=TSS');
    const hydratedFinder = page.locator('#deep-dive-library');
    await expect(hydratedFinder.getByRole('searchbox', { name: /Filter deep dives/i })).toHaveValue('TSS');
    await expect(hydratedFinder.getByText('Topic: Security & ops')).toBeVisible();
    await expect(hydratedFinder.getByText('Search: TSS')).toBeVisible();
    await expect(hydratedFinder.locator('#deep-dive-card-deep-dive-tss')).toBeVisible();
    await expect(hydratedFinder.locator('#deep-dive-card-deep-dive-clp')).toHaveCount(0);

    await page.evaluate(() => {
      window.history.pushState(window.history.state, '', '/deep-dives?q=archived%20Savers');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await expect(hydratedFinder.getByRole('searchbox', { name: /Filter deep dives/i })).toHaveValue('archived Savers');
    await expect(hydratedFinder.getByText('Search: archived Savers')).toBeVisible();
    await expect(hydratedFinder.getByText('Topic: Security & ops')).toHaveCount(0);
    await expect(hydratedFinder.locator('#deep-dive-card-deep-dive-savers')).toBeVisible();
    await expect(hydratedFinder.locator('#deep-dive-card-deep-dive-tss')).toHaveCount(0);
  });

  test('deep dive article shell exposes source posture, paths, and navigation', async ({ page, isMobile }) => {
    await page.goto('/deep-dives');
    const tssCard = page.locator('#deep-dive-card-deep-dive-tss').getByRole('link', { name: 'Threshold Signatures (TSS)', exact: true });
    await expect(tssCard).toBeVisible();
    await Promise.all([
      page.waitForURL(/\/deep-dives\/tss$/),
      tssCard.click(),
    ]);

    await expect(page.getByRole('heading', { name: /The Problem with Traditional Multisig/i })).toBeVisible();
    if (!isMobile) {
      const primaryNavigation = page.locator('nav[aria-label="Primary navigation"]');
      await expect(primaryNavigation.locator('a[href="/deep-dives"]')).toHaveCount(0);
      await expect(primaryNavigation.getByRole('button', { name: /Guides/i })).toHaveClass(/bg-accent\/10/);
    }
    await expect(page.getByText('Curated', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('THORChain Docs', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('+5 sources', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Use This Article For/i)).toBeVisible();
    await expect(page.getByText(/security explainer for threshold signing, vault-key risk, GG20 incident language/i)).toBeVisible();
    await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();
    const verifyNow = page.locator('section[aria-labelledby="deep-dive-verify-now"]');
    await expect(verifyNow.getByRole('heading', { name: /Verify Now/i })).toBeVisible();
    await expect(verifyNow.getByText(/Use these current-state checks before turning this explainer/i)).toBeVisible();
    await expect(verifyNow.getByRole('link', { name: /Network diagnostics/i }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(verifyNow.getByRole('link', { name: /Current source map/i }).first()).toHaveAttribute('href', '/docs#current-protocol-state');
    const verifyNowPrecedesArticle = await verifyNow.evaluate((section) => {
      const article = document.querySelector('article');
      return article ? Boolean(section.compareDocumentPosition(article) & 4) : false;
    });
    expect(verifyNowPrecedesArticle).toBe(true);
    await expect(page.getByRole('navigation', { name: /Table of contents/i })).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'Glossary' })).toBeVisible();
    const articlePaths = page.locator('section[aria-labelledby="article-reader-paths"]');
    await expect(articlePaths.getByRole('heading', { name: /Reader Paths For This Article/i })).toBeVisible();
    await expect(articlePaths.getByRole('link', { name: 'Network Security' })).toHaveAttribute('href', '/deep-dives#deep-dive-path-network-security');
    await expect(articlePaths.getByText(/Current signing, observation, trading/i)).toBeVisible();
    await expect(articlePaths.getByText(/Wiki reviewed 2026-07-05/i).first()).toBeVisible();
    await expect(articlePaths.getByText(/Review due 2026-08-05/i).first()).toBeVisible();
    await expect(articlePaths.getByRole('link', { name: 'Network diagnostics' }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    const networkSecurityPath = articlePaths.locator('#article-reader-path-network-security');
    await expect(networkSecurityPath.getByText('Step 2 of 5', { exact: true })).toBeVisible();
    await expect(networkSecurityPath.getByText('Continue This Path')).toBeVisible();
    await expect(networkSecurityPath.getByText(/Continue with Bifrost Bridge and Cross-Chain Observability/i)).toBeVisible();
    await expect(networkSecurityPath.getByRole('link', { name: /Previous in path Mimir And Halt Controls/i })).toHaveAttribute('href', '/deep-dives/mimir-halt-controls');
    await expect(networkSecurityPath.getByRole('link', { name: /Next in path Bifrost Bridge and Cross-Chain Observability/i })).toHaveAttribute('href', '/deep-dives/bifrost');
    const newToThorchainPath = articlePaths.locator('#article-reader-path-new-to-thorchain');
    await expect(newToThorchainPath.getByText('Step 5 of 5', { exact: true })).toBeVisible();
    await expect(newToThorchainPath.getByText('Path Follow-Ups')).toBeVisible();
    await expect(newToThorchainPath.getByText('Path complete')).toBeVisible();
    await expect(newToThorchainPath.getByRole('link', { name: 'Protocol overview' })).toHaveAttribute('href', '/protocol');
    await expect(page.getByText('Browse All Deep Dives')).toBeVisible();
    await expect(page.getByText('Article library order, separate from reader-path order.')).toBeVisible();
    await expect(page.getByText('Previous in library')).toBeVisible();
    await expect(page.getByText('Next in library')).toBeVisible();
    await expect(page.getByText(/Related Reading/i)).toBeVisible();
  });

  test('deep-dive GitHub Flavored Markdown tables render as contained tables', async ({ page, isMobile }) => {
    await page.goto('/deep-dives/midgard-thornode-data');
    const claimMatrix = page.getByRole('table').filter({ hasText: 'Swap route availability' });
    await expect(claimMatrix).toBeVisible();
    await expect(claimMatrix.getByRole('columnheader', { name: 'Claim type' })).toBeVisible();
    await expect(page.getByText(/\| Claim type \| Start with \|/)).toHaveCount(0);
    const claimMatrixScroller = claimMatrix.locator('xpath=ancestor::div[@data-layout-scroll-container="horizontal"][1]');
    await expect(claimMatrixScroller).toBeVisible();
    if (isMobile) {
      await expect.poll(async () => page.locator('body').evaluate((body) => ({
        bodyWidth: body.scrollWidth,
        viewportWidth: window.innerWidth,
      }))).toEqual(expect.objectContaining({ bodyWidth: expect.any(Number), viewportWidth: expect.any(Number) }));
      const mobileLayout = await page.locator('body').evaluate((body) => ({
        bodyWidth: body.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      expect(mobileLayout.bodyWidth).toBeLessThanOrEqual(mobileLayout.viewportWidth + 2);
      await expect.poll(async () => claimMatrixScroller.evaluate((scroller) => scroller.scrollWidth > scroller.clientWidth)).toBe(true);
    }

    await page.goto('/deep-dives/savers');
    const saversMatrix = page.getByRole('table').filter({ hasText: 'Historical Lending' });
    await expect(saversMatrix).toBeVisible();
    await expect(saversMatrix.getByRole('columnheader', { name: 'Current Wiki Wording' })).toBeVisible();
    await expect(page.getByText(/\| Topic \| Historical Lending \|/)).toHaveCount(0);
    await expect(saversMatrix.locator('xpath=ancestor::div[@data-layout-scroll-container="horizontal"][1]')).toBeVisible();
  });

  test('all deep-dive routes load with article-specific evidence boundaries', async ({ page }) => {
    test.slow();
    const routes = DEEP_DIVE_ENTRIES.map((entry) => ({
      entry,
      slug: entry.href.replace('/deep-dives/', ''),
      heading: new RegExp(escapeRegExp(entry.title), 'i'),
    }));

    for (const { entry, slug, heading } of routes) {
      await page.goto(entry.href);
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await expect(page.getByText(/Use This Article For/i)).toBeVisible();
      await expect(page.getByText(/Verify Elsewhere Before Claiming/i)).toBeVisible();

      const toc = DEEP_DIVE_TOC[entry.id] ?? [];
      if (toc.length > 0) {
        const tocNav = page.getByRole('navigation', { name: /Table of contents/i });
        await expect(tocNav).toBeVisible();
        for (const item of toc) {
          await expect(tocNav.getByRole('link', { name: item.title, exact: true })).toHaveAttribute('href', item.href);
        }
      }

      const readerPaths = DEEP_DIVE_READER_PATHS.filter((path) => path.entryIds.includes(entry.id));
      if (readerPaths.length > 0) {
        const articlePaths = page.locator('section[aria-labelledby="article-reader-paths"]');
        await expect(articlePaths).toBeVisible();
        for (const readerPath of readerPaths) {
          const readerPathCard = articlePaths.locator(`#article-reader-path-${readerPath.id}`);
          await expect(readerPathCard).toBeVisible();
          await expect(readerPathCard.getByRole('link', { name: readerPath.title, exact: true })).toHaveAttribute('href', `/deep-dives#deep-dive-path-${readerPath.id}`);
        }
      }

      if (slug === 'rune-settlement') {
        await expect(page.getByRole('heading', { name: /What The Settlement Model Proves/i })).toBeVisible();
        await expect(page.getByText(/Current RUNE price, fair value, or investment upside/i)).toBeVisible();
      }
      if (slug === 'clp') {
        await expect(page.getByRole('heading', { name: /What CLP Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Evidence Ladder/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /What To Verify Before Claiming/i })).toBeVisible();
        await expect(page.getByText(/A route is currently quoteable, executable, cheap, or safe/i)).toBeVisible();
        await expect(page.getByText(/If a statement jumps from the formula straight to a present-tense action/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Evidence Ladder/i })).toHaveAttribute('href', '#evidence-ladder');
      }
      if (slug === 'bifrost') {
        await expect(page.getByRole('heading', { name: /Chain Clients And Finality/i })).toBeVisible();
        await expect(page.getByText(/Observation is not the same thing as execution/i)).toBeVisible();
      }
      if (slug === 'churning') {
        await expect(page.getByRole('heading', { name: /Vault Migration/i })).toBeVisible();
        await expect(page.getByText(/Current churn height, active-set size/i)).toBeVisible();
      }
      if (slug === 'slashing') {
        await expect(page.getByRole('heading', { name: /Operator Evidence Ladder/i })).toBeVisible();
        await expect(page.getByText(/Do not treat "has slash points" as the same claim/i)).toBeVisible();
      }
      if (slug === 'tss') {
        await expect(page.getByRole('heading', { name: /Dated Recovery State/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /What To Verify Before Claiming/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Non-Claims/i })).toBeVisible();
        await expect(page.getByText(/recovery restored normal network operation with patched GG20-era signing/i)).toBeVisible();
        await expect(page.getByText(/Current vault safety or present availability merely because the historical v3.19.x restart completed/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /What To Verify Before Claiming/i })).toHaveAttribute('href', '#what-to-verify-before-claiming');
      }
      if (slug === 'incentive-pendulum') {
        await expect(page.getByRole('heading', { name: /What The Pendulum Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Evidence Ladder/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Common Misreadings/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /What To Verify Before Claiming/i })).toBeVisible();
        await expect(page.getByText(/Current node APY, LP APY, RUNE value/i)).toBeVisible();
        await expect(page.getByText(/Reward distribution and revenue attribution are different claims/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Evidence Ladder/i })).toHaveAttribute('href', '#evidence-ladder');
      }
      if (slug === 'savers') {
        await expect(page.getByRole('link', { name: 'TCY Recovery Timeline', exact: true }).first()).toHaveAttribute('href', '/deep-dives/tcy-recovery-timeline');
        await expect(page.getByRole('heading', { name: /What This Page Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Evidence Ladder/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Common Misreadings/i })).toBeVisible();
        await expect(page.getByText(/Savers or Lending are currently available/i)).toBeVisible();
        await expect(page.getByText(/Savers are back because TCY exists/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Evidence Ladder/i })).toHaveAttribute('href', '#evidence-ladder');
      }
      if (slug === 'app-layer') {
        await expect(page.getByRole('heading', { name: /App Layer Claim Checks/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /What This Page Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Evidence Ladder/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Common Misreadings/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Contract or app availability/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Secured asset movement/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Trade-account or arbitrage flow/i })).toBeVisible();
        await expect(page.getByText(/No global WASM halt means every contract is usable/i)).toBeVisible();
        await expect(page.getByText(/If a claim jumps from "this feature exists in docs"/i)).toBeVisible();
        await expect(page.getByText(/Do not claim: A contract, deployer, checksum, or app is safe/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /App Layer Claim Checks/i })).toHaveAttribute('href', '#app-layer-claim-checks');
        await expect(page.getByRole('link', { name: /Evidence Ladder/i })).toHaveAttribute('href', '#evidence-ladder');
      }
      if (slug === 'mimir-halt-controls') {
        await expect(page.getByRole('heading', { name: /What Mimirs Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Active, Scheduled, Inactive, Absent/i })).toBeVisible();
        await expect(page.getByText(/A missing halt key is not full proof/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Source Warnings And Review Keys/i })).toHaveAttribute('href', '#source-warnings-and-review-keys');
      }
      if (slug === 'liquidity-actions') {
        await expect(page.getByRole('heading', { name: /LP Actions Versus Swaps/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Evidence Ladder/i })).toBeVisible();
        await expect(page.getByText(/Those controls can be active while ordinary swaps continue/i)).toBeVisible();
        await expect(page.getByText(/That APY, pool depth, or 30-day earnings prove future yield/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /What To Check First/i })).toHaveAttribute('href', '#what-to-check-first');
      }
      if (slug === 'runepool-pol') {
        await expect(page.getByRole('heading', { name: /What This Page Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /RUNEPool Versus LP Positions/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Accounting Checks/i })).toBeVisible();
        await expect(page.getByText(/provider PnL, but aggregate POL exposure can include impermanent loss/i)).toBeVisible();
        await expect(page.getByText(/That RUNEPool deposits or withdrawals are currently open after the checked block/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /What This Page Can Prove/i })).toHaveAttribute('href', '#what-this-page-can-prove');
      }
      if (slug === 'midgard-thornode-data') {
        await expect(page.getByRole('heading', { name: /What This Guide Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Source Roles/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Claim-To-Source Matrix/i })).toBeVisible();
        await expect(page.getByText(/Use THORNode when the claim is about current protocol state/i)).toBeVisible();
        await expect(page.getByText(/Pool presence, 24h volume, or a healthy Midgard metrics call proves a route will quote or settle/i)).toBeVisible();
        await expect(page.getByText(/When a claim crosses rows, carry both proof paths/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /What This Guide Can Prove/i })).toHaveAttribute('href', '#what-this-guide-can-prove');
        await expect(page.getByRole('link', { name: /Claim-To-Source Matrix/i })).toHaveAttribute('href', '#claim-to-source-matrix');
        await expect(page.getByRole('link', { name: /Provider Failover And Same-Source Evidence/i })).toHaveAttribute('href', '#provider-failover-and-same-source-evidence');
      }
      if (slug === 'build-query-data') {
        await expect(page.getByRole('heading', { name: /Query Plan/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Minimum Safe Query Sequence/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Quotes, Inbound Addresses, And Caching/i })).toBeVisible();
        await expect(page.getByText(/Do not use it as transaction instructions/i)).toBeVisible();
        await expect(page.getByText(/Do not render missing money, amount, APY, fee, or bps fields as zero/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Query Plan/i })).toHaveAttribute('href', '#query-plan');
      }
      if (slug === 'streaming-swaps-refunds') {
        await expect(page.getByRole('heading', { name: /What To Check First/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Why Refunds Happen/i })).toBeVisible();
        await expect(page.getByText(/A specific refund cause without transaction-level evidence/i)).toBeVisible();
        await expect(page.getByRole('link', { name: /Memos, Limits, And Refund Addresses/i })).toHaveAttribute('href', '#memos-limits-and-refund-addresses');
      }
      if (slug === 'tcy-recovery-timeline') {
        await expect(page.getByRole('heading', { name: /What This Timeline Can Prove/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Separate Exploit Conciliation/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /What To Check Now/i })).toBeVisible();
        await expect(
          page.locator('p').filter({ hasText: /immutable v3.19.0 ADR-028 source marks the decision Accepted and specifies a one-time Migrate15to16 conciliation waterfall/i })
        ).toBeVisible();
        await expect(page.getByText(/The THORFi unwind and the May 2026 GG20\/TSS exploit conciliation are different events/i)).toBeVisible();
        await expect(page.getByText(/Full debt recovery, par redemption, or that any claimant has been made whole/i)).toBeVisible();
      }
    }
  });
});
