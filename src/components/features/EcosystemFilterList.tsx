'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import type { Chain, EcosystemProject, SourcedRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { routeCheckHrefForChain } from '@/lib/route-checks';
import { recordAnchor } from '@/lib/utils';
import {
  ECOSYSTEM_DIRECTORY_POSTURES,
  ecosystemDirectoryPosture,
  ecosystemDirectoryPostureLabel,
  type EcosystemDirectoryPosture,
} from '@/lib/ecosystem-directory';

interface EcosystemFilterListProps {
  projectRecords: SourcedRecord<EcosystemProject>[];
  chainRecords: SourcedRecord<Chain>[];
}

const ALL = 'all';
const QUERY_PARAM = 'q';
const CATEGORY_PARAM = 'category';
const CHAIN_PARAM = 'chain';
const POSTURE_PARAM = 'posture';
const LEGACY_STATUS_PARAM = 'status';
const LEGACY_CONFIDENCE_PARAM = 'confidence';
const selectControlClass = 'mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200 transition-colors focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/50';
const actionLinkClass = 'text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
type PostureFilter = EcosystemDirectoryPosture | typeof ALL;

interface EcosystemFilterState {
  query: string;
  category: string;
  chain: string;
  posture: PostureFilter;
}

interface CategoryTrustGuide {
  label: string;
  canIndicate: string;
  stillVerify: string;
}

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function normalizeSelectFilter(value: string | null, options: string[]) {
  return value && options.includes(value) ? value : ALL;
}

function isDirectoryPosture(value: string): value is EcosystemDirectoryPosture {
  return ECOSYSTEM_DIRECTORY_POSTURES.includes(value as EcosystemDirectoryPosture);
}

function normalizePostureFilter(value: string | null, options: EcosystemDirectoryPosture[]): PostureFilter {
  return value && isDirectoryPosture(value) && options.includes(value) ? value : ALL;
}

function categoryTrustGuide(category: string): CategoryTrustGuide {
  switch (category) {
    case 'Interface':
      return {
        label: 'Swap surface',
        canIndicate: 'a third-party interface to inspect for swaps, quotes, or account workflows.',
        stillVerify: 'live route state, quote output, recipient, slippage, fees, and wallet approvals.',
      };
    case 'Wallet':
      return {
        label: 'Wallet surface',
        canIndicate: 'a wallet or app surface to inspect for custody and signing workflows.',
        stillVerify: 'release source, download integrity, wallet permissions, device security, and support status.',
      };
    case 'Explorer':
      return {
        label: 'Explorer surface',
        canIndicate: 'an explorer to inspect transactions, pools, addresses, nodes, or historical context.',
        stillVerify: 'current availability against live THORNode, Midgard, or the relevant primary source.',
      };
    case 'Developer Tools':
      return {
        label: 'Builder surface',
        canIndicate: 'an SDK, library, API, or integration project to inspect before building.',
        stillVerify: 'package version, API compatibility, repository activity, licensing, and production readiness.',
      };
    default:
      return {
        label: 'Ecosystem surface',
        canIndicate: 'a sourced ecosystem pointer that may be useful to inspect.',
        stillVerify: 'current availability, safety, terms, source integrity, and suitability for the intended action.',
      };
  }
}

function describeNoResults(activeFilterLabels: string[]) {
  if (activeFilterLabels.length === 0) {
    return 'No ecosystem entries match the current filters.';
  }

  return `No ecosystem entries match ${activeFilterLabels.join(' + ')}.`;
}

