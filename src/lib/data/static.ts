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
import {
  adr026DynamicFeesSource,
  archivedSaversLendingSource as archivedFeaturesSource,
  assetNotationSource,
  cosmWasmSource as cosmwasmSource,
  dynamicL1FeesCurrentSource,
  dynamicL1FeesSource,
  exploitReport1Source as exploitReportSource,
  exploitReport2Source,
  feesSource,
  liquifyLiveInboundSource,
  liquifyMidgardEarningsSource,
  liquifyMidgardHealthSource,
  liquifyMidgardNetworkSource,
  liquifyMidgardPoolsSource,
  liquifyThornodeMimirSource,
  liveInboundSource,
  midgardHealthSource,
  midgardNetworkSource,
  multichainChaosnetLaunchSource,
  networkHaltsSource,
  protocolUpgradeV319Source,
  queryingThorchainSource,
  runePoolDevSource,
  runePoolDocsSource,
  runePoolEndpointSource,
  swapkitDocsSource,
  tcyGuideSource,
  thorchainEcosystemSource as ecosystemSource,
  thorchain2024YearEndSource,
  thorchainDevDocsSource as developerDocs,
  thorchainDocsSource as officialDocs,
  thorchainFaqSource,
  thorfiUnwindSource,
  thornameGuideSource,
  thornodeMimirSource,
  thornodeV300TagSource,
  tokenomicsSource,
  xchainJsSource,
} from '@/lib/sources';
import { unwrapRecord, withFreshness } from '@/lib/trust';

export const STATIC_DATA_LAST_UPDATED = '2026-06-18';

const ethRouterExploitSource: SourceMeta = {
  label: 'ETH Router exploit post-mortem',
  url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
  retrievedAt: '2026-07-08',
  notes: 'Historical THORChain post-mortem for early ETH router incidents; not current router availability evidence.',
};

const shapeshiftThorchainSource: SourceMeta = {
  label: 'ShapeShift THORChain protocol page',
  url: 'https://shapeshift.com/protocols/thorchain',
  retrievedAt: '2026-07-05',
  notes: 'ShapeShift-maintained protocol page describing THORChain route support; verify current app routing before using.',
};

const thorwalletSource: SourceMeta = {
  label: 'THORWallet',
  url: 'https://www.thorwallet.org/',
  retrievedAt: '2026-07-09',
  notes: 'Project-maintained wallet and swap-interface source; not a wallet-security audit, app-uptime proof, or route guarantee.',
};

const vultisigSource: SourceMeta = {
  label: 'Vultisig',
  url: 'https://vultisig.com/',
  retrievedAt: '2026-07-09',
  notes: 'Project-maintained MPC wallet/vault source; verify current release, wallet permissions, and route behavior before use.',
};

const rangoSource: SourceMeta = {
  label: 'Rango Exchange',
  url: 'https://rango.exchange/',
  retrievedAt: '2026-07-09',
  notes: 'Project-maintained aggregator source; route selection, fees, and supported paths are current third-party state.',
};

const ledgerRuneSource: SourceMeta = {
  label: 'Ledger THORChain support',
  url: 'https://support.ledger.com/article/4402987997841-zd',
  retrievedAt: '2026-07-09',
  notes: 'Ledger support source for THORChain/RUNE account setup; not proof that a swap route or third-party interface is usable.',
};

const messariQ1Source: SourceMeta = {
  label: 'Messari THORChain Q1 2025 Brief',
  url: 'https://messari.io/report/thorchain-q1-2025-brief',
  retrievedAt: '2026-07-08',
  notes: 'Third-party quarterly research brief; use as historical analysis, not live protocol state.',
};

const nineRealmsQ2Source: SourceMeta = {
  label: 'Nine Realms Q2 2025 Ecosystem Report',
  url: 'https://medium.com/thorchain/thorchain-q2-2025-ecosystem-report-q3-roadmap-1f5097a086a9',
  retrievedAt: '2026-07-08',
  notes: 'Ecosystem report and roadmap context from Nine Realms; roadmap items are not current delivery proof.',
};

const nineRealmsQ3Source: SourceMeta = {
  label: 'Nine Realms Q3 2024 Ecosystem Report',
  url: 'https://medium.com/thorchain/thorchain-q3-2024-ecosystem-report-1b048fe55141',
  retrievedAt: '2026-07-08',
  notes: 'Historical ecosystem report from Nine Realms; use for period context, not current protocol state.',
};

const trmBybitSource: SourceMeta = {
  label: 'TRM Labs Bybit laundering update',
  url: 'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering',
  retrievedAt: '2026-07-08',
  notes: 'Third-party illicit-flow analysis; this is not a THORChain protocol exploit source.',
};

const liquifyMidgardHealthReviewedAt20260704: SourceMeta = {
  ...liquifyMidgardHealthSource,
  label: 'Liquify Midgard Gateway',
  retrievedAt: '2026-07-04',
  notes: 'Runtime failover source used only after response-shape validation.',
};

