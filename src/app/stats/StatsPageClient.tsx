'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { Activity, Search, TrendingUp, TrendingDown, X, Zap } from 'lucide-react';
import { useNetworkData, useEarningsHistory, useNetworkStatus, useMidgardHealth, usePools } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { StatCard } from '@/components/ui/StatCard';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
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
  type StatsPoolExplorerFilters,
  type StatsPoolRow,
  type StatsPoolSortKey,
} from '@/lib/stats-dashboard';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';

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

const chartTooltipContentStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 8,
  color: '#e2e8f0',
};

const chartTooltipLabelStyle = {
  color: '#cbd5e1',
  fontWeight: 600,
};

const chartAxisTick = {
  fill: '#94a3b8',
  fontSize: 11,
};

const poolSortOptions: Array<{ value: StatsPoolSortKey; label: string }> = [
  { value: 'runeDepth', label: 'RUNE depth' },
  { value: 'volume24hRune', label: '24h volume (RUNE)' },
  { value: 'liquidityUsd', label: 'Liquidity' },
  { value: 'apyPercent', label: 'APY' },
  { value: 'asset', label: 'Asset' },
];

const poolSortQueryValues: Record<string, StatsPoolSortKey> = {
  depth: 'runeDepth',
  runeDepth: 'runeDepth',
  volume: 'volume24hRune',
  volume24hRune: 'volume24hRune',
  volume24hUsd: 'volume24hRune',
  liquidity: 'liquidityUsd',
  liquidityUsd: 'liquidityUsd',
  apy: 'apyPercent',
  apyPercent: 'apyPercent',
  asset: 'asset',
};

const poolSortParamValues: Record<StatsPoolSortKey, string> = {
  runeDepth: 'depth',
  volume24hRune: 'volume',
  liquidityUsd: 'liquidity',
  apyPercent: 'apy',
  asset: 'asset',
};

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

