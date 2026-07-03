import {
  ChainOperationalStatus,
  InboundOperationField,
  LiveDataResult,
  NetworkStatus,
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
  'COMPROMISEDVAULT-',
  'STOPSOLVENCYCHECK',
  'EVMDISABLECONTRACTWHITELIST',
  'ENABLESWITCH-',
  'BURNSYNTHS',
  'SCHEDULEDMIGRATION',
  'FUNDMIGRATIONINTERVAL',
  'RAGNAROK-',
  'MIMIRRECALLFUND',
  'MIMIRUPGRADECONTRACT',
] as const;

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

function getConservativeSnapshotHeight(latestHeight: number) {
  return Math.max(0, latestHeight - 1);
}

async function requestFromEndpoint<T>(endpoint: SourceMeta, path: string, height?: number): Promise<T> {
  return requestJson<T>(`${endpoint.url}${withQueryHeight(path, height)}`);
}

async function requestCosmosFromEndpoint<T>(endpoint: ThornodeEndpoint, path: string): Promise<T> {
  return requestJson<T>(`${endpoint.cosmosUrl}${path}`);
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

function getWarningSnapshotScore(status: NetworkStatus) {
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
  const sourceWarnings = [
    ...(options.sourceWarnings ?? []),
    ...chainSourceWarnings,
    ...(invalidMimirKeys.length > 0
      ? [`${invalidMimirKeys.length} monitored Mimir key${invalidMimirKeys.length === 1 ? '' : 's'} could not be parsed.`]
      : []),
    ...(unknownChainScopedMimirKeys.length > 0
      ? [`Unknown chain-scoped Mimir key${unknownChainScopedMimirKeys.length === 1 ? '' : 's'} ignored: ${unknownChainScopedMimirKeys.join(', ')}.`]
      : []),
    ...(unknownOperationMimirKeys.length > 0
      ? [`Unknown operation-like Mimir key${unknownOperationMimirKeys.length === 1 ? '' : 's'} need review: ${unknownOperationMimirKeys.join(', ')}.`]
      : []),
  ];
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
          return liveOk(status, endpoint, checkedAt);
        }

        warningSnapshots.push({ endpointIndex, endpoint, status });
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
      return liveOk(bestWarningSnapshot.status, bestWarningSnapshot.endpoint, checkedAt);
    }

    return liveDegraded<NetworkStatus>(
      `THORNode status sources did not provide a usable snapshot (${errors.join('; ')})`,
      THORNODE_ENDPOINTS,
      checkedAt
    );
  }
}

export default ThornodeAPI;
