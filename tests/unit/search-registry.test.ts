import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
} from '@/lib/data/static';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { CONTENT_ENTRIES, FOOTER_NAV_ITEMS } from '@/lib/content/registry';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import type { SearchDocType } from '@/lib/search/registry';
import { recordAnchor } from '@/lib/utils';

interface AnchoredSearchExpectation {
  id: string;
  href: string;
  type: SearchDocType;
}

function splitInternalHref(href: string) {
  const [path, anchor, ...extraFragments] = href.split('#');
  return {
    path,
    anchor,
    hasExtraFragment: extraFragments.length > 0,
  };
}

function routePathForHref(href: string) {
  const { path } = splitInternalHref(href);
  if (path === '/') {
    return join(process.cwd(), 'src/app/page.tsx');
  }
  return join(process.cwd(), 'src/app', ...path.slice(1).split('/'), 'page.tsx');
}

function addAnchor(anchorsByRoute: Map<string, Set<string>>, route: string, anchor: string) {
  const anchors = anchorsByRoute.get(route) ?? new Set<string>();
  anchors.add(anchor);
  anchorsByRoute.set(route, anchors);
}

function anchoredSearchExpectations(): AnchoredSearchExpectation[] {
  return [
    ...SECURITY_INCIDENT_RECORDS.map((record) => ({
      id: `incident:${record.data.id}`,
      href: `/governance#${recordAnchor('incident', record.data.id)}`,
      type: 'incident' as const,
    })),
    ...ECOSYSTEM_PROJECT_RECORDS.map((record) => ({
      id: `ecosystem:${record.data.id}`,
      href: `/ecosystem#${recordAnchor('ecosystem', record.data.id)}`,
      type: 'ecosystem' as const,
    })),
    ...SOURCE_MAP_SECTION_RECORDS.map((record) => ({
      id: `source-map:${record.data.id}`,
      href: `/docs#${record.data.id}`,
      type: 'source-map' as const,
    })),
    ...RESEARCH_REPORT_RECORDS.map((record) => ({
      id: `research:${record.data.id}`,
      href: `/governance#${recordAnchor('research', record.data.id)}`,
      type: 'research' as const,
    })),
    ...GOVERNANCE_PROPOSAL_RECORDS.map((record) => ({
      id: `governance:${record.data.id}`,
      href: `/governance#${recordAnchor('governance', record.data.id)}`,
      type: 'governance' as const,
    })),
    ...PROTOCOL_MILESTONE_RECORDS.map((record) => ({
      id: `milestone:${record.data.date}:${record.data.title}`,
      href: `/governance#${recordAnchor('milestone', `${record.data.date}-${record.data.title}`)}`,
      type: 'milestone' as const,
    })),
    ...GLOSSARY_TERMS.map((term) => ({
      id: `glossary:${term.id}`,
      href: `/glossary#term-${term.id}`,
      type: 'glossary' as const,
    })),
  ];
}

function knownAnchorsByRoute() {
  const anchorsByRoute = new Map<string, Set<string>>();

  for (const expectation of anchoredSearchExpectations()) {
    const { path, anchor } = splitInternalHref(expectation.href);
    if (anchor) {
      addAnchor(anchorsByRoute, path, anchor);
    }
  }
  for (const term of GLOSSARY_TERMS) {
    addAnchor(anchorsByRoute, '/glossary', term.category);
  }

  return anchorsByRoute;
}

const staticAnchorCache = new Map<string, Set<string>>();