function formatRuneMetric(value: number | null) {
  return value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatRuneAmount(value: number | null) {
  return value === null ? 'Unavailable' : `${formatRuneMetric(value)} RUNE`;
}

function poolStatusVariant(status: string) {
  return status.toLowerCase() === 'available' ? 'success' : 'warning';
}

function formatPoolHighlight(row: StatsPoolRow | undefined, value: string | undefined) {
  return row && value ? `${row.asset} (${value})` : 'Unavailable';
}

function formatPoolAxisTick(value: unknown) {
  const text = String(value);
  return text.length > 18 ? `${text.slice(0, 15)}...` : text;
}

function normalizePoolSortParam(value: string | null): StatsPoolSortKey {
  if (!value) {
    return 'runeDepth';
  }

  return poolSortQueryValues[value] ?? 'runeDepth';
}

function normalizePoolOptionParam(value: string | null, availableValues: string[]) {
  if (!value || value === 'all') {
    return 'all';
  }

  return availableValues.includes(value) ? value : 'all';
}

function poolEmptyMessage(filters: StatsPoolExplorerFilters) {
  const query = filters.query.trim();
  const chain = filters.chain !== 'all' ? filters.chain : '';
  const status = filters.status !== 'all' ? filters.status : '';

  if (query && chain) {
    return `No pools match "${query}" on ${chain}.`;
  }
  if (query) {
    return `No pools match "${query}".`;
  }
  if (chain && status) {
    return `No ${status} pools are loaded on ${chain}.`;
  }
  if (chain) {
    return `No pools are loaded on ${chain}.`;
  }
  if (status) {
    return `No ${status} pools are loaded.`;
  }

  return 'No pools match the current filters.';
}

function chartNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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
  const poolFilters = useMemo<StatsPoolExplorerFilters>(() => ({
    query: searchParams.get('pool_q') ?? '',
    chain: normalizePoolOptionParam(searchParams.get('pool_chain'), poolAvailableChains),
    status: normalizePoolOptionParam(searchParams.get('pool_status'), poolAvailableStatuses),
    sort: normalizePoolSortParam(searchParams.get('pool_sort')),
  }), [poolAvailableChains, poolAvailableStatuses, searchParams]);
  const latestPoolFiltersRef = useRef(poolFilters);
  useEffect(() => {
    latestPoolFiltersRef.current = poolFilters;
  }, [poolFilters]);
  const poolExplorer = useMemo(
    () => deriveStatsPoolExplorer(poolSnapshot.rows, poolFilters),
    [poolFilters, poolSnapshot.rows]
  );
  const replacePoolFiltersInUrl = useCallback((nextFilters: StatsPoolExplorerFilters) => {
    const params = new URLSearchParams(searchParamString);
    const query = nextFilters.query.trim();
    if (query) {
      params.set('pool_q', query);
    } else {
      params.delete('pool_q');
    }
    if (nextFilters.chain !== 'all') {
      params.set('pool_chain', nextFilters.chain);
    } else {
      params.delete('pool_chain');
    }
    if (nextFilters.status !== 'all') {
      params.set('pool_status', nextFilters.status);
    } else {
      params.delete('pool_status');
    }
    if (nextFilters.sort !== 'runeDepth') {
      params.set('pool_sort', poolSortParamValues[nextFilters.sort]);
    } else {
      params.delete('pool_sort');
    }

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}#available-pools`, { scroll: false });
  }, [pathname, router, searchParamString]);
  const updatePoolFilters = useCallback((partialFilters: Partial<StatsPoolExplorerFilters>) => {
    replacePoolFiltersInUrl({
      ...latestPoolFiltersRef.current,
      ...partialFilters,
    });
  }, [replacePoolFiltersInUrl]);
  const earningsChart = deriveStatsEarningsRows(earningsData);
  const earningsCoverage = deriveStatsEarningsCoverage(earningsChart, earningsLoading);
  const {
    availableIntervals,
    unavailableIntervals,
    totalEarnings,
    recentSevenEarnings,
    summary: earningsSummary,
    recentRows,
    recentIntervalCount,
    recentAvailableIntervals,
    recentUnavailableIntervals,
  } = earningsCoverage;
  const recentWindowDetail = recentIntervalCount > 0
    ? recentUnavailableIntervals > 0
      ? `${recentAvailableIntervals}/${recentIntervalCount} intervals with values; ${recentUnavailableIntervals} unavailable`
      : `${recentAvailableIntervals}/${recentIntervalCount} intervals with values`
    : earningsLoading ? 'Loading intervals' : 'No intervals loaded';
  const earningsCoverageIsPartial = unavailableIntervals > 0;
  const recentWindowIsPartial = recentUnavailableIntervals > 0;
  const loadedIntervalTotalDetail = earningsChart.length > 0
    ? earningsCoverageIsPartial
      ? `${availableIntervals}/${earningsChart.length} loaded intervals with totals; ${unavailableIntervals} unavailable`
      : `${availableIntervals}/${earningsChart.length} loaded intervals with totals`
    : earningsLoading ? 'Loading intervals' : 'No intervals loaded';
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
  const poolsSourceIssue = midgardSourceIssueIsVisible(poolsResult, midgardHealthResult, poolsLoading);
  const earningsSourceIssue = midgardSourceIssueIsVisible(earningsResult, midgardHealthResult, earningsLoading);
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
      {(networkHasError || earningsHasError || poolsHasError) && (
        <Card padding="sm" className="mb-8 border-amber-500/20 bg-amber-500/5 text-sm text-amber-300">
          Live data is degraded. {networkError || poolsError || earningsError || 'One or more sources did not respond.'}
        </Card>
      )}

      <section id="stats-look-here-first" className="mb-8 scroll-mt-24">
        <SectionHeader className="mb-3">Look Here First</SectionHeader>
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
        <SectionHeader id="stats-operational-check-heading" className="mb-3">Operational Check</SectionHeader>
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          Check network status before treating loaded metrics as route-ready. A healthy-looking Midgard number does not override a current THORNode pause or source warning.
        </p>
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} variant="compact" />
      </section>

      <section aria-labelledby="stats-number-guide-heading" className="mb-8">
        <div className="mb-3 max-w-3xl">
          <h2 id="stats-number-guide-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Which Numbers Matter
          </h2>
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

      <section aria-labelledby="stats-live-metrics-heading" className="mb-12">
        <SectionHeader id="stats-live-metrics-heading">Live Metrics</SectionHeader>
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
        <div className="mt-4">
          <LiveSourceMeta result={networkResult} healthResult={midgardHealthResult} />
        </div>
      </section>

      <section id="available-pools" className="mb-12 scroll-mt-24">
        <SectionHeader>Midgard Available-Pool Rows</SectionHeader>
        <p id="available-pools-summary" className="mb-3 max-w-3xl text-sm leading-relaxed text-slate-400">
          {poolSnapshot.summary} This is liquidity context from Midgard, not proof that a specific route will quote or settle. Full loaded row list stays in this wiki view.
        </p>
        {poolsSourceIssue && (
          <StatsSourceIssueNotice
            title="Pool snapshot source needs review"
            detail="Pool rows loaded, but their source posture is degraded or provider-mismatched. Treat depth, volume, and APY labels as review-needed until the source strip is clean."
          />
        )}
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Midgard pool rows</p>
            <p data-testid="stats-pool-row-count" className="mt-1 text-sm font-semibold text-slate-200">{poolRowsValue}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Chains in rows</p>
            <p data-testid="stats-pool-chain-count" className="mt-1 text-sm font-semibold text-slate-200">{poolChainCountValue}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Deepest pool</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-200">
              {formatPoolHighlight(poolSnapshot.deepestPool, poolSnapshot.deepestPool?.runeDepthLabel)}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Highest 24h RUNE volume</p>
            <p className="mt-1 break-words text-sm font-semibold text-slate-200">
              {formatPoolHighlight(poolSnapshot.highestVolumePool, poolSnapshot.highestVolumePool?.volume24hRuneLabel)}
            </p>
          </Card>
        </div>
        <div className="mb-3">
          <LiveSourceMeta result={poolsResult} healthResult={midgardHealthResult} />
        </div>
        <div className="mb-4 rounded-md border border-border bg-surface-elevated px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Route proof is separate</p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
                Pool rows show liquidity context. A current route still needs a THORNode quote, source freshness, and network diagnostics.
              </p>
            </div>
            <Link
              href="/network#check-a-route"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-accent/40 px-3 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              Check a route
            </Link>
          </div>
        </div>
        <Card padding="lg" aria-describedby="available-pools-summary">
          {poolsLoading && poolSnapshot.rows.length === 0 ? (
            <div role="status" aria-live="polite" className="flex min-h-[220px] items-center justify-center text-sm text-slate-400">
              Loading Midgard available-pool rows...
            </div>
          ) : poolSnapshot.rows.length > 0 ? (
            <div className="grid gap-6">
              <div className="rounded-lg border border-border bg-surface/60 p-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem_auto]">
                  <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Search pools
                    <span className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                      <input
                        type="search"
                        aria-label="Filter Midgard available-pool rows"
                        value={poolFilters.query}
                        onChange={(event) => updatePoolFilters({ query: event.target.value })}
                        placeholder="BTC, ETH, USDC, available..."
                        className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                      />
                    </span>
                  </label>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Chain
                    <select
                      aria-label="Pool chain"
                      value={poolFilters.chain}
                      onChange={(event) => updatePoolFilters({ chain: event.target.value })}
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                    >
                      <option value="all">All chains</option>
                      {poolAvailableChains.map((chain) => (
                        <option key={chain} value={chain}>{chain}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Status
                    <select
                      aria-label="Pool status"
                      value={poolFilters.status}
                      onChange={(event) => updatePoolFilters({ status: event.target.value })}
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                    >
                      <option value="all">All statuses</option>
                      {poolAvailableStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Sort
                    <select
                      aria-label="Pool sort"
                      value={poolFilters.sort}
                      onChange={(event) => updatePoolFilters({ sort: event.target.value as StatsPoolSortKey })}
                      className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-medium text-slate-100 outline-none transition focus:border-accent"
                    >
                      {poolSortOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => replacePoolFiltersInUrl({ query: '', chain: 'all', status: 'all', sort: 'runeDepth' })}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-slate-300 transition hover:border-accent hover:text-accent lg:w-auto"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      Reset pool filters
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-slate-400">{poolExplorer.summary}</p>
                  {poolExplorer.activeFilterLabels.map((label) => (
                    <Badge key={label} variant="info">{label}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Top Pools By RUNE Depth</h3>
                  {poolExplorer.chartRows.length > 0 ? (
                    <div className="mt-3 h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={poolExplorer.chartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="asset"
                            type="category"
                            width={82}
                            tick={chartAxisTick}
                            tickFormatter={formatPoolAxisTick}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            contentStyle={chartTooltipContentStyle}
                            labelStyle={chartTooltipLabelStyle}
                            formatter={(value) => [formatRuneAmount(chartNumber(value)), 'RUNE depth']}
                          />
                          <Bar dataKey="runeDepth" fill="#14b8a6" radius={[0, 4, 4, 0]} name="RUNE depth" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg border border-border bg-surface p-4 text-sm text-slate-400">
                      Pool depth chart unavailable because the current filter set has no usable depth values.
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Loaded Row List</h3>
                  {poolExplorer.rows.length === 0 ? (
                    <p className="mt-3 rounded-lg border border-border bg-surface p-4 text-sm text-slate-400">
                      {poolEmptyMessage(poolFilters)}
                    </p>
                  ) : (
                    <>
                      <div className="mt-3 md:hidden" role="list" aria-label="Midgard available-pool rows">
                        {poolExplorer.rows.map((pool) => (
                          <div key={pool.id} role="listitem" className="border-t border-border py-3 first:border-t-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-all text-sm font-semibold text-slate-200">{pool.asset}</p>
                                <p className="mt-1 text-xs text-slate-500">{pool.chain}</p>
                              </div>
                              <Badge variant={poolStatusVariant(pool.status)}>{pool.status}</Badge>
                            </div>
                            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-400">
                              <div>
                                <dt>RUNE depth</dt>
                                <dd className="text-slate-200">{pool.runeDepthLabel}</dd>
                              </div>
                              <div>
                                <dt>Liquidity</dt>
                                <dd className="text-slate-200">{pool.liquidityUsdLabel}</dd>
                              </div>
                              <div>
                                <dt>24h volume (RUNE)</dt>
                                <dd className="text-slate-200">{pool.volume24hRuneLabel}</dd>
                              </div>
                              <div>
                                <dt>APY</dt>
                                <dd className="text-slate-200">{pool.apyLabel}</dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[640px] text-left text-xs text-slate-400">
                          <caption className="sr-only">Midgard available-pool rows snapshot</caption>
                          <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                            <tr>
                              <th scope="col" className="py-2 pr-4">Pool</th>
                              <th scope="col" className="py-2 pr-4">Chain</th>
                              <th scope="col" className="py-2 pr-4">RUNE depth</th>
                              <th scope="col" className="py-2 pr-4">Liquidity</th>
                              <th scope="col" className="py-2 pr-4">24h volume (RUNE)</th>
                              <th scope="col" className="py-2 pr-4">APY</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poolExplorer.rows.map((pool) => (
                              <tr key={pool.id} className="border-t border-border">
                                <td className="py-2 pr-4 font-semibold text-slate-200">
                                  <span className="mr-2 break-all">{pool.asset}</span>
                                  <Badge variant={poolStatusVariant(pool.status)}>{pool.status}</Badge>
                                </td>
                                <td className="py-2 pr-4">{pool.chain}</td>
                                <td className="py-2 pr-4">{pool.runeDepthLabel}</td>
                                <td className="py-2 pr-4">{pool.liquidityUsdLabel}</td>
                                <td className="py-2 pr-4">{pool.volume24hRuneLabel}</td>
                                <td className="py-2 pr-4">{pool.apyLabel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-16 text-center text-slate-400">Midgard available-pool rows unavailable from live sources.</p>
          )}
        </Card>
      </section>

      <section className="mb-12">
        <SectionHeader>Earnings History</SectionHeader>
        <p id="earnings-history-summary" className="mb-3 text-sm text-slate-400">
          {earningsSummary}
        </p>
        {earningsSourceIssue && (
          <StatsSourceIssueNotice
            title="Earnings history source needs review"
            detail="Intervals loaded, but Midgard health, provider matching, or source warnings do not confirm clean chart freshness. Do not read the chart as clean historical evidence without the source strip."
          />
        )}
        <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Usable intervals</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{availableIntervals}/{earningsChart.length}</p>
          </Card>
          <Card padding="sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400">Unavailable intervals</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">{earningsLoading && earningsChart.length === 0 ? 'Loading' : unavailableIntervals}</p>
          </Card>
          <Card padding="sm" className={recentWindowIsPartial ? 'border-amber-500/25 bg-amber-500/5' : undefined}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Latest valid-window total</p>
              {recentWindowIsPartial && <Badge variant="warning">Partial window</Badge>}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneAmount(recentSevenEarnings)}</p>
            <p className="mt-1 text-[11px] text-slate-500">{recentWindowDetail}</p>
          </Card>
          <Card padding="sm" className={earningsCoverageIsPartial ? 'border-amber-500/25 bg-amber-500/5' : undefined}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wider text-slate-400">Valid loaded-interval total</p>
              {earningsCoverageIsPartial && <Badge variant="warning">Partial total</Badge>}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-200">{formatRuneAmount(totalEarnings)}</p>
            <p className="mt-1 text-[11px] text-slate-500">{loadedIntervalTotalDetail}</p>
          </Card>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          Earnings history is a Midgard-sourced current readback of available intervals. Use it to inspect recent distribution shape, not as durable revenue proof or protocol-attribution proof.
        </p>
        <div className="mb-3">
          <LiveSourceMeta result={earningsResult} healthResult={midgardHealthResult} />
        </div>
        <Card padding="lg" aria-describedby="earnings-history-summary">
          {earningsLoading && earningsChart.length === 0 ? (
            <div role="status" aria-live="polite" className="flex min-h-[240px] items-center justify-center text-sm text-slate-400">
              Loading earnings history from Midgard...
            </div>
          ) : earningsChart.length > 0 ? (
            <>
              <div className="h-[300px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningsChart} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" tick={chartAxisTick} tickLine={false} axisLine={{ stroke: '#334155' }} />
                    <YAxis
                      tick={chartAxisTick}
                      tickLine={false}
                      axisLine={{ stroke: '#334155' }}
                      tickFormatter={(value) => formatRuneMetric(chartNumber(value))}
                    />
                    <Tooltip
                      contentStyle={chartTooltipContentStyle}
                      labelStyle={chartTooltipLabelStyle}
                      formatter={(value, name) => [formatRuneAmount(chartNumber(value)), name]}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
                    <Line type="monotone" dataKey="earnings" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Earnings (RUNE)" />
                    <Line type="monotone" dataKey="nodeOps" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Node Operator Earnings" />
                    <Line type="monotone" dataKey="lps" stroke="#10b981" strokeWidth={2} dot={false} name="LP Earnings" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 md:hidden" aria-labelledby="recent-earnings-intervals">
                <h3 id="recent-earnings-intervals" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recent Daily Earnings Intervals
                </h3>
                <div role="list" aria-label="Recent daily earnings intervals" className="mt-2 divide-y divide-border border-y border-border">
                  {recentRows.map((row) => (
                    <div role="listitem" key={row.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-200">{row.name}</p>
                        <p className="text-right text-sm font-semibold text-slate-100">{formatRuneAmount(row.earnings)}</p>
                      </div>
                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-slate-400">
                        <div>
                          <dt>Node operators</dt>
                          <dd className="text-slate-200">{formatRuneAmount(row.nodeOps)}</dd>
                        </div>
                        <div>
                          <dt>LPs</dt>
                          <dd className="text-slate-200">{formatRuneAmount(row.lps)}</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[520px] text-left text-xs text-slate-400">
                  <caption className="sr-only">Loaded Midgard daily earnings intervals</caption>
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th scope="col" className="py-2 pr-4">Date</th>
                      <th scope="col" className="py-2 pr-4">Total RUNE</th>
                      <th scope="col" className="py-2 pr-4">Node operators</th>
                      <th scope="col" className="py-2 pr-4">LPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsChart.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 pr-4">{row.earnings?.toLocaleString() ?? 'Unavailable'}</td>
                        <td className="py-2 pr-4">{row.nodeOps?.toLocaleString() ?? 'Unavailable'}</td>
                        <td className="py-2 pr-4">{row.lps?.toLocaleString() ?? 'Unavailable'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-center py-20">Earnings history unavailable from live sources.</p>
          )}
        </Card>
      </section>

      <RelatedChecks checks={statsRelatedChecks} className="mb-8" />
    </>
  );
}
