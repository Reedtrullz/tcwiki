import type { HistoryItem, LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus, Pool } from '@/lib/types';
import { liveResultIsDegraded } from '@/lib/live-result';
import { formatPercent, formatRuneFromBaseUnits, normalizeApyToPercent, runeBaseUnitsToNumber } from '@/lib/trust';

export interface StatsDecisionInput {
  networkLoading: boolean;
  earningsLoading: boolean;
  poolsLoading?: boolean;
  networkResult?: LiveDataResult<NetworkStats>;
  earningsResult?: LiveDataResult<unknown[]>;
  poolsResult?: LiveDataResult<Pool[]>;
  midgardHealthResult?: LiveDataResult<MidgardHealth>;
  statusResult?: LiveDataResult<NetworkStatus>;
  earningsIntervals: number;
  earningsIntervalsWithValues: number;
  poolCount?: number;
}

export interface StatsDecisionFact {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
  detail: string;
}

export interface StatsMetricCard {
  id: 'pooledRune' | 'bondingApy' | 'activeNodes' | 'reserveRune';
  label: string;
  value: string | number;
  unit?: string;
  description: string;
}

export interface StatsEarningsRow {
  id: string;
  name: string;
  earnings: number | null;
  nodeOps: number | null;
  lps: number | null;
}

export interface StatsEarningsCoverage {
  availableIntervals: number;
  unavailableIntervals: number;
  recentIntervalCount: number;
  recentAvailableIntervals: number;
  recentUnavailableIntervals: number;
  totalEarnings: number | null;
  recentSevenEarnings: number | null;
  summary: string;
  recentRows: StatsEarningsRow[];
}

export interface StatsPoolRow {
  id: string;
  asset: string;
  chain: string;
  status: string;
  runeDepth: number | null;
  liquidityUsd: number | null;
  volume24hRune: number | null;
  apyPercent: number | null;
  runeDepthLabel: string;
  liquidityUsdLabel: string;
  volume24hRuneLabel: string;
  apyLabel: string;
}

export interface StatsPoolSnapshot {
  rows: StatsPoolRow[];
  chartRows: StatsPoolRow[];
  totalPools: number;
  chainCount: number;
  totalRuneDepth: number | null;
  deepestPool?: StatsPoolRow;
  highestVolumePool?: StatsPoolRow;
  summary: string;
}

export type StatsPoolSortKey = 'runeDepth' | 'volume24hRune' | 'liquidityUsd' | 'apyPercent' | 'asset';

export interface StatsPoolExplorerFilters {
  query: string;
  chain: string;
  status: string;
  sort: StatsPoolSortKey;
}

export interface StatsPoolExplorer {
  rows: StatsPoolRow[];
  chartRows: StatsPoolRow[];
  totalRows: number;
  filteredRows: number;
  availableChains: string[];
  availableStatuses: string[];
  activeFilterLabels: string[];
  summary: string;
}

function liveResultHasWarning(result?: LiveDataResult<unknown>) {
  return liveResultIsDegraded(result);
}

function formatHistoryDate(startTime: string) {
  const seconds = Number.parseInt(startTime, 10);
  if (!Number.isSafeInteger(seconds)) {
    return 'Unknown date';
  }

  return new Date(seconds * 1000).toLocaleDateString();
}

function midgardHealthFact(result?: LiveDataResult<MidgardHealth>): StatsDecisionFact {
  if (!result) {
    return {
      label: 'Midgard health',
      value: 'Checking',
      tone: 'info',
      detail: 'Waiting for provider health before treating metric freshness as usable.',
    };
  }
  if (result.status === 'degraded' || liveResultHasWarning(result) || !result.data) {
    return {
      label: 'Midgard health',
      value: 'Degraded',
      tone: 'danger',
      detail: result.error ?? 'Health source is unavailable; treat Midgard metrics as degraded.',
    };
  }

  const health = result.data;
  if (health.severity === 'ok') {
    return {
      label: 'Midgard health',
      value: health.lagBlocks !== undefined ? `${health.lagBlocks} block lag` : 'Healthy',
      tone: 'success',
      detail: 'Metric source reports healthy sync for the current snapshot.',
    };
  }

  return {
    label: 'Midgard health',
    value: health.severity === 'warning' ? 'Warning' : 'Degraded',
    tone: health.severity === 'warning' ? 'warning' : 'danger',
    detail: health.reasons[0] ?? 'Provider health needs review before relying on metrics.',
  };
}

function sameSourceGroup(leftUrl: string, rightUrl: string) {
  try {
    return new URL(leftUrl).origin === new URL(rightUrl).origin;
  } catch {
    return leftUrl === rightUrl;
  }
}

