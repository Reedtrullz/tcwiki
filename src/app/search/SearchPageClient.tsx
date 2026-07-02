'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import lunr from 'lunr';
import { SEARCH_DOCUMENTS, SearchDoc } from '@/lib/search/registry';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import { getSearchQueryTerms, runSafeLunrSearch } from '@/lib/search/lunr-query';

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  SEARCH_DOCUMENTS.forEach((doc) => this.add(doc));
});

const searchDocumentsById = new Map(SEARCH_DOCUMENTS.map((doc) => [doc.id, doc]));
const SNIPPET_LENGTH = 180;

function getSearchSnippet(content: string, query: string) {
  const compactContent = content.replace(/\s+/g, ' ').trim();
  const compactLower = compactContent.toLowerCase();
  const matchIndex = getSearchQueryTerms(query)
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

function typeLabel(type: SearchDoc['type']) {
  return type.replace('-', ' ');
}

function SourceList({ sources, resultTitle }: { sources: SearchDoc['sources']; resultTitle: string }) {
  const visibleSources = sources.slice(0, 2);
  const remainingSources = sources.slice(2);

  return (
    <>
      {visibleSources.map((source, index) => (
        <span key={source.url}>
          {index > 0 ? ', ' : ''}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            {source.label}
          </a>
        </span>
      ))}
      {remainingSources.length > 0 && (
        <details className="ml-1 inline-block align-baseline">
          <summary
            aria-label={`Show ${remainingSources.length} additional source${remainingSources.length === 1 ? '' : 's'} for ${resultTitle}`}
            className="inline cursor-pointer list-none text-slate-400 underline decoration-dotted underline-offset-4 hover:text-slate-200"
          >
            +{remainingSources.length} source{remainingSources.length === 1 ? '' : 's'}
          </summary>
          <div className="mt-1 flex max-w-xs flex-wrap gap-x-2 gap-y-1 rounded border border-border bg-surface px-2 py-1">
            {remainingSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
              >
                {source.label}
              </a>
            ))}
          </div>
        </details>
      )}
    </>
  );
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
      const raw = runSafeLunrSearch(searchIndex, query);
      const mapped: Array<SearchDoc & { score: number }> = [];
      raw.forEach((r) => {
        const doc = searchDocumentsById.get(r.ref);
        if (doc) {
          mapped.push({ ...doc, score: r.score });
        }
      });
      return mapped;
    }

    return [];
  }, [query]);

  return (
    <div>
      <form role="search" aria-label="Search wiki content" onSubmit={handleSearchSubmit} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            aria-label="Search the wiki"
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search the wiki..."
            className="w-full pl-10 pr-12 py-3 bg-surface border border-border rounded-lg text-base text-slate-100 placeholder-slate-600 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-lg"
          />
          <button
            type="submit"
            aria-label="Submit search page query"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800/70 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {query ? (
        <p aria-live="polite" aria-atomic="true" className="text-sm text-slate-400 mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
      ) : (
        <p className="text-sm text-slate-400 mb-6">Enter a search term above to find content across the wiki.</p>
      )}
      <div className="space-y-2">
        {results.map((r) => (
          <article key={r.id} className="p-4 rounded-lg bg-surface-elevated border border-border">
            <Link href={r.href} className="block rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{typeLabel(r.type)}</Badge>
                {r.confidence && (
                  <Badge variant={getConfidenceTone(r.confidence)}>
                    {getConfidenceLabel(r.confidence)}
                  </Badge>
                )}
                <h3 className="text-sm font-semibold">{r.title}</h3>
              </div>
            </Link>
            <p className="text-xs text-slate-400 mt-2">{getSearchSnippet(r.content, query)}</p>
            <dl className="mt-3 grid gap-1 text-xs text-slate-400 sm:flex sm:flex-wrap sm:items-center sm:gap-x-2">
              <div className="flex min-w-0 gap-1">
                <dt className="text-slate-400">Route</dt>
                <dd className="min-w-0 break-all text-slate-400">{r.href}</dd>
              </div>
              {r.sources && (
                <div className="flex min-w-0 gap-1">
                  <dt className="text-slate-400">Source</dt>
                  <dd className="min-w-0">
                    <SourceList sources={r.sources} resultTitle={r.title} />
                  </dd>
                </div>
              )}
              {r.reviewedAt && (
                <div className="flex gap-1">
                  <dt className="text-slate-400">Reviewed</dt>
                  <dd className="text-slate-400">{r.reviewedAt}</dd>
                </div>
              )}
              {r.nextReviewDue && (
                <div className="flex gap-1">
                  <dt className="text-slate-400">Review due</dt>
                  <dd className="text-slate-400">{r.nextReviewDue}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
        {query && results.length === 0 && (
          <p className="text-slate-400 py-12 text-center text-sm">No results for &ldquo;{query}&rdquo;. Try &ldquo;RUNE&rdquo;, &ldquo;pools&rdquo;, or &ldquo;security&rdquo;.</p>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <PageContainer maxWidth="narrow">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>
      <Suspense fallback={<p className="text-sm text-slate-400">Loading...</p>}>
        <SearchResultsInner />
      </Suspense>
    </PageContainer>
  );
}
