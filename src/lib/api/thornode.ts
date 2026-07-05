import {
  ChainOperationalStatus,
  DynamicL1FeeCurrentAccumulator,
  DynamicL1FeeHistoryEntry,
  DynamicL1FeeMimirFlag,
  DynamicL1FeeMimirStatus,
  DynamicL1FeePairHistory,
  DynamicL1FeeRecord,
  DynamicL1FeeSourceFreshness,
  DynamicL1FeeStatus,
  DynamicL1FeeThornameHistory,
  DynamicL1FeeWhitelistedPartner,
  DynamicL1FeeWhitelistState,
  InboundOperationField,
  LiveDataResult,
  NetworkStatus,
  NetworkStatusSourceWarning,
  OperationalControlStatus,
  SourceMeta,
  ThornodeInboundAddress,
  ThornodeLastBlock,
} from '@/lib/types';
import { CHAINS } from '@/lib/data/static';
import { liveDegraded, liveOk } from '@/lib/trust';

type ThornodeEndpoint = SourceMeta & {
  cosmosUrl: string;
};

const THORNODE_ENDPOINTS: ThornodeEndpoint[] = [
  {
    label: 'Liquify THORNode',
    url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
    cosmosUrl: 'https://gateway.liquify.com/chain/thorchain_api/cosmos',
  },
  {
    label: 'THORChain THORNode',
    url: 'https://thornode.thorchain.network/thorchain',
    cosmosUrl: 'https://thornode.thorchain.network/cosmos',
  },
];

const THORNODE_BLOCK_STALE_WARNING_SECONDS = 12;
const THORNODE_BLOCK_STALE_DEGRADED_SECONDS = 30;
const THORNODE_BLOCK_FUTURE_WARNING_SECONDS = 12;
const THORNODE_BLOCK_FUTURE_DEGRADED_SECONDS = 30;
const THORNODE_LASTBLOCK_SPREAD_WARNING_BLOCKS = 3;
const DYNAMIC_L1_FEE_HISTORY_THORNAME_LIMIT = 16;
const DYNAMIC_L1_FEE_HISTORY_CONCURRENCY = 4;

let activeEndpoint = 0;

export function resetThornodeEndpointForTests() {
  activeEndpoint = 0;
}

const MIMIR_INTEGER_PATTERN = /^[+-]?\d+$/;
const EXACT_MONITORED_MIMIR_KEYS = [
  'HALTTRADING',
  'StreamingSwapPause',
  'HaltMemoless',
  'HALTSIGNING',
  'PAUSELP',
  'RUNEPoolHaltDeposit',
  'RUNEPoolHaltWithdraw',
  'PAUSELOANS',
  'HALTCHAINGLOBAL',
  'NODEPAUSECHAINGLOBAL',
  'HALTCHURNING',
  'PauseBond',
  'PauseUnbond',
  'HaltRebond',
  'HaltOperatorRotate',
  'HaltOracle',
  'HALTSECUREDGLOBAL',
  'TCYCLAIMINGHALT',
  'TCYCLAIMINGSWAPHALT',
  'TCYSTAKINGHALT',
  'TCYSTAKEDISTRIBUTIONHALT',
  'TCYUNSTAKINGHALT',
  'HALTTCYTRADING',
  'HALTWASMGLOBAL',
  'TRADEACCOUNTSENABLED',
  'TRADEACCOUNTSDEPOSITENABLED',
  'MANUALSWAPSTOSYNTHDISABLED',
  'RUNEPOOLENABLED',
  'BANKSENDENABLED',
] as const;

const PREFIX_MONITORED_MIMIR_KEYS = [
  'PAUSELPDEPOSIT-',
  'PauseAsymWithdrawal-',
  'HaltSecuredDeposit-',
  'HaltSecuredWithdraw-',
  'HaltWasmDeployer-',
  'HaltWasmCs-',
  'HaltWasmContract-',
] as const;

const NON_CHAIN_SCOPED_MIMIR_CODES = new Set(['TCY']);
const CURATED_CHAIN_CODES = new Set([...CHAINS.map((chain) => chain.chain.toUpperCase()), 'THOR']);
const KNOWN_NON_OPERATIONAL_PAUSE_KEYS = new Set(['PAUSEONSLASHTHRESHOLD']);
const REVIEWED_NON_PAUSING_OPERATIONAL_MIMIR_PREFIXES = [
  'DYNAMICFEE-WHITELIST-',
  'EVMALLOWANCECHECK-',
  'ADR',
  'POL-',
  'TORANCHOR-',
] as const;
const UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES = [
  'STOPSOLVENCYCHECK',
  'EVMDISABLECONTRACTWHITELIST',
  'RAGNAROK-',
] as const;
const REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES = [
  'COMPROMISEDVAULT-',
  'ENABLESWITCH-',
  'BURNSYNTHS',
  'SCHEDULEDMIGRATION',
  'FUNDMIGRATIONINTERVAL',
  'MIMIRRECALLFUND',
  'MIMIRUPGRADECONTRACT',
] as const;
const DYNAMIC_L1_FEE_WHITELIST_PREFIX = 'DYNAMICFEE-WHITELIST-';
const TOR_BASE_UNIT_MAX_DIGITS = 80;
const TOR_BASE_UNIT_PATTERN = /^\d+$/;

type MimirActivationMode = 'positive' | 'at-or-after-height' | 'after-height' | 'until-height';

type MimirNumericState =
  | { state: 'absent' }
  | { state: 'valid'; key: string; value: number }
  | { state: 'unparseable'; key: string };

type MimirActivityState =
  | { state: 'absent' }
  | { state: 'unparseable'; key: string }
  | { state: 'active' | 'inactive' | 'scheduled' | 'expired'; key: string; value: number };

type LastBlockChainEvidence = {
  chain: string;
  thorchain: number;
  lastObservedIn: number;
  lastSignedOut: number;
};

type ThorchainHeightEvidence = {
  height: number;
  minHeight: number;
  maxHeight: number;
  spread: number;
  byChain: Map<string, LastBlockChainEvidence>;
};

