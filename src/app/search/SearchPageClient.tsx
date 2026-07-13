'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowRight, BookOpen, Compass, Search, ShieldCheck } from 'lucide-react';
import lunr from 'lunr';
import { SEARCH_DOCUMENTS, SearchDoc } from '@/lib/search/registry';
import { JOURNEY_LINKS, SEARCH_PAGE_ENTRY, TASK_GUIDE_GROUPED } from '@/lib/content/registry';
import { PageContainer } from '@/components/layout/PageContainer';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { AdditionalSourceDisclosure, SourceMetaLink } from '@/components/ui/SourceMetaDisclosure';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import { getSearchQueryTerms, runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';
import {
  buildSearchFilterOptions,
  excludeSearchStartingPoints,
  filterSearchResults,
  getSearchFilterSpec,
  getSearchSourceDisclosureRows,
  getSearchSourceRetrievalSummary,
  getSearchStartingPoints,
  getSearchTypeLabel,
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

type SearchDecisionId = 'live-state' | 'source-choice' | 'definition' | 'builder';

const SEARCH_DECISION_CARDS = [
  {
    id: 'live-state',
    eyebrow: 'Live state',
    title: 'Can this route quote?',
    href: '/network#check-a-route',
    query: 'can i swap right now',
    description: 'Start with the route checker for a specific asset pair and amount, then use diagnostics for chain-wide blockers.',
  },
  {
    id: 'source-choice',
    eyebrow: 'Claim source',
    title: 'Which proof fits?',
    href: '/docs#source-map-chooser',
    query: 'which source should i trust',
    description: 'Match the claim to live state, static docs, dated incident reports, interfaces, or community context.',
  },
  {
    id: 'definition',
    eyebrow: 'Definition',
    title: 'What does this term mean?',
    href: '/glossary#glossary-definition-map',
    query: 'what is quote expiry',
    description: 'Use source-aware definitions before jumping into memos, quotes, vaults, Mimir, secured assets, or recovery terms.',
  },
  {
    id: 'builder',
    eyebrow: 'Builder path',
    title: 'Which endpoint should I use?',
    href: '/deep-dives/build-query-data#query-plan',
    query: 'Midgard API',
    description: 'Start with the query plan for Midgard, THORNode, inbound addresses, quote endpoints, memos, fees, and units.',
  },
] satisfies Array<{
  id: SearchDecisionId;
  eyebrow: string;
  title: string;
  href: string;
  query: string;
  description: string;
}>;

const searchDecisionIcons: Record<SearchDecisionId, typeof Search> = {
  'live-state': Activity,
  'source-choice': ShieldCheck,
  definition: BookOpen,
  builder: Compass,
};

const SEARCH_EXAMPLE_GROUPS = [
  {
    id: 'use-now',
    label: 'Use Now',
    description: 'Current-state checks before saying an action is available.',
    queries: [
      'can I swap right now',
      'current TCY controls',
      'RUNEPool live',
    ],
  },
  {
    id: 'proof-boundaries',
    label: 'Proof Boundaries',
    description: 'Source-map searches for claims that are easy to overstate.',
    queries: [
      'App Layer claim checks',
      'dynamic fee source map',
      'RUNE fair value',
    ],
  },
  {
    id: 'builder-terms',
    label: 'Builder Terms',
    description: 'Protocol terms and endpoint fields that need exact handling.',
    queries: [
      'recommended_min_amount_in',
      'quote expiry',
      'Midgard API',
    ],
  },
] satisfies Array<{
  id: string;
  label: string;
  description: string;
  queries: string[];
}>;

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

function SearchDecisionPrimer() {
  return (
    <section id="search-look-here-first" aria-labelledby="search-look-here-first-heading" className="mb-8">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="search-look-here-first-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Look Here First
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
            Pick the kind of proof you need, then use search for the narrower term.
          </p>
        </div>
        <Link href="/docs#source-map-chooser" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
          Open source map
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SEARCH_DECISION_CARDS.map((card) => {
          const Icon = searchDecisionIcons[card.id];

          return (
            <article key={card.id} className="rounded-lg border border-border bg-surface-elevated p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Badge variant={card.id === 'live-state' ? 'warning' : card.id === 'source-choice' ? 'info' : 'default'}>
                  {card.eyebrow}
                </Badge>
                <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100">
                <Link href={card.href} className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                  {card.title}
                </Link>
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{card.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-slate-300 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Open path
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={searchHref(card.query, 'all')}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Search &ldquo;{card.query}&rdquo;
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SearchExampleQueries() {
  return (
    <section aria-labelledby="search-example-queries-heading" className="mb-8">
      <h2 id="search-example-queries-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Example Queries
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SEARCH_EXAMPLE_GROUPS.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`search-example-group-${group.id}`}
            className="rounded-lg border border-border bg-surface-elevated p-4"
          >
            <h3 id={`search-example-group-${group.id}`} className="text-xs font-semibold text-slate-200">
              {group.label}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{group.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {group.queries.map((query) => (
                <Link
                  key={query}
                  href={searchHref(query, 'all')}
                  className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  {query}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

function SearchResultBoundary() {
  return (
    <section id="search-result-boundary" aria-labelledby="search-result-boundary-heading" className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="warning">Result boundary</Badge>
            <h2 id="search-result-boundary-heading" className="text-sm font-semibold text-slate-100">
              Ranking is a starting point, not proof
            </h2>
          </div>
          <p className="max-w-3xl text-xs leading-relaxed text-slate-400">
            Check each result source, review date, and live evidence before treating a high-ranked match as current protocol truth.
          </p>
        </div>
        <div className="min-w-0 text-xs lg:max-w-md">
          <FreshnessMeta
            freshness={{
              checkedAt: SEARCH_PAGE_ENTRY.reviewedAt,
              confidence: SEARCH_PAGE_ENTRY.confidence,
              nextReviewDue: SEARCH_PAGE_ENTRY.nextReviewDue,
            }}
            sources={SEARCH_PAGE_ENTRY.sources}
            compact
          />
          <Link href="#search-page-source-posture" className="mt-2 inline-flex text-accent underline-offset-4 hover:underline">
            Full source posture
          </Link>
        </div>
      </div>
    </section>
  );
}

function SearchGuideLinks() {
  return (
    <section id="search-guided-answers" aria-labelledby="search-guided-answers-heading" className="mb-8 scroll-mt-24">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="search-guided-answers-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Guided Answers
          </h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
            Start with the reader job when the exact page, metric, or source is not obvious yet.
          </p>
        </div>
        <Link href="#search-common-tasks" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
          Jump to common tasks →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.4fr]">
        <section aria-labelledby="search-reader-paths">
          <h2 id="search-reader-paths" className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Reader Paths
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {JOURNEY_LINKS.map((journey) => (
              <Link
                key={journey.href}
                href={journey.href}
                className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <p className="text-sm font-semibold text-slate-200">{journey.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{journey.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section id="search-common-tasks" aria-labelledby="search-common-tasks-heading" className="scroll-mt-24">
          <h2 id="search-common-tasks-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Common Tasks
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TASK_GUIDE_GROUPED.map((group) => (
              <section key={group.id} aria-labelledby={`search-task-group-${group.id}`}>
                <h3 id={`search-task-group-${group.id}`} className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.label}
                </h3>
                <div className="mt-3 grid gap-2">
                  {group.guides.map((guide) => (
                    <Link
                      key={guide.id}
                      href={guide.href}
                      className="rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      <span className="block text-sm font-semibold text-slate-200">{guide.label}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-400">{guide.description}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function SearchResultCard({
  result,
  query,
}: {
  result: SearchDoc & { score: number };
  query: string;
}) {
  const retrievalSummary = getSearchSourceRetrievalSummary(result.sources);

  return (
    <article className="rounded-lg border border-border bg-surface-elevated p-4">
      <Link href={result.href} className="block rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{getSearchTypeLabel(result.type)}</Badge>
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
        {result.reviewedAt && (
          <div className="flex gap-1">
            <dt className="text-slate-400">Wiki reviewed</dt>
            <dd className="text-slate-400">{result.reviewedAt}</dd>
          </div>
        )}
        {result.nextReviewDue && (
          <div className="flex gap-1">
            <dt className="text-slate-400">Next wiki review</dt>
            <dd className="text-slate-400">{result.nextReviewDue}</dd>
          </div>
        )}
        {retrievalSummary && (
          <div className="flex gap-1">
            <dt className="text-slate-400">Source retrieved</dt>
            <dd className={retrievalSummary.hasUndatedSources ? 'text-amber-300' : 'text-slate-400'}>
              {retrievalSummary.label}
            </dd>
          </div>
        )}
      </dl>
      {result.sources && (
        <div className="mt-2 text-xs text-slate-400">
          <span className="mr-1 text-slate-400">Sources used</span>
          <SourceList sources={result.sources} resultTitle={result.title} />
        </div>
      )}
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
            Task, source-map, and reader-path matches are pulled forward because they explain what to check before using the rest of the results.
          </p>
        </div>
        <span className="text-xs text-slate-500">
          {results.length} starting point{results.length === 1 ? '' : 's'}
        </span>
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
  const disclosureRows = getSearchSourceDisclosureRows(sources);

  return (
    <>
      {visibleSources.map((source, index) => (
        <span key={source.url} className="inline-flex min-w-0 max-w-full">
          {index > 0 ? ', ' : ''}
          <SourceMetaLink
            source={source}
            className="rounded-sm underline-offset-4 hover:underline"
          >
            {source.label}
          </SourceMetaLink>
        </span>
      ))}
      <AdditionalSourceDisclosure
        sources={remainingSources}
        primaryLabel={resultTitle}
        className="ml-1 align-baseline"
        panelClassName="max-w-[min(20rem,calc(100vw-2rem))] sm:max-w-xs"
        renderSource={(source) => (
          <SourceMetaLink
            key={source.url}
            source={source}
            className="rounded-sm underline-offset-4 hover:underline"
          >
            {source.label}
          </SourceMetaLink>
        )}
      />
      {disclosureRows.length > 0 && (
        <details className="mt-1 block max-w-full align-baseline sm:ml-1 sm:inline-block">
          <summary
            aria-label={`Show source retrieval details for ${resultTitle}`}
            className="inline cursor-pointer list-none rounded-sm text-slate-400 underline decoration-dotted underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            source retrieval details
          </summary>
          <div className="mt-1 grid max-w-full gap-2 rounded border border-border bg-surface px-2 py-2 text-xs sm:max-w-lg">
            {disclosureRows.map((source) => (
              <div key={source.url} className="min-w-0">
                <SourceMetaLink
                  source={source}
                  className="rounded-sm font-medium text-slate-300 underline-offset-4 hover:text-slate-100 hover:underline"
                >
                  {source.label}
                </SourceMetaLink>
                {source.retrievedAt && (
                  <p className="mt-0.5 text-slate-500">Source retrieved {source.retrievedAt}</p>
                )}
                {source.notes && (
                  <p className="mt-0.5 break-words leading-relaxed text-slate-400">{source.notes}</p>
                )}
              </div>
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
    () => selectedFilter === 'all' ? getSearchStartingPoints(results, 3, query) : [],
    [query, results, selectedFilter],
  );
  const displayedResults = useMemo(
    () => selectedFilter === 'all'
      ? excludeSearchStartingPoints(filteredResults, startingPoints)
      : filteredResults,
    [filteredResults, selectedFilter, startingPoints],
  );
  const selectedFilterSpec = getSearchFilterSpec(selectedFilter);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash.startsWith('#search-')) {
      return undefined;
    }

    const scrollToSearchTarget = () => {
      const target = document.getElementById(window.location.hash.slice(1));
      if (!target) {
        return;
      }

      const targetTop = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 88);
      window.scrollTo({ top: targetTop, behavior: 'auto' });
    };

    scrollToSearchTarget();
    const animationFrame = window.requestAnimationFrame(scrollToSearchTarget);
    const timeoutIds = [75, 250, 750].map((delay) => window.setTimeout(scrollToSearchTarget, delay));

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [query, selectedFilter]);

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
          <SearchResultBoundary />
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
          <p className="text-sm text-slate-400 mb-4">Enter a search term above or start from a task or reader path.</p>
          <SearchDecisionPrimer />
          <SearchExampleQueries />
          <SearchGuideLinks />
        </>
      )}
      <div className="space-y-2">
        {displayedResults.map((result) => (
          <SearchResultCard key={result.id} result={result} query={query} />
        ))}
        {query && results.length === 0 && (
          <div className="py-8">
            <p className="mb-5 text-center text-sm text-slate-400">No results for &ldquo;{query}&rdquo;. These guided paths cover the most common wiki jobs.</p>
            <SearchGuideLinks />
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

interface SearchPageClientProps {
  sourcePosture?: ReactNode;
}

export default function SearchPage({ sourcePosture }: SearchPageClientProps) {
  return (
    <PageContainer maxWidth="narrow">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Search And Guided Answers</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Search directly, or start from a common THORChain question when the right source is the hard part.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-slate-400">Loading...</p>}>
        <SearchResultsInner />
      </Suspense>
      <div id="search-page-source-posture" className="scroll-mt-24">
        {sourcePosture ?? (
          <RouteSourcePosture
            entry={SEARCH_PAGE_ENTRY}
            className="mt-10"
            useFor={[
              'Finding wiki pages, glossary terms, source-map sections, task guides, and reader paths.',
              'Choosing where to start when the right THORChain source or proof boundary is unclear.',
            ]}
            verifyBeforeClaiming={[
              'Current protocol state, route availability, wallet safety, revenue lift, or recovery completion.',
              'That a high-ranked result proves the claim without checking the result source, review date, and live evidence.',
            ]}
          />
        )}
      </div>
    </PageContainer>
  );
}
