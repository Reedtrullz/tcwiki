'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import type { DataConfidence, SourceMeta } from '@/lib/types';

export interface GlossaryExplorerTerm {
  id: string;
  term: string;
  definition: string;
  category: string;
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  relatedLinks: Array<{
    href: string;
    label: string;
  }>;
}

const ALL_CATEGORIES = 'all';

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

function termMatchesQuery(term: GlossaryExplorerTerm, query: string) {
  const words = queryWords(query);
  if (words.length === 0) {
    return true;
  }

  const haystack = normalizeText([
    term.term,
    term.definition,
    term.category,
    ...term.sources.map((source) => source.label),
    ...term.relatedLinks.map((link) => link.label),
  ].join(' '));

  return words.every((word) => haystack.includes(word));
}

function categoryLabel(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function GlossaryTermCard({ term }: { term: GlossaryExplorerTerm }) {
  return (
    <article id={`term-${term.id}`} className="scroll-mt-24 rounded-lg border border-border bg-surface-elevated p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{term.term}</h3>
        <Badge variant="info">{term.category}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-slate-400">{term.definition}</p>
      <div className="mt-3">
        <FreshnessMeta
          freshness={{
            checkedAt: term.reviewedAt,
            confidence: term.confidence,
            nextReviewDue: term.nextReviewDue,
          }}
          sources={term.sources}
          compact
        />
      </div>
      {term.relatedLinks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {term.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-[11px] text-accent hover:text-accent/80">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

export function GlossaryExplorer({ terms }: { terms: GlossaryExplorerTerm[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const categories = useMemo(
    () => Array.from(new Set(terms.map((term) => term.category))).sort((left, right) => left.localeCompare(right)),
    [terms]
  );
  const activeFilters = query.trim() !== '' || category !== ALL_CATEGORIES;
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>(categories.map((value) => [value, 0]));
    for (const term of terms) {
      counts.set(term.category, (counts.get(term.category) ?? 0) + 1);
    }
    return counts;
  }, [categories, terms]);
  const filteredTerms = useMemo(() => terms.filter((term) => (
    (category === ALL_CATEGORIES || term.category === category) &&
    termMatchesQuery(term, query)
  )), [category, query, terms]);
  const visibleCategories = categories
    .map((value) => ({
      category: value,
      terms: filteredTerms.filter((term) => term.category === value),
    }))
    .filter((group) => group.terms.length > 0);

  const resetFilters = () => {
    setQuery('');
    setCategory(ALL_CATEGORIES);
  };

  return (
    <section aria-labelledby="glossary-explorer" className="space-y-8">
      <div className="rounded-lg border border-border bg-surface-elevated p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 id="glossary-explorer" className="text-sm font-semibold text-slate-100">Term Finder</h2>
            <p aria-live="polite" className="mt-1 text-xs text-slate-400">
              Showing {filteredTerms.length} of {terms.length} source-backed terms.
            </p>
          </div>
          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 self-start rounded-md border border-border px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 lg:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <form role="search" aria-label="Filter glossary terms" onSubmit={(event) => event.preventDefault()}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Filter glossary terms"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter terms..."
                className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-slate-100 shadow-sm transition-colors placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          </form>

          <nav aria-label="Glossary categories" className="flex flex-wrap gap-2 lg:max-w-xl lg:justify-end">
            <button
              type="button"
              onClick={() => setCategory(ALL_CATEGORIES)}
              aria-pressed={category === ALL_CATEGORIES}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                category === ALL_CATEGORIES
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border bg-surface text-slate-400 hover:border-accent/30 hover:text-slate-100'
              }`}
            >
              All terms
              <span className="ml-1 text-slate-500">{terms.length}</span>
            </button>
            {categories.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCategory(option)}
                aria-pressed={category === option}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                  category === option
                    ? 'border-accent/50 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-slate-400 hover:border-accent/30 hover:text-slate-100'
                }`}
              >
                {categoryLabel(option)}
                <span className="ml-1 text-slate-500">{categoryCounts.get(option) ?? 0}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {visibleCategories.map((group) => (
        <section key={group.category} id={group.category} className="scroll-mt-24">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">{group.category}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {group.terms.map((term) => (
              <GlossaryTermCard key={term.id} term={term} />
            ))}
          </div>
        </section>
      ))}

      {filteredTerms.length === 0 && (
        <div className="rounded-lg border border-border bg-surface-elevated p-6 text-sm text-slate-400">
          No glossary terms match the current filters.
          <button
            type="button"
            onClick={resetFilters}
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
