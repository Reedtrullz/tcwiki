'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const searchDocumentsById = new Map(SEARCH_DOCUMENTS.map((doc) => [doc.id, doc]));
const SNIPPET_LENGTH = 180;

function getQueryTerms(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const terms = normalizedQuery
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 1);

  return Array.from(new Set([normalizedQuery, ...terms]))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function getSearchSnippet(content: string, query: string) {
  const compactContent = content.replace(/\s+/g, ' ').trim();
  const compactLower = compactContent.toLowerCase();
  const matchIndex = getQueryTerms(query)
    .map((term) => compactLower.indexOf(term))
    .find((index) => index >= 0) ?? -1;

  if (matchIndex < 0 || compactContent.length <= SNIPPET_LENGTH) {
    return compactContent.length > SNIPPET_LENGTH
      ? `${compactContent.slice(0, SNIPPET_LENGTH).trim()}...`
      : compactContent;
  }

  const centeredStart = Math.max(0, matchIndex - Math.floor(SNIPPET_LENGTH / 2));
  const startBoundary = compactContent.lastIndexOf(' ', centeredStart);
  const start = centeredStart > 0 && startBoundary > 0 ? startBoundary + 1 : centeredStart;
  const end = Math.min(compactContent.length, start + SNIPPET_LENGTH);
  const endBoundary = compactContent.indexOf(' ', end);
  const boundedEnd = endBoundary > end && endBoundary - start <= SNIPPET_LENGTH + 40 ? endBoundary : end;
  const snippet = compactContent.slice(start, boundedEnd).trim();

  return `${start > 0 ? '...' : ''}${snippet}${boundedEnd < compactContent.length ? '...' : ''}`;
}

function SearchResultsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (localQuery.trim()) {
      params.set('q', localQuery);
    } else {
      params.delete('q');
    }
    const nextQuery = params.toString();
    router.push(nextQuery ? `/search?${nextQuery}` : '/search');
  };

  const results = useMemo<Array<SearchDoc & { score: number }>>(() => {
    if (query.trim()) {
      const raw = searchIndex.search(query);
      const seen = new Set<string>();
      const mapped: Array<SearchDoc & { score: number }> = [];
      raw.forEach((r) => {
        const doc = searchDocumentsById.get(r.ref);
        if (doc && !seen.has(doc.slug)) {
          seen.add(doc.slug);
          mapped.push({ ...doc, score: r.score });
        }
      });
      return mapped;
    }

    return [];
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
            <p className="text-xs text-slate-500 mt-1">{getSearchSnippet(r.content, query)}</p>
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
