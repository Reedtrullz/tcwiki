import { DataConfidence, SourceMeta } from '@/lib/types';
import {
  adr026DynamicFeesSource,
  appLayerSource,
  archivedSaversLendingSource as archivedSource,
  asgardTssChurnSource,
  assetNotationSource,
  bifrostTssVaultsSource,
  connectingThorchainSource as baseConnectingThorchainSource,
  constantsMimirSource,
  continuousLiquidityPoolsSource,
  cosmWasmSource as baseCosmWasmSource,
  dynamicL1FeesCurrentSource,
  dynamicL1FeesSource,
  economicModelSource,
  exploitReport1Source as exploitReportSource,
  exploitReport2Source,
  feesSource,
  liquidityProviderFaqSource,
  liquidityProvidersSource,
  liveInboundSource,
  memosSource as baseMemosSource,
  midgardEarningsSource,
  midgardHealthSource,
  midgardNetworkSource,
  midgardPoolsSource,
  nativeSwapsSource,
  networkHaltsSource,
  networkSecurityGovernanceSource,
  nodeManagingSource,
  nodeRisksRewardsSource,
  protocolUpgradeV319Source,
  queryingThorchainSource,
  runeDocsSource,
  runePoolDevSource,
  runePoolDocsSource,
  runePoolEndpointSource,
  securedAssetsDevSource,
  securedAssetsSource,
  swapGuideSource as baseSwapGuideSource,
  tcyGuideSource,
  thorchainEcosystemSource as ecosystemSource,
  thorchainDevDocsSource as devDocsSource,
  thorchainDocsSource as docsSource,
  thorfiUnwindSource,
  thornameGuideSource,
  thornodeStackSource,
  thornodeMimirSource,
  tokenomicsSource,
} from '@/lib/sources';
import { slugifyFragment } from '@/lib/utils';

