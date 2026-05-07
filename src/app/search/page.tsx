'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import lunr from 'lunr';

interface SearchDoc {
  slug: string;
  title: string;
  content: string;
}

const pages: SearchDoc[] = [
  { slug: '/protocol', title: 'Protocol Overview', content: 'THORChain protocol architecture cross-chain swaps native assets without wrapped tokens. Built on Cosmos SDK with TSS Threshold Signature Schemes, Bifrost bridge, and Continuous Liquidity Pools (CLP). Savers Vaults for single-sided yield. Impermanent loss protection. Minimal on-chain governance for asset listings and parameter changes.' },
  { slug: '/network', title: 'Network & Security', content: 'THORChain network security bonded validators threshold signatures TSS rotating vaults churning every 3 days slash points Byzantine fault tolerance. Node types: Active Standby Ready Whitelisted. Minimum bond 300K RUNE. Up to 30 active nodes. Churn interval 50K blocks. Unbond time 12 hours. Consensus via Tendermint.' },
  { slug: '/economics', title: 'Economics & Tokenomics', content: 'RUNE token economics. Maximum supply 500M RUNE. Settlement asset for all cross-chain swaps. Liquidity pair for every pool. Security bond for node operators. CLP Continuous Liquidity Pool formula with slip-based fees. Incentive Pendulum balances security and liquidity. Block rewards split 67% nodes 33% LPs. Fee types: liquidity slip-based, outbound per-chain, network flat.' },
  { slug: '/ecosystem', title: 'Ecosystem', content: 'THORChain ecosystem applications wallets interfaces explorers developer tools. THORSwap multi-chain DEX. THORChain Swap official interface. AsgardEX desktop wallet. XDEFI cross-chain platform. RuneScan block explorer. ViewBlock multi-chain explorer. SwapKit SDK. XChainJS library. 13 supported chains: Bitcoin Ethereum BNB Chain Avalanche Cosmos Hub Dogecoin Litecoin Bitcoin Cash Tron Base Arbitrum Polygon.' },
  { slug: '/governance', title: 'Governance & History', content: 'THORChain governance ADR Architecture Decision Records proposals voting milestones history. Security incidents: ETH Router exploits 2021, Double Whammy 2023 13M loss, Post-Bybit laundering 2025, THORFi pause 200M liabilities. Research reports from Messari and Nine Realms. Protocol milestones from 2018 founding to 2025 present.' },
  { slug: '/stats', title: 'Network Statistics', content: 'THORChain statistics data real-time live TVL total value locked volume pools nodes RUNE price history charts. Midgard API performance metrics. 24h volume tracking. Active pools count. Swap count. Bonded nodes.' },
];

const searchIndex = lunr(function () {
  this.ref('slug');
  this.field('title');
  this.field('content');
  pages.forEach((p) => this.add(p));
});

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<Array<SearchDoc & { score: number }>>([]);

  useEffect(() => {
    if (query.trim()) {
      const raw = searchIndex.search(query);
      const mapped = raw.map((r) => {
        const page = pages.find((p) => p.slug === r.ref)!;
        return { ...page, score: r.score };
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(mapped);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {query
          ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
          : 'Enter a search term above to find content across the wiki.'}
      </p>
      <div className="space-y-4">
        {results.map((r) => (
          <Link
            key={r.slug}
            href={r.slug}
            className="block bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
          >
            <h3 className="font-bold text-gray-900 dark:text-white">
              {r.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {r.content.slice(0, 180)}...
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>{r.slug}</span>
              <span>·</span>
              <span>Relevance: {r.score.toFixed(2)}</span>
            </div>
          </Link>
        ))}
        {query && results.length === 0 && (
          <p className="text-gray-500 py-12 text-center">
            No results found for &quot;{query}&quot;. Try a different term like
            &quot;RUNE&quot;, &quot;pools&quot;, or &quot;security&quot;.
          </p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Search
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Search across all wiki pages for THORChain topics.
        </p>
        <Suspense
          fallback={
            <p className="text-gray-500 text-sm">Loading search...</p>
          }
        >
          <SearchResultsInner />
        </Suspense>
      </div>
    </div>
  );
}
