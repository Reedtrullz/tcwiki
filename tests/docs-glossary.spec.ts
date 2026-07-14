import { test, expect } from '@playwright/test';
import { GLOSSARY_DEFINITION_PATHS, GLOSSARY_TERMS } from '../src/lib/content/glossary';

const glossaryTermsById = new Map(GLOSSARY_TERMS.map((term) => [term.id, term]));
const developerTermCount = GLOSSARY_TERMS.filter((term) => term.category === 'developer').length;

test.describe('THORChain Wiki Docs And Glossary Smoke Tests', () => {
  test('docs source map routes reader jobs to the right evidence surfaces', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'Source Map', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: /What Are You Trying To Prove/i })).toBeVisible();
    const sourceMap = page.locator('#source-map-chooser');
    await expect(sourceMap).toBeVisible();
    await expect(page.getByText(/Fast Source Triage/i)).toBeVisible();
    await expect(page.getByText('Match source to claim', { exact: true })).toBeVisible();
    const fastSourceTriage = page.locator('[aria-label="Fast source triage"]');
    await expect(fastSourceTriage.getByRole('link', { name: /Current state/i })).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(fastSourceTriage.getByRole('link', { name: /Integration docs/i })).toHaveAttribute('href', '#developer-integration');
    await expect(fastSourceTriage.getByRole('link', { name: /App Layer/i })).toHaveAttribute('href', '/deep-dives/app-layer#what-to-verify-before-claiming');
    await expect(page.locator('#developer-integration').getByRole('link', { name: /Open build\/query guide/i })).toHaveAttribute('href', '/deep-dives/build-query-data#query-plan');
    await expect(fastSourceTriage.getByRole('link', { name: /Dynamic fees/i })).toHaveAttribute('href', '#dynamic-fee-experiment');
    await expect(fastSourceTriage.getByRole('link', { name: /RUNEPool\/POL/i })).toHaveAttribute('href', '/economics#runepool-pol-live');
    await expect(fastSourceTriage.getByRole('link', { name: /TCY actions/i })).toHaveAttribute('href', '/tcy#tcy-current-controls');
    await expect(fastSourceTriage.getByRole('link', { name: /RUNE numbers/i })).toHaveAttribute('href', '#rune-tokenomics-and-value');
    await expect(fastSourceTriage.getByRole('link', { name: /Third-party surfaces/i })).toHaveAttribute('href', '#third-party-interfaces-wallets');
    await expect(fastSourceTriage.getByText(/Durable revenue lift, route competitiveness, or attribution proof/i)).toBeVisible();
    await expect(fastSourceTriage.getByText(/Contract safety, wallet support, redemption capacity/i)).toBeVisible();
    await expect(fastSourceTriage.getByText(/Future yield, safety, route health/i)).toBeVisible();
    await expect(fastSourceTriage.getByText(/User eligibility, recovery value, par redemption/i)).toBeVisible();
    await expect(fastSourceTriage.getByText(/Price targets, fair value, market cap/i)).toBeVisible();
    await expect(fastSourceTriage.getByText(/Wallet safety, app uptime, endorsement, or quote quality/i)).toBeVisible();
    await expect(page.getByText(/Do not claim: Durable uptime, safety, or future availability/i)).toBeVisible();
    await expect(page.getByText(/Do not claim: Contract safety, wallet support, redemption capacity/i)).toBeVisible();
    await expect(sourceMap.getByText('Evidence packet', { exact: true }).first()).toBeVisible();
    await sourceMap.locator('details').filter({ hasText: 'Evidence packet' }).first().locator('summary').click();
    await expect(sourceMap.getByText(/THORChain Wiki source-map evidence packet/i).first()).toBeVisible();
    await expect(sourceMap.getByText(/Start with: Current Protocol State/i).first()).toBeVisible();
    await expect(sourceMap.getByText(/Source posture: official/i).first()).toBeVisible();
    await expect(sourceMap.getByText(/Checked \/ review due: 2026-07-13 \/ 2026-08-13/i).first()).toBeVisible();
    await expect(sourceMap.getByText(/Primary source: Liquify THORNode Mimir/i).first()).toBeVisible();
    await expect(sourceMap.getByText(/Do not claim from this alone: Durable uptime/i).first()).toBeVisible();
    await expect(sourceMap.getByRole('button', { name: /Copy evidence packet for Something is available/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Network diagnostics' }).first()).toHaveAttribute('href', '/network#network-diagnostics');
    await expect(page.getByRole('link', { name: /App Layer Claim Checks/i }).first()).toHaveAttribute('href', '/deep-dives/app-layer#what-to-verify-before-claiming');
    await expect(page.getByRole('link', { name: /RUNEPool\/POL snapshot Current RUNEPool accounting/i })).toHaveAttribute('href', '/economics#runepool-pol-live');
    await expect(page.getByRole('link', { name: /Current TCY controls Claim, stake/i }).first()).toHaveAttribute('href', '/tcy#tcy-current-controls');
    await expect(page.getByRole('link', { name: 'Interface checklist' }).first()).toHaveAttribute('href', '/ecosystem#interface-use-checklist');
    await expect(page.getByRole('heading', { name: /Current Protocol State/i })).toBeVisible();
    await expect(page.locator('#runepool-pol-evidence').getByText(/Current global RUNEPool value, PnL/i)).toBeVisible();
    await expect(page.locator('#runepool-pol-evidence').getByText(/does not prove future yield/i)).toBeVisible();
    await expect(page.locator('#historical-features-and-recovery').getByText(/Which current TCY controls need review/i)).toBeVisible();
    await expect(page.locator('#historical-features-and-recovery').getByText(/TCY claiming, staking, trading, distributions/i)).toBeVisible();
    await expect(page.locator('#rune-tokenomics-and-value').getByText(/RUNE Tokenomics And Value Claims/i)).toBeVisible();
    await expect(page.locator('#rune-tokenomics-and-value').getByText(/does not provide price targets/i)).toBeVisible();
    await expect(page.locator('#rune-tokenomics-and-value').getByText(/one RUNE number can be reused/i)).toBeVisible();
    await expect(page.locator('#runtime-live-data-failover')).toBeVisible();
    await expect(page.locator('#current-protocol-state').getByText(/current-only snapshots/i)).toBeVisible();
    await expect(page.getByText(/Use For Claims/i).first()).toBeVisible();
    await expect(page.getByText(/Do Not Use Alone To Claim/i).first()).toBeVisible();
  });

  test('docs source map filters claim paths and source families from the URL', async ({ page }) => {
    await page.goto('/docs?source_q=wallet%20safety&source_view=source-families#source-map-chooser');

    const sourceMap = page.locator('#source-map-chooser');
    await expect(sourceMap.getByRole('heading', { name: /What Are You Trying To Prove/i })).toBeVisible();
    const filterInput = sourceMap.getByRole('searchbox', { name: /Filter source map/i });
    await expect(filterInput).toHaveValue('wallet safety');
    await expect(sourceMap.getByLabel(/Source map view/i)).toHaveValue('source-families');
    await expect(sourceMap.getByLabel('Active source-map filters').getByText('Search: wallet safety')).toBeVisible();
    await expect(sourceMap.getByLabel('Active source-map filters').getByText('View: Source families')).toBeVisible();
    await expect(sourceMap.getByText(/Showing 0 claim paths and 2 source families after filters/i)).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /Third-Party Interfaces And Wallets/i })).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /Official Protocol Documentation/i })).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /Third-party surfaces/i })).toHaveCount(0);

    await sourceMap.getByLabel(/Source map view/i).selectOption('all');
    await expect(page).toHaveURL(/source_view=all/);
    await expect(sourceMap.getByText(/Showing 4 claim paths and 2 source families after filters/i)).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /App Layer/i }).first()).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /Third-party surfaces/i })).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /Interface checklist/i }).first()).toBeVisible();

    await filterInput.fill('martian banana');
    await expect(page).toHaveURL(/source_q=martian\+banana|source_q=martian%20banana/);
    await expect(sourceMap.getByText(/No source-map paths match "martian banana"/i)).toBeVisible();

    await sourceMap.getByRole('button', { name: /Reset source map filters/i }).click();
    await expect(page).toHaveURL(/\/docs#source-map-chooser$/);
    await expect(filterInput).toHaveValue('');
    await expect(sourceMap.getByRole('link', { name: /Current state/i })).toBeVisible();

    await page.evaluate(() => {
      window.history.pushState(window.history.state, '', '/docs?source_q=TCY&source_view=claim-paths#source-map-chooser');
      window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
    });
    await expect(filterInput).toHaveValue('TCY');
    await expect(sourceMap.getByLabel(/Source map view/i)).toHaveValue('claim-paths');
    await expect(sourceMap.getByLabel('Active source-map filters').getByText('Search: TCY')).toBeVisible();
    await expect(sourceMap.getByLabel('Active source-map filters').getByText('View: Claim paths')).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /TCY actions/i })).toBeVisible();
    await expect(sourceMap.getByRole('link', { name: /RUNE numbers/i })).toHaveCount(0);
  });

  test('glossary definition map lands every curated term chip on its exact anchor', async ({ page }) => {
    await page.goto('/glossary', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Glossary/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Definition Map/i })).toBeVisible();
    await expect(page.locator('#glossary-definition-map')).toBeVisible();
    await expect(page.locator('#glossary-definition-map').getByRole('link', { name: /Find a term/i })).toHaveAttribute('href', '#glossary-explorer');
    await expect(page.getByText(/Definitions explain vocabulary/i)).toBeVisible();
    await expect(page.getByText(/Each term card carries its own review date and source row/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Live State Terms/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Vault, Signing, And Observation Terms/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Swap And Fee Terms/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Liquidity And Pool Accounting Terms/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /App Layer And Asset Terms/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Incident And Recovery Terms/i })).toBeVisible();
    const definitionMap = page.locator('#glossary-definition-map');

    for (const path of GLOSSARY_DEFINITION_PATHS) {
      await expect(definitionMap.getByRole('link', { name: path.verifyLabel })).toHaveAttribute('href', path.verifyHref);
      for (const termId of path.termIds) {
        const term = glossaryTermsById.get(termId);
        expect(term, `${path.title} references known glossary term ${termId}`).toBeDefined();
        if (!term) {
          continue;
        }
        await expect(definitionMap.getByRole('link', { name: term.term, exact: true })).toHaveAttribute('href', `/glossary#term-${term.id}`);
      }
    }

    await expect(definitionMap.getByText(/Dated incident vocabulary is not present-day safety/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Term Finder/i })).toBeVisible();
    const filterInput = page.getByRole('searchbox', { name: /Filter glossary terms/i });
    await expect(filterInput).toBeVisible();
    await expect(page.getByText(/Searches terms, definitions, source labels, and related proof links/i)).toBeVisible();
    await expect(page.locator('#term-mimir')).toBeVisible();
    await expect(page.getByText(/Operational parameter storage/i)).toBeVisible();
    await expect(page.locator('#term-quote')).toBeVisible();
    await expect(page.locator('#term-quote-expiry')).toBeVisible();
    await expect(page.locator('#term-recommended-min-amount-in')).toBeVisible();
    await expect(page.locator('#term-refund-address')).toBeVisible();
    await expect(page.locator('#term-runepool')).toBeVisible();
    await expect(page.getByText(/aggregate exposure to POL-enabled pools/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /RUNEPool\/POL live snapshot/i }).first()).toHaveAttribute('href', '/economics#runepool-pol-live');
    await expect(page.locator('#term-tss')).toBeVisible();
    await expect(page.locator('#term-bifrost')).toBeVisible();
    await expect(page.locator('#term-liquidity-units')).toBeVisible();
    await expect(page.getByText(/does not sign, broadcast, or prove settlement/i)).toBeVisible();
    await expect(page.locator('#term-dynamic-l1-fee')).toBeVisible();
    await expect(page.locator('#term-inbound-address')).toBeVisible();
    await expect(page.getByRole('link', { name: /Dynamic-fee live tracker/i }).first()).toHaveAttribute('href', '/dynamic-fees#dynamic-fees-live');
    await expect(page.getByRole('link', { name: /Current Protocol State/i }).first()).toHaveAttribute('href', '/docs#current-protocol-state');
    await expect(page.getByRole('link', { name: /Network diagnostics/i }).first()).toHaveAttribute('href', '/network#network-diagnostics');

    await filterInput.fill('gg20');
    await expect(page).toHaveURL(/q=gg20/);
    await expect(page.getByLabel('Active glossary filters').getByText('Search: gg20')).toBeVisible();
    await expect(page.getByText('This filtered view is reflected in the URL.')).toBeVisible();
    await expect(page.locator('#term-gg20')).toBeVisible();
    await expect(page.locator('#term-mimir')).toHaveCount(0);
    await filterInput.fill('paillier');
    await expect(page).toHaveURL(/q=paillier/);
    await expect(page.locator('#term-paillier')).toBeVisible();
    await expect(page.getByText(/malformed Paillier key material/i)).toBeVisible();
    await filterInput.fill('compromised vault');
    const compromisedVaultTerm = page.locator('#term-compromised-vault');
    await expect(compromisedVaultTerm).toBeVisible();
    await expect(compromisedVaultTerm.getByText(/A vault treated as unsafe or excluded after key-compromise evidence/i)).toBeVisible();
    await filterInput.fill('quote expiry');
    await expect(page.locator('#term-quote-expiry')).toBeVisible();
    await expect(page.getByText(/valid for only ten minutes/i)).toBeVisible();
    await filterInput.fill('recommended_min_amount_in');
    await expect(page.locator('#term-recommended-min-amount-in')).toBeVisible();
    await expect(page.getByText(/not an execution guarantee/i)).toBeVisible();
    await filterInput.fill('network-diagnostics');
    await expect(page.locator('#term-quote')).toBeVisible();
    await expect(page.getByText(/short-lived THORNode simulation response/i)).toBeVisible();
    await filterInput.fill('not a thorchain term');
    await expect(page.getByText(/No glossary terms match "not a thorchain term"/i)).toBeVisible();
    await expect(page.getByText(/Try another term, source label, related page, or proof-link anchor/i)).toBeVisible();
    await page.getByRole('button', { name: /Reset filters/i }).click();
    await expect(page).toHaveURL(/\/glossary$/);
    await expect(filterInput).toHaveValue('');
    await expect(page.locator('#term-mimir')).toBeVisible();
    await page.getByRole('button', { name: /Developer/i }).click();
    await expect(page).toHaveURL(/category=developer/);
    await expect(page.getByLabel('Active glossary filters').getByText('Category: Developer')).toBeVisible();
    await expect(page.getByText(`Showing ${developerTermCount} of`, { exact: false })).toBeVisible();
    await expect(page.locator('#term-cosmwasm')).toBeVisible();
    await expect(page.locator('#term-gg20')).toHaveCount(0);
    await filterInput.fill('gg20');
    await expect(page).toHaveURL(/category=developer/);
    await expect(page).toHaveURL(/q=gg20/);
    await expect(page.getByText(/No glossary terms match "gg20" inside Developer/i)).toBeVisible();

    await page.goto('/glossary?q=quote%20expiry&category=operations');
    const hydratedInput = page.getByRole('searchbox', { name: /Filter glossary terms/i });
    await expect(hydratedInput).toHaveValue('quote expiry');
    await expect(page.getByLabel('Active glossary filters').getByText('Search: quote expiry')).toBeVisible();
    await expect(page.getByLabel('Active glossary filters').getByText('Category: Operations')).toBeVisible();
    await expect(page.locator('#term-quote-expiry')).toBeVisible();
    await expect(page.locator('#term-mimir')).toHaveCount(0);
  });
});
