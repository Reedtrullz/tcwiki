'use client';

import Link from 'next/link';
import { Search, X, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatsPoolExplorerFilters, StatsPoolRow, StatsPoolSortKey } from '@/lib/stats-dashboard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ResponsiveVisibility } from '@/components/ui/ResponsiveVisibility';

const chartTooltipContentStyle = {
  backgroundColor: 'oklch(0.15 0.01 250)',
  border: '1px solid oklch(0.25 0.01 250)',
  borderRadius: 8,
  color: 'oklch(0.85 0.01 250)',
};

const chartTooltipLabelStyle = {
  color: 'oklch(0.78 0.01 250)',
  fontWeight: 600,
};

const chartAxisTick = {
  fill: 'oklch(0.65 0.01 250)',
  fontSize: 11,
};

const poolSortOptions: Array<{ value: StatsPoolSortKey; label: string }> = [
  { value: 'runeDepth', label: 'RUNE depth' },
  { value: 'volume24hRune', label: '24h volume (RUNE)' },
  { value: 'liquidityUsd', label: 'Liquidity' },
  { value: 'apyPercent', label: 'APY' },
  { value: 'asset', label: 'Asset' },
];

function formatRuneMetric(value: number | null) {
  return value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRuneAmount(value: number | null) {
  return value === null ? 'Unavailable' : formatRuneMetric(value) + ' RUNE';
}

function poolStatusVariant(status: string) {
  return status.toLowerCase() === 'available' ? 'success' : 'warning';
}

function formatPoolAxisTick(value: unknown) {
  const text = String(value);
  return text.length > 18 ? text.slice(0, 15) + '...' : text;
}

function chartNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function poolEmptyMessage(filters: StatsPoolExplorerFilters) {
  const query = filters.query.trim();
  const chain = filters.chain !== 'all' ? filters.chain : '';
  const status = filters.status !== 'all' ? filters.status : '';

  if (query && chain) {
    return 'No pools match "' + query + '" on ' + chain + '.';
  }
  if (query) {
    return 'No pools match "' + query + '".';
  }
  if (chain && status) {
    return 'No ' + status + ' pools are loaded on ' + chain + '.';
  }
  if (chain) {
    return 'No pools are loaded on ' + chain + '.';
  }
  if (status) {
    return 'No ' + status + ' pools are loaded.';
  }
  return 'No pools match the current filters.';
}

function formatPoolHighlight(row: StatsPoolRow | undefined, value: string | undefined) {
  return row && value ? row.asset + ' (' + value + ')' : 'Unavailable';
}

export interface StatsPoolExplorerProps {
  poolSnapshotSummary: string;
  poolSnapshotDeepestPool: StatsPoolRow | undefined;
  poolSnapshotHighestVolumePool: StatsPoolRow | undefined;
  poolRowsValue: string;
  poolChainCountValue: string;
  explorerRows: StatsPoolRow[];
  chartRows: StatsPoolRow[];
  totalRows: number;
  summary: string;
  activeFilterLabels: string[];
  poolFilters: StatsPoolExplorerFilters;
  updatePoolFilters: (partial: Partial<StatsPoolExplorerFilters>) => void;
  resetPoolFilters: (nextFilters: StatsPoolExplorerFilters) => void;
  poolAvailableChains: string[];
  poolAvailableStatuses: string[];
  poolsLoading: boolean;
}

export function StatsPoolExplorer({
  poolSnapshotSummary,
  poolSnapshotDeepestPool,
  poolSnapshotHighestVolumePool,
  poolRowsValue,
  poolChainCountValue,
  explorerRows,
  chartRows,
  totalRows,
  summary,
  activeFilterLabels,
  poolFilters,
  updatePoolFilters,
  resetPoolFilters,
  poolAvailableChains,
  poolAvailableStatuses,
  poolsLoading,
}: StatsPoolExplorerProps) {
  const hasPoolData = totalRows > 0;

  return (
    <section id="available-pools" className="mb-12 scroll-mt-24">
      <SectionHeader level="primary">Midgard Available-Pool Rows</SectionHeader>
      <p id="available-pools-summary" className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
        {poolSnapshotSummary} This is liquidity context from Midgard, not proof that a specific route will quote or settle.
      </p>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Midgard pool rows</p>
          <p data-testid="stats-pool-row-count" className="mt-1 text-sm font-semibold text-slate-200">{poolRowsValue}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Chains in rows</p>
          <p data-testid="stats-pool-chain-count" className="mt-1 text-sm font-semibold text-slate-200">{poolChainCountValue}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Deepest pool</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-200">
            {formatPoolHighlight(poolSnapshotDeepestPool, poolSnapshotDeepestPool?.runeDepthLabel)}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Highest 24h RUNE volume</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-200">
            {formatPoolHighlight(poolSnapshotHighestVolumePool, poolSnapshotHighestVolumePool?.volume24hRuneLabel)}
          </p>
        </Card>
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 max-w-3xl text-sm leading-relaxed text-slate-400">
          Pool rows show liquidity context. A current route still needs a THORNode quote, source freshness, and network diagnostics.
        </p>
        <Link
          href="/network#check-a-route"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-accent/40 px-3 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
        >
          <Zap className="h-4 w-4" aria-hidden="true" />
          Check a route
        </Link>
      </div>
      <Card padding="lg" aria-describedby="available-pools-summary">
        {poolsLoading && !hasPoolData ? (
          <div role="status" aria-live="polite" className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
            Loading Midgard available-pool rows...
          </div>
        ) : hasPoolData ? (
          <div className="grid gap-6">
            <div className="rounded-lg border border-border bg-surface/60 p-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem_auto]">
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Search pools
                  <span className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Filter Midgard available-pool rows"
                      value={poolFilters.query}
                      onChange={(event) => updatePoolFilters({ query: event.target.value })}
                      placeholder="BTC, ETH, USDC, available..."
                      className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                    />
                  </span>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Chain
                  <select
                    aria-label="Pool chain"
                    value={poolFilters.chain}
                    onChange={(event) => updatePoolFilters({ chain: event.target.value })}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                  >
                    <option value="all">All chains</option>
                    {poolAvailableChains.map((chain) => (
                      <option key={chain} value={chain}>{chain}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Status
                  <select
                    aria-label="Pool status"
                    value={poolFilters.status}
                    onChange={(event) => updatePoolFilters({ status: event.target.value })}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                  >
                    <option value="all">All statuses</option>
                    {poolAvailableStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Sort
                  <select
                    aria-label="Pool sort"
                    value={poolFilters.sort}
                    onChange={(event) => updatePoolFilters({ sort: event.target.value as StatsPoolSortKey })}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                  >
                    {poolSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => resetPoolFilters({ query: '', chain: 'all', status: 'all', sort: 'runeDepth' })}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-slate-300 transition hover:border-accent hover:text-accent lg:w-auto"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Reset pool filters
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <p className="text-xs font-medium text-slate-400">{summary}</p>
                {activeFilterLabels.map((label) => (
                  <Badge key={label} variant="info">{label}</Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Top Pools By RUNE Depth</h3>
                {chartRows.length > 0 ? (
                  <div className="mt-3 h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="asset"
                          type="category"
                          width={82}
                          tick={chartAxisTick}
                          tickFormatter={formatPoolAxisTick}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={chartTooltipContentStyle}
                          labelStyle={chartTooltipLabelStyle}
                          formatter={(value) => [formatRuneAmount(chartNumber(value)), 'RUNE depth']}
                        />
                        <Bar dataKey="runeDepth" fill="oklch(0.75 0.15 85)" radius={[0, 4, 4, 0]} name="RUNE depth" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-border bg-surface p-4 text-sm text-slate-400">
                    Pool depth chart unavailable because the current filter set has no usable depth values.
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Loaded Row List</h3>
                {explorerRows.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-border bg-surface p-4 text-sm text-slate-400">
                    {poolEmptyMessage(poolFilters)}
                  </p>
                ) : (
                  <>
                    <ResponsiveVisibility mobile className="mt-3">
                      <div role="list" aria-label="Midgard available-pool rows">
                      {explorerRows.map((pool) => (
                        <div key={pool.id} role="listitem" className="border-t border-border py-3 first:border-t-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-all text-sm font-semibold text-slate-200">{pool.asset}</p>
                              <p className="mt-1 text-xs text-slate-500">{pool.chain}</p>
                            </div>
                            <Badge variant={poolStatusVariant(pool.status)}>{pool.status}</Badge>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-400">
                            <div>
                              <dt>RUNE depth</dt>
                              <dd className="text-slate-200">{pool.runeDepthLabel}</dd>
                            </div>
                            <div>
                              <dt>Liquidity</dt>
                              <dd className="text-slate-200">{pool.liquidityUsdLabel}</dd>
                            </div>
                            <div>
                              <dt>24h volume (RUNE)</dt>
                              <dd className="text-slate-200">{pool.volume24hRuneLabel}</dd>
                            </div>
                            <div>
                              <dt>APY</dt>
                              <dd className="text-slate-200">{pool.apyLabel}</dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                      </div>
                    </ResponsiveVisibility>
                    <ResponsiveVisibility desktop className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-xs text-slate-400">
                        <caption className="sr-only">Midgard available-pool rows snapshot</caption>
                        <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                          <tr>
                            <th scope="col" className="py-2 pr-4">Pool</th>
                            <th scope="col" className="py-2 pr-4">Chain</th>
                            <th scope="col" className="py-2 pr-4">RUNE depth</th>
                            <th scope="col" className="py-2 pr-4">Liquidity</th>
                            <th scope="col" className="py-2 pr-4">24h volume (RUNE)</th>
                            <th scope="col" className="py-2 pr-4">APY</th>
                          </tr>
                        </thead>
                        <tbody>
                          {explorerRows.map((pool) => (
                            <tr key={pool.id} className="border-t border-border">
                              <td className="py-2 pr-4 font-semibold text-slate-200">
                                <span className="mr-2 break-all">{pool.asset}</span>
                                <Badge variant={poolStatusVariant(pool.status)}>{pool.status}</Badge>
                              </td>
                              <td className="py-2 pr-4">{pool.chain}</td>
                              <td className="py-2 pr-4">{pool.runeDepthLabel}</td>
                              <td className="py-2 pr-4">{pool.liquidityUsdLabel}</td>
                              <td className="py-2 pr-4">{pool.volume24hRuneLabel}</td>
                              <td className="py-2 pr-4">{pool.apyLabel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </ResponsiveVisibility>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-16 text-center text-slate-400">Midgard available-pool rows unavailable from live sources.</p>
        )}
      </Card>
    </section>
  );
}
