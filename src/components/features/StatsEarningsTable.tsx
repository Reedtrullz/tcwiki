'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LiveDataResult, MidgardHealth } from '@/lib/types';
import type { StatsEarningsCoverage, StatsEarningsRow } from '@/lib/stats-dashboard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';

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

function formatRuneMetric(value: number | null) {
  return value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRuneAmount(value: number | null) {
  return value === null ? 'Unavailable' : formatRuneMetric(value) + ' RUNE';
}

function chartNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export interface StatsEarningsTableProps {
  earningsChart: StatsEarningsRow[];
  earningsLoading: boolean;
  earningsResult?: LiveDataResult<unknown[]>;
  midgardHealthResult?: LiveDataResult<MidgardHealth>;
  earningsCoverage: StatsEarningsCoverage;
}

export function StatsEarningsTable({
  earningsChart,
  earningsLoading,
  earningsResult,
  midgardHealthResult,
  earningsCoverage,
}: StatsEarningsTableProps) {
  const {
    availableIntervals,
    unavailableIntervals,
    totalEarnings,
    recentSevenEarnings,
    summary: earningsSummary,
    recentRows,
    recentIntervalCount,
    recentAvailableIntervals,
    recentUnavailableIntervals,
  } = earningsCoverage;

  const recentWindowDetail = recentIntervalCount > 0
    ? recentUnavailableIntervals > 0
      ? recentAvailableIntervals + '/' + recentIntervalCount + ' intervals with values; ' + recentUnavailableIntervals + ' unavailable'
      : recentAvailableIntervals + '/' + recentIntervalCount + ' intervals with values'
    : earningsLoading ? 'Loading intervals' : 'No intervals loaded';
  const earningsCoverageIsPartial = unavailableIntervals > 0;
  const recentWindowIsPartial = recentUnavailableIntervals > 0;
  const loadedIntervalTotalDetail = earningsChart.length > 0
    ? earningsCoverageIsPartial
      ? availableIntervals + '/' + earningsChart.length + ' loaded intervals with totals; ' + unavailableIntervals + ' unavailable'
      : availableIntervals + '/' + earningsChart.length + ' loaded intervals with totals'
    : earningsLoading ? 'Loading intervals' : 'No intervals loaded';

  return (
    <section id="earnings-history" className="mb-12">
      <SectionHeader level="primary">Earnings History</SectionHeader>
      <p id="earnings-history-summary" className="mb-3 text-sm text-slate-400">
        {earningsSummary}
      </p>
      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Usable intervals</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{availableIntervals}/{earningsChart.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">Unavailable intervals</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{earningsLoading && earningsChart.length === 0 ? 'Loading' : unavailableIntervals}</p>
        </Card>
        <Card padding="sm" className={recentWindowIsPartial ? 'border-amber-500/25 bg-amber-500/5' : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Latest valid-window total</p>
            {recentWindowIsPartial && <Badge variant="warning">Partial window</Badge>}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneAmount(recentSevenEarnings)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{recentWindowDetail}</p>
        </Card>
        <Card padding="sm" className={earningsCoverageIsPartial ? 'border-amber-500/25 bg-amber-500/5' : undefined}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Valid loaded-interval total</p>
            {earningsCoverageIsPartial && <Badge variant="warning">Partial total</Badge>}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneAmount(totalEarnings)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{loadedIntervalTotalDetail}</p>
        </Card>
      </div>
      <div className="mb-3">
        <LiveSourceMeta result={earningsResult} healthResult={midgardHealthResult} />
      </div>
      <Card padding="lg" aria-describedby="earnings-history-summary">
        {earningsLoading && earningsChart.length === 0 ? (
          <div role="status" aria-live="polite" className="flex min-h-[240px] items-center justify-center text-sm text-slate-400">
            Loading earnings history from Midgard...
          </div>
        ) : earningsChart.length > 0 ? (
          <>
            <div className="h-[300px] md:h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsChart} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.01 250)" />
                  <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={{ stroke: 'oklch(0.25 0.01 250)' }} />
                  <YAxis
                    tick={chartAxisTick}
                    tickLine={false}
                    axisLine={{ stroke: 'oklch(0.25 0.01 250)' }}
                    tickFormatter={(value) => formatRuneMetric(chartNumber(value))}
                  />
                  <Tooltip
                    contentStyle={chartTooltipContentStyle}
                    labelStyle={chartTooltipLabelStyle}
                    formatter={(value, name) => [formatRuneAmount(chartNumber(value)), name]}
                  />
                  <Legend wrapperStyle={{ color: 'oklch(0.78 0.01 250)', fontSize: 12 }} />
                  <Line type="monotone" dataKey="earnings" stroke="oklch(0.7 0.18 190)" strokeWidth={2} dot={false} name="Total Earnings (RUNE)" />
                  <Line type="monotone" dataKey="nodeOps" stroke="oklch(0.65 0.15 290)" strokeWidth={2} dot={false} name="Node Operator Earnings" />
                  <Line type="monotone" dataKey="lps" stroke="oklch(0.75 0.15 160)" strokeWidth={2} dot={false} name="LP Earnings" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 md:hidden" aria-labelledby="recent-earnings-intervals">
              <h3 id="recent-earnings-intervals" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recent Daily Earnings Intervals
              </h3>
              <div role="list" aria-label="Recent daily earnings intervals" className="mt-2 divide-y divide-border border-y border-border">
                {recentRows.map((row) => (
                  <div role="listitem" key={row.id} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-200">{row.name}</p>
                      <p className="text-right text-sm font-semibold text-slate-100">{formatRuneAmount(row.earnings)}</p>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                      <div>
                        <dt>Node operators</dt>
                        <dd className="text-slate-200">{formatRuneAmount(row.nodeOps)}</dd>
                      </div>
                      <div>
                        <dt>LPs</dt>
                        <dd className="text-slate-200">{formatRuneAmount(row.lps)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[520px] text-left text-xs text-slate-400">
                <caption className="sr-only">Loaded Midgard daily earnings intervals</caption>
                <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="py-2 pr-4">Date</th>
                    <th scope="col" className="py-2 pr-4">Total RUNE</th>
                    <th scope="col" className="py-2 pr-4">Node operators</th>
                    <th scope="col" className="py-2 pr-4">LPs</th>
                  </tr>
                </thead>
                <tbody>
                  {earningsChart.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4">{row.earnings?.toLocaleString() ?? 'Unavailable'}</td>
                      <td className="py-2 pr-4">{row.nodeOps?.toLocaleString() ?? 'Unavailable'}</td>
                      <td className="py-2 pr-4">{row.lps?.toLocaleString() ?? 'Unavailable'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-slate-400 text-center py-20">Earnings history unavailable from live sources.</p>
        )}
      </Card>
    </section>
  );
}
