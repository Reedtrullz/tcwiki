import {
  ChainData,
  HistoryItem,
  LiveDataResult,
  NetworkStats,
  Node,
  Pool,
  Swap,
} from '@/lib/types';
import { liveDegraded, liveOk, normalizeApyToPercent } from '@/lib/trust';

const MIDGARD_ENDPOINTS = [
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
type RawHistoryResponse = {
  intervals?: unknown;
};

const NON_NEGATIVE_INTEGER_PATTERN = /^\d+$/;

export function resetMidgardEndpointForTests() {
  activeEndpoint = 0;
}

async function request<T>(path: string): Promise<LiveDataResult<T>> {
  const errors: string[] = [];

  for (let i = 0; i < MIDGARD_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % MIDGARD_ENDPOINTS.length;
    const endpoint = MIDGARD_ENDPOINTS[endpointIndex];
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
      const message = error instanceof Error ? error.message : 'Unknown Midgard error';
      errors.push(`${endpoint.label}: ${message}`);
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  return liveDegraded<T>(`Midgard source did not respond (${errors.join('; ')})`);
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

function normalizePool(raw: RawPool): Pool {
  const annualPercentageRate = asString(raw.annualPercentageRate);
  const poolAPY = asString(raw.poolAPY);
  const numericApy = typeof raw.apy === 'number' ? raw.apy : undefined;

  return {
    asset: asRequiredString(raw.asset, 'pool.asset'),
    assetDepth: asRequiredString(raw.assetDepth, 'pool.assetDepth'),
    runeDepth: asRequiredString(raw.runeDepth, 'pool.runeDepth'),
    status: asRequiredString(raw.status, 'pool.status'),
    price: asString(raw.price),
    liquidityUnits: asString(raw.liquidityUnits),
    lpUnits: asString(raw.lpUnits ?? raw.liquidityUnits),
    synthUnits: asString(raw.synthUnits),
    synthSupply: asString(raw.synthSupply),
    units: asString(raw.units),
    annualPercentageRate,
    poolAPY,
    apy: numericApy,
    apyPercent: normalizeApyToPercent(poolAPY ?? annualPercentageRate ?? numericApy, 'decimal') ?? undefined,
    assetPrice: asString(raw.assetPrice),
    assetPriceUSD: asString(raw.assetPriceUSD),
    runePriceUSD: asString(raw.runePriceUSD),
    liquidityUSD: asString(raw.liquidityUSD),
    volume24h: asString(raw.volume24h),
    volume24hUSD: asString(raw.volume24hUSD),
    pool: asString(raw.pool),
    earnings: asString(raw.earnings),
    rewards: asString(raw.rewards),
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
        totalPooledRune: asRequiredString(result.data.totalPooledRune, 'network.totalPooledRune'),
        totalReserve: asRequiredString(result.data.totalReserve, 'network.totalReserve'),
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

  return {
    ...result,
    data: result.data.intervals as HistoryItem[],
  };
}

export class MidgardAPI {
  static async getPools(status = 'available'): Promise<LiveDataResult<Pool[]>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return normalizePools(await request<RawPool[]>(`/pools${query}`));
  }

  static async getPoolDetails(pool: string): Promise<LiveDataResult<Pool>> {
    const result = await request<RawPool>(`/pool/${encodeURIComponent(pool)}`);
    const normalized = normalizePools({
      ...result,
      data: result.data ? [result.data] : undefined,
    });
    return {
      ...normalized,
      data: normalized.data?.[0],
    };
  }

  static async getNetworkData(): Promise<LiveDataResult<NetworkStats>> {
    return normalizeNetworkData(await request<RawNetworkStats>('/network'));
  }

  static async getNodes(): Promise<LiveDataResult<Node[]>> {
    return request<Node[]>('/nodes');
  }

  static async getHealth(): Promise<LiveDataResult<Record<string, unknown>>> {
    return request<Record<string, unknown>>('/health');
  }

  static async getHistory(interval = 'day', count = 30): Promise<LiveDataResult<HistoryItem[]>> {
    const result = await request<RawHistoryResponse>(
      `/history/earnings?interval=${encodeURIComponent(interval)}&count=${count}`
    );

    return normalizeHistory(result);
  }

  static async getSwaps(): Promise<LiveDataResult<Swap[]>> {
    return request<Swap[]>('/swaps');
  }

  static async getChains(): Promise<LiveDataResult<ChainData[]>> {
    return request<ChainData[]>('/chains');
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

  static async getAssetPrice(asset: string): Promise<LiveDataResult<{ runePrice: string; assetPrice: string }>> {
    return request<{ runePrice: string; assetPrice: string }>(`/price/${encodeURIComponent(asset)}`);
  }

  static async getRunePriceHistory(interval = 'day', count = 365): Promise<LiveDataResult<Record<string, unknown>[]>> {
    const result = await request<{ intervals?: Record<string, unknown>[] }>(
      `/history/rune?interval=${encodeURIComponent(interval)}&count=${count}`
    );

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
}

export default MidgardAPI;
