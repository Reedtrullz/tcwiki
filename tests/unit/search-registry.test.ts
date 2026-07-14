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
  TOKENOMICS_RECORDS,
} from '@/lib/data/static';
import { GLOSSARY_DEFINITION_PATHS, GLOSSARY_TERMS } from '@/lib/content/glossary';
import {
  CONTENT_ENTRIES,
  DEEP_DIVE_READER_PATHS,
  FOOTER_NAV_ITEMS,
  HOME_DECISION_LINKS,
  JOURNEY_LINKS,
  NAV_ITEMS,
  ROUTE_SOURCE_POSTURE_ENTRY_IDS,
  SOURCE_CHOICE_DECISIONS,
  TASK_GUIDE_GROUPED,
  TASK_INTENT_GUIDES,
} from '@/lib/content/registry';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import type { SearchDocType } from '@/lib/search/registry';
import {
  OPERATIONAL_CONTROL_CATALOG,
  REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES,
  UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES,
  operationalControlPrefixSearchKey,
} from '@/lib/operational-controls';
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

  addAnchor(anchorsByRoute, '/network', 'check-a-route');

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
    const runeSettlement = SEARCH_DOCUMENTS.find((doc) => doc.slug === '/deep-dives/rune-settlement');

    expect(docsMatching('self-correcting').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('Current node APY, LP APY, RUNE value').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('Reward distribution and revenue attribution are different claims').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('Midgard health source mismatch evidence ladder common misreadings').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('Observation is not the same thing as execution').some((doc) => doc.slug === '/deep-dives/bifrost')).toBe(true);
    expect(docsMatching('Current churn height, active set size').some((doc) => doc.slug === '/deep-dives/churning')).toBe(true);
    expect(docsMatching('bond was confiscated').some((doc) => doc.slug === '/deep-dives/slashing')).toBe(true);
    expect(docsMatching('Savers or Lending are currently available').some((doc) => doc.slug === '/deep-dives/savers')).toBe(true);
    expect(docsMatching('Savers are back because TCY exists').some((doc) => doc.slug === '/deep-dives/savers')).toBe(true);
    expect(docsMatching('Evidence Ladder').some((doc) => doc.slug === '/deep-dives/savers')).toBe(true);
    expect(docsMatching('TCYCLAIMINGHALT, TCYSTAKINGHALT').some((doc) => doc.slug === '/deep-dives/savers')).toBe(true);
    expect(docsMatching('universal settlement').some((doc) => doc.slug === '/deep-dives/rune-settlement')).toBe(true);
    expect(docsMatching('current rune price, fair value, or investment upside').some((doc) => doc.slug === '/deep-dives/rune-settlement')).toBe(true);
    expect(docsMatching('What CLP Can Prove').some((doc) => doc.slug === '/deep-dives/clp')).toBe(true);
    expect(docsMatching('If a statement jumps from the formula straight to a present tense action').some((doc) => doc.slug === '/deep-dives/clp')).toBe(true);
    expect(docsMatching('A route is currently quoteable, executable, cheap, or safe').some((doc) => doc.slug === '/deep-dives/clp')).toBe(true);
    expect(runeSettlement?.reviewedAt).toBe('2026-07-05');
    expect(runeSettlement?.nextReviewDue).toBe('2026-08-05');
    expect(runeSettlement?.sources.map((source) => source.label)).toContain('THORChain RUNE docs');
    expect(runeSettlement?.sources.map((source) => source.label)).toContain('Native cross-chain swaps');
    expect(docsMatching('Build And Query THORChain Data').some((doc) => doc.slug === '/deep-dives/build-query-data')).toBe(true);
    expect(docsMatching('Do not render missing money, amount, APY, fee, or bps fields as zero').some((doc) => doc.slug === '/deep-dives/build-query-data')).toBe(true);
    expect(docsMatching('recommended_min_amount_in').some((doc) => doc.slug === '/deep-dives/build-query-data')).toBe(true);
    expect(docsMatching('public endpoints should be treated as shared infrastructure').some((doc) => doc.slug === '/deep-dives/build-query-data')).toBe(true);
    expect(docsMatching('traditional multisig').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('WasmPermissionless').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('HaltSecuredDeposit').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('App Layer Claim Checks').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('What This Page Can Prove').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('Evidence Ladder').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('No global WASM halt means every contract is usable').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('wallet or app listing is a safety review').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('Contract or app availability').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('Secured asset movement').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('Trade account or arbitrage flow').some((doc) => doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('A missing halt key is not full proof').some((doc) => doc.slug === '/deep-dives/mimir-halt-controls')).toBe(true);
    expect(docsMatching('Source Warnings And Review Keys').some((doc) => doc.slug === '/deep-dives/mimir-halt-controls')).toBe(true);
    expect(docsMatching('HALTTRADING').some((doc) => doc.slug === '/deep-dives/mimir-halt-controls')).toBe(true);
    expect(docsMatching('LP Actions Versus Swaps').some((doc) => doc.slug === '/deep-dives/liquidity-actions')).toBe(true);
    expect(docsMatching('Those controls can be active while ordinary swaps continue').some((doc) => doc.slug === '/deep-dives/liquidity-actions')).toBe(true);
    expect(docsMatching('30 day earnings prove future yield').some((doc) => doc.slug === '/deep-dives/liquidity-actions')).toBe(true);
    expect(docsMatching('RUNEPool Versus LP Positions').some((doc) => doc.slug === '/deep-dives/runepool-pol')).toBe(true);
    expect(docsMatching('provider PnL, but aggregate POL exposure can include impermanent loss').some((doc) => doc.slug === '/deep-dives/runepool-pol')).toBe(true);
    expect(docsMatching('That RUNEPool deposits or withdrawals are currently open after the checked block').some((doc) => doc.slug === '/deep-dives/runepool-pol')).toBe(true);
    expect(docsMatching('recommended_min_amount_in').some((doc) => doc.slug === '/deep-dives/streaming-swaps-refunds')).toBe(true);
    expect(docsMatching('A specific refund cause without transaction level evidence').some((doc) => doc.slug === '/deep-dives/streaming-swaps-refunds')).toBe(true);
    expect(docsMatching('liquidity_tolerance_bps').some((doc) => doc.slug === '/deep-dives/streaming-swaps-refunds')).toBe(true);
    expect(docsMatching('1 TCY per $1 of defaulted debt').some((doc) => doc.slug === '/deep-dives/tcy-recovery-timeline')).toBe(true);
    expect(docsMatching('The THORFi unwind and the May 2026 GG20/TSS exploit conciliation are different events').some((doc) => doc.slug === '/deep-dives/tcy-recovery-timeline')).toBe(true);
    expect(docsMatching('Full debt recovery, par redemption').some((doc) => doc.slug === '/deep-dives/tcy-recovery-timeline')).toBe(true);
    expect(docsMatching('GG20 Vault Exploit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('multi-prime modulus').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('key-sign failures').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('Keyverify').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('compromised vault exclusion').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('current running release').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('Current vault safety or present availability').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('DKLS').some((doc) => doc.id === 'task:tss-security-claims' && doc.href === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('Schnorr').some((doc) => doc.id === 'deep-dive-path:network-security')).toBe(true);
  });

  it('does not slice curated incidents or ecosystem records', () => {
    expect(docsMatching('Post-Bybit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('SwapKit').some((doc) => doc.slug === '/ecosystem')).toBe(true);
  });

  it('indexes ecosystem interface safety guidance', () => {
    const thorchainSwap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem:thorchain-swap');
    const viewBlock = SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem:viewblock');
    const ecosystemDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'ecosystem');
    const ecosystemRoute = SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem');

    expect(thorchainSwap?.content).toContain('Directory posture: Catalog listed.');
    expect(thorchainSwap?.content).toContain('Source confidence: Curated.');
    expect(thorchainSwap?.content).not.toContain('Status: Active.');
    expect(viewBlock?.content).toContain('Directory posture: Needs source review.');
    expect(viewBlock?.content).toContain('Source confidence: Needs review.');
    expect(ecosystemDocs).toHaveLength(ECOSYSTEM_PROJECT_RECORDS.length);
    for (const doc of ecosystemDocs) {
      expect(doc.content, doc.id).toContain('Directory posture:');
      expect(doc.content, doc.id).toContain('Source confidence:');
      expect(doc.content, doc.id).not.toMatch(/Status: (?:Active|Needs review)\./);
    }
    expect(ecosystemRoute?.description).toContain('directory posture');
    expect(ecosystemRoute?.description).not.toContain('support status');
    expect(ecosystemRoute?.content).toContain('catalog presence directory posture');
    expect(docsMatching('wallet approvals').some((doc) => doc.id === 'ecosystem:thorchain-swap')).toBe(true);
    expect(docsMatching('download source').some((doc) => doc.id === 'ecosystem:asgardex')).toBe(true);
    expect(docsMatching('production readiness').some((doc) => doc.id === 'ecosystem:xchainjs')).toBe(true);
    expect(docsMatching('ShapeShift').some((doc) => doc.id === 'ecosystem:shapeshift')).toBe(true);
    expect(docsMatching('Vultisig').some((doc) => doc.id === 'ecosystem:vultisig')).toBe(true);
    expect(docsMatching('THORWallet').some((doc) => doc.id === 'ecosystem:thorwallet')).toBe(true);
    expect(docsMatching('Rango').some((doc) => doc.id === 'ecosystem:rango')).toBe(true);
    expect(docsMatching('Ledger RUNE').some((doc) => doc.id === 'ecosystem:ledger-rune')).toBe(true);
    expect(docsMatching('quote quality').some((doc) => doc.id === 'source-map:third-party-interfaces-wallets')).toBe(true);
    expect(docsMatching('official endorsement').some((doc) => doc.id === 'source-map:third-party-interfaces-wallets')).toBe(true);
    expect(docsMatching('interface trust journey').some((doc) => doc.id === 'ecosystem')).toBe(true);
    expect(docsMatching('choose by intent').some((doc) => doc.id === 'ecosystem')).toBe(true);
    expect(docsMatching('transaction refund evidence').some((doc) => doc.id === 'ecosystem')).toBe(true);
    expect(docsMatching('build integration').some((doc) => doc.id === 'ecosystem')).toBe(true);
    expect(docsMatching('download integrity').some((doc) => doc.id === 'ecosystem')).toBe(true);
    expect(docsMatching('quote recipient slippage').some((doc) => doc.id === 'task:choose-interface')).toBe(true);
  });

  it('indexes supported chains at exact protocol anchors', () => {
    const chainDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'chain');
    const catalogGuide = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:supported-chain-catalog');
    const sol = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:sol');
    const xrp = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:xrp');
    const base = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:base');

    expect(chainDocs).toHaveLength(CHAIN_RECORDS.length);
    expect(chainDocs.every((doc) => doc.reviewedAt === '2026-07-14')).toBe(true);
    expect(chainDocs.every((doc) => doc.nextReviewDue === '2026-08-14')).toBe(true);
    expect(chainDocs.every((doc) => (
      doc.sources.some((source) => (
        source.label === 'Liquify THORNode inbound_addresses' &&
        source.url === 'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses' &&
        source.retrievedAt === '2026-07-14' &&
        source.notes?.includes('not swap')
      ))
    ))).toBe(true);
    expect(sol?.href).toBe('/protocol#chain-sol');
    expect(sol?.content).toContain('EdDSA');
    expect(sol?.sources.map((source) => source.label)).toContain('THORChain Chain Clients');
    expect(sol?.sources.map((source) => source.label)).toContain('THORChain Exploit Report #2');
    expect(xrp?.title).toBe('XRP Ledger (XRP) supported chain');
    expect(base?.content).toContain('EIP-55');
    expect(docsMatching('SOL supported chain').some((doc) => doc.id === 'chain:sol')).toBe(true);
    expect(docsMatching('XRP Ledger').some((doc) => doc.id === 'chain:xrp')).toBe(true);
    expect(docsMatching('Base chain support').some((doc) => doc.id === 'chain:base')).toBe(true);
    expect(docsMatching('chain catalog boundary').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(docsMatching('catalog listed is not availability').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(catalogGuide?.href).toBe('/protocol#supported-chain-finder');
    expect(catalogGuide?.content).toContain('absence from this reviewed snapshot');
    expect(catalogGuide?.sources.map((source) => source.label)).toContain('THORNode inbound_addresses');
    expect(docsMatching('which chains are supported').some((doc) => doc.id === 'task:supported-chain-catalog')).toBe(true);
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
    expect(tcyRecovery?.confidence).toBe('official');
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
      for (const source of doc.sources) {
        expect(source.retrievedAt, `${doc.id} / ${source.label} retrievedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
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

    expect(gg20Incident?.reviewedAt).toBe('2026-07-13');
    expect(gg20Incident?.nextReviewDue).toBe('2026-08-13');
    expect(dynamicFeeSourceMap?.reviewedAt).toBe('2026-07-13');
    expect(dynamicFeeSourceMap?.nextReviewDue).toBe('2026-08-13');
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:rune-supply-framing')?.reviewedAt).toBe('2026-07-05');
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:tcy-recovery-context')).toEqual(
      expect.objectContaining({ confidence: 'official', reviewedAt: '2026-07-13', nextReviewDue: '2026-08-13' })
    );
    expect(olderIncident?.reviewedAt).toBe('2026-07-08');
    expect(olderIncident?.nextReviewDue).toBe('2026-08-08');
  });

  it('indexes governance recovery tracker records from record metadata', () => {
    const adr028 = SEARCH_DOCUMENTS.find((doc) => doc.id === 'governance:adr-028-recovery');

    expect(adr028?.href).toBe('/governance#governance-adr-028-recovery');
    expect(adr028).toEqual(expect.objectContaining({ confidence: 'official', reviewedAt: '2026-07-13', nextReviewDue: '2026-08-13' }));
    expect(adr028?.content).toContain('Status: Accepted; implemented in v3.19.0.');
    expect(adr028?.content).toContain('Current recovery tracker: current.');
    expect(adr028?.content).toContain('one-time conciliation migration');
    expect(adr028?.content).toContain('not proof that every loss was restored');
    expect(adr028?.sources.map(({ url }) => url)).toContain(
      'https://gitlab.com/thorchain/thornode/-/blob/v3.19.0/docs/architecture/adr-028-exploit-conciliation.md'
    );
    expect(docsMatching('ADR-028 Recovery Path').some((doc) => doc.id === 'governance:adr-028-recovery')).toBe(true);
    expect(docsMatching('Current recovery tracker: current').some((doc) => doc.id === 'governance:adr-028-recovery')).toBe(true);
    expect(docsMatching('Recovery State Matrix').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('no universal made-whole proof').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('THORFi debt unwind GG20 exploit recovery current user actions').some((doc) => doc.id === 'governance')).toBe(true);
  });

  it('keeps recently reviewed route posture fresh in top-level search results', () => {
    const expectedFreshRoutes = [
      'home',
      'protocol',
      'economics',
      'dynamic-fees',
      'ecosystem',
      'governance',
      'stats',
      'rune',
      'tcy',
      'deep-dives',
      'glossary',
      'docs',
      'search',
    ];

    for (const id of expectedFreshRoutes) {
      const entry = CONTENT_ENTRIES.find((candidate) => candidate.id === id);
      const doc = SEARCH_DOCUMENTS.find((candidate) => candidate.id === id);

      expect(entry?.reviewedAt, `${id} entry reviewedAt`).toMatch(/^2026-07-(05|06|08|09|13|14)$/);
      expect(entry?.nextReviewDue, `${id} entry nextReviewDue`).toMatch(/^2026-08-(05|06|08|09|13|14)$/);
      expect(doc?.reviewedAt, `${id} search reviewedAt`).toBe(entry?.reviewedAt);
      expect(doc?.nextReviewDue, `${id} search nextReviewDue`).toBe(entry?.nextReviewDue);
      expect(doc?.sources.map((source) => source.label), `${id} search sources`).toEqual(entry?.sources.map((source) => source.label));
    }

    expect(ROUTE_SOURCE_POSTURE_ENTRY_IDS).toContain('search');
    expect(docsMatching('start with the claim live operations snapshot').some((doc) => doc.id === 'home' && doc.href === '/')).toBe(true);
    expect(docsMatching('Search guided answers reader paths common tasks').some((doc) => doc.id === 'search' && doc.href === '/search')).toBe(true);
    expect(docsMatching('guided answers learning paths ecosystem pointer list').some((doc) => doc.id === 'home')).toBe(true);
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'home')?.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['THORChain Docs', 'THORChain Dev Docs', 'THORNode inbound_addresses', 'THORNode Mimir endpoint', 'Midgard v2 Network', 'Midgard v2 Pools'])
    );
    expect(docsMatching('protocol claim checks').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(docsMatching('current availability claim').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(docsMatching('security vault claim').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(docsMatching('developer integration claim').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(docsMatching('Check a route route quoteability').some((doc) => doc.id === 'protocol')).toBe(true);
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'stats')?.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['Liquify Midgard v2 Health', 'Liquify Midgard v2 Network', 'Liquify Midgard v2 Pools', 'Liquify Midgard v2 Earnings', 'Liquify THORNode Mimir endpoint'])
    );
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem')?.sources.map((source) => source.label)).toEqual(
      expect.arrayContaining(['THORChain Ecosystem', 'Liquify THORNode inbound_addresses', 'THORChain Network Halts'])
    );
    expect(docsMatching('economic claim checks').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('current metric claim').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('fee revenue claim').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('RUNEPool POL current snapshot read this snapshot first can I deposit').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('which value matters no yield proof').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('revenue lift route competitiveness').some((doc) => doc.id === 'economics')).toBe(true);
    expect(docsMatching('governance claim checks').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('operational Mimir claim').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('ADR proposal status').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('incident root-cause claim').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('community sentiment claim').some((doc) => doc.id === 'governance')).toBe(true);
    expect(docsMatching('App Layer contract, secured asset, trade account').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('Contract safety, wallet support, redemption capacity').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('RUNE claim checks').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('RUNE number router').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('which RUNE number').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('settlement role').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('current network number').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('minimum bond slash settings Mimir').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('value investment claim').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('fair value price target').some((doc) => doc.id === 'rune')).toBe(true);
    expect(docsMatching('definition map').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('live state terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('vault signing observation terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('swap fee terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('liquidity pool accounting terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('quote expiry recommended_min_amount_in').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('app layer asset terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('incident recovery terms').some((doc) => doc.id === 'glossary')).toBe(true);
    expect(docsMatching('recovery proof').some((doc) => doc.id === 'glossary')).toBe(true);
  });

  it('keeps every glossary term assigned to one definition-map path', () => {
    const termIds = new Set(GLOSSARY_TERMS.map((term) => term.id));
    const mappedTermIds = GLOSSARY_DEFINITION_PATHS.flatMap((path) => path.termIds);
    const duplicateMappedTermIds = mappedTermIds.filter((termId, index) => mappedTermIds.indexOf(termId) !== index);

    expect(duplicateMappedTermIds).toEqual([]);
    expect(new Set(mappedTermIds)).toEqual(termIds);

    for (const path of GLOSSARY_DEFINITION_PATHS) {
      const { path: route, anchor, hasExtraFragment } = splitInternalHref(path.verifyHref);

      expect(hasExtraFragment, `${path.title} ${path.verifyHref} fragment`).toBe(false);
      expect(existsSync(routePathForHref(route)), `${path.title} ${path.verifyHref} route`).toBe(true);
      if (anchor) {
        expect(
          knownAnchorsByRoute().get(route)?.has(anchor) || staticAnchorsForRoute(route).has(anchor),
          `${path.title} ${path.verifyHref} anchor`,
        ).toBe(true);
      }
    }
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
    expect(docsMatching('wallet instructions, settlement proof').some((doc) => doc.id === 'glossary:quote')).toBe(true);
    expect(docsMatching('Expired quotes need a fresh quote').some((doc) => doc.id === 'glossary:quote-expiry')).toBe(true);
    expect(docsMatching('current quote constraint').some((doc) => doc.id === 'glossary:recommended-min-amount-in')).toBe(true);
    expect(docsMatching('minimum amount boundary').some((doc) => doc.id === 'glossary:dust-threshold')).toBe(true);
    expect(docsMatching('specific refund cause').some((doc) => doc.id === 'glossary:refund-address')).toBe(true);
    expect(docsMatching('split execution over time').some((doc) => doc.id === 'glossary:streaming-swap')).toBe(true);
    expect(docsMatching('basis-point tolerance').some((doc) => doc.id === 'glossary:liquidity-tolerance-bps')).toBe(true);
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
    expect(docsMatching('chain-by-chain DKLS/FROST migration as future work').some((doc) => doc.id === 'glossary:dkls')).toBe(true);
    expect(docsMatching('current vault signing has moved to Schnorr/FROST').some((doc) => doc.id === 'glossary:schnorr')).toBe(true);
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
    ]) {
      const doc = SEARCH_DOCUMENTS.find((candidate) => candidate.id === id);
      expect(doc?.href, `${id} href`).toBe(`/glossary#term-${id.replace('glossary:', '')}`);
      expect(doc?.sources.map((source) => source.label), `${id} sources`).toContain('THORChain Exploit Report #2');
    }

    const keyVerify = SEARCH_DOCUMENTS.find((doc) => doc.id === 'glossary:keyverify');
    expect(keyVerify?.href).toBe('/glossary#term-keyverify');
    expect(keyVerify?.sources.map((source) => source.label)).toEqual([
      'Protocol Upgrade v3.19.0',
      'THORChain Exploit Report #2',
    ]);
  });

  it('labels the synthetic Mimir search record as a reference to current diagnostics', () => {
    const mimir = SEARCH_DOCUMENTS.find((doc) => doc.id === 'mimir:official-halt-controls');

    expect(mimir?.title).toBe('Mimir halt and enablement controls (current diagnostics)');
    expect(mimir?.description).toContain('reference');
    expect(mimir?.description).toContain('Current values and active states come from Network diagnostics');
    expect(mimir?.content).toContain('Mimir reference, not a current value');
  });

  it('indexes runtime providers and monitored Mimir control families', () => {
    const mimirDoc = SEARCH_DOCUMENTS.find((doc) => doc.id === 'mimir:official-halt-controls');

    expect(mimirDoc?.href).toBe('/network#network-diagnostics');
    expect(mimirDoc?.reviewedAt).toBe('2026-07-08');
    expect(mimirDoc?.nextReviewDue).toBe('2026-08-08');
    expect(docsMatching('Liquify').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('gateway').some((doc) => doc.slug === '/docs')).toBe(true);
    expect(docsMatching('current-only snapshots').some((doc) => doc.id === 'source-map:current-protocol-state')).toBe(true);

    for (const control of OPERATIONAL_CONTROL_CATALOG) {
      expect(mimirDoc?.content, `${control.key} exact key`).toContain(control.key);
      expect(mimirDoc?.content, `${control.key} prefix key`).toContain(operationalControlPrefixSearchKey(control.key));
      expect(mimirDoc?.content, `${control.key} label`).toContain(control.label);
      expect(mimirDoc?.content, `${control.key} area`).toContain(control.area);
      expect(docsMatching(control.key).some((doc) => doc.id === 'mimir:official-halt-controls'), `${control.key} searchable`).toBe(true);
      expect(docsMatching(control.label).some((doc) => doc.id === 'mimir:official-halt-controls'), `${control.label} searchable`).toBe(true);
    }

    for (const prefix of REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES) {
      expect(mimirDoc?.content, `${prefix} support prefix`).toContain(prefix);
      expect(docsMatching(prefix).some((doc) => doc.id === 'mimir:official-halt-controls'), `${prefix} searchable`).toBe(true);
    }

    for (const prefix of UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES) {
      expect(mimirDoc?.content, `${prefix} review prefix`).toContain(prefix);
      expect(docsMatching(prefix).some((doc) => doc.id === 'mimir:official-halt-controls'), `${prefix} searchable`).toBe(true);
    }
  });

  it('indexes task intent guides for common reader jobs', () => {
    const taskDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'task');
    const sourceChoiceDoc = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:source-choice');

    expect(taskDocs).toHaveLength(TASK_INTENT_GUIDES.length);
    expect(docsMatching('how does thorchain work').some((doc) => doc.id === 'task:learn-thorchain' && doc.href === '/deep-dives#deep-dive-path-new-to-thorchain' && doc.slug === '/deep-dives')).toBe(true);
    expect(docsMatching('getting started').some((doc) => doc.id === 'task:learn-thorchain')).toBe(true);
    expect(docsMatching('can i swap right now').some((doc) => doc.id === 'task:swap-availability' && doc.href === '/network#check-a-route' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('route available').some((doc) => doc.id === 'task:swap-availability' && doc.href === '/network#check-a-route' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('current quote').some((doc) => doc.id === 'task:swap-availability')).toBe(true);
    expect(docsMatching('can this route quote').some((doc) => doc.id === 'task:swap-availability')).toBe(true);
    expect(docsMatching('which source should i trust').some((doc) => doc.id === 'task:source-choice' && doc.href === '/docs#source-map-chooser' && doc.slug === '/docs')).toBe(true);
    expect(docsMatching('source freshness').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('stale source').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('data provenance').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('source boundary').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('page source posture').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(docsMatching('where did this number come from').some((doc) => doc.id === 'task:source-choice')).toBe(true);
    expect(sourceChoiceDoc?.content).toContain('Static docs explain intended/design behavior, not proof');
    expect(sourceChoiceDoc?.content).toContain('Community material is useful context');
    expect(docsMatching('submit proposal').some((doc) => doc.id === 'task:governance-proposals' && doc.href === '/governance#governance-proposal-status' && doc.slug === '/governance')).toBe(true);
    expect(docsMatching('proposal voting').some((doc) => doc.id === 'task:governance-proposals')).toBe(true);
    expect(docsMatching('governance claim checks').some((doc) => doc.id === 'task:governance-proposals')).toBe(true);
    expect(docsMatching('RUNE fair value').some((doc) => doc.id === 'task:rune-tokenomics' && doc.href === '/rune#rune-number-router' && doc.slug === '/rune')).toBe(true);
    expect(docsMatching('which RUNE number').some((doc) => doc.id === 'task:rune-tokenomics')).toBe(true);
    expect(docsMatching('RUNE minimum bond').some((doc) => doc.id === 'task:rune-tokenomics')).toBe(true);
    expect(docsMatching('RUNE tokenomics').some((doc) => doc.id === 'task:rune-tokenomics')).toBe(true);
    expect(docsMatching('investment suitability').some((doc) => doc.id === 'task:rune-tokenomics')).toBe(true);
    expect(docsMatching('how to buy RUNE').some((doc) => doc.id === 'task:rune-actions' && doc.href === '/rune#rune-action-router' && doc.slug === '/rune')).toBe(true);
    expect(docsMatching('where to swap RUNE').some((doc) => doc.id === 'task:rune-actions')).toBe(true);
    expect(docsMatching('can I stake RUNE').some((doc) => doc.id === 'task:rune-actions')).toBe(true);
    expect(docsMatching('RUNE holder action').some((doc) => doc.id === 'task:rune-actions')).toBe(true);
    expect(docsMatching('why did my swap refund').some((doc) => doc.id === 'task:swap-refund-lifecycle' && doc.href === '/deep-dives/streaming-swaps-refunds#what-to-check-first' && doc.slug === '/deep-dives/streaming-swaps-refunds')).toBe(true);
    expect(docsMatching('missing outbound').some((doc) => doc.id === 'task:swap-refund-lifecycle')).toBe(true);
    expect(docsMatching('stale inbound address').some((doc) => doc.id === 'task:swap-refund-lifecycle')).toBe(true);
    expect(docsMatching('stale quote minimum output').some((doc) => doc.id === 'task:swap-refund-lifecycle')).toBe(true);
    expect(docsMatching('add liquidity').some((doc) => doc.id === 'task:liquidity-actions' && doc.href === '/deep-dives/liquidity-actions#what-to-check-first' && doc.slug === '/deep-dives/liquidity-actions')).toBe(true);
    expect(docsMatching('is pool open').some((doc) => doc.id === 'task:liquidity-actions')).toBe(true);
    expect(docsMatching('LP APY safe').some((doc) => doc.id === 'task:liquidity-actions')).toBe(true);
    expect(docsMatching('asymmetric withdrawal').some((doc) => doc.id === 'task:liquidity-actions')).toBe(true);
    expect(docsMatching('RUNEPool PnL').some((doc) => doc.id === 'task:runepool-pol' && doc.href === '/economics#runepool-pol-live' && doc.slug === '/economics')).toBe(true);
    expect(docsMatching('RUNEPool live').some((doc) => doc.id === 'task:runepool-pol' && doc.href === '/economics#runepool-pol-live')).toBe(true);
    expect(docsMatching('yield proof').some((doc) => doc.id === 'task:runepool-pol')).toBe(true);
    expect(docsMatching('current inbound address').some((doc) => doc.id === 'task:build-query')).toBe(true);
    expect(docsMatching('quote cache').some((doc) => doc.id === 'task:build-query')).toBe(true);
    expect(docsMatching('Midgard API').some((doc) => doc.id === 'task:build-query' && doc.href === '/deep-dives/build-query-data#query-plan' && doc.slug === '/deep-dives/build-query-data')).toBe(true);
    expect(docsMatching('why paused').some((doc) => doc.id === 'task:why-paused' && doc.href === '/network#network-diagnostics' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('is THORChain down').some((doc) => doc.id === 'task:why-paused')).toBe(true);
    expect(docsMatching('missing Mimir key').some((doc) => doc.id === 'task:why-paused' && doc.href === '/network#network-diagnostics')).toBe(true);
    expect(docsMatching('withdraw bond').some((doc) => doc.id === 'task:node-operator-actions' && doc.href === '/network#node-operator-actions' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('HaltOperatorRotate').some((doc) => doc.id === 'task:node-operator-actions' && doc.href === '/network#node-operator-actions')).toBe(true);
    expect(docsMatching('node operator guide').some((doc) => doc.id === 'task:node-operator-guide' && doc.href === '/network#node-operator-guide' && doc.slug === '/network')).toBe(true);
    expect(docsMatching('how to run a thorchain node').some((doc) => doc.id === 'task:node-operator-guide')).toBe(true);
    expect(docsMatching('node setup').some((doc) => doc.id === 'task:node-operator-guide')).toBe(true);
    expect(docsMatching('ADR-026').some((doc) => doc.id === 'task:fees-and-adr026' && doc.href === '/dynamic-fees#dynamic-fees-live' && doc.slug === '/dynamic-fees')).toBe(true);
    expect(docsMatching('TCY recovery').some((doc) => doc.id === 'task:tcy-recovery' && doc.href === '/deep-dives/tcy-recovery-timeline#what-to-check-now' && doc.slug === '/deep-dives/tcy-recovery-timeline')).toBe(true);
    expect(docsMatching('current TCY controls').some((doc) => doc.id === 'task:tcy-current-controls' && doc.href === '/tcy#tcy-current-controls' && doc.slug === '/tcy')).toBe(true);
    expect(docsMatching('can I claim TCY').some((doc) => doc.id === 'task:tcy-current-controls')).toBe(true);
    expect(docsMatching('can I stake TCY').some((doc) => doc.id === 'task:tcy-current-controls')).toBe(true);
    expect(docsMatching('TCY distribution now').some((doc) => doc.id === 'task:tcy-current-controls')).toBe(true);
    expect(docsMatching('current TCY distribution').some((doc) => doc.id === 'task:tcy-current-controls')).toBe(true);
    expect(docsMatching('TCY trading halted').some((doc) => doc.id === 'task:tcy-current-controls')).toBe(true);
    expect(docsMatching('read these controls first claim halt check staking halt check trading halt check').some((doc) => doc.id === 'tcy' && doc.href === '/tcy')).toBe(true);
    expect(docsMatching('TCYCLAIMINGHALT').some((doc) => doc.id === 'tcy' && doc.href === '/tcy')).toBe(true);
    expect(docsMatching('HALTTCYTRADING').some((doc) => doc.id === 'tcy' && doc.href === '/tcy')).toBe(true);
    expect(docsMatching('choose wallet').some((doc) => doc.id === 'task:choose-interface' && doc.href === '/ecosystem#interface-use-checklist' && doc.slug === '/ecosystem')).toBe(true);
    expect(docsMatching('swap or quote').some((doc) => doc.id === 'task:choose-interface')).toBe(true);
    expect(docsMatching('transaction refund evidence').some((doc) => doc.id === 'task:choose-interface')).toBe(true);
    expect(docsMatching('WASM contract').some((doc) => doc.id === 'task:app-layer-and-secured-assets' && doc.href === '/deep-dives/app-layer#what-to-verify-before-claiming' && doc.slug === '/deep-dives/app-layer')).toBe(true);
    expect(docsMatching('secured asset redemption').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('secured asset deposit available').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('secured asset withdrawal halted').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('trade account deposit halted').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('is app layer available now').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('HaltWasmContract').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('TradeAccountsEnabled').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);
    expect(docsMatching('Rujira').some((doc) => doc.id === 'task:app-layer-and-secured-assets')).toBe(true);

    for (const guide of TASK_INTENT_GUIDES) {
      expect(guide.sources.length, `${guide.id} sources`).toBeGreaterThan(0);
      expect(guide.searchTerms.length, `${guide.id} search terms`).toBeGreaterThan(0);
    }
  });

  it('groups task intent guides without hiding a guide from empty-state navigation', () => {
    const groupedGuideIds = TASK_GUIDE_GROUPED.flatMap((group) => group.guides.map((guide) => guide.id));

    expect(TASK_GUIDE_GROUPED.map((group) => group.label)).toEqual([
      'Use Now',
      'Learn & Explain',
      'Build & Inspect',
      'Trust & Recovery',
    ]);
    expect(groupedGuideIds).toHaveLength(TASK_INTENT_GUIDES.length);
    expect(new Set(groupedGuideIds).size).toBe(TASK_INTENT_GUIDES.length);
    for (const guide of TASK_INTENT_GUIDES) {
      expect(groupedGuideIds, `${guide.id} is grouped`).toContain(guide.id);
    }
    expect(TASK_GUIDE_GROUPED[0]?.guides.map((guide) => guide.id)).toContain('fees-and-adr026');
    expect(TASK_GUIDE_GROUPED[0]?.guides.map((guide) => guide.id)).toContain('ordinary-fee-mechanics');
    expect(TASK_GUIDE_GROUPED[0]?.guides.map((guide) => guide.id)).toContain('node-operator-actions');
    expect(TASK_GUIDE_GROUPED[0]?.guides.find((guide) => guide.id === 'node-operator-actions')?.href).toBe('/network#node-operator-actions');
    expect(TASK_GUIDE_GROUPED[0]?.guides.map((guide) => guide.id)).toContain('runepool-pol');
    expect(TASK_GUIDE_GROUPED[0]?.guides.map((guide) => guide.id)).toContain('tcy-current-controls');
    expect(TASK_GUIDE_GROUPED.find((group) => group.id === 'trust')?.guides.map((guide) => guide.id)).toContain('governance-proposals');
  });

  it('keeps source-choice decision links pointed at valid follow-up anchors', () => {
    const anchorsByRoute = knownAnchorsByRoute();

    expect(SOURCE_CHOICE_DECISIONS.map((decision) => decision.id)).toEqual([
      'current-live-state',
      'build-or-explain-integration',
      'ordinary-fee-or-quote-limit',
      'app-contract-secured-asset',
      'historical-incident-or-recovery',
      'interface-wallet-or-explorer',
      'dynamic-fee-or-revenue',
      'rune-tokenomics-or-value',
      'community-sentiment',
    ]);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.toLowerCase().includes('wallet safety'))).toBe(true);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.includes('Durable revenue lift'))).toBe(true);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.includes('route competitiveness'))).toBe(true);
    expect(SOURCE_CHOICE_DECISIONS.some((decision) => decision.avoidClaiming.includes('Contract safety'))).toBe(true);

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
      '/network#check-a-route',
      '/stats#stats-look-here-first',
      '/dynamic-fees#dynamic-fees-live',
      '/rune#rune-number-router',
      '/economics#runepool-pol-live',
      '/tcy#tcy-current-controls',
      '/governance#governance-claim-checks',
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
    const anchorsByRoute = knownAnchorsByRoute();
    const pathDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'deep-dive-path');

    expect(pathDocs).toHaveLength(DEEP_DIVE_READER_PATHS.length);
    expect(docsMatching('new to thorchain').some((doc) => doc.id === 'deep-dive-path:new-to-thorchain' && doc.href === '/deep-dives#deep-dive-path-new-to-thorchain')).toBe(true);
    expect(docsMatching('swap economics').some((doc) => doc.id === 'deep-dive-path:swap-economics')).toBe(true);
    expect(docsMatching('build query path').some((doc) => doc.id === 'deep-dive-path:developer-data-integration' && doc.href === '/deep-dives#deep-dive-path-developer-data-integration')).toBe(true);
    expect(docsMatching('liquidity actions path').some((doc) => doc.id === 'deep-dive-path:liquidity-actions' && doc.href === '/deep-dives#deep-dive-path-liquidity-actions')).toBe(true);
    expect(docsMatching('POL accounting').some((doc) => doc.id === 'deep-dive-path:liquidity-actions')).toBe(true);
    expect(docsMatching('vault safety').some((doc) => doc.id === 'deep-dive-path:network-security')).toBe(true);
    expect(docsMatching('scheduled controls').some((doc) => doc.id === 'deep-dive-path:network-security')).toBe(true);
    expect(docsMatching('app layer integrations').some((doc) => doc.id === 'deep-dive-path:app-layer-integrations')).toBe(true);
    expect(docsMatching('historical recovery').some((doc) => doc.id === 'deep-dive-path:historical-recovery')).toBe(true);
    expect(docsMatching('Mimir halt controls').some((doc) => doc.id === 'deep-dive-mimir-halt-controls')).toBe(true);
    expect(docsMatching('what CLP can prove evidence ladder').some((doc) => doc.id === 'deep-dive-clp')).toBe(true);
    expect(docsMatching('Liquidity Actions LP actions add liquidity').some((doc) => doc.id === 'deep-dive-liquidity-actions')).toBe(true);
    expect(docsMatching('RUNEPool POL protocol owned liquidity evidence').some((doc) => doc.id === 'deep-dive-runepool-pol')).toBe(true);
    expect(docsMatching('streaming swaps refunds').some((doc) => doc.id === 'deep-dive-streaming-swaps-refunds')).toBe(true);
    expect(docsMatching('Midgard THORNode data live data guide').some((doc) => doc.id === 'deep-dive-midgard-thornode-data')).toBe(true);
    expect(docsMatching('what this guide can prove claim to source matrix').some((doc) => doc.id === 'deep-dive-midgard-thornode-data')).toBe(true);
    expect(docsMatching('Use THORNode when the claim is about current protocol state').some((doc) => doc.id === 'deep-dive-midgard-thornode-data')).toBe(true);
    expect(docsMatching('Pool presence, 24h volume, or a healthy Midgard metrics call proves a route will quote').some((doc) => doc.id === 'deep-dive-midgard-thornode-data')).toBe(true);
    expect(docsMatching('provider failover same-provider evidence').some((doc) => doc.id === 'deep-dive-midgard-thornode-data')).toBe(true);
    expect(docsMatching('TCY recovery timeline').some((doc) => doc.id === 'deep-dive-tcy-recovery-timeline')).toBe(true);

    const bifrost = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-bifrost');
    const churning = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-churning');
    const slashing = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-slashing');
    for (const doc of [bifrost, churning, slashing]) {
      expect(doc?.reviewedAt, doc?.id).toBe('2026-07-14');
      expect(doc?.nextReviewDue, doc?.id).toBe('2026-08-14');
    }
    expect(bifrost?.content).toContain('Active and Retiring vaults');
    expect(bifrost?.content).toContain('67%');
    expect(bifrost?.content).toContain('Never send funds to a retired or inactive vault address');
    expect(churning?.content).toContain('Whitelisted → Standby → Ready → Active');
    expect(churning?.content).toContain('Only a Standby node outside vault migration may unbond');
    expect(churning?.content).not.toContain('Whitelisted → Ready → Standby');
    expect(slashing?.content).toContain('Double block signing adds slash points');
    expect(slashing?.content).toContain('does not by itself prove a bond principal slash');
    expect(slashing?.content).not.toContain('Consensus faults: Double signing or equivocation can put bond at risk');

    for (const path of DEEP_DIVE_READER_PATHS) {
      expect(path.entryIds.length, `${path.id} entries`).toBeGreaterThan(0);
      expect(path.verifyBeforeClaiming.length, `${path.id} verification`).toBeGreaterThan(0);
      expect(path.followUpLinks.length, `${path.id} follow ups`).toBeGreaterThan(0);
      expect(path.sources.length, `${path.id} sources`).toBeGreaterThan(0);
      for (const entryId of path.entryIds) {
        expect(CONTENT_ENTRIES.some((entry) => entry.id === entryId && entry.category === 'deep-dive'), `${path.id} ${entryId}`).toBe(true);
      }
      for (const link of path.followUpLinks) {
        const { path: route, anchor, hasExtraFragment } = splitInternalHref(link.href);
        expect(hasExtraFragment, `${path.id} ${link.href} fragment`).toBe(false);
        expect(existsSync(routePathForHref(route)), `${path.id} ${link.href} route`).toBe(true);
        if (anchor) {
          expect(
            anchorsByRoute.get(route)?.has(anchor) || staticAnchorsForRoute(route).has(anchor),
            `${path.id} ${link.href} anchor`
          ).toBe(true);
        }
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
    expect(SEARCH_DOCUMENTS.find((doc) => doc.id === 'governance:adr-026-dynamic-l1-fees')?.nextReviewDue).toBe('2026-08-08');
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
    expect(docsMatching('Provider health, sync, lag').some((doc) => doc.id === 'source-map:runtime-live-data-failover')).toBe(true);
    expect(docsMatching('RUNEPool accounting, POL scope').some((doc) => doc.id === 'source-map:runepool-pol-evidence')).toBe(true);
    expect(docsMatching('Current global RUNEPool value, PnL').some((doc) => doc.id === 'source-map:runepool-pol-evidence')).toBe(true);
    expect(docsMatching('does not prove future yield').some((doc) => doc.id === 'source-map:runepool-pol-evidence')).toBe(true);
    expect(docsMatching('Which source family should back a RUNE number').some((doc) => doc.id === 'source-map:rune-tokenomics-and-value')).toBe(true);
    expect(docsMatching('security constant, or value claim').some((doc) => doc.id === 'source-map:rune-tokenomics-and-value')).toBe(true);
    expect(docsMatching('price targets, fair-value models').some((doc) => doc.id === 'source-map:rune-tokenomics-and-value')).toBe(true);
    expect(docsMatching('market-cap proof, exchange float').some((doc) => doc.id === 'source-map:rune-tokenomics-and-value')).toBe(true);
    expect(docsMatching('minimum bond or slash settings').some((doc) => doc.id === 'source-map:rune-tokenomics-and-value')).toBe(true);
    expect(docsMatching('Which current TCY controls need review before making claim').some((doc) => doc.id === 'source-map:historical-features-and-recovery')).toBe(true);
    expect(docsMatching('TCY claiming, staking, trading, distributions').some((doc) => doc.id === 'source-map:historical-features-and-recovery')).toBe(true);
    expect(docsMatching('sentiment without careful sampling').some((doc) => doc.id === 'source-map:community-channels')).toBe(true);
    expect(docsMatching('fast source triage').some((doc) => doc.id === 'docs')).toBe(true);
    expect(docsMatching('match source to claim').some((doc) => doc.id === 'task:source-choice')).toBe(true);
  });

  it('keeps top-level navigation sections reachable from the footer', () => {
    const footerHrefs = new Set(FOOTER_NAV_ITEMS.map((item) => item.href));
    const topLevelNavSections = CONTENT_ENTRIES.filter((entry) => entry.nav && entry.category === 'section');

    for (const entry of topLevelNavSections) {
      expect(footerHrefs.has(entry.href), `${entry.title} footer link`).toBe(true);
    }
  });

  it('keeps Search discoverable as a top-level guided-answer surface', () => {
    expect(NAV_ITEMS).toContainEqual({ name: 'Search', href: '/search' });
    expect(FOOTER_NAV_ITEMS).toContainEqual({ label: 'Search', href: '/search' });
    expect(FOOTER_NAV_ITEMS).not.toContainEqual({ label: 'Search And Guided Answers', href: '/search' });
  });
});
