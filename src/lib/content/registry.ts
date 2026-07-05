import { DataConfidence, SourceMeta } from '@/lib/types';
import { slugifyFragment } from '@/lib/utils';

export interface ContentEntry {
  id: string;
  title: string;
  href: string;
  category: 'section' | 'deep-dive' | 'resource';
  confidence: DataConfidence;
  description: string;
  body: string;
  tags: string[];
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  nav?: boolean;
  footer?: boolean;
  featured?: boolean;
}

export interface JourneyLink {
  label: string;
  href: string;
  description: string;
}

export interface TaskIntentGuide {
  id: string;
  label: string;
  question: string;
  href: string;
  description: string;
  searchTerms: string[];
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
}

export interface HomeDecisionLink {
  id: string;
  question: string;
  label: string;
  href: string;
  badge: string;
  description: string;
}

export interface SourceChoiceDecision {
  id: string;
  claim: string;
  startWith: {
    label: string;
    href: string;
  };
  why: string;
  nextChecks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  avoidClaiming: string;
}

export interface DeepDiveTocItem {
  title: string;
  href: string;
}

export interface DeepDiveReaderPath {
  id: string;
  title: string;
  audience: string;
  description: string;
  entryIds: string[];
  verifyBeforeClaiming: string[];
  followUpLinks: Array<{
    label: string;
    href: string;
    description: string;
  }>;
  searchTerms: string[];
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
}

const docsSource: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
};

const devDocsSource: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
};

const adr026DynamicFeesSource: SourceMeta = {
  label: 'ADR-026 dynamic L1 fee model',
  url: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
};

const feesSource: SourceMeta = {
  label: 'THORChain fees developer docs',
  url: 'https://dev.thorchain.org/concepts/fees.html',
};

const thornameGuideSource: SourceMeta = {
  label: 'THORName affiliate guide',
  url: 'https://dev.thorchain.org/affiliate-guide/thorname-guide.html',
};

const dynamicL1FeesSource: SourceMeta = {
  label: 'THORNode dynamic_l1_fees',
  url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees',
  notes: 'Current-only sealed dynamic L1 fee records.',
};

const dynamicL1FeesCurrentSource: SourceMeta = {
  label: 'THORNode dynamic_l1_fees_current',
  url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees_current',
  notes: 'Current-only in-progress epoch accumulators.',
};

const tokenomicsSource: SourceMeta = {
  label: 'RUNE and TCY tokenomics',
  url: 'https://docs.thorchain.org/tokenomics-rune-tcy',
};

const networkHaltsSource: SourceMeta = {
  label: 'THORChain Network Halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
};

const liveInboundSource: SourceMeta = {
  label: 'THORNode inbound_addresses',
  url: 'https://thornode.thorchain.network/thorchain/inbound_addresses',
  notes: 'Current-only chain availability, router, halt, and inbound-address snapshot.',
};

const thornodeMimirSource: SourceMeta = {
  label: 'THORNode Mimir endpoint',
  url: 'https://thornode.thorchain.network/thorchain/mimir',
  notes: 'Current-only operational controls.',
};

const midgardHealthSource: SourceMeta = {
  label: 'Midgard v2 Health',
  url: 'https://midgard.thorchain.network/v2/health',
  notes: 'Current-only Midgard sync and lag health for rendered live metrics.',
};

const midgardNetworkSource: SourceMeta = {
  label: 'Midgard v2 Network',
  url: 'https://midgard.thorchain.network/v2/network',
  notes: 'Current-only network totals; pair with visible source freshness before treating values as live.',
};

const midgardEarningsSource: SourceMeta = {
  label: 'Midgard v2 Earnings',
  url: 'https://midgard.thorchain.network/v2/history/earnings',
  notes: 'Current-only historical intervals as returned by Midgard, not protocol revenue attribution proof.',
};

const ecosystemSource: SourceMeta = {
  label: 'THORChain Ecosystem',
  url: 'https://docs.thorchain.org/ecosystem',
};

const exploitReportSource: SourceMeta = {
  label: 'THORChain Exploit Report #1',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-1',
};

const exploitReport2Source: SourceMeta = {
  label: 'THORChain Exploit Report #2',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-2',
  retrievedAt: '2026-07-04',
  notes: 'Official root-cause report for the May 2026 GG20/TSS vault exploit.',
};