function healthSourceDiffersFrom(result: LiveDataResult<unknown> | undefined, healthResult: LiveDataResult<MidgardHealth> | undefined) {
  return Boolean(
    result?.status === 'ok' &&
    result.data !== undefined &&
    result.source &&
    healthResult?.status === 'ok' &&
    healthResult.data !== undefined &&
    healthResult.source &&
    !sameSourceGroup(result.source.url, healthResult.source.url)
  );
}

export function midgardResultHasCleanHealth<T>(
  result: LiveDataResult<T> | undefined,
  healthResult: LiveDataResult<MidgardHealth> | undefined
) {
  return Boolean(
    result?.status === 'ok' &&
    result.data !== undefined &&
    result.source &&
    !liveResultHasWarning(result) &&
    healthResult?.status === 'ok' &&
    healthResult.data !== undefined &&
    healthResult.source &&
    healthResult.data.severity === 'ok' &&
    !liveResultHasWarning(healthResult) &&
    sameSourceGroup(result.source.url, healthResult.source.url)
  );
}

export function midgardSourceIssueIsVisible<T>(
  result: LiveDataResult<T> | undefined,
  healthResult: LiveDataResult<MidgardHealth> | undefined,
  isLoading: boolean
) {
  return Boolean(result?.data !== undefined && !isLoading && !midgardResultHasCleanHealth(result, healthResult));
}

function operationalFact(result?: LiveDataResult<NetworkStatus>): StatsDecisionFact {
  if (!result) {
    return {
      label: 'Operations',
      value: 'Checking',
      tone: 'info',
      detail: 'Waiting for THORNode diagnostics before separating metric health from protocol pause state.',
    };
  }
  if (result.status === 'degraded' || liveResultHasWarning(result) || !result.data) {
    return {
      label: 'Operations',
      value: 'Degraded',
      tone: 'danger',
      detail: result.error ?? 'THORNode operational state is unavailable or warning-backed.',
    };
  }

  const status = result.data;
  if (status.state === 'operational') {
    return {
      label: 'Operations',
      value: 'No active pause',
      tone: 'success',
      detail: 'Live operational diagnostics do not show active monitored pause controls.',
    };
  }
  if (status.state === 'paused') {
    return {
      label: 'Operations',
      value: 'Paused',
      tone: 'warning',
      detail: status.summary,
    };
  }
  return {
    label: 'Operations',
    value: status.state === 'unknown' ? 'Unknown' : 'Degraded',
    tone: 'warning',
    detail: status.summary,
  };
}

function metricsFact(input: StatsDecisionInput): StatsDecisionFact {
  if (input.networkLoading && !input.networkResult?.data) {
    return {
      label: 'Headline metrics',
      value: 'Loading',
      tone: 'info',
      detail: 'Pooled RUNE, bonding APY, active nodes, and reserve are waiting on Midgard.',
    };
  }
  if (!input.networkResult?.data || liveResultHasWarning(input.networkResult)) {
    return {
      label: 'Headline metrics',
      value: 'Degraded',
      tone: 'danger',
      detail: input.networkResult?.error ?? 'Do not treat missing or warning-backed metric values as zero.',
    };
  }
  if (healthSourceDiffersFrom(input.networkResult, input.midgardHealthResult)) {
    return {
      label: 'Headline metrics',
      value: 'Source mismatch',
      tone: 'warning',
      detail: 'Metrics loaded, but Midgard health came from a different provider; use source labels before treating freshness as clean.',
    };
  }
  return {
    label: 'Headline metrics',
    value: 'Loaded',
    tone: 'success',
    detail: 'Use these as current-only liquidity, security, and reserve indicators.',
  };
}

function poolsFact(input: StatsDecisionInput): StatsDecisionFact {
  if (input.poolsLoading && !input.poolsResult?.data) {
    return {
      label: 'Midgard pool rows',
      value: 'Loading',
      tone: 'info',
      detail: 'Waiting for the current Midgard `/pools?status=available` rows.',
    };
  }
  if (!input.poolsResult?.data || liveResultHasWarning(input.poolsResult)) {
    return {
      label: 'Midgard pool rows',
      value: 'Degraded',
      tone: 'danger',
      detail: input.poolsResult?.error ?? 'Do not treat a missing pool-row list as zero available liquidity.',
    };
  }
  if (healthSourceDiffersFrom(input.poolsResult, input.midgardHealthResult)) {
    return {
      label: 'Midgard pool rows',
      value: 'Source mismatch',
      tone: 'warning',
      detail: 'Pool rows loaded, but Midgard health came from a different provider; use source labels before treating freshness as clean.',
    };
  }

  const snapshot = deriveStatsPoolSnapshot(input.poolsResult.data, Boolean(input.poolsLoading));
  if (snapshot.totalPools === 0) {
    return {
      label: 'Midgard pool rows',
      value: 'No rows loaded',
      tone: 'warning',
      detail: 'Midgard returned an empty `/pools?status=available` row list; verify before making pool or route claims.',
    };
  }

  return {
    label: 'Midgard pool rows',
    value: `${input.poolCount ?? snapshot.totalPools} ${(input.poolCount ?? snapshot.totalPools) === 1 ? 'row' : 'rows'}`,
    tone: 'success',
    detail: `${snapshot.chainCount} chains represented. These are Midgard available-pool rows, not route quote proof.`,
  };
}