export interface ContentEntry {
  id: string;
  title: string;
  navLabel?: string;
  footerLabel?: string;
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

export interface TaskGuideGroupDefinition {
  id: string;
  label: string;
  guideIds: string[];
}

export interface TaskGuideGroup {
  id: string;
  label: string;
  guides: TaskIntentGuide[];
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

export const HOME_PAGE_ENTRY: ContentEntry = {
  id: 'home',
  title: 'THORChain Wiki Home',
  href: '/',
  category: 'resource',
  confidence: 'curated',
  description: 'Source-backed starting point for live operations, Midgard metrics, guided answers, learning paths, ecosystem pointers, and dated research context.',
  body: 'THORChain Wiki home start with the claim live operations snapshot check live operations current-only THORNode network diagnostics ordinary swaps limited chains LP controls source warnings metrics stats look here first Midgard source health pooled RUNE bonding APY active nodes Midgard pool rows Midgard available-pool rows pool-list context not route quote proof guided answers search learning paths deep dives source map guided answers learning paths ecosystem pointer list research dated context official docs developer docs Midgard API RuneScan current state proof boundary.',
  tags: ['home', 'start here', 'live operations', 'guided answers'],
  reviewedAt: '2026-07-08',
  nextReviewDue: '2026-08-08',
  sources: [docsSource, devDocsSource, liveInboundSource, thornodeMimirSource, midgardHealthSource, midgardNetworkSource, midgardPoolsSource, networkHaltsSource],
};

export const SEARCH_PAGE_ENTRY: ContentEntry = {
  id: 'search',
  title: 'Search And Guided Answers',
  navLabel: 'Search',
  footerLabel: 'Search',
  href: '/search',
  category: 'resource',
  confidence: 'curated',
  description: 'Search, guided reader paths, task guides, and source-choice routing for THORChain wiki claims.',
  body: 'Search guided answers reader paths common tasks source choice source map live state current-only protocol claims glossary definitions builder endpoint integration wallet safety recovery dynamic fees RUNE tokenomics Mimir halt route availability source retrieval result review dates.',
  tags: ['search', 'guided answers', 'source map', 'tasks'],
  reviewedAt: '2026-07-06',
  nextReviewDue: '2026-08-06',
  sources: [docsSource, devDocsSource, networkHaltsSource, liveInboundSource, thornodeMimirSource],
  nav: true,
  footer: true,
};

const connectingThorchainSource: SourceMeta = {
  ...baseConnectingThorchainSource,
  retrievedAt: '2026-07-05',
  notes: 'Developer docs distinction between Midgard as dashboard-friendly consumer data and THORNode as raw protocol state.',
};

const buildQueryConnectingSource: SourceMeta = {
  ...baseConnectingThorchainSource,
  retrievedAt: '2026-07-06',
  notes: 'Official source-family guide for Midgard, THORNode, Cosmos RPC, Tendermint RPC, gRPC, rate limits, x-client-id, and production node guidance.',
};

const buildQueryQueryingSource: SourceMeta = {
  ...queryingThorchainSource,
  retrievedAt: '2026-07-06',
  notes: 'Official inbound-address, pool-list, supported-address, halt, gas-rate, dust-threshold, base-unit, and router guidance.',
};

const buildQuerySwapGuideSource: SourceMeta = {
  ...baseSwapGuideSource,
  retrievedAt: '2026-07-06',
  notes: 'Official quote response, quote expiry, quote rate-limit, recommended minimum input, fees, warning, memo, and timing guidance.',
};

const buildQueryMemosSource: SourceMeta = {
  ...baseMemosSource,
  retrievedAt: '2026-07-06',
  notes: 'Official memo format, memo-size, dust-threshold, function, refund-address, affiliate, and transaction-intent guidance.',
};

const buildQueryFeesSource: SourceMeta = {
  ...feesSource,
  retrievedAt: '2026-07-06',
  notes: 'Official fee categories, fee ordering, gas-rate source, affiliate-fee, liquidity-fee, outbound-fee, and refund-risk guidance.',
};

const buildQueryAssetNotationSource: SourceMeta = {
  ...assetNotationSource,
  retrievedAt: '2026-07-06',
  notes: 'Official asset-notation reference for chain.asset and token identifiers used in quotes, pools, and memos.',
};

const swapGuideSource: SourceMeta = {
  ...baseSwapGuideSource,
  retrievedAt: '2026-07-05',
  notes: 'Official quote, expiry, streaming swap, refund-address, and swap error-handling guidance.',
};

const memosSource: SourceMeta = {
  ...baseMemosSource,
  retrievedAt: '2026-07-05',
  notes: 'Official memo format, memo-size, dust-threshold, and swap parameter guidance.',
};

const liquidityActionMemosSource: SourceMeta = {
  ...memosSource,
  retrievedAt: '2026-07-06',
  notes: 'Official add-liquidity and withdraw-liquidity memo formats, paired-address fields, affiliate fields, basis points, and dust-threshold requirements.',
};

const liquidityActionNetworkHaltsSource: SourceMeta = {
  ...networkHaltsSource,
  retrievedAt: '2026-07-06',
  notes: 'Official distinction between LP pauses, trading halts, signing halts, and network-wide controls.',
};

const liquidityActionMimirsSource: SourceMeta = {
  ...constantsMimirSource,
  retrievedAt: '2026-07-06',
  notes: 'Official LP-management Mimir keys including PauseLP, PauseLPDeposit, liquidity lockup, pending cleanup, and asymmetric-withdrawal pauses.',
};

const cosmWasmSource: SourceMeta = {
  ...baseCosmWasmSource,
  label: 'THORChain CosmWasm docs',
  retrievedAt: '2026-07-05',
};

const docsPageSource: SourceMeta = {
  ...docsSource,
  retrievedAt: '2026-07-05',
};

const devDocsPageSource: SourceMeta = {
  ...devDocsSource,
  retrievedAt: '2026-07-05',
};

const networkHaltsPageSource: SourceMeta = {
  ...networkHaltsSource,
  retrievedAt: '2026-07-05',
};

const feesPageSource: SourceMeta = {
  ...feesSource,
  retrievedAt: '2026-07-05',
};

const adr026DynamicFeesPageSource: SourceMeta = {
  ...adr026DynamicFeesSource,
  retrievedAt: '2026-07-05',
};

const thornameGuidePageSource: SourceMeta = {
  ...thornameGuideSource,
  retrievedAt: '2026-07-05',
};

const liveInboundPageSource: SourceMeta = {
  ...liveInboundSource,
  retrievedAt: '2026-07-05',
};

const thornodeMimirPageSource: SourceMeta = {
  ...thornodeMimirSource,
  retrievedAt: '2026-07-05',
};

const midgardHealthPageSource: SourceMeta = {
  ...midgardHealthSource,
  retrievedAt: '2026-07-05',
};

const midgardNetworkPageSource: SourceMeta = {
  ...midgardNetworkSource,
  retrievedAt: '2026-07-05',
};

const midgardPoolsPageSource: SourceMeta = {
  ...midgardPoolsSource,
  retrievedAt: '2026-07-05',
};

const midgardEarningsPageSource: SourceMeta = {
  ...midgardEarningsSource,
  retrievedAt: '2026-07-05',
};

const dynamicL1FeesPageSource: SourceMeta = {
  ...dynamicL1FeesSource,
  retrievedAt: '2026-07-05',
};

const dynamicL1FeesCurrentPageSource: SourceMeta = {
  ...dynamicL1FeesCurrentSource,
  retrievedAt: '2026-07-05',
};

const ecosystemPageSource: SourceMeta = {
  ...ecosystemSource,
  retrievedAt: '2026-07-05',
};

export const CONTENT_ENTRIES: ContentEntry[] = [
  HOME_PAGE_ENTRY,
  SEARCH_PAGE_ENTRY,
  {
    id: 'protocol',
    title: 'Protocol',
    href: '/protocol',
    category: 'section',
    confidence: 'curated',
    description: 'Architecture, swaps, TSS, Bifrost, Mimir, halts, app layer, and supported chains.',
    body: 'THORChain protocol architecture protocol claim checks architecture explanation current availability claim security vault claim developer integration claim native cross-chain swaps Bifrost observers TSS vaults Mimir halts inbound addresses swap lifecycle refunds refund reasons streaming swaps StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit app layer CosmWasm live diagnostics current availability vault safety developer sources supported chains supported chain finder chain catalog boundary catalog listed is not availability address formats EIP-55 Base58 Bech32 CashAddr X-address dust threshold EdDSA Solana Check a route route quoteability.',
    tags: ['architecture', 'swaps', 'mimir', 'halts', 'supported chains'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsPageSource, devDocsPageSource, networkHaltsPageSource, liveInboundPageSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
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
    body: 'Network security nodes node operator guide node operator setup how to run a THORChain node run THORNode node setup validator node become a node operator Managing THORNodes churning slashing vault safety TSS reader path current-only operational state official halt keys HALTTRADING HALTSIGNING HALTCHURNING HALTWASMGLOBAL StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit memoless halt streaming swap pause RUNEPool deposit halt. Use incident records and the TSS deep dive for dated exploit and cryptographic migration wording.',
    tags: ['nodes', 'security', 'slashing', 'churning'],
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [docsPageSource, nodeManagingSource, nodeRisksRewardsSource, networkHaltsPageSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
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
    description: 'RUNE settlement, CLP pricing, fees, incentive pendulum, live RUNEPool/POL accounting, and trade assets.',
    body: 'RUNE settlement asset CLP slip ratio liquidity fee affiliate fee outbound fee incentive pendulum RUNEPool protocol owned liquidity POL live RUNEPool POL current snapshot read this snapshot first can I deposit can I withdraw which value matters no yield proof RUNEPool units provider value provider pnl current_deposit pol.value pol.pnl providers.value providers.pnl reserve.value RUNEPoolDepositMaturityBlocks RUNEPoolMaxReserveBackstop POL enabled pools POL-<Asset> runepool endpoint trade assets secured assets liquidity units APY economic claim checks current metric claim fee revenue claim tokenomics figure live data source health dated source do not claim future yield revenue lift route competitiveness recovery guarantees.',
    tags: ['rune', 'clp', 'fees', 'runepool'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsPageSource, devDocsPageSource, tokenomicsSource, feesPageSource, runePoolDocsSource, runePoolDevSource, runePoolEndpointSource, thornodeMimirPageSource],
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
    sources: [adr026DynamicFeesPageSource, feesPageSource, thornameGuidePageSource, dynamicL1FeesPageSource, dynamicL1FeesCurrentPageSource],
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
    description: 'Interfaces, wallets, explorers, developer tools, and chain-support references with explicit directory posture and non-endorsement checks.',
    body: 'THORChain ecosystem interface trust journey choose by intent swap quote wallet app explorer transaction refund evidence build integration interfaces wallets explorers THORSwap AsgardEX RuneScan SwapKit XChainJS supported chains inbound addresses TRON SOL XRP use for check before use catalog listed catalog presence directory posture source confidence wallet safety live protocol state source map non-endorsement third-party availability route safety route quality wallet permissions download integrity quote recipient slippage review package versions production readiness memo handling affiliate settings.',
    tags: ['apps', 'interfaces', 'wallets', 'chains'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [ecosystemPageSource, docsPageSource, devDocsPageSource, liveInboundPageSource, networkHaltsPageSource],
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
    body: 'Governance ADR Mimir halt trading halt signing pause LP incidents exploit reports GG20 THORFi unwind TCY recovery source-backed history governance claim checks operational Mimir claim ADR proposal status submit proposal vote proposal proposal voting governance proposal governance vote ADR proposal incident root-cause claim recovery solvency claim community sentiment claim live diagnostics current recovery tracker Recovery State Matrix THORFi debt unwind GG20 exploit recovery current user actions Safe current wording Verify Next Do Not Use This For ADR-028 needs-review recovery path No made-whole proof source boundary. Use incident records and security deep dives for exact cryptographic root-cause wording.',
    tags: ['governance', 'incidents', 'mimir', 'adr'],
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [docsPageSource, networkHaltsPageSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
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
    sources: [midgardHealthPageSource, midgardNetworkPageSource, midgardPoolsPageSource, midgardEarningsPageSource, thornodeMimirPageSource, devDocsPageSource],
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
    body: 'RUNE token settlement asset settlement role security bond liquidity pair tokenomics current supply framing reduced supply circulating supply reserve burns TCY recovery protocol owned liquidity RUNE action router RUNE holder actions how to buy RUNE where to swap RUNE RUNE staking stake RUNE can I stake RUNE route availability interface checklist RUNEPool evidence node bonding node guide RUNE claim checks RUNE number router which RUNE number live network metrics security constants minimum bond slash settings Mimir overrides supply framing dated source current network number live RUNE metrics tokenomics figure dated source value investment claim fair value price target investment suitability non-claims.',
    tags: ['rune', 'tokenomics'],
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [docsPageSource, tokenomicsSource, devDocsPageSource],
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
    body: 'TCY THORFi unwind Savers deprecated Lending deprecated archived January 2025 historical yield liabilities recovery Proposal 6 full debt recovery not guaranteed current TCY claim staking live Mimir controls read these controls first claim halt check staking halt check trading halt check source quality non-claim can I claim can I stake can I trade no recovery proof TCYCLAIMINGHALT TCYCLAIMINGSWAPHALT TCYSTAKINGHALT TCYSTAKEDISTRIBUTIONHALT TCYUNSTAKINGHALT HALTTCYTRADING current TCY controls.',
    tags: ['tcy', 'savers', 'lending', 'historical'],
    reviewedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
    sources: [archivedSource, docsPageSource, tokenomicsSource, tcyGuideSource, thorfiUnwindSource, exploitReportSource],
    nav: true,
    footer: true,
  },
  {
    id: 'deep-dives',
    title: 'Deep Dives',
    href: '/deep-dives',
    category: 'section',
    confidence: 'curated',
    description: 'Long-form source-backed explainers for live-data evidence, builder query planning, core THORChain concepts, LP actions, RUNEPool/POL evidence, operational controls, swap/refund triage, App Layer boundaries, and historical THORFi topics.',
    body: 'Deep dives build query data developer integration Midgard API THORNode API inbound_addresses quote swap Mimir source safety CLP liquidity actions LP actions RUNEPool POL protocol owned liquidity runepool endpoint provider pnl current_deposit add liquidity withdraw liquidity asymmetric withdrawal pool deposits Bifrost TSS churning slashing incentive pendulum RUNE settlement App Layer CosmWasm secured assets WASM controls Savers historical halt Mimir swap lifecycle Mimir halt controls operational controls source warnings absent keys streaming swaps refunds quote expiry refund reasons transaction evidence Midgard THORNode data failover provider freshness current-only source labels pinned snapshots dashboard metrics raw protocol state TCY recovery timeline THORFi unwind Proposal 6 full debt recovery not guaranteed.',
    tags: ['deep-dives', 'education'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [
      docsPageSource,
      devDocsPageSource,
      swapGuideSource,
      memosSource,
      feesPageSource,
      networkHaltsPageSource,
      thornodeMimirPageSource,
      liveInboundPageSource,
      connectingThorchainSource,
      queryingThorchainSource,
      constantsMimirSource,
      archivedSource,
      appLayerSource,
      asgardTssChurnSource,
      tokenomicsSource,
      runePoolDocsSource,
      runePoolDevSource,
      runePoolEndpointSource,
      tcyGuideSource,
      thorfiUnwindSource,
      exploitReport2Source,
    ],
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
    body: 'Glossary definitions definition map live state terms vault signing observation terms swap fee terms liquidity pool accounting terms app layer asset terms incident recovery terms quote quote expiry recommended_min_amount_in recommended minimum input dust threshold refund address streaming swap liquidity_tolerance_bps app layer terms history security terms Mimir Mimir override inbound address memo outbound fee affiliate fee dynamic L1 fee ADR-026 protocol-owned liquidity POL liquidity provider liquidity units asymmetric withdrawal impermanent loss IL protection secured asset trade asset synthetic asset App Layer CosmWasm Current-only CLP TSS GG20 DKLS Schnorr Paillier MTA multi-prime modulus KeyVerify key-sign failures compromised vault Bifrost RUNEPool Savers TCY Asgard vault protocol economics operations history developer terminology term map claim vocabulary current state fee outcomes app-layer availability recovery proof route quoteability refund cause settlement proof.',
    tags: ['glossary', 'terms', 'definitions'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsPageSource, devDocsPageSource, networkHaltsPageSource, adr026DynamicFeesPageSource, exploitReport2Source],
    footer: true,
  },
  {
    id: 'docs',
    title: 'Docs',
    href: '/docs',
    category: 'resource',
    confidence: 'curated',
    description: 'Official documentation, developer resources, and live API references.',
    body: 'Official THORChain docs developer docs Midgard API THORNode API network halts Mimir halt keys StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit RUNEPoolHaltWithdraw querying inbound addresses fees RUNE tokenomics value supply fair value market cap minimum bond slash settings Liquify Midgard Gateway Liquify THORNode Gateway gateway failover source map fast source triage current state integration docs historical reports third-party surfaces community sentiment RuneScan ViewBlock Messari GitHub.',
    tags: ['docs', 'resources', 'midgard', 'thornode', 'liquify', 'gateway'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsPageSource, devDocsPageSource, networkHaltsPageSource, midgardHealthPageSource, midgardNetworkPageSource, thornodeMimirPageSource],
    nav: true,
    footer: true,
  },
  {
    id: 'deep-dive-midgard-thornode-data',
    title: 'Midgard And THORNode Data',
    href: '/deep-dives/midgard-thornode-data',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How to choose between Midgard dashboard data and THORNode raw protocol state without overclaiming live evidence, route availability, or recovery state.',
    body: 'Midgard THORNode data live data guide data source guide Midgard guide THORNode guide Midgard vs THORNode THORNode vs Midgard which source should I use Midgard or THORNode dashboard metrics versus raw protocol state live sources source map what this guide can prove claim to source matrix current-only provider failover same-provider evidence pinned snapshots dashboard metrics raw protocol state Midgard health Midgard network Midgard pools Midgard earnings available pools pool depth earnings APY THORNode mimir inbound_addresses quote swap route availability halt pause operation state dynamic_l1_fees source warnings provider mismatch stale unpinned missing fields malformed base units unavailable insufficient samples not zero data quality readiness degraded endpoint family source labels dashboard evidence rules incident recovery deprecated product history.',
    tags: ['data', 'midgard', 'thornode', 'sources'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [
      connectingThorchainSource,
      queryingThorchainSource,
      midgardHealthPageSource,
      midgardNetworkPageSource,
      midgardPoolsPageSource,
      midgardEarningsPageSource,
      thornodeMimirPageSource,
      liveInboundPageSource,
    ],
    featured: true,
  },
  {
    id: 'deep-dive-build-query-data',
    title: 'Build And Query THORChain Data',
    href: '/deep-dives/build-query-data',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'A builder-focused query plan for choosing THORChain data sources, quotes, inbound addresses, units, errors, and provider posture without overclaiming.',
    body: 'Build And Query THORChain Data build query guide developer integration Midgard API THORNode API Midgard vs THORNode THORNode vs Midgard which endpoint which source should I use Midgard or THORNode Cosmos RPC Tendermint RPC gRPC query plan source families x-client-id rate limits 429 503 backoff run own node production public endpoints inbound_addresses inbound address quote swap quote expiry do not cache quotes one request per second quote rate limit recommended_min_amount_in expected_amount_out fees slippage_bps total_bps memo dust_threshold gas_rate router Mimir halt source warnings asset notation 1e8 base units available pools provider failover response shape malformed fields not zero not transaction instructions.',
    tags: ['data', 'developer', 'midgard', 'thornode'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [
      buildQueryConnectingSource,
      buildQueryQueryingSource,
      buildQuerySwapGuideSource,
      buildQueryMemosSource,
      buildQueryFeesSource,
      buildQueryAssetNotationSource,
      midgardPoolsPageSource,
      thornodeMimirPageSource,
      liveInboundPageSource,
    ],
    featured: true,
  },
  {
    id: 'deep-dive-clp',
    title: 'Continuous Liquidity Pools (CLP)',
    href: '/deep-dives/clp',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How THORChain slip-based pools price native swaps, and where formula evidence stops before current route, refund, LP, or yield claims.',
    body: 'Continuous Liquidity Pools CLP what CLP can prove evidence ladder slip ratio x divided by X plus x liquidity fee output amount RUNE paired pools slippage liquidity providers native cross-chain swaps swap lifecycle quote inbound memo execution outbound refund stale quote min output recommended_min_amount_in quote expiry halt signing trading pool depth APY route availability LP action availability Liquidity Actions RUNEPool Streaming Swaps And Refunds non-claims not route safety not wallet instructions not yield proof. Savers are historical and deprecated.',
    tags: ['clp', 'fees', 'swaps'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsPageSource, devDocsPageSource, nativeSwapsSource, swapGuideSource],
    featured: true,
  },
  {
    id: 'deep-dive-liquidity-actions',
    title: 'Liquidity Actions',
    href: '/deep-dives/liquidity-actions',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How to separate LP add, withdraw, pool-deposit, asymmetric-withdrawal, RUNEPool, and yield claims from ordinary swap availability.',
    body: 'Liquidity Actions LP actions add liquidity withdraw liquidity LP deposit LP withdrawal pool deposits asymmetric withdrawal PauseLP PauseLPDeposit PauseAsymWithdrawal RUNEPool liquidity units paired address symmetric deposit asymmetric deposit pending liquidity cleanup liquidity lockup blocks basis points dust threshold memo ADD WITHDRAW Midgard pools LP APY earnings intervals pooled RUNE network diagnostics source warnings not wallet instructions not yield proof not swap halt.',
    tags: ['clp', 'liquidity', 'operations'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [
      liquidityProvidersSource,
      liquidityProviderFaqSource,
      liquidityActionMemosSource,
      liquidityActionNetworkHaltsSource,
      liquidityActionMimirsSource,
      midgardPoolsPageSource,
      midgardNetworkPageSource,
      midgardEarningsPageSource,
      thornodeMimirPageSource,
    ],
    featured: true,
  },
  {
    id: 'deep-dive-runepool-pol',
    title: 'RUNEPool And POL Evidence',
    href: '/deep-dives/runepool-pol',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How to read RUNEPool and protocol-owned-liquidity evidence without turning current accounting into yield, safety, or availability claims.',
    body: 'RUNEPool POL protocol owned liquidity evidence RUNEPool units provider value provider pnl current_deposit runepool endpoint rune_provider endpoint POL enabled pools POL-<Asset> RUNEPOOLENABLED RUNEPoolDepositMaturityBlocks RUNEPoolMaxReserveBackstop deposit halt withdraw halt current-only accounting source freshness checked height aggregate exposure impermanent loss negative yield non-claims future yield profitability investment suitability route health wallet instructions.',
    tags: ['runepool', 'pol', 'liquidity', 'economics'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [
      runePoolDocsSource,
      runePoolDevSource,
      runePoolEndpointSource,
      constantsMimirSource,
      thornodeMimirPageSource,
      midgardPoolsPageSource,
    ],
    featured: true,
  },
  {
    id: 'deep-dive-streaming-swaps-refunds',
    title: 'Streaming Swaps And Refunds',
    href: '/deep-dives/streaming-swaps-refunds',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How fresh quotes, memos, streaming parameters, fee thresholds, halts, and transaction evidence explain swap refunds.',
    body: 'Streaming swaps refunds swap refund swap failed quote expiry do not cache quote stale inbound address recommended_min_amount_in dust threshold memo invalid memo too long destination address price tolerance liquidity_tolerance_bps min output refund address StreamingSwapPause HaltMemoless affiliate bps quote error expected_amount_out fees slippage_bps total_bps outbound fee route halted signing halted trading halted evidence ladder transaction hash non-claims.',
    tags: ['swaps', 'refunds', 'streaming', 'memos'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [swapGuideSource, memosSource, feesPageSource, networkHaltsPageSource, liveInboundPageSource],
    featured: true,
  },
  {
    id: 'deep-dive-incentive-pendulum',
    title: 'The Incentive Pendulum',
    href: '/deep-dives/incentive-pendulum',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Automatic reward balancing between node bond security and pooled liquidity, with current APY and health claims kept live-source dependent.',
    body: 'Incentive Pendulum bonded RUNE pooled RUNE rewards node operators liquidity providers security liquidity ratio self-correcting target 2:1 bond-to-stake ratio economic model emission schedule reserve APY reward split live metrics Midgard health source mismatch evidence ladder common misreadings current APY realized yield route quoteability protocol revenue lift not investment suitability network health non-claims.',
    tags: ['economics', 'rewards'],
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [economicModelSource, networkSecurityGovernanceSource, docsPageSource, midgardNetworkSource],
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
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsPageSource, asgardTssChurnSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
    featured: true,
  },
  {
    id: 'deep-dive-churning',
    title: 'Churning and Node Lifecycle',
    href: '/deep-dives/churning',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Validator rotation, node lifecycle, vault migration, standby competition, and why current churn state must be checked live.',
    body: 'Churning node lifecycle active standby ready whitelisted churn interval vault rotation migration unbonding forced churn slash points HALTCHURNING current churn height active set readiness vault migration not proof of unbonding availability.',
    tags: ['nodes', 'churning'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [bifrostTssVaultsSource, nodeRisksRewardsSource, docsPageSource],
  },
  {
    id: 'deep-dive-slashing',
    title: 'Slashing and Economic Security',
    href: '/deep-dives/slashing',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Bonded RUNE, slash exposure, and why current constants should be source checked.',
    body: 'Slashing economic security bonded RUNE slash points reward slashing bond slashing signing observation keygen failures constants Mimir current-only node status operator evidence ladder not every fault burns bond not every incident made whole.',
    tags: ['security', 'slashing'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [nodeRisksRewardsSource, nodeManagingSource, docsPageSource, devDocsPageSource],
  },
  {
    id: 'deep-dive-bifrost',
    title: 'Bifrost Bridge and Cross-Chain Observability',
    href: '/deep-dives/bifrost',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How active nodes observe external chains, run chain clients, and why observation evidence is not the same thing as route execution.',
    body: 'Bifrost observers external chains inbound transactions outbound confirmations chain reorgs finality two thirds observation chain clients gas confirmation broadcast inbound_addresses route execution quote memo outbound refund diagnostics source freshness.',
    tags: ['bifrost', 'observation'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [bifrostTssVaultsSource, thornodeStackSource, docsPageSource, devDocsPageSource],
  },
  {
    id: 'deep-dive-app-layer',
    title: 'App Layer, CosmWasm, and Secured Assets',
    href: '/deep-dives/app-layer',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How THORChain App Layer contracts, secured assets, trade-account boundaries, and WASM halt controls fit together without overclaiming current availability.',
    body: 'App Layer CosmWasm WASM x/wasm Rujira RUJI secured assets secured asset movement trade accounts trade-account arbitrage flow TokenFactory X assets IBC SECURE+ SECURE- App Layer claim checks what this page can prove evidence ladder common misreadings contract app availability interface wallet support HaltSecuredGlobal HaltSecuredDeposit HaltSecuredWithdraw HaltWasmGlobal HaltWasmDeployer HaltWasmCs HaltWasmContract HaltOracle WasmPermissionless WasmMinGasPrice current-only Mimir network diagnostics no global WASM halt scoped deployer checksum contract oracle source warnings wallet listing not safety review absent halt keys not health proof.',
    tags: ['app-layer', 'cosmwasm', 'secured-assets', 'mimir'],
    reviewedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
    sources: [appLayerSource, cosmWasmSource, securedAssetsSource, securedAssetsDevSource, networkHaltsPageSource, constantsMimirSource],
    featured: true,
  },
  {
    id: 'deep-dive-mimir-halt-controls',
    title: 'Mimir And Halt Controls',
    href: '/deep-dives/mimir-halt-controls',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'How to read Mimir halt keys, scoped controls, scheduled values, absent keys, and source warnings before making current availability claims.',
    body: 'Mimir halt controls network diagnostics current-only operational controls source warnings review keys HALTTRADING HALTSIGNING HALTCHURNING PAUSELP PAUSELOANS StreamingSwapPause HaltMemoless RUNEPoolHaltDeposit RUNEPoolHaltWithdraw HaltWasmGlobal HaltWasmDeployer HaltWasmCs HaltWasmContract HaltOracle HaltSecuredGlobal HaltSecuredDeposit HaltSecuredWithdraw TradeAccountsEnabled PauseBond PauseUnbond HaltRebond HaltOperatorRotate active scheduled inactive absent missing halt key source quality degraded ordinary swaps LP actions pool deposits chain-scoped controls inbound_addresses quote swap route availability.',
    tags: ['mimir', 'halts', 'operations', 'diagnostics'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [networkHaltsPageSource, constantsMimirSource, thornodeMimirPageSource, liveInboundPageSource, devDocsPageSource],
    featured: true,
  },
  {
    id: 'deep-dive-rune-settlement',
    title: 'RUNE as the Universal Settlement Asset',
    href: '/deep-dives/rune-settlement',
    category: 'deep-dive',
    confidence: 'curated',
    description: 'Why RUNE-paired liquidity explains the base settlement model without proving current route health, value, or availability.',
    body: 'RUNE settlement universal settlement asset BTC RUNE ETH pool pairs unified liquidity price discovery security bond liquidity pair common settlement intermediate asset route availability live pool depth quote quality non-claims current APY investment value.',
    tags: ['rune', 'settlement'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [runeDocsSource, nativeSwapsSource, tokenomicsSource, docsPageSource],
  },
  {
    id: 'deep-dive-tcy-recovery-timeline',
    title: 'TCY Recovery Timeline',
    href: '/deep-dives/tcy-recovery-timeline',
    category: 'deep-dive',
    confidence: 'historical',
    description: 'Dated THORFi unwind, Proposal 6, TCY recovery-token mechanics, and post-exploit recovery boundaries without current recovery overclaims.',
    body: 'TCY Recovery Timeline THORFi unwind Savers Lending deprecated January 2025 node-voted pause outstanding liabilities Proposal 6 67% approval defaulted debt 1 TCY per $1 debt 210M supply 10% system income revenue share full debt recovery market dependent not guaranteed no governance rights claim staking unstaking trading current-only TCYCLAIMINGHALT TCYSTAKINGHALT TCYSTAKEDISTRIBUTIONHALT TCYUNSTAKINGHALT HALTTCYTRADING May 2026 GG20 TSS exploit ADR-028 separate recovery context non-claims made whole par redemption investment value.',
    tags: ['tcy', 'savers', 'lending', 'historical', 'recovery'],
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [thorfiUnwindSource, tcyGuideSource, tokenomicsSource, archivedSource, exploitReportSource, exploitReport2Source, protocolUpgradeV319Source],
    featured: true,
  },
  {
    id: 'deep-dive-savers',
    title: 'Savers and Lending (Historical)',
    href: '/deep-dives/savers',
    category: 'deep-dive',
    confidence: 'historical',
    description: 'Historical overview of deprecated Savers/Lending mechanics, proof boundaries, evidence ladder, and TCY aftermath checks.',
    body: 'Savers deprecated Lending deprecated THORFi historical single-sided exposure synthetics liabilities TCY January 2025 archived docs TCY Recovery Timeline Proposal 6 current TCY Mimir controls TCYCLAIMINGHALT TCYSTAKINGHALT TCYSTAKEDISTRIBUTIONHALT TCYUNSTAKINGHALT HALTTCYTRADING evidence ladder common misreadings full recovery not guaranteed non-claims Savers are back TCY exists historical liability numbers are current debt.',
    tags: ['savers', 'lending', 'tcy', 'historical'],
    reviewedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
    sources: [archivedSource, thorfiUnwindSource, tcyGuideSource, tokenomicsSource, docsPageSource],
  },
];

export const ROUTE_SOURCE_POSTURE_ENTRY_IDS = [
  'home',
  'search',
  'protocol',
  'economics',
  'rune',
  'tcy',
  'ecosystem',
  'governance',
  'network',
  'dynamic-fees',
  'docs',
  'deep-dives',
  'glossary',
  'stats',
] as const;

export const NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.nav)
  .map((entry) => ({ name: entry.navLabel ?? entry.title, href: entry.href }));

export const FOOTER_NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.footer)
  .map((entry) => ({ label: entry.footerLabel ?? entry.title, href: entry.href }));

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
    description: 'Start with RUNE settlement, pool mechanics, live-data source boundaries, chain observation, and vault signing before using dashboard numbers.',
    entryIds: ['deep-dive-rune-settlement', 'deep-dive-clp', 'deep-dive-midgard-thornode-data', 'deep-dive-bifrost', 'deep-dive-tss'],
    verifyBeforeClaiming: [
      'Current supported chains, halts, or inbound-address availability.',
      'Current implementation constants, active Mimir overrides, or provider-independent dashboard numbers.',
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
    searchTerms: ['new to thorchain', 'start here', 'protocol basics', 'how thorchain works', 'native swaps', 'vault signing', 'Midgard THORNode source boundary'],
    confidence: 'curated',
    reviewedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
    sources: [nativeSwapsSource, runeDocsSource, continuousLiquidityPoolsSource, bifrostTssVaultsSource, queryingThorchainSource],
  },
  {
    id: 'swap-economics',
    title: 'Swap Economics',
    audience: 'Readers comparing settlement, slip, liquidity, rewards, and fee signals.',
    description: 'Read settlement, CLP mechanics, source-bound dashboard evidence, RUNEPool/POL accounting boundaries, and refund/streaming evidence first, then connect incentives and security costs before interpreting fee dashboards.',
    entryIds: ['deep-dive-rune-settlement', 'deep-dive-clp', 'deep-dive-midgard-thornode-data', 'deep-dive-runepool-pol', 'deep-dive-streaming-swaps-refunds', 'deep-dive-incentive-pendulum', 'deep-dive-slashing'],
    verifyBeforeClaiming: [
      'Current liquidity depth, APY, and earnings coverage from live Midgard snapshots.',
      'Current RUNEPool enablement, provider PnL, POL-enabled pool scope, or deposit/withdraw availability.',
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
    searchTerms: ['swap economics', 'liquidity fees', 'slip', 'incentive pendulum', 'pooled RUNE', 'RUNEPool', 'POL evidence', 'protocol owned liquidity', 'provider PnL', 'LP APY', 'dynamic fee', 'streaming swaps', 'swap refunds', 'Midgard dashboard metrics'],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsSource, devDocsSource, feesSource, swapGuideSource, runePoolDevSource],
  },
  {
    id: 'liquidity-actions',
    title: 'Liquidity Actions',
    audience: 'Readers deciding how to describe LP adds, withdrawals, pool-deposit pauses, asymmetric withdrawals, or LP metrics without making wallet-flow claims.',
    description: 'Start with the liquidity-action evidence ladder, then use RUNEPool/POL boundaries, live network diagnostics, and Midgard stats before interpreting CLP mechanics, APY, or transaction evidence.',
    entryIds: ['deep-dive-liquidity-actions', 'deep-dive-runepool-pol', 'deep-dive-clp', 'deep-dive-mimir-halt-controls', 'deep-dive-midgard-thornode-data', 'deep-dive-incentive-pendulum'],
    verifyBeforeClaiming: [
      'Current LP action, pool-deposit, asymmetric-withdrawal, RUNEPool, and source-warning state.',
      'Whether the claim is about availability, memo shape, RUNEPool/POL accounting, pool data, historical transaction evidence, or future yield.',
    ],
    followUpLinks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check live THORNode evidence for LP pauses, pool-deposit pauses, asymmetric-withdrawal pauses, and warnings.',
      },
      {
        label: 'Stats decision panel',
        href: '/stats#stats-look-here-first',
        description: 'Check current Midgard metric health before using pool depth, APY, or earnings intervals.',
      },
    ],
    searchTerms: ['liquidity actions path', 'add liquidity', 'withdraw liquidity', 'LP deposit', 'LP withdrawal', 'asymmetric withdrawal', 'pool deposit pause', 'RUNEPool halt', 'RUNEPool withdrawal', 'POL accounting', 'LP APY', 'liquidity units'],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [liquidityProvidersSource, liquidityProviderFaqSource, liquidityActionMemosSource, liquidityActionNetworkHaltsSource, liquidityActionMimirsSource, runePoolDevSource, midgardPoolsSource, midgardNetworkSource],
  },
  {
    id: 'developer-data-integration',
    title: 'Build And Query',
    audience: 'Builders and analysts deciding which endpoint family owns a THORChain data claim.',
    description: 'Start with the build/query plan, then connect source-family boundaries, halt controls, quote/refund behavior, and interface checks before shipping a data or transaction workflow.',
    entryIds: ['deep-dive-build-query-data', 'deep-dive-midgard-thornode-data', 'deep-dive-mimir-halt-controls', 'deep-dive-streaming-swaps-refunds', 'deep-dive-liquidity-actions'],
    verifyBeforeClaiming: [
      'Current quoteability, chain availability, inbound-address freshness, Mimir state, and source-warning posture.',
      'That public endpoints, SDKs, wallets, or copied memos are safe, durable, or production-ready.',
    ],
    followUpLinks: [
      {
        label: 'Developer source map',
        href: '/docs#developer-integration',
        description: 'Use the shorter source-family map when you need official docs, fees, memos, asset notation, or endpoint references.',
      },
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check live THORNode evidence before treating a route, chain, or LP action as currently available.',
      },
    ],
    searchTerms: ['build query path', 'developer data integration', 'Midgard API', 'THORNode API', 'inbound_addresses', 'quote swap', 'source warning', 'same-provider', 'recommended_min_amount_in', 'liquidity_tolerance_bps', 'memo'],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [buildQueryConnectingSource, buildQueryQueryingSource, buildQuerySwapGuideSource, buildQueryMemosSource, buildQueryFeesSource, buildQueryAssetNotationSource],
  },
  {
    id: 'network-security',
    title: 'Network Security',
    audience: 'Readers tracing vault safety, observation, node rotation, slash exposure, and current pause controls.',
    description: 'Use this path when a security or availability claim depends on halt controls, TSS, Bifrost observations, churn, or bonded-node incentives.',
    entryIds: ['deep-dive-mimir-halt-controls', 'deep-dive-tss', 'deep-dive-bifrost', 'deep-dive-churning', 'deep-dive-slashing'],
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
    searchTerms: [
      'network security',
      'TSS',
      'vault safety',
      'Bifrost observation',
      'churning',
      'slashing',
      'GG20',
      'Paillier',
      'DKLS',
      'Schnorr',
      'MTA signing',
      'key-sign failures',
      'KeyVerify',
      'compromised vault',
      'Mimir halt controls',
      'scheduled controls',
      'absent Mimir key',
      'source warning',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, asgardTssChurnSource, exploitReport2Source, protocolUpgradeV319Source, networkHaltsSource, constantsMimirSource],
  },
  {
    id: 'app-layer-integrations',
    title: 'App Layer And Integrations',
    audience: 'Readers trying to separate base-layer swaps, CosmWasm contracts, secured assets, trade accounts, and live halt controls.',
    description: 'Start with the App Layer model, then read halt-control scope before connecting it back to pools, observation, and current network diagnostics.',
    entryIds: ['deep-dive-app-layer', 'deep-dive-mimir-halt-controls', 'deep-dive-clp', 'deep-dive-bifrost'],
    verifyBeforeClaiming: [
      'Current secured-asset, trade-account, oracle, WASM, signing, trading, and chain-specific Mimir state.',
      'That a specific interface, contract, deployer, checksum, or asset flow is safe, supported, or currently available.',
    ],
    followUpLinks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check live secured-asset, trade-account, app-layer, and chain halt evidence.',
      },
      {
        label: 'Developer integration',
        href: '/docs#developer-integration',
        description: 'Use official docs before giving memo, endpoint, or asset-notation guidance.',
      },
    ],
    searchTerms: ['app layer integrations', 'app layer', 'CosmWasm', 'secured assets', 'trade accounts', 'WASM halt', 'HaltWasm', 'HaltSecured'],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [appLayerSource, cosmWasmSource, securedAssetsDevSource, networkHaltsSource, constantsMimirSource],
  },
  {
    id: 'historical-recovery',
    title: 'Historical Recovery',
    audience: 'Readers separating deprecated THORFi context, TCY framing, exploit history, and current recovery state.',
    description: 'Start with the TCY recovery timeline, then read historical Savers/Lending mechanics and the security mechanics that shaped later incident-recovery claims.',
    entryIds: ['deep-dive-tcy-recovery-timeline', 'deep-dive-savers', 'deep-dive-tss', 'deep-dive-slashing', 'deep-dive-churning'],
    verifyBeforeClaiming: [
      'Current TCY operations, balances, distributions, or recovery progress.',
      'Current solvency, restart, or safety state beyond dated incident and upgrade reports.',
    ],
    followUpLinks: [
      {
        label: 'Recovery tracker',
        href: '/governance#current-recovery',
        description: 'Use records explicitly tagged current or needs-review, then pair them with live diagnostics before making recovery-state claims.',
      },
      {
        label: 'TCY page',
        href: '/tcy',
        description: 'Check conservative TCY and historical THORFi wording before making recovery-token claims.',
      },
    ],
    searchTerms: ['historical recovery', 'Savers Lending', 'THORFi', 'TCY', 'TCY recovery timeline', 'Proposal 6', 'full debt recovery not guaranteed', 'exploit recovery', 'ADR-028', 'restart', 'security incident'],
    confidence: 'historical',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [archivedSource, thorfiUnwindSource, tcyGuideSource, tokenomicsSource, exploitReportSource, exploitReport2Source, protocolUpgradeV319Source],
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
    href: '/deep-dives/build-query-data#query-plan',
    description: 'A builder query plan for Midgard, THORNode, inbound addresses, quotes, Mimir, fees, memos, units, and source warnings.',
  },
  {
    label: 'TCY and THORFi',
    href: '/tcy',
    description: 'Historical THORFi context, TCY recovery-token framing, and links back to RUNE/tokenomics source boundaries.',
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
    label: 'Check a specific route',
    href: '/network#check-a-route',
    badge: 'operations',
    description: 'Probe a route by asset pair and amount, then use diagnostics for chain halts, signing, LP controls, and source warnings.',
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
    id: 'rune-claim',
    question: 'Is this a RUNE claim?',
    label: 'RUNE claim checks',
    href: '/rune#rune-number-router',
    badge: 'token',
    description: 'Separate settlement role, live metrics, dated tokenomics, and value or investment non-claims before quoting RUNE.',
  },
  {
    id: 'runepool-pol',
    question: 'Is this RUNEPool or POL?',
    label: 'RUNEPool/POL evidence',
    href: '/economics#runepool-pol-live',
    badge: 'accounting',
    description: 'Check current RUNEPool accounting, bucket relationship, POL scope, and deposit or withdrawal caveats without turning them into yield proof.',
  },
  {
    id: 'tcy-controls',
    question: 'Can I claim or stake TCY?',
    label: 'Current TCY controls',
    href: '/tcy#tcy-current-controls',
    badge: 'recovery',
    description: 'Check TCY claim, staking, distribution, unstaking, claim-swap, trading, and source-warning posture before making current action claims.',
  },
  {
    id: 'history-recovery',
    question: 'Is this history or recovery?',
    label: 'Governance claim checks',
    href: '/governance#governance-claim-checks',
    badge: 'history',
    description: 'Route ADR status, incident root cause, recovery state, and community sentiment through the right dated or live source path.',
  },
  {
    id: 'interface',
    question: 'Which interface should I inspect?',
    label: 'Interface checklist',
    href: '/ecosystem#interface-use-checklist',
    badge: 'wallets',
    description: 'Follow the interface trust journey before using third-party wallet, explorer, swap, or integration surfaces.',
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
      {
        label: 'RUNEPool/POL snapshot',
        href: '/economics#runepool-pol-live',
        description: 'Current RUNEPool accounting, POL-enabled pool scope, and separate RUNEPool availability caveats.',
      },
      {
        label: 'Current TCY controls',
        href: '/tcy#tcy-current-controls',
        description: 'Claim, stake, distribution, unstake, claim-swap, trading, and TCY source-warning posture.',
      },
    ],
    avoidClaiming: 'Durable uptime, safety, or future availability from a single current-only response.',
  },
  {
    id: 'build-or-explain-integration',
    claim: 'A memo, fee, asset notation, endpoint, or integration behavior works a certain way.',
    startWith: {
      label: 'Build And Query Guide',
      href: '/deep-dives/build-query-data#query-plan',
    },
    why: 'Static docs explain intended/design behavior, not proof that something is unpaused now. Pair official developer docs with live endpoint and halt-state checks before readers transact or build.',
    nextChecks: [
      {
        label: 'Developer source map',
        href: '/docs#developer-integration',
        description: 'Official docs, fees, memos, asset notation, and endpoint references.',
      },
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Confirm the relevant chain or action is not currently paused.',
      },
      {
        label: 'Glossary',
        href: '/glossary#glossary-definition-map',
        description: 'Short definitions for Mimir, inbound addresses, memos, fees, and related terms.',
      },
    ],
    avoidClaiming: 'That static docs prove the feature is live, unpaused, or correctly implemented by every interface.',
  },
  {
    id: 'ordinary-fee-or-quote-limit',
    claim: 'A swap fee, affiliate fee, outbound fee, slip fee, or quote minimum explains a user-facing result.',
    startWith: {
      label: 'Swap Refund And Fee Triage',
      href: '/deep-dives/streaming-swaps-refunds#what-to-check-first',
    },
    why: 'Ordinary fee questions usually depend on the fresh quote response, route amount, liquidity/slip math, outbound cost, affiliate fields, dust thresholds, and current halt state. ADR-026 dynamic-fee records are a separate experiment and should not be used as the default explanation for every high-fee quote.',
    nextChecks: [
      {
        label: 'Developer fee docs',
        href: '/docs#developer-integration',
        description: 'Official fee categories, quote fields, memo fields, dust thresholds, and asset notation.',
      },
      {
        label: 'CLP mechanics',
        href: '/deep-dives/clp#what-clp-can-prove',
        description: 'Slip, liquidity fee, pool-depth, and output-mechanics explanation without live route claims.',
      },
      {
        label: 'Dynamic fee tracker',
        href: '/dynamic-fees#dynamic-fees-live',
        description: 'Use only when the claim is specifically about ADR-026 dynamic L1 fee floors or partner records.',
      },
    ],
    avoidClaiming: 'That one fee field proves route competitiveness, interface quality, revenue lift, or future quote cost.',
  },
  {
    id: 'app-contract-secured-asset',
    claim: 'An App Layer contract, secured asset, trade account, or app route is usable now.',
    startWith: {
      label: 'App Layer Claim Checks',
      href: '/deep-dives/app-layer#what-to-verify-before-claiming',
    },
    why: 'Contract, secured-asset, trade-account, and app-interface claims cross multiple proof paths. Static docs explain the model; current use needs live WASM, secured-asset, trade-account, oracle, signing, trading, chain, and interface evidence.',
    nextChecks: [
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Current WASM, secured-asset, trade-account, signing, trading, chain, and source-warning posture.',
      },
      {
        label: 'Developer integration',
        href: '/docs#developer-integration',
        description: 'Official docs for asset notation, memos, fees, quote behavior, and endpoint shape.',
      },
      {
        label: 'Interface checklist',
        href: '/ecosystem#interface-use-checklist',
        description: 'Wallet, app, quote recipient, memo construction, and download/source-integrity checks.',
      },
    ],
    avoidClaiming: 'Contract safety, wallet support, redemption capacity, route availability, or execution success from docs or ecosystem listings alone.',
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
        label: 'TCY recovery timeline',
        href: '/deep-dives/tcy-recovery-timeline#what-to-check-now',
        description: 'Dated THORFi unwind, TCY mechanics, and recovery non-claims.',
      },
      {
        label: 'Current TCY controls',
        href: '/tcy#tcy-current-controls',
        description: 'Use live controls for present-tense claim, stake, distribution, unstake, claim-swap, or trading availability.',
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
    id: 'rune-tokenomics-or-value',
    claim: 'A RUNE number, supply figure, security constant, price, or value claim needs a source.',
    startWith: {
      label: 'RUNE Tokenomics And Value',
      href: '/docs#rune-tokenomics-and-value',
    },
    why: 'RUNE appears in settlement, liquidity, security, tokenomics, and market discussion. Those claims use different source families and should not reuse one number as proof for another.',
    nextChecks: [
      {
        label: 'RUNE number router',
        href: '/rune#rune-number-router',
        description: 'Pick live metrics, security constants, dated supply framing, or value non-claims before quoting RUNE.',
      },
      {
        label: 'Stats look-first panel',
        href: '/stats#stats-look-here-first',
        description: 'Use current Midgard/THORNode source labels for pooled RUNE, reserve, bond, nodes, earnings, or APY-style values.',
      },
      {
        label: 'Network diagnostics',
        href: '/network#network-diagnostics',
        description: 'Check current THORNode/Mimir evidence for minimum bond, slash settings, signing state, and operational controls.',
      },
    ],
    avoidClaiming: 'Price targets, fair value, market cap, exchange float, investment suitability, guaranteed yield, or live security constants from dated tokenomics text alone.',
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
    id: 'learn-thorchain',
    label: 'New to THORChain',
    question: 'How does THORChain work, and where should a beginner start?',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    description: 'Start with the curated reader path for settlement, pools, Bifrost, and vault signing before opening the dashboards.',
    searchTerms: ['how does thorchain work', 'getting started', 'beginner', 'start here', 'protocol basics', 'new to thorchain', 'learn thorchain', 'how thorchain works', 'native swaps'],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource],
  },
  {
    id: 'supported-chain-catalog',
    label: 'Find catalog-listed chains',
    question: 'Which chains appear in the reviewed THORChain catalog, and does listed mean usable now?',
    href: '/protocol#supported-chain-finder',
    description: 'Search the reviewed chain catalog first. A match proves catalog presence only; absence from this reviewed snapshot is not permanent protocol proof, and current route availability still needs live diagnostics.',
    searchTerms: [
      'supported chains',
      'which chains are supported',
      'list supported chains',
      'what chains does THORChain support',
      'chain support',
      'supported chain catalog',
      'supported chain finder',
      'is chain supported',
      'is this chain supported',
      'catalog listed chain',
      'chain not listed',
      'unsupported chain',
      'network support',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-10',
    nextReviewDue: '2026-08-10',
    sources: [liveInboundSource, queryingThorchainSource, networkHaltsSource],
  },
  {
    id: 'swap-availability',
    label: 'Can I swap right now?',
    question: 'Can this specific route quote, or is trading, signing, observation, or a chain paused?',
    href: '/network#check-a-route',
    description: 'Start with the route checker for a concrete asset pair and amount, then read live THORNode diagnostics for chain-wide blockers and source warnings.',
    searchTerms: ['swap right now', 'can i swap', 'is swapping enabled', 'check a route', 'route checker', 'route quote', 'current quote', 'fresh quote', 'latest quote', 'quote available', 'specific route', 'route available', 'route availability', 'is route available', 'can this route quote', 'BTC ETH route', 'ETH to BTC swap', 'asset pair route', 'pair route quote', 'trading halted', 'signing paused', 'chain availability', 'supported chain live availability', 'is a listed chain usable', 'halted chain', 'which chains are halted', 'is THORChain paused', 'live status'],
    confidence: 'official',
    reviewedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
    sources: [swapGuideSource, networkHaltsSource, liveInboundSource],
  },
  {
    id: 'swap-refund-lifecycle',
    label: 'Why did my swap refund?',
    question: 'Was the swap stopped by memo input, quote limits, fees, halts, signing, or changing live state?',
    href: '/deep-dives/streaming-swaps-refunds#what-to-check-first',
    description: 'Start with refund triage before narrowing into live halts, quote limits, memos, outbound fees, or transaction evidence.',
    searchTerms: ['swap refund', 'swap failed', 'why did my swap refund', 'where is my swap', 'track transaction', 'track swap', 'pending outbound', 'missing outbound', 'outbound missing', 'no outbound', 'outbound delay', 'outbound observed', 'outbound observed but not sent', 'outbound sent', 'outbound sent but not received', 'transaction stuck', 'refund reason', 'stale quote', 'stale quote minimum output', 'expired quote', 'stale inbound address', 'inbound address stale', 'minimum output', 'minimum receive', 'min output', 'min receive', 'memo invalid', 'invalid memo', 'memo too long', 'wrong refund address', 'bad refund address', 'price tolerance', 'liquidity tolerance', 'outbound failed', 'quote failed', 'swap lifecycle', 'inbound outbound refund', 'streaming swap', 'streaming swaps'],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [swapGuideSource, memosSource, feesSource, networkHaltsSource],
  },
  {
    id: 'source-choice',
    label: 'Which source should I trust?',
    question: 'Am I making a current-state, historical, governance, integration, or sentiment claim?',
    href: '/docs#source-map-chooser',
    description: 'Start with fast source triage and the source-map chooser before narrowing into live evidence, static docs, dated reports, explorers, or community context.',
    searchTerms: [
      'source trust',
      'which source',
      'source map',
      'source triage',
      'fast source triage',
      'current-only evidence',
      'canonical proof',
      'non-claims',
      'docs provenance',
      'data provenance',
      'metric provenance',
      'source freshness',
      'stale source',
      'source boundary',
      'source posture',
      'page source posture',
      'source review date',
      'where did this number come from',
      'where did this metric come from',
      'match source to claim',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource, networkHaltsSource],
  },
  {
    id: 'rune-tokenomics',
    label: 'RUNE and tokenomics claims',
    question: 'Am I explaining RUNE, quoting tokenomics, or making a value claim?',
    href: '/rune#rune-number-router',
    description: 'Start with the RUNE number router before mixing settlement role, live metrics, dated tokenomics, price, fair value, or investment suitability.',
    searchTerms: [
      'RUNE claim',
      'RUNE tokenomics',
      'which RUNE number',
      'RUNE number router',
      'RUNE fair value',
      'RUNE price target',
      'RUNE investment claim',
      'RUNE investment suitability',
      'RUNE settlement role',
      'live RUNE metrics',
      'current RUNE supply',
      'RUNE minimum bond',
      'RUNE slash settings',
      'RUNE security constants',
      'RUNE value claim',
      'RUNE Tokenomics And Value',
      'RUNE source family',
      'RUNE market cap',
      'RUNE exchange float',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [docsSource, tokenomicsSource, devDocsSource, midgardNetworkSource],
  },
  {
    id: 'rune-actions',
    label: 'RUNE holder actions',
    question: 'Am I trying to buy, swap, stake, earn with, or bond RUNE?',
    href: '/rune#rune-action-router',
    description: 'Start with the RUNE action router before mixing route availability, third-party interfaces, RUNEPool/POL, LP positions, node bonding, TCY staking, or tokenomics claims.',
    searchTerms: [
      'RUNE action',
      'RUNE actions',
      'RUNE holder action',
      'RUNE holder actions',
      'how to buy RUNE',
      'buy RUNE',
      'where to buy RUNE',
      'where can I buy RUNE',
      'where to swap RUNE',
      'swap RUNE',
      'RUNE swap',
      'RUNE route',
      'RUNE quote',
      'RUNE interface',
      'RUNE wallet',
      'RUNE staking',
      'stake RUNE',
      'can I stake RUNE',
      'RUNE yield',
      'earn RUNE',
      'RUNEPool or staking',
      'bond RUNE',
      'RUNE node bond',
      'node bond RUNE',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [docsSource, devDocsSource, swapGuideSource, runePoolDocsSource, runePoolEndpointSource, nodeManagingSource, networkHaltsSource],
  },
  {
    id: 'liquidity-actions',
    label: 'Add or withdraw liquidity',
    question: 'Can I add liquidity, withdraw liquidity, or rely on LP-related metrics right now?',
    href: '/deep-dives/liquidity-actions#what-to-check-first',
    description: 'Start with the LP evidence ladder, then check live controls, pool metrics, and transaction evidence before using static CLP explanations or interface flows.',
    searchTerms: ['add liquidity', 'withdraw liquidity', 'LP deposit', 'LP withdrawal', 'LP actions', 'LP controls', 'asymmetric withdrawal', 'pool deposit pause', 'pool deposits halted', 'is pool open', 'pool open', 'pool available', 'LP withdraw paused', 'can I deposit liquidity', 'can I withdraw liquidity', 'IL protection available', 'impermanent loss protection available', 'LP APY safe', 'RUNEPool halt', 'liquidity units', 'liquidity provider', 'LP APY', 'Liquidity Actions'],
    confidence: 'official',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [liquidityProvidersSource, liquidityProviderFaqSource, liquidityActionMemosSource, liquidityActionNetworkHaltsSource, liquidityActionMimirsSource, midgardNetworkSource],
  },
  {
    id: 'runepool-pol',
    label: 'RUNEPool and POL evidence',
    question: 'What can RUNEPool or protocol-owned-liquidity data prove?',
    href: '/economics#runepool-pol-live',
    description: 'Start with the live RUNEPool/POL snapshot, then use the evidence guide before interpreting provider value, PnL, POL-enabled pools, or deposit and withdrawal availability.',
    searchTerms: ['RUNEPool', 'RUNEPool guide', 'RUNEPool live', 'RUNEPool current snapshot', 'POL', 'protocol owned liquidity', 'RUNEPool PnL', 'provider PnL', 'current_deposit', 'RUNEPool value', 'RUNEPool deposit halt', 'RUNEPool withdrawal', 'POL enabled pools', 'yield proof'],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [runePoolDocsSource, runePoolDevSource, runePoolEndpointSource, constantsMimirSource, thornodeMimirSource],
  },
  {
    id: 'build-query',
    label: 'Build or query data',
    question: 'Which docs or live endpoints should I use before building against THORChain data?',
    href: '/deep-dives/build-query-data#query-plan',
    description: 'Start with the build/query plan before using Midgard, THORNode, inbound addresses, Mimir, quote, memo, or explorer data in an app or analysis.',
    searchTerms: ['build query', 'build query guide', 'Midgard API', 'THORNode API', 'Midgard vs THORNode', 'THORNode vs Midgard', 'which endpoint', 'which source should I use Midgard or THORNode', 'inbound addresses', 'inbound_addresses', 'current inbound address', 'fresh inbound address', 'latest inbound address', 'developer docs', 'live endpoint', 'Mimir endpoint', 'quote swap', 'quote cache', 'do not cache quote', 'quote warning', 'quote response warning', 'quote rate limit', '429 quote', 'quote endpoint rate limit', 'recommended_min_amount_in', 'integration data'],
    confidence: 'curated',
    reviewedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
    sources: [buildQueryConnectingSource, buildQueryQueryingSource, buildQuerySwapGuideSource, buildQueryMemosSource, buildQueryFeesSource, buildQueryAssetNotationSource],
  },
  {
    id: 'app-layer-and-secured-assets',
    label: 'App Layer and secured assets',
    question: 'Can this app, contract, secured asset, or trade-account flow be used right now?',
    href: '/deep-dives/app-layer#what-to-verify-before-claiming',
    description: 'Start with the App Layer explainer, then verify live WASM, secured-asset, trade-account, oracle, signing, trading, and chain controls.',
    searchTerms: ['app layer', 'App Layer claim checks', 'CosmWasm', 'secured asset', 'secured assets', 'secured asset movement', 'secured asset redemption', 'secured asset deposit available', 'secured asset withdrawal halted', 'can I deposit secured assets', 'trade account', 'trade accounts', 'trade account enabled', 'trade account deposit halted', 'trade-account flow', 'arbitrage flow', 'WASM contract', 'contract availability', 'contract halted', 'WASM app live', 'WASM deployer halted', 'app layer route available', 'is app layer available now', 'interface wallet support', 'Rujira', 'RUJI', 'HaltWasmGlobal', 'HaltWasmContract', 'HaltWasmDeployer', 'HaltSecuredDeposit', 'HaltSecuredWithdraw', 'TradeAccountsEnabled', 'WasmPermissionless', 'SECURE+', 'SECURE-'],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [appLayerSource, cosmWasmSource, securedAssetsDevSource, networkHaltsSource, constantsMimirSource],
  },
  {
    id: 'tss-security-claims',
    label: 'TSS security claims',
    question: 'What source should I use for vault safety, GG20, DKLS, Schnorr, Paillier, or key-sign failure claims?',
    href: '/deep-dives/tss',
    description: 'Start with the TSS explainer and dated incident reports before turning post-exploit migration or vault-safety wording into current claims.',
    searchTerms: [
      'TSS security',
      'TSS safety',
      'vault safety',
      'is the vault safe',
      'THORChain vault safety',
      'Asgard vault safe',
      'vault security',
      'TSS exploit',
      'GG20 DKLS',
      'DKLS',
      'Schnorr',
      'Paillier',
      'MTA signing',
      'key-sign failures',
      'KeyVerify',
      'compromised vault exclusion',
      'multi-prime modulus claims',
      'vault key shares',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, asgardTssChurnSource, exploitReport2Source, protocolUpgradeV319Source, exploitReportSource],
  },
  {
    id: 'governance-proposals',
    label: 'Governance and proposals',
    question: 'Is this an ADR, proposal, vote, incident, recovery, or community-governance claim?',
    href: '/governance#governance-proposal-status',
    description: 'Start with governance claim checks before treating a proposal, vote, ADR, incident, or community discussion as current protocol truth.',
    searchTerms: [
      'governance proposal',
      'governance proposals',
      'submit proposal',
      'proposal voting',
      'vote proposal',
      'vote on proposal',
      'governance vote',
      'governance voting',
      'how to vote on proposal',
      'ADR proposal',
      'proposal status',
      'ADR status',
      'governance claim checks',
      'proposal claim checks',
      'community governance',
      'governance source boundary',
      'dated governance record',
      'proposal proof',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [docsSource, networkSecurityGovernanceSource],
  },
  {
    id: 'why-paused',
    label: 'Why is something paused?',
    question: 'Which Mimir key or source warning explains the user-facing pause?',
    href: '/network#network-diagnostics',
    description: 'Check affected actions first, then expand diagnostics for exact Mimir evidence and source-warning details.',
    searchTerms: ['why paused', 'how to know if THORChain is paused', 'is THORChain paused', 'is THORChain down', 'THORChain down', 'network down', 'protocol down', 'network outage', 'protocol unavailable', 'which chains are halted', 'network paused', 'operations paused', 'mimir key', 'pause reason', 'halt reason', 'operational evidence', 'source warning', 'LP paused', 'StreamingSwapPause', 'streaming swap pause', 'HaltMemoless', 'memoless halt', 'RUNEPoolHaltDeposit', 'RUNEPool deposit halt', 'scheduled halt', 'missing Mimir key', 'absent Mimir key'],
    confidence: 'official',
    reviewedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
    sources: [networkHaltsSource, thornodeMimirSource],
  },
  {
    id: 'node-operator-guide',
    label: 'Run or operate a node',
    question: 'How do I learn about running, setting up, or operating a THORChain node?',
    href: '/network#node-operator-guide',
    description: 'Start with the node-operator guide, then separate official setup docs, current node-operation controls, churning, slashing, and rewards context before acting.',
    searchTerms: [
      'node operator guide',
      'node operator setup',
      'node setup',
      'how to run a thorchain node',
      'run thorchain node',
      'run THORNode',
      'operate THORNode',
      'operate thorchain node',
      'become a node operator',
      'validator node',
      'THORChain validator',
      'THORNode operator',
      'node lifecycle guide',
      'node operations guide',
      'node rewards overview',
      'node churning guide',
      'node slashing guide',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [nodeManagingSource, nodeRisksRewardsSource, networkHaltsSource, thornodeMimirSource],
  },
  {
    id: 'node-operator-actions',
    label: 'Node operator actions',
    question: 'Can a node bond, unbond, rebond, rotate, or rely on current node-operation availability?',
    href: '/network#node-operator-actions',
    description: 'Start with live diagnostics for current node-operation controls, then use churning, slashing, rewards, and operator docs as context rather than action availability proof.',
    searchTerms: [
      'withdraw bond',
      'withdraw node bond',
      'can I withdraw node bond',
      'node bond withdrawal',
      'node unbond',
      'node unbonding',
      'can I unbond',
      'can I unbond node',
      'can my node unbond',
      'unbonding halted',
      'operator unbond',
      'node rebond',
      'node operator rotate',
      'operator rotation',
      'node operator actions',
      'node actions paused',
      'PauseBond',
      'PauseUnbond',
      'HaltRebond',
      'HaltOperatorRotate',
      'node rewards current',
      'node operator rewards current',
    ],
    confidence: 'official',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [nodeManagingSource, nodeRisksRewardsSource, networkHaltsSource, thornodeMimirSource],
  },
  {
    id: 'ordinary-fee-mechanics',
    label: 'Fee and quote mechanics',
    question: 'Why are fees high, or which quote, affiliate, liquidity, outbound, or minimum-input field matters?',
    href: '/deep-dives/streaming-swaps-refunds#what-to-check-first',
    description: 'Start with the quote/refund evidence ladder for ordinary swap-fee questions, then separate liquidity/slip, affiliate, outbound, dust, and recommended-minimum-input constraints from ADR-026 dynamic fees.',
    searchTerms: [
      'why are fees high',
      'fees high',
      'fee too high',
      'high swap fee',
      'how to lower fees',
      'lower fees',
      'lower swap fees',
      'swap fee',
      'swap fees',
      'liquidity fee',
      'slip fee',
      'slippage fee',
      'outbound fee',
      'outbound gas fee',
      'gas fee',
      'affiliate fee',
      'affiliate bps',
      'fee bps',
      'total_bps',
      'slippage_bps',
      'recommended_min_amount_in fee',
      'minimum input fee',
      'quote fee fields',
      'fee economics',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [swapGuideSource, memosSource, buildQueryFeesSource, networkHaltsSource],
  },
  {
    id: 'fees-and-adr026',
    label: 'ADR-026 dynamic fees',
    question: 'Is this the ADR-026 dynamic-fee experiment, partner floors, or fee-revenue evidence?',
    href: '/dynamic-fees#dynamic-fees-live',
    description: 'Use the tracker for current dynamic L1 fee records; use ordinary fee mechanics for quote, slip, outbound, affiliate, dust, or minimum-input questions.',
    searchTerms: [
      'dynamic L1 fee',
      'dynamic fee',
      'ADR-026',
      'DYNAMICFEE-WHITELIST',
      'fees_tor',
      'route competitiveness',
      'Symbiosis dynamic fee',
      'ShapeShift dynamic fee',
      'dynamic fee partner',
      'dynamic fee thorname',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
    sources: [feesSource, adr026DynamicFeesSource, dynamicL1FeesSource, dynamicL1FeesCurrentSource],
  },
  {
    id: 'tcy-recovery',
    label: 'TCY and recovery',
    question: 'Is this about historical THORFi products, TCY, or post-incident recovery?',
    href: '/deep-dives/tcy-recovery-timeline#what-to-check-now',
    description: 'Use the dated TCY timeline for historical recovery context; use Current TCY Controls before making claim, stake, distribution, unstake, claim-swap, or trading availability claims.',
    searchTerms: [
      'TCY',
      'recovery',
      'THORFi',
      'Savers',
      'Lending',
      'can I borrow',
      'can I use Savers',
      'is Savers available',
      'is Lending available',
      'Savers are back',
      'Savers deprecated',
      'Lending deprecated',
      'THORFi products available',
      'Proposal 6',
      '1 TCY per $1 debt',
      '10% system income',
      'exploit report',
      'governance history',
      'ADR-028',
      'recovery token',
      'full debt recovery not guaranteed',
      'No recovery proof',
    ],
    confidence: 'historical',
    reviewedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
    sources: [thorfiUnwindSource, tokenomicsSource, archivedSource, tcyGuideSource, exploitReportSource, exploitReport2Source, protocolUpgradeV319Source],
  },
  {
    id: 'tcy-current-controls',
    label: 'Current TCY controls',
    question: 'Can I claim, stake, unstake, receive distributions, or trade TCY now?',
    href: '/tcy#tcy-current-controls',
    description: 'Use the live TCY controls panel before making current action claims. Historical recovery context does not prove claim, stake, distribution, unstake, claim-swap, or trading availability.',
    searchTerms: [
      'current TCY controls',
      'current TCY claim',
      'current TCY claiming',
      'TCY claim state',
      'TCY claim now',
      'claim TCY now',
      'TCY claim available',
      'TCY claim availability',
      'TCY staking',
      'TCY unstaking',
      'TCY distribution now',
      'current TCY distribution',
      'TCY distribution available',
      'TCY distributions',
      'TCY trading halted',
      'TCY trade halted',
      'can I claim TCY',
      'can I stake TCY',
      'can I trade TCY',
      'TCYCLAIMINGHALT',
      'TCYCLAIMINGSWAPHALT',
      'TCYSTAKINGHALT',
      'TCYSTAKEDISTRIBUTIONHALT',
      'TCYUNSTAKINGHALT',
      'HALTTCYTRADING',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
    sources: [tcyGuideSource, thornodeMimirSource, networkHaltsSource],
  },
  {
    id: 'choose-interface',
    label: 'Choose an interface',
    question: 'Which wallet, explorer, or integration surface should I inspect next?',
    href: '/ecosystem#interface-use-checklist',
    description: 'Use the interface trust journey and intent matrix before opening a third-party wallet, explorer, swap, or integration surface.',
    searchTerms: [
      'interface',
      'wallet',
      'explorer',
      'THORSwap',
      'ShapeShift',
      'Symbiosis',
      'SwapKit',
      'XChainJS',
      'choose wallet',
      'ecosystem',
      'wallet safety',
      'safe interface',
      'is ShapeShift safe',
      'is THORSwap safe',
      'app endorsement',
      'project endorsement',
      'check before use',
      'third-party app',
      'interface trust journey',
      'intent matrix',
      'swap or quote',
      'transaction refund evidence',
      'build integration',
      'download integrity',
      'wallet permissions',
      'quote recipient slippage',
    ],
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource],
  },
];

export const TASK_GUIDE_GROUPS: TaskGuideGroupDefinition[] = [
  {
    id: 'use-now',
    label: 'Use Now',
    guideIds: ['swap-availability', 'rune-actions', 'why-paused', 'node-operator-actions', 'liquidity-actions', 'runepool-pol', 'tcy-current-controls', 'ordinary-fee-mechanics', 'fees-and-adr026'],
  },
  {
    id: 'learn',
    label: 'Learn & Explain',
    guideIds: ['learn-thorchain', 'swap-refund-lifecycle', 'app-layer-and-secured-assets'],
  },
  {
    id: 'build',
    label: 'Build & Inspect',
    guideIds: ['supported-chain-catalog', 'build-query', 'node-operator-guide', 'choose-interface'],
  },
  {
    id: 'trust',
    label: 'Trust & Recovery',
    guideIds: ['source-choice', 'governance-proposals', 'rune-tokenomics', 'tcy-recovery', 'tss-security-claims'],
  },
] satisfies TaskGuideGroupDefinition[];

export function groupedTaskGuides(guides: TaskIntentGuide[]): TaskGuideGroup[] {
  const guideById = new Map(guides.map((guide) => [guide.id, guide]));
  const groupedIds = new Set(TASK_GUIDE_GROUPS.flatMap((group) => group.guideIds));
  const groups = TASK_GUIDE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    guides: group.guideIds.flatMap((guideId) => {
      const guide = guideById.get(guideId);
      return guide ? [guide] : [];
    }),
  })).filter((group) => group.guides.length > 0);

  const ungrouped = guides.filter((guide) => !groupedIds.has(guide.id));
  if (ungrouped.length > 0) {
    groups.push({
      id: 'more',
      label: 'More Checks',
      guides: ungrouped,
    });
  }

  return groups;
}

export const TASK_GUIDE_GROUPED = groupedTaskGuides(TASK_INTENT_GUIDES);

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
    tocItem('Chain Clients And Finality'),
    tocItem('Why It Matters'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-midgard-thornode-data': [
    tocItem('What This Guide Can Prove'),
    tocItem('Source Roles'),
    tocItem('Claim-To-Source Matrix'),
    tocItem('Provider Failover And Same-Source Evidence'),
    tocItem('What Source Warnings Mean'),
    tocItem('Which Wiki Surface Uses Which Source'),
    tocItem('Evidence Checklist'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-build-query-data': [
    tocItem('Query Plan'),
    tocItem('Source Families'),
    tocItem('Minimum Safe Query Sequence'),
    tocItem('Quotes, Inbound Addresses, And Caching'),
    tocItem('Amounts, Assets, And Units'),
    tocItem('Error Handling And Provider Posture'),
    tocItem('What To Verify Before Shipping'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-app-layer': [
    tocItem('App Layer Claim Checks'),
    tocItem('What This Page Can Prove'),
    tocItem('Evidence Ladder'),
    tocItem('Common Misreadings'),
    tocItem('What Changed From The Base Layer'),
    tocItem('CosmWasm Permission Model'),
    tocItem('Secured Assets'),
    tocItem('Trade Accounts And Non-Contract Assets'),
    tocItem('Operational Controls'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-mimir-halt-controls': [
    tocItem('What Mimirs Can Prove'),
    tocItem('Control Families'),
    tocItem('Active, Scheduled, Inactive, Absent'),
    tocItem('Scoped Keys And Normalization'),
    tocItem('Source Warnings And Review Keys'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-churning': [
    tocItem('What is Churning?'),
    tocItem('Why Churning Matters'),
    tocItem('Node Lifecycle'),
    tocItem('Slash Points and Forced Churn'),
    tocItem('Vault Migration'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-clp': [
    tocItem('What CLP Can Prove'),
    tocItem('How CLP Works'),
    tocItem('Key Properties'),
    tocItem('Evidence Ladder'),
    tocItem('Swap Lifecycle and Refunds'),
    tocItem('Comparison to Traditional AMMs'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-liquidity-actions': [
    tocItem('What To Check First'),
    tocItem('LP Actions Versus Swaps'),
    tocItem('Deposit Modes And Pool Scope'),
    tocItem('Withdrawals And Asymmetric Limits'),
    tocItem('Metrics, Yield, And Earnings'),
    tocItem('Evidence Ladder'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-runepool-pol': [
    tocItem('What This Page Can Prove'),
    tocItem('RUNEPool Versus LP Positions'),
    tocItem('Evidence Ladder'),
    tocItem('Availability Checks'),
    tocItem('Accounting Checks'),
    tocItem('Common Misreadings'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-streaming-swaps-refunds': [
    tocItem('What To Check First'),
    tocItem('Swap Lifecycle'),
    tocItem('Streaming Swaps'),
    tocItem('Why Refunds Happen'),
    tocItem('Memos, Limits, And Refund Addresses'),
    tocItem('Evidence Ladder'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-incentive-pendulum': [
    tocItem('What The Pendulum Can Prove'),
    tocItem('The Core Problem'),
    tocItem('How the Pendulum Works'),
    tocItem('Why It Matters'),
    tocItem('Practical Effects'),
    tocItem('Evidence Ladder'),
    tocItem('Common Misreadings'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-rune-settlement': [
    tocItem('The Settlement Layer'),
    tocItem('Why RUNE Pairing Matters'),
    tocItem('What The Settlement Model Proves'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-tcy-recovery-timeline': [
    tocItem('What This Timeline Can Prove'),
    tocItem('Timeline'),
    tocItem('What TCY Represents'),
    tocItem('What To Check Now'),
    tocItem('Common Misreadings'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-savers': [
    tocItem('What This Page Can Prove'),
    tocItem('Evidence Ladder'),
    tocItem('What Savers Were'),
    tocItem('What Lending Was'),
    tocItem('TCY Aftermath'),
    tocItem('Source Posture'),
    tocItem('Common Misreadings'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-slashing': [
    tocItem('What is Slashing?'),
    tocItem('Types of Slashing Events'),
    tocItem('Slash Rate'),
    tocItem('Churn and Unbonding'),
    tocItem('Why This Matters'),
    tocItem('Operator Evidence Ladder'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
  'deep-dive-tss': [
    tocItem('The Problem with Traditional Multisig'),
    tocItem('How TSS Solves This'),
    tocItem('Security Properties'),
    tocItem('Real-World Impact'),
    tocItem('What To Verify Before Claiming'),
    tocItem('Non-Claims'),
  ],
};
