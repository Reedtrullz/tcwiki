'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check, Copy, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  buildSourceMapEvidencePacket,
  deriveSourceMapExplorer,
  type SourceMapExplorerChoice,
  type SourceMapExplorerDecision,
  type SourceMapExplorerFilters,
  type SourceMapExplorerSection,
  type SourceMapExplorerView,
} from '@/lib/source-map-explorer';

const QUERY_PARAM = 'source_q';
const VIEW_PARAM = 'source_view';

const viewOptions: Array<{ value: SourceMapExplorerView; label: string }> = [
  { value: 'all', label: 'All source paths' },
  { value: 'claim-paths', label: 'Claim paths' },
  { value: 'source-families', label: 'Source families' },
];

function SourceChoiceLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith('/docs#') || href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function normalizeSourceMapView(value: string | null): SourceMapExplorerView {
  if (value === 'claim-paths' || value === 'source-families') {
    return value;
  }

  return 'all';
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

function TriageCard({ choice }: { choice: SourceMapExplorerChoice }) {
  return (
    <SourceChoiceLink
      href={choice.href}
      className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{choice.label}</span>
      <span className="mt-2 block text-sm font-semibold leading-snug text-slate-100">{choice.question}</span>
      <span className="mt-3 block text-xs leading-relaxed text-accent">Start with: {choice.startWith}</span>
      <span className="mt-2 block text-xs leading-relaxed text-amber-200/80">Do not infer: {choice.avoid}</span>
    </SourceChoiceLink>
  );
}

function DecisionCard({ decision }: { decision: SourceMapExplorerDecision }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const evidencePacket = useMemo(() => buildSourceMapEvidencePacket(decision), [decision]);

  const copyEvidencePacket = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setCopyState('failed');
      return;
    }

    try {
      await navigator.clipboard.writeText(evidencePacket);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <article
      className="rounded-lg border border-border bg-surface-elevated p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claim Type</p>
          <h3 className="mt-2 text-base font-semibold leading-snug text-slate-100">{decision.claim}</h3>
        </div>
        <SourceChoiceLink
          href={decision.startWith.href}
          className="shrink-0 rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {decision.startWith.label}
        </SourceChoiceLink>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">{decision.why}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {decision.nextChecks.map((check) => (
          <SourceChoiceLink
            key={check.href}
            href={check.href}
            className="rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <span className="block text-sm font-semibold text-slate-200">{check.label}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-400">{check.description}</span>
          </SourceChoiceLink>
        ))}
      </div>
      <p className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200">
        Do not claim: {decision.avoidClaiming}
      </p>
      <details className="mt-3 rounded-md border border-border bg-surface/70 p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-400 marker:text-slate-500">
          Evidence packet
        </summary>
        <div className="mt-3">
          <div className="grid gap-2 text-xs leading-relaxed text-slate-400">
            <p>
              <span className="font-semibold text-slate-300">Start source:</span> {decision.startWith.label}
            </p>
            {decision.sourcePosture && (
              <>
                <p>
                  <span className="font-semibold text-slate-300">Source posture:</span> {decision.sourcePosture.confidence}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">Checked / review due:</span> {decision.sourcePosture.checkedAt} / {decision.sourcePosture.nextReviewDue}
                </p>
                <p>
                  <span className="font-semibold text-slate-300">Primary source:</span> {decision.sourcePosture.primarySource.label}
                </p>
              </>
            )}
            <p>
              <span className="font-semibold text-slate-300">Carry forward:</span> cite the start source, run the next checks that match the claim, and keep the non-claim boundary attached.
            </p>
          </div>
          <button
            type="button"
            onClick={copyEvidencePacket}
            aria-label={`Copy evidence packet for ${decision.claim}`}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-accent/30 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            {copyState === 'copied' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copyState === 'copied' ? 'Copied packet' : 'Copy packet'}
          </button>
          {copyState === 'failed' && (
            <p className="mt-2 text-xs leading-relaxed text-amber-200">
              Clipboard unavailable; the visible packet below is the same text.
            </p>
          )}
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-black/20 p-3 text-[11px] leading-relaxed text-slate-300">
            {evidencePacket}
          </pre>
        </div>
      </details>
    </article>
  );
}

