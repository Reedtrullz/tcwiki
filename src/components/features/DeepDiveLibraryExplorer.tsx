'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import type { DataConfidence, SourceMeta } from '@/lib/types';

export interface DeepDiveLibraryArticle {
  id: string;
  title: string;
  href: string;
  description: string;
  searchText: string;
  tags: string[];
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  useCase: string;
  claimBoundary: string;
  readerPaths: Array<{
    title: string;
    href: string;
  }>;
}

export interface DeepDiveLibraryTopic {
  id: string;
  label: string;
  description: string;
  entryIds: string[];
}

interface DeepDiveLibraryFilterState {
  query: string;
  topicId: string;
}

const ALL_TOPICS = 'all';
const QUERY_PARAM = 'q';
const TOPIC_PARAM = 'topic';

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function queryWords(query: string) {
  return normalizeText(query)
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function articleMatchesQuery(article: DeepDiveLibraryArticle, query: string) {
  const words = queryWords(query);
  if (words.length === 0) {
    return true;
  }

  const haystack = normalizeText([
    article.title,
    article.description,
    article.searchText,
    article.useCase,
    article.claimBoundary,
    ...article.tags,
    ...article.sources.map((source) => source.label),
    ...article.readerPaths.map((path) => path.title),
  ].join(' '));

  return words.every((word) => haystack.includes(word));
}

function describeNoResults(query: string, activeTopic: DeepDiveLibraryTopic | undefined) {
  const trimmedQuery = query.trim();
  if (trimmedQuery && activeTopic) {
    return `No deep dives match "${trimmedQuery}" inside ${activeTopic.label}.`;
  }
  if (trimmedQuery) {
    return `No deep dives match "${trimmedQuery}".`;
  }
  if (activeTopic) {
    return `No deep dives match ${activeTopic.label}.`;
  }
  return 'No deep dives match the current filters.';
}

function normalizeTopicId(topicId: string | null, topics: DeepDiveLibraryTopic[]) {
  if (!topicId || topicId === ALL_TOPICS) {
    return ALL_TOPICS;
  }

  return topics.some((topic) => topic.id === topicId) ? topicId : ALL_TOPICS;
}

function subscribeToHydration(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const timeoutId = window.setTimeout(onStoreChange, 0);
  return () => window.clearTimeout(timeoutId);
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydratedSnapshot() {
  return false;
}

function replaceUrlFromFilter(nextUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(window.history.state, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function DeepDiveArticleCard({ article }: { article: DeepDiveLibraryArticle }) {
  return (
    <article id={`deep-dive-card-${article.id}`} className="scroll-mt-24 rounded-lg border border-border bg-surface-elevated p-5">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant={getConfidenceTone(article.confidence)}>
              {getConfidenceLabel(article.confidence)}
            </Badge>
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="info">{tag}</Badge>
            ))}
          </div>
          <h3 className="text-base font-semibold leading-snug text-slate-100">
            <Link href={article.href} className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
              {article.title}
            </Link>
          </h3>
        </div>
        <Link
          href={article.href}
          aria-label={`Read ${article.title}`}
          className="inline-flex shrink-0 items-center gap-1 self-start rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-semibold text-accent transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          Read
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
      <p className="text-sm leading-relaxed text-slate-400">{article.description}</p>
      <div className="mt-4 grid gap-3 border-t border-border pt-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
        <div>
          <p className="mb-1 font-semibold uppercase tracking-wider text-emerald-300">Use For</p>
          <p>{article.useCase}</p>
        </div>
        <div>
          <p className="mb-1 font-semibold uppercase tracking-wider text-amber-300">Verify First</p>
          <p>{article.claimBoundary}</p>
        </div>
      </div>
      <div className="mt-4">
        <FreshnessMeta
          freshness={{
            checkedAt: article.reviewedAt,
            confidence: article.confidence,
            nextReviewDue: article.nextReviewDue,
          }}
          sources={article.sources}
          compact
        />
      </div>
      {article.readerPaths.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Appears In Paths</p>
          <div className="flex flex-wrap gap-2">
            {article.readerPaths.map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {path.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export function DeepDiveLibraryExplorer({
  articles,
  topics,
}: {
  articles: DeepDiveLibraryArticle[];
  topics: DeepDiveLibraryTopic[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const filters = useMemo<DeepDiveLibraryFilterState>(() => ({
    query: searchParams.get(QUERY_PARAM) ?? '',
    topicId: normalizeTopicId(searchParams.get(TOPIC_PARAM), topics),
  }), [searchParams, topics]);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydratedSnapshot);
  const latestFiltersRef = useRef<DeepDiveLibraryFilterState>(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const query = filters.query;
  const topicId = filters.topicId;
  const activeTopic = topics.find((topic) => topic.id === topicId);
  const activeEntryIds = useMemo(() => new Set(activeTopic?.entryIds ?? []), [activeTopic]);
  const trimmedQuery = query.trim();
  const activeFilters = trimmedQuery !== '' || topicId !== ALL_TOPICS;
  const filteredArticles = useMemo(() => articles.filter((article) => (
    (topicId === ALL_TOPICS || activeEntryIds.has(article.id)) &&
    articleMatchesQuery(article, query)
  )), [activeEntryIds, articles, query, topicId]);
  const activeFilterLabels = [
    activeTopic ? `Topic: ${activeTopic.label}` : null,
    trimmedQuery ? `Search: ${trimmedQuery}` : null,
  ].filter((label): label is string => label !== null);

  const replaceFiltersInUrl = useCallback((nextFilters: DeepDiveLibraryFilterState) => {
    const nextParams = new URLSearchParams(searchParamString);
    const normalizedQuery = nextFilters.query.trim();

    if (normalizedQuery) {
      nextParams.set(QUERY_PARAM, normalizedQuery);
    } else {
      nextParams.delete(QUERY_PARAM);
    }

    if (nextFilters.topicId === ALL_TOPICS) {
      nextParams.delete(TOPIC_PARAM);
    } else {
      nextParams.set(TOPIC_PARAM, nextFilters.topicId);
    }

    const nextParamString = nextParams.toString();
    const nextUrl = nextParamString ? `${pathname}?${nextParamString}` : pathname;

    replaceUrlFromFilter(nextUrl);
  }, [pathname, searchParamString]);

  const updateFilters = (patch: Partial<DeepDiveLibraryFilterState>) => {
    const nextFilters = {
      ...latestFiltersRef.current,
      ...patch,
    };
    latestFiltersRef.current = nextFilters;
    replaceFiltersInUrl(nextFilters);
  };

  const updateQuery = (nextQuery: string) => {
    updateFilters({ query: nextQuery });
  };

  const updateTopic = (nextTopicId: string) => {
    updateFilters({ topicId: nextTopicId });
  };

  const resetFilters = () => {
    updateFilters({
      query: '',
      topicId: ALL_TOPICS,
    });
  };

  return (
    <section id="deep-dive-library" aria-labelledby="deep-dive-library-heading" className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <h2 id="deep-dive-library-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            All Deep Dives
          </h2>
          <p aria-live="polite" className="mt-2 text-sm leading-relaxed text-slate-400">
            Showing {filteredArticles.length} of {articles.length} articles. Filter by the claim, workflow, or source family you need.
          </p>
        </div>
        {activeFilters && (
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hydrated}
            className="inline-flex items-center gap-1 self-start rounded-md border border-border px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 md:self-auto"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      <div className="mb-5 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <form role="search" aria-label="Filter deep dives" onSubmit={(event) => event.preventDefault()}>
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Filter deep dives"
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                disabled={!hydrated}
                placeholder="Filter by topic, claim, source, or term..."
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          </form>

          <nav aria-label="Deep dive topics" className="flex flex-wrap gap-2 lg:max-w-2xl lg:justify-end">
            <button
              type="button"
              onClick={() => updateTopic(ALL_TOPICS)}
              aria-pressed={topicId === ALL_TOPICS}
              disabled={!hydrated}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                topicId === ALL_TOPICS
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border bg-surface text-slate-400 hover:border-accent/30 hover:text-slate-100'
              }`}
            >
              All
              <span className="ml-1 text-slate-500">{articles.length}</span>
            </button>
            {topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => updateTopic(topic.id)}
                aria-pressed={topicId === topic.id}
                disabled={!hydrated}
                title={topic.description}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  topicId === topic.id
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-slate-400 hover:border-accent/30 hover:text-slate-100'
                }`}
              >
                {topic.label}
                <span className="ml-1 text-slate-500">{topic.entryIds.length}</span>
              </button>
            ))}
          </nav>
        </div>
        {activeTopic && (
          <p className="mt-3 text-xs leading-relaxed text-slate-400">{activeTopic.description}</p>
        )}
        {activeFilterLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active filters</span>
            {activeFilterLabels.map((label) => (
              <span key={label} className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent">
                {label}
              </span>
            ))}
            <span className="text-xs text-slate-500">This filtered view is reflected in the URL.</span>
          </div>
        )}
      </div>

      {filteredArticles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredArticles.map((article) => (
            <DeepDiveArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-6 text-sm text-slate-400">
          {describeNoResults(query, activeTopic)}
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hydrated}
            className="ml-1 text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Reset filters
          </button>
          .
        </div>
      )}
    </section>
  );
}
