'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MidgardAPI from '@/lib/api/midgard';
import { HistoryItem, NetworkStats } from '@/lib/types';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';

export default function StatsPage() {
  const [networkData, setNetworkData] = useState<NetworkStats | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [network, history] = await Promise.all([
          MidgardAPI.getNetworkData(),
          MidgardAPI.getHistory('day', 30),
        ]);
        if (!cancelled) {
          setNetworkData(network);
          setEarningsHistory(history);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching data:', error);
          setLoading(false);
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const apiError = !networkData;
  const runePooled = networkData ? parseInt(networkData.totalPooledRune) / 1e8 : 0;
  const bondingApy = networkData ? parseFloat(networkData.bondingAPY) * 100 : 0;
  const earningsChart = earningsHistory.map(d => ({
    name: new Date(parseInt(d.startTime) * 1000).toLocaleDateString(),
    earnings: parseInt(d.earnings || '0') / 1e8,
    nodeOps: parseInt(d.bondingEarnings || '0') / 1e8,
    lps: parseInt(d.liquidityEarnings || '0') / 1e8,
  })).reverse();

  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Network Statistics</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Real-time THORChain network metrics from Midgard v2 API</p>
          {apiError && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
              ⚠ Live data is currently unavailable. The Midgard API may be down. Charts and stats will appear once the connection is restored.
            </div>
          )}
        </div>

        {networkData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400"><Activity className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pooled RUNE</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{runePooled.toLocaleString()} RUNE</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-green-600 dark:text-green-400"><TrendingUp className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Bonding APY</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{bondingApy.toFixed(2)}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-purple-600 dark:text-purple-400"><Zap className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Nodes</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{networkData.activeNodeCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-orange-600 dark:text-orange-400"><TrendingDown className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reserve RUNE</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{(parseInt(networkData.totalReserve) / 1e8).toLocaleString()} RUNE</p>
            </div>
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Earnings History (30 days)</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
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
              <p className="text-gray-500 text-center py-20">No earnings history data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
