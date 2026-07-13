'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ECOSYSTEM_PROJECT_RECORDS, RESEARCH_REPORT_RECORDS } from '@/lib/data/static';
import { Activity, TrendingUp, Shield, Layers } from 'lucide-react';
import { useMidgardHealth, useNetworkData, useNetworkStatus, usePools } from '@/lib/hooks/useMidgard';
import { StatCard } from '@/components/ui/StatCard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { DEEP_DIVE_READER_PATHS, HOME_DECISION_LINKS, getContentEntry } from '@/lib/content/registry';
import { formatPercent, formatRuneFromBaseUnits, getConfidenceLabel, getConfidenceTone, normalizeApyToPercent } from '@/lib/trust';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { recordAnchor } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { midgardResultHasCleanHealth, midgardSourceIssueIsVisible } from '@/lib/stats-dashboard';
import { ecosystemDirectoryPosture, ecosystemDirectoryPostureLabel } from '@/lib/ecosystem-directory';
import type { DataConfidence } from '@/lib/types';

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

const quickLinks = [
  {
    label: 'THORChain Docs',
    href: 'https://docs.thorchain.org',
    sourceType: 'Official docs',
    boundary: 'Protocol design, operations, and feature docs.',
  },
  {
    label: 'Developer Docs',
    href: 'https://dev.thorchain.org',
    sourceType: 'Developer docs',
    boundary: 'Integration, quote, asset, and endpoint behavior.',
  },
  {
    label: 'Midgard API',
    href: 'https://midgard.thorchain.network/v2/doc',
    sourceType: 'Consumer API',
    boundary: 'Dashboard-friendly current and historical metrics.',
  },
  {
    label: 'RuneScan Explorer',
    href: 'https://runescan.io',
    sourceType: 'Explorer',
    boundary: 'Transactions, pools, nodes, and account inspection.',
  },
];

function homeEcosystemCatalogBadge(confidence: DataConfidence) {
  const posture = ecosystemDirectoryPosture(confidence);

  return {
    label: ecosystemDirectoryPostureLabel(posture),
    variant: posture === 'needs-review' ? 'warning' as const : 'default' as const,
    needsReview: posture === 'needs-review',
  };
}

function homeEcosystemBoundary(category: string, checkedAt: string, needsReview: boolean) {
  if (needsReview) {
    return `Checked ${checkedAt}. Confirm the direct source is reachable and reconciled before citing it.`;
  }

  switch (category) {
    case 'Interface':
      return `Checked ${checkedAt}. Verify live quote, route, fees, recipient, and wallet approvals before signing.`;
    case 'Wallet':
      return `Checked ${checkedAt}. Verify release source, wallet permissions, route, and device security before signing.`;
    case 'Explorer':
      return `Checked ${checkedAt}. Cross-check explorer context against THORNode or Midgard before citing it.`;
    case 'Developer Tools':
      return `Checked ${checkedAt}. Verify package versions, API behavior, and production readiness before building.`;
    default:
      return `Checked ${checkedAt}. Verify current source state before relying on this pointer.`;
  }
}

const homeEcosystemPreviewIds = [
  'thorchain-swap',
  'thorwallet',
  'vultisig',
  'rango',
  'runescan',
  'viewblock',
  'swapkit',
  'xchainjs',
];

const homeEcosystemPreviewRecords = homeEcosystemPreviewIds.map((id) => {
  const record = ECOSYSTEM_PROJECT_RECORDS.find((candidate) => candidate.data.id === id);

  if (!record) {
    throw new Error(`Missing home ecosystem preview record: ${id}`);
  }

  return record;
});

function homeExploreEntry(id: string) {
  return getContentEntry(id);
}

