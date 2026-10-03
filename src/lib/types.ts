import type { ThornodeDataPolicy } from '../../scripts/lib/thornode-data-policy.mjs';
export const DATA_CONFIDENCES = ['official', 'curated', 'historical', 'needs-review'] as const;

export interface ClpScenarioResult {
  slipPercent: string;
  fee: string;
  output: string;
}

export interface ClpLearningModel {
  id: string;
  title: string;
  assumptions: string;
  ruleScope: string;
}

export type DataConfidence = (typeof DATA_CONFIDENCES)[number];

export type MemoDecoderAction = 'swap' | 'outbound' | 'refund' | 'migrate';
export type MemoDecoderStatus = 'decoded' | 'empty' | 'too-long' | 'unsupported' | 'malformed';

export interface MemoDecoderField {
  id: string;
  label: string;
  raw: string;
  interpretation: string;
}

export type MemoDecodeResult =
  | {
      status: 'decoded';
      original: string;
      /** Exact for in-bound inputs; oversized inputs use the configured bound plus one as a sentinel. */
      byteLength: number;
      action: MemoDecoderAction;
      fields: MemoDecoderField[];
      message: string;
    }
  | {
      status: Exclude<MemoDecoderStatus, 'decoded'>;
      original: string;
      /** Exact for in-bound inputs; oversized inputs use the configured bound plus one as a sentinel. */
      byteLength: number;
      fields: MemoDecoderField[];
      message: string;
    };

export interface ResponseHeightEvidence {
  requestedHeight: number;
  observedHeight?: number;
  verification: 'verified' | 'unverified';
}

