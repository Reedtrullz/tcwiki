'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import lunr from 'lunr';
import { SECURITY_INCIDENTS, ECOSYSTEM_PROJECTS, RESEARCH_REPORTS, PROTOCOL_MILESTONES } from '@/lib/data/static';

interface SearchDoc {
  slug: string;
  title: string;
  content: string;
}

const pages: SearchDoc[] = [
  { slug: '/protocol', title: 'Protocol Overview', content: 'THORChain protocol architecture cross-chain swaps native assets directly between blockchains without intermediaries. Built on Cosmos SDK with TSS Threshold Signature Schemes, Bifrost bridge, and Continuous Liquidity Pools (CLP). Savers Vaults for single-sided yield. Minimal on-chain governance.' },
  { slug: '/network', title: 'Network & Security', content: 'THORChain network security bonded validators threshold signatures TSS rotating vaults churning slash points Byzantine fault tolerance. Node types: Active Standby Ready Whitelisted. Minimum bond 300K RUNE. Churn interval 3 days. Consensus Tendermint.' },
  { slug: '/economics', title: 'Economics & Tokenomics', content: 'RUNE token economics. Max supply 500M. Settlement asset cross-chain swaps. Liquidity pair. Security bond. CLP Continuous Liquidity Pool slip-based fees. Incentive Pendulum security liquidity. Block rewards 67% nodes 33% LPs. Fee types liquidity outbound network.' },
  { slug: '/rune', title: 'RUNE Token', content: 'RUNE is the native settlement asset, security bond, liquidity pair, and governance token for THORChain. Every swap routes through RUNE. Bonded for nodes. Deep liquidity across all pools.' },
  { slug: '/ecosystem', title: 'Ecosystem', content: 'THORChain ecosystem applications wallets interfaces explorers developer tools. THORSwap DEX. AsgardEX wallet. XDEFI platform. RuneScan explorer. ViewBlock. SwapKit SDK. XChainJS. 13 chains: Bitcoin Ethereum BNB Chain Avalanche Cosmos Hub Dogecoin Litecoin.' },
  { slug: '/governance', title: 'Governance & History', content: 'THORChain governance ADR Architecture Decision Records proposals voting milestones history. Security incidents: ETH Router exploits 2021, Double Whammy 2023, Post-Bybit 2025, THORFi pause. Research Messari Nine Realms. Milestones 2018 to present.' },
  { slug: '/tcy', title: 'Savers & THORFi', content: 'Savers Vaults single-sided yield. THORFi lending and synthetic assets paused in 2025 due to protocol liabilities. Difference between Savers and full liquidity provision.' },
  { slug: '/stats', title: 'Network Statistics', content: 'THORChain statistics real-time data TVL pooled RUNE earnings history charts. Midgard API metrics. Pooled RUNE bonding APY active nodes reserve. Earnings history chart node operators vs LPs.' },
  { slug: '/docs', title: 'Documentation & Resources', content: 'Official THORChain docs, developer resources, Midgard API, node operator guides, community links, Discord, Twitter, Telegram.' },

]; 

// Enrich the search index with key curated static content (incidents, ecosystem, research, milestones)
const staticSearchDocs: SearchDoc[] = [
  ...SECURITY_INCIDENTS.slice(0, 4).map(inc => ({
    slug: '/governance',
    title: inc.title,
    content: `${inc.description} Impact: ${inc.impact}. Lessons: ${inc.lessons.join('; ')}`,
  })),
  ...ECOSYSTEM_PROJECTS.slice(0, 4).map(p => ({
    slug: '/ecosystem',
    title: p.name,
    content: `${p.description} Category: ${p.category}. Chains: ${p.chains.join(', ')}.`,
  })),
  ...RESEARCH_REPORTS.map(r => ({
    slug: '/governance',
    title: r.title,
    content: `${r.summary} By ${r.author} from ${r.source} on ${r.date}.`,
  })),
  ...PROTOCOL_MILESTONES.slice(-3).map(m => ({
    slug: '/governance',
    title: m.title,
    content: m.description,
  })),
];

const allSearchDocs = [...pages, ...staticSearchDocs];

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  allSearchDocs.forEach((p, i) => this.add({ ...p, id: i })); // use numeric id to avoid slug collisions
});

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);
  const [results, setResults] = useState<Array<SearchDoc & { score: number }>>([]);

  if (query !== prevQuery) {
    setPrevQuery(query);
    setLocalQuery(query);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (localQuery.trim()) {
      params.set('q', localQuery);
    } else {
      params.delete('q');
    }
    window.history.pushState(null, '', `?${params.toString()}`);
  };

  useEffect(() => {
    if (query.trim()) {
      const raw = searchIndex.search(query);
      // Map back and dedupe by slug (prefer higher score)
      const seen = new Set<string>();
      const mapped: Array<SearchDoc & { score: number }> = [];
      raw.forEach((r) => {
        const doc = allSearchDocs[parseInt(r.ref)];
        if (doc && !seen.has(doc.slug)) {
          seen.add(doc.slug);
          mapped.push({ ...doc, score: r.score });
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(mapped);
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search the wiki..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-lg"
          />
        </div>
      </form>

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
      <p className="text-sm text-slate-500 mb-4">Tip: Press <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border rounded text-xs">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border rounded text-xs">Ctrl+K</kbd> from anywhere to focus search.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
        <SearchResultsInner />
      </Suspense>
    </div>
  );
}
