import type {
  Chain,
  DataConfidence,
  EcosystemProject,
  FreshnessMeta,
  GovernanceProposal,
  ResearchReport,
  SecurityIncident,
  SourceMeta,
  SourcedRecord,
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

const checkedFreshness = (confidence: DataConfidence, nextReviewDue = '2026-07-18'): FreshnessMeta => ({
  checkedAt: STATIC_DATA_LAST_UPDATED,
  confidence,
  nextReviewDue,
});

const record = <T>(
  data: T,
  sources: SourceMeta[],
  confidence: DataConfidence = 'curated'
): SourcedRecord<T> => withFreshness(data, sources, checkedFreshness(confidence));

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
    statusNote: 'SOL uses EdDSA signing and was called out separately in the May 2026 exploit report.',
  }, [liveInboundSource, exploitReportSource], 'official'),
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

export const ECOSYSTEM_PROJECT_RECORDS: SourcedRecord<EcosystemProject>[] = [
  record({
    id: 'thorchain-swap',
    name: 'THORChain Swap',
    category: 'Interface',
    description: 'Official THORChain swap interface for native cross-chain swaps. Live availability depends on current THORNode halt and inbound status.',
    url: 'https://swap.thorchain.org',
    status: 'Active',
    chains: chainCodes,
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
  }, [ecosystemSource, archivedFeaturesSource], 'curated'),
  record({
    id: 'runescan',
    name: 'RuneScan',
    category: 'Explorer',
    description: 'THORChain explorer for transactions, pools, nodes, and statistics.',
    url: 'https://runescan.io',
    status: 'Active',
    chains: ['THOR'],
  }, [ecosystemSource], 'curated'),
  record({
    id: 'viewblock',
    name: 'ViewBlock',
    category: 'Explorer',
    description: 'Multi-chain explorer with THORChain support.',
    url: 'https://viewblock.io/thorchain',
    status: 'Active',
    chains: ['THOR'],
  }, [ecosystemSource], 'curated'),
  record({
    id: 'swapkit',
    name: 'SwapKit',
    category: 'Developer Tools',
    description: 'SDK and API tooling for cross-chain swap integrations.',
    url: 'https://swapkit.dev',
    status: 'Active',
    chains: chainCodes,
  }, [developerDocs], 'curated'),
  record({
    id: 'xchainjs',
    name: 'XChainJS',
    category: 'Developer Tools',
    description: 'JavaScript client libraries for THORChain and connected chains.',
    url: 'https://xchainjs.org',
    status: 'Active',
    chains: chainCodes,
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
    lessons: ['Separate protocol exploits from illicit usage of open infrastructure', 'Use precise source-backed labels'],
    url: 'https://www.trmlabs.com/resources/blog/bybit-hack-update-north-korea-moves-to-next-stage-of-laundering',
  }, [trmBybitSource], 'needs-review'),
  record({
    id: 'gg20-vault-exploit-2026',
    title: 'GG20 Vault Exploit',
    date: '2026-05-15',
    type: 'Exploit',
    description: 'A newly churned node operator exploited a GG20 TSS vulnerability and drained one vault before automatic and manual halts contained the incident.',
    impact: 'Approximately $10.7M drained from a single vault; remaining vaults were reported unaffected in the first official report.',
    resolved: false,
    lessons: [
      'Current halt and signing state must be displayed from live Mimir, not hard-coded copy',
      'Recovery and root-cause status should remain dated and source-linked',
      'TSS scheme details require careful, source-backed wording',
    ],
    url: 'https://blog.thorchain.org/thorchain-exploit-report-1',
  }, [exploitReportSource], 'official'),
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
    description: 'Official report says one vault was drained and automated/manual halt controls were activated.',
  }, [exploitReportSource], 'official'),
];

export const PROTOCOL_MILESTONES = PROTOCOL_MILESTONE_RECORDS.map(unwrapRecord);