function earningsFact(input: StatsDecisionInput): StatsDecisionFact {
  if (input.earningsLoading && input.earningsIntervals === 0) {
    return {
      label: 'Earnings history',
      value: 'Loading',
      tone: 'info',
      detail: 'Waiting for daily Midgard intervals before drawing chart conclusions.',
    };
  }
  if (!input.earningsResult?.data || liveResultHasWarning(input.earningsResult)) {
    return {
      label: 'Earnings history',
      value: 'Degraded',
      tone: 'danger',
      detail: input.earningsResult?.error ?? 'Historical intervals are unavailable or warning-backed.',
    };
  }
  if (input.earningsIntervals === 0) {
    return {
      label: 'Earnings history',
      value: 'Unavailable',
      tone: 'warning',
      detail: 'No daily intervals are available from the current Midgard source.',
    };
  }
  if (input.earningsIntervalsWithValues < input.earningsIntervals) {
    return {
      label: 'Earnings history',
      value: `${input.earningsIntervalsWithValues}/${input.earningsIntervals} usable`,
      tone: 'warning',
      detail: 'Some intervals have unavailable totals; avoid over-reading the chart.',
    };
  }
  if (healthSourceDiffersFrom(input.earningsResult, input.midgardHealthResult)) {
    return {
      label: 'Earnings history',
      value: 'Source mismatch',
      tone: 'warning',
      detail: 'Intervals loaded, but Midgard health came from a different provider; avoid treating chart freshness as clean.',
    };
  }
  return {
    label: 'Earnings history',
    value: `${input.earningsIntervals} intervals`,
    tone: 'success',
    detail: 'Daily earnings intervals are usable as current source-backed history, not durable revenue proof.',
  };
}

export function deriveStatsDecisionFacts(input: StatsDecisionInput): StatsDecisionFact[] {
  return [
    metricsFact(input),
    poolsFact(input),
    midgardHealthFact(input.midgardHealthResult),
    operationalFact(input.statusResult),
    earningsFact(input),
  ];
}

export function deriveStatsEarningsRows(earningsData: HistoryItem[] | undefined): StatsEarningsRow[] {
  return (earningsData ?? []).map((item, index) => ({
    id: `${item.startTime}-${item.endTime || 'open'}-${index}`,
    name: formatHistoryDate(item.startTime),
    earnings: runeBaseUnitsToNumber(item.earnings),
    nodeOps: runeBaseUnitsToNumber(item.bondingEarnings),
    lps: runeBaseUnitsToNumber(item.liquidityEarnings),
  })).reverse();
}

export function deriveStatsEarningsCoverage(
  rows: StatsEarningsRow[],
  earningsLoading: boolean
): StatsEarningsCoverage {
  const availableIntervals = rows.filter((row) => row.earnings !== null).length;
  const unavailableIntervals = Math.max(0, rows.length - availableIntervals);
  const totalEarnings = rows.reduce<number | null>((sum, row) => (
    row.earnings === null ? sum : (sum ?? 0) + row.earnings
  ), null);
  // deriveStatsEarningsRows returns newest-first; keep this window anchored to the latest intervals.
  const recentRows = rows.slice(0, 7);
  const recentIntervalCount = recentRows.length;
  const recentAvailableIntervals = recentRows.filter((row) => row.earnings !== null).length;
  const recentUnavailableIntervals = Math.max(0, recentIntervalCount - recentAvailableIntervals);
  const recentSevenEarnings = recentRows.reduce<number | null>((sum, row) => (
    row.earnings === null ? sum : (sum ?? 0) + row.earnings
  ), null);
  const summary = earningsLoading && rows.length === 0
    ? 'Loading Midgard daily earnings intervals...'
    : rows.length > 0
      ? `Showing ${rows.length} Midgard daily earnings intervals; ${availableIntervals} include a valid total earnings value.`
      : 'No Midgard daily earnings intervals are available.';

  return {
    availableIntervals,
    unavailableIntervals,
    recentIntervalCount,
    recentAvailableIntervals,
    recentUnavailableIntervals,
    totalEarnings,
    recentSevenEarnings,
    summary,
    recentRows,
  };
}

