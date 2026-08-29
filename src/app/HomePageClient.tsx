'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Activity, TrendingUp, Shield, Layers } from 'lucide-react';
import { useMidgardHealth, useNetworkData, useNetworkStatus, usePools } from '@/lib/hooks/useMidgard';
import { StatCard } from '@/components/ui/StatCard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import { formatPercent, formatRuneFromBaseUnits, normalizeApyToPercent } from '@/lib/trust';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { midgardResultHasCleanHealth, midgardSourceIssueIsVisible } from '@/lib/stats-dashboard';

const homeReaderPaths = DEEP_DIVE_READER_PATHS.map((path) => {
  const firstEntry = getContentEntry(path.entryIds[0]);

  return {
    ...path,
    firstEntry,
    href: `/deep-dives#deep-dive-path-${path.id}`,
  };
});

interface HomePageClientProps {
  sourcePosture?: ReactNode;
}

const homeProofRoutes = [
  {
    label: 'Live operations',
    href: '/network#network-diagnostics',
    badge: 'current-only',
    description: 'Ordinary swaps, limited chains, LP controls, and source warnings.',
  },
  {
    label: 'Metrics',
    href: '/stats#stats-look-here-first',
    badge: 'Midgard',
    description: 'Liquidity, node, reward, pool, and chart data with freshness labels.',
  },
  {
    label: 'Design or history',
    href: '/deep-dives#deep-dive-reader-paths',
    badge: 'curated',
    description: 'Long-form explanations, incident context, and non-claim boundaries.',
  },
  {
    label: 'Official sources',
    href: '/docs#source-map-chooser',
    badge: 'source map',
    description: 'Docs, developer references, live endpoints, explorers, and community context.',
  },
];

