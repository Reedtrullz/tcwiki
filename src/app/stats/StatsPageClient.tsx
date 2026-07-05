'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useNetworkData, useEarningsHistory, useNetworkStatus, useMidgardHealth } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { StatCard } from '@/components/ui/StatCard';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { Badge } from '@/components/ui/Badge';
import {
  deriveStatsDecisionFacts,
  deriveStatsEarningsCoverage,
  deriveStatsEarningsRows,
  deriveStatsMetricCards,
  type StatsDecisionFact,
  type StatsMetricCard,
} from '@/lib/stats-dashboard';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';

const statsRelatedChecks: RelatedCheck[] = [
  {
    label: 'Source map',
    href: '/docs#current-protocol-state',
    badge: 'proof boundary',
    description: 'Check what Midgard and THORNode snapshots can support before making a current-state claim.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'operations',
    description: 'Paused trading, signing, observation, or LP controls can decide whether loaded metrics are actionable.',
  },
  {
    label: 'Dynamic fees',
    href: '/dynamic-fees#dynamic-fees-live',
    badge: 'fees',
    description: 'Use the ADR-026 tracker when fee questions are about partner-pair floors rather than ordinary earnings.',
  },
  {
    label: 'Build/query path',
    href: '/search?q=Midgard%20API&filter=task',
    badge: 'search',
    description: 'Jump to the task guide for using Midgard, THORNode, inbound-address, and Mimir endpoint data.',
  },
];

function toneToBadgeVariant(tone: StatsDecisionFact['tone']) {
  return tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'info';
}

function formatRuneMetric(value: number | null) {
  return value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function metricIcon(id: StatsMetricCard['id']) {
  switch (id) {
    case 'pooledRune':
      return <Activity className="h-4 w-4" />;
    case 'bondingApy':
      return <TrendingUp className="h-4 w-4" />;
    case 'activeNodes':
      return <Zap className="h-4 w-4" />;
    case 'reserveRune':
      return <TrendingDown className="h-4 w-4" />;
  }
}

export default function StatsPage() {
  const {
    data: networkData,
    result: networkResult,
    error: networkError,
    isLoading: networkLoading,
    isDegraded: networkDegraded,
  } = useNetworkData();
  const {
    data: earningsData,
    result: earningsResult,
    error: earningsError,
    isLoading: earningsLoading,
    isDegraded: earningsDegraded,
  } = useEarningsHistory('day', 30);
  const { result: midgardHealthResult } = useMidgardHealth();
  const { result: statusResult, isLoading: statusLoading } = useNetworkStatus();

  const networkHasError = !networkLoading && (networkError || networkDegraded || !networkData);
  const earningsHasError = !earningsLoading && (earningsError || earningsDegraded);

  const networkFallbackValue = networkLoading ? 'Loading' : 'Unavailable';
  const metricCards = deriveStatsMetricCards(networkData, networkFallbackValue);
  const earningsChart = deriveStatsEarningsRows(earningsData);
  const earningsCoverage = deriveStatsEarningsCoverage(earningsChart, earningsLoading);
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
      ? `${recentAvailableIntervals}/${recentIntervalCount} intervals with values; ${recentUnavailableIntervals} unavailable`
      : `${recentAvailableIntervals}/${recentIntervalCount} intervals with values`
    : earningsLoading ? 'Loading intervals' : 'No intervals loaded';
  const decisionFacts = deriveStatsDecisionFacts({
    networkLoading,
    earningsLoading,
    networkResult,
    earningsResult,
    midgardHealthResult,
    statusResult,
    earningsIntervals: earningsChart.length,
    earningsIntervalsWithValues: availableIntervals,
  });

  return (
    <>
      {(networkHasError || earningsHasError) && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
          Live data is degraded. {networkError || earningsError || 'One or more sources did not respond.'}
        </div>
      )}

      <section id="stats-look-here-first" className="mb-8 scroll-mt-24">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Look Here First</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {decisionFacts.map((fact) => (
            <div key={fact.label} className="rounded-lg border border-border bg-surface-elevated p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fact.label}</p>
                <Badge variant={toneToBadgeVariant(fact.tone)}>{fact.value}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{fact.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <RelatedChecks checks={statsRelatedChecks} className="mb-8" />

      <div className="mb-8">
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} variant="compact" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {metricCards.map((metric) => (
          <StatCard
            key={metric.id}
            icon={metricIcon(metric.id)}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            description={metric.description}
          />
        ))}
      </div>
      <div className="mb-12">
        <LiveSourceMeta result={networkResult} healthResult={midgardHealthResult} />
      </div>

      <div className="mb-12">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Earnings History (30 days)</h2>
        <p id="earnings-history-summary" className="mb-3 text-sm text-slate-400">
          {earningsSummary}
        </p>
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Usable intervals</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{availableIntervals}/{earningsChart.length}</p>
          </div>
          <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Unavailable intervals</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{earningsLoading && earningsChart.length === 0 ? 'Loading' : unavailableIntervals}</p>
          </div>
          <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Latest 7 interval total</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneMetric(recentSevenEarnings)} RUNE</p>
            <p className="mt-1 text-[11px] text-slate-500">{recentWindowDetail}</p>
          </div>
          <div className="rounded-md border border-border bg-surface-elevated px-3 py-2">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">30-day valid total</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneMetric(totalEarnings)} RUNE</p>
          </div>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Earnings history is a Midgard-sourced current readback of available intervals. Use it to inspect recent distribution shape, not as durable revenue proof or protocol-attribution proof.
        </p>
        <div className="mb-3">
          <LiveSourceMeta result={earningsResult} healthResult={midgardHealthResult} />
        </div>
        <div className="bg-surface-elevated border border-border rounded-lg p-6" aria-describedby="earnings-history-summary">
          {earningsLoading && earningsChart.length === 0 ? (
            <div role="status" aria-live="polite" className="flex min-h-[240px] items-center justify-center text-sm text-slate-400">
              Loading earnings history from Midgard...
            </div>
          ) : earningsChart.length > 0 ? (
            <>
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Earnings (RUNE)" />
                    <Line type="monotone" dataKey="nodeOps" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Node Operator Earnings" />
                    <Line type="monotone" dataKey="lps" stroke="#10b981" strokeWidth={2} dot={false} name="LP Earnings" />
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
                        <p className="text-right text-sm font-semibold text-slate-100">{formatRuneMetric(row.earnings)} RUNE</p>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                        <div>
                          <dt>Node operators</dt>
                          <dd className="text-slate-200">{formatRuneMetric(row.nodeOps)} RUNE</dd>
                        </div>
                        <div>
                          <dt>LPs</dt>
                          <dd className="text-slate-200">{formatRuneMetric(row.lps)} RUNE</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[520px] text-left text-xs text-slate-400">
                  <caption className="sr-only">Thirty day earnings history from Midgard</caption>
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
        </div>
      </div>
    </>
  );
}
