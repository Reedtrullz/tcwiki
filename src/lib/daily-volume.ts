import type { LiveDataResult } from '@/lib/types';
import { runeBaseUnitsToNumber } from '@/lib/trust';

const DAY_SECONDS = 86_400;
const USD_CENTS = 100;

export const DAILY_VOLUME_POOLS = [
  'ETH.ETH',
  'BTC.BTC',
  'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
  'ETH.USDT-0XDAC17F958D2EE523A2206206994597C13D831EC7',
  'THOR.TCY',
  'BSC.BNB',
] as const;

export interface DailyVolumePool {
  asset: string;
  label: string;
  shortId: string;
  runeVolume: number;
  usdVolume: number;
  sourceResult: LiveDataResult<Record<string, unknown>[]>;
  share: number | null;
  usdVolumeLabel: string;
  shareLabel: string;
}

export interface DailyVolumeSummary {
  usdVolume: number | null;
  runeVolume: number | null;
  usdAvg7d: number | null;
  deltaPct: number | null;
  deltaLabel: string;
  usdAvgLabel: string;
  usdVolumeLabel: string;
  networkUsdVolume: number | null;
  networkUsdVolumeLabel: string;
  coverage: { asset: string; included: boolean; reason: string; result: LiveDataResult<Record<string, unknown>[]> }[];
  periodLabel: string;
  comparisonDays: number;
  pools: DailyVolumePool[];
  topPools: DailyVolumePool[];
}

type PoolInterval = { startTime: number; runeVolume: number | null; usdVolume: number | null; reason?: string };

function nonNegativeInteger(value: unknown): number | null {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^\d+$/.test(value))) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function normalizeIntervals(rows: Record<string, unknown>[]): Map<number, PoolInterval> {
  const intervals = new Map<number, PoolInterval>();
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const startTime = nonNegativeInteger(row.startTime);
    const endTime = nonNegativeInteger(row.endTime);
    if (startTime === null || startTime % DAY_SECONDS !== 0) continue;
    const rune = typeof row.totalVolume === 'string' || typeof row.totalVolume === 'number'
      ? runeBaseUnitsToNumber(row.totalVolume) : null;
    const cents = nonNegativeInteger(row.totalVolumeUSD);
    const missingField = [row.totalVolume, row.totalVolumeUSD].some(value => value === undefined || value === null || value === '');
    const reason = endTime !== startTime + DAY_SECONDS
      ? endTime !== null && endTime > startTime && endTime < startTime + DAY_SECONDS ? 'Incomplete daily interval' : 'Invalid interval boundary'
      : missingField ? 'Missing volume fields' : rune === null || rune < 0 || cents === null ? 'Invalid volume fields' : undefined;
    const interval: PoolInterval = { startTime, runeVolume: reason ? null : rune, usdVolume: reason ? null : cents! / USD_CENTS, reason };
    const existing = intervals.get(startTime);
    // A conflicting duplicate is unusable; no response order can choose a winner.
    if (existing && (existing.runeVolume !== interval.runeVolume || existing.usdVolume !== interval.usdVolume)) {
      interval.runeVolume = null; interval.usdVolume = null; interval.reason = 'Conflicting duplicate interval';
    }
    intervals.set(startTime, interval);
  }
  return intervals;
}

function poolDisplayName(asset: string): string {
  const dotIndex = asset.indexOf('.');
  const symbol = dotIndex >= 0 ? asset.slice(dotIndex + 1) : asset;
  const cleaned = symbol.split('-')[0] ?? symbol;
  return cleaned || asset;
}

function poolShortId(asset: string): string {
  return asset.split('-')[0] ?? asset;
}

