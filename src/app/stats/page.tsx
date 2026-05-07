'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MidgardAPI from '@/lib/api/midgard';
import { HistoryItem, Pool, Node } from '@/lib/types';
import { Activity, TrendingUp, TrendingDown, Zap, Wallet } from 'lucide-react';

export default function StatsPage() {
  const [networkData, setNetworkData] = useState<HistoryItem[]>([]);
  const [_pools, setPools] = useState<Pool[]>([]);
  const [_nodes, setNodes] = useState<Node[]>([]);
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
    // eslint-disable-next-line react-hooks/extra/no-direct-set-state-in-use-effect
    void fetchData();
    const interval = setInterval(() => { fetchData(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const latestData = networkData[0];
  const parseCurrency = (val?: string) => parseFloat(val?.replace(/[$,]/g, '') || '0');
  const tvlData = networkData.map(d => ({
    name: new Date(d.time).toLocaleDateString(),
    tvl: parseFloat(d.totalValueLocked?.replace(/[$,]/g, '') || '0'),
    volume: parseFloat(d.totalVolume24hUSD?.replace(/[$,]/g, '') || '0'),
  }));
  const runePriceData = networkData.map(d => ({
    name: new Date(d.time).toLocaleDateString(),
    price: parseFloat(d.runePriceUSD || '0'),
  }));

  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Network Statistics</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Real-time THORChain network metrics and performance data</p>
        </div>

        {latestData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400"><Wallet className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Value Locked</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{latestData.totalValueLocked || '$0'}</p>
              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">{parseCurrency(latestData.totalValueLocked) > parseCurrency(networkData[1]?.totalValueLocked) ? <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> : <TrendingDown className="h-4 w-4 mr-1 text-red-500" />}<span className="ml-1">vs previous period</span></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-green-600 dark:text-green-400"><Activity className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">24h Volume</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{latestData.totalVolume24hUSD || '$0'}</p>
              <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-400">{parseCurrency(latestData.totalVolume24hUSD) > parseCurrency(networkData[1]?.totalVolume24hUSD) ? <TrendingUp className="h-4 w-4 mr-1 text-green-500" /> : <TrendingDown className="h-4 w-4 mr-1 text-red-500" />}<span className="ml-1">vs previous period</span></div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-purple-600 dark:text-purple-400"><Zap className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Pools</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{latestData.poolCount?.toLocaleString() || '0'}</p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{latestData.swapCount?.toLocaleString()} swaps in 24h</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4 text-orange-600 dark:text-orange-400"><Activity className="h-6 w-6 mr-2" /><h3 className="text-lg font-semibold text-gray-900 dark:text-white">RUNE Price</h3></div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{latestData.runePriceUSD ? '$' + parseFloat(latestData.runePriceUSD).toFixed(3) : 'N/A'}</p>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Current RUNE USD price</div>
            </div>
          </div>
        )}

        <div className="mb-12"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">Historical TVL & Volume</h2></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <ResponsiveContainer width="100%" height={400}><AreaChart data={tvlData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Area type="monotone" dataKey="tvl" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="TVL" /><Area type="monotone" dataKey="volume" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Volume" /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        <div className="mb-12"><div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900 dark:text-white">RUNE Price History</h2></div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <ResponsiveContainer width="100%" height={400}><LineChart data={runePriceData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="price" stroke="#8b5cf6" strokeWidth={2} dot={false} name="RUNE Price USD" /></LineChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