const protocolUpgradeV319Source: SourceMeta = {
  label: 'Protocol Upgrade v3.19.0',
  url: 'https://blog.thorchain.org/protocol-upgrade-v3-19-0',
  retrievedAt: '2026-07-04',
  notes: 'Official release summary for the post-exploit restart and recovery/security patch set.',
};

const asgardTssChurnSource: SourceMeta = {
  label: 'Under the Hood: Asgard Vaults, TSS and Node Churns',
  url: 'https://blog.thorchain.org/under-the-hood-asgard-vaults-tss-and-node-churns',
  retrievedAt: '2026-07-04',
  notes: 'Historical educational explainer for Asgard vault, TSS, and churn mechanics.',
};

const archivedSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
};

export const CONTENT_ENTRIES: ContentEntry[] = [
  {
    id: 'protocol',
    title: 'Protocol',
    href: '/protocol',
    category: 'section',
    confidence: 'curated',
    description: 'Architecture, swaps, TSS, Bifrost, Mimir, halts, app layer, and supported chains.',
    body: 'THORChain protocol architecture native cross-chain swaps Bifrost observers TSS vaults Mimir halts inbound addresses refunds streaming swaps StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit app layer CosmWasm.',
    tags: ['architecture', 'swaps', 'mimir', 'halts'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource, liveInboundSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'network',
    title: 'Network',
    href: '/network',
    category: 'section',
    confidence: 'curated',
    description: 'Node lifecycle, churning, slashing, vault security, and live operational state.',
    body: 'Network security nodes churning slashing GG20 TSS DKLS Schnorr signer key-sign failures MTA Paillier vault solvency KeyVerify compromised vault exclusion current-only status official halt keys HALTTRADING HALTSIGNING HALTCHURNING HALTWASMGLOBAL StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit memoless halt streaming swap pause RUNEPool deposit halt.',
    tags: ['nodes', 'security', 'slashing', 'churning'],
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, networkHaltsSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'economics',
    title: 'Economics',
    href: '/economics',
    category: 'section',
    confidence: 'curated',
    description: 'RUNE settlement, CLP pricing, fees, incentive pendulum, RUNEPool, POL, and trade assets.',
    body: 'RUNE settlement asset CLP slip ratio liquidity fee affiliate fee outbound fee incentive pendulum RUNEPool protocol owned liquidity trade assets secured assets liquidity units APY.',
    tags: ['rune', 'clp', 'fees', 'runepool'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, tokenomicsSource, feesSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'dynamic-fees',
    title: 'Dynamic Fees',
    href: '/dynamic-fees',
    category: 'section',
    confidence: 'curated',
    description: 'ADR-026 dynamic L1 minimum fee experiment, live whitelisted thorname records, and current-only THORNode tracker.',
    body: 'ADR-026 dynamic L1 fee dynamic fee model L1DynamicFeeEnabled L1SlipMinBPS DYNAMICFEE-WHITELIST dynamic_l1_fees dynamic_l1_fees_current thorname pair fees_tor volume_tor Symbiosis ShapeShift ss whitelist monitor active affiliate_bps current-only THORNode sealed records epoch accumulators revenue gradient TOR L1-to-L1 scope revenue lift route competitiveness partner attribution evidence boundary non-claims.',
    tags: ['fees', 'adr', 'mimir', 'thornode', 'thorname'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [adr026DynamicFeesSource, feesSource, thornameGuideSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'ecosystem',
    title: 'Ecosystem',
    href: '/ecosystem',
    category: 'section',
    confidence: 'curated',
    description: 'Interfaces, wallets, explorers, developer tools, and chain support status with explicit non-endorsement checks.',
    body: 'THORChain ecosystem interfaces wallets explorers THORSwap AsgardEX RuneScan SwapKit XChainJS supported chains inbound addresses TRON SOL XRP use for check before use wallet safety live status source map non-endorsement third-party availability route safety package versions.',
    tags: ['apps', 'interfaces', 'wallets', 'chains'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [ecosystemSource, docsSource, devDocsSource, liveInboundSource, networkHaltsSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'governance',
    title: 'Governance',
    href: '/governance',
    category: 'section',
    confidence: 'curated',
    description: 'ADRs, operational Mimir, incidents, milestones, and sourced research.',
    body: 'Governance ADR Mimir halt trading halt signing pause LP incidents exploit GG20 Paillier MTA key-sign failures THORFi unwind TCY recovery source-backed history.',
    tags: ['governance', 'incidents', 'mimir', 'adr'],
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, networkHaltsSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'stats',
    title: 'Statistics',
    href: '/stats',
    category: 'section',
    confidence: 'curated',
    description: 'Current-only Midgard metrics and THORNode operational status.',
    body: 'Network statistics live Midgard current-only source-backed pooled RUNE bonding APY active nodes reserve earnings history degraded data source did not respond.',
    tags: ['stats', 'midgard', 'thornode', 'live'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [midgardHealthSource, midgardNetworkSource, midgardEarningsSource, thornodeMimirSource, devDocsSource],
    nav: true,
    footer: true,
  },
  {
    id: 'rune',
    title: 'RUNE',
    href: '/rune',
    category: 'section',
    confidence: 'curated',
    description: 'Native settlement, bond, and liquidity asset for THORChain.',
    body: 'RUNE token settlement asset security bond liquidity pair tokenomics current supply framing reduced supply circulating supply reserve burns TCY recovery protocol owned liquidity.',
    tags: ['rune', 'tokenomics'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, tokenomicsSource, devDocsSource],
    nav: true,
    footer: true,
  },
  {
    id: 'tcy',
    title: 'TCY',
    href: '/tcy',
    category: 'section',
    confidence: 'historical',
    description: 'Historical THORFi unwind, deprecated Savers/Lending, and TCY recovery framing.',
    body: 'TCY THORFi unwind Savers deprecated Lending deprecated archived January 2025 historical yield liabilities recovery.',
    tags: ['tcy', 'savers', 'lending', 'historical'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [archivedSource, docsSource, tokenomicsSource, exploitReportSource],
    nav: true,
    footer: true,
  },
  {
    id: 'deep-dives',
    title: 'Deep Dives',
    href: '/deep-dives',
    category: 'section',
    confidence: 'curated',
    description: 'Long-form explainers for core THORChain concepts.',
    body: 'Deep dives CLP Bifrost TSS churning slashing incentive pendulum RUNE settlement Savers historical halt Mimir swap lifecycle.',
    tags: ['deep-dives', 'education'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, archivedSource, asgardTssChurnSource, exploitReport2Source],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'glossary',
    title: 'Glossary',
    href: '/glossary',
    category: 'resource',
    confidence: 'curated',
    description: 'Source-aware definitions for THORChain protocol, economics, operations, and historical terms.',
    body: 'Glossary definitions Mimir Mimir override inbound address memo outbound fee affiliate fee dynamic L1 fee ADR-026 protocol-owned liquidity POL liquidity provider liquidity units asymmetric withdrawal secured asset trade asset App Layer CosmWasm Current-only CLP TSS GG20 KeyVerify Bifrost RUNEPool Savers TCY Asgard vault protocol economics operations history developer terminology.',
    tags: ['glossary', 'terms', 'definitions'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource, adr026DynamicFeesSource, exploitReport2Source],
    footer: true,
  },
  {
    id: 'docs',
    title: 'Docs',
    href: '/docs',
    category: 'resource',
    confidence: 'curated',
    description: 'Official documentation, developer resources, and live API references.',
    body: 'Official THORChain docs developer docs Midgard API THORNode API network halts Mimir halt keys StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit RUNEPoolHaltWithdraw querying inbound addresses fees Liquify Midgard Gateway Liquify THORNode Gateway gateway failover source map RuneScan ViewBlock Messari GitHub.',
    tags: ['docs', 'resources', 'midgard', 'thornode', 'liquify', 'gateway'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource, midgardHealthSource, midgardNetworkSource, thornodeMimirSource],
    nav: true,
    footer: true,
  },
  {
    id: 'deep-dive-clp',
    title: 'Continuous Liquidity Pools (CLP)',
    href: '/deep-dives/clp',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How THORChain slip-based pools enable native swaps without order books or wrapped assets.',
    body: 'Continuous Liquidity Pools CLP slip ratio x divided by X plus x liquidity fee output amount RUNE paired pools slippage liquidity providers native cross-chain swaps. Savers are historical and deprecated.',
    tags: ['clp', 'fees', 'swaps'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource, devDocsSource],
    featured: true,
  },
  {
    id: 'deep-dive-incentive-pendulum',
    title: 'The Incentive Pendulum',
    href: '/deep-dives/incentive-pendulum',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Automatic balancing between node bond security and pooled liquidity.',
    body: 'Incentive Pendulum bonded RUNE pooled RUNE rewards node operators liquidity providers security liquidity ratio self-correcting.',
    tags: ['economics', 'rewards'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource],
    featured: true,
  },
  {
    id: 'deep-dive-tss',
    title: 'Threshold Signatures (TSS)',
    href: '/deep-dives/tss',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How distributed signing protects cross-chain vault keys and why GG20, DKLS, Paillier, and key-sign failure wording must be source-backed.',
    body: 'Threshold Signature Scheme TSS Asgard vault node churn GG20 DKLS Schnorr Paillier multi-prime modulus MTA round key-sign failures vault key shares signing ceremony exploit May 2026 solvency checker halt signing KeyVerify compromised vault exclusion pause safety Solana EdDSA not exposed v3.19.0 v3.19.1.',
    tags: ['tss', 'security', 'vaults'],
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, asgardTssChurnSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
    featured: true,
  },
  {
    id: 'deep-dive-churning',
    title: 'Churning and Node Lifecycle',
    href: '/deep-dives/churning',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Validator rotation, node lifecycle, standby competition, and key rotation.',
    body: 'Churning node lifecycle active standby ready whitelisted churn interval vault rotation unbonding forced churn slash points.',
    tags: ['nodes', 'churning'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-slashing',
    title: 'Slashing and Economic Security',
    href: '/deep-dives/slashing',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Bonded RUNE, slash exposure, and why current constants should be source checked.',
    body: 'Slashing economic security bonded RUNE slash points signing observation failures constants Mimir current-only.',
    tags: ['security', 'slashing'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource, devDocsSource],
  },
  {
    id: 'deep-dive-bifrost',
    title: 'Bifrost Bridge and Cross-Chain Observability',
    href: '/deep-dives/bifrost',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How active nodes observe external chains and reach consensus on events.',
    body: 'Bifrost observers external chains inbound transactions outbound confirmations chain reorgs finality two thirds observation.',
    tags: ['bifrost', 'observation'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-rune-settlement',
    title: 'RUNE as the Universal Settlement Asset',
    href: '/deep-dives/rune-settlement',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Why every external-asset swap routes through RUNE liquidity.',
    body: 'RUNE settlement universal settlement asset BTC RUNE ETH pool pairs unified liquidity price discovery security bond liquidity pair.',
    tags: ['rune', 'settlement'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-savers',
    title: 'Savers and Lending (Historical)',
    href: '/deep-dives/savers',
    category: 'deep-dive',
    confidence: 'historical',
    description: 'Historical overview of deprecated Savers/Lending mechanics and TCY aftermath.',
    body: 'Savers deprecated Lending deprecated THORFi historical single-sided exposure synthetics liabilities TCY January 2025 archived docs.',
    tags: ['savers', 'lending', 'tcy', 'historical'],
    reviewedAt: '2026-06-18',
    nextReviewDue: '2026-07-18',
    sources: [archivedSource, docsSource],
  },
];

export const NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.nav)
  .map((entry) => ({ name: entry.title, href: entry.href }));

export const FOOTER_NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.footer)
  .map((entry) => ({ label: entry.title, href: entry.href }));

export const FEATURED_ENTRIES = CONTENT_ENTRIES.filter((entry) => entry.featured);

export const DEEP_DIVE_ENTRIES = CONTENT_ENTRIES.filter((entry) => entry.category === 'deep-dive');

export function getContentEntry(id: string) {
  const entry = CONTENT_ENTRIES.find((candidate) => candidate.id === id);
  if (!entry) {
    throw new Error(`Missing content registry entry for ${id}`);
  }
  return entry;
}

export const DEEP_DIVE_READER_PATHS: DeepDiveReaderPath[] = [
  {
    id: 'new-to-thorchain',
    title: 'New to THORChain',
    audience: 'Readers who need the protocol shape before diving into live state.',
    description: 'Start with RUNE settlement, pool mechanics, chain observation, and vault signing before using dashboard numbers.',
    entryIds: ['deep-dive-rune-settlement', 'deep-dive-clp', 'deep-dive-bifrost', 'deep-dive-tss'],
    verifyBeforeClaiming: [
      'Current supported chains, halts, or inbound-address availability.',
      'Current implementation constants or active Mimir overrides.',
    ],
    followUpLinks: [
      {
        label: 'Protocol overview',
        href: '/protocol',
        description: 'Use the shorter architecture page after the path for a compact recap.',
      },
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check current operational state before treating the concepts as active availability.',
      },
    ],
    searchTerms: ['new to thorchain', 'start here', 'protocol basics', 'how thorchain works', 'native swaps', 'vault signing'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, devDocsSource],
  },
  {
    id: 'swap-economics',
    title: 'Swap Economics',
    audience: 'Readers comparing settlement, slip, liquidity, rewards, and fee signals.',
    description: 'Read settlement and CLP mechanics first, then connect incentives and security costs before interpreting fee dashboards.',
    entryIds: ['deep-dive-rune-settlement', 'deep-dive-clp', 'deep-dive-incentive-pendulum', 'deep-dive-slashing'],
    verifyBeforeClaiming: [
      'Current liquidity depth, APY, and earnings coverage from live Midgard snapshots.',
      'Whether a fee claim is ordinary fee mechanics or the ADR-026 dynamic-fee experiment.',
    ],
    followUpLinks: [
      {
        label: 'Stats decision panel',
        href: '/stats#stats-look-here-first',
        description: 'Check current Midgard metric health before using recent earnings or liquidity numbers.',
      },
      {
        label: 'Dynamic-fee tracker',
        href: '/dynamic-fees#dynamic-fees-live',
        description: 'Use only for ADR-026 partner-pair floor evidence, not broad fee conclusions.',
      },
    ],
    searchTerms: ['swap economics', 'liquidity fees', 'slip', 'incentive pendulum', 'pooled RUNE', 'LP APY', 'dynamic fee'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, devDocsSource, feesSource],
  },
  {
    id: 'network-security',
    title: 'Network Security',
    audience: 'Readers tracing vault safety, observation, node rotation, slash exposure, and current pause controls.',
    description: 'Use this path when a security claim depends on TSS, Bifrost observations, churn, or bonded-node incentives.',
    entryIds: ['deep-dive-tss', 'deep-dive-bifrost', 'deep-dive-churning', 'deep-dive-slashing'],
    verifyBeforeClaiming: [
      'Current signing, observation, trading, or chain-specific Mimir state.',
      'Whether a dated exploit or upgrade source applies to the current release.',
    ],
    followUpLinks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check live THORNode evidence for pause controls and source warnings.',
      },
      {
        label: 'Current source map',
        href: '/docs#current-protocol-state',
        description: 'Separate current THORNode evidence from historical security reporting.',
      },
    ],
    searchTerms: ['network security', 'TSS', 'vault safety', 'Bifrost observation', 'churning', 'slashing', 'GG20', 'Paillier'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, asgardTssChurnSource, exploitReport2Source, protocolUpgradeV319Source, networkHaltsSource],
  },
  {
    id: 'historical-recovery',
    title: 'Historical Recovery',
    audience: 'Readers separating deprecated THORFi context, TCY framing, exploit history, and current recovery state.',
    description: 'Start with historical Savers/Lending context, then read the security mechanics that shaped recovery and restart claims.',
    entryIds: ['deep-dive-savers', 'deep-dive-tss', 'deep-dive-slashing', 'deep-dive-churning'],
    verifyBeforeClaiming: [
      'Current TCY operations, balances, distributions, or recovery progress.',
      'Current solvency, restart, or safety state beyond dated incident and upgrade reports.',
    ],
    followUpLinks: [
      {
        label: 'Recovery tracker',
        href: '/governance#current-recovery',
        description: 'Use dated incident and upgrade records for current recovery framing.',
      },
      {
        label: 'TCY page',
        href: '/tcy',
        description: 'Check conservative TCY and historical THORFi wording before making recovery-token claims.',
      },
    ],
    searchTerms: ['historical recovery', 'Savers Lending', 'THORFi', 'TCY', 'exploit recovery', 'restart', 'security incident'],
    confidence: 'historical',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [archivedSource, tokenomicsSource, exploitReport2Source, protocolUpgradeV319Source],
  },
];

export const JOURNEY_LINKS: JourneyLink[] = [
  {
    label: 'Start here',
    href: '/protocol',
    description: 'Protocol architecture, swaps, vaults, Bifrost, Mimir, and supported-chain context.',
  },
  {
    label: 'Learning paths',
    href: '/deep-dives#deep-dive-reader-paths',
    description: 'Guided deep-dive sequences with current-state verification boundaries.',
  },
  {
    label: 'Live metrics',
    href: '/stats#stats-look-here-first',
    description: 'Decision-first Midgard and THORNode metrics with source-health labels.',
  },
  {
    label: 'Build/query',
    href: '/docs#developer-integration',
    description: 'Developer integration sources for docs, Midgard, THORNode, fees, memos, and asset notation.',
  },
  {
    label: 'RUNE and TCY',
    href: '/rune',
    description: 'Settlement, tokenomics, THORFi history, and recovery-token framing.',
  },
  {
    label: 'Incidents',
    href: '/governance#current-recovery',
    description: 'Conservative incident and recovery tracker with source confidence labels.',
  },
];

export const HOME_DECISION_LINKS: HomeDecisionLink[] = [
  {
    id: 'can-use-now',
    question: 'Can I use THORChain now?',
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'operations',
    description: 'Check chain halts, signing, LP controls, and source warnings before assuming swaps or LP actions are open.',
  },
  {
    id: 'which-metric',
    question: 'Which number matters?',
    label: 'Stats look-first panel',
    href: '/stats#stats-look-here-first',
    badge: 'metrics',
    description: 'Start with liquidity, security-set, reward, and data-quality signals before reading raw dashboard numbers.',
  },
  {
    id: 'adr026',
    question: 'Is ADR-026 relevant?',
    label: 'Dynamic fee tracker',
    href: '/dynamic-fees#dynamic-fees-live',
    badge: 'experiment',
    description: 'Review current per-thorname and per-pair dynamic L1 fee evidence without treating it as revenue-lift proof.',
  },
  {
    id: 'interface',
    question: 'Which interface should I inspect?',
    label: 'Interface checklist',
    href: '/ecosystem#interface-use-checklist',
    badge: 'wallets',
    description: 'Check third-party wallet, explorer, and integration surfaces as pointers, not endorsements or safety guarantees.',
  },
];

export const SOURCE_CHOICE_DECISIONS: SourceChoiceDecision[] = [
  {
    id: 'current-live-state',
    claim: 'Something is available, paused, enabled, or healthy right now.',
    startWith: {
      label: 'Current Protocol State',
      href: '/docs#current-protocol-state',
    },
    why: 'Current availability claims need live THORNode, Midgard, Mimir, or rendered dashboard evidence from the checked snapshot.',
    nextChecks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Pause, halt, signing, LP, TCY, secured-asset, WASM, and per-chain evidence.',
      },
      {
        label: 'Stats look-first panel',
        href: '/stats#stats-look-here-first',
        description: 'Liquidity, security-set, rewards, and metric data-quality posture.',
      },
    ],
    avoidClaiming: 'Durable uptime, safety, or future availability from a single current-only response.',
  },
  {
    id: 'build-or-explain-integration',
    claim: 'A memo, fee, asset notation, endpoint, or integration behavior works a certain way.',
    startWith: {
      label: 'Developer Integration',
      href: '/docs#developer-integration',
    },
    why: 'Static docs explain intended/design behavior, not proof that something is unpaused now. Pair official developer docs with live endpoint and halt-state checks before readers transact or build.',
    nextChecks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Confirm the relevant chain or action is not currently paused.',
      },
      {
        label: 'Glossary',
        href: '/glossary',
        description: 'Short definitions for Mimir, inbound addresses, memos, fees, and related terms.',
      },
    ],
    avoidClaiming: 'That static docs prove the feature is live, unpaused, or correctly implemented by every interface.',
  },
  {
    id: 'historical-incident-or-recovery',
    claim: 'An incident, deprecated product, recovery mechanism, or older feature behaved a certain way.',
    startWith: {
      label: 'Historical Features And Recovery',
      href: '/docs#historical-features-and-recovery',
    },
    why: 'Historical claims need dated incident reports, upgrade notes, recovery records, or explicitly historical wiki records.',
    nextChecks: [
      {
        label: 'Current recovery tracker',
        href: '/governance#current-recovery',
        description: 'Dated TCY, THORFi, incident, and recovery context.',
      },
      {
        label: 'Network security path',
        href: '/deep-dives#deep-dive-path-network-security',
        description: 'Sequence of security explainers with current-state caveats.',
      },
    ],
    avoidClaiming: 'Current solvency, product availability, safety, or recovery completion beyond the dated evidence.',
  },
  {
    id: 'interface-wallet-or-explorer',
    claim: 'A wallet, explorer, app, or integration surface is the right place to inspect.',
    startWith: {
      label: 'Third-Party Interfaces And Wallets',
      href: '/docs#third-party-interfaces-wallets',
    },
    why: 'Third-party surfaces are pointers to inspect, not automatic endorsements, uptime monitors, or safety audits.',
    nextChecks: [
      {
        label: 'Interface checklist',
        href: '/ecosystem#interface-use-checklist',
        description: 'What the wiki lists, what to check, and what not to infer.',
      },
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Confirm protocol-level availability before trusting a transaction flow.',
      },
    ],
    avoidClaiming: 'Wallet safety, download integrity, quote quality, endorsement, or transaction suitability.',
  },
  {
    id: 'dynamic-fee-or-revenue',
    claim: 'ADR-026 dynamic fees changed a fee floor, partner record, or revenue signal.',
    startWith: {
      label: 'Dynamic Fee Experiment',
      href: '/docs#dynamic-fee-experiment',
    },
    why: 'ADR-026 claims need a split between proposed design text, live THORNode Mimirs, sealed records, and current accumulators.',
    nextChecks: [
      {
        label: 'Dynamic fee tracker',
        href: '/dynamic-fees#dynamic-fees-live',
        description: 'Current per-thorname and per-pair live evidence with source warnings.',
      },
      {
        label: 'Current Protocol State',
        href: '/docs#current-protocol-state',
        description: 'Live-source boundaries before treating records as operational truth.',
      },
    ],
    avoidClaiming: 'Durable revenue lift, route competitiveness, or partner-attribution quality from current records alone.',
  },
  {
    id: 'community-sentiment',
    claim: 'People are debating, prioritizing, or interpreting something a certain way.',
    startWith: {
      label: 'Community Channels',
      href: '/docs#community-channels',
    },
    why: 'Community material is useful context for debate and questions, but it is not canonical protocol evidence.',
    nextChecks: [
      {
        label: 'Official Protocol Documentation',
        href: '/docs#official-protocol-documentation',
        description: 'Canonical background before converting discussion into protocol claims.',
      },
      {
        label: 'Governance and history',
        href: '/governance',
        description: 'Dated proposals, incidents, research, and milestones.',
      },
    ],
    avoidClaiming: 'Final governance status, official incident truth, current availability, or representative sentiment without dated sampling.',
  },
];

export const TASK_INTENT_GUIDES: TaskIntentGuide[] = [
  {
    id: 'swap-availability',
    label: 'Can I swap right now?',
    question: 'Is trading, signing, observation, or a specific chain paused?',
    href: '/network#network-diagnostics',
    description: 'Start with live THORNode halt controls and chain diagnostics; unavailable values stay unavailable rather than becoming zero.',
    searchTerms: ['swap right now', 'can i swap', 'trading halted', 'signing paused', 'chain availability', 'halted chain', 'live status'],
    confidence: 'official',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [networkHaltsSource, devDocsSource],
  },
  {
    id: 'source-choice',
    label: 'Which source should I trust?',
    question: 'Am I making a current-state, historical, governance, integration, or sentiment claim?',
    href: '/docs#source-map-chooser',
    description: 'Start with the source-map chooser before narrowing into live evidence, static docs, dated reports, explorers, or community context.',
    searchTerms: ['source trust', 'which source', 'source map', 'current-only evidence', 'canonical proof', 'non-claims', 'docs provenance'],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource],
  },
  {
    id: 'liquidity-actions',
    label: 'Add or withdraw liquidity',
    question: 'Can I add liquidity, withdraw liquidity, or rely on LP-related metrics right now?',
    href: '/network#network-diagnostics',
    description: 'Start with live LP controls and chain diagnostics before using static CLP explanations, LP APY, liquidity units, or interface flows.',
    searchTerms: ['add liquidity', 'withdraw liquidity', 'LP deposit', 'LP withdrawal', 'LP actions', 'LP controls', 'asymmetric withdrawal', 'liquidity units', 'liquidity provider', 'LP APY'],
    confidence: 'official',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource, midgardNetworkSource],
  },
  {
    id: 'build-query',
    label: 'Build or query data',
    question: 'Which docs or live endpoints should I use before building against THORChain data?',
    href: '/docs#developer-integration',
    description: 'Start with developer-integration sources before using Midgard, THORNode, inbound-address, Mimir, or explorer data in an app or analysis.',
    searchTerms: ['build query', 'Midgard API', 'THORNode API', 'inbound addresses', 'developer docs', 'live endpoint', 'Mimir endpoint', 'integration data'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, devDocsSource, thornodeMimirSource],
  },
  {
    id: 'why-paused',
    label: 'Why is something paused?',
    question: 'Which Mimir key or source warning explains the user-facing pause?',
    href: '/network#network-diagnostics',
    description: 'Check affected actions first, then expand diagnostics for exact Mimir evidence and source-warning details.',
    searchTerms: ['why paused', 'mimir key', 'pause reason', 'halt reason', 'operational evidence', 'source warning', 'LP paused'],
    confidence: 'official',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [networkHaltsSource, thornodeMimirSource],
  },
  {
    id: 'fees-and-adr026',
    label: 'Understand fees',
    question: 'Is this ordinary fee mechanics, affiliate fees, or the ADR-026 dynamic-fee experiment?',
    href: '/dynamic-fees#dynamic-fees-live',
    description: 'Use the tracker for current dynamic L1 fee records, and keep revenue-lift or attribution claims as non-claims unless separately proven.',
    searchTerms: ['fees', 'dynamic L1 fee', 'ADR-026', 'DYNAMICFEE-WHITELIST', 'fees_tor', 'affiliate bps', 'route competitiveness'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [feesSource, adr026DynamicFeesSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource],
  },
  {
    id: 'tcy-recovery',
    label: 'TCY and recovery',
    question: 'Is this about historical THORFi products, TCY, or post-incident recovery?',
    href: '/governance#current-recovery',
    description: 'Use dated incident, upgrade, and recovery records; avoid converting historical context into current solvency or value claims.',
    searchTerms: ['TCY', 'recovery', 'THORFi', 'Savers', 'Lending', 'exploit report', 'governance history', 'recovery token'],
    confidence: 'historical',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [tokenomicsSource, archivedSource, exploitReport2Source, protocolUpgradeV319Source],
  },
  {
    id: 'choose-interface',
    label: 'Choose an interface',
    question: 'Which wallet, explorer, or integration surface should I inspect next?',
    href: '/ecosystem#interface-use-checklist',
    description: 'Use the ecosystem directory as a sourced pointer list with explicit use/check boundaries, not an endorsement or safety guarantee.',
    searchTerms: ['interface', 'wallet', 'explorer', 'THORSwap', 'SwapKit', 'XChainJS', 'choose wallet', 'ecosystem', 'wallet safety', 'check before use', 'third-party app'],
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource, devDocsSource],
  },
];