async function request<T>(path: string): Promise<LiveDataResult<T>> {
  const errors: string[] = [];

  for (let i = 0; i < THORNODE_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % THORNODE_ENDPOINTS.length;
    const endpoint = THORNODE_ENDPOINTS[endpointIndex];
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${endpoint.url}${path}`, {
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      activeEndpoint = endpointIndex;
      return liveOk(data, endpoint);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown THORNode error';
      errors.push(`${endpoint.label}: ${message}`);
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  return liveDegraded<T>(`THORNode source did not respond (${errors.join('; ')})`);
}

async function requestJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

function withQueryHeight(path: string, height: number | undefined) {
  if (height === undefined) {
    return path;
  }

  return `${path}${path.includes('?') ? '&' : '?'}height=${height}`;
}

function thornodePathUrl(endpoint: SourceMeta, path: string, height?: number) {
  return `${endpoint.url}${withQueryHeight(path, height)}`;
}

function sourceForThornodePath(endpoint: SourceMeta, label: string, path: string, height?: number): SourceMeta {
  return {
    label: `${endpoint.label} ${label}`,
    url: thornodePathUrl(endpoint, path, height),
    notes: height === undefined
      ? 'Latest unpinned THORNode read used to choose a conservative pinned snapshot height.'
      : `Height-pinned THORNode read at ${height}.`,
  };
}

function sourceForCosmosPath(endpoint: ThornodeEndpoint, label: string, path: string): SourceMeta {
  return {
    label: `${endpoint.label} ${label}`,
    url: `${endpoint.cosmosUrl}${path}`,
    notes: 'Latest Cosmos block read used to choose a conservative pinned THORChain snapshot height.',
  };
}

function uniqueSourcesByUrl(sources: SourceMeta[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    if (seen.has(source.url)) {
      return false;
    }
    seen.add(source.url);
    return true;
  });
}

function networkStatusSources(endpoint: ThornodeEndpoint, snapshotHeight: number) {
  return [
    endpoint,
    sourceForCosmosPath(endpoint, 'latest block', '/base/tendermint/v1beta1/blocks/latest'),
    sourceForThornodePath(endpoint, 'Mimir', '/mimir', snapshotHeight),
    sourceForThornodePath(endpoint, 'inbound addresses', '/inbound_addresses', snapshotHeight),
    sourceForThornodePath(endpoint, 'version', '/version', snapshotHeight),
    sourceForThornodePath(endpoint, 'lastblock', '/lastblock', snapshotHeight),
  ];
}

function dynamicL1FeeStatusSources(endpoint: ThornodeEndpoint, snapshotHeight: number) {
  return [
    endpoint,
    sourceForCosmosPath(endpoint, 'latest block', '/base/tendermint/v1beta1/blocks/latest'),
    sourceForThornodePath(endpoint, 'Mimir', '/mimir', snapshotHeight),
    sourceForThornodePath(endpoint, 'dynamic L1 fee records', '/dynamic_l1_fees', snapshotHeight),
    sourceForThornodePath(endpoint, 'dynamic L1 fee current epoch', '/dynamic_l1_fees_current', snapshotHeight),
  ];
}

function getConservativeSnapshotHeight(latestHeight: number) {
  return Math.max(0, latestHeight - 1);
}

async function requestFromEndpoint<T>(endpoint: SourceMeta, path: string, height?: number): Promise<T> {
  return requestJson<T>(thornodePathUrl(endpoint, path, height));
}

async function requestCosmosFromEndpoint<T>(endpoint: ThornodeEndpoint, path: string): Promise<T> {
  return requestJson<T>(`${endpoint.cosmosUrl}${path}`);
}

async function forEachWithConcurrency<T>(
  items: T[],
  concurrency: number,
  handler: (item: T) => Promise<void>
) {
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      if (item !== undefined) {
        await handler(item);
      }
    }
  }));
}

function toMimirNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null;
  }
  if (typeof value === 'string') {
    if (!MIMIR_INTEGER_PATTERN.test(value)) {
      return null;
    }
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : null;
  }
  return null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const INBOUND_OPERATION_FIELDS = [
  'halted',
  'global_trading_paused',
  'chain_trading_paused',
  'chain_lp_actions_paused',
] as const satisfies readonly InboundOperationField[];

function missingInboundOperationFields(chain: ThornodeInboundAddress | undefined) {
  if (!chain) {
    return [];
  }

  return INBOUND_OPERATION_FIELDS.filter((field) => chain[field] === undefined);
}

function isThornodeInboundAddresses(value: unknown): value is ThornodeInboundAddress[] {
  return Array.isArray(value) && value.every((item) => (
    isPlainRecord(item) &&
    typeof item.chain === 'string' &&
    item.chain.trim().length > 0 &&
    (item.halted === undefined || typeof item.halted === 'boolean') &&
    (item.global_trading_paused === undefined || typeof item.global_trading_paused === 'boolean') &&
    (item.chain_trading_paused === undefined || typeof item.chain_trading_paused === 'boolean') &&
    (item.chain_lp_actions_paused === undefined || typeof item.chain_lp_actions_paused === 'boolean')
  ));
}

function getDuplicateInboundChains(inbound: ThornodeInboundAddress[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const chain of inbound) {
    const chainCode = chain.chain.trim().toUpperCase();
    if (seen.has(chainCode)) {
      duplicates.add(chainCode);
    }
    seen.add(chainCode);
  }
  return [...duplicates].sort();
}

function getThorchainHeightEvidence(lastBlocks: unknown): ThorchainHeightEvidence | null {
  if (!Array.isArray(lastBlocks)) {
    return null;
  }

  const byChain = new Map<string, LastBlockChainEvidence>();
  for (const item of lastBlocks) {
    if (!isPlainRecord(item) || typeof item.chain !== 'string' || item.chain.trim().length === 0) {
      return null;
    }

    const chain = item.chain.trim().toUpperCase();
    if (byChain.has(chain)) {
      return null;
    }

    const thorchain = toMimirNumber(item.thorchain);
    const lastObservedIn = toMimirNumber(item.last_observed_in);
    const lastSignedOut = toMimirNumber(item.last_signed_out);
    if (
      thorchain === null ||
      lastObservedIn === null ||
      lastSignedOut === null ||
      thorchain < 0 ||
      lastObservedIn < 0 ||
      lastSignedOut < 0
    ) {
      return null;
    }

    byChain.set(chain, {
      chain,
      thorchain,
      lastObservedIn,
      lastSignedOut,
    });
  }

  if (byChain.size === 0) {
    return null;
  }

  const heights = [...byChain.values()].map((item) => item.thorchain);
  const minHeight = Math.min(...heights);
  const maxHeight = Math.max(...heights);
  return {
    height: maxHeight,
    minHeight,
    maxHeight,
    spread: maxHeight - minHeight,
    byChain,
  };
}

function getTendermintLatestBlockInfo(value: unknown): { height: number; time: string } | null {
  if (!isPlainRecord(value) || !isPlainRecord(value.block) || !isPlainRecord(value.block.header)) {
    return null;
  }

  const height = toMimirNumber(value.block.header.height);
  const time = value.block.header.time;
  if (height === null || height < 0 || typeof time !== 'string' || Number.isNaN(Date.parse(time))) {
    return null;
  }

  return { height, time };
}

function getThorNodeVersion(version: unknown): string | undefined {
  if (!isPlainRecord(version)) {
    return undefined;
  }

  const current = version.current;
  if (typeof current === 'string' && current.length > 0) {
    return current;
  }

  const legacyVersion = version.version;
  return typeof legacyVersion === 'string' && legacyVersion.length > 0 ? legacyVersion : undefined;
}

function formatAgeSeconds(seconds: number) {
  const absolute = Math.abs(seconds);
  if (absolute < 60) {
    return `${absolute} second${absolute === 1 ? '' : 's'}`;
  }

  const minutes = Math.round(absolute / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function classifyNetworkSourceWarning(message: string, scopes?: string[]): NetworkStatusSourceWarning {
  if (message.includes('latest block timestamp')) {
    return {
      severity: message.includes(' is stale.') ? 'critical' : 'warning',
      category: 'freshness',
      message,
      action: 'Treat this status as degraded until THORNode returns a fresh latest-block timestamp.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('snapshot was not pinned')) {
    return {
      severity: 'warning',
      category: 'pinning',
      message,
      action: 'Prefer a same-height THORNode snapshot before treating missing halt flags as complete.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('lastblock THORChain heights diverge') || message.includes('latest block height differs')) {
    return {
      severity: 'warning',
      category: 'height-divergence',
      message,
      action: 'Review provider block-height consistency before using this as a clean operational snapshot.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('omitted') || message.includes('did not include') || message.includes('missing')) {
    return {
      severity: 'warning',
      category: 'source-shape',
      message,
      action: 'Treat the affected live fields as partial until the source response shape is complete.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('could not be parsed')) {
    return {
      severity: 'warning',
      category: 'mimir-parse',
      message,
      action: 'Review the exact Mimir values before counting those controls as inactive.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('Unknown chain-scoped Mimir key')) {
    return {
      severity: 'review',
      category: 'unknown-chain',
      message,
      action: 'Classify the chain-scoped key family before treating it as non-pausing.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  if (message.includes('Unknown operation-like Mimir key')) {
    return {
      severity: 'review',
      category: 'unknown-operation',
      message,
      action: 'Review the operation-like key family before interpreting it as non-pausing.',
      ...(scopes?.length ? { scopes } : {}),
    };
  }

  return {
    severity: 'warning',
    category: 'other',
    message,
    action: 'Review this source warning before treating the live status as clean.',
    ...(scopes?.length ? { scopes } : {}),
  };
}

function warningDetail({
  severity,
  category,
  message,
  action,
  keys,
  scopes,
}: NetworkStatusSourceWarning): NetworkStatusSourceWarning {
  return {
    severity,
    category,
    message,
    action,
    ...(keys?.length ? { keys } : {}),
    ...(scopes?.length ? { scopes } : {}),
  };
}

function uniqueSourceWarningDetails(details: NetworkStatusSourceWarning[]) {
  const seen = new Set<string>();
  return details.filter((detail) => {
    const signature = [
      detail.severity,
      detail.category,
      detail.message,
      detail.action,
      detail.keys?.join(',') ?? '',
      detail.scopes?.join(',') ?? '',
    ].join('|');
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

function getWarningDetailSnapshotScore(detail: NetworkStatusSourceWarning) {
  switch (detail.category) {
    case 'freshness':
    case 'pinning':
      return detail.severity === 'critical' ? 120 : 100;
    case 'height-divergence':
      return 80;
    case 'source-shape':
    case 'mimir-parse':
      return 60;
    case 'mimir-support':
      return 10;
    case 'unknown-chain':
      return 25;
    case 'unknown-operation':
      return 10;
    case 'other':
      return 25;
  }
}

function getWarningSnapshotScore(status: NetworkStatus) {
  if (status.sourceWarningDetails?.length) {
    return status.sourceWarningDetails.reduce((score, detail) => score + getWarningDetailSnapshotScore(detail), 0);
  }

  return status.sourceWarnings.reduce((score, warning) => {
    if (warning.includes('latest block timestamp') || warning.includes('snapshot was not pinned')) {
      return score + 100;
    }
    if (warning.includes('lastblock THORChain heights diverge')) {
      return score + 80;
    }
    if (warning.includes('did not include') || warning.includes('missing')) {
      return score + 60;
    }
    if (warning.includes('Unknown operation-like Mimir key')) {
      return score + 10;
    }
    return score + 25;
  }, 0);
}

function getDynamicFeeWarningSnapshotScore(status: DynamicL1FeeStatus) {
  const details = status.sourceWarningDetails.length
    ? status.sourceWarningDetails
    : getDynamicFeeSourceWarningDetails(status.sourceWarnings);

  return details.reduce((score, detail) => score + getWarningDetailSnapshotScore(detail), 0);
}

function dynamicFeeWarningKeys(message: string) {
  return [...new Set(message.match(/\b(?:L1[A-Za-z0-9]+|DYNAMICFEE-WHITELIST-[A-Z0-9_-]+)\b/g) ?? [])]
    .sort((left, right) => left.localeCompare(right));
}

function classifyDynamicFeeSourceWarning(message: string): NetworkStatusSourceWarning {
  const keys = dynamicFeeWarningKeys(message);

  if (message.includes('latest block timestamp')) {
    return warningDetail({
      severity: message.includes(' is stale.') ? 'critical' : 'warning',
      category: 'freshness',
      message,
      action: 'Treat dynamic-fee values as stale until THORNode returns a fresh latest-block timestamp.',
      keys,
    });
  }

  if (
    message.includes('unparseable') ||
    message.includes('unsupported dynamic fee') ||
    message.includes('outside ADR-026 clamp bounds')
  ) {
    return warningDetail({
      severity: 'warning',
      category: 'mimir-parse',
      message,
      action: 'Review the exact dynamic-fee Mimir values before treating controller state or configured bounds as clean.',
      keys,
    });
  }

  if (
    message.includes('Invalid dynamic_l1_fees') ||
    message.includes('did not include') ||
    message.includes('not requested') ||
    message.includes('history fetch capped') ||
    message.includes('unavailable') ||
    message.includes('duplicate') ||
    message.includes('without a sealed dynamic_l1_fees record') ||
    message.includes('has no matching DYNAMICFEE-WHITELIST') ||
    message.includes('disagrees with') ||
    message.includes('epoch mismatch') ||
    message.includes('should be pruned') ||
    message.includes('below effective floor') ||
    message.includes('above effective ceiling')
  ) {
    return warningDetail({
      severity: 'warning',
      category: 'source-shape',
      message,
      action: 'Treat the affected dynamic-fee record, history, or current accumulator as partial until THORNode returns consistent fields.',
      keys,
    });
  }

  return warningDetail({
    severity: 'warning',
    category: 'other',
    message,
    action: 'Review this dynamic-fee source warning before treating the live tracker as clean.',
    keys,
  });
}

function getDynamicFeeSourceWarningDetails(warnings: string[]) {
  return uniqueSourceWarningDetails(warnings.map(classifyDynamicFeeSourceWarning));
}

function getDynamicFeeBlockAgeWarnings(blockAgeSeconds: number | undefined) {
  if (blockAgeSeconds === undefined) {
    return [];
  }

  if (blockAgeSeconds < -THORNODE_BLOCK_FUTURE_DEGRADED_SECONDS) {
    return [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} in the future; dynamic fee state is stale.`];
  }
  if (blockAgeSeconds < -THORNODE_BLOCK_FUTURE_WARNING_SECONDS) {
    return [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} in the future; dynamic fee state may be stale.`];
  }
  if (blockAgeSeconds > THORNODE_BLOCK_STALE_DEGRADED_SECONDS) {
    return [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} old; dynamic fee state is stale.`];
  }
  if (blockAgeSeconds > THORNODE_BLOCK_STALE_WARNING_SECONDS) {
    return [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} old; dynamic fee state may be stale.`];
  }

  return [];
}

function toNonNegativeInteger(value: unknown, field: string): number {
  const numeric = toMimirNumber(value);
  if (numeric === null || numeric < 0) {
    throw new Error(`Invalid ${field}; expected a non-negative safe integer.`);
  }
  return numeric;
}

function toTorBaseUnits(value: unknown, field: string): string | null {
  if (value === '') {
    return null;
  }
  if (typeof value === 'string' && value.length <= TOR_BASE_UNIT_MAX_DIGITS && TOR_BASE_UNIT_PATTERN.test(value)) {
    return value;
  }
  throw new Error(`Invalid ${field}; expected a TOR base-unit integer string with at most ${TOR_BASE_UNIT_MAX_DIGITS} digits or empty string.`);
}

function dynamicMimirFlag(mimir: Record<string, unknown>, key: string): DynamicL1FeeMimirFlag {
  const state = getMimirNumericState(mimir, key);
  if (state.state === 'absent') {
    return { key, value: null, state: 'absent' };
  }
  if (state.state === 'unparseable') {
    return { key: state.key, value: null, state: 'unparseable' };
  }
  return {
    key: state.key,
    value: state.value,
    state: state.value > 0 ? 'active' : 'inactive',
  };
}

function dynamicEnabledFlag(
  mimir: Record<string, unknown>,
  sourceWarnings: string[],
  invalidKeys: string[]
): DynamicL1FeeMimirFlag {
  const key = 'L1DynamicFeeEnabled';
  const state = getMimirNumericState(mimir, key);
  if (state.state === 'absent') {
    return { key, value: null, defaultValue: 0, effectiveValue: 0, state: 'absent' };
  }
  if (state.state === 'unparseable') {
    invalidKeys.push(state.key);
    sourceWarnings.push(`${state.key} is unparseable; dynamic fee enablement is unknown.`);
    return { key: state.key, value: null, defaultValue: 0, effectiveValue: null, state: 'unparseable' };
  }
  if (state.value !== 0 && state.value !== 1) {
    invalidKeys.push(state.key);
    sourceWarnings.push(`${state.key} has unsupported dynamic fee enablement value ${state.value}; expected 0 or 1.`);
    return { key: state.key, value: state.value, defaultValue: 0, effectiveValue: null, state: 'unparseable' };
  }

  return {
    key: state.key,
    value: state.value,
    defaultValue: 0,
    effectiveValue: state.value,
    state: state.value === 1 ? 'active' : 'inactive',
  };
}

function dynamicConfigFlag(
  mimir: Record<string, unknown>,
  key: string,
  defaultValue: number,
  sourceWarnings: string[],
  invalidKeys: string[],
  options: { min?: number; max?: number } = {}
): DynamicL1FeeMimirFlag {
  const state = getMimirNumericState(mimir, key);
  if (state.state === 'absent') {
    return { key, value: null, defaultValue, effectiveValue: defaultValue, state: 'absent' };
  }
  if (state.state === 'unparseable' || state.value < 0) {
    const invalidKey = state.state === 'unparseable' ? state.key : key;
    invalidKeys.push(invalidKey);
    sourceWarnings.push(`${invalidKey} is unparseable or negative; using no trusted dynamic fee config value.`);
    return { key: invalidKey, value: null, defaultValue, effectiveValue: null, state: 'unparseable' };
  }

  const min = options.min;
  const max = options.max;
  const effectiveValue = Math.min(
    max ?? state.value,
    Math.max(min ?? state.value, state.value)
  );
  if (effectiveValue !== state.value) {
    sourceWarnings.push(`${state.key} value ${state.value} is outside ADR-026 clamp bounds; displaying effective value ${effectiveValue}.`);
  }

  return {
    key: state.key,
    value: state.value,
    defaultValue,
    effectiveValue,
    state: state.value > 0 ? 'active' : 'inactive',
  };
}

function dynamicWhitelistState(value: number | null): DynamicL1FeeWhitelistState {
  if (value === null) {
    return 'unparseable';
  }
  if (value === 1) {
    return 'active';
  }
  if (value === 2) {
    return 'monitor';
  }
  if (value === 0) {
    return 'inactive';
  }
  return 'unparseable';
}

function dynamicWhitelisted(value: number | null): boolean | null {
  const state = dynamicWhitelistState(value);
  return state === 'active' || state === 'monitor'
    ? true
    : state === 'inactive'
      ? false
      : null;
}

function getDynamicL1FeeMimirStatus(mimir: Record<string, unknown>, sourceWarnings: string[]): DynamicL1FeeMimirStatus {
  const invalidKeys: string[] = [];
  const enabled = dynamicEnabledFlag(mimir, sourceWarnings, invalidKeys);
  const slipMinBps = dynamicMimirFlag(mimir, 'L1SlipMinBPS');
  const epochBlocks = dynamicConfigFlag(mimir, 'L1DynamicFeeEpochBlocks', 14400, sourceWarnings, invalidKeys);
  const floorBps = dynamicConfigFlag(mimir, 'L1DynamicFeeFloorBPS', 1, sourceWarnings, invalidKeys);
  const ceilingBps = dynamicConfigFlag(mimir, 'L1DynamicFeeCeilingBPS', 20, sourceWarnings, invalidKeys);
  const stepBps = dynamicConfigFlag(mimir, 'L1DynamicFeeStepBPS', 1, sourceWarnings, invalidKeys);
  const deadbandBps = dynamicConfigFlag(mimir, 'L1DynamicFeeDeadbandBPS', 1000, sourceWarnings, invalidKeys);
  const windowEpochs = dynamicConfigFlag(mimir, 'L1DynamicFeeWindowEpochs', 3, sourceWarnings, invalidKeys, { min: 1, max: 30 });

  if (slipMinBps.state === 'unparseable') {
    invalidKeys.push(slipMinBps.key);
    sourceWarnings.push(`${slipMinBps.key} is unparseable; base L1 minimum bps is unknown.`);
  }

  const whitelistedPartners: DynamicL1FeeWhitelistedPartner[] = Object.entries(mimir)
    .filter(([key]) => key.toUpperCase().startsWith(DYNAMIC_L1_FEE_WHITELIST_PREFIX))
    .map(([key, rawValue]) => {
      const value = toMimirNumber(rawValue);
      const state = dynamicWhitelistState(value);
      const thorname = key.slice(DYNAMIC_L1_FEE_WHITELIST_PREFIX.length).toLowerCase();
      if (state === 'unparseable') {
        invalidKeys.push(key);
        sourceWarnings.push(`${key} has an unsupported or unparseable dynamic fee whitelist state.`);
      }
      return {
        key,
        thorname,
        value,
        whitelisted: dynamicWhitelisted(value),
        state,
      };
    })
    .sort((left, right) => left.thorname.localeCompare(right.thorname));

  return {
    enabled,
    slipMinBps,
    epochBlocks,
    floorBps,
    ceilingBps,
    stepBps,
    deadbandBps,
    windowEpochs,
    whitelistedPartners,
    invalidKeys: [...new Set(invalidKeys)].sort((left, right) => left.localeCompare(right)),
  };
}

function recordKey(thorname: string, pair: string) {
  return `${thorname.toLowerCase()}|${pair}`;
}

function parseDynamicL1FeeRecords(value: unknown): DynamicL1FeeRecord[] {
  if (!isPlainRecord(value) || !Array.isArray(value.entries)) {
    throw new Error('THORNode dynamic_l1_fees response did not include an entries array.');
  }

  const seen = new Set<string>();
  return value.entries.map((entry, index) => {
    if (!isPlainRecord(entry)) {
      throw new Error(`THORNode dynamic_l1_fees entry ${index} was not a plain object.`);
    }
    const thorname = typeof entry.thorname === 'string' ? entry.thorname.trim().toLowerCase() : '';
    const pair = typeof entry.pair === 'string' ? entry.pair.trim() : '';
    if (!thorname || !pair) {
      throw new Error(`THORNode dynamic_l1_fees entry ${index} did not include a usable thorname and pair.`);
    }
    const key = recordKey(thorname, pair);
    if (seen.has(key)) {
      throw new Error(`THORNode dynamic_l1_fees response included a duplicate record for ${thorname} ${pair}.`);
    }
    seen.add(key);

    const dynamicBps = toNonNegativeInteger(entry.dynamic_bps, `dynamic_l1_fees entry ${key} dynamic_bps`);
    if (dynamicBps > 10000) {
      throw new Error(`THORNode dynamic_l1_fees entry ${key} dynamic_bps exceeded 10000.`);
    }
    const whitelistValue = toNonNegativeInteger(entry.whitelist_state, `dynamic_l1_fees entry ${key} whitelist_state`);
    const whitelistState = dynamicWhitelistState(whitelistValue);
    if (whitelistState === 'unparseable') {
      throw new Error(`THORNode dynamic_l1_fees entry ${key} had unsupported whitelist_state ${whitelistValue}.`);
    }

    return {
      thorname,
      pair,
      dynamicBps,
      whitelistValue,
      whitelistState,
      whitelisted: dynamicWhitelisted(whitelistValue),
      lastActiveEpoch: toNonNegativeInteger(entry.last_active_epoch, `dynamic_l1_fees entry ${key} last_active_epoch`),
      latestFeesTorBaseUnits: toTorBaseUnits(entry.latest_fees_tor, `dynamic_l1_fees entry ${key} latest_fees_tor`),
    };
  }).sort((left, right) => (
    left.thorname.localeCompare(right.thorname) ||
    left.pair.localeCompare(right.pair)
  ));
}

function parseDynamicL1FeeCurrent(value: unknown): {
  currentEpoch: number;
  currentEntries: DynamicL1FeeCurrentAccumulator[];
} {
  if (!isPlainRecord(value) || !Array.isArray(value.entries)) {
    throw new Error('THORNode dynamic_l1_fees_current response did not include an entries array.');
  }

  const currentEpoch = toNonNegativeInteger(value.epoch, 'dynamic_l1_fees_current epoch');
  const seen = new Set<string>();
  const currentEntries = value.entries.map((entry, index) => {
    if (!isPlainRecord(entry)) {
      throw new Error(`THORNode dynamic_l1_fees_current entry ${index} was not a plain object.`);
    }
    const thorname = typeof entry.thorname === 'string' ? entry.thorname.trim().toLowerCase() : '';
    const pair = typeof entry.pair === 'string' ? entry.pair.trim() : '';
    if (!thorname || !pair) {
      throw new Error(`THORNode dynamic_l1_fees_current entry ${index} did not include a usable thorname and pair.`);
    }
    const key = recordKey(thorname, pair);
    if (seen.has(key)) {
      throw new Error(`THORNode dynamic_l1_fees_current response included a duplicate record for ${thorname} ${pair}.`);
    }
    seen.add(key);

    return {
      thorname,
      pair,
      epoch: toNonNegativeInteger(entry.epoch, `dynamic_l1_fees_current entry ${key} epoch`),
      volumeTorBaseUnits: toTorBaseUnits(entry.volume_tor, `dynamic_l1_fees_current entry ${key} volume_tor`),
      feesTorBaseUnits: toTorBaseUnits(entry.fees_tor, `dynamic_l1_fees_current entry ${key} fees_tor`),
    };
  }).sort((left, right) => (
    left.thorname.localeCompare(right.thorname) ||
    left.pair.localeCompare(right.pair)
  ));

  return { currentEpoch, currentEntries };
}

function parseDynamicL1FeeThornameHistory(
  value: unknown,
  expectedThorname: string
): { history: DynamicL1FeeThornameHistory; sourceWarnings: string[] } {
  if (!isPlainRecord(value) || !Array.isArray(value.pairs)) {
    throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} response did not include a pairs array.`);
  }

  const sourceWarnings: string[] = [];
  const thorname = typeof value.thorname === 'string' ? value.thorname.trim().toLowerCase() : '';
  const expected = expectedThorname.trim().toLowerCase();
  if (!thorname) {
    throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} response did not include a usable thorname.`);
  }
  if (thorname !== expected) {
    sourceWarnings.push(`Dynamic fee history request for ${expected} returned thorname ${thorname}.`);
  }

  const whitelistValue = toNonNegativeInteger(
    value.whitelist_state,
    `dynamic_l1_fees/${expectedThorname} whitelist_state`
  );
  const whitelistState = dynamicWhitelistState(whitelistValue);
  if (whitelistState === 'unparseable') {
    throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} had unsupported whitelist_state ${whitelistValue}.`);
  }

  const seenPairs = new Set<string>();
  const pairs: DynamicL1FeePairHistory[] = value.pairs.map((pairValue, pairIndex) => {
    if (!isPlainRecord(pairValue) || !Array.isArray(pairValue.history)) {
      throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pairIndex} did not include a history array.`);
    }

    const pair = typeof pairValue.pair === 'string' ? pairValue.pair.trim() : '';
    if (!pair) {
      throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pairIndex} did not include a usable pair.`);
    }
    const pairKey = recordKey(thorname, pair);
    if (seenPairs.has(pairKey)) {
      throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} response included a duplicate history pair for ${thorname} ${pair}.`);
    }
    seenPairs.add(pairKey);

    const dynamicBps = toNonNegativeInteger(
      pairValue.dynamic_bps,
      `dynamic_l1_fees/${expectedThorname} pair ${pair} dynamic_bps`
    );
    if (dynamicBps > 10000) {
      throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pair} dynamic_bps exceeded 10000.`);
    }

    const seenEpochs = new Set<number>();
    const history: DynamicL1FeeHistoryEntry[] = pairValue.history.map((entry, entryIndex) => {
      if (!isPlainRecord(entry)) {
        throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} was not a plain object.`);
      }

      const epoch = toNonNegativeInteger(
        entry.epoch,
        `dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} epoch`
      );
      if (seenEpochs.has(epoch)) {
        throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pair} included duplicate history epoch ${epoch}.`);
      }
      seenEpochs.add(epoch);

      const bpsAtClose = toNonNegativeInteger(
        entry.bps_at_close,
        `dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} bps_at_close`
      );
      if (bpsAtClose > 10000) {
        throw new Error(`THORNode dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} bps_at_close exceeded 10000.`);
      }

      return {
        epoch,
        volumeTorBaseUnits: toTorBaseUnits(
          entry.volume_tor,
          `dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} volume_tor`
        ),
        feesTorBaseUnits: toTorBaseUnits(
          entry.fees_tor,
          `dynamic_l1_fees/${expectedThorname} pair ${pair} history entry ${entryIndex} fees_tor`
        ),
        bpsAtClose,
      };
    }).sort((left, right) => left.epoch - right.epoch);

    return {
      thorname,
      pair,
      dynamicBps,
      whitelistValue,
      whitelistState,
      lastActiveEpoch: toNonNegativeInteger(
        pairValue.last_active_epoch,
        `dynamic_l1_fees/${expectedThorname} pair ${pair} last_active_epoch`
      ),
      history,
    };
  }).sort((left, right) => left.pair.localeCompare(right.pair));

  return {
    history: {
      thorname,
      whitelistValue,
      whitelistState,
      pairs,
    },
    sourceWarnings,
  };
}

