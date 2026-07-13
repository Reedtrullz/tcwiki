'use client';

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { recordAnchor } from '@/lib/utils';
import type { SecurityIncident, SourcedRecord } from '@/lib/types';

type IncidentPostureFilter = 'all' | 'current' | 'needs-review' | 'historical-open' | 'resolved';

interface IncidentFilterState {
  query: string;
  posture: IncidentPostureFilter;
}

interface IncidentPosture {
  filter: Exclude<IncidentPostureFilter, 'all'>;
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info';
  note: string;
}

const ALL = 'all';
const QUERY_PARAM = 'q';
const POSTURE_PARAM = 'posture';
const postureFilters: Array<{ value: IncidentPostureFilter; label: string }> = [
  { value: ALL, label: 'All' },
  { value: 'current', label: 'Current tracker' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'historical-open', label: 'Historical open' },
  { value: 'resolved', label: 'Resolved' },
];

function normalizePostureFilter(value: string | null): IncidentPostureFilter {
  return postureFilters.some((filter) => filter.value === value) ? value as IncidentPostureFilter : ALL;
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

function incidentPosture(incident: SecurityIncident): IncidentPosture {
  if (incident.resolved) {
    return {
      filter: 'resolved',
      label: 'Resolved',
      variant: 'success',
      note: 'Dated resolved incident record; still use current diagnostics for present-tense safety claims.',
    };
  }

  if (incident.trackerStatus === 'current') {
    return {
      filter: 'current',
      label: 'Current tracker',
      variant: 'warning',
      note: 'Promoted to the current recovery tracker above; pair this dated record with live diagnostics.',
    };
  }

  if (incident.trackerStatus === 'needs-review') {
    return {
      filter: 'needs-review',
      label: 'Needs current review',
      variant: 'danger',
      note: 'Do not treat this as current state until the record is re-reviewed with live or updated sources.',
    };
  }

  if (incident.trackerStatus === 'historical-open') {
    return {
      filter: 'historical-open',
      label: 'Historical open record',
      variant: 'info',
      note: 'Kept in the archive as unresolved historical context; not promoted to current recovery status without re-review.',
    };
  }

  return {
    filter: 'needs-review',
    label: 'Open / needs review',
    variant: 'warning',
    note: 'Unresolved archive record; avoid present-tense recovery, safety, or availability claims without newer evidence.',
  };
}

function incidentMatchesQuery(record: SourcedRecord<SecurityIncident>, query: string) {
  const words = queryWords(query);
  if (words.length === 0) {
    return true;
  }

  const incident = record.data;
  const posture = incidentPosture(incident);
  const haystack = normalizeText([
    incident.id,
    incident.title,
    incident.date,
    incident.type,
    incident.description,
    incident.impact,
    posture.label,
    posture.note,
    ...incident.lessons,
    ...record.sources.map((source) => source.label),
  ].join(' '));

  return words.every((word) => haystack.includes(word));
}

function activePostureLabel(posture: IncidentPostureFilter) {
  return postureFilters.find((filter) => filter.value === posture)?.label ?? 'All';
}

export function GovernanceIncidentArchiveExplorer({
  incidentRecords,
}: {
  incidentRecords: SourcedRecord<SecurityIncident>[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const filters = useMemo<IncidentFilterState>(() => ({
    query: searchParams.get(QUERY_PARAM) ?? '',
    posture: normalizePostureFilter(searchParams.get(POSTURE_PARAM)),
  }), [searchParams]);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydratedSnapshot);
  const latestFiltersRef = useRef<IncidentFilterState>(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const filteredRecords = useMemo(() => incidentRecords.filter((record) => {
    const posture = incidentPosture(record.data);
    return (filters.posture === ALL || posture.filter === filters.posture) &&
      incidentMatchesQuery(record, filters.query);
  }), [filters.posture, filters.query, incidentRecords]);
  const postureCounts = useMemo(() => {
    const counts = new Map<IncidentPostureFilter, number>(postureFilters.map((filter) => [filter.value, 0]));
    counts.set(ALL, incidentRecords.length);
    for (const record of incidentRecords) {
      const posture = incidentPosture(record.data);
      counts.set(posture.filter, (counts.get(posture.filter) ?? 0) + 1);
    }
    return counts;
  }, [incidentRecords]);
  const activeFilters = filters.query.trim() !== '' || filters.posture !== ALL;
  const activeFilterLabels = [
    filters.posture !== ALL ? `Posture: ${activePostureLabel(filters.posture)}` : null,
    filters.query.trim() ? `Search: ${filters.query.trim()}` : null,
  ].filter((label): label is string => label !== null);

  const replaceFiltersInUrl = useCallback((nextFilters: IncidentFilterState) => {
    const nextParams = new URLSearchParams(searchParamString);
    const normalizedQuery = nextFilters.query.trim();

    if (normalizedQuery) {
      nextParams.set(QUERY_PARAM, normalizedQuery);
    } else {
      nextParams.delete(QUERY_PARAM);
    }

    if (nextFilters.posture === ALL) {
      nextParams.delete(POSTURE_PARAM);
    } else {
      nextParams.set(POSTURE_PARAM, nextFilters.posture);
    }

    const nextParamString = nextParams.toString();
    const nextUrl = nextParamString ? `${pathname}?${nextParamString}` : pathname;
    replaceUrlFromFilter(nextUrl);
  }, [pathname, searchParamString]);

  const updateFilters = (patch: Partial<IncidentFilterState>) => {
    const nextFilters = {
      ...latestFiltersRef.current,
      ...patch,
    };
    replaceFiltersInUrl(nextFilters);
    latestFiltersRef.current = nextFilters;
  };

  const updateQuery = (query: string) => {
    updateFilters({ query });
  };

  const updatePosture = (posture: IncidentPostureFilter) => {
    updateFilters({ posture });
  };

  const resetFilters = () => {
    updateFilters({
      query: '',
      posture: ALL,
    });
  };

  return (
    <section id="security-incidents" className="scroll-mt-24">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Security Incidents</h2>
        <p aria-live="polite" className="mt-1 text-xs leading-relaxed text-slate-400">
          Showing {filteredRecords.length} of {incidentRecords.length} incident records. Filter by posture before turning a dated incident into a current recovery or safety claim.
        </p>
      </div>

      <div className="mb-4 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <form role="search" aria-label="Filter security incidents" onSubmit={(event) => event.preventDefault()}>
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Filter security incidents"
                type="search"
                value={filters.query}
                disabled={!hydrated}
                onChange={(event) => updateQuery(event.currentTarget.value)}
                placeholder="Exploit, TCY, Bybit, router..."
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-slate-100 transition-colors placeholder:text-slate-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
            </div>
          </form>
          {activeFilters && (
            <button
              type="button"
              disabled={!hydrated}
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-2 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
              Reset filters
            </button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {postureFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              disabled={!hydrated}
              onClick={() => updatePosture(filter.value)}
              aria-pressed={filters.posture === filter.value}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                filters.posture === filter.value
                  ? 'border-accent/50 bg-accent/10 text-accent'
                  : 'border-border bg-surface text-slate-400 hover:border-accent/30 hover:text-slate-100'
              }`}
            >
              {filter.label}
              <span className="ml-1 text-slate-500">{postureCounts.get(filter.value) ?? 0}</span>
            </button>
          ))}
        </div>
        {activeFilterLabels.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Active filters</span>
            {activeFilterLabels.map((label) => (
              <span key={label} className="rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs text-accent">
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {filteredRecords.length > 0 ? (
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const incident = record.data;
            const posture = incidentPosture(incident);

            return (
              <Card key={incident.id} id={recordAnchor('incident', incident.id)} className="scroll-mt-24">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{incident.title}</h3>
                  <Badge variant={posture.variant}>{posture.label}</Badge>
                </div>
                <p className="mb-1 text-xs text-slate-400">
                  {incident.description} <span className="text-amber-300">{incident.impact}</span>
                </p>
                <p className="text-[11px] leading-relaxed text-slate-500">{posture.note}</p>
                <div className="mb-3 mt-2 flex flex-wrap gap-1">
                  {incident.lessons.map((lesson) => (
                    <span key={lesson} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400/80">{lesson}</span>
                  ))}
                </div>
                <div className="space-y-2">
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} />
                  {incident.url && (
                    <a
                      href={incident.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-[11px] text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
                    >
                      Incident source
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-5 text-sm text-slate-400">
          No incident records match the current filters.
          <button
            type="button"
            disabled={!hydrated}
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