const thornodeVersionSource: SourceMeta = {
  label: 'THORChain THORNode Version',
  url: 'https://thornode.thorchain.network/thorchain/version',
  retrievedAt: '2026-07-04',
  notes: 'Runtime version endpoint used for source and deployment identity checks.',
};

const liquifyThornodeVersionSource: SourceMeta = {
  label: 'Liquify THORNode Gateway',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/version',
  retrievedAt: '2026-07-04',
  notes: 'Runtime failover source used only after response-shape validation.',
};

const runescanSource: SourceMeta = {
  label: 'RuneScan',
  url: 'https://runescan.io',
  retrievedAt: '2026-07-05',
  notes: 'External explorer reference; indexing and labels are not canonical protocol state.',
};

const viewblockSource: SourceMeta = {
  label: 'ViewBlock THORChain',
  url: 'https://viewblock.io/thorchain',
  retrievedAt: '2026-07-05',
  notes: 'External explorer reference; reconcile with THORNode or dated evidence before making protocol claims.',
};

const viewblockNeedsReviewSource: SourceMeta = {
  ...viewblockSource,
  retrievedAt: '2026-07-08',
  notes: 'Direct source returned a Cloudflare challenge from this review environment; keep as needs-review until a human/browser refresh confirms THORChain indexing.',
};

const adr026DynamicFeesReviewedAt20260708: SourceMeta = {
  ...adr026DynamicFeesSource,
  retrievedAt: '2026-07-08',
  notes: 'Architecture decision text still labels the ADR proposed; live THORNode evidence is separate current-only state.',
};

const thornodeMimirDynamicFeesReviewedAt20260708: SourceMeta = {
  ...thornodeMimirSource,
  retrievedAt: '2026-07-08',
  notes: 'Current-only Mimir read showed L1DYNAMICFEEENABLED=1 with SS and Symbiosis whitelist entries; values can change after the checked block.',
};

const dynamicL1FeesReviewedAt20260708: SourceMeta = {
  ...dynamicL1FeesSource,
  retrievedAt: '2026-07-08',
  notes: 'Current-only sealed dynamic L1 fee endpoint returned records during this refresh; record values can change by epoch.',
};

const dynamicL1FeesCurrentReviewedAt20260708: SourceMeta = {
  ...dynamicL1FeesCurrentSource,
  retrievedAt: '2026-07-08',
  notes: 'Current-only in-progress epoch accumulator endpoint returned records during this refresh; not historical attribution proof.',
};

const messariReportsSource: SourceMeta = {
  label: 'Messari THORChain Reports',
  url: 'https://messari.io/project/thorchain',
  retrievedAt: '2026-07-05',
  notes: 'External analytics and research reference; not canonical protocol state.',
};

const thorchainGithubSource: SourceMeta = {
  label: 'THORChain GitHub',
  url: 'https://github.com/thorchain',
  retrievedAt: '2026-07-05',
  notes: 'Open-source repository reference; code state still needs branch, commit, and deployment context.',
};

const discordSource: SourceMeta = {
  label: 'Discord',
  url: 'https://discord.com/invite/thorchaincommunity',
  retrievedAt: '2026-07-05',
  notes: 'Community channel reference; useful context, not canonical protocol proof.',
};

const twitterSource: SourceMeta = {
  label: 'Twitter/X',
  url: 'https://x.com/thorchain_org',
  retrievedAt: '2026-07-05',
  notes: 'Social channel reference; announcements still need source and date context.',
};

const telegramSource: SourceMeta = {
  label: 'Telegram',
  url: 'https://t.me/thorchain_org',
  retrievedAt: '2026-07-05',
  notes: 'Community channel reference; useful context, not canonical protocol proof.',
};

const redditSource: SourceMeta = {
  label: 'Reddit',
  url: 'https://reddit.com/r/THORChain',
  retrievedAt: '2026-07-05',
  notes: 'Community discussion reference; sentiment needs careful sampling and date boundaries.',
};

interface StaticRecordFreshnessOptions {
  checkedAt: string;
  nextReviewDue: string;
  reviewedBy?: string;
}