export function deriveStatsMetricCards(networkData: NetworkStats | undefined, fallbackValue: string): StatsMetricCard[] {
  if (!networkData) {
    return [
      {
        id: 'pooledRune',
        label: 'Pooled RUNE',
        value: fallbackValue,
        description: 'Liquidity depth signal. LP APY: unavailable.',
      },
      {
        id: 'bondingApy',
        label: 'Bonding APY',
        value: fallbackValue,
        description: 'Node reward signal; current-only and source-dependent.',
      },
      {
        id: 'activeNodes',
        label: 'Active Nodes',
        value: fallbackValue,
        description: 'Security-set signal. Standby nodes unavailable.',
      },
      {
        id: 'reserveRune',
        label: 'Reserve RUNE',
        value: fallbackValue,
        description: 'Protocol reserve/backstop context; not a solvency guarantee by itself.',
      },
    ];
  }

  return [
    {
      id: 'pooledRune',
      label: 'Pooled RUNE',
      value: formatRuneFromBaseUnits(networkData.totalPooledRune),
      unit: 'RUNE',
      description: `Liquidity depth signal. LP APY: ${formatPercent(normalizeApyToPercent(networkData.liquidityAPY, 'decimal'))}.`,
    },
    {
      id: 'bondingApy',
      label: 'Bonding APY',
      value: formatPercent(normalizeApyToPercent(networkData.bondingAPY, 'decimal')),
      description: 'Node reward signal; current-only and source-dependent.',
    },
    {
      id: 'activeNodes',
      label: 'Active Nodes',
      value: networkData.activeNodeCount,
      description: `Security-set signal. Standby nodes: ${networkData.standbyNodeCount}.`,
    },
    {
      id: 'reserveRune',
      label: 'Reserve RUNE',
      value: formatRuneFromBaseUnits(networkData.totalReserve),
      unit: 'RUNE',
      description: 'Protocol reserve/backstop context; not a solvency guarantee by itself.',
    },
  ];
}