const homeExploreGroups = [
  {
    id: 'live-claims',
    title: 'Live And Claim Checks',
    description: 'Start here when the question depends on current state, source quality, or a specific present-tense claim.',
    entries: [
      homeExploreEntry('search'),
      homeExploreEntry('network'),
      homeExploreEntry('stats'),
      homeExploreEntry('dynamic-fees'),
      homeExploreEntry('deep-dive-mimir-halt-controls'),
      homeExploreEntry('tcy'),
    ],
  },
  {
    id: 'sources-and-builders',
    title: 'Sources And Builders',
    description: 'Use these before choosing endpoint families, app surfaces, or third-party tooling.',
    entries: [
      homeExploreEntry('docs'),
      homeExploreEntry('deep-dive-midgard-thornode-data'),
      homeExploreEntry('deep-dive-build-query-data'),
      homeExploreEntry('ecosystem'),
      homeExploreEntry('deep-dive-app-layer'),
      homeExploreEntry('glossary'),
    ],
  },
  {
    id: 'mechanics-and-recovery',
    title: 'Mechanics And Recovery',
    description: 'Read mechanism and history pages with the current-state boundary still attached.',
    entries: [
      homeExploreEntry('protocol'),
      homeExploreEntry('economics'),
      homeExploreEntry('rune'),
      homeExploreEntry('deep-dive-liquidity-actions'),
      homeExploreEntry('deep-dive-runepool-pol'),
      homeExploreEntry('deep-dive-streaming-swaps-refunds'),
    ],
  },
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Start With The Claim</h2>
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
            <h2 id="home-live-status-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">Live Operations Snapshot</h2>
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

      <section className="px-6 max-w-7xl mx-auto mb-8">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Check The Right Thing First</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Use the live surface that matches the question before turning a number, pause, or third-party listing into a claim.
            </p>
          </div>
          <Link href="/search#search-guided-answers" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
            Browse guided answers →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {HOME_DECISION_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="rounded border border-border bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {link.badge}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-100">{link.question}</p>
              <p className="mt-1 text-xs font-medium text-accent">{link.label}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="flex flex-col gap-1 mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Learn in Sequence</h2>
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

      {/* Explore topics */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Explore</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Intentional entry points for current checks, source choices, builders, and mechanism context. Review posture stays visible on each link.
            </p>
          </div>
          <Link href="/docs#source-map-chooser" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
            Match source to claim →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {homeExploreGroups.map((group) => (
            <div key={group.id} className="rounded-lg border border-border bg-surface-elevated p-4">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-100">{group.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{group.description}</p>
              </div>
              <div className="divide-y divide-border">
                {group.entries.map((entry) => (
                  <Link
                    key={entry.id}
                    href={entry.href}
                    className="group block py-3 first:pt-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="min-w-0 text-sm font-semibold text-slate-200 transition-colors group-hover:text-accent">{entry.title}</span>
                      <Badge variant={getConfidenceTone(entry.confidence)}>{getConfidenceLabel(entry.confidence)}</Badge>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{entry.description}</p>
                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Checked {entry.reviewedAt}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ecosystem preview */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Ecosystem</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Pointer list, not endorsement. Verify route state, wallet safety, explorer reachability, and current source evidence before use.
            </p>
          </div>
          <Link href="/ecosystem#interface-use-checklist" className="text-xs text-slate-400 hover:text-slate-300 transition-colors">Open interface checklist →</Link>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {homeEcosystemPreviewRecords.map((record) => {
            const project = record.data;
            const directoryBadge = homeEcosystemCatalogBadge(record.freshness.confidence);
            return (
              <Link
                key={project.id}
                href={`/ecosystem#${recordAnchor('ecosystem', project.id)}`}
                className="block p-4 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors group"
              >
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant={directoryBadge.variant}>{directoryBadge.label}</Badge>
                </div>
                <p className="text-sm font-medium group-hover:text-accent transition-colors">{project.name}</p>
                <p className="text-[11px] text-slate-400 mt-1">{project.category}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                  {homeEcosystemBoundary(project.category, record.freshness.checkedAt, directoryBadge.needsReview)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Research */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Research</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
              Dated analysis context, not live protocol proof. Use these reports for period framing before checking current sources.
            </p>
          </div>
          <Link href="/docs#source-map-chooser" className="text-xs text-slate-400 transition-colors hover:text-slate-300">
            Source map →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESEARCH_REPORT_RECORDS.map((record) => {
            const report = record.data;
            const primarySource = record.sources[0]?.label ?? report.source;
            return (
              <a
                key={report.id}
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-5 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors"
              >
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <Badge variant={getConfidenceTone(record.freshness.confidence)}>{getConfidenceLabel(record.freshness.confidence)}</Badge>
                  <span className="text-[11px] text-slate-500">Checked {record.freshness.checkedAt}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">{report.date} · {primarySource}</p>
                <h3 className="text-sm font-semibold mb-2">{report.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{report.summary}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-slate-500">Not live protocol proof.</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Quick links */}
      <section className="px-6 max-w-7xl mx-auto pb-20">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quick Links</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
            External sources answer different questions; match the source family to the claim before citing it.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border bg-surface-elevated p-4 text-left transition-colors hover:border-accent/20 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <span className="block text-sm font-semibold text-slate-300">{l.label}</span>
              <span className="mt-2 block text-[11px] font-medium uppercase tracking-wider text-slate-500">{l.sourceType}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{l.boundary}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
