'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import lunr from 'lunr';
import { SEARCH_DOCUMENTS, SearchDoc } from '@/lib/search/registry';
import { PageContainer } from '@/components/layout/PageContainer';

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  SEARCH_DOCUMENTS.forEach((doc) => this.add(doc));
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
        const doc = SEARCH_DOCUMENTS.find((entry) => entry.id === r.ref);
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
            aria-label="Search the wiki"
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search the wiki..."
            className="w-full pl-10 pr-4 py-3 bg-surface border border-border rounded-lg text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-lg"
          />
        </div>
      </form>

      {query ? (
        <p aria-live="polite" aria-atomic="true" className="text-sm text-slate-500 mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
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
    <PageContainer maxWidth="narrow">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>
      <p className="text-sm text-slate-500 mb-4">Tip: Press <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border rounded text-xs">⌘K</kbd> or <kbd className="px-1.5 py-0.5 bg-surface-elevated border border-border rounded text-xs">Ctrl+K</kbd> from anywhere to focus search.</p>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
        <SearchResultsInner />
      </Suspense>
    </PageContainer>
  );
}
