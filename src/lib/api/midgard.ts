import { readProviderJson } from './bounded-json';
import { normalizeTransactionEvidence, transactionHash } from '@/lib/transaction-evidence';
import type { TransactionEvidence } from '@/lib/types';
import {
  AssetPrice,
  ChainData,
  HistoryItem,
  LiveDataResult,
  MidgardHealth,
  DEFAULT_MIDGARD_POOL_PERIOD,
  MIDGARD_POOL_PERIODS,
  MidgardPoolPeriod,
  NetworkStats,
  Node,
  Pool,
  SourceMeta,
  Swap,
} from '@/lib/types';
import { liveDegraded, liveOk } from '@/lib/trust';
import { DAILY_VOLUME_POOLS } from '@/lib/daily-volume';

export const MIDGARD_ENDPOINTS = [
  {
    label: 'Liquify Midgard',
    url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2',
  },
  {
    label: 'THORChain Midgard',
    url: 'https://midgard.thorchain.network/v2',
  },
];

let activeEndpoint = 0;

type RawNetworkStats = Partial<Record<keyof NetworkStats, unknown>>;
type RawPool = Record<string, unknown>;
type RawNode = Record<string, unknown>;
type RawChain = Record<string, unknown>;
type RawAssetPrice = Record<string, unknown>;
type RawHistoryResponse = {
  intervals?: unknown;
};

const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;

export function resetMidgardEndpointForTests() {
  activeEndpoint = 0;
}

function sourceForPath(endpoint: SourceMeta, path: string): SourceMeta {
  return {
    ...endpoint,
    url: joinEndpointPath(endpoint.url, path),
  };
}

function joinEndpointPath(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

async function request<T>(path: string): Promise<LiveDataResult<T>> {
  const errors: string[] = [];

  for (let i = 0; i < MIDGARD_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % MIDGARD_ENDPOINTS.length;
    const endpoint = MIDGARD_ENDPOINTS[endpointIndex];
    const checkedAt = new Date().toISOString();

    try {
      const data = await requestFromEndpoint<T>(endpoint, path);
      activeEndpoint = endpointIndex;
      return liveOk(data, sourceForPath(endpoint, path), checkedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Midgard error';
      errors.push(`${endpoint.label}: ${message}`);
    }
  }

  return liveDegraded<T>(`Midgard source did not respond (${errors.join('; ')})`);
}

async function requestFromEndpoint<T>(endpoint: SourceMeta, path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 5000);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();

  try {
    const response = await fetch(joinEndpointPath(endpoint.url, path), {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await readProviderJson(response, controller.signal) as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
}

async function requestNormalized<Raw, Normalized>(
  path: string,
  normalize: (result: LiveDataResult<Raw>) => LiveDataResult<Normalized>
): Promise<LiveDataResult<Normalized>> {
  const errors: string[] = [];

  for (let i = 0; i < MIDGARD_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % MIDGARD_ENDPOINTS.length;
    const endpoint = MIDGARD_ENDPOINTS[endpointIndex];
    const checkedAt = new Date().toISOString();

    try {
      const data = await requestFromEndpoint<Raw>(endpoint, path);
      const normalized = normalize(liveOk(data, sourceForPath(endpoint, path), checkedAt));
      if (normalized.status !== 'ok' || normalized.data === undefined) {
        throw new Error(normalized.error ?? 'Midgard response could not be normalized');
      }
      activeEndpoint = endpointIndex;
      return normalized;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Midgard error';
      errors.push(`${endpoint.label}: ${message}`);
    }
  }

  return liveDegraded<Normalized>(`Midgard source did not provide usable data (${errors.join('; ')})`);
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function asRequiredString(value: unknown, field: string): string {
  const stringValue = asString(value);
  if (stringValue === undefined || stringValue === '') {
    throw new Error(`Midgard response missing ${field}`);
  }
  return stringValue;
}

function asRequiredBaseUnitString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`Midgard response missing ${field}`);
  }
  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`Midgard response has invalid ${field}`);
  }
  return value;
}

function asOptionalBaseUnitString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return typeof value === 'string' && NON_NEGATIVE_INTEGER_PATTERN.test(value) ? value : undefined;
}

function asNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error(`Midgard response has invalid ${field}`);
    }
    return value;
  }

  if (typeof value !== 'string') {
    throw new Error(`Midgard response missing ${field}`);
  }

  if (!value) {
    throw new Error(`Midgard response missing ${field}`);
  }

  if (!NON_NEGATIVE_INTEGER_PATTERN.test(value)) {
    throw new Error(`Midgard response has invalid ${field}`);
  }

  const numeric = Number(value);
  if (!Number.isSafeInteger(numeric)) {
    throw new Error(`Midgard response has invalid ${field}`);
  }
  return numeric;
}

function asOptionalNonNegativeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return asNonNegativeInteger(value, field);
}

function asBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asStringOrRecord(value: unknown): string | Record<string, unknown> | undefined {
  const stringValue = asString(value);
  if (stringValue !== undefined) {
    return stringValue;
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function normalizeNode(raw: RawNode): Node {
  const nodeAddress = asRequiredString(raw.nodeAddress ?? raw.node_address ?? raw.address, 'node.nodeAddress');
  const status = asString(raw.status);

  return {
    nodeAddress,
    address: nodeAddress,
    bond: asString(raw.bond),
    status,
    version: asString(raw.version),
    slashPoints: asOptionalNonNegativeInteger(raw.slashPoints ?? raw.slash_points, 'node.slashPoints'),
    isActive: status ? status.toLowerCase() === 'active' : undefined,
    bondUSD: asString(raw.bondUSD ?? raw.bond_usd),
    pubkeys: {
      ed25519: asString(raw.ed25519),
      secp256k1: asString(raw.secp256k1),
    },
  };
}

function normalizeNodes(result: LiveDataResult<RawNode[]>): LiveDataResult<Node[]> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<Node[]>(result.error ?? 'Midgard nodes did not load', result.sources ?? result.source, result.checkedAt);
  }

  if (!Array.isArray(result.data)) {
    return liveDegraded<Node[]>('Midgard nodes response was not an array', result.sources ?? result.source, result.checkedAt);
  }

  try {
    return {
      ...result,
      data: result.data.map(normalizeNode),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard nodes response could not be normalized';
    return liveDegraded<Node[]>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeChain(raw: RawChain): ChainData {
  return {
    chain: asRequiredString(raw.chain, 'chain.chain'),
    height: asString(raw.height),
    thorchainHeight: asOptionalNonNegativeInteger(raw.thorchainHeight ?? raw.thorchain_height, 'chain.thorchainHeight'),
    inboundPaused: asBoolean(raw.inboundPaused ?? raw.inbound_paused),
    outboundPaused: asBoolean(raw.outboundPaused ?? raw.outbound_paused),
    halted: asBoolean(raw.halted),
    gasRate: asString(raw.gasRate ?? raw.gas_rate),
  };
}

function normalizeChains(result: LiveDataResult<RawChain[]>): LiveDataResult<ChainData[]> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<ChainData[]>(result.error ?? 'Midgard chains did not load', result.sources ?? result.source, result.checkedAt);
  }

  if (!Array.isArray(result.data)) {
    return liveDegraded<ChainData[]>('Midgard chains response was not an array', result.sources ?? result.source, result.checkedAt);
  }

  try {
    return {
      ...result,
      data: result.data.map(normalizeChain),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard chains response could not be normalized';
    return liveDegraded<ChainData[]>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeAssetPrice(result: LiveDataResult<RawAssetPrice>): LiveDataResult<AssetPrice> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<AssetPrice>(result.error ?? 'Midgard asset price did not load', result.sources ?? result.source, result.checkedAt);
  }

  try {
    return {
      ...result,
      data: {
        runePrice: asRequiredString(result.data.runePrice ?? result.data.rune_price, 'price.runePrice'),
        assetPrice: asRequiredString(result.data.assetPrice ?? result.data.asset_price, 'price.assetPrice'),
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard asset price response could not be normalized';
    return liveDegraded<AssetPrice>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeHealth(result: LiveDataResult<Record<string, unknown>>): LiveDataResult<MidgardHealth> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<MidgardHealth>(
      result.error ?? 'Midgard health did not load',
      result.sources ?? result.source,
      result.checkedAt
    );
  }

  try {
    const lastAggregated = asRecord(result.data.lastAggregated);
    const lastCommitted = asRecord(result.data.lastCommitted);
    const lastFetched = asRecord(result.data.lastFetched);
    const lastThorNode = asRecord(result.data.lastThorNode);
    const aggregatedHeight = asOptionalNonNegativeInteger(lastAggregated?.height, 'health.lastAggregated.height');
    const committedHeight = asOptionalNonNegativeInteger(lastCommitted?.height, 'health.lastCommitted.height');
    const fetchedHeight = asOptionalNonNegativeInteger(lastFetched?.height, 'health.lastFetched.height');
    const thorNodeHeight = asOptionalNonNegativeInteger(lastThorNode?.height, 'health.lastThorNode.height');
    const scannerHeight = asOptionalNonNegativeInteger(result.data.scannerHeight, 'health.scannerHeight');
    const heightCandidates = [scannerHeight, thorNodeHeight, committedHeight, fetchedHeight]
      .filter((height): height is number => height !== undefined);
    const latestHeight = heightCandidates.length > 0 ? Math.max(...heightCandidates) : undefined;
    const aggregatedTimestamp = asOptionalNonNegativeInteger(lastAggregated?.timestamp, 'health.lastAggregated.timestamp');
    const latestTimestampCandidates = [
      asOptionalNonNegativeInteger(lastThorNode?.timestamp, 'health.lastThorNode.timestamp'),
      asOptionalNonNegativeInteger(lastCommitted?.timestamp, 'health.lastCommitted.timestamp'),
      asOptionalNonNegativeInteger(lastFetched?.timestamp, 'health.lastFetched.timestamp'),
    ].filter((timestamp): timestamp is number => timestamp !== undefined);
    const latestTimestamp = latestTimestampCandidates.length > 0 ? Math.max(...latestTimestampCandidates) : undefined;
    const lagBlocks = latestHeight !== undefined && aggregatedHeight !== undefined
      ? Math.max(0, latestHeight - aggregatedHeight)
      : undefined;
    const lagSeconds = latestTimestamp !== undefined && aggregatedTimestamp !== undefined
      ? Math.max(0, latestTimestamp - aggregatedTimestamp)
      : undefined;
    const database = asBoolean(result.data.database);
    const inSync = asBoolean(result.data.inSync);
    const reasons: string[] = [];

    if (database === undefined) {
      reasons.push('Midgard health did not include database status.');
    }
    if (inSync === undefined) {
      reasons.push('Midgard health did not include sync status.');
    }
    if (database === false) {
      reasons.push('Midgard database reported unhealthy.');
    }
    if (inSync === false) {
      reasons.push('Midgard reported out of sync.');
    }
    if (lagBlocks === undefined && lagSeconds === undefined) {
      reasons.push('Midgard lag unavailable.');
    }
    if (lagBlocks !== undefined && lagBlocks > 20) {
      reasons.push(`Midgard is ${lagBlocks} blocks behind.`);
    } else if (lagBlocks !== undefined && lagBlocks > 3) {
      reasons.push(`Midgard lag is ${lagBlocks} blocks.`);
    }
    if (lagSeconds !== undefined && lagSeconds > 1800) {
      reasons.push(`Midgard is ${Math.round(lagSeconds / 60)} minutes behind.`);
    } else if (lagSeconds !== undefined && lagSeconds > 300) {
      reasons.push(`Midgard lag is ${Math.round(lagSeconds / 60)} minutes.`);
    }

    const severity = database === false ||
      inSync === false ||
      (lagBlocks !== undefined && lagBlocks > 20) ||
      (lagSeconds !== undefined && lagSeconds > 1800)
      ? 'degraded'
      : (lagBlocks === undefined && lagSeconds === undefined)
        ? 'unknown'
        : (
            database === undefined ||
            inSync === undefined ||
            (lagBlocks !== undefined && lagBlocks > 3) ||
            (lagSeconds !== undefined && lagSeconds > 300)
          )
          ? 'warning'
          : 'ok';

    return {
      ...result,
      data: {
        provider: result.source?.label,
        database,
        inSync,
        latestHeight,
        aggregatedHeight,
        scannerHeight,
        lagBlocks,
        lagSeconds,
        severity,
        reasons,
        checkedAt: result.checkedAt,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard health response could not be normalized';
    return liveDegraded<MidgardHealth>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizePool(raw: RawPool): Pool {
  const annualPercentageRate = asString(raw.annualPercentageRate);
  const poolAPY = asString(raw.poolAPY);
  const numericApy = typeof raw.apy === 'number' ? raw.apy : undefined;

  return {
    asset: asRequiredString(raw.asset, 'pool.asset'),
    assetDepth: asRequiredBaseUnitString(raw.assetDepth, 'pool.assetDepth'),
    runeDepth: asRequiredBaseUnitString(raw.runeDepth, 'pool.runeDepth'),
    status: asRequiredString(raw.status, 'pool.status'),
    price: asString(raw.price),
    liquidityUnits: asOptionalBaseUnitString(raw.liquidityUnits),
    lpUnits: asOptionalBaseUnitString(raw.lpUnits ?? raw.liquidityUnits),
    synthUnits: asOptionalBaseUnitString(raw.synthUnits),
    synthSupply: asOptionalBaseUnitString(raw.synthSupply),
    units: asOptionalBaseUnitString(raw.units),
    annualPercentageRate,
    poolAPY,
    apy: numericApy,
    assetPrice: asString(raw.assetPrice),
    assetPriceUSD: asString(raw.assetPriceUSD),
    runePriceUSD: asString(raw.runePriceUSD),
    liquidityInUSD: asString(raw.liquidityInUSD ?? raw.liquidityUSD),
    volume24h: asOptionalBaseUnitString(raw.volume24h),
    pool: asString(raw.pool),
    earnings: asOptionalBaseUnitString(raw.earnings),
    rewards: asOptionalBaseUnitString(raw.rewards),
  };
}

function normalizePools(result: LiveDataResult<RawPool[]>): LiveDataResult<Pool[]> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<Pool[]>(
      result.error ?? 'Midgard pools did not load',
      result.sources ?? result.source,
      result.checkedAt
    );
  }

  if (!Array.isArray(result.data)) {
    return liveDegraded<Pool[]>('Midgard pools response was not an array', result.sources ?? result.source, result.checkedAt);
  }

  try {
    return {
      ...result,
      data: result.data.map(normalizePool),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard pools response could not be normalized';
    return liveDegraded<Pool[]>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeNetworkData(result: LiveDataResult<RawNetworkStats>): LiveDataResult<NetworkStats> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<NetworkStats>(
      result.error ?? 'Midgard network data did not load',
      result.sources ?? result.source,
      result.checkedAt
    );
  }

  try {
    return {
      ...result,
      data: {
        totalPooledRune: asRequiredBaseUnitString(result.data.totalPooledRune, 'network.totalPooledRune'),
        totalReserve: asRequiredBaseUnitString(result.data.totalReserve, 'network.totalReserve'),
        activeNodeCount: asNonNegativeInteger(result.data.activeNodeCount, 'network.activeNodeCount'),
        standbyNodeCount: asNonNegativeInteger(result.data.standbyNodeCount, 'network.standbyNodeCount'),
        bondingAPY: asRequiredString(result.data.bondingAPY, 'network.bondingAPY'),
        liquidityAPY: asRequiredString(result.data.liquidityAPY, 'network.liquidityAPY'),
        nextChurnHeight: asNonNegativeInteger(result.data.nextChurnHeight, 'network.nextChurnHeight'),
        poolActivationCountdown: result.data.poolActivationCountdown === undefined
          ? undefined
          : asNonNegativeInteger(result.data.poolActivationCountdown, 'network.poolActivationCountdown'),
        poolShareFactor: asString(result.data.poolShareFactor),
        blockRewards: asStringOrRecord(result.data.blockRewards),
        bondMetrics:
          typeof result.data.bondMetrics === 'object' && result.data.bondMetrics !== null
            ? (result.data.bondMetrics as Record<string, unknown>)
            : {},
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard network response could not be normalized';
    return liveDegraded<NetworkStats>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeHistory(result: LiveDataResult<RawHistoryResponse>): LiveDataResult<HistoryItem[]> {
  if (result.status !== 'ok') {
    return liveDegraded<HistoryItem[]>(result.error ?? 'Midgard earnings history did not load', result.sources ?? result.source);
  }

  if (!Array.isArray(result.data?.intervals)) {
    return liveDegraded<HistoryItem[]>(
      'Midgard earnings history response did not include intervals',
      result.sources ?? result.source,
      result.checkedAt
    );
  }

  try {
    return {
      ...result,
      data: normalizeHistoryIntervals(result.data.intervals),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Midgard earnings history response could not be normalized';
    return liveDegraded<HistoryItem[]>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeHistoryIntervals(intervals: unknown[]): HistoryItem[] {
  const unique = new Map<string, HistoryItem>();
  for (const [index, value] of intervals.entries()) {
    const interval = normalizeHistoryItem(value, index);
    const start = Number(interval.startTime); const end = interval.endTime ? Number(interval.endTime) : undefined;
    if (!Number.isFinite(new Date(start * 1000).getTime()) || (end !== undefined && (!Number.isFinite(new Date(end * 1000).getTime()) || end <= start))) {
      throw new Error(`Midgard earnings interval ${index} has invalid time boundaries`);
    }
    const id = `${interval.startTime}-${interval.endTime}`;
    const existing = unique.get(id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(interval)) throw new Error(`Midgard earnings interval ${id} has conflicting duplicates`);
    unique.set(id, interval);
  }
  const rows = [...unique.values()].sort((a, b) => Number(a.startTime) - Number(b.startTime));
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index - 1].endTime && Number(rows[index].startTime) < Number(rows[index - 1].endTime)) {
      throw new Error(`Midgard earnings intervals overlap at ${rows[index].startTime}`);
    }
  }
  return rows;
}

function optionalHistoryString(value: unknown): string {
  return asString(value) ?? '';
}

function optionalHistoryBaseUnitString(value: unknown): string {
  return asOptionalBaseUnitString(value) ?? '';
}

function normalizeHistoryItem(value: unknown, index: number): HistoryItem {
  const raw = asRecord(value);
  if (!raw) {
    throw new Error(`Midgard earnings history interval ${index} was not an object`);
  }

  return {
    startTime: String(asNonNegativeInteger(raw.startTime, `history.intervals[${index}].startTime`)),
    endTime: raw.endTime === undefined || raw.endTime === null || raw.endTime === ''
      ? ''
      : String(asNonNegativeInteger(raw.endTime, `history.intervals[${index}].endTime`)),
    liquidityFees: optionalHistoryBaseUnitString(raw.liquidityFees),
    blockRewards: optionalHistoryBaseUnitString(raw.blockRewards),
    earnings: asRequiredBaseUnitString(raw.earnings, `history.intervals[${index}].earnings`),
    bondingEarnings: asRequiredBaseUnitString(raw.bondingEarnings, `history.intervals[${index}].bondingEarnings`),
    liquidityEarnings: asRequiredBaseUnitString(raw.liquidityEarnings, `history.intervals[${index}].liquidityEarnings`),
    avgNodeCount: optionalHistoryString(raw.avgNodeCount),
    runePriceUSD: optionalHistoryString(raw.runePriceUSD),
    pools: Array.isArray(raw.pools) ? raw.pools : [],
  };
}

export class MidgardAPI {
  static async getPools(
    status = 'available',
    period: MidgardPoolPeriod = DEFAULT_MIDGARD_POOL_PERIOD
  ): Promise<LiveDataResult<Pool[]>> {
    if (!MIDGARD_POOL_PERIODS.includes(period)) return liveDegraded<Pool[]>('Unsupported pool return period; select a bounded duration.');
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    params.set('period', period);
    const query = `?${params.toString()}`;
    return requestNormalized<RawPool[], Pool[]>(`/pools${query}`, normalizePools);
  }

  static async getPoolDetails(pool: string): Promise<LiveDataResult<Pool>> {
    const normalized = await requestNormalized<RawPool, Pool[]>(
      `/pool/${encodeURIComponent(pool)}`,
      (result) => normalizePools({
        ...result,
        data: result.data ? [result.data] : undefined,
      })
    );
    return {
      ...normalized,
      data: normalized.data?.[0],
    };
  }

  static async getNetworkData(): Promise<LiveDataResult<NetworkStats>> {
    return requestNormalized<RawNetworkStats, NetworkStats>('/network', normalizeNetworkData);
  }

  static async getNodes(): Promise<LiveDataResult<Node[]>> {
    return requestNormalized<RawNode[], Node[]>('/nodes', normalizeNodes);
  }

  static async getHealth(): Promise<LiveDataResult<MidgardHealth>> {
    return requestNormalized<Record<string, unknown>, MidgardHealth>('/health', normalizeHealth);
  }

  static async getHistory(interval = 'day', count = 30): Promise<LiveDataResult<HistoryItem[]>> {
    return requestNormalized<RawHistoryResponse, HistoryItem[]>(
      `/history/earnings?interval=${encodeURIComponent(interval)}&count=${count}`,
      normalizeHistory
    );
  }

  static async getSwaps(): Promise<LiveDataResult<Swap[]>> {
    return request<Swap[]>('/swaps');
  }

  static async getChains(): Promise<LiveDataResult<ChainData[]>> {
    return requestNormalized<RawChain[], ChainData[]>('/chains', normalizeChains);
  }

  /** Explicit one-hash pilot. Fixed providers, five actions, existing bounded body/deadline. */
  static async getTransactionEvidence(hash: string, signal?: AbortSignal): Promise<LiveDataResult<TransactionEvidence>> {
    if (!transactionHash(hash)) return liveDegraded('Enter one 32-byte hexadecimal transaction hash (optional 0x prefix).');
    const path = `/actions?txid=${encodeURIComponent(hash)}&limit=5`;
    const attempted: SourceMeta[] = [];
    for (const endpoint of MIDGARD_ENDPOINTS) {
      if (signal?.aborted) return liveDegraded('Lookup cancelled; transaction evidence remains unknown.', attempted);
      attempted.push(sourceForPath(endpoint, path));
      try {
        const raw = await requestFromEndpoint<unknown>(endpoint, path, signal);
        const data = normalizeTransactionEvidence(raw, hash);
        if (signal?.aborted) return liveDegraded('Lookup cancelled; transaction evidence remains unknown.', attempted);
        return liveOk(data, sourceForPath(endpoint, path), new Date().toISOString());
      } catch {
        // Failed or malformed indexer evidence does not establish transaction absence.
        continue;
      }
    }
    return liveDegraded('The indexers did not provide usable evidence. Transaction state remains unknown.', attempted);
  }

  static async getActions(): Promise<LiveDataResult<Record<string, unknown>[]>> {
    return request<Record<string, unknown>[]>('/actions');
  }

  static async getPoolStats(pool: string): Promise<LiveDataResult<Record<string, unknown>>> {
    return request<Record<string, unknown>>(`/pool/${encodeURIComponent(pool)}/stats`);
  }

  static async getMemberDetails(address: string): Promise<LiveDataResult<Record<string, unknown>>> {
    return request<Record<string, unknown>>(`/member/${encodeURIComponent(address)}`);
  }

  static async getAssetPrice(asset: string): Promise<LiveDataResult<AssetPrice>> {
    return requestNormalized<RawAssetPrice, AssetPrice>(`/price/${encodeURIComponent(asset)}`, normalizeAssetPrice);
  }

  static async getRunePriceHistory(interval = 'day', count = 365): Promise<LiveDataResult<Record<string, unknown>[]>> {
    return requestNormalized<{ intervals?: Record<string, unknown>[] }, Record<string, unknown>[]>(
      `/history/rune?interval=${encodeURIComponent(interval)}&count=${count}`,
      (result) => {
        if (result.status !== 'ok') {
          return liveDegraded<Record<string, unknown>[]>(
            result.error ?? 'Midgard RUNE price history did not load',
            result.sources ?? result.source,
            result.checkedAt
          );
        }

        if (!Array.isArray(result.data?.intervals)) {
          return liveDegraded<Record<string, unknown>[]>(
            'Midgard RUNE price history response did not include intervals',
            result.sources ?? result.source,
            result.checkedAt
          );
        }

        return {
          ...result,
          data: result.data.intervals,
        };
      }
    );
  }

  static async getDailyVolumeHistories() {
    // Six curated pool reads and one documented all-network aggregate, not all-pool fan-out.
    return Promise.all([...DAILY_VOLUME_POOLS, undefined].map(pool => this.getPoolVolumeHistory(pool, 'day', 8)));
  }

  static async getPoolVolumeHistory(pool: string | undefined, interval = 'day', count = 8): Promise<LiveDataResult<Record<string, unknown>[]>> {
    return requestNormalized<{ intervals?: Record<string, unknown>[] }, Record<string, unknown>[]>(
      `/history/swaps?${pool === undefined ? '' : `pool=${encodeURIComponent(pool)}&`}interval=${encodeURIComponent(interval)}&count=${count}`,
      (result) => {
        if (result.status !== 'ok') {
          return liveDegraded<Record<string, unknown>[]>(
            result.error ?? 'Midgard pool volume history did not load',
            result.sources ?? result.source,
            result.checkedAt
          );
        }

        if (!Array.isArray(result.data?.intervals)) {
          return liveDegraded<Record<string, unknown>[]>(
            'Midgard pool volume history response did not include intervals',
            result.sources ?? result.source,
            result.checkedAt
          );
        }

        return {
          ...result,
          data: result.data.intervals,
        };
      }
    );
  }
}

export default MidgardAPI;
