import type {
  Chain,
  DataConfidence,
  EcosystemProject,
  FreshnessMeta,
  GovernanceProposal,
  ResearchReport,
  SecurityIncident,
  SourceMapSection,
  SourceMeta,
  SourcedRecord,
  TokenomicsSnapshot,
} from '@/lib/types';
import { unwrapRecord, withFreshness } from '@/lib/trust';

export const STATIC_DATA_LAST_UPDATED = '2026-06-18';

const officialDocs: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
};

const developerDocs: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
};

const liveInboundSource: SourceMeta = {
  label: 'THORNode inbound_addresses',
  url: 'https://thornode.thorchain.network/thorchain/inbound_addresses',
  notes: 'Use as a current-only check for live chain availability and pause state.',
};

const archivedFeaturesSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
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

const ethRouterExploitSource: SourceMeta = {
  label: 'ETH Router exploit post-mortem',
  url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
};

const tokenomicsSource: SourceMeta = {
  label: 'RUNE and TCY tokenomics',
  url: 'https://docs.thorchain.org/tokenomics-rune-tcy',
};

const networkHaltsSource: SourceMeta = {
  label: 'THORChain Network Halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
};

const ecosystemSource: SourceMeta = {
  label: 'THORChain Ecosystem',
  url: 'https://docs.thorchain.org/ecosystem',
};

const shapeshiftThorchainSource: SourceMeta = {
  label: 'ShapeShift THORChain protocol page',
  url: 'https://shapeshift.com/protocols/thorchain',
  retrievedAt: '2026-07-05',
  notes: 'ShapeShift-maintained protocol page describing THORChain route support; verify current app routing before using.',
};

const messariQ1Source: SourceMeta = {
  label: 'Messari THORChain Q1 2025 Brief',
  url: 'https://messari.io/report/thorchain-q1-2025-brief',
};

const nineRealmsQ2Source: SourceMeta = {
  label: 'Nine Realms Q2 2025 Ecosystem Report',
  url: 'https://medium.com/thorchain/thorchain-q2-2025-ecosystem-report-q3-roadmap-1f5097a086a9',
};

const nineRealmsQ3Source: SourceMeta = {
  label: 'Nine Realms Q3 2024 Ecosystem Report',
  url: 'https://medium.com/thorchain/thorchain-q3-2024-ecosystem-report-1b048fe55141',
};

const trmBybitSource: SourceMeta = {
  label: 'TRM Labs Bybit laundering update',
  url: 'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering',
};

const thornodeMimirSource: SourceMeta = {
  label: 'THORNode Mimir',
  url: 'https://thornode.thorchain.network/thorchain/mimir',
  notes: 'Current-only operational controls; malformed values must not be treated as inactive.',
};

const midgardHealthSource: SourceMeta = {
  label: 'Midgard v2 Health',
  url: 'https://midgard.thorchain.network/v2/health',
  notes: 'Use to check Midgard provider health, sync state, and lag before trusting live metrics.',
};

const midgardNetworkSource: SourceMeta = {
  label: 'Midgard v2 Network',
  url: 'https://midgard.thorchain.network/v2/network',
  notes: 'Current-only network metrics; source label and health should be shown beside values.',
};

const midgardPoolsSource: SourceMeta = {
  label: 'Midgard v2 Pools',
  url: 'https://midgard.thorchain.network/v2/pools?status=available',
  notes: 'Current-only pool availability and pool-count snapshot; not durable pool uptime proof.',
};

const midgardEarningsSource: SourceMeta = {
  label: 'Midgard v2 Earnings',
  url: 'https://midgard.thorchain.network/v2/history/earnings?interval=day&count=30',
  notes: 'Current-only earnings intervals as returned by Midgard, not protocol revenue attribution proof.',
};

const liquifyMidgardHealthSource: SourceMeta = {
  label: 'Liquify Midgard Gateway',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/health',
  notes: 'Runtime failover source used only after response-shape validation.',
};

const thornodeVersionSource: SourceMeta = {
  label: 'THORChain THORNode Version',
  url: 'https://thornode.thorchain.network/thorchain/version',
};

const liquifyThornodeVersionSource: SourceMeta = {
  label: 'Liquify THORNode Gateway',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/version',
  notes: 'Runtime failover source used only after response-shape validation.',
};

const queryingThorchainSource: SourceMeta = {
  label: 'Querying THORChain',
  url: 'https://dev.thorchain.org/concepts/querying-thorchain.html',
};

const feesSource: SourceMeta = {
  label: 'Fees',
  url: 'https://dev.thorchain.org/concepts/fees.html',
};