function SourceFamilyCard({ section }: { section: SourceMapExplorerSection }) {
  return (
    <a
      href={`#${section.id}`}
      className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-200">{section.decision}</p>
    </a>
  );
}

export function SourceMapExplorer({
  triageChoices,
  decisions,
  sections,
}: {
  triageChoices: SourceMapExplorerChoice[];
  decisions: SourceMapExplorerDecision[];
  sections: SourceMapExplorerSection[];
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const filters = useMemo<SourceMapExplorerFilters>(() => ({
    query: searchParams.get(QUERY_PARAM) ?? '',
    view: normalizeSourceMapView(searchParams.get(VIEW_PARAM)),
  }), [searchParams]);
  const hydrated = useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerHydratedSnapshot);
  const latestFiltersRef = useRef<SourceMapExplorerFilters>(filters);

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const explorer = useMemo(() => deriveSourceMapExplorer({
    triageChoices,
    decisions,
    sections,
    filters,
  }), [decisions, filters, sections, triageChoices]);

  const replaceFiltersInUrl = useCallback((nextFilters: SourceMapExplorerFilters) => {
    const nextParams = new URLSearchParams(searchParamString);
    const nextQuery = nextFilters.query.trim();

    if (nextQuery) {
      nextParams.set(QUERY_PARAM, nextQuery);
    } else {
      nextParams.delete(QUERY_PARAM);
    }

    if (nextFilters.view !== 'all' || nextQuery) {
      nextParams.set(VIEW_PARAM, nextFilters.view);
    } else {
      nextParams.delete(VIEW_PARAM);
    }

    const nextParamString = nextParams.toString();
    const nextUrl = `${pathname}${nextParamString ? `?${nextParamString}` : ''}#source-map-chooser`;
    replaceUrlFromFilter(nextUrl);
  }, [pathname, searchParamString]);

  const updateFilters = (patch: Partial<SourceMapExplorerFilters>) => {
    const nextFilters = {
      ...latestFiltersRef.current,
      ...patch,
    };
    replaceFiltersInUrl(nextFilters);
    latestFiltersRef.current = nextFilters;
  };

  const resetFilters = () => updateFilters({ query: '', view: 'all' });

  return (
    <>
      <div className="mb-7 rounded-lg border border-border bg-surface/60 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13rem_auto]">
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Source-map filter
            <span className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                aria-label="Filter source map"
                value={filters.query}
                disabled={!hydrated}
                onChange={(event) => updateFilters({ query: event.target.value })}
                placeholder="Wallet safety, TCY, quote, RUNEPool..."
                className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-accent/50 focus:ring-1 focus:ring-accent/50 disabled:cursor-wait disabled:opacity-60"
              />
            </span>
          </label>
          <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            View
            <select
              aria-label="Source map view"
              value={filters.view}
              disabled={!hydrated}
              onChange={(event) => updateFilters({ view: event.target.value as SourceMapExplorerView })}
              className="h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent/50 focus:ring-1 focus:ring-accent/50 disabled:cursor-wait disabled:opacity-60"
            >
              {viewOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hydrated || explorer.activeFilterLabels.length === 0}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-slate-300 transition hover:border-accent/30 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Reset source map filters
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-slate-400">{explorer.summary}</p>
          {explorer.activeFilterLabels.length > 0 && (
            <div aria-label="Active source-map filters" className="flex flex-wrap gap-2">
              {explorer.activeFilterLabels.map((label) => (
                <Badge key={label} variant="info">{label}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {explorer.totalVisible === 0 ? (
        <div className="mb-7 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-relaxed text-amber-100">
          {explorer.emptyMessage}
        </div>
      ) : (
        <>
          {explorer.triageChoices.length > 0 && (
            <div aria-label="Fast source triage" className="mb-7 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {explorer.triageChoices.map((choice) => (
                <TriageCard key={choice.id} choice={choice} />
              ))}
            </div>
          )}

          {explorer.decisions.length > 0 && (
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {explorer.decisions.map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          )}

          {explorer.sections.length > 0 && (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Source Families</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {explorer.sections.map((section) => (
                  <SourceFamilyCard key={section.id} section={section} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
