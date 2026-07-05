'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import lunr from 'lunr';
import { SEARCH_DOCUMENTS, SearchDoc } from '@/lib/search/registry';
import { TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import { getSearchQueryTerms, runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';
import {
  buildSearchFilterOptions,
  excludeSearchStartingPoints,
  filterSearchResults,
  getSearchFilterSpec,
  getSearchStartingPoints,
  normalizeSearchFilter,
  type SearchFilterId,
} from '@/lib/search/presentation';

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

function searchHref(query: string, filterId: SearchFilterId) {
  const params = new URLSearchParams();
  if (query.trim()) {
    params.set('q', query);
  }
  if (filterId !== 'all') {
    params.set('filter', filterId);
  }
  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : '/search';
}

function TaskGuideLinks() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TASK_INTENT_GUIDES.map((guide) => (
        <Link
          key={guide.id}
          href={guide.href}
          className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <p className="text-sm font-semibold text-slate-200">{guide.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{guide.description}</p>
        </Link>
      ))}
    </div>
  );
}

function SearchResultCard({
  result,
  query,
}: {
  result: SearchDoc & { score: number };
  query: string;
}) {
  return (
    <article className="rounded-lg border border-border bg-surface-elevated p-4">
      <Link href={result.href} className="block rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{typeLabel(result.type)}</Badge>
          {result.confidence && (
            <Badge variant={getConfidenceTone(result.confidence)}>
              {getConfidenceLabel(result.confidence)}
            </Badge>
          )}
          <h3 className="text-sm font-semibold">{result.title}</h3>
        </div>
      </Link>
      <p className="mt-2 text-xs text-slate-400">{getSearchSnippet(result.content, query)}</p>
      <dl className="mt-3 grid gap-1 text-xs text-slate-400 sm:flex sm:flex-wrap sm:items-center sm:gap-x-2">
        <div className="flex min-w-0 gap-1">
          <dt className="text-slate-400">Route</dt>
          <dd className="min-w-0 break-all text-slate-400">{result.href}</dd>
        </div>
        {result.sources && (
          <div className="flex min-w-0 gap-1">
            <dt className="text-slate-400">Source</dt>
            <dd className="min-w-0">
              <SourceList sources={result.sources} resultTitle={result.title} />
            </dd>
          </div>
        )}
        {result.reviewedAt && (
          <div className="flex gap-1">
            <dt className="text-slate-400">Reviewed</dt>
            <dd className="text-slate-400">{result.reviewedAt}</dd>
          </div>
        )}
        {result.nextReviewDue && (
          <div className="flex gap-1">
            <dt className="text-slate-400">Review due</dt>
            <dd className="text-slate-400">{result.nextReviewDue}</dd>
          </div>
        )}
      </dl>
    </article>
  );
}

function SearchFilterNav({
  query,
  selectedFilter,
  options,
}: {
  query: string;
  selectedFilter: SearchFilterId;
  options: ReturnType<typeof buildSearchFilterOptions>;
}) {
  if (options.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Filter search results" className="mb-6">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Filter results</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option.id === selectedFilter;
          return (
            <Link
              key={option.id}
              href={searchHref(query, option.id)}
              aria-current={selected ? 'page' : undefined}
              title={option.description}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                selected
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border bg-surface-elevated text-slate-400 hover:border-accent/30 hover:text-slate-100'
              }`}
            >
              {option.label}
              <span className="ml-1 text-slate-500">{option.count}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function StartingPoints({
  query,
  results,
}: {
  query: string;
  results: Array<SearchDoc & { score: number }>;
}) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="search-start-here" className="mb-8 rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="search-start-here" className="text-sm font-semibold text-slate-100">Start Here</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            Task and source-map matches are pulled forward because they explain what to check before using the rest of the results.
          </p>
        </div>
        <span className="text-xs text-slate-500">{results.length} guide{results.length === 1 ? '' : 's'}</span>
      </div>
      <div className="space-y-2">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} query={query} />
        ))}
      </div>
    </section>
  );
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
  const selectedFilter = normalizeSearchFilter(searchParams.get('filter'));
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
    params.delete('filter');
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
      return rankSearchResults(query, mapped);
    }

    return [];
  }, [query]);
  const filterOptions = useMemo(() => buildSearchFilterOptions(results), [results]);
  const filteredResults = useMemo(() => filterSearchResults(results, selectedFilter), [results, selectedFilter]);
  const startingPoints = useMemo(
    () => selectedFilter === 'all' ? getSearchStartingPoints(results) : [],
    [results, selectedFilter],
  );
  const displayedResults = useMemo(
    () => selectedFilter === 'all'
      ? excludeSearchStartingPoints(filteredResults, startingPoints)
      : filteredResults,
    [filteredResults, selectedFilter, startingPoints],
  );
  const selectedFilterSpec = getSearchFilterSpec(selectedFilter);

  return (
    <div>
      <form role="search" aria-label="Search wiki content" onSubmit={handleSearchSubmit} className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            aria-label="Search the wiki"
            type="text"
            enterKeyHint="search"
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
        <>
          <p aria-live="polite" aria-atomic="true" className="mb-4 text-sm text-slate-400">
            {selectedFilter === 'all'
              ? `${results.length} result${results.length !== 1 ? 's' : ''}`
              : `${filteredResults.length} of ${results.length} result${results.length !== 1 ? 's' : ''}`}
            {' '}for &ldquo;{query}&rdquo;
          </p>
          <SearchFilterNav query={query} selectedFilter={selectedFilter} options={filterOptions} />
          <StartingPoints query={query} results={startingPoints} />
        </>
      ) : (
        <>
          <p className="text-sm text-slate-400 mb-4">Enter a search term above or start from a task.</p>
          <TaskGuideLinks />
        </>
      )}
      <div className="space-y-2">
        {displayedResults.map((result) => (
          <SearchResultCard key={result.id} result={result} query={query} />
        ))}
        {query && results.length === 0 && (
          <div className="py-8">
            <p className="mb-5 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;. These guided paths cover the most common wiki jobs.</p>
            <TaskGuideLinks />
          </div>
        )}
        {query && results.length > 0 && filteredResults.length === 0 && (
          <div className="rounded-lg border border-border bg-surface-elevated p-5 text-sm text-slate-400">
            No {selectedFilterSpec.label.toLowerCase()} results for &ldquo;{query}&rdquo;.
            <Link href={searchHref(query, 'all')} className="ml-1 text-accent underline-offset-4 hover:underline">
              Clear the filter
            </Link>
            .
          </div>
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