const adr026DynamicFeesSource: SourceMeta = {
  label: 'ADR-026 dynamic L1 fee model',
  url: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
  notes: 'Architecture decision text currently labeled proposed; compare with live THORNode state before making current claims.',
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

const assetNotationSource: SourceMeta = {
  label: 'Asset Notation',
  url: 'https://dev.thorchain.org/concepts/asset-notation.html',
};

const cosmwasmSource: SourceMeta = {
  label: 'CosmWasm',
  url: 'https://docs.thorchain.org/technical-documentation/technology/cosmwasm',
};

const tcyGuideSource: SourceMeta = {
  label: 'TCY Developer Guide',
  url: 'https://dev.thorchain.org/concepts/tcy.html',
};

const thorfiUnwindSource: SourceMeta = {
  label: 'THORFi Unwind Announcement',
  url: 'https://medium.com/thorchain/thorfi-unwind-96b46dff72c0',
};

const runescanSource: SourceMeta = {
  label: 'RuneScan',
  url: 'https://runescan.io',
};

const viewblockSource: SourceMeta = {
  label: 'ViewBlock THORChain',
  url: 'https://viewblock.io/thorchain',
};

const messariReportsSource: SourceMeta = {
  label: 'Messari THORChain Reports',
  url: 'https://messari.io/project/thorchain',
};

const thorchainGithubSource: SourceMeta = {
  label: 'THORChain GitHub',
  url: 'https://github.com/thorchain',
};

const discordSource: SourceMeta = {
  label: 'Discord',
  url: 'https://discord.com/invite/thorchaincommunity',
};

const twitterSource: SourceMeta = {
  label: 'Twitter/X',
  url: 'https://x.com/thorchain_org',
};

const telegramSource: SourceMeta = {
  label: 'Telegram',
  url: 'https://t.me/thorchain_org',
};

const redditSource: SourceMeta = {
  label: 'Reddit',
  url: 'https://reddit.com/r/THORChain',
};

interface StaticRecordFreshnessOptions {
  checkedAt?: string;
  nextReviewDue?: string;
  reviewedBy?: string;
}

const checkedFreshness = (
  confidence: DataConfidence,
  nextReviewDue = '2026-07-18',
  checkedAt = STATIC_DATA_LAST_UPDATED,
  reviewedBy?: string
): FreshnessMeta => {
  const freshness: FreshnessMeta = {
    checkedAt,
    confidence,
    nextReviewDue,
  };

  if (reviewedBy) {
    freshness.reviewedBy = reviewedBy;
  }

  return freshness;
};

const record = <T>(
  data: T,
  sources: SourceMeta[],
  confidence: DataConfidence = 'curated',
  freshnessOptions: StaticRecordFreshnessOptions = {}
): SourcedRecord<T> => withFreshness(
  data,
  sources,
  checkedFreshness(
    confidence,
    freshnessOptions.nextReviewDue,
    freshnessOptions.checkedAt,
    freshnessOptions.reviewedBy
  )
);

export const CHAIN_RECORDS: SourcedRecord<Chain>[] = [
  record({
    name: 'Bitcoin',
    chain: 'BTC',
    explorer: 'https://mempool.space/block',
    addressFormats: ['P2WSH (preferred)', 'P2WPKH', 'P2PKH', 'P2SH', 'P2TR'],
    dustThreshold: 546,
    supported: true,
    statusNote: 'Live inbound status must be checked before describing BTC swaps as open.',
  }, [liveInboundSource, developerDocs], 'official'),
  record({
    name: 'Ethereum',
    chain: 'ETH',
    explorer: 'https://etherscan.io/block',
    addressFormats: ['EIP-55'],
    supported: true,
    statusNote: 'Router/inbound status is live-state dependent.',
  }, [liveInboundSource, developerDocs], 'official'),
  record({
    name: 'BNB Chain',
    chain: 'BSC',
    explorer: 'https://bscscan.com/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Avalanche',
    chain: 'AVAX',
    explorer: 'https://snowtrace.io/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Cosmos Hub',
    chain: 'GAIA',
    explorer: 'https://www.mintscan.io/cosmos/blocks',
    addressFormats: ['Bech32'],
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Dogecoin',
    chain: 'DOGE',
    explorer: 'https://blockchair.com/dogecoin/block',
    addressFormats: ['Bech32', 'P2PKH'],
    dustThreshold: 1000000,
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Litecoin',
    chain: 'LTC',
    explorer: 'https://blockchair.com/litecoin/block',
    addressFormats: ['Bech32', 'P2PKH'],
    dustThreshold: 100000,
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Bitcoin Cash',
    chain: 'BCH',
    explorer: 'https://blockchair.com/bitcoin-cash/block',
    addressFormats: ['CashAddr', 'P2PKH'],
    dustThreshold: 1000,
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Tron',
    chain: 'TRON',
    explorer: 'https://tronscan.org/#/block',
    addressFormats: ['Base58'],
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Base',
    chain: 'BASE',
    explorer: 'https://basescan.org/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [liveInboundSource], 'official'),
  record({
    name: 'Solana',
    chain: 'SOL',
    explorer: 'https://solscan.io/block',
    addressFormats: ['Base58'],
    supported: true,
    statusNote: 'SOL uses EdDSA signing; Exploit Report #2 says EdDSA chains such as Solana were not exposed to the GG20/Paillier attack path.',
  }, [liveInboundSource, exploitReport2Source], 'official'),
  record({
    name: 'XRP Ledger',
    chain: 'XRP',
    explorer: 'https://xrpscan.com/ledger',
    addressFormats: ['Classic address', 'X-address'],
    supported: true,
  }, [liveInboundSource], 'official'),
];

export const CHAINS: Chain[] = CHAIN_RECORDS.map(unwrapRecord);

const chainCodes = CHAINS.map((chain) => chain.chain);

export const SOURCE_MAP_SECTION_RECORDS: SourcedRecord<SourceMapSection>[] = [
  record({
    id: 'current-protocol-state',
    title: 'Current Protocol State',
    decision: 'Is a protocol feature, chain, pool, or halt state available right now?',
    use: 'Use these for source-backed current state, live availability, halt flags, pool metrics, and operational checks.',
    caveat: 'Live API responses are current-only snapshots. A successful response is not durable historical proof.',
    claimExamples: [
      'Current halt, pause, signing, LP, TCY, trade-account, secured-asset, or chain-observation state.',
      'Current inbound address, router, gas-rate, pool, node, bond, reserve, or earnings snapshot.',
      'Whether a rendered live metric is available, unavailable, degraded, or warning-backed at check time.',
    ],
    nonClaims: [
      'Durable historical uptime or availability.',
      'Protocol design intent or governance approval.',
      'Revenue lift, safety, or route quality beyond the checked snapshot.',
    ],
    links: [thornodeMimirSource, liveInboundSource, midgardHealthSource, midgardNetworkSource, midgardPoolsSource, midgardEarningsSource],
  }, [thornodeMimirSource, liveInboundSource, midgardHealthSource, midgardNetworkSource, midgardPoolsSource, midgardEarningsSource], 'official'),
  record({
    id: 'runtime-live-data-failover',
    title: 'Runtime Live-Data Failover',
    decision: 'Which live provider backed the value this wiki is showing?',
    use: 'Use these to understand the providers this wiki tries before it renders Midgard or THORNode status.',
    caveat: 'The app validates response shape before trusting a provider. Visible source labels identify the selected source for that snapshot.',
    claimExamples: [
      'Selected Midgard or THORNode provider for a rendered value.',
      'Provider health, sync, lag, source-warning, and degraded-source posture.',
      'Whether the app failed over instead of mixing data across providers.',
    ],
    nonClaims: [
      'That every upstream provider agrees.',
      'That a clean provider response proves historical correctness.',
      'That degraded readiness is a deploy failure when warnings are intentionally conservative.',
    ],
    links: [liquifyMidgardHealthSource, midgardHealthSource, liquifyThornodeVersionSource, thornodeVersionSource],
  }, [liquifyMidgardHealthSource, midgardHealthSource, liquifyThornodeVersionSource, thornodeVersionSource], 'curated', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
  record({
    id: 'developer-integration',
    title: 'Developer Integration',
    decision: 'How should an app or integration talk to THORChain?',
    use: 'Use these for integration behavior, API concepts, asset notation, fees, memos, and querying guidance.',
    caveat: 'Developer docs explain intended interfaces; still check live endpoints for current halts, fees, and chain availability.',
    claimExamples: [
      'Memo, asset notation, fee, quote, and API-query concepts.',
      'Developer-facing behavior for swaps, affiliates, and current endpoint shapes.',
      'Which source should be used before implementing or documenting integration behavior.',
    ],
    nonClaims: [
      'That a feature is live and unpaused right now.',
      'That every third-party interface implements the behavior safely.',
      'That static docs supersede current THORNode halt or Mimir state.',
    ],
    links: [developerDocs, queryingThorchainSource, feesSource, assetNotationSource],
  }, [developerDocs, queryingThorchainSource, feesSource, assetNotationSource], 'official', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
  record({
    id: 'third-party-interfaces-wallets',
    title: 'Third-Party Interfaces And Wallets',
    decision: 'Can I treat an ecosystem listing as safe, live, or endorsed?',
    use: 'Use these sources to identify known interfaces, wallets, explorers, and developer tools, then pair them with live THORNode checks before assuming protocol availability.',
    caveat: 'Ecosystem references are not wallet-security audits, URL-integrity guarantees, app-uptime monitors, quote-quality proof, compliance-policy proof, or endorsements.',
    claimExamples: [
      'That a project is a source-listed ecosystem reference as of the wiki review date.',
      'Which chains, category, and source labels this wiki associates with a project.',
      'Which live protocol checks should be reviewed before using a transaction surface.',
    ],
    nonClaims: [
      'Wallet safety, download integrity, app uptime, quote quality, or transaction suitability.',
      'Official endorsement of a third-party interface or wallet.',
      'That a listed interface has implemented current protocol behavior correctly.',
    ],
    links: [ecosystemSource, developerDocs, liveInboundSource, networkHaltsSource],
  }, [ecosystemSource, developerDocs, liveInboundSource, networkHaltsSource], 'curated', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
  record({
    id: 'dynamic-fee-experiment',
    title: 'Dynamic Fee Experiment',
    decision: 'What can ADR-026 and live dynamic-fee endpoints actually prove?',
    use: 'Use these for ADR-026 design context, live dynamic L1 fee Mimirs, sealed records, and current-epoch accumulators.',
    caveat: 'ADR text is design/governance context. THORNode endpoints are current-only snapshots and do not prove durable revenue lift, route competitiveness, or partner attribution quality.',
    claimExamples: [
      'ADR-026 design intent, whitelist states, pair scope, and controller mechanics.',
      'Current dynamic-fee Mimirs, sealed records, and current-epoch accumulators exposed by THORNode.',
      'Whether the dashboard has samples, warnings, or insufficient evidence for a particular pair.',
    ],
    nonClaims: [
      'Durable revenue lift or route competitiveness.',
      'Partner attribution quality or off-chain affiliate correctness.',
      'A final governance outcome beyond the dated ADR and current THORNode state.',
    ],
    links: [adr026DynamicFeesSource, thornodeMimirSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource, thornameGuideSource, feesSource],
  }, [adr026DynamicFeesSource, thornodeMimirSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource, thornameGuideSource, feesSource], 'curated', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
  record({
    id: 'official-protocol-documentation',
    title: 'Official Protocol Documentation',
    decision: 'Is this a high-level protocol or tokenomics claim?',
    use: 'Use for high-level protocol architecture, tokenomics, node concepts, RUNE, TCY, and canonical educational context.',
    caveat: 'Static docs can lag live protocol state. Prefer dated language when describing fast-moving operational controls.',
    claimExamples: [
      'Protocol architecture, tokenomics framing, node concepts, and educational mechanism summaries.',
      'Officially documented halt key families, RUNE/TCY framing, and app-layer concepts.',
      'Canonical background for pages that also expose current-only live checks.',
    ],
    nonClaims: [
      'Exact current Mimir values, constants, pool state, or chain availability.',
      'Post-incident operational safety unless the source is a dated incident or upgrade report.',
      'Third-party interface status, wallet safety, or market conclusions.',
    ],
    links: [officialDocs, networkHaltsSource, tokenomicsSource, cosmwasmSource],
  }, [officialDocs, networkHaltsSource, tokenomicsSource, cosmwasmSource], 'official'),
  record({
    id: 'historical-features-and-recovery',
    title: 'Historical Features And Recovery',
    decision: 'Is this an incident, recovery, or deprecated-product claim?',
    use: 'Use for Savers/Lending deprecation, THORFi unwind, incident reports, recovery records, and source-dated historical context.',
    caveat: 'Historical records should not be converted into current availability claims without live or newly reviewed sources.',
    claimExamples: [
      'Savers/Lending deprecation and THORFi unwind history.',
      'Official exploit-report root cause, remediation, restart, and recovery context.',
      'Dated milestones or incident lessons where the source itself supports the claim.',
    ],
    nonClaims: [
      'That historical products are available now.',
      'Current solvency, safety, or recovery completion beyond dated sources.',
      'Financial advice, recovery-value expectations, or investment outcomes.',
    ],
    links: [
      archivedFeaturesSource,
      tcyGuideSource,
      thorfiUnwindSource,
      exploitReportSource,
      exploitReport2Source,
      protocolUpgradeV319Source,
    ],
  }, [
    archivedFeaturesSource,
    tcyGuideSource,
    thorfiUnwindSource,
    exploitReportSource,
    exploitReport2Source,
    protocolUpgradeV319Source,
  ], 'historical', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
  record({
    id: 'external-analytics-and-explorers',
    title: 'External Analytics And Explorers',
    decision: 'Do you need independent transaction, explorer, or market context?',
    use: 'Use to inspect transactions, pools, nodes, and market or flow context outside this wiki.',
    caveat: 'Explorer and analytics data may use their own indexing rules. Treat them as references unless independently reconciled.',
    claimExamples: [
      'Transaction, pool, node, market, or flow context from external indexers.',
      'Third-party research summaries when labeled as curated or needs-review.',
      'Pointers for readers who want to inspect evidence outside this wiki.',
    ],
    nonClaims: [
      'Canonical protocol state or official THORChain policy.',
      'Reconciled accounting, tax, or solvency proof.',
      'Endorsement, safety review, or complete interface coverage.',
    ],
    links: [runescanSource, viewblockSource, messariReportsSource, thorchainGithubSource],
  }, [runescanSource, viewblockSource, messariReportsSource, thorchainGithubSource], 'curated'),
  record({
    id: 'community-channels',
    title: 'Community Channels',
    decision: 'Are you looking for sentiment, debate, or open-source context?',
    use: 'Use these for community discussion, announcements, open-source repositories, and social context.',
    caveat: 'Community and social channels are not canonical protocol proof. Use official docs, live APIs, or dated incident reports for claims.',
    claimExamples: [
      'Community debate, implementation discussion, ecosystem chatter, and repository context.',
      'Signals about what people are asking, disputing, or prioritizing.',
      'Links to places where readers can continue non-canonical research.',
    ],
    nonClaims: [
      'Canonical protocol proof, final governance state, or official incident truth.',
      'Current operational availability or safety.',
      'Representative sentiment without careful sampling and date boundaries.',
    ],
    links: [discordSource, twitterSource, telegramSource, redditSource, thorchainGithubSource],
  }, [discordSource, twitterSource, telegramSource, redditSource, thorchainGithubSource], 'curated'),
];

export const SOURCE_MAP_SECTIONS: SourceMapSection[] = SOURCE_MAP_SECTION_RECORDS.map(unwrapRecord);

export const TOKENOMICS_RECORDS: SourcedRecord<TokenomicsSnapshot>[] = [
  record({
    id: 'rune-supply-framing',
    title: 'RUNE Supply Framing',
    summary: 'As reviewed on 2026-06-18, the official tokenomics source frames RUNE around a reduced supply near 425M, circulating supply near 350M, reserve near 75M, and ongoing burn mechanics.',
    figures: [
      { label: 'Original Cap Context', value: '500M RUNE', tone: 'historical' },
      { label: 'Current Supply Framing', value: '~425M and burning', tone: 'source-backed' },
      { label: 'Circulating Supply', value: '~350M source figure', tone: 'source-backed' },
      { label: 'Reserve', value: '~75M source figure', tone: 'source-backed' },
      { label: 'Network Income', value: 'Fees, emissions, burns, TCY share', tone: 'dynamic' },
      { label: 'Bond Requirement', value: 'Check constants + Mimir', tone: 'current-only' },
      { label: 'Slash Penalty', value: 'Check constants + Mimir', tone: 'current-only' },
    ],
  }, [tokenomicsSource], 'official'),
  record({
    id: 'tcy-recovery-context',
    title: 'TCY Recovery Context',
    summary: 'TCY is recovery-token context associated with the THORFi unwind. Official docs describe 1 TCY per $1 of defaulted debt and 10% of system income to stakers, but full debt recovery is market dependent and not guaranteed.',
    figures: [
      { label: 'Recovery mechanism', value: 'Claims token, not payout guarantee', tone: 'source-backed' },
      { label: 'Debt conversion', value: '$1 debt = 1 TCY', tone: 'source-backed' },
      { label: 'Revenue share', value: '10% system income to stakers', tone: 'source-backed' },
      { label: 'Full recovery', value: 'Not guaranteed', tone: 'source-backed' },
      { label: 'Current claim state', value: 'Check THORNode/Mimir + interface', tone: 'current-only' },
      { label: 'Savers/Lending state', value: 'Deprecated historical products', tone: 'historical' },
    ],
  }, [tokenomicsSource, tcyGuideSource, thorfiUnwindSource, archivedFeaturesSource], 'needs-review', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
];

export const ECOSYSTEM_PROJECT_RECORDS: SourcedRecord<EcosystemProject>[] = [
  record({
    id: 'thorchain-swap',
    name: 'THORChain Swap',
    category: 'Interface',
    description: 'Official THORChain swap interface for native cross-chain swaps. Live availability depends on current THORNode halt and inbound status.',
    url: 'https://swap.thorchain.org',
    status: 'Active',
    chains: chainCodes,
    useFor: [
      'Official swap-interface starting point for native cross-chain swap routes.',
      'Checking whether the canonical interface exposes a route for a supported chain pair.',
    ],
    verifyBeforeUse: [
      'Confirm live trading, signing, inbound-address, and gas status on the Network page before assuming a swap can settle.',
      'Review quoted fees, route, slippage, recipient address, and wallet approvals in the interface before signing.',
    ],
  }, [ecosystemSource, liveInboundSource], 'curated'),
  record({
    id: 'asgardex',
    name: 'AsgardEX',
    category: 'Wallet',
    description: 'Multi-chain desktop wallet and DEX interface with THORChain support.',
    url: 'https://www.asgardex.com',
    logo: '/logos/asgardex.svg',
    status: 'Active',
    chains: ['BTC', 'ETH', 'BSC', 'AVAX', 'GAIA', 'DOGE', 'LTC', 'BCH'],
    useFor: [
      'Desktop wallet and THORChain swap interface exploration.',
      'Self-custody workflow research across the listed chains.',
    ],
    verifyBeforeUse: [
      'Confirm the current release, download source, wallet permissions, and device security outside this wiki.',
      'Check live chain and THORChain halt status before relying on any swap or LP action.',
    ],
  }, [ecosystemSource], 'curated'),
  record({
    id: 'thorswap',
    name: 'THORSwap',
    category: 'Interface',
    description: 'Multi-chain DEX aggregator and THORChain interface. Deprecated Savers/Lending products should be treated as historical.',
    url: 'https://app.thorswap.finance',
    logo: '/logos/thorswap.svg',
    status: 'Active',
    chains: chainCodes,
    useFor: [
      'Third-party swap, aggregation, and THORChain interface research.',
      'Comparing route options and interface support across many listed chains.',
    ],
    verifyBeforeUse: [
      'Treat product availability, terms, compliance controls, and routed quotes as current third-party state.',
      'Do not infer that historical Savers or Lending features are available; verify any product shown by the app.',
    ],
  }, [ecosystemSource, archivedFeaturesSource], 'curated'),
  record({
    id: 'shapeshift',
    name: 'ShapeShift',
    category: 'Interface',
    description: 'Self-custody multichain wallet and DEX aggregator with THORChain route support for native cross-chain swaps.',
    url: 'https://app.shapeshift.com',
    status: 'Active',
    chains: chainCodes,
    useFor: [
      'Third-party wallet and swap-interface research where THORChain can be one of the route sources.',
      'Comparing ShapeShift quotes and route handling against other THORChain-enabled interfaces.',
    ],
    verifyBeforeUse: [
      'Confirm the current app route, affiliate fee, slippage, recipient address, and supported chain pair before signing.',
      'Check live THORNode diagnostics and ShapeShift app availability; this listing is not a wallet-security audit or route guarantee.',
    ],
  }, [ecosystemSource, shapeshiftThorchainSource, liveInboundSource], 'curated', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    id: 'runescan',
    name: 'RuneScan',
    category: 'Explorer',
    description: 'THORChain explorer for transactions, pools, nodes, and statistics.',
    url: 'https://runescan.io',
    status: 'Active',
    chains: ['THOR'],
    useFor: [
      'Exploring THORChain transactions, pools, nodes, addresses, and historical network context.',
      'Cross-checking wiki claims against an independent explorer view.',
    ],
    verifyBeforeUse: [
      'Do not treat explorer display alone as proof that swaps, LP actions, or signing are currently open.',
      'Cross-check protocol availability against live THORNode diagnostics when making operational claims.',
    ],
  }, [ecosystemSource], 'curated'),
  record({
    id: 'viewblock',
    name: 'ViewBlock',
    category: 'Explorer',
    description: 'Multi-chain explorer with THORChain support.',
    url: 'https://viewblock.io/thorchain',
    status: 'Active',
    chains: ['THOR'],
    useFor: [
      'Inspecting THORChain explorer data through a multi-chain explorer surface.',
      'Comparing transaction or account context with other explorer sources.',
    ],
    verifyBeforeUse: [
      'Use explorer data as evidence context, not as a wallet-safety or route-availability guarantee.',
      'Check live THORNode state before making current operational claims.',
    ],
  }, [ecosystemSource], 'curated'),
  record({
    id: 'swapkit',
    name: 'SwapKit',
    category: 'Developer Tools',
    description: 'SDK and API tooling for cross-chain swap integrations.',
    url: 'https://swapkit.dev',
    status: 'Active',
    chains: chainCodes,
    useFor: [
      'Developer SDK/API research for THORChain and cross-chain swap integrations.',
      'Finding integration concepts before checking current package and API documentation.',
    ],
    verifyBeforeUse: [
      'Confirm current package versions, API behavior, supported chains, and integration security in upstream docs.',
      'Test quotes, memos, slippage, affiliate settings, and error handling against live endpoints before shipping.',
    ],
  }, [developerDocs], 'curated'),
  record({
    id: 'xchainjs',
    name: 'XChainJS',
    category: 'Developer Tools',
    description: 'JavaScript client libraries for THORChain and connected chains.',
    url: 'https://xchainjs.org',
    status: 'Active',
    chains: chainCodes,
    useFor: [
      'JavaScript client-library research for THORChain and connected-chain tooling.',
      'Developer orientation before checking package-specific docs and examples.',
    ],
    verifyBeforeUse: [
      'Confirm current package versions, chain-module support, wallet handling, and breaking changes upstream.',
      'Do not treat library presence here as proof of production readiness for an integration.',
    ],
  }, [developerDocs], 'curated'),
];

export const ECOSYSTEM_PROJECTS: EcosystemProject[] = ECOSYSTEM_PROJECT_RECORDS.map(unwrapRecord);

export const RESEARCH_REPORT_RECORDS: SourcedRecord<ResearchReport>[] = [
  record({
    id: 'messari-q1-2025',
    title: 'THORChain Q1 2025 Brief',
    author: 'Drexel Bakker',
    date: '2025-04-24',
    source: 'Messari',
    url: 'https://messari.io/report/thorchain-q1-2025-brief',
    summary: 'Quarterly analysis covering affiliate volume, TVL, RUNE price performance, swap activity, and THORFi liabilities.',
    keyInsights: [
      'THORFi was paused after protocol liability concerns',
      'Affiliate volume and TVL moved sharply during Q1 2025',
    ],
  }, [messariQ1Source], 'curated'),
  record({
    id: 'nine-realms-q2-2025',
    title: 'THORChain Q2 2025 Ecosystem Report & Q3 Roadmap',
    author: 'Nine Realms',
    date: '2025-07-09',
    source: 'Nine Realms',
    url: 'https://medium.com/thorchain/thorchain-q2-2025-ecosystem-report-q3-roadmap-1f5097a086a9',
    summary: 'Ecosystem report with Q3 roadmap priorities and development updates.',
    keyInsights: [],
  }, [nineRealmsQ2Source], 'curated'),
  record({
    id: 'nine-realms-q3-2024',
    title: 'THORChain Q3 2024 Ecosystem Report',
    author: 'Nine Realms',
    date: '2024-10-07',
    source: 'Nine Realms',
    url: 'https://medium.com/thorchain/thorchain-q3-2024-ecosystem-report-1b048fe55141',
    summary: 'Quarterly ecosystem report covering protocol performance, development milestones, and community initiatives.',
    keyInsights: [],
  }, [nineRealmsQ3Source], 'curated'),
];

export const RESEARCH_REPORTS: ResearchReport[] = RESEARCH_REPORT_RECORDS.map(unwrapRecord);

export const SECURITY_INCIDENT_RECORDS: SourcedRecord<SecurityIncident>[] = [
  record({
    id: 'eth-router-1',
    title: 'ETH Router Exploit #1',
    date: '2021-04-19',
    type: 'Exploit',
    description: 'Early ETH router exploit affecting a limited amount of funds during Chaosnet.',
    impact: '$12,000 loss',
    resolved: true,
    resolutionDate: '2021-04-20',
    lessons: ['Router audits and monitoring became more important', 'Incident response procedures were refined'],
    url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
  }, [ethRouterExploitSource], 'historical'),
  record({
    id: 'eth-router-2',
    title: 'ETH Router Exploit #2',
    date: '2021-04-22',
    type: 'Exploit',
    description: 'Second ETH router exploit, followed by further fixes and a cautious return-to-trading process.',
    impact: '$8,000 loss',
    resolved: true,
    resolutionDate: '2021-04-23',
    lessons: ['Return-to-trading safety needs explicit gates', 'Router changes require extra validation'],
    url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
  }, [ethRouterExploitSource], 'historical'),
  record({
    id: 'thorfi-unwind-2025',
    title: 'THORFi Unwind',
    date: '2025-01',
    type: 'Protocol Unwind',
    description: 'Savers and Lending were deprecated and moved to archived documentation after THORFi liability concerns.',
    impact: 'Deprecated Savers and Lending products; TCY became the main recovery token framing.',
    resolved: false,
    trackerStatus: 'historical-open',
    lessons: ['Experimental yield and lending features need explicit solvency and liability framing'],
    url: 'https://docs.thorchain.org/thornodes/archived',
  }, [archivedFeaturesSource, tokenomicsSource], 'official'),
  record({
    id: 'bybit-laundering-2025',
    title: 'Post-Bybit Laundering Flow',
    date: '2025-03',
    type: 'Illicit Flow',
    description: 'THORChain saw controversial post-exchange-hack flow; this was not a THORChain protocol exploit.',
    impact: 'High-volume illicit-flow and interface-policy debate rather than a protocol drain.',
    resolved: false,
    trackerStatus: 'historical-open',
    lessons: ['Separate protocol exploits from illicit usage of open infrastructure', 'Use precise source-backed labels'],
    url: 'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering',
  }, [trmBybitSource], 'needs-review'),
  record({
    id: 'gg20-vault-exploit-2026',
    title: 'GG20 Vault Exploit',
    date: '2026-05-15',
    type: 'Exploit',
    description: 'Exploit Report #2 describes a cryptographic GG20/TSS attack: a validator planted malformed Paillier key material and used repeated failed MTA rounds to leak key-share fragments before signing alone.',
    impact: 'Approximately $10M-$10.7M drained from one vault; Report #2 says no other vault was affected and EdDSA chains such as Solana were not exposed.',
    resolved: false,
    trackerStatus: 'current',
    lessons: [
      'Monitor validator-level key-sign failures instead of relying only on solvency outflow detection',
      'GG20/Paillier migration wording should stay tied to dated official reports',
      'Do not describe EdDSA chains as exposed to this specific GG20 attack path',
    ],
    url: 'https://blog.thorchain.org/thorchain-exploit-report-2',
  }, [exploitReport2Source, protocolUpgradeV319Source, exploitReportSource], 'official', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
];

export const SECURITY_INCIDENTS: SecurityIncident[] = SECURITY_INCIDENT_RECORDS.map(unwrapRecord);

export const GOVERNANCE_PROPOSAL_RECORDS: SourcedRecord<GovernanceProposal>[] = [
  record({
    id: 'thorfi-unwind',
    title: 'THORFi Unwind',
    description: 'Deprecation and unwind process for Savers and Lending liabilities.',
    type: 'Protocol Unwind',
    status: 'Historical',
    votingPeriod: 'Source-dependent',
    createdDate: '2025-01',
    expiryDate: 'Historical',
    sourceUrl: 'https://docs.thorchain.org/thornodes/archived',
  }, [archivedFeaturesSource, tokenomicsSource], 'official'),
  record({
    id: 'adr-028-recovery',
    title: 'ADR-028 Recovery Path',
    description: 'Recovery of May 2026 exploit losses was described by the first official exploit report as a community governance decision.',
    type: 'Recovery',
    status: 'Needs current review',
    votingPeriod: 'Source-dependent',
    createdDate: '2026-05',
    expiryDate: 'Current status must be checked',
    sourceUrl: 'https://blog.thorchain.org/thorchain-exploit-report-1',
  }, [exploitReportSource], 'needs-review'),
  record({
    id: 'mimir-operational-halts',
    title: 'Operational Mimir Halts',
    description: 'Operational Mimir parameters such as HALTTRADING and HALTSIGNING can pause network activity and should be read from THORNode.',
    type: 'Operational Parameter',
    status: 'Live',
    votingPeriod: 'Current-only',
    createdDate: 'Ongoing',
    expiryDate: 'Live parameter',
    sourceUrl: 'https://dev.thorchain.org/concepts/network-halts.html',
  }, [networkHaltsSource, liveInboundSource], 'official'),
  record({
    id: 'adr-026-dynamic-l1-fees',
    title: 'ADR-026 Dynamic L1 Fees',
    description: 'Dynamic per-thorname and per-pair L1 minimum fee experiment. Official ADR text is proposed-design context while live THORNode snapshots may show enabled Mimirs and dynamic-fee records.',
    type: 'ADR / Operational Experiment',
    status: 'Proposed ADR / live Mimir evidence',
    votingPeriod: 'Current-only Mimir and source review',
    createdDate: '2026-04-15',
    expiryDate: 'Review due 2026-07-17',
    sourceUrl: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
  }, [adr026DynamicFeesSource, thornodeMimirSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource], 'curated', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
];

export const GOVERNANCE_PROPOSALS: GovernanceProposal[] = GOVERNANCE_PROPOSAL_RECORDS.map(unwrapRecord);

export const PROTOCOL_MILESTONE_RECORDS = [
  record({
    date: '2018-10-15',
    title: 'THORChain Founded',
    description: 'THORChain project founded and initial whitepaper work begins.',
  }, [officialDocs], 'historical'),
  record({
    date: '2021-04-13',
    title: 'Mainnet Chaosnet Launch',
    description: 'Mainnet Chaosnet launches with native cross-chain swaps.',
  }, [officialDocs], 'historical'),
  record({
    date: '2024-12-22',
    title: 'THORChain V3 Release',
    description: 'Major protocol upgrade introducing app-layer and protocol improvements.',
  }, [officialDocs], 'historical'),
  record({
    date: '2025-01',
    title: 'Savers and Lending Deprecated',
    description: 'Archived THORChain docs mark Savers and Lending as deprecated and no longer available.',
  }, [archivedFeaturesSource], 'official'),
  record({
    date: '2026-05-15',
    title: 'GG20 Vault Exploit and Emergency Halt',
    description: 'Official reports say one vault was drained through a GG20/TSS cryptographic attack; v3.19.0 carried restart recovery/security changes, and later reporting described v3.19.1 patching plus migration planning away from GG20.',
  }, [exploitReport2Source, protocolUpgradeV319Source, exploitReportSource], 'official', {
    checkedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
  }),
];

export const PROTOCOL_MILESTONES = PROTOCOL_MILESTONE_RECORDS.map(unwrapRecord);
