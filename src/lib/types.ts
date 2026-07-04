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

export type SourceHealthSeverity = 'ok' | 'warning' | 'degraded' | 'unknown';

export interface LiveDataResult<T> {
  status: LiveDataStatus;
  checkedAt: string;
  data?: T;
  source?: SourceMeta;
  sources?: SourceMeta[];
  error?: string;
}

export interface MidgardHealth {
  provider?: string;
  database?: boolean;
  inSync?: boolean;
  latestHeight?: number;
  aggregatedHeight?: number;
  scannerHeight?: number;
  lagBlocks?: number;
  lagSeconds?: number;
  severity: SourceHealthSeverity;
  reasons: string[];
  checkedAt: string;
}

export interface ThorNodeReadiness {
  ready: boolean;
  status: 'ready' | 'degraded';
  checkedAt: string;
  version?: string;
  thorchainHeight?: number;
  sourceCount: number;
  reasons: string[];
  invalidMimirKeys: string[];
  sourceWarnings: string[];
}

/** @deprecated Use ThorNodeReadiness. */
export type ThornodeReadiness = ThorNodeReadiness;

export interface ReadinessResponse {
  status: 'ready' | 'degraded';
  ready: boolean;
  checkedAt: string;
  version: string;
  commit: string;
  image: string;
  sources: {
    midgard: {
      status: LiveDataStatus;
      source?: SourceMeta;
      health?: MidgardHealth;
      heightLagBlocks?: number;
      visibleData: {
        network: ReadinessSourceCheck;
        pools: ReadinessSourceCheck;
        earnings: ReadinessSourceCheck;
      };
      sourceWarnings: string[];
      error?: string;
    };
    thornode: {
      status: LiveDataStatus;
      checkedAt?: string;
      source?: SourceMeta;
      sources?: SourceMeta[];
      sourceCount: number;
      state?: NetworkStatusState;
      summary?: string;
      version?: string;
      thorchainHeight?: number;
      thorchainSnapshotPinned?: boolean;
      thorchainLastblockMinHeight?: number;
      thorchainLastblockMaxHeight?: number;
      thorchainLastblockSpread?: number;
      thorchainBlockTime?: string;
      thorchainBlockAgeSeconds?: number;
      heightLagBlocks?: number;
      activeControlKeys: string[];
      activeChainKeys: string[];
      activeEvidenceKeys: string[];
      scheduledMimirKeys: string[];
      chainStatuses: ChainOperationalStatus[];
      monitoredControls: OperationalControlStatus[];
      invalidMimirKeys: string[];
      sourceWarnings: string[];
      error?: string;
    };
  };
  reasons: string[];
}

export interface ReadinessSourceCheck {
  status: LiveDataStatus;
  checkedAt: string;
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
  nodeAddress: string;
  address: string;
  bond?: string;
  status?: string;
  version?: string;
  slashPoints?: number;
  isActive?: boolean;
  bondUSD?: string;
  pubkeys?: {
    ed25519?: string;
    secp256k1?: string;
  };
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
  height?: string;
  thorchainHeight?: number;
  inboundPaused?: boolean;
  outboundPaused?: boolean;
  halted?: boolean;
  gasRate?: string;
}