const checkedFreshness = (
  confidence: DataConfidence,
  nextReviewDue: string,
  checkedAt: string,
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
  confidence: DataConfidence,
  freshnessOptions: StaticRecordFreshnessOptions
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

const sourceMapLiveInboundSource: SourceMeta = {
  ...liveInboundSource,
  retrievedAt: '2026-07-04',
};

const sourceMapEcosystemSource: SourceMeta = {
  ...ecosystemSource,
  retrievedAt: '2026-07-04',
  notes: 'Official ecosystem directory reference; listings are not wallet-security audits or current app-availability proof.',
};

const ecosystemSourceReviewedAt20260708: SourceMeta = {
  ...ecosystemSource,
  retrievedAt: '2026-07-08',
};

const liveInboundSourceReviewedAt20260708: SourceMeta = {
  ...liveInboundSource,
  retrievedAt: '2026-07-08',
};

const thorchainSwapSource: SourceMeta = {
  label: 'THORChain Swap app',
  url: 'https://swap.thorchain.org',
  retrievedAt: '2026-07-08',
  notes: 'Current app availability check for the THORChain-branded swap interface; not quote, settlement, or wallet-safety proof.',
};

const asgardexSource: SourceMeta = {
  label: 'ASGARDEX website',
  url: 'https://www.asgardex.com',
  retrievedAt: '2026-07-08',
  notes: 'Project website availability check; release downloads, device security, and route availability need upstream and live checks.',
};

const runescanSourceReviewedAt20260708: SourceMeta = {
  ...runescanSource,
  retrievedAt: '2026-07-08',
};

const SUPPORTED_CHAIN_CATALOG_REVIEWED_AT = '2026-07-06';
const SUPPORTED_CHAIN_CATALOG_NEXT_REVIEW_DUE = '2026-08-06';
const supportedChainCatalogFreshness = {
  checkedAt: SUPPORTED_CHAIN_CATALOG_REVIEWED_AT,
  nextReviewDue: SUPPORTED_CHAIN_CATALOG_NEXT_REVIEW_DUE,
};
const supportedChainInboundSource: SourceMeta = {
  ...liveInboundSource,
  retrievedAt: SUPPORTED_CHAIN_CATALOG_REVIEWED_AT,
  notes: 'Supported-chain catalog refresh against live inbound_addresses; chain presence is not swap, signing, LP-action, or route-availability proof.',
};

export const CHAIN_RECORDS: SourcedRecord<Chain>[] = [
  record({
    name: 'Bitcoin',
    chain: 'BTC',
    explorer: 'https://mempool.space/block',
    addressFormats: ['P2WSH (preferred)', 'P2WPKH', 'P2PKH', 'P2SH', 'P2TR'],
    dustThreshold: 546,
    supported: true,
    statusNote: 'Live inbound status must be checked before describing BTC swaps as open.',
  }, [supportedChainInboundSource, developerDocs], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Ethereum',
    chain: 'ETH',
    explorer: 'https://etherscan.io/block',
    addressFormats: ['EIP-55'],
    supported: true,
    statusNote: 'Router/inbound status is live-state dependent.',
  }, [supportedChainInboundSource, developerDocs], 'official', supportedChainCatalogFreshness),
  record({
    name: 'BNB Chain',
    chain: 'BSC',
    explorer: 'https://bscscan.com/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Avalanche',
    chain: 'AVAX',
    explorer: 'https://snowtrace.io/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Cosmos Hub',
    chain: 'GAIA',
    explorer: 'https://www.mintscan.io/cosmos/blocks',
    addressFormats: ['Bech32'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Dogecoin',
    chain: 'DOGE',
    explorer: 'https://blockchair.com/dogecoin/block',
    addressFormats: ['Bech32', 'P2PKH'],
    dustThreshold: 1000000,
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Litecoin',
    chain: 'LTC',
    explorer: 'https://blockchair.com/litecoin/block',
    addressFormats: ['Bech32', 'P2PKH'],
    dustThreshold: 100000,
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Bitcoin Cash',
    chain: 'BCH',
    explorer: 'https://blockchair.com/bitcoin-cash/block',
    addressFormats: ['CashAddr', 'P2PKH'],
    dustThreshold: 1000,
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Tron',
    chain: 'TRON',
    explorer: 'https://tronscan.org/#/block',
    addressFormats: ['Base58'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Base',
    chain: 'BASE',
    explorer: 'https://basescan.org/block',
    addressFormats: ['EIP-55'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
  record({
    name: 'Solana',
    chain: 'SOL',
    explorer: 'https://solscan.io/block',
    addressFormats: ['Base58'],
    supported: true,
    statusNote: 'SOL uses EdDSA signing; Exploit Report #2 says EdDSA chains such as Solana were not exposed to the GG20/Paillier attack path.',
  }, [supportedChainInboundSource, exploitReport2Source], 'official', supportedChainCatalogFreshness),
  record({
    name: 'XRP Ledger',
    chain: 'XRP',
    explorer: 'https://xrpscan.com/ledger',
    addressFormats: ['Classic address', 'X-address'],
    supported: true,
  }, [supportedChainInboundSource], 'official', supportedChainCatalogFreshness),
];

export const CHAINS: Chain[] = CHAIN_RECORDS.map(unwrapRecord);

const chainCodes = CHAINS.map((chain) => chain.chain);

export const SOURCE_MAP_SECTION_RECORDS: SourcedRecord<SourceMapSection>[] = [
  record({
    id: 'current-protocol-state',
    title: 'Current Protocol State',
    decision: 'Is an operational control active, or what does a live metric snapshot say right now?',
    use: 'Use THORNode evidence for live operational checks such as halts, signing, quotes, Mimir values, and inbound fields. Use Midgard for indexed dashboard metrics such as pools, network totals, and earnings intervals.',
    caveat: 'Live API responses are current-only snapshots. Midgard metrics are useful dashboard context, but they are not by themselves route-availability proof.',
    claimExamples: [
      'Current halt, pause, signing, LP, TCY, trade-account, secured-asset, app-layer, or chain-observation state from THORNode.',
      'Current inbound-address, router, gas-rate, Mimir, quote, node/version, or dynamic-fee snapshot.',
      'Current halt, inbound, or quote evidence for a catalog-listed or queried supported chain after the separate static catalog lookup.',
      'Current Midgard pool, network, reserve, bond, node-count, earnings, or APY-style dashboard metric with source freshness attached.',
      'Whether a rendered live value is available, unavailable, degraded, or warning-backed at check time.',
    ],
    nonClaims: [
      'Durable historical uptime or availability.',
      'Protocol design intent or governance approval.',
      'Revenue lift, safety, route quality, or route availability beyond the checked snapshot.',
      'That a Midgard pool or network metric proves a specific swap, LP action, secured-asset flow, or app-layer action is usable now.',
    ],
    links: [liquifyThornodeMimirSource, liquifyLiveInboundSource, liquifyMidgardHealthSource, liquifyMidgardNetworkSource, liquifyMidgardPoolsSource, liquifyMidgardEarningsSource],
  }, [liquifyThornodeMimirSource, liquifyLiveInboundSource, liquifyMidgardHealthSource, liquifyMidgardNetworkSource, liquifyMidgardPoolsSource, liquifyMidgardEarningsSource], 'official', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
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
    links: [liquifyMidgardHealthReviewedAt20260704, midgardHealthSource, liquifyThornodeVersionSource, thornodeVersionSource],
  }, [liquifyMidgardHealthReviewedAt20260704, midgardHealthSource, liquifyThornodeVersionSource, thornodeVersionSource], 'curated', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    id: 'runepool-pol-evidence',
    title: 'RUNEPool/POL Evidence',
    decision: 'Is this RUNEPool accounting, POL scope, or RUNEPool deposit/withdraw availability?',
    use: 'Use the live RUNEPool/POL snapshot for current THORNode `/runepool` accounting, POL-enabled pool Mimirs, and RUNEPool caveat keys. Pair it with Network diagnostics when the claim is about whether deposits or withdrawals are usable now.',
    caveat: 'RUNEPool accounting is a current-only snapshot. It does not prove future yield, profitability, route health, deposit support, withdrawal support, or user-specific position outcomes.',
    claimExamples: [
      'Current global RUNEPool value, PnL, provider, reserve, and current-deposit fields from THORNode.',
      'Current POL-enabled pool scope from `POL-<Asset>` Mimir keys.',
      'Whether a RUNEPool dashboard value is available, unavailable, degraded, or warning-backed at check time.',
      'Which separate live controls need review before claiming RUNEPool deposits or withdrawals are open.',
    ],
    nonClaims: [
      'Future yield, profitability, impermanent-loss outcome, or investment suitability.',
      'That every POL-enabled pool is liquid, routeable, safe, or competitive.',
      'That a clean accounting snapshot proves RUNEPool deposits or withdrawals are currently usable.',
      'A user-specific RUNEPool balance or payout without a provider-specific endpoint and intentional address context.',
    ],
    links: [runePoolEndpointSource, runePoolDevSource, runePoolDocsSource, thornodeMimirSource, networkHaltsSource],
  }, [runePoolEndpointSource, runePoolDevSource, runePoolDocsSource, thornodeMimirSource, networkHaltsSource], 'curated', {
    checkedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
  }),
  record({
    id: 'rune-tokenomics-and-value',
    title: 'RUNE Tokenomics And Value Claims',
    decision: 'Which source family should back a RUNE number, supply framing, security constant, or value claim?',
    use: 'Use official tokenomics and protocol docs for dated RUNE supply and role framing, Stats for current Midgard network metrics, and THORNode/Mimir evidence for current security constants such as minimum bond or slash settings.',
    caveat: 'The wiki does not provide price targets, fair-value models, investment suitability, market-cap proof, exchange float, or guaranteed-yield conclusions. Keep dated tokenomics, current live metrics, and market analysis separate.',
    claimExamples: [
      'Dated RUNE supply, reserve, circulating-supply, burn, or TCY-context framing from the tokenomics source.',
      'Which live dashboard surface owns pooled RUNE, reserve, bond, node-count, earnings, or APY-style metrics.',
      'Which THORNode or Mimir source family should be checked before quoting minimum bond, slash settings, or current security constants.',
      'Which external evidence would be needed before making price, fair-value, market-cap, or investment-suitability claims.',
    ],
    nonClaims: [
      'Current RUNE price, fair value, market cap, exchange float, or investment suitability.',
      'Live circulating supply, reserve balance, bond posture, minimum bond, or slash settings from dated tokenomics text alone.',
      'Future yield, protocol revenue lift, recovery value, or guaranteed return.',
      'That one RUNE number can be reused across settlement, security, liquidity, tokenomics, and market-value claims.',
    ],
    links: [tokenomicsSource, officialDocs, developerDocs, midgardNetworkSource, thornodeMimirSource],
  }, [tokenomicsSource, officialDocs, developerDocs, midgardNetworkSource, thornodeMimirSource], 'curated', {
    checkedAt: '2026-07-06',
    nextReviewDue: '2026-08-06',
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
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
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
    links: [sourceMapEcosystemSource, developerDocs, sourceMapLiveInboundSource, networkHaltsSource],
  }, [sourceMapEcosystemSource, developerDocs, sourceMapLiveInboundSource, networkHaltsSource], 'curated', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
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
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
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
  }, [officialDocs, networkHaltsSource, tokenomicsSource, cosmwasmSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    id: 'historical-features-and-recovery',
    title: 'Historical Features And Recovery',
    decision: 'Is this an incident, recovery, or deprecated-product claim?',
    use: 'Use for Savers/Lending deprecation, THORFi unwind, incident reports, recovery records, and source-dated historical context.',
    caveat: 'Historical records should not be converted into current availability claims without live or newly reviewed sources.',
    claimExamples: [
      'Savers/Lending deprecation and THORFi unwind history.',
      'Official exploit-report root cause, remediation, restart, and recovery context.',
      'Which current TCY controls need review before making claim, stake, distribution, unstake, claim-swap, or trading availability claims.',
      'Dated milestones or incident lessons where the source itself supports the claim.',
    ],
    nonClaims: [
      'That historical products are available now.',
      'That TCY claiming, staking, trading, distributions, user eligibility, or interface support is currently available without live controls and official-interface evidence.',
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
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
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
  }, [runescanSource, viewblockSource, messariReportsSource, thorchainGithubSource], 'curated', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
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
  }, [discordSource, twitterSource, telegramSource, redditSource, thorchainGithubSource], 'curated', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
];

export const SOURCE_MAP_SECTIONS: SourceMapSection[] = SOURCE_MAP_SECTION_RECORDS.map(unwrapRecord);

export const TOKENOMICS_RECORDS: SourcedRecord<TokenomicsSnapshot>[] = [
  record({
    id: 'rune-supply-framing',
    title: 'RUNE Supply Framing',
    summary: 'As reviewed on 2026-07-05, the official tokenomics source frames RUNE around a reduced supply near 425M, circulating supply near 350M, reserve near 75M, and ongoing burn mechanics.',
    figures: [
      { label: 'Original Cap Context', value: '500M RUNE', tone: 'historical' },
      { label: 'Current Supply Framing', value: '~425M and burning', tone: 'source-backed' },
      { label: 'Circulating Supply', value: '~350M source figure', tone: 'source-backed' },
      { label: 'Reserve', value: '~75M source figure', tone: 'source-backed' },
      { label: 'Network Income', value: 'Fees, emissions, burns, TCY share', tone: 'dynamic' },
      { label: 'Bond Requirement', value: 'Check constants + Mimir', tone: 'current-only' },
      { label: 'Slash Penalty', value: 'Check constants + Mimir', tone: 'current-only' },
    ],
  }, [tokenomicsSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
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

export function getTokenomicsRecord(id: string): SourcedRecord<TokenomicsSnapshot> {
  const record = TOKENOMICS_RECORDS.find((candidate) => candidate.data.id === id);

  if (!record) {
    throw new Error(`Missing tokenomics record for ${id}`);
  }

  return record;
}

export const ECOSYSTEM_PROJECT_RECORDS: SourcedRecord<EcosystemProject>[] = [
  record({
    id: 'thorchain-swap',
    name: 'THORChain Swap',
    category: 'Interface',
    description: 'THORChain-branded swap interface for native cross-chain swaps. Live availability depends on current THORNode halt, quote, and inbound status.',
    url: 'https://swap.thorchain.org',
    chains: chainCodes,
    useFor: [
      'THORChain swap-interface starting point for native cross-chain swap routes.',
      'Checking whether the branded interface exposes a route for a supported chain pair.',
    ],
    verifyBeforeUse: [
      'Confirm live trading, signing, inbound-address, and gas status on the Network page before assuming a swap can settle.',
      'Review quoted fees, route, slippage, recipient address, and wallet approvals in the interface before signing.',
    ],
  }, [thorchainSwapSource, ecosystemSourceReviewedAt20260708, liveInboundSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'asgardex',
    name: 'AsgardEX',
    category: 'Wallet',
    description: 'Multi-chain desktop wallet and DEX interface with THORChain support.',
    url: 'https://www.asgardex.com',
    logo: '/logos/asgardex.svg',
    chains: ['BTC', 'ETH', 'BSC', 'AVAX', 'GAIA', 'DOGE', 'LTC', 'BCH'],
    useFor: [
      'Desktop wallet and THORChain swap interface exploration.',
      'Self-custody workflow research across the listed chains.',
    ],
    verifyBeforeUse: [
      'Confirm the current release, download source, wallet permissions, and device security outside this wiki.',
      'Check live chain and THORChain halt status before relying on any swap or LP action.',
    ],
  }, [asgardexSource, ecosystemSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'thorswap',
    name: 'THORSwap',
    category: 'Interface',
    description: 'Multi-chain DEX aggregator and THORChain interface. Deprecated Savers/Lending products should be treated as historical.',
    url: 'https://app.thorswap.finance',
    logo: '/logos/thorswap.svg',
    chains: chainCodes,
    useFor: [
      'Third-party swap, aggregation, and THORChain interface research.',
      'Comparing route options and interface support across many listed chains.',
    ],
    verifyBeforeUse: [
      'Treat product availability, terms, compliance controls, and routed quotes as current third-party state.',
      'Do not infer that historical Savers or Lending features are available; verify any product shown by the app.',
    ],
  }, [ecosystemSource, archivedFeaturesSource], 'curated', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    id: 'shapeshift',
    name: 'ShapeShift',
    category: 'Interface',
    description: 'Self-custody multichain wallet and DEX aggregator with THORChain route support for native cross-chain swaps.',
    url: 'https://app.shapeshift.com',
    chains: chainCodes,
    useFor: [
      'Third-party wallet and swap-interface research where THORChain can be one of the route sources.',
      'Comparing ShapeShift quotes and route handling against other THORChain-enabled interfaces.',
    ],
    verifyBeforeUse: [
      'Confirm the current app route, affiliate fee, slippage, recipient address, and supported chain pair before signing.',
      'Check live THORNode diagnostics and ShapeShift app availability; this listing is not a wallet-security audit or route guarantee.',
    ],
  }, [ecosystemSource, shapeshiftThorchainSource, liquifyLiveInboundSource], 'curated', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    id: 'thorwallet',
    name: 'THORWallet',
    category: 'Wallet',
    description: 'Self-custody mobile wallet and cross-chain DEX surface listed by THORChain ecosystem sources.',
    url: 'https://www.thorwallet.org/',
    chains: chainCodes,
    useFor: [
      'Third-party wallet and swap-interface research where THORChain routes may be exposed in a mobile workflow.',
      'Inspecting THORWallet route, wallet-connection, recipient, and signing behavior before a user-facing recommendation.',
    ],
    verifyBeforeUse: [
      'Confirm the current app release, download source, wallet permissions, route quote, recipient address, slippage, and fees before signing.',
      'Check live THORNode diagnostics first; this listing is not a wallet-security audit, app-uptime proof, or route-quality guarantee.',
    ],
  }, [ecosystemSourceReviewedAt20260708, thorwalletSource, liveInboundSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
  }),
  record({
    id: 'vultisig',
    name: 'Vultisig',
    category: 'Wallet',
    description: 'Self-custodial MPC wallet and multi-chain vault listed by THORChain ecosystem sources.',
    url: 'https://vultisig.com/',
    chains: chainCodes,
    useFor: [
      'Researching seedless MPC custody, multi-factor signing, and THORChain-enabled wallet workflows.',
      'Inspecting current Vultisig wallet support, route handling, and release/source path before suggesting it to users.',
    ],
    verifyBeforeUse: [
      'Confirm the current release channel, backup/recovery model, device quorum, wallet permissions, quote route, recipient, slippage, and fees before signing.',
      'Treat MPC and vault claims as project claims to verify upstream; this listing is not a wallet-security audit or custody recommendation.',
    ],
  }, [ecosystemSourceReviewedAt20260708, vultisigSource, liveInboundSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
  }),
  record({
    id: 'rango',
    name: 'Rango',
    category: 'Interface',
    description: 'Cross-chain DEX and bridge aggregator listed by THORChain ecosystem sources.',
    url: 'https://rango.exchange/',
    chains: chainCodes,
    useFor: [
      'Third-party route-aggregation research where THORChain may be one of several possible liquidity paths.',
      'Comparing quote, route selection, fee, bridge, and execution disclosures against THORNode route checks.',
    ],
    verifyBeforeUse: [
      'Confirm whether the current quote actually uses THORChain, which intermediate protocols are involved, and what recipient/slippage/fee settings are applied.',
      'Do not infer best execution, route safety, or route availability from this listing; use live quote and network diagnostics first.',
    ],
  }, [ecosystemSourceReviewedAt20260708, rangoSource, liveInboundSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
  }),
  record({
    id: 'ledger-rune',
    name: 'Ledger RUNE',
    category: 'Wallet',
    description: 'Hardware-wallet support surface for THORChain/RUNE accounts; this is account and signing support, not a live swap interface.',
    url: 'https://support.ledger.com/article/4402987997841-zd',
    chains: ['THOR'],
    useFor: [
      'Researching Ledger THORChain/RUNE account setup, storage, and signing support.',
      'Checking hardware-wallet support as one part of a wallet workflow before choosing an interface.',
    ],
    verifyBeforeUse: [
      'Confirm Ledger firmware, THORChain app version, account path, connected interface, address display, and signing prompts before use.',
      'Do not treat Ledger support as a route-availability, swap-interface, staking, or LP-action guarantee.',
    ],
  }, [ecosystemSourceReviewedAt20260708, ledgerRuneSource], 'curated', {
    checkedAt: '2026-07-09',
    nextReviewDue: '2026-08-09',
  }),
  record({
    id: 'runescan',
    name: 'RuneScan',
    category: 'Explorer',
    description: 'THORChain explorer for transactions, pools, nodes, and statistics.',
    url: 'https://runescan.io',
    chains: ['THOR'],
    useFor: [
      'Exploring THORChain transactions, pools, nodes, addresses, and historical network context.',
      'Cross-checking wiki claims against an independent explorer view.',
    ],
    verifyBeforeUse: [
      'Do not treat explorer display alone as proof that swaps, LP actions, or signing are currently open.',
      'Cross-check protocol availability against live THORNode diagnostics when making operational claims.',
    ],
  }, [runescanSourceReviewedAt20260708, ecosystemSourceReviewedAt20260708], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'viewblock',
    name: 'ViewBlock',
    category: 'Explorer',
    description: 'Unverified multi-chain explorer pointer for THORChain context. Direct source refresh needs review before treating it as a current explorer reference.',
    url: 'https://viewblock.io/thorchain',
    chains: ['THOR'],
    useFor: [
      'Following up on a historical multi-chain explorer pointer.',
      'Comparing transaction or account context only after the direct source is reachable and reconciled.',
    ],
    verifyBeforeUse: [
      'Confirm the direct explorer page clears its anti-bot challenge and currently indexes THORChain before relying on it.',
      'Check live THORNode state before making current operational claims.',
    ],
  }, [viewblockNeedsReviewSource], 'needs-review', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'swapkit',
    name: 'SwapKit',
    category: 'Developer Tools',
    description: 'SDK and API tooling for cross-chain swap integrations.',
    url: 'https://swapkit.dev',
    chains: chainCodes,
    useFor: [
      'Developer SDK/API research for THORChain and cross-chain swap integrations.',
      'Finding integration concepts before checking current package and API documentation.',
    ],
    verifyBeforeUse: [
      'Confirm current package versions, API behavior, supported chains, and integration security in upstream docs.',
      'Test quotes, memos, slippage, affiliate settings, and error handling against live endpoints before shipping.',
    ],
  }, [swapkitDocsSource], 'curated', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    id: 'xchainjs',
    name: 'XChainJS',
    category: 'Developer Tools',
    description: 'JavaScript client libraries for THORChain and connected chains.',
    url: 'https://xchainjs.org',
    chains: chainCodes,
    useFor: [
      'JavaScript client-library research for THORChain and connected-chain tooling.',
      'Developer orientation before checking package-specific docs and examples.',
    ],
    verifyBeforeUse: [
      'Confirm current package versions, chain-module support, wallet handling, and breaking changes upstream.',
      'Do not treat library presence here as proof of production readiness for an integration.',
    ],
  }, [xchainJsSource], 'curated', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
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
  }, [messariQ1Source], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'nine-realms-q2-2025',
    title: 'THORChain Q2 2025 Ecosystem Report & Q3 Roadmap',
    author: 'Nine Realms',
    date: '2025-07-09',
    source: 'Nine Realms',
    url: 'https://medium.com/thorchain/thorchain-q2-2025-ecosystem-report-q3-roadmap-1f5097a086a9',
    summary: 'Ecosystem report with Q3 roadmap priorities and development updates.',
    keyInsights: [],
  }, [nineRealmsQ2Source], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'nine-realms-q3-2024',
    title: 'THORChain Q3 2024 Ecosystem Report',
    author: 'Nine Realms',
    date: '2024-10-07',
    source: 'Nine Realms',
    url: 'https://medium.com/thorchain/thorchain-q3-2024-ecosystem-report-1b048fe55141',
    summary: 'Quarterly ecosystem report covering protocol performance, development milestones, and community initiatives.',
    keyInsights: [],
  }, [nineRealmsQ3Source], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
];