export interface SourceMeta {
  heightPinning?: ResponseHeightEvidence;
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

export interface ClaimEvidence {
  id: string;
  summary: string;
  source: SourceMeta;
  observedAt: string;
  versionScope: string;
  scope: 'current-only' | 'historical' | 'design';
  reviewedAt: string;
  nextReviewDue: string;
  decision: 'supported' | 'needs-review' | 'needs-live-evidence' | 'superseded';
  limitation: string;
  supersedes?: string;
}

/** Browser-local reading notes; these snapshots describe navigation, not competence. */
export interface LearningProgressStepSnapshot {
  entryId: string;
  reviewedAt: string;
}

export interface LearningProgressBookmark extends LearningProgressStepSnapshot {
  savedAt: string;
}

export interface LearningProgressPathState {
  pathId: string;
  /** Derived from the current reader-path registry and validated on import. */
  pathHref: string;
  bookmark: LearningProgressBookmark | null;
  readSteps: LearningProgressStepSnapshot[];
}

export interface LearningProgressDocument {
  version: 1;
  selectedPathId: string | null;
  paths: LearningProgressPathState[];
}

export interface SourcedRecord<T> {
  claims?: ClaimEvidence[];
  data: T;
  sources: SourceMeta[];
  freshness: FreshnessMeta;
}

export type TransactionExampleGuide = 'streaming-swaps-refunds' | 'build-query-data' | 'churning';

export interface TransactionExampleAmount {
  amount: string;
  asset: string;
  unit: string;
  kind?: 'trade asset' | 'native asset' | 'token asset';
}

export interface TransactionExampleReport {
  layer: 'source-chain' | 'thorchain-indexer';
  label: string;
  actionType?: string;
  status: string;
  observedAt?: string;
  height?: string;
  blockHeight?: string;
  blockHash?: string;
  blockTime?: string;
  transactionId?: string;
  outputHeight?: string;
  outputTransactionId?: string;
  destination?: string;
  inputs?: TransactionExampleAmount[];
  outputs?: TransactionExampleAmount[];
  facts?: Array<{ label: string; value: string }>;
  source: SourceMeta;
  blockSource?: SourceMeta;
}

export interface TransactionExample {
  id: string;
  guide: TransactionExampleGuide;
  title: string;
  summary: string;
  memo: {
    sourceLabel: string;
    value: string;
    interpretation: string;
    parameters?: Array<{ label: string; value: string }>;
  };
  reports: TransactionExampleReport[];
  unknowns: string[];
}

export type LiveDataStatus = 'ok' | 'degraded';

export type SourceHealthSeverity = 'ok' | 'warning' | 'degraded' | 'unknown';

export interface LiveCollectionTiming {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  blockObservedAt?: string;
}

export interface LiveDataResult<T> {
  presentation?: {
    kind: 'operational' | 'aggregate' | 'historical';
    state: 'current' | 'refreshing' | 'last-good' | 'stale' | 'unavailable' | 'historical';
  };
  collection?: LiveCollectionTiming;
  dataPolicy?: Readonly<ThornodeDataPolicy>;
  assessedAt?: string;
  status: LiveDataStatus;
  checkedAt: string;
  data?: T;
  source?: SourceMeta;
  sources?: SourceMeta[];
  error?: string;
}

export const MIDGARD_POOL_PERIODS = ['1h', '24h', '7d', '14d', '30d', '90d', '100d', '180d', '365d'] as const;
export type MidgardPoolPeriod = (typeof MIDGARD_POOL_PERIODS)[number];
export const DEFAULT_MIDGARD_POOL_PERIOD: MidgardPoolPeriod = '14d';

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
export interface RuntimeMetadataDiagnostics {
  version: string;
  commit: string;
  image: string;
  strict: boolean;
  verified: boolean;
  warnings: string[];
}

export interface ReadinessResponse {
  status: 'ready' | 'degraded';
  ready: boolean;
  checkedAt: string;
  version: string;
  commit: string;
  image: string;
  runtime: RuntimeMetadataDiagnostics;
  warnings: string[];
  sources: {
    midgard: {
      status: LiveDataStatus;
      source?: SourceMeta;
      health?: MidgardHealth;
      heightLagBlocks?: number;
      healthWarnings: string[];
      visibleData: {
        network: ReadinessSourceCheck;
        pools: ReadinessSourceCheck;
        earnings: ReadinessSourceCheck;
      };
      sourceWarnings: string[];
      sourceWarningDetails: NetworkStatusSourceWarning[];
      error?: string;
    };
    thornode: {
      status: LiveDataStatus;
      checkedAt?: string;
      collection?: LiveCollectionTiming;
      dataPolicy?: Readonly<ThornodeDataPolicy>;
      assessedAt?: string;
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
      sourceWarningDetails: NetworkStatusSourceWarning[];
      dynamicFees: {
        status: LiveDataStatus;
        checkedAt?: string;
        collection?: LiveCollectionTiming;
        dataPolicy?: Readonly<ThornodeDataPolicy>;
        assessedAt?: string;
        source?: SourceMeta;
        sources?: SourceMeta[];
        error?: string;
        enabledState?: DynamicL1FeeMimirState;
        enabledValue?: number | null;
        currentEpoch?: number;
        trackedRecordCount?: number;
        currentEntryCount?: number;
        whitelistedThornameCount?: number;
        historyPolicy?: 'not-requested';
        historyThornameCount?: number;
        historySampleCount?: number;
        thorchainHeight?: number;
        snapshotPinned?: boolean;
        thorchainBlockTime?: string;
        thorchainBlockAgeSeconds?: number;
        sourceWarnings: string[];
        sourceWarningDetails: NetworkStatusSourceWarning[];
      };
      runePoolPol: {
        status: LiveDataStatus;
        checkedAt?: string;
        collection?: LiveCollectionTiming;
        dataPolicy?: Readonly<ThornodeDataPolicy>;
        assessedAt?: string;
        source?: SourceMeta;
        sources?: SourceMeta[];
        error?: string;
        activePolPoolCount?: number;
        depositMaturityBlocksState?: RunePoolMimirConfigFlag['state'];
        depositMaturityBlocksValue?: number | null;
        maxReserveBackstopState?: RunePoolMimirConfigFlag['state'];
        maxReserveBackstopValue?: number | null;
        minRunePoolDepthState?: RunePoolMimirConfigFlag['state'];
        minRunePoolDepthValue?: number | null;
        thorchainHeight?: number;
        snapshotPinned?: boolean;
        thorchainBlockTime?: string;
        thorchainBlockAgeSeconds?: number;
        sourceWarnings: string[];
        sourceWarningDetails: NetworkStatusSourceWarning[];
      };
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
  assetPrice?: string;
  assetPriceUSD?: string;
  runePriceUSD?: string;
  liquidityInUSD?: string;
  volume24h?: string;
  pool?: string;
  earnings?: string;
  rewards?: string;
}

export interface SwapQuoteRequest {
  fromAsset: string;
  toAsset: string;
  amountBaseUnits: string;
}

export interface SwapQuoteFees {
  asset?: string;
  affiliate?: string;
  outbound?: string;
  liquidity?: string;
  total?: string;
  slippageBps?: number;
  totalBps?: number;
}

export interface SwapQuoteSuccess {
  expectedAmountOut: string;
  recommendedMinAmountIn?: string;
  inboundConfirmationSeconds?: number;
  outboundDelaySeconds?: number;
  streamingSwapSeconds?: number;
  totalSwapSeconds?: number;
  expiry?: number;
  warning?: string;
  fees: SwapQuoteFees;
  raw: Record<string, unknown>;
}

export type SwapQuoteFailureKind = 'halt' | 'input' | 'rate-limit' | 'provider' | 'malformed' | 'unknown';

export interface SwapQuoteFailure {
  retryAt?: string;
  kind: SwapQuoteFailureKind;
  code?: number;
  httpStatus?: number;
  message: string;
  details?: unknown[];
  raw?: Record<string, unknown>;
}

export interface SwapQuoteProbeResult {
  request: SwapQuoteRequest;
  status: 'available' | 'limited' | 'failed';
  summary: string;
  sourceWarnings?: string[];
  quote?: SwapQuoteSuccess;
  failure?: SwapQuoteFailure;
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

export type ThorchainNodeCoverageRow = Pick<Node, 'status' | 'version'> & { nodeAddress?: string };

export interface MayaNode {
  nodeAddress: string;
  address: string;
  bond?: string;
  status?: string;
  version?: string;
  slashPoints?: number;
  isActive?: boolean;
  ipaddress?: string;
}

export interface MayaNetworkStats {
  totalPooledRune: string;
  totalReserve: string;
  activeNodeCount: number;
  standbyNodeCount: number;
  bondingAPY: string;
  liquidityAPY: string;
  nextChurnHeight: number;
  bondMetrics: Record<string, unknown>;
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
  decision: string;
  use: string;
  caveat: string;
  claimExamples: string[];
  nonClaims: string[];
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
  trackerStatus?: 'current' | 'needs-review';
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
  chains: string[];
  useFor: string[];
  verifyBeforeUse: string[];
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
  /** Compatibility flag for a requested pin; response verification is separate. */
  snapshotPinned: boolean;
  heightPinning?: ResponseHeightEvidence;
}

export interface DynamicL1FeeStatus {
  mimir: DynamicL1FeeMimirStatus;
  records: DynamicL1FeeRecord[];
  currentEpoch: number;
  currentEntries: DynamicL1FeeCurrentAccumulator[];
  histories: DynamicL1FeeThornameHistory[];
  sourceFreshness: DynamicL1FeeSourceFreshness;
  sourceWarnings: string[];
  sourceWarningDetails: NetworkStatusSourceWarning[];
  caveats: Array<'current-only' | 'adr-experiment' | 'not-historical-fee-proof'>;
}

export interface RunePoolPolBucket {
  valueRuneBaseUnits: string | null;
  pnlRuneBaseUnits: string | null;
  currentDepositRuneBaseUnits: string | null;
}

export interface RunePoolPolTotals extends RunePoolPolBucket {
  runeDepositedBaseUnits: string | null;
  runeWithdrawnBaseUnits: string | null;
}

export interface RunePoolProviderTotals extends RunePoolPolBucket {
  units: string | null;
  pendingUnits: string | null;
  pendingRuneBaseUnits: string | null;
}

export interface RunePoolReserveTotals extends RunePoolPolBucket {
  units: string | null;
}

export type RunePoolPolMimirState = 'active' | 'inactive' | 'unparseable';

export interface RunePoolPolMimirPool {
  key: string;
  asset: string;
  value: number | null;
  state: RunePoolPolMimirState;
}

export interface RunePoolMimirConfigFlag {
  key: string;
  value: number | null;
  state: 'present' | 'absent' | 'unparseable';
}

export interface RunePoolSourceFreshness {
  thorchainHeight: number;
  thorchainBlockTime: string;
  thorchainBlockAgeSeconds?: number;
  /** Compatibility flag for a requested pin; response verification is separate. */
  snapshotPinned: boolean;
  heightPinning?: ResponseHeightEvidence;
}

export interface RunePoolPolStatus {
  pol: RunePoolPolTotals;
  providers: RunePoolProviderTotals;
  reserve: RunePoolReserveTotals;
  polPools: RunePoolPolMimirPool[];
  activePolPoolCount: number;
  depositMaturityBlocks: RunePoolMimirConfigFlag;
  maxReserveBackstop: RunePoolMimirConfigFlag;
  minRunePoolDepth?: RunePoolMimirConfigFlag;
  sourceFreshness: RunePoolSourceFreshness;
  sourceWarnings: string[];
  sourceWarningDetails: NetworkStatusSourceWarning[];
  caveats: Array<'current-only' | 'not-yield-proof' | 'availability-separate'>;
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
  sourceWarningDetails?: NetworkStatusSourceWarning[];
  securedAssetDepositPaused?: boolean;
  securedAssetWithdrawPaused?: boolean;
  tradeAccountDepositPaused?: boolean;
  tradeAccountWithdrawPaused?: boolean;
  asymWithdrawalPaused?: boolean;
  securedAssetDepositPauseKeys?: string[];
  securedAssetWithdrawPauseKeys?: string[];
  tradeAccountDepositPauseKeys?: string[];
  tradeAccountWithdrawPauseKeys?: string[];
  asymWithdrawalPauseKeys?: string[];
  scheduledMimirKeys?: string[];
  unparseableMimirKeys?: string[];
}

export type NetworkStatusState = 'operational' | 'paused' | 'degraded' | 'unknown';

export type OperationalControlState = 'active' | 'inactive' | 'disabled' | 'scheduled' | 'not-monitored' | 'unparseable' | 'unsupported';

export type NetworkStatusWarningSeverity = 'critical' | 'warning' | 'review';

export type NetworkStatusWarningCategory =
  | 'freshness'
  | 'pinning'
  | 'height-divergence'
  | 'source-shape'
  | 'mimir-parse'
  | 'mimir-support'
  | 'unknown-chain'
  | 'unknown-operation'
  | 'control-applicability'
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
  tradingPaused: boolean | null;
  streamingSwapsPaused?: boolean | null;
  memolessTransactionsHalted?: boolean | null;
  signingPaused: boolean | null;
  lpPaused: boolean | null;
  loansPaused: boolean | null;
  observedChainsPaused: boolean | null;
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
  tradeAccountDepositPauseKeys?: string[];
  tradeAccountWithdrawPauseKeys?: string[];
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
  /** Raw /mimir observations retained independently of reviewed interpretation. */
  observedMimir?: Record<string, unknown>;
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

export interface ExecutionEvidenceMap {
  id: string;
  limitation: string;
  stages: Array<{ id: string; label: string; evidence: string; boundary: string; href: string }>;
}

export interface WikiChangeRecord {
  id: string;
  title: string;
  summary: string;
  href: string;
  sourceDate: string;
  reviewedAt: string;
}

export interface DiagnosticEvidenceExport {
  format: 'tcwiki-network-controls';
  schemaVersion: 1;
  exportedAt: string;
  scope: 'already-collected-network-controls';
  limitation: string;
  status: LiveDataStatus | 'unavailable';
  checkedAt: string | null;
  assessedAt: string | null;
  presentation: LiveDataResult<NetworkStatus>['presentation'] | null;
  collection: LiveCollectionTiming | null;
  runtime: { version: string | null; commit: string | null; image: string | null };
  height: { observed: number | null; snapshotPinned: boolean | null; blockTime: string | null };
  sources: Array<{ label: string; url: string; retrievedAt: string | null; heightPinning: { requestedHeight: number; observedHeight: number | null; verification: 'verified' | 'unverified' } | null }>;
  summary: string | null;
  error: string | null;
  warnings: string[];
  invalidMimirKeys: string[];
  controls: Array<{ key: string; label: string; state: OperationalControlState; active: boolean }>;
  rawMimir: { available: boolean; unit: string; values: Record<string, string | number | { unavailable: string }>; omitted: number };
  omitted: { sources: number; warnings: number; controls: number; invalidMimirKeys: number };
}

export interface MimirProviderCell {
  state: 'valid' | 'missing' | 'malformed' | 'alias-conflict';
  raw: string | number | null;
  normalized: string | null;
}

export interface MimirProviderSample {
  status: 'observed' | 'unavailable';
  source: SourceMeta;
  checkedAt: string;
  collection: LiveCollectionTiming;
  requestedHeight: number | null;
  observedHeight: number | null;
  verification: 'verified' | 'unverified' | 'mismatch';
  error: string | null;
  values: Record<string, MimirProviderCell>;
}
/** Read-only Midgard indexer observations; no independent settlement evidence. */
export interface TransactionEvidenceCoin { asset: string | null; amount: string | null; }
export interface TransactionEvidenceTransfer { txID: string | null; rawHeight: string | null; height: string | null; coins: TransactionEvidenceCoin[] | null; }
export interface TransactionEvidenceAction {
  type: string | null; status: string | null; rawDate: string | null; observedAt: string | null;
  height: string | null; rawHeight: string | null; memo: string | null; reason: string | null;
  inputs: TransactionEvidenceTransfer[] | null; outputs: TransactionEvidenceTransfer[] | null;
  fees: TransactionEvidenceCoin[] | null; warnings: string[];
}
export interface TransactionEvidence { hash: string; actions: TransactionEvidenceAction[]; count: string | null; warnings: string[]; }