export interface AssetPrice {
  assetPrice: string;
  runePrice: string;
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

export interface TokenomicsSnapshot {
  id: string;
  title: string;
  summary: string;
  figures: {
    label: string;
    value: string;
    tone: 'historical' | 'source-backed' | 'dynamic' | 'current-only';
  }[];
}

export interface SourceMapSection {
  id: string;
  title: string;
  use: string;
  caveat: string;
  links: SourceMeta[];
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
  trackerStatus?: 'current' | 'needs-review' | 'historical-open';
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
  router?: string | null;
  halted?: boolean;
  global_trading_paused?: boolean;
  chain_trading_paused?: boolean;
  chain_lp_actions_paused?: boolean;
  gas_rate?: string;
}

export interface ThornodeLastBlock {
  chain: string;
  thorchain: number | string;
  last_observed_in: number | string;
  last_signed_out: number | string;
}

export type DynamicL1FeeMimirState = 'active' | 'inactive' | 'absent' | 'unparseable';

export type DynamicL1FeeWhitelistState = 'active' | 'monitor' | 'inactive' | 'unparseable';

export interface DynamicL1FeeMimirFlag {
  key: string;
  value: number | null;
  defaultValue?: number;
  effectiveValue?: number | null;
  state: DynamicL1FeeMimirState;
}

export interface DynamicL1FeeWhitelistedPartner {
  key: string;
  thorname: string;
  value: number | null;
  whitelisted: boolean | null;
  state: DynamicL1FeeWhitelistState;
}

export interface DynamicL1FeeMimirStatus {
  enabled: DynamicL1FeeMimirFlag;
  slipMinBps: DynamicL1FeeMimirFlag;
  epochBlocks: DynamicL1FeeMimirFlag;
  floorBps: DynamicL1FeeMimirFlag;
  ceilingBps: DynamicL1FeeMimirFlag;
  stepBps: DynamicL1FeeMimirFlag;
  deadbandBps: DynamicL1FeeMimirFlag;
  windowEpochs: DynamicL1FeeMimirFlag;
  whitelistedPartners: DynamicL1FeeWhitelistedPartner[];
  invalidKeys: string[];
}

export interface DynamicL1FeeRecord {
  thorname: string;
  pair: string;
  dynamicBps: number;
  whitelistValue: number | null;
  whitelistState: DynamicL1FeeWhitelistState;
  whitelisted: boolean | null;
  lastActiveEpoch: number;
  latestFeesTorBaseUnits: string | null;
}

export interface DynamicL1FeeCurrentAccumulator {
  thorname: string;
  pair: string;
  epoch: number;
  volumeTorBaseUnits: string | null;
  feesTorBaseUnits: string | null;
}

export interface DynamicL1FeeHistoryEntry {
  epoch: number;
  volumeTorBaseUnits: string | null;
  feesTorBaseUnits: string | null;
  bpsAtClose: number;
}

export interface DynamicL1FeePairHistory {
  thorname: string;
  pair: string;
  dynamicBps: number;
  whitelistValue: number | null;
  whitelistState: DynamicL1FeeWhitelistState;
  lastActiveEpoch: number;
  history: DynamicL1FeeHistoryEntry[];
}

export interface DynamicL1FeeThornameHistory {
  thorname: string;
  whitelistValue: number | null;
  whitelistState: DynamicL1FeeWhitelistState;
  pairs: DynamicL1FeePairHistory[];
}

export interface DynamicL1FeeSourceFreshness {
  thorchainHeight: number;
  thorchainBlockTime: string;
  thorchainBlockAgeSeconds?: number;
  snapshotPinned: boolean;
}

export interface DynamicL1FeeStatus {
  mimir: DynamicL1FeeMimirStatus;
  records: DynamicL1FeeRecord[];
  currentEpoch: number;
  currentEntries: DynamicL1FeeCurrentAccumulator[];
  histories: DynamicL1FeeThornameHistory[];
  sourceFreshness: DynamicL1FeeSourceFreshness;
  sourceWarnings: string[];
  caveats: Array<'current-only' | 'adr-experiment' | 'not-historical-fee-proof'>;
}

export type InboundOperationField = 'halted' | 'global_trading_paused' | 'chain_trading_paused' | 'chain_lp_actions_paused';

export interface ChainOperationalStatus {
  chain: string;
  halted: boolean;
  tradingPaused: boolean;
  lpActionsPaused: boolean;
  lpDepositPaused: boolean;
  signingPaused: boolean;
  activeMimirKeys: string[];
  lpDepositPauseKeys: string[];
  inboundAddressEvidenceFields?: InboundOperationField[];
  inheritedMimirKeys?: string[];
  lastObservedIn?: number;
  lastSignedOut?: number;
  lastThorchainHeight?: number;
  sourceWarnings?: string[];
  securedAssetDepositPaused?: boolean;
  securedAssetWithdrawPaused?: boolean;
  asymWithdrawalPaused?: boolean;
  securedAssetDepositPauseKeys?: string[];
  securedAssetWithdrawPauseKeys?: string[];
  asymWithdrawalPauseKeys?: string[];
  scheduledMimirKeys?: string[];
  unparseableMimirKeys?: string[];
}

export type NetworkStatusState = 'operational' | 'paused' | 'degraded' | 'unknown';

export type OperationalControlState = 'active' | 'inactive' | 'disabled' | 'scheduled' | 'not-monitored' | 'unparseable';

export type NetworkStatusWarningSeverity = 'critical' | 'warning' | 'review';

export type NetworkStatusWarningCategory =
  | 'freshness'
  | 'pinning'
  | 'height-divergence'
  | 'source-shape'
  | 'mimir-parse'
  | 'unknown-chain'
  | 'unknown-operation'
  | 'other';

export interface NetworkStatusSourceWarning {
  severity: NetworkStatusWarningSeverity;
  category: NetworkStatusWarningCategory;
  message: string;
  action: string;
  keys?: string[];
  scopes?: string[];
}

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
  asymWithdrawalPauseKeys?: string[];
  tcyClaimingPaused: boolean | null;
  tcyClaimingSwapPaused: boolean | null;
  tcyStakingPaused: boolean | null;
  tcyStakeDistributionPaused: boolean | null;
  tcyUnstakingPaused: boolean | null;
  tcyTradingPaused: boolean | null;
  tradeAccountsEnabled: boolean | null;
  tradeAccountDepositsEnabled?: boolean | null;
  manualSwapsToSynthDisabled?: boolean | null;
  runePoolEnabled: boolean | null;
  bankSendEnabled?: boolean | null;
  runePoolDepositPaused?: boolean | null;
  runePoolWithdrawPaused?: boolean | null;
  wasmPaused: boolean | null;
  wasmDeployerHaltKeys?: string[];
  wasmCodeHashHaltKeys?: string[];
  wasmContractHaltKeys?: string[];
  scopedWasmHaltKeys?: string[];
  poolDepositPauseKeys: string[];
  scheduledMimirKeys?: string[];
  chainStatuses: ChainOperationalStatus[];
  activeControlKeys: string[];
  activeChainKeys: string[];
  activeEvidenceKeys: string[];
  /** @deprecated Use activeControlKeys and activeEvidenceKeys for new UI. */
  activePauseKeys: string[];
  monitoredControls: OperationalControlStatus[];
  thorNodeVersion?: string;
  thorchainHeight?: number;
  thorchainSnapshotPinned?: boolean;
  thorchainLastblockMinHeight?: number;
  thorchainLastblockMaxHeight?: number;
  thorchainLastblockSpread?: number;
  thorchainBlockTime?: string;
  thorchainBlockAgeSeconds?: number;
  invalidMimirKeys: string[];
  sourceWarnings: string[];
  sourceWarningDetails?: NetworkStatusSourceWarning[];
}