function formatCompactUsd(value: number | null): string {
  if (value === null) {
    return 'Unavailable';
  }
  const abs = Math.abs(value);
  if (abs >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (abs >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  if (abs >= 1e3) {
    return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatDelta(value: number | null): string {
  if (value === null) {
    return '';
  }
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function deriveDailyVolumeSummary(
  poolHistories: { asset: string; result: LiveDataResult<Record<string, unknown>[]> }[],
  observedAtMs = Date.now(),
  networkHistory?: LiveDataResult<Record<string, unknown>[]>
): DailyVolumeSummary {
  const latestDay = Number.isFinite(observedAtMs) && Number.isFinite(new Date(observedAtMs).getTime())
    ? Math.floor(observedAtMs / (DAY_SECONDS * 1000)) * DAY_SECONDS - DAY_SECONDS : null;
  const intervalsByAsset = new Map<string, Map<number, PoolInterval>>();
  for (const { asset, result } of poolHistories) {
    if (result.status === 'ok' && Array.isArray(result.data)) intervalsByAsset.set(asset, normalizeIntervals(result.data));
  }
  const pools: DailyVolumePool[] = [];
  if (latestDay !== null) {
    for (const [asset, intervals] of intervalsByAsset) {
      const interval = intervals.get(latestDay);
      if (!interval || interval.runeVolume === null || interval.usdVolume === null) continue;
      pools.push({ asset, sourceResult: poolHistories.find(entry => entry.asset === asset)!.result, label: poolDisplayName(asset), shortId: poolShortId(asset), runeVolume: interval.runeVolume,
        usdVolume: interval.usdVolume, share: null, usdVolumeLabel: formatCompactUsd(interval.usdVolume), shareLabel: 'Unavailable' });
    }
  }
  pools.sort((left, right) => right.usdVolume - left.usdVolume || left.asset.localeCompare(right.asset));
  const totalUsd = pools.length ? pools.reduce((sum, pool) => sum + pool.usdVolume, 0) : null;
  for (const pool of pools) {
    pool.share = totalUsd !== null && totalUsd > 0 ? pool.usdVolume / totalUsd * 100 : null;
    pool.shareLabel = pool.share === null ? 'Unavailable' : `${pool.share.toFixed(1)}%`;
  }
  const comparison: number[] = [];
  if (latestDay !== null && pools.length) {
    for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
      const rows = pools.map(pool => intervalsByAsset.get(pool.asset)?.get(latestDay - daysAgo * DAY_SECONDS));
      if (rows.every(row => row?.usdVolume !== null && row?.usdVolume !== undefined && row.runeVolume !== null)) {
        comparison.push(rows.reduce((sum, row) => sum + row!.usdVolume!, 0));
      }
    }
  }
  const usdAvg7d = comparison.length ? comparison.reduce((sum, value) => sum + value, 0) / comparison.length : null;
  const deltaPct = usdAvg7d !== null && usdAvg7d > 0 && totalUsd !== null ? (totalUsd - usdAvg7d) / usdAvg7d * 100 : null;
  const networkInterval = latestDay !== null && networkHistory?.status === 'ok' && Array.isArray(networkHistory.data)
    ? normalizeIntervals(networkHistory.data).get(latestDay) : undefined;
  const networkUsdVolume = networkInterval?.runeVolume !== null ? networkInterval?.usdVolume ?? null : null;
  return {
    networkUsdVolume, networkUsdVolumeLabel: formatCompactUsd(networkUsdVolume),
    coverage: poolHistories.map(entry => {
      const included = pools.some(pool => pool.asset === entry.asset);
      const reason = included ? 'Included' : entry.result.status === 'degraded' ? 'History failed'
        : (latestDay === null ? 'Period unavailable' : intervalsByAsset.get(entry.asset)?.get(latestDay)?.reason ?? 'Selected completed day absent');
      return { ...entry, included, reason };
    }),
    usdVolume: totalUsd, runeVolume: pools.length ? pools.reduce((sum, pool) => sum + pool.runeVolume, 0) : null,
    usdAvg7d, deltaPct, deltaLabel: formatDelta(deltaPct), usdAvgLabel: formatCompactUsd(usdAvg7d), usdVolumeLabel: formatCompactUsd(totalUsd),
    periodLabel: latestDay === null ? 'Period unavailable' : `${new Date(latestDay * 1000).toISOString().slice(0, 10)} UTC`,
    comparisonDays: comparison.length, pools, topPools: pools.slice(0, 6),
  };
}
