import type { LiveDataResult } from '@/lib/types';

const RUNE_BASE_UNITS = 1e8;
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
  pools: DailyVolumePool[];
  topPools: DailyVolumePool[];
}

type PoolInterval = {
  startTime: number;
  totalVolume: number | null;
  totalVolumeUSD: number | null;
};

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeIntervals(rows: Record<string, unknown>[]): PoolInterval[] {
  return rows
    .map((row) => ({
      startTime: parseFiniteNumber(row.startTime),
      totalVolume: parseFiniteNumber(row.totalVolume),
      totalVolumeUSD: parseFiniteNumber(row.totalVolumeUSD),
    }))
    .filter((row): row is PoolInterval => row.startTime !== null)
    .sort((left, right) => left.startTime - right.startTime);
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
  poolHistories: { asset: string; result: LiveDataResult<Record<string, unknown>[]> }[]
): DailyVolumeSummary {
  const okHistories = poolHistories.filter(
    (entry) => entry.result.status === 'ok' && Array.isArray(entry.result.data)
  );

  // Days where the endpoint returned but volume was 0 count as real days.
  const dayUsdCents = new Map<number, number>();
  const intervalsByAsset = new Map<string, PoolInterval[]>();

  for (const { asset, result } of okHistories) {
    const intervals = normalizeIntervals(result.data ?? []);
    if (!intervals.length) {
      continue;
    }

    intervalsByAsset.set(asset, intervals);
    for (const interval of intervals) {
      dayUsdCents.set(interval.startTime, (dayUsdCents.get(interval.startTime) ?? 0) + (interval.totalVolumeUSD ?? 0));
    }
  }

  const days = [...dayUsdCents.entries()].sort((left, right) => left[0] - right[0]);
  const latestNonZeroDay = [...days].reverse().find(([, cents]) => cents > 0);
  const latestDay = latestNonZeroDay ? latestNonZeroDay[0] : null;

  const pools: DailyVolumePool[] = [];
  if (latestDay !== null) {
    for (const [asset, intervals] of intervalsByAsset) {
      const dayInterval = intervals.find((interval) => interval.startTime === latestDay);
      if (!dayInterval || ((dayInterval.totalVolume ?? 0) <= 0 && (dayInterval.totalVolumeUSD ?? 0) <= 0)) {
        continue;
      }
      const usd = (dayInterval.totalVolumeUSD ?? 0) / USD_CENTS;
    pools.push({
      asset,
      label: poolDisplayName(asset),
      shortId: poolShortId(asset),
        runeVolume: (dayInterval.totalVolume ?? 0) / RUNE_BASE_UNITS,
        usdVolume: usd,
        share: null,
        usdVolumeLabel: formatCompactUsd(usd),
        shareLabel: 'Unavailable',
      });
    }
  }

  pools.sort((left, right) => right.usdVolume - left.usdVolume);
  const totalUsd = pools.reduce((sum, pool) => sum + pool.usdVolume, 0);

  for (const pool of pools) {
    const share = totalUsd > 0 ? (pool.usdVolume / totalUsd) * 100 : null;
    pool.share = share;
    pool.shareLabel = share === null ? 'Unavailable' : `${share.toFixed(1)}%`;
  }

  const latestDayUsdCents = latestDay !== null ? dayUsdCents.get(latestDay) ?? 0 : null;
  const latestDayUsd = latestDayUsdCents !== null ? latestDayUsdCents / USD_CENTS : null;
  const priorDays = latestDay === null ? [] : days.filter(([start]) => start < latestDay);
  const prior7 = priorDays.slice(-7);
  const usdAvg7d = prior7.length
    ? (prior7.reduce((sum, [, cents]) => sum + cents, 0) / prior7.length) / USD_CENTS
    : null;
  const deltaPct = usdAvg7d !== null && usdAvg7d > 0 && latestDayUsd !== null
    ? ((latestDayUsd - usdAvg7d) / usdAvg7d) * 100
    : null;

  return {
    usdVolume: latestDayUsd,
    runeVolume: latestDay !== null ? pools.reduce((sum, pool) => sum + pool.runeVolume, 0) : null,
    usdAvg7d,
    deltaPct,
    deltaLabel: formatDelta(deltaPct),
    usdAvgLabel: formatCompactUsd(usdAvg7d),
    usdVolumeLabel: formatCompactUsd(latestDayUsd),
    pools,
    topPools: pools.slice(0, 6),
  };
}