async function requestDynamicL1FeeHistories(
  endpoint: ThornodeEndpoint,
  snapshotHeight: number,
  status: DynamicL1FeeStatus
): Promise<{ histories: DynamicL1FeeThornameHistory[]; sourceWarnings: string[]; sources: SourceMeta[] }> {
  const recordThornames = [...new Set(status.records.map((record) => record.thorname))]
    .sort((left, right) => left.localeCompare(right));
  const recordThornameSet = new Set(recordThornames);
  const activeWhitelistedThornames = [...new Set(status.mimir.whitelistedPartners
    .filter((partner) => partner.whitelisted === true)
    .map((partner) => partner.thorname))]
    .sort((left, right) => left.localeCompare(right));
  const allThornames = [
    ...recordThornames,
    ...activeWhitelistedThornames.filter((thorname) => !recordThornameSet.has(thorname)),
  ];
  const thornames = allThornames.slice(0, DYNAMIC_L1_FEE_HISTORY_THORNAME_LIMIT);
  const omittedThornameCount = allThornames.length - thornames.length;

  const histories: DynamicL1FeeThornameHistory[] = [];
  const sourceWarnings: string[] = [];
  if (omittedThornameCount > 0) {
    sourceWarnings.push(
      `Dynamic fee history fetch capped at ${DYNAMIC_L1_FEE_HISTORY_THORNAME_LIMIT} thornames; ${omittedThornameCount} additional thorname histories were not requested.`
    );
  }
  const sources = thornames.map((thorname) => sourceForThornodePath(
    endpoint,
    `dynamic L1 fee history ${thorname}`,
    `/dynamic_l1_fees/${encodeURIComponent(thorname)}`,
    snapshotHeight
  ));

  await forEachWithConcurrency(thornames, DYNAMIC_L1_FEE_HISTORY_CONCURRENCY, async (thorname) => {
    try {
      const response = await requestFromEndpoint<unknown>(
        endpoint,
        `/dynamic_l1_fees/${encodeURIComponent(thorname)}`,
        snapshotHeight
      );
      const parsed = parseDynamicL1FeeThornameHistory(response, thorname);
      histories.push(parsed.history);
      sourceWarnings.push(...parsed.sourceWarnings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown dynamic fee history error';
      sourceWarnings.push(`Dynamic fee history for ${thorname} was unavailable: ${message}`);
    }
  });

  return {
    histories: histories.sort((left, right) => left.thorname.localeCompare(right.thorname)),
    sourceWarnings,
    sources,
  };
}

type DynamicL1FeeProviderSnapshot = {
  endpointIndex: number;
  endpoint: ThornodeEndpoint;
  mimir: Record<string, unknown>;
  dynamicFees: unknown;
  currentDynamicFees: unknown;
  sourceFreshness: DynamicL1FeeSourceFreshness;
  blockAgeWarnings: string[];
  status: DynamicL1FeeStatus;
  sources: SourceMeta[];
};

type DynamicL1FeeWarningCandidate = {
  endpointIndex: number;
  status: DynamicL1FeeStatus;
  sources: SourceMeta[];
  snapshot?: DynamicL1FeeProviderSnapshot;
};

function shouldTryNextDynamicFeeProvider(status: DynamicL1FeeStatus) {
  return status.sourceWarnings.some((warning) => (
    !warning.startsWith('Dynamic fee history fetch capped at ')
  ));
}

async function finalizeDynamicL1FeeProviderSnapshot(
  snapshot: DynamicL1FeeProviderSnapshot
): Promise<DynamicL1FeeWarningCandidate> {
  const historyResult = await requestDynamicL1FeeHistories(
    snapshot.endpoint,
    snapshot.sourceFreshness.thorchainHeight,
    snapshot.status
  );
  const status = deriveDynamicL1FeeStatus(
    snapshot.mimir,
    snapshot.dynamicFees,
    snapshot.currentDynamicFees,
    snapshot.sourceFreshness,
    historyResult.histories,
    historyResult.sourceWarnings
  );
  const sourceWarnings = [
    ...status.sourceWarnings,
    ...snapshot.blockAgeWarnings,
  ];
  const uniqueWarnings = [...new Set(sourceWarnings)].sort((left, right) => left.localeCompare(right));
  const sources = uniqueSourcesByUrl([
    ...snapshot.sources,
    ...historyResult.sources,
  ]);

  return {
    endpointIndex: snapshot.endpointIndex,
    status: {
      ...status,
      sourceWarnings: uniqueWarnings,
      sourceWarningDetails: getDynamicFeeSourceWarningDetails(uniqueWarnings),
    },
    sources,
  };
}

export function deriveDynamicL1FeeStatus(
  mimir: Record<string, unknown>,
  recordsResponse: unknown,
  currentResponse: unknown,
  sourceFreshness: DynamicL1FeeSourceFreshness,
  histories: DynamicL1FeeThornameHistory[] = [],
  historyWarnings: string[] = []
): DynamicL1FeeStatus {
  const sourceWarnings: string[] = [...historyWarnings];
  const records = parseDynamicL1FeeRecords(recordsResponse);
  const { currentEpoch, currentEntries } = parseDynamicL1FeeCurrent(currentResponse);
  const recordKeys = new Set(records.map((record) => recordKey(record.thorname, record.pair)));
  const mimirStatus = getDynamicL1FeeMimirStatus(mimir, sourceWarnings);
  const whitelistedByThorname = new Map(mimirStatus.whitelistedPartners.map((partner) => [partner.thorname, partner]));
  const recordsByKey = new Map(records.map((record) => [recordKey(record.thorname, record.pair), record]));
  const floorBps = mimirStatus.floorBps.effectiveValue;
  const ceilingBps = mimirStatus.ceilingBps.effectiveValue;

  for (const record of records) {
    const partner = whitelistedByThorname.get(record.thorname);
    if (!partner) {
      sourceWarnings.push(`Sealed dynamic fee record ${record.thorname} ${record.pair} has no matching DYNAMICFEE-WHITELIST Mimir key.`);
    } else if (partner.state !== 'unparseable' && partner.state !== record.whitelistState) {
      sourceWarnings.push(`Sealed dynamic fee record ${record.thorname} ${record.pair} whitelist_state ${record.whitelistValue} disagrees with ${partner.key}=${partner.value}.`);
    }
    if (record.whitelistState === 'inactive') {
      sourceWarnings.push(`Sealed dynamic fee record ${record.thorname} ${record.pair} is inactive even though ADR-026 records should be pruned when whitelist state is 0 or absent.`);
    }
    if (typeof floorBps === 'number' && record.dynamicBps < floorBps) {
      sourceWarnings.push(`Sealed dynamic fee record ${record.thorname} ${record.pair} dynamic_bps ${record.dynamicBps} is below effective floor ${floorBps}.`);
    }
    if (typeof ceilingBps === 'number' && record.dynamicBps > ceilingBps) {
      sourceWarnings.push(`Sealed dynamic fee record ${record.thorname} ${record.pair} dynamic_bps ${record.dynamicBps} is above effective ceiling ${ceilingBps}.`);
    }
  }

  const seenHistoryKeys = new Set<string>();
  for (const thornameHistory of histories) {
    const partner = whitelistedByThorname.get(thornameHistory.thorname);
    if (partner && partner.state !== 'unparseable' && partner.state !== thornameHistory.whitelistState) {
      sourceWarnings.push(`Dynamic fee history ${thornameHistory.thorname} whitelist_state ${thornameHistory.whitelistValue} disagrees with ${partner.key}=${partner.value}.`);
    }

    for (const pairHistory of thornameHistory.pairs) {
      const key = recordKey(pairHistory.thorname, pairHistory.pair);
      if (seenHistoryKeys.has(key)) {
        sourceWarnings.push(`Dynamic fee history included a duplicate pair for ${pairHistory.thorname} ${pairHistory.pair}.`);
      }
      seenHistoryKeys.add(key);

      const record = recordsByKey.get(key);
      if (!record) {
        sourceWarnings.push(`Dynamic fee history pair ${pairHistory.thorname} ${pairHistory.pair} exists without a sealed dynamic_l1_fees record.`);
      } else if (record.dynamicBps !== pairHistory.dynamicBps) {
        sourceWarnings.push(`Dynamic fee history pair ${pairHistory.thorname} ${pairHistory.pair} dynamic_bps ${pairHistory.dynamicBps} disagrees with sealed record ${record.dynamicBps}.`);
      }
    }
  }

  for (const entry of currentEntries) {
    if (entry.epoch !== currentEpoch) {
      sourceWarnings.push(`Current dynamic fee entry ${entry.thorname} ${entry.pair} epoch mismatch: ${entry.epoch} vs current epoch ${currentEpoch}.`);
    }
    if (!recordKeys.has(recordKey(entry.thorname, entry.pair))) {
      sourceWarnings.push(`Current dynamic fee entry ${entry.thorname} ${entry.pair} exists without a sealed dynamic_l1_fees record.`);
    }
  }

  const uniqueWarnings = [...new Set(sourceWarnings)].sort((left, right) => left.localeCompare(right));

  return {
    mimir: mimirStatus,
    records,
    currentEpoch,
    currentEntries,
    histories,
    sourceFreshness,
    sourceWarnings: uniqueWarnings,
    sourceWarningDetails: getDynamicFeeSourceWarningDetails(uniqueWarnings),
    caveats: ['current-only', 'adr-experiment', 'not-historical-fee-proof'],
  };
}

function deriveValidatedNetworkStatusSnapshot(
  mimir: unknown,
  inbound: unknown,
  version: unknown,
  lastBlock: unknown,
  latestBlock: unknown,
  checkedAt: string,
  options: {
    snapshotPinned?: boolean;
    snapshotHeight?: number;
  } = {}
): NetworkStatus {
  if (!isPlainRecord(mimir)) {
    throw new Error('THORNode Mimir response was not a plain object.');
  }

  if (!isThornodeInboundAddresses(inbound)) {
    throw new Error('THORNode inbound_addresses response was not a valid chain list.');
  }
  if (inbound.length === 0) {
    throw new Error('THORNode inbound_addresses response did not include any chain entries.');
  }
  const duplicateInboundChains = getDuplicateInboundChains(inbound);
  if (duplicateInboundChains.length > 0) {
    throw new Error(`THORNode inbound_addresses response included duplicate chain entries: ${duplicateInboundChains.join(', ')}.`);
  }

  const thorchainHeightEvidence = getThorchainHeightEvidence(lastBlock);
  if (thorchainHeightEvidence === null) {
    throw new Error('THORNode lastblock response did not include usable required chain, thorchain, last_observed_in, and last_signed_out fields.');
  }
  const latestBlockInfo = getTendermintLatestBlockInfo(latestBlock);
  if (latestBlockInfo === null) {
    throw new Error('THORNode latest block response did not include a usable height and timestamp.');
  }
  const thorNodeVersion = getThorNodeVersion(version);
  if (!thorNodeVersion) {
    throw new Error('THORNode version response did not include a usable current version.');
  }
  const snapshotHeight = options.snapshotHeight ?? latestBlockInfo.height;
  if (options.snapshotPinned && thorchainHeightEvidence.byChain.size > 0) {
    const mismatchedRows = [...thorchainHeightEvidence.byChain.values()]
      .filter((row) => row.thorchain !== snapshotHeight)
      .map((row) => `${row.chain}:${row.thorchain}`);
    if (mismatchedRows.length > 0) {
      throw new Error(`THORNode lastblock response was not pinned to height ${snapshotHeight}: ${mismatchedRows.join(', ')}.`);
    }
  }
  const futureSignedRows = [...thorchainHeightEvidence.byChain.values()]
    .filter((row) => row.lastSignedOut > row.thorchain)
    .map((row) => `${row.chain}:${row.lastSignedOut}`);
  if (futureSignedRows.length > 0) {
    throw new Error(`THORNode lastblock response included last_signed_out above thorchain height: ${futureSignedRows.join(', ')}.`);
  }

  const checkedAtMs = Date.parse(checkedAt);
  const blockTimeMs = Date.parse(latestBlockInfo.time);
  const blockAgeSeconds = Number.isNaN(checkedAtMs) || Number.isNaN(blockTimeMs)
    ? undefined
    : Math.round((checkedAtMs - blockTimeMs) / 1000);
  const heightDivergence = Math.abs(snapshotHeight - thorchainHeightEvidence.height);
  const sourceWarnings = [
    ...(options.snapshotPinned
      ? []
      : ['THORNode network status snapshot was not pinned to a single block height.']),
    ...(thorchainHeightEvidence.spread > THORNODE_LASTBLOCK_SPREAD_WARNING_BLOCKS
      ? [`THORNode lastblock THORChain heights diverge by ${thorchainHeightEvidence.spread} blocks across chains.`]
      : []),
    ...(blockAgeSeconds !== undefined && blockAgeSeconds < -THORNODE_BLOCK_FUTURE_DEGRADED_SECONDS
      ? [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} in the future; live operation state is stale.`]
      : blockAgeSeconds !== undefined && blockAgeSeconds < -THORNODE_BLOCK_FUTURE_WARNING_SECONDS
        ? [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} in the future; live operation state may be stale.`]
        : []),
    ...(blockAgeSeconds !== undefined && blockAgeSeconds > THORNODE_BLOCK_STALE_DEGRADED_SECONDS
      ? [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} old; live operation state is stale.`]
      : blockAgeSeconds !== undefined && blockAgeSeconds > THORNODE_BLOCK_STALE_WARNING_SECONDS
        ? [`THORNode latest block timestamp is ${formatAgeSeconds(blockAgeSeconds)} old; live operation state may be stale.`]
        : []),
    ...(!options.snapshotPinned && heightDivergence > 0
      ? [`THORNode latest block height differs from lastblock height by ${heightDivergence} blocks.`]
      : []),
  ];

  return deriveNetworkStatus(
    mimir,
    inbound,
    thorNodeVersion,
    snapshotHeight,
    {
      sourceWarnings,
      lastBlockByChain: thorchainHeightEvidence.byChain,
      thorchainSnapshotPinned: options.snapshotPinned ?? false,
      thorchainLastblockMinHeight: thorchainHeightEvidence.minHeight,
      thorchainLastblockMaxHeight: thorchainHeightEvidence.maxHeight,
      thorchainLastblockSpread: thorchainHeightEvidence.spread,
      thorchainBlockTime: latestBlockInfo.time,
      thorchainBlockAgeSeconds: blockAgeSeconds,
    }
  );
}

function getCanonicalMimirKey(mimir: Record<string, unknown>, key: string): string | undefined {
  if (Object.prototype.hasOwnProperty.call(mimir, key)) {
    return key;
  }

  const normalizedKey = key.toUpperCase();
  return Object.keys(mimir).find((candidate) => candidate.toUpperCase() === normalizedKey);
}

function getInvalidExactMimirKey(mimir: Record<string, unknown>, key: string): string | null {
  const canonicalKey = getCanonicalMimirKey(mimir, key);
  if (!canonicalKey) {
    return null;
  }

  return toMimirNumber(mimir[canonicalKey]) === null ? canonicalKey : null;
}

function getMimirNumericState(mimir: Record<string, unknown>, key: string): MimirNumericState {
  const canonicalKey = getCanonicalMimirKey(mimir, key);
  if (!canonicalKey) {
    return { state: 'absent' };
  }

  const value = toMimirNumber(mimir[canonicalKey]);
  return value === null
    ? { state: 'unparseable', key: canonicalKey }
    : { state: 'valid', key: canonicalKey, value };
}

function getInvalidScopedMimirKey(mimir: Record<string, unknown>, key: string): string | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'unparseable' ? value.key : null;
}

function getMimirActivity(
  mimir: Record<string, unknown>,
  key: string,
  mode: MimirActivationMode,
  thorchainHeight?: number
): MimirActivityState {
  const value = getMimirNumericState(mimir, key);
  if (value.state !== 'valid') {
    return value;
  }
  if (value.value <= 0) {
    return { state: 'inactive', key: value.key, value: value.value };
  }
  if (thorchainHeight === undefined) {
    return { state: 'active', key: value.key, value: value.value };
  }

  switch (mode) {
    case 'positive':
      return { state: 'active', key: value.key, value: value.value };
    case 'at-or-after-height':
      return thorchainHeight >= value.value
        ? { state: 'active', key: value.key, value: value.value }
        : { state: 'scheduled', key: value.key, value: value.value };
    case 'after-height':
      return thorchainHeight > value.value
        ? { state: 'active', key: value.key, value: value.value }
        : { state: 'scheduled', key: value.key, value: value.value };
    case 'until-height':
      return thorchainHeight <= value.value
        ? { state: 'active', key: value.key, value: value.value }
        : { state: 'expired', key: value.key, value: value.value };
  }
}

function getInvalidMimirKeysByPrefix(mimir: Record<string, unknown>, prefix: string): string[] {
  const normalizedPrefix = prefix.toUpperCase();
  return Object.entries(mimir)
    .filter(([key, value]) => key.toUpperCase().startsWith(normalizedPrefix) && toMimirNumber(value) === null)
    .map(([key]) => key)
    .sort();
}

function getChainCodeFromScopedMimirKey(key: string): string | null {
  const upperKey = key.toUpperCase();
  const haltMatch = upperKey.match(/^HALT([A-Z0-9]+)(TRADING|CHAIN)$/);
  const observedSigningMatch = upperKey.match(/^HALT([A-Z0-9]+)SIGNING$/);
  const signingMatch = upperKey.match(/^HALTSIGNING([A-Z0-9]+)$/);
  const solvencyHaltMatch = upperKey.match(/^SOLVENCYHALT([A-Z0-9]+)CHAIN$/);
  const lpMatch = upperKey.match(/^PAUSELP([A-Z0-9]+)$/);
  const chainCode = haltMatch?.[1]
    ?? observedSigningMatch?.[1]
    ?? signingMatch?.[1]
    ?? solvencyHaltMatch?.[1]
    ?? lpMatch?.[1]
    ?? null;
  return chainCode && !NON_CHAIN_SCOPED_MIMIR_CODES.has(chainCode) ? chainCode : null;
}

function getChainCodeFromDashScopedMimirKey(key: string, prefix: string): string | null {
  const upperKey = key.toUpperCase();
  const upperPrefix = prefix.toUpperCase();
  if (!upperKey.startsWith(upperPrefix)) {
    return null;
  }

  const chainCode = upperKey.slice(upperPrefix.length).split('-')[0] ?? null;
  return chainCode && !NON_CHAIN_SCOPED_MIMIR_CODES.has(chainCode) ? chainCode : null;
}

function isKnownMonitoredMimirKey(key: string) {
  const upperKey = key.toUpperCase();
  return EXACT_MONITORED_MIMIR_KEYS.some((monitoredKey) => monitoredKey.toUpperCase() === upperKey) ||
    PREFIX_MONITORED_MIMIR_KEYS.some((prefix) => upperKey.startsWith(prefix.toUpperCase())) ||
    getChainCodeFromScopedMimirKey(key) !== null;
}

function getUnknownOperationMimirKeys(mimir: Record<string, unknown>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => {
      const upperKey = key.toUpperCase();
      if (REVIEWED_NON_PAUSING_OPERATIONAL_MIMIR_PREFIXES.some((prefix) => upperKey.startsWith(prefix))) {
        return false;
      }
      if (KNOWN_NON_OPERATIONAL_PAUSE_KEYS.has(upperKey) || isKnownMonitoredMimirKey(key)) {
        return false;
      }
      if (REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES.some((prefix) => upperKey.startsWith(prefix))) {
        return false;
      }

      const numericValue = toMimirNumber(value);
      if (UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES.some((prefix) => upperKey.startsWith(prefix))) {
        return numericValue === null || numericValue > 0;
      }
      if (/^(HALT|PAUSE)/.test(upperKey)) {
        return numericValue === null || numericValue > 0;
      }
      if (upperKey.includes('DISABLED')) {
        return numericValue === null || numericValue > 0;
      }
      if (upperKey.includes('ENABLED')) {
        return numericValue === null || numericValue <= 0;
      }
      return false;
    })
    .map(([key]) => key)
    .sort();
}

function getReviewedOperationalSupportMimirKeys(mimir: Record<string, unknown>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => {
      const upperKey = key.toUpperCase();
      const numericValue = toMimirNumber(value);
      return REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES.some((prefix) => upperKey.startsWith(prefix)) &&
        (numericValue === null || numericValue > 0);
    })
    .map(([key]) => key)
    .sort();
}

function getInvalidChainScopedMimirKeys(mimir: Record<string, unknown>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => toMimirNumber(value) === null && getChainCodeFromScopedMimirKey(key) !== null)
    .map(([key]) => key)
    .sort();
}

function collectInvalidMimirKeys(mimir: Record<string, unknown>, recognizedChainCodes: Set<string>): string[] {
  return uniqueKeys(
    EXACT_MONITORED_MIMIR_KEYS
      .map((key) => getInvalidExactMimirKey(mimir, key))
      .filter((key): key is string => key !== null),
    PREFIX_MONITORED_MIMIR_KEYS.flatMap((prefix) => getInvalidMimirKeysByPrefix(mimir, prefix)),
    getInvalidChainScopedMimirKeys(mimir).filter((key) => {
      const chainCode = getChainCodeFromScopedMimirKey(key);
      return chainCode !== null && recognizedChainCodes.has(chainCode);
    })
  ).sort((a, b) => a.localeCompare(b));
}

function getActiveMimirKeyByMode(
  mimir: Record<string, unknown>,
  key: string,
  mode: MimirActivationMode,
  thorchainHeight?: number
): string | null {
  const value = getMimirActivity(mimir, key, mode, thorchainHeight);
  return value.state === 'active' ? value.key : null;
}

function getScheduledMimirKeyByMode(
  mimir: Record<string, unknown>,
  key: string,
  mode: MimirActivationMode,
  thorchainHeight?: number
): string | null {
  const value = getMimirActivity(mimir, key, mode, thorchainHeight);
  return value.state === 'scheduled' ? value.key : null;
}

function getActiveMimirKeysByPrefix(
  mimir: Record<string, unknown>,
  prefix: string,
  mode: MimirActivationMode = 'positive',
  thorchainHeight?: number
): string[] {
  const normalizedPrefix = prefix.toUpperCase();
  return Object.entries(mimir)
    .filter(([key]) => (
      key.toUpperCase().startsWith(normalizedPrefix) &&
      getMimirActivity(mimir, key, mode, thorchainHeight).state === 'active'
    ))
    .map(([key]) => key)
    .sort();
}

function getScheduledMimirKeysByPrefix(
  mimir: Record<string, unknown>,
  prefix: string,
  mode: MimirActivationMode,
  thorchainHeight?: number
): string[] {
  const normalizedPrefix = prefix.toUpperCase();
  return Object.entries(mimir)
    .filter(([key]) => (
      key.toUpperCase().startsWith(normalizedPrefix) &&
      getMimirActivity(mimir, key, mode, thorchainHeight).state === 'scheduled'
    ))
    .map(([key]) => key)
    .sort();
}

function uniqueKeys(...keyGroups: string[][]): string[] {
  const keys = new Set<string>();
  for (const group of keyGroups) {
    for (const key of group) {
      keys.add(key);
    }
  }
  return [...keys];
}

function getOptionalMimirActive(
  mimir: Record<string, unknown>,
  key: string,
  mode: MimirActivationMode = 'positive',
  thorchainHeight?: number
): boolean | null {
  const value = getMimirActivity(mimir, key, mode, thorchainHeight);
  return value.state === 'active'
    ? true
    : value.state === 'inactive' || value.state === 'scheduled' || value.state === 'expired'
      ? false
      : null;
}

function isMimirActive(
  mimir: Record<string, unknown>,
  key: string,
  mode: MimirActivationMode = 'positive',
  thorchainHeight?: number
): boolean {
  return getMimirActivity(mimir, key, mode, thorchainHeight).state === 'active';
}

function isMimirEnabled(mimir: Record<string, unknown>, key: string): boolean | null {
  const value = getMimirNumericState(mimir, key);
  return value.state === 'valid' ? value.value > 0 : null;
}

function pauseControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string,
  mode: MimirActivationMode = 'positive',
  thorchainHeight?: number
): OperationalControlStatus {
  const value = getMimirActivity(mimir, key, mode, thorchainHeight);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  const active = value.state === 'active';
  return {
    key,
    label,
    state: active ? 'active' : value.state === 'scheduled' ? 'scheduled' : 'inactive',
    active,
    description: value.state === 'scheduled'
      ? `${description} Scheduled for THORChain height ${value.value}.`
      : value.state === 'expired'
        ? `${description} Expired at THORChain height ${value.value}.`
        : description,
  };
}

function optionalPauseControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string,
  mode: MimirActivationMode = 'positive',
  thorchainHeight?: number
): OperationalControlStatus {
  const value = getMimirActivity(mimir, key, mode, thorchainHeight);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  if (value.state === 'absent') {
    return {
      key,
      label,
      state: 'not-monitored',
      active: false,
      description,
    };
  }

  return {
    key,
    label,
    state: value.state === 'active' ? 'active' : value.state === 'scheduled' ? 'scheduled' : 'inactive',
    active: value.state === 'active',
    description: value.state === 'scheduled'
      ? `${description} Scheduled for THORChain height ${value.value}.`
      : value.state === 'expired'
        ? `${description} Expired at THORChain height ${value.value}.`
        : description,
  };
}

function enablementControl(
  mimir: Record<string, unknown>,
  key: string,
  label: string,
  description: string
): OperationalControlStatus {
  const value = getMimirNumericState(mimir, key);
  if (value.state === 'unparseable') {
    return {
      key,
      label,
      state: 'unparseable',
      active: false,
      description,
    };
  }
  if (value.state === 'absent') {
    return {
      key,
      label,
      state: 'not-monitored',
      active: false,
      description,
    };
  }

  return {
    key,
    label,
    state: value.value > 0 ? 'inactive' : 'disabled',
    active: value.value <= 0,
    description,
  };
}

function aggregatePauseControl(
  key: string,
  label: string,
  activeKeys: string[],
  invalidKeys: string[],
  inactiveDescription: string,
  activeDescription: string,
  scheduledKeys: string[] = []
): OperationalControlStatus {
  const active = activeKeys.length > 0;
  const unparseable = !active && invalidKeys.length > 0;
  const scheduled = !active && !unparseable && scheduledKeys.length > 0;
  return {
    key,
    label,
    state: active ? 'active' : unparseable ? 'unparseable' : scheduled ? 'scheduled' : 'inactive',
    active,
    description: active
      ? `${activeDescription} (${activeKeys.length} active key${activeKeys.length === 1 ? '' : 's'}).`
      : unparseable
        ? `${invalidKeys.length} scoped key${invalidKeys.length === 1 ? '' : 's'} could not be parsed.`
        : scheduled
          ? `${scheduledKeys.length} scoped key${scheduledKeys.length === 1 ? '' : 's'} scheduled for a future THORChain height.`
          : inactiveDescription,
  };
}

function getInvalidMimirKeysForChain(
  mimir: Record<string, unknown>,
  chainCode: string,
  invalidPoolDepositPauseKeys: string[],
  invalidSecuredAssetDepositPauseKeys: string[],
  invalidSecuredAssetWithdrawPauseKeys: string[],
  invalidAsymWithdrawalPauseKeys: string[]
): string[] {
  const directScopedKeys = [
    `HALT${chainCode}CHAIN`,
    `SOLVENCYHALT${chainCode}CHAIN`,
    `HALT${chainCode}TRADING`,
    `PAUSELP${chainCode}`,
    `HALTSIGNING${chainCode}`,
    `HALT${chainCode}SIGNING`,
  ]
    .map((key) => getInvalidScopedMimirKey(mimir, key))
    .filter((key): key is string => key !== null);
  const poolScopedKeys = invalidPoolDepositPauseKeys.filter((key) => (
    key.toUpperCase().startsWith(`PAUSELPDEPOSIT-${chainCode}-`)
  ));
  const securedAssetDepositScopedKeys = invalidSecuredAssetDepositPauseKeys.filter((key) => (
    getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredDeposit-') === chainCode
  ));
  const securedAssetWithdrawScopedKeys = invalidSecuredAssetWithdrawPauseKeys.filter((key) => (
    getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredWithdraw-') === chainCode
  ));
  const asymWithdrawalScopedKeys = invalidAsymWithdrawalPauseKeys.filter((key) => (
    getChainCodeFromDashScopedMimirKey(key, 'PauseAsymWithdrawal-') === chainCode
  ));

  return uniqueKeys(
    directScopedKeys,
    poolScopedKeys,
    securedAssetDepositScopedKeys,
    securedAssetWithdrawScopedKeys,
    asymWithdrawalScopedKeys
  ).sort((a, b) => a.localeCompare(b));
}

function extractChainCodesFromMimir(
  mimir: Record<string, unknown>,
  scopedDashKeys: string[],
  recognizedChainCodes: Set<string>
): string[] {
  const chainCodes = new Set<string>();

  for (const [key, value] of Object.entries(mimir)) {
    const numericValue = toMimirNumber(value);
    if (numericValue !== null && numericValue <= 0) {
      continue;
    }
    const chainCode = getChainCodeFromScopedMimirKey(key);
    if (chainCode && recognizedChainCodes.has(chainCode)) {
      chainCodes.add(chainCode);
    }
  }

  for (const key of scopedDashKeys) {
    const [, chainCode] = key.toUpperCase().split('-');
    if (chainCode && recognizedChainCodes.has(chainCode)) {
      chainCodes.add(chainCode);
    }
  }

  return [...chainCodes].sort();
}

function getUnknownChainScopedMimirKeys(mimir: Record<string, unknown>, recognizedChainCodes: Set<string>): string[] {
  return Object.entries(mimir)
    .filter(([key, value]) => {
      const numericValue = toMimirNumber(value);
      if (numericValue !== null && numericValue <= 0) {
        return false;
      }

      const chainCode = getChainCodeFromScopedMimirKey(key);
      return chainCode !== null && !recognizedChainCodes.has(chainCode);
    })
    .map(([key]) => key)
    .sort();
}

export function deriveNetworkStatus(
  mimir: Record<string, unknown>,
  inboundAddresses: ThornodeInboundAddress[],
  thorNodeVersion?: string,
  thorchainHeight?: number,
  options: {
    sourceWarnings?: string[];
    lastBlockByChain?: Map<string, LastBlockChainEvidence>;
    thorchainSnapshotPinned?: boolean;
    thorchainLastblockMinHeight?: number;
    thorchainLastblockMaxHeight?: number;
    thorchainLastblockSpread?: number;
    thorchainBlockTime?: string;
    thorchainBlockAgeSeconds?: number;
  } = {}
): NetworkStatus {
  const tradingPausedKey = getActiveMimirKeyByMode(mimir, 'HALTTRADING', 'at-or-after-height', thorchainHeight);
  const signingPausedKey = getActiveMimirKeyByMode(mimir, 'HALTSIGNING', 'at-or-after-height', thorchainHeight);
  const lpPausedKey = getActiveMimirKeyByMode(mimir, 'PAUSELP', 'at-or-after-height', thorchainHeight);
  const observedChainsPausedKey = getActiveMimirKeyByMode(mimir, 'HALTCHAINGLOBAL', 'at-or-after-height', thorchainHeight);
  const tradingPaused = Boolean(tradingPausedKey);
  const signingPaused = Boolean(signingPausedKey);
  const lpPaused = Boolean(lpPausedKey);
  const loansPaused = isMimirActive(mimir, 'PAUSELOANS');
  const observedChainsPaused = Boolean(observedChainsPausedKey);
  const streamingSwapsPaused = getOptionalMimirActive(mimir, 'StreamingSwapPause');
  const memolessTransactionsHalted = getOptionalMimirActive(mimir, 'HaltMemoless');
  const nodePauseChainGlobal = getOptionalMimirActive(mimir, 'NODEPAUSECHAINGLOBAL', 'until-height', thorchainHeight);
  const bondPaused = getOptionalMimirActive(mimir, 'PauseBond');
  const unbondPaused = getOptionalMimirActive(mimir, 'PauseUnbond');
  const rebondHalted = getOptionalMimirActive(mimir, 'HaltRebond');
  const operatorRotateHalted = getOptionalMimirActive(mimir, 'HaltOperatorRotate');
  const oracleHalted = getOptionalMimirActive(mimir, 'HaltOracle');
  const securedAssetsPaused = getOptionalMimirActive(mimir, 'HALTSECUREDGLOBAL', 'at-or-after-height', thorchainHeight);
  const tcyClaimingPaused = getOptionalMimirActive(mimir, 'TCYCLAIMINGHALT');
  const tcyClaimingSwapPaused = getOptionalMimirActive(mimir, 'TCYCLAIMINGSWAPHALT');
  const tcyStakingPaused = getOptionalMimirActive(mimir, 'TCYSTAKINGHALT');
  const tcyStakeDistributionPaused = getOptionalMimirActive(mimir, 'TCYSTAKEDISTRIBUTIONHALT');
  const tcyUnstakingPaused = getOptionalMimirActive(mimir, 'TCYUNSTAKINGHALT');
  const tcyTradingPaused = getOptionalMimirActive(mimir, 'HALTTCYTRADING', 'at-or-after-height', thorchainHeight);
  const wasmPaused = getOptionalMimirActive(mimir, 'HALTWASMGLOBAL', 'after-height', thorchainHeight);
  const tradeAccountsEnabled = isMimirEnabled(mimir, 'TRADEACCOUNTSENABLED');
  const tradeAccountDepositsEnabled = isMimirEnabled(mimir, 'TRADEACCOUNTSDEPOSITENABLED');
  const manualSwapsToSynthDisabled = getOptionalMimirActive(mimir, 'MANUALSWAPSTOSYNTHDISABLED');
  const runePoolEnabled = isMimirEnabled(mimir, 'RUNEPOOLENABLED');
  const bankSendEnabled = isMimirEnabled(mimir, 'BANKSENDENABLED');
  const runePoolDepositPaused = getOptionalMimirActive(mimir, 'RUNEPoolHaltDeposit', 'at-or-after-height', thorchainHeight);
  const runePoolWithdrawPaused = getOptionalMimirActive(mimir, 'RUNEPoolHaltWithdraw', 'at-or-after-height', thorchainHeight);
  const poolDepositPauseKeys = getActiveMimirKeysByPrefix(mimir, 'PAUSELPDEPOSIT-');
  const asymWithdrawalPauseKeys = getActiveMimirKeysByPrefix(mimir, 'PauseAsymWithdrawal-');
  const securedAssetDepositPauseKeys = getActiveMimirKeysByPrefix(mimir, 'HaltSecuredDeposit-', 'at-or-after-height', thorchainHeight);
  const securedAssetWithdrawPauseKeys = getActiveMimirKeysByPrefix(mimir, 'HaltSecuredWithdraw-', 'at-or-after-height', thorchainHeight);
  const wasmDeployerHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmDeployer-', 'after-height', thorchainHeight);
  const wasmCodeHashHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmCs-', 'after-height', thorchainHeight);
  const wasmContractHaltKeys = getActiveMimirKeysByPrefix(mimir, 'HaltWasmContract-', 'after-height', thorchainHeight);
  const scheduledExactMimirKeys = [
    getScheduledMimirKeyByMode(mimir, 'HALTTRADING', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTSIGNING', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'PAUSELP', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTCHAINGLOBAL', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTCHURNING', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTSECUREDGLOBAL', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTTCYTRADING', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'HALTWASMGLOBAL', 'after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'RUNEPoolHaltDeposit', 'at-or-after-height', thorchainHeight),
    getScheduledMimirKeyByMode(mimir, 'RUNEPoolHaltWithdraw', 'at-or-after-height', thorchainHeight),
  ].filter((key): key is string => key !== null);
  const scheduledSecuredAssetDepositPauseKeys = getScheduledMimirKeysByPrefix(mimir, 'HaltSecuredDeposit-', 'at-or-after-height', thorchainHeight);
  const scheduledSecuredAssetWithdrawPauseKeys = getScheduledMimirKeysByPrefix(mimir, 'HaltSecuredWithdraw-', 'at-or-after-height', thorchainHeight);
  const scheduledWasmDeployerHaltKeys = getScheduledMimirKeysByPrefix(mimir, 'HaltWasmDeployer-', 'after-height', thorchainHeight);
  const scheduledWasmCodeHashHaltKeys = getScheduledMimirKeysByPrefix(mimir, 'HaltWasmCs-', 'after-height', thorchainHeight);
  const scheduledWasmContractHaltKeys = getScheduledMimirKeysByPrefix(mimir, 'HaltWasmContract-', 'after-height', thorchainHeight);
  const invalidPoolDepositPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'PAUSELPDEPOSIT-');
  const invalidAsymWithdrawalPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'PauseAsymWithdrawal-');
  const invalidSecuredAssetDepositPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltSecuredDeposit-');
  const invalidSecuredAssetWithdrawPauseKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltSecuredWithdraw-');
  const invalidWasmDeployerHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmDeployer-');
  const invalidWasmCodeHashHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmCs-');
  const invalidWasmContractHaltKeys = getInvalidMimirKeysByPrefix(mimir, 'HaltWasmContract-');
  const scopedWasmHaltKeys = uniqueKeys(wasmDeployerHaltKeys, wasmCodeHashHaltKeys, wasmContractHaltKeys);
  const scheduledScopedWasmHaltKeys = uniqueKeys(scheduledWasmDeployerHaltKeys, scheduledWasmCodeHashHaltKeys, scheduledWasmContractHaltKeys);
  const nodePauseChainGlobalKey = getActiveMimirKeyByMode(mimir, 'NODEPAUSECHAINGLOBAL', 'until-height', thorchainHeight);
  const nodePauseChainGlobalKeys = nodePauseChainGlobalKey ? [nodePauseChainGlobalKey] : [];
  const inboundByChain = new Map(inboundAddresses.map((chain) => [chain.chain.trim().toUpperCase(), chain]));
  const inboundChainCodes = inboundAddresses.map((chain) => chain.chain.trim().toUpperCase());
  const recognizedChainCodes = new Set([...CURATED_CHAIN_CODES, ...inboundChainCodes]);
  const unknownChainScopedMimirKeys = getUnknownChainScopedMimirKeys(mimir, recognizedChainCodes);
  const unknownOperationMimirKeys = getUnknownOperationMimirKeys(mimir);
  const reviewedOperationalSupportMimirKeys = getReviewedOperationalSupportMimirKeys(mimir);
  const scheduledMimirKeys = uniqueKeys(
    scheduledExactMimirKeys,
    scheduledSecuredAssetDepositPauseKeys,
    scheduledSecuredAssetWithdrawPauseKeys,
    scheduledScopedWasmHaltKeys
  ).sort((a, b) => a.localeCompare(b));
  const mimirOnlyChainCodes = extractChainCodesFromMimir(
    mimir,
    [
      ...poolDepositPauseKeys,
      ...invalidPoolDepositPauseKeys,
      ...asymWithdrawalPauseKeys,
      ...invalidAsymWithdrawalPauseKeys,
      ...securedAssetDepositPauseKeys,
      ...invalidSecuredAssetDepositPauseKeys,
      ...securedAssetWithdrawPauseKeys,
      ...invalidSecuredAssetWithdrawPauseKeys,
      ...scheduledSecuredAssetDepositPauseKeys,
      ...scheduledSecuredAssetWithdrawPauseKeys,
    ],
    recognizedChainCodes
  )
    .filter((chainCode) => !inboundByChain.has(chainCode));
  const chainCodes = [...inboundChainCodes, ...mimirOnlyChainCodes];

  const chainStatuses: ChainOperationalStatus[] = chainCodes.map((chainCode) => {
    const chain = inboundByChain.get(chainCode);
    const lastBlockEvidence = options.lastBlockByChain?.get(chainCode);
    const inboundAddressEvidenceFields = chain
      ? INBOUND_OPERATION_FIELDS.filter((field) => chain[field] === true)
      : [];
    const inheritedMimirKeys = uniqueKeys(
      [
        tradingPausedKey,
        signingPausedKey,
        lpPausedKey,
        observedChainsPausedKey,
        nodePauseChainGlobalKey,
      ].filter((key): key is string => key !== null)
    );
    const chainHaltKey = getActiveMimirKeyByMode(mimir, `HALT${chainCode}CHAIN`, 'at-or-after-height', thorchainHeight);
    const chainSolvencyHaltKey = getActiveMimirKeyByMode(mimir, `SOLVENCYHALT${chainCode}CHAIN`, 'at-or-after-height', thorchainHeight);
    const chainTradingKey = getActiveMimirKeyByMode(mimir, `HALT${chainCode}TRADING`, 'at-or-after-height', thorchainHeight);
    const chainLpKey = getActiveMimirKeyByMode(mimir, `PAUSELP${chainCode}`, 'at-or-after-height', thorchainHeight);
    const chainPrefixSigningKey = getActiveMimirKeyByMode(mimir, `HALTSIGNING${chainCode}`, 'at-or-after-height', thorchainHeight);
    const chainSuffixSigningKey = getActiveMimirKeyByMode(mimir, `HALT${chainCode}SIGNING`, 'at-or-after-height', thorchainHeight);
    const scheduledChainMimirKeys = [
      getScheduledMimirKeyByMode(mimir, `HALT${chainCode}CHAIN`, 'at-or-after-height', thorchainHeight),
      getScheduledMimirKeyByMode(mimir, `SOLVENCYHALT${chainCode}CHAIN`, 'at-or-after-height', thorchainHeight),
      getScheduledMimirKeyByMode(mimir, `HALT${chainCode}TRADING`, 'at-or-after-height', thorchainHeight),
      getScheduledMimirKeyByMode(mimir, `PAUSELP${chainCode}`, 'at-or-after-height', thorchainHeight),
      getScheduledMimirKeyByMode(mimir, `HALTSIGNING${chainCode}`, 'at-or-after-height', thorchainHeight),
      getScheduledMimirKeyByMode(mimir, `HALT${chainCode}SIGNING`, 'at-or-after-height', thorchainHeight),
    ].filter((key): key is string => key !== null);
    const lpDepositPauseKeys = poolDepositPauseKeys.filter((key) => key.toUpperCase().startsWith(`PAUSELPDEPOSIT-${chainCode}-`));
    const securedAssetDepositChainKeys = securedAssetDepositPauseKeys.filter((key) => (
      getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredDeposit-') === chainCode
    ));
    const securedAssetWithdrawChainKeys = securedAssetWithdrawPauseKeys.filter((key) => (
      getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredWithdraw-') === chainCode
    ));
    const asymWithdrawalChainKeys = asymWithdrawalPauseKeys.filter((key) => (
      getChainCodeFromDashScopedMimirKey(key, 'PauseAsymWithdrawal-') === chainCode
    ));
    const scheduledSecuredAssetDepositChainKeys = scheduledSecuredAssetDepositPauseKeys.filter((key) => (
      getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredDeposit-') === chainCode
    ));
    const scheduledSecuredAssetWithdrawChainKeys = scheduledSecuredAssetWithdrawPauseKeys.filter((key) => (
      getChainCodeFromDashScopedMimirKey(key, 'HaltSecuredWithdraw-') === chainCode
    ));
    const chainScheduledMimirKeys = uniqueKeys(
      scheduledChainMimirKeys,
      scheduledSecuredAssetDepositChainKeys,
      scheduledSecuredAssetWithdrawChainKeys
    ).sort((a, b) => a.localeCompare(b));
    const unparseableMimirKeys = getInvalidMimirKeysForChain(
      mimir,
      chainCode,
      invalidPoolDepositPauseKeys,
      invalidSecuredAssetDepositPauseKeys,
      invalidSecuredAssetWithdrawPauseKeys,
      invalidAsymWithdrawalPauseKeys
    );
    const missingInboundFields = missingInboundOperationFields(chain);
    const chainSourceWarnings = [
      ...(missingInboundFields.length > 0
        ? [`${chain?.chain ?? chainCode} inbound_addresses omitted ${missingInboundFields.join(', ')}; live chain operation state is partial.`]
        : []),
      ...(chain && options.lastBlockByChain && !lastBlockEvidence
        ? [`${chain.chain} lastblock evidence omitted this chain; live observation/signing state is partial.`]
        : []),
    ];
    const activeMimirKeys = [
      chainHaltKey,
      chainSolvencyHaltKey,
      chainTradingKey,
      chainLpKey,
      chainPrefixSigningKey,
      chainSuffixSigningKey,
    ].filter((key): key is string => key !== null);

    const chainStatus: ChainOperationalStatus = {
      chain: chain?.chain ?? chainCode,
      halted: Boolean(chain?.halted || observedChainsPaused || nodePauseChainGlobal || chainHaltKey || chainSolvencyHaltKey),
      tradingPaused: Boolean(tradingPaused || chain?.global_trading_paused || chain?.chain_trading_paused || chainTradingKey),
      lpActionsPaused: Boolean(lpPaused || chain?.chain_lp_actions_paused || chainLpKey),
      lpDepositPaused: lpDepositPauseKeys.length > 0,
      signingPaused: signingPaused || Boolean(chainPrefixSigningKey || chainSuffixSigningKey),
      activeMimirKeys,
      lpDepositPauseKeys,
      ...(inboundAddressEvidenceFields.length > 0 ? { inboundAddressEvidenceFields } : {}),
      ...(inheritedMimirKeys.length > 0 ? { inheritedMimirKeys } : {}),
      ...(lastBlockEvidence
        ? {
            lastObservedIn: lastBlockEvidence.lastObservedIn,
            lastSignedOut: lastBlockEvidence.lastSignedOut,
            lastThorchainHeight: lastBlockEvidence.thorchain,
          }
        : {}),
      ...(chainSourceWarnings.length > 0 ? { sourceWarnings: chainSourceWarnings } : {}),
      ...(securedAssetDepositChainKeys.length > 0
        ? { securedAssetDepositPaused: true, securedAssetDepositPauseKeys: securedAssetDepositChainKeys }
        : {}),
      ...(securedAssetWithdrawChainKeys.length > 0
        ? { securedAssetWithdrawPaused: true, securedAssetWithdrawPauseKeys: securedAssetWithdrawChainKeys }
        : {}),
      ...(asymWithdrawalChainKeys.length > 0
        ? { asymWithdrawalPaused: true, asymWithdrawalPauseKeys: asymWithdrawalChainKeys }
        : {}),
      ...(chainScheduledMimirKeys.length > 0 ? { scheduledMimirKeys: chainScheduledMimirKeys } : {}),
    };

    return unparseableMimirKeys.length > 0
      ? { ...chainStatus, unparseableMimirKeys }
      : chainStatus;
  });

  const monitoredControls: OperationalControlStatus[] = [
    pauseControl(mimir, 'HALTTRADING', 'Trading', 'Swaps and trading actions are paused when active.', 'at-or-after-height', thorchainHeight),
    optionalPauseControl(mimir, 'StreamingSwapPause', 'Streaming swaps', 'Streaming swaps are paused when active.'),
    optionalPauseControl(mimir, 'HaltMemoless', 'Memoless transactions', 'Memoless transaction handling is halted when active.'),
    pauseControl(mimir, 'HALTSIGNING', 'Signing', 'Outbound signing is paused when active.', 'at-or-after-height', thorchainHeight),
    pauseControl(mimir, 'PAUSELP', 'LP actions', 'Liquidity-provider actions are paused when active.', 'at-or-after-height', thorchainHeight),
    aggregatePauseControl(
      'PAUSELPDEPOSIT-*',
      'Pool deposits',
      poolDepositPauseKeys,
      invalidPoolDepositPauseKeys,
      'No active pool-specific deposit pause keys were observed.',
      'Pool-specific liquidity deposits are paused for one or more assets'
    ),
    aggregatePauseControl(
      'PauseAsymWithdrawal-*',
      'Asym LP withdrawals',
      asymWithdrawalPauseKeys,
      invalidAsymWithdrawalPauseKeys,
      'No active chain-specific asymmetric withdrawal pause keys were observed.',
      'Asymmetric liquidity withdrawals are paused for one or more chains'
    ),
    optionalPauseControl(mimir, 'RUNEPoolHaltDeposit', 'RUNEPool deposits', 'RUNEPool deposits are halted when active.', 'at-or-after-height', thorchainHeight),
    optionalPauseControl(mimir, 'RUNEPoolHaltWithdraw', 'RUNEPool withdrawals', 'RUNEPool withdrawals are halted when active.', 'at-or-after-height', thorchainHeight),
    pauseControl(mimir, 'PAUSELOANS', 'Loans', 'Legacy loan actions are paused when active.'),
    pauseControl(mimir, 'HALTCHAINGLOBAL', 'Chain observation', 'Global chain observation is halted when active.', 'at-or-after-height', thorchainHeight),
    optionalPauseControl(mimir, 'NODEPAUSECHAINGLOBAL', 'Node chain pause', 'Node-requested chain pausing is active until this height when the Mimir key is active.', 'until-height', thorchainHeight),
    pauseControl(mimir, 'HALTCHURNING', 'Churning', 'Validator/vault rotation is halted when active.', 'at-or-after-height', thorchainHeight),
    optionalPauseControl(mimir, 'PauseBond', 'Bonding', 'Node bond actions are paused when active.'),
    optionalPauseControl(mimir, 'PauseUnbond', 'Unbonding', 'Node unbond actions are paused when active.'),
    optionalPauseControl(mimir, 'HaltRebond', 'Rebonding', 'Node rebond actions are halted when active.'),
    optionalPauseControl(mimir, 'HaltOperatorRotate', 'Operator rotation', 'Node operator rotation is halted when active.'),
    optionalPauseControl(mimir, 'HaltOracle', 'Oracle', 'Oracle operations are halted when active.'),
    optionalPauseControl(mimir, 'HALTSECUREDGLOBAL', 'Secured assets', 'Secured-asset operations are halted when active.', 'at-or-after-height', thorchainHeight),
    aggregatePauseControl(
      'HaltSecuredDeposit-*',
      'Secured deposits',
      securedAssetDepositPauseKeys,
      invalidSecuredAssetDepositPauseKeys,
      'No active secured-asset deposit pause keys were observed.',
      'Secured-asset deposits are paused for one or more chains',
      scheduledSecuredAssetDepositPauseKeys
    ),
    aggregatePauseControl(
      'HaltSecuredWithdraw-*',
      'Secured withdrawals',
      securedAssetWithdrawPauseKeys,
      invalidSecuredAssetWithdrawPauseKeys,
      'No active secured-asset withdrawal pause keys were observed.',
      'Secured-asset withdrawals are paused for one or more chains',
      scheduledSecuredAssetWithdrawPauseKeys
    ),
    optionalPauseControl(mimir, 'TCYCLAIMINGHALT', 'TCY claiming', 'TCY claim actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYCLAIMINGSWAPHALT', 'TCY claim swaps', 'TCY claim swap actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKINGHALT', 'TCY staking', 'TCY staking actions are halted when active.'),
    optionalPauseControl(mimir, 'TCYSTAKEDISTRIBUTIONHALT', 'TCY distributions', 'TCY stake distribution is halted when active.'),
    optionalPauseControl(mimir, 'TCYUNSTAKINGHALT', 'TCY unstaking', 'TCY unstaking actions are halted when active.'),
    optionalPauseControl(mimir, 'HALTTCYTRADING', 'TCY trading', 'TCY trading is halted when active.', 'at-or-after-height', thorchainHeight),
    optionalPauseControl(mimir, 'HALTWASMGLOBAL', 'WASM/app layer', 'WASM/app-layer actions are halted when active.', 'after-height', thorchainHeight),
    aggregatePauseControl(
      'HaltWasmDeployer-*',
      'WASM deployers',
      wasmDeployerHaltKeys,
      invalidWasmDeployerHaltKeys,
      'No active WASM deployer halt keys were observed.',
      'WASM deployments are halted for one or more scoped deployers',
      scheduledWasmDeployerHaltKeys
    ),
    aggregatePauseControl(
      'HaltWasmCs-*',
      'WASM code checksums',
      wasmCodeHashHaltKeys,
      invalidWasmCodeHashHaltKeys,
      'No active WASM code-checksum halt keys were observed.',
      'WASM code checksum execution is halted for one or more scoped checksums',
      scheduledWasmCodeHashHaltKeys
    ),
    aggregatePauseControl(
      'HaltWasmContract-*',
      'WASM contracts',
      wasmContractHaltKeys,
      invalidWasmContractHaltKeys,
      'No active WASM contract halt keys were observed.',
      'WASM contract execution is halted for one or more scoped contracts',
      scheduledWasmContractHaltKeys
    ),
    enablementControl(mimir, 'TRADEACCOUNTSENABLED', 'Trade accounts', 'Trade accounts are unavailable when disabled.'),
    enablementControl(mimir, 'TRADEACCOUNTSDEPOSITENABLED', 'Trade deposits', 'Trade-account deposits are unavailable when disabled.'),
    optionalPauseControl(mimir, 'MANUALSWAPSTOSYNTHDISABLED', 'Manual synth swaps', 'Manual swaps to synthetic assets are disabled when active.'),
    enablementControl(mimir, 'RUNEPOOLENABLED', 'RUNEPool', 'RUNEPool is unavailable when disabled.'),
    enablementControl(mimir, 'BANKSENDENABLED', 'Bank sends', 'Native bank-send messages are unavailable when disabled.'),
  ];

  const activeControlKeys = monitoredControls
    .filter((control) => control.active)
    .map((control) => control.key);
  const invalidMimirKeys = collectInvalidMimirKeys(mimir, recognizedChainCodes);
  const chainSourceWarnings = uniqueKeys(chainStatuses.flatMap((chain) => chain.sourceWarnings ?? []));
  const chainSourceWarningDetails = chainStatuses.flatMap((chain) => (
    (chain.sourceWarnings ?? []).map((warning) => classifyNetworkSourceWarning(warning, [chain.chain]))
  ));
  const invalidMimirWarning = invalidMimirKeys.length > 0
    ? `${invalidMimirKeys.length} monitored Mimir key${invalidMimirKeys.length === 1 ? '' : 's'} could not be parsed.`
    : null;
  const unknownChainWarning = unknownChainScopedMimirKeys.length > 0
    ? `Unknown chain-scoped Mimir key${unknownChainScopedMimirKeys.length === 1 ? '' : 's'} ignored: ${unknownChainScopedMimirKeys.join(', ')}.`
    : null;
  const unknownOperationWarning = unknownOperationMimirKeys.length > 0
    ? `Unknown operation-like Mimir key${unknownOperationMimirKeys.length === 1 ? '' : 's'} need review: ${unknownOperationMimirKeys.join(', ')}.`
    : null;
  const reviewedOperationalSupportWarning = reviewedOperationalSupportMimirKeys.length > 0
    ? `Known operational-support Mimir key${reviewedOperationalSupportMimirKeys.length === 1 ? '' : 's'} present: ${reviewedOperationalSupportMimirKeys.join(', ')}.`
    : null;
  const sourceWarnings = [
    ...(options.sourceWarnings ?? []),
    ...chainSourceWarnings,
    ...(invalidMimirWarning ? [invalidMimirWarning] : []),
    ...(unknownChainWarning ? [unknownChainWarning] : []),
    ...(reviewedOperationalSupportWarning ? [reviewedOperationalSupportWarning] : []),
    ...(unknownOperationWarning ? [unknownOperationWarning] : []),
  ];
  const sourceWarningDetails = uniqueSourceWarningDetails([
    ...(options.sourceWarnings ?? []).map((warning) => classifyNetworkSourceWarning(warning)),
    ...chainSourceWarningDetails,
    ...(invalidMimirWarning
      ? [
          warningDetail({
            severity: 'warning',
            category: 'mimir-parse',
            message: invalidMimirWarning,
            action: 'Review the exact Mimir values before counting those controls as inactive.',
            keys: invalidMimirKeys,
          }),
        ]
      : []),
    ...(unknownChainWarning
      ? [
          warningDetail({
            severity: 'review',
            category: 'unknown-chain',
            message: unknownChainWarning,
            action: 'Classify the chain-scoped key family before treating it as non-pausing.',
            keys: unknownChainScopedMimirKeys,
          }),
        ]
      : []),
    ...(reviewedOperationalSupportWarning
      ? [
          warningDetail({
            severity: 'review',
            category: 'mimir-support',
            message: reviewedOperationalSupportWarning,
            action: 'These are known THORNode support, migration, or security Mimir families; inspect them before inferring a user-facing pause.',
            keys: reviewedOperationalSupportMimirKeys,
          }),
        ]
      : []),
    ...(unknownOperationWarning
      ? [
          warningDetail({
            severity: 'review',
            category: 'unknown-operation',
            message: unknownOperationWarning,
            action: 'Review the operation-like key family before interpreting it as non-pausing.',
            keys: unknownOperationMimirKeys,
          }),
        ]
      : []),
  ]);
  const activeChainKeys = uniqueKeys(chainStatuses.flatMap((chain) => chain.activeMimirKeys));
  const allScheduledMimirKeys = uniqueKeys(
    scheduledMimirKeys,
    chainStatuses.flatMap((chain) => chain.scheduledMimirKeys ?? [])
  ).sort((a, b) => a.localeCompare(b));
  const activeEvidenceKeys = uniqueKeys(
    activeChainKeys,
    poolDepositPauseKeys,
    asymWithdrawalPauseKeys,
    securedAssetDepositPauseKeys,
    securedAssetWithdrawPauseKeys,
    scopedWasmHaltKeys,
    nodePauseChainGlobalKeys
  );
  const activePauseKeys = uniqueKeys(activeControlKeys, activeEvidenceKeys);

  const pausedChainCount = chainStatuses.filter(
    (chain) => (
      chain.halted ||
      chain.tradingPaused ||
      chain.lpActionsPaused ||
      chain.lpDepositPaused ||
      chain.signingPaused ||
      chain.securedAssetDepositPaused ||
      chain.securedAssetWithdrawPaused ||
      chain.asymWithdrawalPaused
    )
  ).length;
  const isPaused = activeControlKeys.length > 0 || activeEvidenceKeys.length > 0 || pausedChainCount > 0;
  const hasSourceWarnings = sourceWarnings.length > 0;

  return {
    state: isPaused ? 'paused' : hasSourceWarnings ? 'degraded' : 'operational',
    summary: isPaused
      ? hasSourceWarnings
        ? 'Current-only live sources show one or more THORChain operations paused, with source warnings to review.'
        : 'Current-only live sources show one or more THORChain operations paused.'
      : hasSourceWarnings
        ? 'Current-only live sources do not show active halt flags, but source warnings need review.'
        : 'Current-only live sources do not show global halt flags.',
    tradingPaused,
    streamingSwapsPaused,
    memolessTransactionsHalted,
    signingPaused: signingPaused || chainStatuses.some((chain) => chain.signingPaused),
    lpPaused,
    loansPaused,
    observedChainsPaused,
    nodePauseChainGlobal,
    bondPaused,
    unbondPaused,
    rebondHalted,
    operatorRotateHalted,
    oracleHalted,
    securedAssetsPaused,
    securedAssetDepositPauseKeys,
    securedAssetWithdrawPauseKeys,
    asymWithdrawalPauseKeys,
    tcyClaimingPaused,
    tcyClaimingSwapPaused,
    tcyStakingPaused,
    tcyStakeDistributionPaused,
    tcyUnstakingPaused,
    tcyTradingPaused,
    tradeAccountsEnabled,
    tradeAccountDepositsEnabled,
    manualSwapsToSynthDisabled,
    runePoolEnabled,
    bankSendEnabled,
    runePoolDepositPaused,
    runePoolWithdrawPaused,
    wasmPaused,
    wasmDeployerHaltKeys,
    wasmCodeHashHaltKeys,
    wasmContractHaltKeys,
    scopedWasmHaltKeys,
    poolDepositPauseKeys,
    scheduledMimirKeys: allScheduledMimirKeys,
    chainStatuses,
    activeControlKeys,
    activeChainKeys,
    activeEvidenceKeys,
    activePauseKeys,
    monitoredControls,
    thorNodeVersion,
    thorchainHeight,
    thorchainSnapshotPinned: options.thorchainSnapshotPinned,
    thorchainLastblockMinHeight: options.thorchainLastblockMinHeight,
    thorchainLastblockMaxHeight: options.thorchainLastblockMaxHeight,
    thorchainLastblockSpread: options.thorchainLastblockSpread,
    thorchainBlockTime: options.thorchainBlockTime,
    thorchainBlockAgeSeconds: options.thorchainBlockAgeSeconds,
    invalidMimirKeys,
    sourceWarnings,
    sourceWarningDetails,
  };
}

export class ThornodeAPI {
  static async getMimir(): Promise<LiveDataResult<Record<string, unknown>>> {
    return request<Record<string, unknown>>('/mimir');
  }

  static async getInboundAddresses(): Promise<LiveDataResult<ThornodeInboundAddress[]>> {
    return request<ThornodeInboundAddress[]>('/inbound_addresses');
  }

  static async getVersion(): Promise<LiveDataResult<{ current?: string; version?: string }>> {
    return request<{ current?: string; version?: string }>('/version');
  }

  static async getLastBlock(): Promise<LiveDataResult<ThornodeLastBlock[]>> {
    return request<ThornodeLastBlock[]>('/lastblock');
  }

  static async getNetworkStatus(): Promise<LiveDataResult<NetworkStatus>> {
    const checkedAt = new Date().toISOString();
    const errors: string[] = [];
    const warningSnapshots: Array<{
      endpointIndex: number;
      endpoint: ThornodeEndpoint;
      status: NetworkStatus;
      sources: SourceMeta[];
    }> = [];

    for (let i = 0; i < THORNODE_ENDPOINTS.length; i += 1) {
      const endpointIndex = (activeEndpoint + i) % THORNODE_ENDPOINTS.length;
      const endpoint = THORNODE_ENDPOINTS[endpointIndex];

      try {
        const latestBlock = await requestCosmosFromEndpoint<unknown>(endpoint, '/base/tendermint/v1beta1/blocks/latest');
        const latestBlockInfo = getTendermintLatestBlockInfo(latestBlock);
        if (latestBlockInfo === null) {
          throw new Error('THORNode latest block response did not include a usable height and timestamp.');
        }

        const snapshotHeight = getConservativeSnapshotHeight(latestBlockInfo.height);
        const sources = networkStatusSources(endpoint, snapshotHeight);
        const [mimir, inbound, version, lastBlock] = await Promise.all([
          requestFromEndpoint<unknown>(endpoint, '/mimir', snapshotHeight),
          requestFromEndpoint<unknown>(endpoint, '/inbound_addresses', snapshotHeight),
          requestFromEndpoint<unknown>(endpoint, '/version', snapshotHeight),
          requestFromEndpoint<unknown>(endpoint, '/lastblock', snapshotHeight),
        ]);
        const status = deriveValidatedNetworkStatusSnapshot(
          mimir,
          inbound,
          version,
          lastBlock,
          latestBlock,
          checkedAt,
          { snapshotPinned: true, snapshotHeight }
        );
        if (status.sourceWarnings.length === 0) {
          activeEndpoint = endpointIndex;
          return liveOk(status, sources, checkedAt);
        }

        warningSnapshots.push({ endpointIndex, endpoint, status, sources });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown THORNode status error';
        errors.push(`${endpoint.label}: ${message}`);
      }
    }

    const [bestWarningSnapshot] = [...warningSnapshots]
      .sort((left, right) => (
        getWarningSnapshotScore(left.status) - getWarningSnapshotScore(right.status) ||
        left.status.sourceWarnings.length - right.status.sourceWarnings.length ||
        left.endpointIndex - right.endpointIndex
      ));
    if (bestWarningSnapshot) {
      activeEndpoint = bestWarningSnapshot.endpointIndex;
      return liveOk(bestWarningSnapshot.status, bestWarningSnapshot.sources, checkedAt);
    }

    return liveDegraded<NetworkStatus>(
      `THORNode status sources did not provide a usable snapshot (${errors.join('; ')})`,
      THORNODE_ENDPOINTS,
      checkedAt
    );
  }

  static async getDynamicL1FeeStatus(): Promise<LiveDataResult<DynamicL1FeeStatus>> {
    const checkedAt = new Date().toISOString();
    const errors: string[] = [];
    const warningSnapshots: DynamicL1FeeWarningCandidate[] = [];

    for (let i = 0; i < THORNODE_ENDPOINTS.length; i += 1) {
      const endpointIndex = (activeEndpoint + i) % THORNODE_ENDPOINTS.length;
      const endpoint = THORNODE_ENDPOINTS[endpointIndex];

      try {
        const latestBlock = await requestCosmosFromEndpoint<unknown>(endpoint, '/base/tendermint/v1beta1/blocks/latest');
        const latestBlockInfo = getTendermintLatestBlockInfo(latestBlock);
        if (latestBlockInfo === null) {
          throw new Error('THORNode latest block response did not include a usable height and timestamp.');
        }

        const snapshotHeight = getConservativeSnapshotHeight(latestBlockInfo.height);
        const baseSources = dynamicL1FeeStatusSources(endpoint, snapshotHeight);
        const checkedAtMs = Date.parse(checkedAt);
        const blockTimeMs = Date.parse(latestBlockInfo.time);
        const blockAgeSeconds = Number.isNaN(checkedAtMs) || Number.isNaN(blockTimeMs)
          ? undefined
          : Math.round((checkedAtMs - blockTimeMs) / 1000);
        const [mimir, dynamicFees, currentDynamicFees] = await Promise.all([
          requestFromEndpoint<unknown>(endpoint, '/mimir', snapshotHeight),
          requestFromEndpoint<unknown>(endpoint, '/dynamic_l1_fees', snapshotHeight),
          requestFromEndpoint<unknown>(endpoint, '/dynamic_l1_fees_current', snapshotHeight),
        ]);
        if (!isPlainRecord(mimir)) {
          throw new Error('THORNode Mimir response was not a plain object.');
        }
        const sourceFreshness: DynamicL1FeeSourceFreshness = {
          thorchainHeight: snapshotHeight,
          thorchainBlockTime: latestBlockInfo.time,
          thorchainBlockAgeSeconds: blockAgeSeconds,
          snapshotPinned: true,
        };
        const baseStatus = deriveDynamicL1FeeStatus(
          mimir,
          dynamicFees,
          currentDynamicFees,
          sourceFreshness
        );
        const sourceWarnings = [
          ...baseStatus.sourceWarnings,
          ...getDynamicFeeBlockAgeWarnings(blockAgeSeconds),
        ];
        const uniqueWarnings = [...new Set(sourceWarnings)].sort((left, right) => left.localeCompare(right));
        const snapshot = {
          endpointIndex,
          endpoint,
          mimir,
          dynamicFees,
          currentDynamicFees,
          sourceFreshness,
          blockAgeWarnings: getDynamicFeeBlockAgeWarnings(blockAgeSeconds),
          status: {
            ...baseStatus,
            sourceWarnings: uniqueWarnings,
            sourceWarningDetails: getDynamicFeeSourceWarningDetails(uniqueWarnings),
          },
          sources: baseSources,
        };

        if (snapshot.status.sourceWarnings.length === 0) {
          const finalized = await finalizeDynamicL1FeeProviderSnapshot(snapshot);
          if (finalized.status.sourceWarnings.length === 0 || !shouldTryNextDynamicFeeProvider(finalized.status)) {
            activeEndpoint = endpointIndex;
            return liveOk(finalized.status, finalized.sources, checkedAt);
          }

          warningSnapshots.push(finalized);
          continue;
        }

        warningSnapshots.push({
          endpointIndex,
          status: snapshot.status,
          sources: snapshot.sources,
          snapshot,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown THORNode dynamic fee status error';
        errors.push(`${endpoint.label}: ${message}`);
      }
    }

    const [bestWarningSnapshot] = [...warningSnapshots]
      .sort((left, right) => (
        getDynamicFeeWarningSnapshotScore(left.status) - getDynamicFeeWarningSnapshotScore(right.status) ||
        left.status.sourceWarnings.length - right.status.sourceWarnings.length ||
        left.endpointIndex - right.endpointIndex
      ));
    if (bestWarningSnapshot) {
      activeEndpoint = bestWarningSnapshot.endpointIndex;
      if (bestWarningSnapshot.snapshot) {
        const finalized = await finalizeDynamicL1FeeProviderSnapshot(bestWarningSnapshot.snapshot);
        return liveOk(finalized.status, finalized.sources, checkedAt);
      }
      return liveOk(bestWarningSnapshot.status, bestWarningSnapshot.sources, checkedAt);
    }

    return liveDegraded<DynamicL1FeeStatus>(
      `THORNode dynamic fee sources did not provide a usable snapshot (${errors.join('; ')})`,
      THORNODE_ENDPOINTS,
      checkedAt
    );
  }
}

export default ThornodeAPI;
