import { test } from '@playwright/test';
import { expectAnchorTargetVisualSafety, expectRouteVisualSafety } from './helpers/layout-safety';

const VISUAL_SAFETY_ROUTES: Array<{ path: string; heading: string | RegExp }> = [
  { path: '/', heading: /THORChain Wiki/i },
  { path: '/protocol', heading: /Protocol Overview/i },
  { path: '/network', heading: /Network & Security/i },
  { path: '/economics', heading: /Economics/i },
  { path: '/dynamic-fees', heading: /Dynamic L1 Fees/i },
  { path: '/ecosystem', heading: /Ecosystem/i },
  { path: '/governance', heading: /Governance & History/i },
  { path: '/stats', heading: /Network Statistics/i },
  { path: '/rune', heading: /RUNE/i },
  { path: '/tcy', heading: /TCY/i },
  { path: '/docs', heading: 'Source Map' },
  { path: '/glossary', heading: /Glossary/i },
  { path: '/search', heading: /Search/i },
];

const ANCHOR_TARGETS: Array<{ href: string; selector: string; settleMs?: number }> = [
  { href: '/network#network-diagnostics', selector: '#network-diagnostics' },
  { href: '/stats#stats-look-here-first', selector: '#stats-look-here-first' },
  { href: '/dynamic-fees#dynamic-fees-live', selector: '#dynamic-fees-live' },
  { href: '/rune#rune-claim-checks', selector: '#rune-claim-checks' },
  { href: '/rune#rune-number-router', selector: '#rune-number-router' },
  { href: '/tcy#tcy-current-controls', selector: '#tcy-current-controls' },
  { href: '/governance#governance-claim-checks', selector: '#governance-claim-checks' },
  { href: '/protocol#chain-catalog-boundary', selector: '#chain-catalog-boundary' },
  { href: '/network#check-a-route', selector: '#check-a-route' },
  { href: '/network?from_asset=BTC.BTC&to_asset=ETH.ETH&amount=0.01#check-a-route', selector: '#check-a-route', settleMs: 2500 },
  { href: '/protocol#chain-sol', selector: '#chain-sol' },
  { href: '/ecosystem#interface-use-checklist', selector: '#interface-use-checklist' },
  { href: '/search#search-guided-answers', selector: '#search-guided-answers' },
  { href: '/search#search-common-tasks', selector: '#search-common-tasks' },
  { href: '/docs#current-protocol-state', selector: '#current-protocol-state' },
  { href: '/docs#developer-integration', selector: '#developer-integration' },
  { href: '/docs#rune-tokenomics-and-value', selector: '#rune-tokenomics-and-value' },
  { href: '/docs#third-party-interfaces-wallets', selector: '#third-party-interfaces-wallets' },
  { href: '/governance#current-recovery', selector: '#current-recovery' },
  { href: '/glossary#glossary-definition-map', selector: '#glossary-definition-map' },
];

test.describe('THORChain Wiki Visual Safety Smoke Tests', () => {
  test('top-level routes stay visually safe on desktop and mobile', async ({ page }) => {
    test.slow();
    for (const route of VISUAL_SAFETY_ROUTES) {
      await expectRouteVisualSafety(page, route.path, route.heading);
    }
  });

  test('key decision anchors stay visually safe below the fixed header', async ({ page }) => {
    test.slow();
    for (const target of ANCHOR_TARGETS) {
      await expectAnchorTargetVisualSafety(page, target.href, target.selector, target.settleMs);
    }
  });
});
