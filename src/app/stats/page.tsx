'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useNetworkData, useEarningsHistory } from '@/lib/hooks/useMidgard';

export default function StatsPage() {
  const { data: networkData, error: networkError, isLoading: networkLoading } = useNetworkData();
  const { data: earningsData, error: earningsError, isLoading: earningsLoading } = useEarningsHistory('day', 30);

  const isLoading = networkLoading || earningsLoading;
  const hasError = networkError || earningsError || !networkData;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-[52px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  const runePooled = networkData ? parseInt(networkData.totalPooledRune) / 1e8 : 0;
  const bondingApy = networkData ? parseFloat(networkData.bondingAPY) * 100 : 0;
  const earningsChart = (earningsData || []).map(d => ({
    name: new Date(parseInt(d.startTime) * 1000).toLocaleDateString(),
    earnings: parseInt(d.earnings || '0') / 1e8,
    nodeOps: parseInt(d.bondingEarnings || '0') / 1e8,
    lps: parseInt(d.liquidityEarnings || '0') / 1e8,
  })).reverse();

  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Network Statistics</h1>
        <p className="text-slate-400 max-w-3xl">Real-time THORChain network metrics from Midgard v2 API</p>
        {hasError && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
            ⚠ Live data is currently unavailable. The Midgard API may be down. Charts and stats will appear once the connection is restored.
          </div>
        )}
      </div>

      {!hasError && networkData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          <div className="bg-surface-elevated border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-accent mb-3">
              <Activity className="h-4 w-4" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Pooled RUNE</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{runePooled.toLocaleString()} RUNE</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-accent mb-3">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Bonding APY</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{bondingApy.toFixed(2)}%</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-accent mb-3">
              <Zap className="h-4 w-4" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Active Nodes</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{networkData.activeNodeCount}</p>
          </div>
          <div className="bg-surface-elevated border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 text-accent mb-3">
              <TrendingDown className="h-4 w-4" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">Reserve RUNE</span>
            </div>
            <p className="text-2xl font-bold tracking-tight">{(parseInt(networkData.totalReserve) / 1e8).toLocaleString()} RUNE</p>
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Earnings History (30 days)</h2>
        <div className="bg-surface-elevated border border-border rounded-lg p-6">
          {earningsChart.length > 0 ? (
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
          ) : (
            <p className="text-slate-500 text-center py-20">No earnings history data available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
