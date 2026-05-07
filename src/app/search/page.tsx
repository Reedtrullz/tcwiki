'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import lunr from 'lunr';


const searchIndex = lunr(function () {
  this.ref('slug');
  this.field('title');
  this.field('content');
  this.field('tags');

  const pages = [
    { slug: '/protocol', title: 'Protocol Overview', content: 'THORChain protocol architecture cross-chain swaps native assets without wrapped tokens Cosmos SDK TSS Threshold Signature Schemes Bifrost bridge Continuous Liquidity Pools CLP Savers Vaults single-sided yield impermanent loss protection governance', tags: 'protocol architecture technology swaps' },
    { slug: '/network', title: 'Network & Security', content: 'THORChain network security bonded validators threshold signatures TSS rotating vaults churning slash points Byzantine fault tolerance node types active standby ready whitelisted minimum bond requirements churn interval consensus', tags: 'network security nodes validators' },
    { slug: '/economics', title: 'Economics & Tokenomics', content: 'RUNE token economics tokenomics settlement asset liquidity pair security bond Continuous Liquidity Pool CLP formula slip-based fees supply emission incentive pendulum block rewards system income fee structure', tags: 'economics tokenomics rune fees' },
    { slug: '/ecosystem', title: 'Ecosystem', content: 'THORChain ecosystem applications wallets interfaces explorers developer tools SwapKit XChainJS supported chains Bitcoin Ethereum BNB Chain Avalanche Cosmos Hub Dogecoin Litecoin Bitcoin Cash Tron Base Arbitrum Polygon', tags: 'ecosystem apps wallets chains' },
    { slug: '/governance', title: 'Governance & History', content: 'THORChain governance ADR Architecture Decision Records proposals voting milestones history security incidents exploits ETH router double whammy THORFi pause research reports Messari Nine Realms', tags: 'governance history proposals security' },
    { slug: '/stats', title: 'Network Statistics', content: 'THORChain statistics data real-time TVL total value locked volume pools nodes RUNE price history charts Midgard API performance metrics', tags: 'statistics data metrics charts' },
  ];

  pages.forEach(p => this.add(p));
});

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<{ slug: string; title: string; content: string; score: number }[]>([]);

  useEffect(() => {
    if (query.trim()) {
      const r = searchIndex.search(query).map(r => {
        const page = [{ slug: '/protocol', title: 'Protocol Overview', content: 'THORChain protocol architecture cross-chain swaps...' },
          { slug: '/network', title: 'Network & Security', content: 'THORChain network security bonded validators...' },
          { slug: '/economics', title: 'Economics & Tokenomics', content: 'RUNE token economics tokenomics settlement asset...' },
          { slug: '/ecosystem', title: 'Ecosystem', content: 'THORChain ecosystem applications wallets interfaces...' },
          { slug: '/governance', title: 'Governance & History', content: 'THORChain governance ADR Architecture Decision Records...' },
          { slug: '/stats', title: 'Network Statistics', content: 'THORChain statistics data real-time TVL...' },
        ].find(p => p.slug === r.ref);
        return { ...page!, score: r.score };
      });
      setResults(r);
    }
  }, [query]);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">{query ? `${results.length} results for "${query}"` : 'Enter a search term to find content.'}</p>
      <div className="space-y-4">
        {results.map(r => (
          <Link key={r.slug} href={r.slug} className="block bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
            <h3 className="font-bold text-gray-900 dark:text-white">{r.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{r.content.slice(0, 150)}...</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400"><span>{r.slug}</span><span>·</span><span>Score: {r.score.toFixed(2)}</span></div>
          </Link>
        ))}
        {query && results.length === 0 && <p className="text-gray-500 py-12 text-center">No results found for &quot;{query}&quot;</p>}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Search</h1>
        <Suspense fallback={<p className="text-gray-500">Loading search...</p>}>
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
