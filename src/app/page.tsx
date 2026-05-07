'use client';

import { useEffect, useState } from 'react';
import MidgardAPI from '@/lib/api/midgard';
import { NetworkStats, Pool } from '@/lib/types';
import { Activity, Network, Zap, Shield, Layers, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [networkData, setNetworkData] = useState<NetworkStats | null>(null);
  const [topPools, setTopPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [network, pools] = await Promise.all([
          MidgardAPI.getNetworkData(),
          MidgardAPI.getPools(),
        ]);
        setNetworkData(network);
        setTopPools(pools.slice(0, 10));
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

  const statCards = [
    {
      title: 'Total Value Locked',
      value: networkData?.totalValueLocked || '$0',
      icon: <Layers className="h-6 w-6" />,
      color: 'blue',
      link: '/stats',
    },
    {
      title: '24h Volume',
      value: networkData?.totalVolume24hUSD || '$0',
      icon: <Activity className="h-6 w-6" />,
      color: 'green',
      link: '/stats',
    },
    {
      title: 'Active Pools',
      value: networkData?.activePools?.toString() || '0',
      icon: <Network className="h-6 w-6" />,
      color: 'purple',
      link: '/stats',
    },
    {
      title: 'Active Nodes',
      value: networkData?.bondedNodes?.toString() || '0',
      icon: <Shield className="h-6 w-6" />,
      color: 'orange',
      link: '/network',
    },
  ];

  const sections = [
    {
      title: 'Protocol Overview',
      description: 'Learn about THORChain\'s architecture, cross-chain mechanics, and how it enables native asset swaps.',
      icon: <BookOpen className="h-8 w-8" />,
      link: '/protocol',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Network & Security',
      description: 'Explore validator nodes, security mechanisms, governance, and network operations.',
      icon: <Shield className="h-8 w-8" />,
      link: '/network',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Economics & Tokenomics',
      description: 'Understand RUNE token mechanics, incentive systems, fee structures, and emission schedules.',
      icon: <Zap className="h-8 w-8" />,
      link: '/economics',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Ecosystem',
      description: 'Discover 76+ apps, wallets, interfaces, and integrations built on THORChain.',
      icon: <Layers className="h-8 w-8" />,
      link: '/ecosystem',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              THORChain Wiki
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-blue-100">
              Comprehensive encyclopedia of THORChain protocol, data, and ecosystem
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/protocol"
                className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/stats"
                className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                View Statistics
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Network Overview
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card) => (
              <Link
                key={card.title}
                href={card.link}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
              >
                <div className={`flex items-center mb-4 text-${card.color}-500`}>
                  {card.icon}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Explore Topics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <Link
                key={section.title}
                href={section.link}
                className={`bg-gradient-to-br ${section.color} rounded-xl p-8 text-white hover:shadow-xl hover:scale-105 transition-all`}
              >
                <div className="flex items-center mb-4">
                  {section.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {section.title}
                </h3>
                <p className="text-blue-100">
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Top Liquidity Pools
              </h2>
              <div className="space-y-3">
                {topPools.map((pool, index) => (
                  <div
                    key={pool.asset}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {pool.asset}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Liquidity</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pool.liquidityUSD}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">24h Volume</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {pool.volume24hUSD}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/stats"
                className="mt-6 inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View All Pools →
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Quick Links
              </h2>
              <div className="space-y-4">
                <Link
                  href="https://docs.thorchain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Official Documentation
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        docs.thorchain.org
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://dev.thorchain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Developer Docs
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        dev.thorchain.org
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://runescan.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Block Explorer
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        runescan.io
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="https://midgard.ninerealms.com/v2/doc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        Midgard API
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        midgard.ninerealms.com/v2
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
