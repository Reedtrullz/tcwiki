import type { HistoryItem, LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus } from '@/lib/types';
import { liveResultIsDegraded } from '@/lib/live-result';
import { formatPercent, formatRuneFromBaseUnits, normalizeApyToPercent, runeBaseUnitsToNumber } from '@/lib/trust';

export interface StatsDecisionInput {
  networkLoading: boolean;
  earningsLoading: boolean;
  networkResult?: LiveDataResult<NetworkStats>;
  earningsResult?: LiveDataResult<unknown[]>;
  midgardHealthResult?: LiveDataResult<MidgardHealth>;
  statusResult?: LiveDataResult<NetworkStatus>;
  earningsIntervals: number;
  earningsIntervalsWithValues: number;
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
  totalEarnings: number | null;
  recentSevenEarnings: number | null;
  summary: string;
  recentRows: StatsEarningsRow[];
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
  return {
    label: 'Headline metrics',
    value: 'Loaded',
    tone: 'success',
    detail: 'Use these as current-only liquidity, security, and reserve indicators.',
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
  const recentRows = rows.slice(-7);
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