function staticAnchorsForRoute(route: string) {
  const cached = staticAnchorCache.get(route);
  if (cached) {
    return cached;
  }

  const anchors = new Set<string>();
  const routePath = routePathForHref(route);
  if (existsSync(routePath)) {
    const source = readFileSync(routePath, 'utf8');
    const idPattern = /\bid\s*=\s*["']([A-Za-z0-9_-]+)["']/g;
    for (const match of source.matchAll(idPattern)) {
      anchors.add(match[1]);
    }
  }
  staticAnchorCache.set(route, anchors);
  return anchors;
}

function docsMatching(term: string) {
  const needle = term.toLowerCase();
  return SEARCH_DOCUMENTS.filter((doc) =>
    `${doc.title} ${doc.content}`.toLowerCase().includes(needle)
  );
}

describe('SEARCH_DOCUMENTS', () => {
  it('includes deep-dive bodies and curated records', () => {
    expect(docsMatching('self-correcting').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('universal settlement').some((doc) => doc.slug === '/deep-dives/rune-settlement')).toBe(true);
    expect(docsMatching('traditional multisig').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('GG20 Vault Exploit').some((doc) => doc.slug === '/governance')).toBe(true);
  });

  it('does not slice curated incidents or ecosystem records', () => {
    expect(docsMatching('Post-Bybit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('SwapKit').some((doc) => doc.slug === '/ecosystem')).toBe(true);
  });

  it('uses stable ids even when multiple records share a slug', () => {
    const ids = new Set(SEARCH_DOCUMENTS.map((doc) => doc.id));
    expect(ids.size).toBe(SEARCH_DOCUMENTS.length);
    expect(SEARCH_DOCUMENTS.filter((doc) => doc.slug === '/governance').length).toBeGreaterThan(1);
  });

  it('keeps final search documents metadata-complete with valid internal routes', () => {
    const anchorsByRoute = knownAnchorsByRoute();

    for (const doc of SEARCH_DOCUMENTS) {
      expect(doc.id, `${doc.id} id`).toBeTruthy();
      expect(doc.slug, `${doc.id} slug`).toMatch(/^\//);
      expect(doc.href, `${doc.id} href`).toMatch(/^\//);
      expect(doc.href, `${doc.id} href`).not.toMatch(/^\/\//);
      expect(doc.href, `${doc.id} href query`).not.toContain('?');
      const { path, anchor, hasExtraFragment } = splitInternalHref(doc.href);
      expect(hasExtraFragment, `${doc.id} href fragment`).toBe(false);
      expect(existsSync(routePathForHref(path)), `${doc.id} route`).toBe(true);
      if (anchor) {
        const knownAnchors = anchorsByRoute.get(path);
        const staticAnchors = staticAnchorsForRoute(path);
        expect(
          knownAnchors?.has(anchor) || staticAnchors.has(anchor),
          `${doc.id} anchor ${doc.href}`
        ).toBe(true);
      }
      expect(doc.type, `${doc.id} type`).toBeTruthy();
      expect(doc.title, `${doc.id} title`).toBeTruthy();
      expect(doc.content, `${doc.id} content`).toBeTruthy();
      expect(doc.description, `${doc.id} description`).toBeTruthy();
      expect(doc.confidence, `${doc.id} confidence`).toBeTruthy();
      expect(doc.reviewedAt, `${doc.id} reviewedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.nextReviewDue, `${doc.id} nextReviewDue`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.nextReviewDue >= doc.reviewedAt, `${doc.id} review cadence`).toBe(true);
      expect(doc.sources.length, `${doc.id} sources`).toBeGreaterThan(0);
      expect(doc.sources.every((source) => source.label && source.url.startsWith('https://')), `${doc.id} source URLs`).toBe(true);
    }
  });

  it('lands every anchored curated record and glossary term on its exact final anchor', () => {
    const expected = new Map(anchoredSearchExpectations().map((entry) => [entry.id, entry]));
    const actualAnchoredIds = SEARCH_DOCUMENTS
      .filter((doc) => doc.href.includes('#'))
      .map((doc) => doc.id)
      .sort();

    expect(actualAnchoredIds).toEqual([...expected.keys()].sort());

    for (const [id, expectation] of expected) {
      const doc = SEARCH_DOCUMENTS.find((candidate) => candidate.id === id);
      expect(doc?.href, `${id} href`).toBe(expectation.href);
      expect(doc?.type, `${id} type`).toBe(expectation.type);
      expect(doc?.confidence, `${id} confidence`).toBeTruthy();
      expect(doc?.nextReviewDue, `${id} nextReviewDue`).toBeTruthy();
      expect(doc?.sources?.length, `${id} sources`).toBeGreaterThan(0);
    }
  });

  it('indexes source-aware glossary terms', () => {
    const mimir = SEARCH_DOCUMENTS.find((doc) => doc.id === 'glossary:mimir');
    expect(mimir?.slug).toBe('/glossary');
    expect(mimir?.href).toBe('/glossary#term-mimir');
    expect(mimir?.type).toBe('glossary');
    expect(mimir?.confidence).toBe('official');
  });

  it('indexes runtime providers and monitored Mimir control families', () => {
    expect(docsMatching('Liquify').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('gateway').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('current-only snapshots').some((doc) => doc.id === 'source-map:current-protocol-state')).toBe(true);
    expect(docsMatching('PauseBond').some((doc) => doc.type === 'mimir')).toBe(true);
    expect(docsMatching('RUNEPoolHaltWithdraw').some((doc) => doc.type === 'mimir')).toBe(true);
    expect(docsMatching('HaltWasmDeployer').some((doc) => doc.type === 'mimir')).toBe(true);
  });

  it('indexes ADR-026 dynamic fee tracker terms', () => {
    expect(docsMatching('ADR-026').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('dynamic L1 fee').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('DYNAMICFEE-WHITELIST').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('fees_tor').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('ShapeShift').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('revenue lift').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('route competitiveness').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('L1-to-L1 scope').some((doc) => doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('ADR-026 Dynamic L1 Fees').some((doc) => doc.id === 'governance:adr-026-dynamic-l1-fees')).toBe(true);
    expect(docsMatching('dynamic_l1_fees_current').some((doc) => doc.id === 'source-map:dynamic-fee-experiment')).toBe(true);
    expect(docsMatching('do not prove durable revenue lift').some((doc) => doc.id === 'source-map:dynamic-fee-experiment')).toBe(true);
    expect(docsMatching('not canonical protocol proof').some((doc) => doc.id === 'source-map:community-channels')).toBe(true);
  });

  it('keeps top-level navigation sections reachable from the footer', () => {
    const footerHrefs = new Set(FOOTER_NAV_ITEMS.map((item) => item.href));
    const topLevelNavSections = CONTENT_ENTRIES.filter((entry) => entry.nav && entry.category === 'section');

    for (const entry of topLevelNavSections) {
      expect(footerHrefs.has(entry.href), `${entry.title} footer link`).toBe(true);
    }
  });
});
