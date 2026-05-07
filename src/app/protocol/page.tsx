import { BookOpen, Cpu, Lock, Shield, Database, Zap, Link as LinkIcon, Layers } from 'lucide-react';
import { CHAINS } from '@/lib/data/static';
import Link from 'next/link';

const sections = [
  {
    title: 'What is THORChain?',
    description: 'THORChain is a decentralized cross-chain liquidity protocol that enables native asset swaps between different blockchains without wrapped tokens or centralized intermediaries.',
    icon: <BookOpen className="h-6 w-6" />,
  },
  {
    title: 'Architecture & Technology',
    description: 'Built on Cosmos SDK with Bifrost, Threshold Signature Schemes (TSS), and vaults for secure cross-chain custody.',
    icon: <Cpu className="h-6 w-6" />,
  },
  {
    title: 'RUNE Token',
    description: 'The native token of THORChain serving as settlement asset, liquidity pairing token, and governance currency.',
    icon: <Zap className="h-6 w-6" />,
  },
  {
    title: 'Security Model',
    description: 'Bonded validators, rotating vaults, and Byzantine fault tolerance through TSS coordination.',
    icon: <Shield className="h-6 w-6" />,
  },
  {
    title: 'Cross-Chain Swaps',
    description: 'Native asset swaps across 9+ blockchains including Bitcoin, Ethereum, BNB Chain, Avalanche, Cosmos Hub, and more.',
    icon: <LinkIcon className="h-6 w-6" />,
  },
  {
    title: 'Liquidity Pools',
    description: 'Continuous Liquidity Pools (CLP) with dynamic fees and impermanent loss protection.',
    icon: <Layers className="h-6 w-6" />,
  },
  {
    title: 'Savers Vaults',
    description: 'Single-sided yield provision allowing users to earn without impermanent loss.',
    icon: <Lock className="h-6 w-6" />,
  },
  {
    title: 'Governance',
    description: 'Minimal governance with on-chain voting for asset listings, parameter changes, and protocol upgrades.',
    icon: <Database className="h-6 w-6" />,
  },
];

const features = [
  'Native cross-chain swaps without wrapped tokens',
  'Trustless custody through TSS vaults',
  'Automatic liquidity provision and rewards',
  'Dynamic fee adjustment based on pool depth',
  'Multi-chain support (Bitcoin, Ethereum, BNB Chain, etc.)',
  'Minimal on-chain governance',
  'Bifrost bridge architecture for secure transfers',
  'CLP (Continuous Liquidity Pool) mechanism',
  'Impermanent loss protection through ILP',
];

export default function ProtocolPage() {
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Protocol Overview
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            THORChain is a decentralized cross-chain liquidity protocol that enables users to swap native assets between different blockchains without requiring wrapped tokens or centralized intermediaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
            >
              <div className="flex items-center mb-4 text-blue-600 dark:text-blue-400">
                {section.icon}
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {section.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-start space-x-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Technology Stack
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cosmos SDK
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  THORChain is built on the Cosmos SDK, providing interoperability with the Cosmos ecosystem and enabling Tendermint-based consensus.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Bifrost
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Bifrost is a bridge that connects THORChain to supported external blockchains, observing and facilitating asset transfers.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Threshold Signatures (TSS)
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Threshold Signature Schemes enable secure, non-custodial vault management where no single party controls user funds.
                </p>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Midgard API
                </h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Midgard provides a REST API for accessing THORChain data including pools, swaps, nodes, and network statistics.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Supported Chains
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CHAINS.map((c) => (
                <div
                  key={c.chain}
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <p className="font-medium text-gray-900 dark:text-white">
                    {c.name} ({c.chain})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Learn More
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="https://docs.thorchain.org/understanding-thorchain"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Understanding THORChain
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  docs.thorchain.org
                </p>
              </div>
            </Link>

            <Link
              href="https://docs.thorchain.org/technology"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <Cpu className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Technology Overview
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  docs.thorchain.org/technology
                </p>
              </div>
            </Link>

            <Link
              href="https://docs.thorchain.org/how-it-works"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  How It Works
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  docs.thorchain.org/how-it-works
                </p>
              </div>
            </Link>

            <Link
              href="https://dev.thorchain.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all"
            >
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  Developer Documentation
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  dev.thorchain.org
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}