function tocItem(title: string): DeepDiveTocItem {
  return {
    title,
    href: `#${slugifyFragment(title)}`,
  };
}

export const DEEP_DIVE_TOC: Record<string, DeepDiveTocItem[]> = {
  'deep-dive-bifrost': [
    tocItem('What Bifrost Does'),
    tocItem('How Observation Works'),
    tocItem('Why It Matters'),
  ],
  'deep-dive-churning': [
    tocItem('What is Churning?'),
    tocItem('Why Churning Matters'),
    tocItem('Node Lifecycle'),
    tocItem('Slash Points and Forced Churn'),
  ],
  'deep-dive-clp': [
    tocItem('How CLP Works'),
    tocItem('Key Properties'),
    tocItem('Comparison to Traditional AMMs'),
  ],
  'deep-dive-incentive-pendulum': [
    tocItem('The Core Problem'),
    tocItem('How the Pendulum Works'),
    tocItem('Why It Matters'),
    tocItem('Practical Effects'),
  ],
  'deep-dive-rune-settlement': [
    tocItem('The Settlement Layer'),
    tocItem('Why This Architecture?'),
    tocItem('Practical Effects'),
  ],
  'deep-dive-savers': [
    tocItem('What Savers Were'),
    tocItem('What Lending Was'),
    tocItem('TCY Aftermath'),
    tocItem('Source Posture'),
  ],
  'deep-dive-slashing': [
    tocItem('What is Slashing?'),
    tocItem('Types of Slashing Events'),
    tocItem('Slash Rate'),
    tocItem('Churn and Unbonding'),
    tocItem('Why This Matters'),
  ],
  'deep-dive-tss': [
    tocItem('The Problem with Traditional Multisig'),
    tocItem('How TSS Solves This'),
    tocItem('Security Properties'),
    tocItem('Real-World Impact'),
  ],
};