function parseFiniteDecimal(value: string | undefined): number | null {
  if (value === undefined || value === '') {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCompactNumber(value: number | null, options?: Intl.NumberFormatOptions) {
  if (value === null || !Number.isFinite(value)) {
    return 'Unavailable';
  }

  return value.toLocaleString(undefined, {
    notation: Math.abs(value) >= 100_000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1_000 ? 1 : 2,
    ...options,
  });
}

function formatRuneDepth(value: number | null) {
  return value === null ? 'Unavailable' : `${formatCompactNumber(value, { maximumFractionDigits: 0 })} RUNE`;
}

function formatUsd(value: number | null) {
  return value === null ? 'Unavailable' : `$${formatCompactNumber(value, { maximumFractionDigits: 2 })}`;
}

function assetChain(asset: string) {
  const [chain] = asset.split('.');
  return chain || 'Unknown';
}

function compareNullableNumber(left: number | null, right: number | null) {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  return right - left;
}

function poolSortLabel(sort: StatsPoolSortKey) {
  switch (sort) {
    case 'runeDepth':
      return 'RUNE depth';
    case 'volume24hRune':
      return '24h volume (RUNE)';
    case 'liquidityUsd':
      return 'Liquidity';
    case 'apyPercent':
      return 'APY';
    case 'asset':
      return 'Asset';
  }
}

function normalizePoolSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function poolMatchesQuery(row: StatsPoolRow, query: string) {
  const words = normalizePoolSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return true;
  }

  const haystack = normalizePoolSearch([
    row.asset,
    row.chain,
    row.status,
    row.runeDepthLabel,
    row.liquidityUsdLabel,
    row.volume24hRuneLabel,
    row.apyLabel,
  ].join(' '));

  return words.every((word) => haystack.includes(word));
}

function comparePoolRows(left: StatsPoolRow, right: StatsPoolRow, sort: StatsPoolSortKey) {
  if (sort === 'asset') {
    return left.asset.localeCompare(right.asset);
  }

  const leftValue = left[sort];
  const rightValue = right[sort];
  const valueOrder = compareNullableNumber(
    typeof leftValue === 'number' ? leftValue : null,
    typeof rightValue === 'number' ? rightValue : null
  );

  return valueOrder === 0 ? left.asset.localeCompare(right.asset) : valueOrder;
}

export function deriveStatsPoolRows(pools: Pool[] | undefined): StatsPoolRow[] {
  return (pools ?? []).map((pool) => {
    const runeDepth = runeBaseUnitsToNumber(pool.runeDepth);
    const liquidityUsd = parseFiniteDecimal(pool.liquidityInUSD);
    const volume24hRune = runeBaseUnitsToNumber(pool.volume24h);
    const apyPercent = pool.apyPercent ?? normalizeApyToPercent(pool.poolAPY ?? pool.annualPercentageRate, 'decimal');

    return {
      id: pool.asset,
      asset: pool.asset,
      chain: assetChain(pool.asset),
      status: pool.status || 'unknown',
      runeDepth,
      liquidityUsd,
      volume24hRune,
      apyPercent,
      runeDepthLabel: formatRuneDepth(runeDepth),
      liquidityUsdLabel: formatUsd(liquidityUsd),
      volume24hRuneLabel: formatRuneDepth(volume24hRune),
      apyLabel: formatPercent(apyPercent),
    };
  }).sort((left, right) => {
    const depthOrder = compareNullableNumber(left.runeDepth, right.runeDepth);
    return depthOrder === 0 ? left.asset.localeCompare(right.asset) : depthOrder;
  });
}

export function deriveStatsPoolSnapshot(pools: Pool[] | undefined, poolsLoading: boolean): StatsPoolSnapshot {
  const rows = deriveStatsPoolRows(pools);
  const chainCount = new Set(rows.map((row) => row.chain)).size;
  const totalRuneDepth = rows.reduce<number | null>((sum, row) => (
    row.runeDepth === null ? sum : (sum ?? 0) + row.runeDepth
  ), null);
  const deepestPool = rows.find((row) => row.runeDepth !== null);
  const highestVolumePool = [...rows].sort((left, right) => {
    const volumeOrder = compareNullableNumber(left.volume24hRune, right.volume24hRune);
    return volumeOrder === 0 ? left.asset.localeCompare(right.asset) : volumeOrder;
  }).find((row) => row.volume24hRune !== null);
  const chartRows = rows.filter((row) => row.runeDepth !== null).slice(0, 8);
  const summary = poolsLoading && rows.length === 0
    ? 'Loading Midgard available-pool rows...'
    : rows.length > 0
      ? `Showing ${rows.length} Midgard available-pool rows across ${chainCount} chain${chainCount === 1 ? '' : 's'}.`
      : 'No Midgard available-pool rows are loaded.';

  return {
    rows,
    chartRows,
    totalPools: rows.length,
    chainCount,
    totalRuneDepth,
    deepestPool,
    highestVolumePool,
    summary,
  };
}

export function deriveStatsPoolExplorer(
  rows: StatsPoolRow[],
  filters: StatsPoolExplorerFilters
): StatsPoolExplorer {
  const normalizedChain = filters.chain === '' ? 'all' : filters.chain;
  const normalizedStatus = filters.status === '' ? 'all' : filters.status;
  const sort = filters.sort;
  const availableChains = Array.from(new Set(rows.map((row) => row.chain))).sort((left, right) => left.localeCompare(right));
  const availableStatuses = Array.from(new Set(rows.map((row) => row.status))).sort((left, right) => left.localeCompare(right));
  const filtered = rows
    .filter((row) => normalizedChain === 'all' || row.chain === normalizedChain)
    .filter((row) => normalizedStatus === 'all' || row.status === normalizedStatus)
    .filter((row) => poolMatchesQuery(row, filters.query))
    .sort((left, right) => comparePoolRows(left, right, sort));
  const activeFilterLabels = [
    filters.query.trim() ? `Search: ${filters.query.trim()}` : null,
    normalizedChain !== 'all' ? `Chain: ${normalizedChain}` : null,
    normalizedStatus !== 'all' ? `Status: ${normalizedStatus}` : null,
    sort !== 'runeDepth' ? `Sort: ${poolSortLabel(sort)}` : null,
  ].filter((label): label is string => label !== null);
  const chartRows = [...filtered]
    .sort((left, right) => comparePoolRows(left, right, 'runeDepth'))
    .filter((row) => row.runeDepth !== null)
    .slice(0, 8);
  const summary = activeFilterLabels.length > 0
    ? `Showing ${filtered.length} of ${rows.length} pool rows after filters.`
    : rows.length > 0
      ? `Showing all ${rows.length} loaded pool rows.`
      : 'No Midgard available-pool rows are loaded.';

  return {
    rows: filtered,
    chartRows,
    totalRows: rows.length,
    filteredRows: filtered.length,
    availableChains,
    availableStatuses,
    activeFilterLabels,
    summary,
  };
}
