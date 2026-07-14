'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { routeCheckHrefForChain } from '@/lib/route-checks';
import type { Chain, SourcedRecord } from '@/lib/types';
import { recordAnchor } from '@/lib/utils';

interface ProtocolChainFinderProps {
  chainRecords: SourcedRecord<Chain>[];
  catalogReviewedAt: string;
}

const ALL = 'all';
const QUERY_PARAM = 'q';
const FORMAT_PARAM = 'format';
const NOTES_PARAM = 'notes';
const selectControlClass = 'mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200 transition-colors focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50';

type NoteFilter = typeof ALL | 'has-note' | 'no-note';

interface ChainFinderFilterState {
  query: string;
  format: string;
  notes: NoteFilter;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function normalizeSelectFilter(value: string | null, options: string[]) {
  return value && options.includes(value) ? value : ALL;
}

function normalizeNoteFilter(value: string | null): NoteFilter {
  return value === 'has-note' || value === 'no-note' ? value : ALL;
}

function noteFilterLabel(notes: NoteFilter) {
  if (notes === 'has-note') {
    return 'Has review note';
  }
  if (notes === 'no-note') {
    return 'No special note';
  }
  return 'All note states';
}

function formatDustThreshold(value: number | undefined) {
  if (typeof value !== 'number') {
    return 'Live inbound_addresses only';
  }

  return value.toLocaleString('en-US');
}

function chainMatchesQuery(record: SourcedRecord<Chain>, query: string) {
  const cleanedQuery = query.trim().toLowerCase();
  if (!cleanedQuery) {
    return true;
  }

  const chain = record.data;
  const searchableText = [
    chain.name,
    chain.chain,
    `${chain.chain}.${chain.chain}`,
    chain.explorer,
    chain.statusNote,
    record.freshness.checkedAt,
    record.freshness.nextReviewDue,
    record.freshness.confidence,
    record.freshness.reviewedBy,
    typeof chain.dustThreshold === 'number' ? String(chain.dustThreshold) : '',
    ...chain.addressFormats,
    ...record.sources.flatMap((source) => [
      source.label,
      source.url,
      source.retrievedAt,
      source.notes,
    ]),
  ].join(' ').toLowerCase();

  return searchableText.includes(cleanedQuery);
}

function filterChainRecords(records: SourcedRecord<Chain>[], filters: ChainFinderFilterState) {
  return records.filter((record) => {
    const chain = record.data;
    return chainMatchesQuery(record, filters.query) &&
      (filters.format === ALL || chain.addressFormats.includes(filters.format)) &&
      (filters.notes === ALL ||
        (filters.notes === 'has-note' ? Boolean(chain.statusNote) : !chain.statusNote));
  });
}

function activeFilterLabels(filters: ChainFinderFilterState) {
  return [
    filters.query.trim() ? `Search: ${filters.query.trim()}` : null,
    filters.format !== ALL ? `Address format: ${filters.format}` : null,
    filters.notes !== ALL ? `Notes: ${noteFilterLabel(filters.notes)}` : null,
  ].filter((label): label is string => label !== null);
}

function describeNoResults(labels: string[]) {
  if (labels.length === 0) {
    return 'No supported-chain catalog entries are available.';
  }

  return `No supported-chain catalog entries match ${labels.join(' + ')}.`;
}

function replaceUrlFromFilter(nextUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(window.history.state, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

export function ProtocolChainFinder({ chainRecords, catalogReviewedAt }: ProtocolChainFinderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const addressFormats = useMemo(
    () => uniqueSorted(chainRecords.flatMap((record) => record.data.addressFormats)),
    [chainRecords]
  );
  const query = searchParams.get(QUERY_PARAM) ?? '';
  const format = normalizeSelectFilter(searchParams.get(FORMAT_PARAM), addressFormats);
  const notes = normalizeNoteFilter(searchParams.get(NOTES_PARAM));
  const latestFiltersRef = useRef<ChainFinderFilterState>({
    query,
    format,
    notes,
  });

  useEffect(() => {
    latestFiltersRef.current = {
      query,
      format,
      notes,
    };
  }, [format, notes, query]);

  const filters = useMemo(() => ({
    query,
    format,
    notes,
  }), [format, notes, query]);
  const filteredRecords = useMemo(() => filterChainRecords(chainRecords, filters), [chainRecords, filters]);
  const labels = activeFilterLabels(filters);
  const activeFilters = labels.length > 0;

  const replaceFiltersInUrl = useCallback((nextFilters: ChainFinderFilterState) => {
    const nextParams = new URLSearchParams(searchParamString);
    const normalizedNextQuery = nextFilters.query.trim();

    if (normalizedNextQuery) {
      nextParams.set(QUERY_PARAM, normalizedNextQuery);
    } else {
      nextParams.delete(QUERY_PARAM);
    }

    if (nextFilters.format === ALL) {
      nextParams.delete(FORMAT_PARAM);
    } else {
      nextParams.set(FORMAT_PARAM, nextFilters.format);
    }

    if (nextFilters.notes === ALL) {
      nextParams.delete(NOTES_PARAM);
    } else {
      nextParams.set(NOTES_PARAM, nextFilters.notes);
    }

    const nextParamString = nextParams.toString();
    replaceUrlFromFilter(nextParamString ? `${pathname}?${nextParamString}` : pathname);
  }, [pathname, searchParamString]);

  const updateFilters = (patch: Partial<ChainFinderFilterState>) => {
    const nextFilters = {
      ...latestFiltersRef.current,
      ...patch,
    };
    latestFiltersRef.current = nextFilters;
    replaceFiltersInUrl(nextFilters);
  };

  const resetFilters = () => {
    replaceFiltersInUrl({
      query: '',
      format: ALL,
      notes: ALL,
    });
  };

  return (
    <section>
      <div className="mb-5 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 id="supported-chain-finder-heading" className="text-sm font-semibold text-slate-100">Supported Chain Finder</h2>
            <p aria-live="polite" aria-atomic="true" className="mt-1 text-xs text-slate-400">
              Showing {filteredRecords.length} of {chainRecords.length} catalog chain records from the {catalogReviewedAt} review.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Search by chain, code, asset notation, address format, source/freshness text, or review note. Live dust thresholds and availability belong in current THORNode evidence.
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

        <div role="group" aria-labelledby="supported-chain-finder-heading" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-slate-400">
            Find
            <input
              type="search"
              value={query}
              onChange={(event) => updateFilters({ query: event.currentTarget.value })}
              placeholder="SOL, EIP-55, EdDSA..."
              className={selectControlClass}
              aria-label="Find supported chains"
            />
          </label>
          <label className="text-xs text-slate-400">
            Address format
            <select value={format} onChange={(event) => updateFilters({ format: event.currentTarget.value })} className={selectControlClass}>
              <option value={ALL}>All formats</option>
              {addressFormats.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Review notes
            <select
              value={notes}
              onChange={(event) => updateFilters({ notes: normalizeNoteFilter(event.currentTarget.value) })}
              className={selectControlClass}
            >
              <option value={ALL}>All note states</option>
              <option value="has-note">Has review note</option>
              <option value="no-note">No special note</option>
            </select>
          </label>
        </div>

        {labels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Active supported-chain filters">
            {labels.map((label) => (
              <span key={label} className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[11px] text-accent">
                {label}
              </span>
            ))}
            <span className="text-[11px] text-slate-500">This filtered view is reflected in the URL.</span>
          </div>
        )}
      </div>

      {filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredRecords.map((record) => {
            const chain = record.data;
            const anchor = recordAnchor('chain', chain.chain);
            return (
              <Card key={chain.chain} id={anchor} padding="sm" className="scroll-mt-24">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{chain.name}</h3>
                    <p className="font-mono text-[11px] text-slate-400">{chain.chain}</p>
                  </div>
                  <Badge variant={chain.supported ? 'success' : 'warning'}>
                    {chain.supported ? 'catalog listed' : 'needs review'}
                  </Badge>
                </div>

                <dl className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">Address Formats</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {chain.addressFormats.map((addressFormat) => (
                        <span key={addressFormat} className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                          {addressFormat}
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">Dust Threshold</dt>
                    <dd className="mt-1">{formatDustThreshold(chain.dustThreshold)}</dd>
                  </div>
                </dl>

                <div className="mt-3 rounded-md border border-border bg-surface p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Catalog Boundary</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Listed means this chain was present in the curated inbound-address catalog. It does not prove swaps, signing, LP actions, gas, or a route are open now.
                  </p>
                </div>

                {chain.statusNote ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-400">
                    {chain.statusNote}
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    No special review note is attached to this catalog entry.
                  </p>
                )}

                <div className="mt-3">
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/network#network-diagnostics" className="text-[11px] font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                    Check live state
                  </Link>
                  <Link href={routeCheckHrefForChain(chain.chain)} className="text-[11px] font-semibold text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                    Check a route
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-6 text-sm text-slate-400">
          <p className="font-medium text-slate-300">{describeNoResults(labels)}</p>
          <p className="mt-1">
            These filters only narrow the curated catalog; they do not prove a chain is unavailable, unsupported by every interface, or halted.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 text-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}
