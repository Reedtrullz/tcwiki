'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MidgardAPI from '@/lib/api/midgard';
import { HistoryItem, Pool, Node } from '@/lib/types';
import { Activity, TrendingUp, TrendingDown, Zap, Wallet, RefreshCw } from 'lucide-react';

export default function StatsPage() {
  const [networkData, setNetworkData] = useState<HistoryItem[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [history, poolsData, nodesData] = await Promise.all([
          MidgardAPI.getHistory('day', 30),
          MidgardAPI.getPools(),
          MidgardAPI.getNodes(),
        ]);
        setNetworkData(history);
        setPools(poolsData);
        setNodes(nodesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const latestData = networkData[0];
  const tvlData = networkData.map(d => ({
    name: new Date(d.time).toLocaleDateString(),
    tvl: parseFloat(d.totalValueLocked?.replace(/[$,]/g, '') || '0'),
    volume: parseFloat(d.totalVolume24hUSD?.replace(/[$,]/g, '') || '0'),
  }));

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Network Statistics
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Real-time THORChain network metrics and performance data
          </p>
        </div>

        {latestData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400">
                <Wallet className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Value Locked
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {latestData.totalValueLocked || '$0'}
              </p>
              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                {parseFloat(latestData.totalValueLocked?.replace(/[$,]/g, '') || '0') > parseFloat(networkData[1]?.totalValueLocked?.replace(/[$,]/g, '') || '0') ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                )}
                <span className="ml-1">vs previous period</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-green-600 dark:text-green-400">
                <Activity className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  24h Volume
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {latestData.totalVolume24hUSD || '$0'}
              </p>
              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">
                {parseFloat(latestData.totalVolume24hUSD?.replace(/[$,]/g, '') || '0') > parseFloat(networkData[1]?.totalVolume24hUSD?.replace(/[$,]/g, '') || '0') ? (
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1 text-red-500" />
                )}
                <span className="ml-1">vs previous period</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-purple-600 dark:text-purple-400">
                <Zap className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Active Pools
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {latestData.poolCount?.toLocaleString() || '0'}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {latestData.swapCount?.toLocaleString()} swaps in last 24h
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-orange-600 dark:text-orange-400">
                <RefreshCw className="h-6 w-6 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Block Height
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {latestData.blockHeight?.toLocaleString() || 'N/A'}
              </p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Current THORChain block number
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Historical TVL & Volume
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={tvlData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontSize: 12 }}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                  labelStyle={{ fill: '#e2e8f0' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="tvl"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="TVL (USD)"
                  unit="$"
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Volume (USD)"
                  unit="$"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Top Liquidity Pools
            </h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Pool
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Liquidity (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      24h Volume (USD)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      LP Units
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      APR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pools.slice(0, 20).map((pool) => (
                    <tr
                      key={pool.asset}
                      className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {pool.asset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {pool.liquidityUSD}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {pool.volume24hUSD}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {pool.units}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={pool.apy > 0 ? 'text-green-600' : 'text-red-600'}>
                          {pool.apy?.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Active Nodes
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {nodes.filter(n => n.isActive).length} of {nodes.length} active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodes.slice(0, 15).map((node) => (
              <div
                key={node.address}
                className={`bg-white dark:bg-gray-800 rounded-lg p-4 border ${node.isActive ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={node.address}>
                    {node.address.slice(0, 12)}...
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${node.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {node.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bond:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{node.bond}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{node.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Version:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{node.version}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}