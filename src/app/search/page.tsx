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
  { slug: '/protocol', title: 'Protocol Overview', content: 'THORChain protocol architecture cross-chain swaps native assets without wrapped tokens. Cosmos SDK TSS Threshold Signature Schemes Bifrost bridge Continuous Liquidity Pools CLP Savers Vaults single-sided yield impermanent loss protection governance.' },
  { slug: '/network', title: 'Network & Security', content: 'THORChain network security bonded validators threshold signatures TSS rotating vaults churning slash points Byzantine fault tolerance. Node types: Active Standby Ready Whitelisted. Minimum bond 300K RUNE. Churn interval 3 days. Consensus Tendermint.' },
  { slug: '/economics', title: 'Economics & Tokenomics', content: 'RUNE token economics. Max supply 500M. Settlement asset cross-chain swaps. Liquidity pair. Security bond. CLP Continuous Liquidity Pool slip-based fees. Incentive Pendulum security liquidity. Block rewards 67% nodes 33% LPs. Fee types liquidity outbound network.' },
  { slug: '/ecosystem', title: 'Ecosystem', content: 'THORChain ecosystem applications wallets interfaces explorers developer tools. THORSwap DEX. AsgardEX wallet. XDEFI platform. RuneScan explorer. ViewBlock. SwapKit SDK. XChainJS. 13 chains: Bitcoin Ethereum BNB Chain Avalanche Cosmos Hub Dogecoin Litecoin.' },
  { slug: '/governance', title: 'Governance & History', content: 'THORChain governance ADR Architecture Decision Records proposals voting milestones history. Security incidents: ETH Router exploits 2021, Double Whammy 2023, Post-Bybit 2025, THORFi pause. Research Messari Nine Realms. Milestones 2018 to present.' },
  { slug: '/stats', title: 'Network Statistics', content: 'THORChain statistics real-time data TVL pooled RUNE earnings history charts. Midgard API metrics. Pooled RUNE bonding APY active nodes reserve. Earnings history chart node operators vs LPs.' },
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
      {query ? (
        <p className="text-sm text-slate-500 mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
      ) : (
        <p className="text-sm text-slate-500 mb-6">Enter a search term above to find content across the wiki.</p>
      )}
      <div className="space-y-2">
        {results.map((r) => (
          <Link key={r.slug} href={r.slug} className="block p-4 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors">
            <h3 className="text-sm font-semibold">{r.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{r.content.slice(0, 180)}...</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
              <span>{r.slug}</span>
              <span>·</span>
              <span>Relevance: {r.score.toFixed(2)}</span>
            </div>
          </Link>
        ))}
        {query && results.length === 0 && (
          <p className="text-slate-500 py-12 text-center text-sm">No results for &ldquo;{query}&rdquo;. Try &ldquo;RUNE&rdquo;, &ldquo;pools&rdquo;, or &ldquo;security&rdquo;.</p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
        <SearchResultsInner />
      </Suspense>
    </div>
  );
}
