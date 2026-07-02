'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useNetworkData, useEarningsHistory, useNetworkStatus, useMidgardHealth } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatCard } from '@/components/ui/StatCard';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { formatPercent, formatRuneFromBaseUnits, normalizeApyToPercent, runeBaseUnitsToNumber } from '@/lib/trust';

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

  const isLoading = networkLoading || earningsLoading;
  const networkHasError = networkError || networkDegraded || !networkData;
  const earningsHasError = earningsError || earningsDegraded;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[52px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const runePooled = networkData ? formatRuneFromBaseUnits(networkData.totalPooledRune) : 'Unavailable';
  const bondingApy = networkData ? formatPercent(normalizeApyToPercent(networkData.bondingAPY, 'decimal')) : 'Unavailable';
  const reserveRune = networkData ? formatRuneFromBaseUnits(networkData.totalReserve) : 'Unavailable';
  const earningsChart = (earningsData || []).map(d => ({
    name: new Date(parseInt(d.startTime) * 1000).toLocaleDateString(),
    earnings: runeBaseUnitsToNumber(d.earnings),
    nodeOps: runeBaseUnitsToNumber(d.bondingEarnings),
    lps: runeBaseUnitsToNumber(d.liquidityEarnings),
  })).reverse();
  const availableIntervals = earningsChart.filter((row) => row.earnings !== null).length;
  const earningsSummary = earningsChart.length > 0
    ? `Showing ${earningsChart.length} Midgard daily earnings intervals; ${availableIntervals} include a valid total earnings value.`
    : 'No Midgard daily earnings intervals are available.';

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Network Statistics</h1>
        <p className="text-slate-400 max-w-3xl">Current-only THORChain metrics from Midgard and THORNode. Unavailable upstream data is shown as degraded, not zero.</p>
        {(networkHasError || earningsHasError) && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
            Live data is degraded. {networkError || earningsError || 'One or more sources did not respond.'}
          </div>
        )}
      </div>

      <div className="mb-8">
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} />
      </div>

      {!networkHasError && networkData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          <StatCard icon={<Activity className="h-4 w-4" />} label="Pooled RUNE" value={runePooled} unit="RUNE" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Bonding APY" value={bondingApy} />
          <StatCard icon={<Zap className="h-4 w-4" />} label="Active Nodes" value={networkData.activeNodeCount} />
          <StatCard icon={<TrendingDown className="h-4 w-4" />} label="Reserve RUNE" value={reserveRune} unit="RUNE" />
        </div>
      )}
      <div className="mb-12">
        <LiveSourceMeta result={networkResult} healthResult={midgardHealthResult} />
      </div>

      <div className="mb-12">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Earnings History (30 days)</h2>
        <p id="earnings-history-summary" className="mb-3 text-sm text-slate-500">
          {earningsSummary}
        </p>
        <div className="mb-3">
          <LiveSourceMeta result={earningsResult} healthResult={midgardHealthResult} />
        </div>
        <div className="bg-surface-elevated border border-border rounded-lg p-6" aria-describedby="earnings-history-summary">
          {earningsChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
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
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs text-slate-500">
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
                      <tr key={row.name} className="border-t border-border">
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
            <p className="text-slate-500 text-center py-20">Earnings history unavailable from live sources.</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
