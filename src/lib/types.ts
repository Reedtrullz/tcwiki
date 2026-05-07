export interface Pool {
  asset: string;
  assetDepth: string;
  runeDepth: string;
  price: string;
  status: string;
  lpUnits: string;
  synthUnits: string;
  synthSupply: string;
  units: string;
  apy: number;
  assetPriceUSD: string;
  runePriceUSD: string;
  liquidityUSD: string;
  volume24h: string;
  volume24hUSD: string;
  pool: string;
  earnings: string;
  rewards: string;
}

export interface NetworkStats {
  totalValueLocked: string;
  totalVolume24h: string;
  totalVolume24hUSD: string;
  activePools: number;
  totalTransactions: number;
  totalNodes: number;
  bondedNodes: number;
  runePriceUSD: string;
  runePrice: string;
  blockHeight: number;
  reserve: string;
}

export interface Node {
  address: string;
  bond: string;
  status: string;
  version: string;
  slashPoints: number;
  nodeAddress: string;
  isActive: boolean;
  bondUSD: string;
}

export interface Transaction {
  hash: string;
  height: number;
  date: string;
  type: string;
  status: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  memo: string;
  txID: string;
  pools: string[];
  events: Event[];
}

export interface Event {
  txID: string;
  type: string;
  pool: string;
  asset: string;
  amount: string;
  address: string;
  fromAddress: string;
  toAddress: string;
  liquidityType: string;
  liquidityIndex: number;
}

export interface Asset {
  chain: string;
  symbol: string;
  ticker: string;
  identifier: string;
  decimals?: number;
}

export interface ChainData {
  chain: string;
  height: string;
  thorchainHeight: number;
  inboundPaused: boolean;
  outboundPaused: boolean;
  halted: boolean;
  gasRate: string;
}

export interface HistoryItem {
  time: string;
  totalValueLocked: string;
  totalVolume24h: string;
  totalVolume24hUSD?: string;
  poolCount: number;
  runePriceUSD: string;
  activeUsers: number;
  swapCount: number;
}

export interface Swap {
  inHash: string;
  outHash: string;
  height: number;
  date: string;
  amount: string;
  fromAsset: string;
  toAsset: string;
  liquidityFee: string;
  liquidityFeeInRune: string;
  toRune: string;
  tradeTarget: string;
  fromAddress: string;
  toAddress: string;
  memo: string;
  status: string;
}

export interface LiquidityProvider {
  address: string;
  asset: string;
  pool: string;
  units: string;
  depth: string;
  rewardGrowth: string;
  rewards: string;
  apr: number;
  withdrawn: string;
}

export interface GovernanceProposal {
  id: number;
  title: string;
  description: string;
  type: string;
  status: string;
  votingPeriod: string;
  createdDate: string;
  expiryDate: string;
  votesFor: number;
  votesAgainst: number;
  threshold: number;
}

export interface Chain {
  name: string;
  chain: string;
  explorer: string;
  addressFormats: string[];
  dustThreshold?: number;
  supported: boolean;
}

export interface ResearchReport {
  id: string;
  title: string;
  author: string;
  date: string;
  source: string;
  quarter?: string;
  year?: number;
  url: string;
  summary: string;
  keyInsights: string[];
}

export interface SecurityIncident {
  id: string;
  title: string;
  date: string;
  type: string;
  description: string;
  impact: string;
  resolved: boolean;
  resolutionDate?: string;
  lessons: string[];
  url?: string;
}

export interface EcosystemProject {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  logo?: string;
  status: string;
  chains: string[];
}

export interface DocPage {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  tags: string[];
  lastUpdated: string;
  author?: string;
  relatedPages?: string[];
}