const homeExternalLinks = [
  { label: 'THORChain Docs', href: 'https://docs.thorchain.org' },
  { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
  { label: 'Midgard API', href: 'https://midgard.thorchain.network/v2/doc' },
  { label: 'RuneScan Explorer', href: 'https://runescan.io' },
];

export default function HomePageClient({ sourcePosture }: HomePageClientProps) {
  const {
    data: networkData,
    result: networkResult,
    isLoading: networkLoading,
    isDegraded: networkDegraded,
  } = useNetworkData();
  const { result: midgardHealthResult } = useMidgardHealth();
  const { result: statusResult, isLoading: statusLoading } = useNetworkStatus();
  const {
    data: pools,
    result: poolsResult,
    isLoading: poolsLoading,
    isDegraded: poolsDegraded,
  } = usePools();

  const networkFallbackValue = networkLoading && !networkData ? 'Loading' : 'Unavailable';
  const poolFallbackValue = poolsLoading && !pools ? 'Loading' : 'Unavailable';
  const networkMetricsAvailable = Boolean(networkData && !networkDegraded && midgardResultHasCleanHealth(networkResult, midgardHealthResult));
  const poolsAvailable = Boolean(pools && !poolsDegraded && midgardResultHasCleanHealth(poolsResult, midgardHealthResult));
  const midgardSourceIssueVisible = midgardSourceIssueIsVisible(networkResult, midgardHealthResult, networkLoading) ||
    midgardSourceIssueIsVisible(poolsResult, midgardHealthResult, poolsLoading);
  const poolCount = poolsAvailable && pools ? String(pools.length) : poolFallbackValue;
  const runePooled = networkMetricsAvailable && networkData
    ? formatRuneFromBaseUnits(networkData.totalPooledRune)
    : networkFallbackValue;
  const bondingApy = networkMetricsAvailable && networkData
    ? formatPercent(normalizeApyToPercent(networkData.bondingAPY, 'decimal'))
    : networkFallbackValue;
  const activeNodes = networkMetricsAvailable && networkData
    ? networkData.activeNodeCount
    : networkFallbackValue;

  return (
    <div className="pt-[52px]">
      {/* Hero */}
      <section className="px-6 py-10 sm:py-16 max-w-7xl mx-auto">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-end">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              THORChain Wiki
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl">
              Community-maintained encyclopedia of the THORChain protocol:
              architecture, economics, governance, ecosystem, and source-backed live network data.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/network#network-diagnostics" className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/50">
                Check live operations
              </Link>
              <Link href="/search#search-guided-answers" className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/30">
                Browse guided answers
              </Link>
              <Link href="/deep-dives#deep-dive-reader-paths" className="rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/30">
                Follow learning paths
              </Link>
            </div>
          </div>
          <Card id="home-source-router" padding="md" className="border-accent/15">
            <div className="mb-4">
              <h2 className="text-lg font-semibold normal-case tracking-normal text-slate-100">Start With The Claim</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                Pick the proof path before treating a number, halt, interface, ADR, or incident note as current truth.
              </p>
            </div>
            <div className="divide-y divide-border">
              {homeProofRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="block py-2.5 transition-colors first:pt-0 last:pb-0 sm:py-3 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">{route.label}</span>
                    <Badge variant={route.badge === 'current-only' ? 'success' : 'default'}>{route.badge}</Badge>
                  </div>
                  <p className="mt-1 hidden text-[11px] leading-relaxed text-slate-400 sm:block">{route.description}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {sourcePosture ? (
        <section className="px-6 max-w-7xl mx-auto mb-8">
          {sourcePosture}
        </section>
      ) : null}

      <section aria-labelledby="home-live-status-heading" className="px-6 max-w-7xl mx-auto mb-8">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="home-live-status-heading" className="text-lg font-semibold normal-case tracking-normal text-slate-100">Live Operations Snapshot</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Current THORNode evidence belongs before present-tense claims about swaps, LP actions, signing, TCY, or route availability.
            </p>
          </div>
          <Link href="/network#network-diagnostics" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
            Open diagnostics →
          </Link>
        </div>
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} variant="compact" />
      </section>

      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="flex flex-col gap-1 mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold normal-case tracking-normal text-slate-100">Learn in Sequence</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Guided reading paths keep explanatory articles separate from current-state proof.
            </p>
          </div>
          <Link href="/deep-dives#deep-dive-reader-paths" className="text-xs text-slate-400 hover:text-slate-300 transition-colors">
            View all paths →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {homeReaderPaths.map((path) => (
            <Link
              key={path.id}
              href={path.href}
              className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <p className="text-sm font-semibold text-slate-200">{path.title}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{path.description}</p>
              <div className="mt-4 border-t border-border pt-3 text-[11px] leading-relaxed text-slate-500">
                <span className="block text-slate-400">Start with {path.firstEntry.title}</span>
                <span className="mt-1 block">Verify before claiming: {path.verifyBeforeClaiming[0]}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Network stats strip */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Layers className="h-4 w-4" />} label="Pooled RUNE" value={`${runePooled}`} unit={networkMetricsAvailable ? 'RUNE' : undefined} />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Bonding APY" value={bondingApy} />
          <StatCard icon={<Shield className="h-4 w-4" />} label="Active Nodes" value={String(activeNodes)} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Midgard Pool Rows" value={poolCount} />
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Network metrics source</p>
            <LiveSourceMeta result={networkResult} healthResult={midgardHealthResult} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Pool rows source</p>
            <LiveSourceMeta result={poolsResult} healthResult={midgardHealthResult} />
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Counts Midgard <code>/pools?status=available</code> rows. This is pool-list context, not proof that a route will quote or settle.
            </p>
          </div>
          {midgardSourceIssueVisible && (
            <p className="text-xs text-amber-300 lg:col-span-2">One or more Midgard sources are degraded, warning-backed, provider-mismatched, or missing health confirmation; values are unavailable rather than assumed zero.</p>
          )}
        </div>
      </section>

      {/* Quick links (footer-level external sources, kept compact) */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {homeExternalLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border bg-surface-elevated p-3 text-sm font-semibold text-slate-300 transition-colors hover:border-accent/20 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {l.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

