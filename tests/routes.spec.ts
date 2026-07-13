import { test, expect } from '@playwright/test';
import { CONTENT_ENTRIES } from '../src/lib/content/registry';
import { publicSitemapRoutes } from '../src/lib/sitemap';
import { routeUrl } from '../src/lib/site';

test.describe('THORChain Wiki Public Route Smoke Tests', () => {
  test.describe.configure({ mode: 'serial' });

  test('normal page loads do not emit CSP reports', async ({ page }) => {
    const reports: string[] = [];
    await page.route('**/api/csp-report', async (route) => {
      reports.push(route.request().postData() ?? '<empty report body>');
      await route.fulfill({ status: 204, body: '' });
    });

    for (const { path } of publicSitemapRoutes()) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await page.waitForTimeout(250);
    }

    expect(reports).toEqual([]);
  });

  test('top-level and deep-dive routes expose route-specific metadata', async ({ page }) => {
    const metadataOverrides: Record<string, { title: string; description: string }> = {
      '/': {
        title: 'THORChain Wiki | Source-Backed Protocol Encyclopedia',
        description: 'Community-maintained THORChain protocol encyclopedia with curated context, source-backed history, and current-only Midgard and THORNode live status.',
      },
      '/search': {
        title: 'Search And Guided Answers | THORChain Wiki',
        description: 'Search source-backed THORChain wiki content or start from guided answer paths for live state, source choice, glossary terms, integrations, recovery, and protocol claims.',
      },
      '/protocol': {
        title: 'THORChain Protocol Overview | THORChain Wiki',
        description: 'Source-backed overview of THORChain architecture, native swaps, Bifrost, TSS vaults, Mimir, and supported-chain context.',
      },
      '/economics': {
        title: 'THORChain Economics | THORChain Wiki',
        description: 'Source-backed THORChain economics covering RUNE settlement, CLP pricing, fees, incentive pendulum, RUNEPool, and protocol-owned liquidity.',
      },
      '/ecosystem': {
        title: 'THORChain Ecosystem | THORChain Wiki',
        description: 'Curated THORChain ecosystem references with source confidence, chain filters, and explicit non-endorsement posture.',
      },
      '/governance': {
        title: 'THORChain Governance And History | THORChain Wiki',
        description: 'Source-backed THORChain governance records, Mimir context, milestones, incident history, recovery tracker, and research.',
      },
      '/dynamic-fees': {
        title: 'Dynamic L1 Fees | THORChain Wiki',
        description: 'Current-only tracker and source-backed explainer for THORChain ADR-026 dynamic L1 minimum fee floors by thorname and pair.',
      },
      '/docs': {
        title: 'THORChain Source Map | THORChain Wiki',
        description: 'Source map for official THORChain docs, Midgard, THORNode, developer references, analytics, and historical protocol context.',
      },
      '/deep-dives': {
        title: 'THORChain Deep Dives | THORChain Wiki',
        description: 'Long-form source-backed explainers for live data, builder query planning, CLP, liquidity actions, RUNEPool/POL evidence, swaps and refunds, Mimir halt controls, Bifrost, TSS, churning, slashing, RUNE settlement, App Layer, and historical THORFi topics.',
      },
      '/tcy': {
        title: 'TCY And THORFi History | THORChain Wiki',
        description: 'Historical, source-backed context for TCY, deprecated Savers/Lending, THORFi unwind, and recovery framing.',
      },
      '/rune': {
        title: 'RUNE | THORChain Wiki',
        description: 'Source-backed overview of RUNE as THORChain settlement, bond, liquidity, and tokenomics asset.',
      },
      '/glossary': {
        title: 'THORChain Glossary | THORChain Wiki',
        description: 'Source-aware definitions for THORChain protocol, economics, operations, developer, and historical terms.',
      },
    };

    const entriesByHref = new Map(CONTENT_ENTRIES.map((entry) => [entry.href, entry]));
    const cases = publicSitemapRoutes().map((route) => {
      const entry = entriesByHref.get(route.path);
      const override = metadataOverrides[route.path];
      const title = override?.title ?? (entry ? `${entry.title} | THORChain Wiki` : undefined);
      const description = override?.description ?? entry?.description;

      expect(title, `${route.path} must have metadata title expectation`).toBeTruthy();
      expect(description, `${route.path} must have metadata description expectation`).toBeTruthy();

      return {
        path: route.path,
        title: title as string,
        description: description as string,
        canonical: routeUrl(route.path),
      };
    });

    for (const { path, title, description, canonical } of cases) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);

      const headMetadata = await page.locator('head').evaluate((head) => ({
        alternates: Array.from(head.querySelectorAll('link[rel="alternate"]')).map((element) => ({
          href: element.getAttribute('href'),
          hrefLang: element.getAttribute('hreflang'),
        })),
        canonical: Array.from(head.querySelectorAll('link[rel="canonical"]')).map((element) => element.getAttribute('href')),
        description: Array.from(head.querySelectorAll('meta[name="description"]')).map((element) => element.getAttribute('content')),
        openGraphDescription: Array.from(head.querySelectorAll('meta[property="og:description"]')).map((element) => element.getAttribute('content')),
        openGraphTitle: Array.from(head.querySelectorAll('meta[property="og:title"]')).map((element) => element.getAttribute('content')),
        twitterDescription: Array.from(head.querySelectorAll('meta[name="twitter:description"]')).map((element) => element.getAttribute('content')),
        twitterSite: Array.from(head.querySelectorAll('meta[name="twitter:site"]')).map((element) => element.getAttribute('content')),
        twitterTitle: Array.from(head.querySelectorAll('meta[name="twitter:title"]')).map((element) => element.getAttribute('content')),
      }));

      expect(headMetadata).toEqual({
        alternates: [],
        canonical: [canonical],
        description: [description],
        openGraphDescription: [description],
        openGraphTitle: [title],
        twitterDescription: [description],
        twitterSite: [],
        twitterTitle: [title],
      });
    }
  });
});
