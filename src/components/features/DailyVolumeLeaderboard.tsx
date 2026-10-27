'use client';

import { useMemo } from 'react';
import { useDailyVolume } from '@/lib/hooks/useMidgard';
import { DAILY_VOLUME_POOLS, deriveDailyVolumeSummary, type DailyVolumePool } from '@/lib/daily-volume';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';

const BAR_TONES = [
  'bg-sky-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-emerald-500',
  'bg-emerald-500',
  'bg-emerald-500',
];

function deltaTone(deltaPct: number | null) {
  if (deltaPct === null) {
    return 'text-slate-400';
  }
  return deltaPct >= 0 ? 'text-emerald-400' : 'text-red-400';
}

function PoolRow({ pool, rank, maxUsd }: { pool: DailyVolumePool; rank: number; maxUsd: number }) {
  const width = maxUsd > 0 ? Math.max((pool.usdVolume / maxUsd) * 100, 2) : 0;
  return (
    <li className="grid grid-cols-[2rem_4.5rem_1fr] items-center gap-x-3 gap-y-1 px-5 py-4 sm:grid-cols-[2rem_8rem_1fr]">
      <span className="text-sm font-bold text-sky-400">{rank}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-slate-100">{pool.label}</p>
        <p className="truncate text-[11px] text-slate-500">{pool.shortId}</p>
      </div>
      <div className="col-span-3 grid grid-cols-[1fr_auto] items-center gap-x-4 sm:col-span-1 sm:grid-cols-[1fr_auto_auto]">
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full ${BAR_TONES[rank - 1] ?? 'bg-emerald-500'}`} style={{ width: `${width}%` }} />
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-100">{pool.usdVolumeLabel}</p>
          <p className="text-[11px] font-semibold text-emerald-400">{pool.shareLabel}</p>
        </div>
      </div>
    </li>
  );
}

export function DailyVolumeLeaderboard() {
  const { data, networkResult, result, error, isLoading, isDegraded, refresh } = useDailyVolume();

  const summary = useMemo(
    () => deriveDailyVolumeSummary(
      (data ?? []).map((entry, index) => ({
        asset: DAILY_VOLUME_POOLS[index] ?? '',
        result: entry,
      })),
      undefined,
      networkResult
    ),
    [data, networkResult]
  );

  const topPools = summary.topPools;
  const maxUsd = topPools[0]?.usdVolume ?? 0;
  const unavailable = !isLoading && (!data || topPools.length === 0);

  return (
    <section id="daily-volume-leaderboard" aria-labelledby="daily-volume-leaderboard-heading" className="mb-12">
      <SectionHeader id="daily-volume-leaderboard-heading" level="primary">Daily Volume Leaderboard</SectionHeader>
      <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
        Network volume uses Midgard’s all-pool aggregate for the last completed UTC day. The ranking covers six selected pools; shares and comparisons use only the included selected pools.
      </p>
      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Network daily volume</p>
            <p className="mt-1 text-4xl font-black tracking-tight text-emerald-400 sm:text-5xl">
              {isLoading ? 'Loading' : summary.networkUsdVolumeLabel}
            </p>
            <p className="mt-2 text-xs text-slate-400">Selected-pool subtotal: {summary.usdVolumeLabel}</p>
            <LiveSourceMeta result={networkResult} />
          </div>
          <div className="flex flex-col items-end gap-2">
            {!isLoading && summary.deltaLabel && (
              <span className={`text-sm font-bold ${deltaTone(summary.deltaPct)}`}>
                {summary.deltaLabel} selected pools vs {summary.comparisonDays}d avg
              </span>
            )}
            <span className="text-xs text-slate-500">{summary.comparisonDays}/7 comparison days · avg {summary.usdAvgLabel}</span>
            <LiveSourceMeta result={result} onRefresh={refresh} />
          </div>
          {isDegraded && !isLoading && (
            <p className="w-full text-xs text-amber-300">
              Some histories did not load; included pools and their providers are listed below.
            </p>
          )}
          {error && !isLoading && (
            <p className="w-full text-xs text-red-300">Daily volume history did not load: {error}</p>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-2 text-[11px] uppercase tracking-wider text-slate-500">
          <span>{summary.periodLabel} &middot; top pools</span>
          <span>Share of selected subtotal</span>
        </div>
        <details className="border-b border-border px-5 py-3 text-xs text-slate-400">
          <summary className="cursor-pointer">Selected-pool coverage: {summary.pools.length}/{DAILY_VOLUME_POOLS.length} included · {summary.periodLabel}</summary>
          <ul className="mt-3 space-y-3">
            {summary.coverage.map(entry => <li key={entry.asset}>
              <p>{entry.asset}: {entry.reason}</p>
              <LiveSourceMeta result={entry.result} />
            </li>)}
          </ul>
        </details>
        <ol>
          {unavailable ? (
            <li className="px-5 py-6 text-sm text-slate-400">Volume rankings are unavailable right now.</li>
          ) : (
            topPools.map((pool, index) => (
              <PoolRow key={pool.asset} pool={pool} rank={index + 1} maxUsd={maxUsd} />
            ))
          )}
        </ol>
      </Card>
    </section>
  );
}
