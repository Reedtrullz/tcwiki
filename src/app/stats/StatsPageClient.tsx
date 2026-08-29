'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Activity, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useNetworkData, useEarningsHistory, useNetworkStatus, useMidgardHealth, usePools } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  deriveStatsDecisionFacts,
  deriveStatsEarningsCoverage,
  deriveStatsEarningsRows,
  deriveStatsMetricCards,
  deriveStatsPoolExplorer,
  deriveStatsPoolSnapshot,
  midgardSourceIssueIsVisible,
  type StatsDecisionFact,
  type StatsMetricCard,
} from '@/lib/stats-dashboard';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { usePoolExplorerFilters } from '@/hooks/usePoolExplorerFilters';
import { StatsPoolExplorer } from '@/components/features/StatsPoolExplorer';
import { StatsEarningsTable } from '@/components/features/StatsEarningsTable';

const statsRelatedChecks: RelatedCheck[] = [
  {
    label: 'Live data guide',
    href: '/deep-dives/midgard-thornode-data',
    badge: 'proof boundary',
    description: 'Check when to use Midgard dashboard metrics versus THORNode raw protocol state.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'operations',
    description: 'Paused trading, signing, observation, or LP controls can decide whether loaded metrics are actionable.',
  },
  {
    label: 'Liquidity actions',
    href: '/deep-dives/liquidity-actions#what-to-check-first',
    badge: 'LP evidence',
    description: 'Separate LP adds, withdrawals, pool-deposit pauses, asymmetric withdrawals, and APY claims before using stats numbers.',
  },
  {
    label: 'Dynamic fees',
    href: '/dynamic-fees#dynamic-fees-live',
    badge: 'fees',
    description: 'Use the ADR-026 tracker when fee questions are about partner-pair floors rather than ordinary earnings.',
  },
  {
    label: 'Build/query path',
    href: '/deep-dives/build-query-data#query-plan',
    badge: 'task',
    description: 'Open the task guide for using Midgard, THORNode, inbound-address, and Mimir endpoint data.',
  },
];

const statsToc: TocItem[] = [
  { id: 'stats-look-here-first', label: 'Look here first' },
  { id: 'stats-operational-check', label: 'Operational check' },
  { id: 'stats-number-guide-heading', label: 'Which numbers matter' },
  { id: 'stats-live-metrics-heading', label: 'Live metrics' },
  { id: 'available-pools', label: 'Available pools' },
  { id: 'earnings-history', label: 'Earnings history' },
  { id: 'stats-related-checks', label: 'Related checks' },
];

const statsNumberGuide = [
  {
    title: 'Liquidity depth',
    badge: 'Pooled RUNE',
    useFor: 'Broad liquidity depth and pool-scale context.',
    avoid: 'A specific route will quote, settle, or have low slippage.',
    href: '/deep-dives/clp#evidence-ladder',
    linkLabel: 'Read CLP evidence',
  },
  {
    title: 'Security set',
    badge: 'Active nodes',
    useFor: 'Current validator-set size and security-context triage.',
    avoid: 'Vault safety, signing availability, or incident recovery proof.',
    href: '/network#network-diagnostics',
    linkLabel: 'Check operations',
  },
  {
    title: 'Reward signal',
    badge: 'Bonding APY',
    useFor: 'Current node-reward direction from Midgard.',
    avoid: 'Future yield, investment return, or durable profitability.',
    href: '/deep-dives/incentive-pendulum',
    linkLabel: 'Read incentive model',
  },
  {
    title: 'Earnings shape',
    badge: 'Daily intervals',
    useFor: 'Recent distribution shape from loaded Midgard intervals.',
    avoid: 'Protocol revenue lift, route competitiveness, or partner attribution.',
    href: '/dynamic-fees#dynamic-fees-live',
    linkLabel: 'Check fee experiment',
  },
];

function toneToBadgeVariant(tone: StatsDecisionFact['tone']) {
  return tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'info';
}

function toneToCardClass(tone: StatsDecisionFact['tone']) {
  switch (tone) {
    case 'success':
      return 'border-emerald-500/20';
    case 'danger':
      return 'border-red-500/25 bg-red-500/5';
    case 'warning':
      return 'border-amber-500/25 bg-amber-500/5';
    case 'info':
      return 'border-sky-500/20';
  }
}