export const RESEARCH_REPORTS: ResearchReport[] = RESEARCH_REPORT_RECORDS.map(unwrapRecord);

export const SECURITY_INCIDENT_RECORDS: SourcedRecord<SecurityIncident>[] = [
  record({
    id: 'eth-router-1',
    title: 'ETH Router Exploit #1',
    date: '2021-07-15',
    type: 'Exploit',
    description: 'ETH router/Bifrost exploit where an attack contract in front of the router caused fake ETH deposits to be read as real deposits.',
    impact: 'Approximately $8M impact; the post-mortem says no other chains or assets were affected.',
    resolved: true,
    lessons: [
      'Deposit-event parsing needed stricter validation',
      'Unaudited ETH Bifrost code created unacceptable router risk',
      'Solvency checks and active monitoring became explicit recovery priorities',
    ],
    url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
  }, [ethRouterExploitSource], 'historical', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
  record({
    id: 'eth-router-2',
    title: 'ETH Router Exploit #2',
    date: '2021-07-23',
    type: 'Exploit',
    description: 'Second ETH router exploit where a fake router and malicious deposit event path caused real ERC-20 refunds from the system.',
    impact: 'Approximately $8M across economically significant ERC-20 assets, followed by a broader recovery and audit plan.',
    resolved: true,
    lessons: [
      'Return-to-trading needed explicit safety gates and halt controls',
      'Router changes required deeper adversarial validation',
      'Outbound throttling, node timeouts, and audit coverage became part of the response plan',
    ],
    url: 'https://medium.com/thorchain/post-mortem-eth-router-exploits-1-2-and-premature-return-to-trading-incident-2908928c5fb',
  }, [ethRouterExploitSource], 'historical', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
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
  }, [archivedFeaturesSource, tokenomicsSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
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
  }, [trmBybitSource], 'needs-review', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
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
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
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
  }, [archivedFeaturesSource, tokenomicsSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    id: 'adr-028-recovery',
    title: 'ADR-028 Recovery Path',
    description: 'Recovery of May 2026 exploit losses was described by the first official exploit report as a community governance decision.',
    type: 'Recovery',
    status: 'Needs current review',
    trackerStatus: 'needs-review',
    votingPeriod: 'Source-dependent',
    createdDate: '2026-05',
    expiryDate: 'Current status must be checked',
    sourceUrl: 'https://blog.thorchain.org/thorchain-exploit-report-1',
  }, [exploitReportSource], 'needs-review', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    id: 'mimir-operational-halts',
    title: 'Operational Mimir Halts',
    description: 'Operational Mimir parameters such as HALTTRADING and HALTSIGNING can pause network activity and should be read from THORNode.',
    type: 'Operational Parameter',
    status: 'Current-only control reference',
    votingPeriod: 'Current-only',
    createdDate: 'Ongoing',
    expiryDate: 'Check current THORNode Mimir state',
    sourceUrl: 'https://dev.thorchain.org/concepts/network-halts.html',
  }, [networkHaltsSource, liveInboundSource], 'official', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    id: 'adr-026-dynamic-l1-fees',
    title: 'ADR-026 Dynamic L1 Fees',
    description: 'Dynamic per-thorname and per-pair L1 minimum fee experiment. Official ADR text is proposed-design context while live THORNode snapshots may show enabled Mimirs and dynamic-fee records.',
    type: 'ADR / Operational Experiment',
    status: 'Proposed ADR / live Mimir evidence',
    votingPeriod: 'Current-only Mimir and source review',
    createdDate: '2026-04-15',
    expiryDate: 'ADR discussion review target 2026-08-08',
    sourceUrl: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
  }, [
    adr026DynamicFeesReviewedAt20260708,
    thornodeMimirDynamicFeesReviewedAt20260708,
    dynamicL1FeesReviewedAt20260708,
    dynamicL1FeesCurrentReviewedAt20260708,
  ], 'curated', {
    checkedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
  }),
];

