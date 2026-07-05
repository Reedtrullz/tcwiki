import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  CHAIN_RECORDS,
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
  STATIC_DATA_LAST_UPDATED,
  TOKENOMICS_RECORDS,
} from '@/lib/data/static';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import {
  CONTENT_ENTRIES,
  DEEP_DIVE_READER_PATHS,
  FOOTER_NAV_ITEMS,
  HOME_DECISION_LINKS,
  JOURNEY_LINKS,
  SOURCE_CHOICE_DECISIONS,
  TASK_INTENT_GUIDES,
} from '@/lib/content/registry';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import type { SearchDocType } from '@/lib/search/registry';
import { recordAnchor, slugifyFragment } from '@/lib/utils';

interface AnchoredSearchExpectation {
  id: string;
  href: string;
  type: SearchDocType;
  reviewedAt?: string;
  nextReviewDue?: string;
}

function splitInternalHref(href: string) {
  const [path, anchor, ...extraFragments] = href.split('#');
  return {
    path,
    anchor,
    hasExtraFragment: extraFragments.length > 0,
  };
}

function tokenomicsRecordRoute(id: string) {
  return id === 'tcy-recovery-context' ? '/tcy' : '/rune';
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
    {
      id: 'mimir:official-halt-controls',
      href: '/network#network-diagnostics',
      type: 'mimir' as const,
    },
    ...SECURITY_INCIDENT_RECORDS.map((record) => ({
      id: `incident:${record.data.id}`,
      href: `/governance#${recordAnchor('incident', record.data.id)}`,
      type: 'incident' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...ECOSYSTEM_PROJECT_RECORDS.map((record) => ({
      id: `ecosystem:${record.data.id}`,
      href: `/ecosystem#${recordAnchor('ecosystem', record.data.id)}`,
      type: 'ecosystem' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...SOURCE_MAP_SECTION_RECORDS.map((record) => ({
      id: `source-map:${record.data.id}`,
      href: `/docs#${record.data.id}`,
      type: 'source-map' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...CHAIN_RECORDS.map((record) => ({
      id: `chain:${record.data.chain.toLowerCase()}`,
      href: `/protocol#${recordAnchor('chain', record.data.chain)}`,
      type: 'chain' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...RESEARCH_REPORT_RECORDS.map((record) => ({
      id: `research:${record.data.id}`,
      href: `/governance#${recordAnchor('research', record.data.id)}`,
      type: 'research' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...GOVERNANCE_PROPOSAL_RECORDS.map((record) => ({
      id: `governance:${record.data.id}`,
      href: `/governance#${recordAnchor('governance', record.data.id)}`,
      type: 'governance' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...PROTOCOL_MILESTONE_RECORDS.map((record) => ({
      id: `milestone:${record.data.date}:${record.data.title}`,
      href: `/governance#${recordAnchor('milestone', `${record.data.date}-${record.data.title}`)}`,
      type: 'milestone' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...TOKENOMICS_RECORDS.map((record) => ({
      id: `tokenomics:${record.data.id}`,
      href: `${tokenomicsRecordRoute(record.data.id)}#${recordAnchor('tokenomics', record.data.id)}`,
      type: 'tokenomics' as const,
      reviewedAt: record.freshness.checkedAt,
      nextReviewDue: record.freshness.nextReviewDue,
    })),
    ...GLOSSARY_TERMS.map((term) => ({
      id: `glossary:${term.id}`,
      href: `/glossary#term-${term.id}`,
      type: 'glossary' as const,
    })),
    ...TASK_INTENT_GUIDES.flatMap((guide) => {
      const { anchor } = splitInternalHref(guide.href);
      return anchor
        ? [{
            id: `task:${guide.id}`,
            href: guide.href,
            type: 'task' as const,
          }]
        : [];
    }),
    ...DEEP_DIVE_READER_PATHS.map((path) => ({
      id: `deep-dive-path:${path.id}`,
      href: `/deep-dives#deep-dive-path-${path.id}`,
      type: 'deep-dive-path' as const,
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
  for (const entry of CONTENT_ENTRIES.filter((candidate) => candidate.category === 'deep-dive')) {
    const slug = entry.href.replace('/deep-dives/', '');
    const mdxPath = join(process.cwd(), 'content/deep-dives', `${slug}.mdx`);
    if (!existsSync(mdxPath)) {
      continue;
    }
    const source = readFileSync(mdxPath, 'utf8');
    for (const match of source.matchAll(/^#{2,3}\s+(.+)$/gm)) {
      addAnchor(anchorsByRoute, entry.href, slugifyFragment(match[1]));
    }
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
    const routeDir = dirname(routePath);
    const sourcePaths = [
      routePath,
      ...readdirSync(routeDir)
        .filter((entry) => entry.endsWith('.tsx'))
        .map((entry) => join(routeDir, entry))
        .filter((entryPath) => entryPath !== routePath),
    ];
    const idPattern = /\bid\s*=\s*["']([A-Za-z0-9_-]+)["']/g;
    for (const sourcePath of sourcePaths) {
      const source = readFileSync(sourcePath, 'utf8');
      for (const match of source.matchAll(idPattern)) {
        anchors.add(match[1]);
      }
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
    expect(docsMatching('WasmPermissionless').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('HaltSecuredDeposit').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('GG20 Vault Exploit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('multi-prime modulus').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('key-sign failures').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('Keyverify').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('compromised vault exclusion').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('DKLS').some((doc) => doc.id === 'task:tss-security-claims' && doc.href === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('Schnorr').some((doc) => doc.id === 'deep-dive-path:network-security')).toBe(true);
  });

  it('does not slice curated incidents or ecosystem records', () => {
    expect(docsMatching('Post-Bybit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('SwapKit').some((doc) => doc.slug === '/ecosystem')).toBe(true);
  });

  it('indexes ecosystem interface safety guidance', () => {
    expect(docsMatching('wallet approvals').some((doc) => doc.id === 'ecosystem:thorchain-swap')).toBe(true);
    expect(docsMatching('download source').some((doc) => doc.id === 'ecosystem:asgardex')).toBe(true);
    expect(docsMatching('production readiness').some((doc) => doc.id === 'ecosystem:xchainjs')).toBe(true);
    expect(docsMatching('quote quality').some((doc) => doc.id === 'source-map:third-party-interfaces-wallets')).toBe(true);
    expect(docsMatching('official endorsement').some((doc) => doc.id === 'source-map:third-party-interfaces-wallets')).toBe(true);
  });

  it('indexes supported chains at exact protocol anchors', () => {
    const chainDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'chain');
    const sol = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:sol');
    const xrp = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:xrp');
    const base = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:base');

    expect(chainDocs).toHaveLength(CHAIN_RECORDS.length);
    expect(sol?.href).toBe('/protocol#chain-sol');
    expect(sol?.content).toContain('EdDSA');
    expect(sol?.sources.map((source) => source.label)).toContain('THORChain Exploit Report #2');
    expect(xrp?.title).toBe('XRP Ledger (XRP) supported chain');
    expect(base?.content).toContain('EIP-55');
    expect(docsMatching('SOL supported chain').some((doc) => doc.id === 'chain:sol')).toBe(true);
    expect(docsMatching('XRP Ledger').some((doc) => doc.id === 'chain:xrp')).toBe(true);
    expect(docsMatching('Base chain support').some((doc) => doc.id === 'chain:base')).toBe(true);
  });

  it('indexes tokenomics snapshots at exact source-labeled anchors', () => {
    const tokenomicsDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'tokenomics');
    const runeSupply = SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:rune-supply-framing');
    const tcyRecovery = SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:tcy-recovery-context');

    expect(tokenomicsDocs).toHaveLength(TOKENOMICS_RECORDS.length);
    expect(runeSupply?.href).toBe('/rune#tokenomics-rune-supply-framing');
    expect(runeSupply?.content).toContain('~425M and burning');
    expect(runeSupply?.content).toContain('Bond Requirement');
    expect(runeSupply?.sources.map((source) => source.label)).toContain('RUNE and TCY tokenomics');
    expect(tcyRecovery?.href).toBe('/tcy#tokenomics-tcy-recovery-context');
    expect(tcyRecovery?.confidence).toBe('needs-review');
    expect(tcyRecovery?.content).toContain('Full recovery Not guaranteed');
    expect(tcyRecovery?.sources.map((source) => source.label)).toContain('TCY Developer Guide');
    expect(docsMatching('reduced supply near 425M').some((doc) => doc.id === 'tokenomics:rune-supply-framing')).toBe(true);
    expect(docsMatching('full debt recovery is market dependent').some((doc) => doc.id === 'tokenomics:tcy-recovery-context')).toBe(true);
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
      if (expectation.reviewedAt) {
        expect(doc?.reviewedAt, `${id} reviewedAt`).toBe(expectation.reviewedAt);
      }
      if (expectation.nextReviewDue) {
        expect(doc?.nextReviewDue, `${id} nextReviewDue`).toBe(expectation.nextReviewDue);
      }
    }
  });

  it('preserves record-level freshness in search metadata', () => {
    const gg20Incident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:gg20-vault-exploit-2026');
    const olderIncident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:eth-router-1');
    const dynamicFeeSourceMap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'source-map:dynamic-fee-experiment');

    expect(gg20Incident?.reviewedAt).toBe('2026-07-04');
    expect(gg20Incident?.nextReviewDue).toBe('2026-08-04');
    expect(dynamicFeeSourceMap?.reviewedAt).toBe('2026-07-04');
    expect(dynamicFeeSourceMap?.nextReviewDue).toBe('2026-08-04');
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:rune-supply-framing')?.reviewedAt).toBe(STATIC_DATA_LAST_UPDATED);
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:tcy-recovery-context')?.nextReviewDue).toBe('2026-08-05');
    expect(olderIncident?.reviewedAt).toBe(STATIC_DATA_LAST_UPDATED);
    expect(olderIncident?.nextReviewDue).toBe('2026-07-18');
  });

  it('keeps recently reviewed route posture fresh in top-level search results', () => {
    const expectedFreshRoutes = [
      'protocol',
      'economics',
      'dynamic-fees',
      'ecosystem',
      'stats',
      'rune',
      'tcy',
      'deep-dives',
      'glossary',
      'docs',
    ];

    for (const id of expectedFreshRoutes) {
      const entry = CONTENT_ENTRIES.find((candidate) => candidate.id === id);
      const doc = SEARCH_DOCUMENTS.find((candidate) => candidate.id === id);

      expect(entry?.reviewedAt, `${id} entry reviewedAt`).toBe('2026-07-05');
      expect(entry?.nextReviewDue, `${id} entry nextReviewDue`).toBe('2026-08-05');
      expect(doc?.reviewedAt, `${id} search reviewedAt`).toBe(entry?.reviewedAt);
      expect(doc?.nextReviewDue, `${id} search nextReviewDue`).toBe(entry?.nextReviewDue);
      expect(doc?.sources.map((source) => source.label), `${id} search sources`).toEqual(entry?.sources.map((source) => source.label));
    }

    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'stats')?.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['Midgard v2 Health', 'Midgard v2 Network', 'Midgard v2 Pools', 'Midgard v2 Earnings', 'THORNode Mimir endpoint'])
    );
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem')?.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['THORChain Ecosystem', 'THORNode inbound_addresses', 'THORChain Network Halts'])
    );
  });

  it('indexes source-aware glossary terms', () => {
    const mimir = SEARCH_DOCUMENTS.find((doc) => doc.id === 'glossary:mimir');
    expect(mimir?.slug).toBe('/glossary');
    expect(mimir?.href).toBe('/glossary#term-mimir');
    expect(mimir?.type).toBe('glossary');
    expect(mimir?.confidence).toBe('official');
    expect(SEARCH_DOCUMENTS.filter((doc) => doc.type === 'glossary')).toHaveLength(GLOSSARY_TERMS.length);
    expect(docsMatching('pause-state record').some((doc) => doc.id === 'glossary:inbound-address')).toBe(true);
    expect(docsMatching('protocol messages').some((doc) => doc.id === 'glossary:memo')).toBe(true);
    expect(docsMatching('per-thorname, per-pair').some((doc) => doc.id === 'glossary:dynamic-l1-fee')).toBe(true);
    expect(docsMatching('protocol-owned liquidity').some((doc) => doc.id === 'glossary:protocol-owned-liquidity')).toBe(true);
    expect(docsMatching('pool-share accounting').some((doc) => doc.id === 'glossary:liquidity-provider')).toBe(true);
    expect(docsMatching('pool ownership share').some((doc) => doc.id === 'glossary:liquidity-units')).toBe(true);
    expect(docsMatching('one side of a pool').some((doc) => doc.id === 'glossary:asymmetric-withdrawal')).toBe(true);
    expect(docsMatching('purchasing-power risk').some((doc) => doc.id === 'glossary:impermanent-loss')).toBe(true);
    expect(docsMatching('IL protection has been removed').some((doc) => doc.id === 'glossary:impermanent-loss-protection')).toBe(true);
    expect(docsMatching('Synthetics were part of historical Savers').some((doc) => doc.id === 'glossary:synthetic-asset')).toBe(true);
    expect(docsMatching('deployer, checksum').some((doc) => doc.id === 'glossary:cosmwasm')).toBe(true);
    expect(docsMatching('threshold-signature implementation').some((doc) => doc.id === 'glossary:gg20')).toBe(true);
    expect(docsMatching('possible migration path away from GG20').some((doc) => doc.id === 'glossary:dkls')).toBe(true);
    expect(docsMatching('current vault signing has moved to Schnorr').some((doc) => doc.id === 'glossary:schnorr')).toBe(true);
    expect(docsMatching('malformed Paillier key material').some((doc) => doc.id === 'glossary:paillier')).toBe(true);
    expect(docsMatching('failed MTA rounds leaked').some((doc) => doc.id === 'glossary:mta')).toBe(true);
    expect(docsMatching('incident-root-cause vocabulary').some((doc) => doc.id === 'glossary:multi-prime-modulus')).toBe(true);
    expect(docsMatching('ordinary node flakiness').some((doc) => doc.id === 'glossary:key-sign-failures')).toBe(true);
    expect(docsMatching('compromised-vault exclusion').some((doc) => doc.id === 'glossary:compromised-vault')).toBe(true);

    for (const id of [
      'glossary:dkls',
      'glossary:schnorr',
      'glossary:paillier',
      'glossary:mta',
      'glossary:multi-prime-modulus',
      'glossary:key-sign-failures',
      'glossary:compromised-vault',
      'glossary:keyverify',
    ]) {
      const doc = SEARCH_DOCUMENTS.find((candidate) => candidate.id === id);
      expect(doc?.href, `${id} href`).toBe(`/glossary#term-${id.replace('glossary:', '')}`);
      expect(doc?.sources.map((source) => source.label), `${id} sources`).toContain('THORChain Exploit Report 2');
    }
  });

  it('indexes runtime providers and monitored Mimir control families', () => {
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'mimir:official-halt-controls')?.href).toBe('/network#network-diagnostics');
    expect(docsMatching('Liquify').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('gateway').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('current-only snapshots').some((doc) => doc.id === 'source-map:current-protocol-state')).toBe(true);
    expect(docsMatching('PauseBond').some((doc) => doc.type === 'mimir')).toBe(true);
    expect(docsMatching('RUNEPoolHaltWithdraw').some((doc) => doc.type === 'mimir')).toBe(true);
    expect(docsMatching('HaltWasmDeployer').some((doc) => doc.type === 'mimir')).toBe(true);
  });

  it('indexes task intent guides for common reader jobs', () => {
    const taskDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'task');
    const sourceChoiceDoc = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:source-choice');

    expect(taskDocs).toHaveLength(TASK_INTENT_GUIDES.length);
    expect(docsMatching('how does thorchain work').some((doc) => doc.id === 'task:learn-thorchain' && doc.href === '/deep-dives#deep-dive-path-new-to-thorchain' && doc.slug === '/deep-dives')).toBe(true);
    expect(docsMatching('getting started').some((doc) => doc.id === 'task:learn-thorchain')).toBe(true);
    expect(docsMatching('can i swap right now').some((doc) => doc.id === 'task:swap-availability' && doc.href === '/network#network-diagnostics' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('which source should i trust').some((doc) => doc.id === 'task:source-choice' && doc.href === '/docs#source-map-chooser' && doc.slug === '/docs')).toBe(true);
    expect(sourceChoiceDoc?.content).toContain('Static docs explain intended/design behavior, not proof');
    expect(sourceChoiceDoc?.content).toContain('Community material is useful context');
    expect(docsMatching('why did my swap refund').some((doc) => doc.id === 'task:swap-refund-lifecycle' && doc.href === '/deep-dives/clp#swap-lifecycle-and-refunds' && doc.slug === '/deep-dives/clp')).toBe(true);
    expect(docsMatching('stale quote minimum output').some((doc) => doc.id === 'task:swap-refund-lifecycle')).toBe(true);
    expect(docsMatching('add liquidity').some((doc) => doc.id === 'task:liquidity-actions' && doc.href === '/network#network-diagnostics' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('asymmetric withdrawal').some((doc) => doc.id === 'task:liquidity-actions')).toBe(true);
    expect(docsMatching('Midgard API').some((doc) => doc.id === 'task:build-query' && doc.href === '/docs#developer-integration' && doc.slug === '/docs')).toBe(true);
    expect(docsMatching('why paused').some((doc) => doc.id === 'task:why-paused' && doc.href === '/network#network-diagnostics' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('ADR-026').some((doc) => doc.id === 'task:fees-and-adr026' && doc.href === '/dynamic-fees#dynamic-fees-live' && doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('TCY recovery').some((doc) => doc.id === 'task:tcy-recovery' && doc.href === '/governance#current-recovery' && doc.slug === '/governance')).toBe(true);
    expect(docsMatching('choose wallet').some((doc) => doc.id === 'task:choose-interface' && doc.href === '/ecosystem#interface-use-checklist' && doc.slug === '/ecosystem')).toBe(true);
    expect(docsMatching('WASM contract').some((doc) => doc.id === 'task:app-layer-and-secured-assets' && doc.href === '/deep-dives/app-layer#what-to-verify-before-claiming' && doc.slug === '/deep-dives/app-layer')).toBe(true);

    for (const guide of TASK_INTENT_GUIDES) {
      expect(guide.sources.length, `${guide.id} sources`).toBeGreaterThan(0);
      expect(guide.searchTerms.length, `${guide.id} search terms`).toBeGreaterThan(0);
    }
  });

  it('keeps source-choice decision links pointed at valid follow-up anchors', () => {
    const anchorsByRoute = knownAnchorsByRoute();

    expect(SOURCE_CHOICE_DECISIONS.map((decision) => decision.id)).toEqual([
      'current-live-state',
      'build-or-explain-integration',
      'historical-incident-or-recovery',
      'interface-wallet-or-explorer',
      'dynamic-fee-or-revenue',
      'community-sentiment',
    ]);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.toLowerCase().includes('wallet safety'))).toBe(true);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.includes('Durable revenue lift'))).toBe(true);

    for (const decision of SOURCE_CHOICE_DECISIONS) {
      const links = [decision.startWith, ...decision.nextChecks];
      expect(decision.claim, `${decision.id} claim`).toBeTruthy();
      expect(decision.why, `${decision.id} why`).toBeTruthy();
      expect(decision.avoidClaiming, `${decision.id} avoidClaiming`).toBeTruthy();
      expect(decision.nextChecks.length, `${decision.id} next checks`).toBeGreaterThan(0);

      for (const link of links) {
        const { path, anchor, hasExtraFragment } = splitInternalHref(link.href);
        expect(hasExtraFragment, `${decision.id} ${link.href} fragment`).toBe(false);
        expect(existsSync(routePathForHref(path)), `${decision.id} ${link.href} route`).toBe(true);
        if (anchor) {
          expect(
            anchorsByRoute.get(path)?.has(anchor) || staticAnchorsForRoute(path).has(anchor),
            `${decision.id} ${link.href} anchor`
          ).toBe(true);
        }
      }
    }
  });

  it('keeps journey links routed to valid pages and anchors', () => {
    const hrefs = new Set<string>();
    const anchorsByRoute = knownAnchorsByRoute();

    expect(JOURNEY_LINKS.length).toBeGreaterThan(0);
    for (const journey of JOURNEY_LINKS) {
      expect(journey.label, `${journey.href} label`).toBeTruthy();
      expect(journey.description, `${journey.href} description`).toBeTruthy();
      expect(journey.href, `${journey.label} href`).toMatch(/^\//);
      expect(journey.href, `${journey.label} href query`).not.toContain('?');
      expect(hrefs.has(journey.href), `${journey.label} duplicate href`).toBe(false);
      hrefs.add(journey.href);

      const { path, anchor, hasExtraFragment } = splitInternalHref(journey.href);
      expect(hasExtraFragment, `${journey.label} href fragment`).toBe(false);
      expect(existsSync(routePathForHref(path)), `${journey.label} route`).toBe(true);
      if (anchor) {
        expect(
          anchorsByRoute.get(path)?.has(anchor) || staticAnchorsForRoute(path).has(anchor),
          `${journey.label} anchor ${journey.href}`
        ).toBe(true);
      }
    }
  });

  it('keeps home decision links pointed at exact live-check surfaces', () => {
    const hrefs = new Set<string>();
    const anchorsByRoute = knownAnchorsByRoute();

    expect(HOME_DECISION_LINKS.map((link) => link.href)).toEqual([
      '/network#network-diagnostics',
      '/stats#stats-look-here-first',
      '/dynamic-fees#dynamic-fees-live',
      '/ecosystem#interface-use-checklist',
    ]);

    for (const link of HOME_DECISION_LINKS) {
      expect(link.id, `${link.href} id`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(link.question, `${link.id} question`).toBeTruthy();
      expect(link.label, `${link.id} label`).toBeTruthy();
      expect(link.badge, `${link.id} badge`).toBeTruthy();
      expect(link.description, `${link.id} description`).toBeTruthy();
      expect(link.href, `${link.id} href`).toMatch(/^\//);
      expect(link.href, `${link.id} href query`).not.toContain('?');
      expect(hrefs.has(link.href), `${link.id} duplicate href`).toBe(false);
      hrefs.add(link.href);

      const { path, anchor, hasExtraFragment } = splitInternalHref(link.href);
      expect(hasExtraFragment, `${link.id} href fragment`).toBe(false);
      expect(existsSync(routePathForHref(path)), `${link.id} route`).toBe(true);
      if (anchor) {
        expect(
          anchorsByRoute.get(path)?.has(anchor) || staticAnchorsForRoute(path).has(anchor),
          `${link.id} anchor ${link.href}`
        ).toBe(true);
      }
    }
  });

  it('indexes deep-dive reader paths with source posture and exact anchors', () => {
    const pathDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'deep-dive-path');

    expect(pathDocs).toHaveLength(DEEP_DIVE_READER_PATHS.length);
    expect(docsMatching('new to thorchain').some((doc) => doc.id === 'deep-dive-path:new-to-thorchain' && doc.href === '/deep-dives#deep-dive-path-new-to-thorchain')).toBe(true);
    expect(docsMatching('swap economics').some((doc) => doc.id === 'deep-dive-path:swap-economics')).toBe(true);
    expect(docsMatching('vault safety').some((doc) => doc.id === 'deep-dive-path:network-security')).toBe(true);
    expect(docsMatching('app layer integrations').some((doc) => doc.id === 'deep-dive-path:app-layer-integrations')).toBe(true);
    expect(docsMatching('historical recovery').some((doc) => doc.id === 'deep-dive-path:historical-recovery')).toBe(true);

    for (const path of DEEP_DIVE_READER_PATHS) {
      expect(path.entryIds.length, `${path.id} entries`).toBeGreaterThan(0);
      expect(path.verifyBeforeClaiming.length, `${path.id} verification`).toBeGreaterThan(0);
      expect(path.followUpLinks.length, `${path.id} follow ups`).toBeGreaterThan(0);
      expect(path.sources.length, `${path.id} sources`).toBeGreaterThan(0);
      for (const entryId of path.entryIds) {
        expect(CONTENT_ENTRIES.some((entry) => entry.id === entryId && entry.category === 'deep-dive'), `${path.id} ${entryId}`).toBe(true);
      }
    }
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
    expect(docsMatching('wallet-security audits').some((doc) => doc.id === 'source-map:third-party-interfaces-wallets')).toBe(true);
    expect(docsMatching('not canonical protocol proof').some((doc) => doc.id === 'source-map:community-channels')).toBe(true);
  });

  it('indexes source-map decision boundaries and non-claims', () => {
    for (const record of SOURCE_MAP_SECTION_RECORDS) {
      expect(record.data.decision, `${record.data.id} decision`).toBeTruthy();
      expect(record.data.claimExamples.length, `${record.data.id} claim examples`).toBeGreaterThan(0);
      expect(record.data.nonClaims.length, `${record.data.id} non-claims`).toBeGreaterThan(0);
    }

    expect(docsMatching('current halt, pause, signing').some((doc) => doc.id === 'source-map:current-protocol-state')).toBe(true);
    expect(docsMatching('Durable historical uptime').some((doc) => doc.id === 'source-map:current-protocol-state')).toBe(true);
    expect(docsMatching('sentiment without careful sampling').some((doc) => doc.id === 'source-map:community-channels')).toBe(true);
  });

  it('keeps top-level navigation sections reachable from the footer', () => {
    const footerHrefs = new Set(FOOTER_NAV_ITEMS.map((item) => item.href));
    const topLevelNavSections = CONTENT_ENTRIES.filter((entry) => entry.nav && entry.category === 'section');

    for (const entry of topLevelNavSections) {
      expect(footerHrefs.has(entry.href), `${entry.title} footer link`).toBe(true);
    }
  });
});