function metricIcon(id: StatsMetricCard['id']) {
  switch (id) {
    case 'pooledRune':
      return <Activity className="h-4 w-4" />;
    case 'bondingApy':
      return <TrendingUp className="h-4 w-4" />;
    case 'activeNodes':
      return <Zap className="h-4 w-4" />;
    case 'reserveRune':
      return <TrendingDown className="h-4 w-4" />;
  }
}

function StatsSourceIssueNotice({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="mb-3 rounded-md border border-amber-500/25 bg-amber-500/5 p-3 text-xs leading-relaxed text-slate-400">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge variant="warning">Source needs review</Badge>
        <p className="font-semibold text-amber-200">{title}</p>
      </div>
      <p>{detail}</p>
    </div>
  );
}

export default function StatsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamString = searchParams.toString();
  const {
    data: networkData,
    result: networkResult,
    error: networkError,
    isLoading: networkLoading,
    isDegraded: networkDegraded,
  } = useNetworkData();
  const {
    data: earningsData,
    result: earningsResult,
    error: earningsError,
    isLoading: earningsLoading,
    isDegraded: earningsDegraded,
  } = useEarningsHistory('day', 30);
  const {
    data: poolsData,
    result: poolsResult,
    error: poolsError,
    isLoading: poolsLoading,
    isDegraded: poolsDegraded,
  } = usePools();
  const { result: midgardHealthResult } = useMidgardHealth();
  const { result: statusResult, isLoading: statusLoading } = useNetworkStatus();

  const networkHasError = !networkLoading && (networkError || networkDegraded || !networkData);
  const earningsHasError = !earningsLoading && (earningsError || earningsDegraded);
  const poolsHasError = !poolsLoading && (poolsError || poolsDegraded || !poolsData);

  const networkFallbackValue = networkLoading ? 'Loading' : 'Unavailable';
  const metricCards = deriveStatsMetricCards(networkData, networkFallbackValue);
  const poolSnapshot = deriveStatsPoolSnapshot(poolsData, poolsLoading);
  const poolAvailableChains = useMemo(
    () => Array.from(new Set(poolSnapshot.rows.map((row) => row.chain))).sort((left, right) => left.localeCompare(right)),
    [poolSnapshot.rows]
  );
  const poolAvailableStatuses = useMemo(
    () => Array.from(new Set(poolSnapshot.rows.map((row) => row.status))).sort((left, right) => left.localeCompare(right)),
    [poolSnapshot.rows]
  );
  const {
    poolFilters,
    updatePoolFilters,
    replacePoolFiltersInUrl,
  } = usePoolExplorerFilters({
    router,
    pathname,
    searchParamString,
    poolAvailableChains,
    poolAvailableStatuses,
  });
  const poolExplorer = useMemo(
    () => deriveStatsPoolExplorer(poolSnapshot.rows, poolFilters),
    [poolFilters, poolSnapshot.rows]
  );
  const earningsChart = deriveStatsEarningsRows(earningsData);
  const earningsCoverage = deriveStatsEarningsCoverage(earningsChart, earningsLoading);
  const {
    availableIntervals,
  } = earningsCoverage;
  const decisionFacts = deriveStatsDecisionFacts({
    networkLoading,
    earningsLoading,
    poolsLoading,
    networkResult,
    earningsResult,
    poolsResult,
    midgardHealthResult,
    statusResult,
    earningsIntervals: earningsChart.length,
    earningsIntervalsWithValues: availableIntervals,
    poolCount: poolSnapshot.totalPools,
  });
  const headlineSourceIssue = midgardSourceIssueIsVisible(networkResult, midgardHealthResult, networkLoading);
  const poolRowsValue = poolsLoading && poolSnapshot.totalPools === 0
    ? 'Loading'
    : poolsHasError || !poolsResult?.data
      ? 'Unavailable'
      : poolSnapshot.totalPools.toLocaleString();
  const poolChainCountValue = poolsLoading && poolSnapshot.totalPools === 0
    ? 'Loading'
    : poolsHasError || !poolsResult?.data
      ? 'Unavailable'
      : poolSnapshot.chainCount.toLocaleString();

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      {(networkHasError || earningsHasError || poolsHasError) && (
        <Card padding="sm" className="mb-8 border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
          Live data is degraded. {networkError || poolsError || earningsError || 'One or more sources did not respond.'}
        </Card>
      )}

      <section id="stats-look-here-first" className="mb-8 scroll-mt-24">
        <SectionHeader className="mb-3" level="primary">Look Here First</SectionHeader>
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          First check whether the sources are usable, then read the metric cards as four separate signals: liquidity depth, node reward rate, active security set, and reserve context.
        </p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {decisionFacts.map((fact) => (
            <Card key={fact.label} padding="sm" className={toneToCardClass(fact.tone)}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fact.label}</p>
                <Badge variant={toneToBadgeVariant(fact.tone)}>{fact.value}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{fact.detail}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="stats-operational-check" className="mb-8 scroll-mt-24" aria-labelledby="stats-operational-check-heading">
        <SectionHeader id="stats-operational-check-heading" className="mb-3" level="primary">Operational Check</SectionHeader>
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          Check network status before treating loaded metrics as route-ready. A healthy-looking Midgard number does not override a current THORNode pause or source warning.
        </p>
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} variant="compact" />
      </section>

      <section id="stats-which-numbers-matter" aria-labelledby="stats-number-guide-heading" className="mb-8">
        <div className="mb-3 max-w-3xl">
          <SectionHeader id="stats-number-guide-heading" level="primary">Which Numbers Matter</SectionHeader>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Start with the number that matches the claim. Each metric is useful, but none of them alone proves route availability, future yield, or recovery state.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statsNumberGuide.map((item) => (
            <Card key={item.title} padding="sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                <Badge variant="info">{item.badge}</Badge>
              </div>
              <dl className="grid gap-2 text-xs leading-relaxed text-slate-400">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
                  <dd className="mt-1">{item.useFor}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Use For</dt>
                  <dd className="mt-1">{item.avoid}</dd>
                </div>
              </dl>
              <Link href={item.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                {item.linkLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section id="stats-live-metrics" aria-labelledby="stats-live-metrics-heading" className="mb-12">
        <SectionHeader id="stats-live-metrics-heading" level="primary">Live Metrics</SectionHeader>
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          These are current Midgard snapshot numbers. Use them for dashboard triage, then verify operational availability, route quality, and historical conclusions elsewhere.
        </p>
        {headlineSourceIssue && (
          <StatsSourceIssueNotice
            title="Headline metric source needs review"
            detail="Values loaded, but Midgard health, provider matching, or source warnings do not confirm a clean same-provider snapshot. Read the source strip before treating these numbers as clean."
          />
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => (
            <StatCard
              key={metric.id}
              icon={metricIcon(metric.id)}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              description={metric.description}
            />
          ))}
        </div>
      </section>

      <StatsPoolExplorer
        poolSnapshotSummary={poolSnapshot.summary}
        poolSnapshotDeepestPool={poolSnapshot.deepestPool}
        poolSnapshotHighestVolumePool={poolSnapshot.highestVolumePool}
        poolRowsValue={poolRowsValue}
        poolChainCountValue={poolChainCountValue}
        explorerRows={poolExplorer.rows}
        chartRows={poolExplorer.chartRows}
        totalRows={poolExplorer.totalRows}
        summary={poolExplorer.summary}
        activeFilterLabels={poolExplorer.activeFilterLabels}
        poolFilters={poolFilters}
        updatePoolFilters={updatePoolFilters}
        resetPoolFilters={replacePoolFiltersInUrl}
        poolAvailableChains={poolAvailableChains}
        poolAvailableStatuses={poolAvailableStatuses}
        poolsLoading={poolsLoading}
      />

      <StatsEarningsTable
        earningsChart={earningsChart}
        earningsLoading={earningsLoading}
        earningsResult={earningsResult}
        midgardHealthResult={midgardHealthResult}
        earningsCoverage={earningsCoverage}
      />

      <RelatedChecks id="stats-related-checks" checks={statsRelatedChecks} className="mb-8" />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={statsToc} />
          </div>
        </aside>
      </div>
    </>
  );
}