export const GOVERNANCE_PROPOSALS: GovernanceProposal[] = GOVERNANCE_PROPOSAL_RECORDS.map(unwrapRecord);

export const PROTOCOL_MILESTONE_RECORDS = [
  record({
    date: '2018',
    title: 'THORChain Founded',
    description: 'A pseudonymous core team founded THORChain in 2018.',
  }, [thorchainFaqSource], 'historical', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    date: '2021-04-13',
    title: 'Multichain Chaosnet Launch',
    description: 'Multichain Chaosnet launches with native cross-chain swaps across five networks while safeguards remain in place on the path to mainnet.',
  }, [multichainChaosnetLaunchSource], 'historical', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    date: '2024-12-11',
    title: 'THORNode v3.0.0 Release',
    description: 'THORNode v3.0.0 upgrades to Cosmos SDK v0.50 and lays groundwork for future App Layer functionality.',
  }, [thornodeV300TagSource, thorchain2024YearEndSource], 'historical', {
    checkedAt: '2026-07-13',
    nextReviewDue: '2026-08-13',
  }),
  record({
    date: '2025-01',
    title: 'Savers and Lending Deprecated',
    description: 'Archived THORChain docs mark Savers and Lending as deprecated and no longer available.',
  }, [archivedFeaturesSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
  record({
    date: '2026-05-15',
    title: 'GG20 Vault Exploit and Emergency Halt',
    description: 'Official reports say one vault was drained through a GG20/TSS cryptographic attack; v3.19.0 carried restart recovery/security changes, and later reporting described v3.19.1 patching plus migration planning away from GG20.',
  }, [exploitReport2Source, protocolUpgradeV319Source, exploitReportSource], 'official', {
    checkedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
  }),
];

export const PROTOCOL_MILESTONES = PROTOCOL_MILESTONE_RECORDS.map(unwrapRecord);