function replaceUrlFromFilter(nextUrl: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.history.replaceState(window.history.state, '', nextUrl);
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

function sampleRouteChainForProject(project: EcosystemProject, activeChain: string) {
  return activeChain !== ALL && project.chains.includes(activeChain)
    ? activeChain
    : project.chains[0] ?? 'BTC';
}

function legacyFilterPosture(confidence: string | null, status: string | null): EcosystemDirectoryPosture | null {
  if (confidence === 'needs-review' || status === 'Needs review') {
    return 'needs-review';
  }
  if (confidence === 'historical') {
    return 'historical';
  }
  if (confidence === 'official' || confidence === 'curated' || status === 'Active') {
    return 'listed';
  }

  return null;
}

function directoryPostureBadgeVariant(posture: EcosystemDirectoryPosture) {
  if (posture === 'needs-review') {
    return 'warning' as const;
  }
  if (posture === 'historical') {
    return 'default' as const;
  }

  return 'info' as const;
}

export function EcosystemFilterList({ projectRecords, chainRecords }: EcosystemFilterListProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();

  const categories = useMemo(() => uniqueSorted(projectRecords.map((record) => record.data.category)), [projectRecords]);
  const chains = useMemo(() => uniqueSorted(projectRecords.flatMap((record) => record.data.chains)), [projectRecords]);
  const postures = useMemo(() => ECOSYSTEM_DIRECTORY_POSTURES.filter((posture) => (
    projectRecords.some((record) => ecosystemDirectoryPosture(record.freshness.confidence) === posture)
  )), [projectRecords]);
  const query = searchParams.get(QUERY_PARAM) ?? '';
  const category = normalizeSelectFilter(searchParams.get(CATEGORY_PARAM), categories);
  const chain = normalizeSelectFilter(searchParams.get(CHAIN_PARAM), chains);
  const posture = normalizePostureFilter(
    searchParams.get(POSTURE_PARAM) ?? legacyFilterPosture(
      searchParams.get(LEGACY_CONFIDENCE_PARAM),
      searchParams.get(LEGACY_STATUS_PARAM)
    ),
    postures
  );
  const latestFiltersRef = useRef<EcosystemFilterState>({
    query,
    category,
    chain,
    posture,
  });

  useEffect(() => {
    latestFiltersRef.current = {
      query,
      category,
      chain,
      posture,
    };
  }, [category, chain, posture, query]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = projectRecords.filter((record) => {
    const project = record.data;
    const searchableText = [
      project.id,
      project.name,
      project.category,
      project.description,
      project.url,
      ecosystemDirectoryPostureLabel(ecosystemDirectoryPosture(record.freshness.confidence)),
      ...project.chains,
      ...project.useFor,
      ...project.verifyBeforeUse,
      ...record.sources.map((source) => source.label),
    ].join(' ').toLowerCase();

    return (normalizedQuery === '' || searchableText.includes(normalizedQuery)) &&
      (category === ALL || project.category === category) &&
      (chain === ALL || project.chains.includes(chain)) &&
      (posture === ALL || ecosystemDirectoryPosture(record.freshness.confidence) === posture);
  });

  const activeFilters = normalizedQuery !== '' || category !== ALL || chain !== ALL || posture !== ALL;
  const activeFilterLabels = [
    normalizedQuery !== '' ? `Search: ${query.trim()}` : null,
    category !== ALL ? `Category: ${category}` : null,
    chain !== ALL ? `Chain: ${chain}` : null,
    posture !== ALL ? `Directory posture: ${ecosystemDirectoryPostureLabel(posture)}` : null,
  ].filter((label): label is string => label !== null);

  const replaceFiltersInUrl = useCallback((nextFilters: EcosystemFilterState) => {
    const nextParams = new URLSearchParams(searchParamString);
    const normalizedNextQuery = nextFilters.query.trim();

    if (normalizedNextQuery) {
      nextParams.set(QUERY_PARAM, normalizedNextQuery);
    } else {
      nextParams.delete(QUERY_PARAM);
    }

    if (nextFilters.category === ALL) {
      nextParams.delete(CATEGORY_PARAM);
    } else {
      nextParams.set(CATEGORY_PARAM, nextFilters.category);
    }

    if (nextFilters.chain === ALL) {
      nextParams.delete(CHAIN_PARAM);
    } else {
      nextParams.set(CHAIN_PARAM, nextFilters.chain);
    }

    nextParams.delete(LEGACY_STATUS_PARAM);
    nextParams.delete(LEGACY_CONFIDENCE_PARAM);

    if (nextFilters.posture === ALL) {
      nextParams.delete(POSTURE_PARAM);
    } else {
      nextParams.set(POSTURE_PARAM, nextFilters.posture);
    }

    const nextParamString = nextParams.toString();
    replaceUrlFromFilter(nextParamString ? `${pathname}?${nextParamString}` : pathname);
  }, [pathname, searchParamString]);

  const updateFilters = (patch: Partial<EcosystemFilterState>) => {
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
      category: ALL,
      chain: ALL,
      posture: ALL,
    });
  };

  return (
    <div>
      <div className="mb-6 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="ecosystem-filter-heading" className="text-sm font-semibold text-slate-100">Directory filters</h2>
            <p aria-live="polite" aria-atomic="true" className="mt-1 text-xs text-slate-400">
              Showing {filteredProjects.length} of {projectRecords.length} curated ecosystem entries.
            </p>
          </div>
          {activeFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 self-start rounded-md border border-border px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
        <div role="group" aria-labelledby="ecosystem-filter-heading" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs text-slate-400">
            Find
            <input
              type="search"
              value={query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Project, chain, route, wallet..."
              className={selectControlClass}
            />
          </label>
          <label className="text-xs text-slate-400">
            Category
            <select value={category} onChange={(event) => updateFilters({ category: event.target.value })} className={selectControlClass}>
              <option value={ALL}>All categories</option>
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Chain
            <select value={chain} onChange={(event) => updateFilters({ chain: event.target.value })} className={selectControlClass}>
              <option value={ALL}>All chains</option>
              {chains.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Directory posture
            <select
              value={posture}
              onChange={(event) => {
                const nextPosture = event.target.value;
                updateFilters({ posture: isDirectoryPosture(nextPosture) ? nextPosture : ALL });
              }}
              className={selectControlClass}
            >
              <option value={ALL}>All directory postures</option>
              {postures.map((option) => <option key={option} value={option}>{ecosystemDirectoryPostureLabel(option)}</option>)}
            </select>
          </label>
        </div>
        {activeFilterLabels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Active ecosystem filters">
            {activeFilterLabels.map((label) => (
              <span key={label} className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-[11px] text-accent">
                {label}
              </span>
            ))}
            <span className="text-[11px] text-slate-500">This filtered view is reflected in the URL.</span>
          </div>
        )}
      </div>

      <p aria-live="polite" className="mb-4 text-sm text-slate-400">
        Use filters to find a surface to inspect. Listings are references, not recommendations, endorsements, audits, or availability guarantees.
      </p>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Directory posture describes this wiki record only. Catalog listed means the record is included from cited sources as of the checked date. Neither label reports project uptime, route availability, wallet safety, endorsement, or current product support.
      </p>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filteredProjects.map((record) => {
            const project = record.data;
            const trustGuide = categoryTrustGuide(project.category);
            const sampleRouteChain = sampleRouteChainForProject(project, chain);
            const sampleRouteHref = routeCheckHrefForChain(sampleRouteChain);
            const directoryPosture = ecosystemDirectoryPosture(record.freshness.confidence);
            const needsSourceReview = directoryPosture === 'needs-review';
            const reviewNote = record.sources[0]?.notes ?? 'Primary source needs a fresh human review before this entry is treated as usable.';
            return (
              <div
                key={project.id}
                id={recordAnchor('ecosystem', project.id)}
                className={`scroll-mt-24 rounded-lg border bg-surface-elevated p-4 transition-colors ${needsSourceReview ? 'border-amber-400/30' : 'border-border'}`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h3 className="text-sm font-medium">{project.name}</h3>
                  <div className="flex flex-wrap justify-end gap-1">
                    <Badge variant={directoryPostureBadgeVariant(directoryPosture)}>
                      {ecosystemDirectoryPostureLabel(directoryPosture)}
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">{project.description}</p>
                <div className="mb-3 rounded-md border border-border bg-surface p-3">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge variant="info">{trustGuide.label}</Badge>
                    <Badge variant="warning">Not a safety proof</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">
                    <span className="font-medium text-slate-300">This listing can indicate: </span>
                    {trustGuide.canIndicate}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    <span className="font-medium text-slate-300">Still verify: </span>
                    {trustGuide.stillVerify}
                  </p>
                </div>
                {needsSourceReview && (
                  <div className="mb-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-3" role="note" aria-label={`${project.name} source review required`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200">Review before relying on this entry</p>
                    <p className="mt-1 text-xs leading-relaxed text-amber-100/90">
                      Keep this as a follow-up pointer until the direct source is refreshed. Source note: {reviewNote}
                    </p>
                  </div>
                )}
                <div className="mb-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Use for</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-400">
                      {project.useFor.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Check before use</p>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-400">
                      {project.verifyBeforeUse.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {project.chains.slice(0, 8).map((chainCode) => (
                    <span key={chainCode} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{chainCode}</span>
                  ))}
                  {project.chains.length > 8 && <span className="text-[10px] text-slate-400">+{project.chains.length - 8}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {needsSourceReview ? (
                    <Link href="/docs#third-party-interfaces-wallets" className={`${actionLinkClass} text-accent hover:text-accent/80`}>
                      Review source posture
                    </Link>
                  ) : (
                    <Link href={sampleRouteHref} className={`${actionLinkClass} text-accent hover:text-accent/80`}>
                      Check protocol route
                    </Link>
                  )}
                  <Link href="/network#network-diagnostics" className={`${actionLinkClass} text-slate-400 hover:text-slate-200`}>
                    Open diagnostics
                  </Link>
                  <Link href="/docs#third-party-interfaces-wallets" className={`${actionLinkClass} text-slate-400 hover:text-slate-200`}>
                    Read source map
                  </Link>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${actionLinkClass} ${needsSourceReview ? 'text-amber-200 hover:text-amber-100' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {needsSourceReview ? 'Open unreviewed external source' : 'Open external project'}
                  </a>
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-surface-elevated p-6 text-sm text-slate-400">
          <p className="font-medium text-slate-300">{describeNoResults(activeFilterLabels)}</p>
          <p className="mt-1">
            These filters only narrow the curated directory; they do not prove an interface is unavailable, unsafe, unsupported, or offline.
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

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-12">Curated Chain List ({chainRecords.length})</h2>
      <p className="text-sm text-slate-400 mb-4">
        Use this list as a source-backed index, not as proof that swaps or LP actions are currently open.
        {' '}
        <Link href="/network#network-diagnostics" className="text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          Check live diagnostics
        </Link>
        {' '}for current availability.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {chainRecords.map((record) => {
          const chainData = record.data;
          return (
            <div key={chainData.chain} className="p-3 rounded-lg bg-surface-elevated border border-border text-center">
              <p className="text-sm font-medium">{chainData.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{chainData.chain}</p>
              {chainData.statusNote && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{chainData.statusNote}</p>
              )}
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
          );
        })}
      </div>
    </div>
  );
}
