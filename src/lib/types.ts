export const DATA_CONFIDENCES = ['official', 'curated', 'historical', 'needs-review'] as const;

export type DataConfidence = (typeof DATA_CONFIDENCES)[number];

export interface SourceMeta {
  label: string;
  url: string;
  retrievedAt?: string;
  notes?: string;
}

export interface FreshnessMeta {
  checkedAt: string;
  confidence: DataConfidence;
  reviewedBy?: string;
  nextReviewDue?: string;
}

export interface SourcedRecord<T> {
  data: T;
  sources: SourceMeta[];
  freshness: FreshnessMeta;
}

export type LiveDataStatus = 'ok' | 'degraded';

export interface LiveDataResult<T> {
  status: LiveDataStatus;
  checkedAt: string;
  data?: T;
  source?: SourceMeta;
  sources?: SourceMeta[];
  error?: string;
}

export interface Pool {
  asset: string;
  assetDepth: string;
  runeDepth: string;
  price?: string;
  status: string;
  liquidityUnits?: string;
  lpUnits?: string;
  synthUnits?: string;
  synthSupply?: string;
  units?: string;
  annualPercentageRate?: string;
  poolAPY?: string;
  apy?: number;
  apyPercent?: number;
  assetPrice?: string;
  assetPriceUSD?: string;
  runePriceUSD?: string;
  liquidityUSD?: string;
  volume24h?: string;
  volume24hUSD?: string;
  pool?: string;
  earnings?: string;
  rewards?: string;
}

export interface NetworkStats {
  totalPooledRune: string;
  totalReserve: string;
  activeNodeCount: number;
  standbyNodeCount: number;
  bondingAPY: string;
  liquidityAPY: string;
  nextChurnHeight: number;
  poolActivationCountdown?: number;
  poolShareFactor?: string;
  blockRewards?: string | Record<string, unknown>;
  bondMetrics: Record<string, unknown>;
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
  startTime: string;
  endTime: string;
  liquidityFees: string;
  blockRewards: string;
  earnings: string;
  bondingEarnings: string;
  liquidityEarnings: string;
  avgNodeCount: string;
  runePriceUSD: string;
  pools: unknown[];
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
  id: number | string;
  title: string;
  description: string;
  type: string;
  status: string;
  votingPeriod: string;
  createdDate: string;
  expiryDate: string;
  votesFor?: number;
  votesAgainst?: number;
  threshold?: number;
  sourceUrl?: string;
}

export interface Chain {
  name: string;
  chain: string;
  explorer: string;
  addressFormats: string[];
  dustThreshold?: number;
  supported: boolean;
  statusNote?: string;
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

export interface ThornodeInboundAddress {
  chain: string;
  pub_key?: string;
  address?: string;
  router?: string;
  halted?: boolean;
  global_trading_paused?: boolean;
  chain_trading_paused?: boolean;
  chain_lp_actions_paused?: boolean;
  gas_rate?: string;
}

export interface ChainOperationalStatus {
  chain: string;
  halted: boolean;
  tradingPaused: boolean;
  lpActionsPaused: boolean;
  lpDepositPaused: boolean;
  signingPaused: boolean;
  activeMimirKeys: string[];
  lpDepositPauseKeys: string[];
}

export type NetworkStatusState = 'operational' | 'paused' | 'degraded' | 'unknown';

export type OperationalControlState = 'active' | 'inactive' | 'disabled' | 'not-monitored';

export interface OperationalControlStatus {
  key: string;
  label: string;
  state: OperationalControlState;
  active: boolean;
  description: string;
}

export interface NetworkStatus {
  state: NetworkStatusState;
  summary: string;
  tradingPaused: boolean;
  streamingSwapsPaused?: boolean | null;
  memolessTransactionsHalted?: boolean | null;
  signingPaused: boolean;
  lpPaused: boolean;
  loansPaused: boolean;
  observedChainsPaused: boolean;
  nodePauseChainGlobal?: boolean | null;
  bondPaused?: boolean | null;
  unbondPaused?: boolean | null;
  rebondHalted?: boolean | null;
  operatorRotateHalted?: boolean | null;
  oracleHalted?: boolean | null;
  securedAssetsPaused: boolean | null;
  securedAssetDepositPauseKeys?: string[];
  securedAssetWithdrawPauseKeys?: string[];
  tcyClaimingPaused: boolean | null;
  tcyClaimingSwapPaused: boolean | null;
  tcyStakingPaused: boolean | null;
  tcyStakeDistributionPaused: boolean | null;
  tcyUnstakingPaused: boolean | null;
  tcyTradingPaused: boolean | null;
  tradeAccountsEnabled: boolean | null;
  runePoolEnabled: boolean | null;
  runePoolDepositPaused?: boolean | null;
  runePoolWithdrawPaused?: boolean | null;
  wasmPaused: boolean | null;
  wasmDeployerHaltKeys?: string[];
  wasmCodeHashHaltKeys?: string[];
  wasmContractHaltKeys?: string[];
  scopedWasmHaltKeys?: string[];
  poolDepositPauseKeys: string[];
  chainStatuses: ChainOperationalStatus[];
  activeControlKeys: string[];
  activeChainKeys: string[];
  activeEvidenceKeys: string[];
  /** @deprecated Use activeControlKeys and activeEvidenceKeys for new UI. */
  activePauseKeys: string[];
  monitoredControls: OperationalControlStatus[];
  thorNodeVersion?: string;
}
