'use client';

import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Gauge,
  ListChecks,
  RadioTower,
  Scale,
  Target,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { useDynamicL1FeeStatus } from '@/lib/hooks/useMidgard';
import type {
  DynamicL1FeeCurrentAccumulator,
  DynamicL1FeeMimirFlag,
  DynamicL1FeeRecord,
  DynamicL1FeeStatus,
  DynamicL1FeeWhitelistState,
  FreshnessMeta as FreshnessMetaType,
  LiveDataResult,
  NetworkStatusSourceWarning,
  SourceMeta,
} from '@/lib/types';

const CENT_SCALE = BigInt(1000000);
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const ZERO_BIGINT = BigInt(0);
const TOR_BASE_UNIT_MAX_DIGITS = 80;
const TOR_BASE_UNIT_PATTERN = /^\d+$/;

const staticSources: SourceMeta[] = [
  {
    label: 'ADR-026 dynamic L1 min fee per thorname',
    url: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
    notes: 'Architecture decision text for the proposed controller model.',
  },
  {
    label: 'THORChain fees developer docs',
    url: 'https://dev.thorchain.org/concepts/fees.html',
  },
  {
    label: 'THORName affiliate guide',
    url: 'https://dev.thorchain.org/affiliate-guide/thorname-guide.html',
  },
  {
    label: 'THORChain Devs ADR-026 discussion',
    url: 'https://discord.com/channels/838986635756044328/1498412149842903151',
    notes: 'Community context only; not canonical protocol proof.',
  },
];

const staticFreshness: FreshnessMetaType = {
  checkedAt: '2026-07-03',
  confidence: 'curated',
  nextReviewDue: '2026-07-17',
};

const dynamicFeeRelatedChecks: RelatedCheck[] = [
  {
    label: 'Experiment source map',
    href: '/docs#dynamic-fee-experiment',
    badge: 'proof boundary',
    description: 'Check which ADR-026 and THORNode endpoint fields support this page, and which claims remain unproven.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'operations',
    description: 'Confirm whether broader trading, signing, observation, or source warnings affect the live fee readback.',
  },
  {
    label: 'Current source map',
    href: '/docs#current-protocol-state',
    badge: 'live evidence',
    description: 'Separate current THORNode snapshots from durable governance history or long-term revenue conclusions.',
  },
  {
    label: 'Dynamic fee search',
    href: '/search?q=dynamic%20L1%20fee&filter=task',
    badge: 'search',
    description: 'Jump to task results for ADR-026, DYNAMICFEE-WHITELIST, fees_tor, and attribution caveats.',
  },
];

function recordKey(thorname: string, pair: string) {
  return `${thorname.toLowerCase()}|${pair}`;
}

function formatBps(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unavailable' : `${value} bps`;
}

function formatEpoch(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unavailable' : value.toLocaleString();
}

function configSuffix(flag: DynamicL1FeeMimirFlag | undefined) {
  return flag?.value === null && flag.effectiveValue !== null && flag.effectiveValue !== undefined
    ? ' default'
    : '';
}

function formatConfigInteger(flag: DynamicL1FeeMimirFlag | undefined, unit: string) {
  const value = flag?.effectiveValue ?? flag?.value;
  return value === null || value === undefined
    ? 'Unavailable'
    : `${value.toLocaleString()} ${unit}${configSuffix(flag)}`;
}

function formatConfigDeadband(flag: DynamicL1FeeMimirFlag | undefined) {
  const value = flag?.effectiveValue ?? flag?.value;
  if (value === null || value === undefined) {
    return 'Unavailable';
  }
  const percent = value / 100;
  const percentText = Number.isInteger(percent) ? percent.toLocaleString() : percent.toFixed(2);
  return `${percentText}%${configSuffix(flag)}`;
}

function formatBlockAge(seconds: number | undefined) {
  if (seconds === undefined) {
    return 'Age unavailable';
  }
  const absolute = Math.abs(seconds);
  if (absolute < 60) {
    return `${absolute}s ${seconds < 0 ? 'future' : 'old'}`;
  }
  return `${Math.round(absolute / 60)}m ${seconds < 0 ? 'future' : 'old'}`;
}

function formatTorUsd(baseUnits: string | null | undefined) {
  return formatUsdFromTorBaseUnits(torBaseUnitsToBigInt(baseUnits));
}

function formatUsdFromCents(cents: bigint) {
  const whole = cents / BigInt(100);
  const fractional = cents % BigInt(100);
  const wholeText = whole <= MAX_SAFE_INTEGER_BIGINT
    ? Number(whole).toLocaleString()
    : whole.toLocaleString('en-US');

  return `$${wholeText}.${fractional.toString().padStart(2, '0')}`;
}

function formatUsdFromTorBaseUnits(units: bigint | null) {
  if (units === null) {
    return 'Insufficient samples';
  }

  const cents = torBaseUnitsToUsdCents(units);
  if (units > ZERO_BIGINT && cents === ZERO_BIGINT) {
    return '<$0.01';
  }

  return formatUsdFromCents(cents);
}

function torBaseUnitsToBigInt(baseUnits: string | null | undefined) {
  if (!baseUnits || baseUnits.length > TOR_BASE_UNIT_MAX_DIGITS || !TOR_BASE_UNIT_PATTERN.test(baseUnits)) {
    return null;
  }

  return BigInt(baseUnits);
}

function torBaseUnitsToUsdCents(units: bigint) {
  return (units + CENT_SCALE / BigInt(2)) / CENT_SCALE;
}

function centsToUsdNumber(cents: bigint | null) {
  if (cents === null) {
    return null;
  }

  if (cents > MAX_SAFE_INTEGER_BIGINT) {
    return null;
  }

  return Number(cents) / 100;
}

function formatUsdCompact(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Insufficient samples';
  }

  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absolute >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }

  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 100 ? 2 : 0,
  })}`;
}

function sumTorBaseUnits(values: Array<string | null | undefined>) {
  let totalBaseUnits = ZERO_BIGINT;
  let hasValue = false;

  for (const value of values) {
    const units = torBaseUnitsToBigInt(value);
    if (units !== null) {
      totalBaseUnits += units;
      hasValue = true;
    }
  }

  return hasValue ? totalBaseUnits : null;
}

function formatUsdCompactFromTorBaseUnits(units: bigint | null | undefined) {
  if (units === null || units === undefined) {
    return 'Insufficient samples';
  }

  const cents = torBaseUnitsToUsdCents(units);
  if (units > ZERO_BIGINT && cents === ZERO_BIGINT) {
    return '<$0.01';
  }

  const usdNumber = centsToUsdNumber(cents);
  return usdNumber === null ? formatUsdFromCents(cents) : formatUsdCompact(usdNumber);
}

type HistoryEpochRow = {
  epoch: number;
  feesTorBaseUnits: bigint | null;
  feesUsd: number | null;
  volumeTorBaseUnits: bigint | null;
  volumeUsd: number | null;
  averageBps: number | null;
  samples: number;
};

function historySampleCount(status: DynamicL1FeeStatus | undefined) {
  return (status?.histories ?? []).reduce(
    (total, thornameHistory) => total + thornameHistory.pairs.reduce(
      (pairTotal, pair) => pairTotal + pair.history.length,
      0
    ),
    0
  );
}

function historyPairCount(status: DynamicL1FeeStatus | undefined) {
  return (status?.histories ?? []).reduce((total, item) => total + item.pairs.length, 0);
}

function historyEpochRows(status: DynamicL1FeeStatus | undefined): HistoryEpochRow[] {
  const byEpoch = new Map<number, {
    feesTorBaseUnits: bigint;
    hasFees: boolean;
    volumeTorBaseUnits: bigint;
    hasVolume: boolean;
    bpsTotal: number;
    samples: number;
  }>();

  for (const thornameHistory of status?.histories ?? []) {
    for (const pairHistory of thornameHistory.pairs) {
      for (const entry of pairHistory.history) {
        const row = byEpoch.get(entry.epoch) ?? {
          feesTorBaseUnits: ZERO_BIGINT,
          hasFees: false,
          volumeTorBaseUnits: ZERO_BIGINT,
          hasVolume: false,
          bpsTotal: 0,
          samples: 0,
        };
        const feeUnits = torBaseUnitsToBigInt(entry.feesTorBaseUnits);
        const volumeUnits = torBaseUnitsToBigInt(entry.volumeTorBaseUnits);
        if (feeUnits !== null) {
          row.feesTorBaseUnits += feeUnits;
          row.hasFees = true;
        }
        if (volumeUnits !== null) {
          row.volumeTorBaseUnits += volumeUnits;
          row.hasVolume = true;
        }
        row.bpsTotal += entry.bpsAtClose;
        row.samples += 1;
        byEpoch.set(entry.epoch, row);
      }
    }
  }

  return [...byEpoch.entries()]
    .map(([epoch, row]) => ({
      epoch,
      feesTorBaseUnits: row.hasFees ? row.feesTorBaseUnits : null,
      feesUsd: row.hasFees ? centsToUsdNumber(torBaseUnitsToUsdCents(row.feesTorBaseUnits)) : null,
      volumeTorBaseUnits: row.hasVolume ? row.volumeTorBaseUnits : null,
      volumeUsd: row.hasVolume ? centsToUsdNumber(torBaseUnitsToUsdCents(row.volumeTorBaseUnits)) : null,
      averageBps: row.samples > 0 ? row.bpsTotal / row.samples : null,
      samples: row.samples,
    }))
    .sort((left, right) => left.epoch - right.epoch);
}

function bpsRange(records: DynamicL1FeeRecord[]) {
  if (records.length === 0) {
    return 'Unavailable';
  }
  const values = records.map((record) => record.dynamicBps);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? formatBps(min) : `${min}-${max} bps`;
}

function whitelistBadge(state: DynamicL1FeeWhitelistState) {
  switch (state) {
    case 'active':
      return { label: 'Active', variant: 'success' as const };
    case 'monitor':
      return { label: 'Monitor', variant: 'info' as const };
    case 'inactive':
      return { label: 'Inactive', variant: 'default' as const };
    case 'unparseable':
      return { label: 'Unparseable', variant: 'danger' as const };
  }
}

function sourceWarningBadgeVariant(detail: NetworkStatusSourceWarning) {
  if (detail.severity === 'critical') {
    return 'danger' as const;
  }
  if (detail.severity === 'review') {
    return 'info' as const;
  }
  return 'warning' as const;
}

function sourceWarningHeadline(status: DynamicL1FeeStatus | undefined) {
  if (!status || status.sourceWarnings.length === 0) {
    return undefined;
  }
  const firstDetail = status.sourceWarningDetails[0];
  if (!firstDetail) {
    return `${status.sourceWarnings.length} source warning${status.sourceWarnings.length === 1 ? '' : 's'} in this snapshot.`;
  }

  return `${status.sourceWarnings.length} source warning${status.sourceWarnings.length === 1 ? '' : 's'} in this snapshot. First: ${firstDetail.category} / ${firstDetail.message}`;
}

function DynamicFeeSourceWarnings({ status }: { status: DynamicL1FeeStatus }) {
  const details = status.sourceWarningDetails;
  if (details.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 font-semibold text-amber-300">Source warnings</p>
      <div className="space-y-2">
        {details.map((detail) => (
          <div key={`${detail.category}-${detail.message}`} className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={sourceWarningBadgeVariant(detail)}>{detail.severity}</Badge>
              <Badge variant="default">{detail.category}</Badge>
              {detail.keys?.map((key) => <Badge key={key} variant="info">{key}</Badge>)}
            </div>
            <p className="break-words text-amber-200">{detail.message}</p>
            <p className="mt-1 break-words text-slate-400">Action: {detail.action}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">Exact warning strings</p>
      <ul className="mt-1 space-y-1 text-amber-300">
        {status.sourceWarnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  );
}

function enabledState(status: DynamicL1FeeStatus | undefined) {
  if (!status) {
    return { value: 'Loading', variant: 'default' as const };
  }
  const enabled = status.mimir.enabled;
  if (enabled.state === 'active') {
    return { value: 'Enabled', variant: 'success' as const };
  }
  if (enabled.state === 'inactive') {
    return { value: 'Disabled', variant: 'warning' as const };
  }
  return { value: 'Unknown', variant: 'danger' as const };
}

function currentByRecord(status: DynamicL1FeeStatus | undefined) {
  const entries = new Map<string, DynamicL1FeeCurrentAccumulator>();
  for (const entry of status?.currentEntries ?? []) {
    entries.set(recordKey(entry.thorname, entry.pair), entry);
  }
  return entries;
}

function currentWithoutSealedRecords(status: DynamicL1FeeStatus | undefined) {
  const sealedKeys = new Set((status?.records ?? []).map((record) => recordKey(record.thorname, record.pair)));
  return (status?.currentEntries ?? []).filter((entry) => !sealedKeys.has(recordKey(entry.thorname, entry.pair)));
}

function PriorityMetric({
  icon,
  title,
  value,
  detail,
  why,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  why: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-md border border-border bg-surface-elevated p-2 text-accent" aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-300">{detail}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">Why: {why}</p>
    </div>
  );
}

function LookFirstPanel({
  status,
  sourceWarningCount,
  floorPinnedCount,
  ceilingPinnedCount,
}: {
  status?: DynamicL1FeeStatus;
  sourceWarningCount?: number;
  floorPinnedCount?: number;
  ceilingPinnedCount?: number;
}) {
  const currentFeesBaseUnits = sumTorBaseUnits((status?.currentEntries ?? []).map((entry) => entry.feesTorBaseUnits));
  const currentVolumeBaseUnits = sumTorBaseUnits((status?.currentEntries ?? []).map((entry) => entry.volumeTorBaseUnits));
  const sealedHistoryFeesBaseUnits = sumTorBaseUnits((status?.histories ?? []).flatMap((thornameHistory) => (
    thornameHistory.pairs.flatMap((pair) => pair.history.map((entry) => entry.feesTorBaseUnits))
  )));
  const sealedSamples = historySampleCount(status);
  const pairHistoryCount = historyPairCount(status);
  const records = status?.records ?? [];
  const floorLabel = floorPinnedCount === undefined ? 'floor unknown' : `${floorPinnedCount} at floor`;
  const ceilingLabel = ceilingPinnedCount === undefined ? 'ceiling unknown' : `${ceilingPinnedCount} at ceiling`;
  const warningCount = sourceWarningCount ?? 0;
  const trustLabel = status
    ? `${sealedSamples.toLocaleString()} sealed samples / ${warningCount.toLocaleString()} warnings`
    : 'Loading source trust';

  return (
    <Card id="dynamic-fees-live" className="mb-8 scroll-mt-24">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Look Here First</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            Start with these four signals. ADR-026 is testing whether partner-pair floors can improve revenue without losing useful flow.
          </p>
        </div>
        <Badge className="self-start" variant={!status ? 'info' : warningCount > 0 ? 'warning' : 'success'}>
          {!status
            ? 'Sources loading'
            : warningCount > 0
              ? `${warningCount} source warning${warningCount === 1 ? '' : 's'}`
              : 'Sources clean'}
        </Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <PriorityMetric
          icon={<WalletCards className="h-4 w-4" />}
          title="1. Revenue signal"
          value={formatUsdCompactFromTorBaseUnits(currentFeesBaseUnits)}
          detail={`Current epoch fees_tor; sealed history total ${formatUsdCompactFromTorBaseUnits(sealedHistoryFeesBaseUnits)}`}
          why="fees_tor is the objective. Without sealed-epoch improvement, lower bps has not shown revenue lift."
        />
        <PriorityMetric
          icon={<TrendingUp className="h-4 w-4" />}
          title="2. Demand signal"
          value={formatUsdCompactFromTorBaseUnits(currentVolumeBaseUnits)}
          detail="Current epoch volume_tor across tracked pairs"
          why="Volume is demand context, not proof that the lower floor won routing flow."
        />
        <PriorityMetric
          icon={<Target className="h-4 w-4" />}
          title="3. Controller movement"
          value={bpsRange(records)}
          detail={`${floorLabel} / ${ceilingLabel}`}
          why="dynamic_bps shows whether the experiment is learning, floor-pinned, or ceiling-pinned."
        />
        <PriorityMetric
          icon={warningCount > 0 ? <AlertTriangle className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
          title="4. Evidence quality"
          value={trustLabel}
          detail={`${pairHistoryCount.toLocaleString()} pairs with history endpoint coverage`}
          why="Sparse samples are operational evidence, not enough to claim a durable trend."
        />
      </div>
    </Card>
  );
}

function HistoricalResultsChart({ status }: { status?: DynamicL1FeeStatus }) {
  const rows = historyEpochRows(status);
  const chartRows = rows.slice(-16);
  const sealedSamples = historySampleCount(status);
  const pairCount = historyPairCount(status);
  const maxFees = Math.max(1, ...chartRows.map((row) => row.feesUsd ?? 0));
  const maxBps = Math.max(
    1,
    status?.mimir.ceilingBps.effectiveValue ?? 0,
    ...chartRows.map((row) => row.averageBps ?? 0)
  );
  const left = 52;
  const right = 692;
  const top = 32;
  const baseline = 190;
  const chartHeight = baseline - top;
  const xForIndex = (index: number) => (
    chartRows.length === 1
      ? (left + right) / 2
      : left + (index / (chartRows.length - 1)) * (right - left)
  );
  const linePoints = chartRows
    .map((row, index) => {
      if (row.averageBps === null) {
        return null;
      }
      const x = xForIndex(index);
      const y = baseline - (row.averageBps / maxBps) * chartHeight;
      return { x, y, row };
    })
    .filter((point): point is { x: number; y: number; row: HistoryEpochRow } => point !== null);

  return (
    <Card className="mb-10">
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historical Results</h2>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            Sealed epoch history from <code className="break-all">/dynamic_l1_fees/&lbrace;thorname&rbrace;</code>. Showing {sealedSamples.toLocaleString()} sample{sealedSamples === 1 ? '' : 's'} across {pairCount.toLocaleString()} pair{pairCount === 1 ? '' : 's'}; this is operational history, not proof of durable revenue lift.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={rows.length >= 2 ? 'info' : 'warning'}>
            {rows.length >= 2 ? `${rows.length} epochs` : 'Insufficient samples for trend'}
          </Badge>
          <Badge variant={sealedSamples > 0 ? 'info' : 'warning'}>
            {sealedSamples > 0 ? 'Sealed samples available' : 'No sealed samples'}
          </Badge>
          <Badge variant="warning">Not causal proof</Badge>
        </div>
      </div>

      {chartRows.length > 0 ? (
        <>
          {rows.length < 2 && (
            <p className="mb-3 text-sm text-amber-300">
              Insufficient samples for trend; showing available sealed sample only.
            </p>
          )}
          <div className="rounded-md border border-border bg-surface p-3">
            <svg
              className="h-64 w-full"
              viewBox="0 0 720 230"
              role="img"
              aria-label="Sealed dynamic fee history chart showing fees in TOR dollars and average bps at close by epoch"
            >
              <line x1={left} x2={right} y1={baseline} y2={baseline} stroke="rgb(51 65 85)" />
              <line x1={left} x2={left} y1={top} y2={baseline} stroke="rgb(51 65 85)" />
              {[0.25, 0.5, 0.75].map((tick) => {
                const y = baseline - tick * chartHeight;
                return (
                  <line
                    key={tick}
                    x1={left}
                    x2={right}
                    y1={y}
                    y2={y}
                    stroke="rgb(30 41 59)"
                    strokeDasharray="4 6"
                  />
                );
              })}
              <text x="14" y="24" fill="rgb(148 163 184)" fontSize="11">fees_tor</text>
              <text x="646" y="24" fill="rgb(125 211 252)" fontSize="11">avg bps</text>
              {chartRows.map((row, index) => {
                const x = xForIndex(index);
                const barWidth = Math.max(10, Math.min(34, 420 / Math.max(chartRows.length, 1)));
                const barHeight = ((row.feesUsd ?? 0) / maxFees) * chartHeight;
                const y = baseline - barHeight;
                return (
                  <g key={row.epoch}>
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx="3"
                      fill="rgb(52 211 153)"
                      opacity="0.75"
                    >
                      <title>{`Epoch ${row.epoch}: ${formatUsdCompactFromTorBaseUnits(row.feesTorBaseUnits)} fees_tor, ${formatUsdCompactFromTorBaseUnits(row.volumeTorBaseUnits)} volume_tor, ${row.averageBps?.toFixed(1) ?? 'Unavailable'} bps`}</title>
                    </rect>
                    {(chartRows.length <= 8 || index % 2 === 0 || index === chartRows.length - 1) && (
                      <text
                        x={x}
                        y="212"
                        textAnchor="middle"
                        fill="rgb(148 163 184)"
                        fontSize="10"
                      >
                        {row.epoch}
                      </text>
                    )}
                  </g>
                );
              })}
              {linePoints.length > 1 && (
                <polyline
                  points={linePoints.map((point) => `${point.x},${point.y}`).join(' ')}
                  fill="none"
                  stroke="rgb(56 189 248)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {linePoints.map((point) => (
                <circle key={point.row.epoch} cx={point.x} cy={point.y} r="4" fill="rgb(56 189 248)">
                  <title>{`Epoch ${point.row.epoch}: ${point.row.averageBps?.toFixed(1) ?? 'Unavailable'} average bps at close`}</title>
                </circle>
              ))}
            </svg>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
              <span><span className="mr-1 inline-block h-2 w-4 rounded-sm bg-emerald-400 align-middle" />fees_tor by sealed epoch</span>
              <span><span className="mr-1 inline-block h-2 w-4 rounded-sm bg-sky-400 align-middle" />average bps_at_close</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:hidden">
            {rows.slice(-8).map((row) => (
              <div key={row.epoch} className="rounded-md border border-border bg-surface p-3 text-xs">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-mono text-accent">Epoch {row.epoch.toLocaleString()}</span>
                  <Badge variant="info">{row.samples.toLocaleString()} sample{row.samples === 1 ? '' : 's'}</Badge>
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="text-slate-400">Sealed fees_tor</dt>
                    <dd>{formatUsdCompactFromTorBaseUnits(row.feesTorBaseUnits)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Sealed volume_tor</dt>
                    <dd>{formatUsdCompactFromTorBaseUnits(row.volumeTorBaseUnits)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Avg bps close</dt>
                    <dd>{row.averageBps === null ? 'Unavailable' : `${row.averageBps.toFixed(1)} bps`}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <div className="mt-4 hidden overflow-x-auto rounded-md border border-border sm:block">
            <table className="w-full min-w-[560px] text-left text-xs">
              <caption className="sr-only">Sealed dynamic fee history by epoch</caption>
              <thead className="bg-surface text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-2">Epoch</th>
                  <th scope="col" className="px-3 py-2">Sealed fees_tor</th>
                  <th scope="col" className="px-3 py-2">Sealed volume_tor</th>
                  <th scope="col" className="px-3 py-2">Avg bps close</th>
                  <th scope="col" className="px-3 py-2">Pair samples</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(-8).map((row) => (
                  <tr key={row.epoch} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-accent">{row.epoch.toLocaleString()}</td>
                    <td className="px-3 py-2">{formatUsdCompactFromTorBaseUnits(row.feesTorBaseUnits)}</td>
                    <td className="px-3 py-2">{formatUsdCompactFromTorBaseUnits(row.volumeTorBaseUnits)}</td>
                    <td className="px-3 py-2">{row.averageBps === null ? 'Unavailable' : `${row.averageBps.toFixed(1)} bps`}</td>
                    <td className="px-3 py-2">{row.samples.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="rounded-md border border-border bg-surface p-4 text-sm text-slate-400">
          No sealed historical samples are available from the per-thorname history endpoint. Treat this as insufficient samples, not as zero revenue.
        </p>
      )}
      <PairLearningDetails status={status} />
    </Card>
  );
}

function PairLearningDetails({ status }: { status?: DynamicL1FeeStatus }) {
  const floorBps = status?.mimir.floorBps.effectiveValue ?? status?.mimir.floorBps.value;
  const ceilingBps = status?.mimir.ceilingBps.effectiveValue ?? status?.mimir.ceilingBps.value;
  const pairs = (status?.histories ?? []).flatMap((thornameHistory) => thornameHistory.pairs)
    .sort((left, right) => (
      left.thorname.localeCompare(right.thorname) ||
      left.pair.localeCompare(right.pair)
    ));

  if (pairs.length === 0) {
    return null;
  }

  return (
    <details className="mt-4 rounded-md border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:underline">
        Show pair-level history details
      </summary>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
        Pair-level samples are useful for debugging the controller, but the first read should stay on aggregate fees, volume, bps range, and source quality.
      </p>
      <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {pairs.map((pair) => {
          const latest = pair.history.at(-1);
          const learningState = pair.history.length === 0
            ? { label: 'No sealed history', variant: 'warning' as const }
            : pair.history.length === 1
              ? { label: 'Bootstrap', variant: 'info' as const }
              : { label: 'Learning', variant: 'success' as const };
          const edgeState = typeof floorBps === 'number' && pair.dynamicBps === floorBps
            ? 'At floor'
            : typeof ceilingBps === 'number' && pair.dynamicBps === ceilingBps
              ? 'At ceiling'
              : 'Inside bounds';

          return (
            <div key={recordKey(pair.thorname, pair.pair)} className="min-w-0 rounded-md border border-border bg-surface-elevated p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-accent">{pair.thorname}</p>
                  <p className="mt-1 break-words text-xs text-slate-300">{pair.pair}</p>
                </div>
                <Badge variant={learningState.variant}>{learningState.label}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-400">Dynamic bps</dt>
                  <dd className="font-semibold">{formatBps(pair.dynamicBps)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Bounds state</dt>
                  <dd>{edgeState}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Samples</dt>
                  <dd>{pair.history.length.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Latest epoch</dt>
                  <dd>{formatEpoch(latest?.epoch ?? null)}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Latest fees_tor</dt>
                  <dd>{formatUsdCompactFromTorBaseUnits(torBaseUnitsToBigInt(latest?.feesTorBaseUnits))}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Latest volume_tor</dt>
                  <dd>{formatUsdCompactFromTorBaseUnits(torBaseUnitsToBigInt(latest?.volumeTorBaseUnits))}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Bps at close</dt>
                  <dd>{formatBps(latest?.bpsAtClose)}</dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function DynamicFeeRow({
  record,
  current,
}: {
  record: DynamicL1FeeRecord;
  current?: DynamicL1FeeCurrentAccumulator;
}) {
  const badge = whitelistBadge(record.whitelistState);

  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4 font-mono text-xs text-accent">{record.thorname}</td>
      <td className="py-3 pr-4 text-xs text-slate-300">{record.pair}</td>
      <td className="py-3 pr-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
      <td className="py-3 pr-4 text-sm font-semibold">{formatBps(record.dynamicBps)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatEpoch(record.lastActiveEpoch)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTorUsd(record.latestFeesTorBaseUnits)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTorUsd(current?.feesTorBaseUnits)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTorUsd(current?.volumeTorBaseUnits)}</td>
    </tr>
  );
}

function DynamicFeeMobileCard({
  record,
  current,
}: {
  record: DynamicL1FeeRecord;
  current?: DynamicL1FeeCurrentAccumulator;
}) {
  const badge = whitelistBadge(record.whitelistState);

  return (
    <Card className="min-w-0" padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-accent">{record.thorname}</p>
          <p className="mt-1 break-words text-xs text-slate-300">{record.pair}</p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">Dynamic floor</dt>
          <dd className="font-semibold">{formatBps(record.dynamicBps)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last epoch</dt>
          <dd>{formatEpoch(record.lastActiveEpoch)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Sealed fees</dt>
          <dd>{formatTorUsd(record.latestFeesTorBaseUnits)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current fees</dt>
          <dd>{formatTorUsd(current?.feesTorBaseUnits)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current volume</dt>
          <dd>{formatTorUsd(current?.volumeTorBaseUnits)}</dd>
        </div>
      </dl>
    </Card>
  );
}

function BpsDistribution({ records }: { records: DynamicL1FeeRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-400">No sealed dynamic-fee records are available from THORNode.</p>;
  }

  const maxBps = Math.max(...records.map((record) => record.dynamicBps), 1);

  return (
    <div className="min-w-0 space-y-3">
      {records.map((record) => (
        <div key={recordKey(record.thorname, record.pair)} className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
            <span className="min-w-0 truncate text-slate-300">{record.thorname} / {record.pair}</span>
            <span className="shrink-0 font-semibold text-accent">{formatBps(record.dynamicBps)}</span>
          </div>
          <div className="h-2 rounded bg-slate-800" aria-hidden="true">
            <div
              className="h-2 rounded bg-accent"
              style={{ width: `${Math.max(6, (record.dynamicBps / maxBps) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InterpretationNotes({ status, sourceWarningCount }: { status?: DynamicL1FeeStatus; sourceWarningCount?: number }) {
  const sealedSamples = historySampleCount(status);
  const sealedEpochs = historyEpochRows(status).length;
  const pairCount = historyPairCount(status);
  const warningCount = sourceWarningCount ?? 0;
  const snapshotLabel = status
    ? `${status.sourceFreshness.thorchainHeight.toLocaleString()} at ${formatBlockAge(status.sourceFreshness.thorchainBlockAgeSeconds)}`
    : 'Loading snapshot';
  const sampleLabel = status
    ? `${sealedSamples.toLocaleString()} samples across ${sealedEpochs.toLocaleString()} epochs and ${pairCount.toLocaleString()} pairs`
    : 'Loading sealed samples';

  return (
    <>
      <SectionHeader>Interpretation Notes</SectionHeader>
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant={!status || warningCount > 0 ? 'warning' : 'success'}>
            {!status ? 'Live proof loading' : warningCount > 0 ? 'Source warnings present' : 'Snapshot pinned'}
          </Badge>
          <Badge variant={sealedSamples >= 6 && sealedEpochs >= 3 ? 'info' : 'warning'}>
            {sealedSamples.toLocaleString()} sealed sample{sealedSamples === 1 ? '' : 's'}
          </Badge>
          <Badge variant="warning">Not causal proof</Badge>
        </div>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          Keep these as guardrails for the live numbers. They are important, but they should not compete with the operational dashboard above.
        </p>
        <ul className="grid gap-2 text-sm leading-relaxed text-slate-400 md:grid-cols-2">
          <li>L1-to-L1 scope: ADR-026 v1 applies to eligible L1 swaps selected by whitelisted thornames and normalized pairs; trade assets, secured assets, synths, and many arb flows remain outside this model.</li>
          <li>Current THORNode values can change every block or epoch. This page pins reads to one provider and height; current snapshot: {snapshotLabel}; warnings: {status ? warningCount.toLocaleString() : 'Unavailable'}.</li>
          <li>Affiliate attribution versus applied floor: eligible thornames can receive TOR credit while the applied floor comes from the largest affiliate-bps thorname.</li>
          <li>Discord can explain debate and operating concerns, but it is not canonical protocol evidence.</li>
          <li>Current records and sparse sealed history do not prove revenue lift, route competitiveness, or partner attribution quality.</li>
        </ul>
        <details className="mt-4 rounded-md border border-border bg-surface p-4">
          <summary className="cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Show what would improve proof
          </summary>
          <dl className="mt-4 grid gap-4 text-xs leading-relaxed text-slate-400 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-300">Scope expansion</dt>
              <dd className="mt-1">A later ADR or endpoint that explicitly covers trade, secured, synth, or arb classes.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-300">Durable state history</dt>
              <dd className="mt-1">Longer sealed history, indexed block-by-block Mimir changes, or a governance/event timeline independent of latest THORNode state.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-300">Attribution quality</dt>
              <dd className="mt-1">Per-swap evidence exposing the memo thornames, affiliate bps splits, credited thornames, selected floor thorname, and applied dynamic bps.</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-300">Revenue and routing lift</dt>
              <dd className="mt-1">Before/after route-share baselines, quote-win rates, partner traffic attribution, comparable non-whitelisted control flow, and enough sealed epochs to separate fee changes from demand or liquidity changes. Current sealed coverage: {sampleLabel}.</dd>
            </div>
          </dl>
        </details>
      </Card>
    </>
  );
}

function SourceStatusStrip({
  result,
  status,
  isDegraded,
  error,
  sourceWarningCount,
}: {
  result?: LiveDataResult<DynamicL1FeeStatus>;
  status?: DynamicL1FeeStatus;
  isDegraded?: boolean;
  error?: string;
  sourceWarningCount?: number;
}) {
  return (
    <div className="mb-8 rounded-md border border-border bg-surface-elevated px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Static context</p>
          <FreshnessMeta freshness={staticFreshness} sources={staticSources} compact />
        </div>
        <div className="min-w-0 lg:text-right">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Live snapshot</p>
          <LiveSourceMeta result={result} />
          {(isDegraded || error) && (
            <p className="mt-2 text-xs text-amber-300">
              {error ?? 'Dynamic fee live data is degraded. Static documentation remains visible.'}
            </p>
          )}
          {status && sourceWarningCount !== undefined && sourceWarningCount > 0 && (
            <p className="mt-2 text-xs text-amber-300">
              {sourceWarningHeadline(status)}
            </p>
          )}
          {status && (
            <p className="mt-2 text-xs text-slate-400">
              Height {status.sourceFreshness.thorchainHeight.toLocaleString()} / {formatBlockAge(status.sourceFreshness.thorchainBlockAgeSeconds)}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        ADR text is design context; THORNode values are current-only operational evidence.
      </p>
    </div>
  );
}

interface DynamicFeesViewProps {
  result?: LiveDataResult<DynamicL1FeeStatus>;
  status?: DynamicL1FeeStatus;
  isLoading?: boolean;
  isDegraded?: boolean;
  error?: string;
}

export function DynamicFeesView({
  result,
  status,
  isLoading = false,
  isDegraded = false,
  error,
}: DynamicFeesViewProps) {
  const currentEntries = currentByRecord(status);
  const orphanCurrentEntries = currentWithoutSealedRecords(status);
  const enabled = enabledState(status);
  const whitelistedCount = status?.mimir.whitelistedPartners.filter((partner) => partner.whitelisted).length;
  const trackedPairCount = new Set((status?.records ?? []).map((record) => record.pair)).size;
  const floorBps = status?.mimir.floorBps.effectiveValue ?? status?.mimir.floorBps.value;
  const ceilingBps = status?.mimir.ceilingBps.effectiveValue ?? status?.mimir.ceilingBps.value;
  const floorPinnedCount = typeof floorBps === 'number'
    ? (status?.records ?? []).filter((record) => record.dynamicBps === floorBps).length
    : undefined;
  const ceilingPinnedCount = typeof ceilingBps === 'number'
    ? (status?.records ?? []).filter((record) => record.dynamicBps === ceilingBps).length
    : undefined;
  const sourceWarningCount = status?.sourceWarnings.length;

  return (
    <PageContainer>
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={enabled.variant}>{enabled.value}</Badge>
          <Badge variant="warning">Current-only</Badge>
          <Badge variant="info">ADR-026</Badge>
          {sourceWarningCount !== undefined && sourceWarningCount > 0 && <Badge variant="warning">Source warnings {sourceWarningCount}</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dynamic L1 Fees</h1>
        <p className="max-w-3xl text-slate-400">
          ADR-026 replaces one global L1 minimum slip floor with whitelisted per-thorname and per-pair floors that move by a TOR-denominated fee-revenue signal.
          Live values below are THORNode snapshots, not durable governance history.
        </p>
      </div>

      <LookFirstPanel
        status={status}
        sourceWarningCount={sourceWarningCount}
        floorPinnedCount={floorPinnedCount}
        ceilingPinnedCount={ceilingPinnedCount}
      />

      <RelatedChecks checks={dynamicFeeRelatedChecks} className="mb-8" />

      <SourceStatusStrip
        result={result}
        status={status}
        isDegraded={isDegraded}
        error={error}
        sourceWarningCount={sourceWarningCount}
      />

      <SectionHeader>Current Controls</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        These are the control-surface values behind the tracker. The fallback floor is still the base L1 minimum; dynamic floors only apply to active whitelisted thorname and pair records.
      </p>
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<RadioTower className="h-4 w-4" />} label="Controller" value={enabled.value} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Fallback L1 floor" value={formatBps(status?.mimir.slipMinBps.value)} />
        <StatCard icon={<ListChecks className="h-4 w-4" />} label="Whitelisted" value={whitelistedCount ?? 'Loading'} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Tracked pairs" value={status ? trackedPairCount : 'Loading'} />
        <StatCard icon={<Scale className="h-4 w-4" />} label="Current epoch" value={status?.currentEpoch ?? 'Loading'} />
      </div>

      <details className="mb-10 rounded-md border border-border bg-surface-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-accent underline-offset-4 hover:underline">
          Show controller configuration
        </summary>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={<Gauge className="h-4 w-4" />} label="Dynamic floor" value={formatConfigInteger(status?.mimir.floorBps, 'bps')} />
          <StatCard icon={<Gauge className="h-4 w-4" />} label="Dynamic ceiling" value={formatConfigInteger(status?.mimir.ceilingBps, 'bps')} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Step" value={formatConfigInteger(status?.mimir.stepBps, 'bps')} />
          <StatCard icon={<Scale className="h-4 w-4" />} label="Deadband" value={formatConfigDeadband(status?.mimir.deadbandBps)} />
          <StatCard icon={<ListChecks className="h-4 w-4" />} label="Window" value={formatConfigInteger(status?.mimir.windowEpochs, 'epochs')} />
          <StatCard icon={<RadioTower className="h-4 w-4" />} label="Epoch blocks" value={formatConfigInteger(status?.mimir.epochBlocks, 'blocks')} />
        </div>
      </details>

      <HistoricalResultsChart status={status} />

      <SectionHeader>Tracked Records</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        Raw sealed records show the maintained dynamic floor for each tracked thorname and pair. Active whitelist records may apply that floor at swap time; monitor records are computed but still use the base L1 floor.
      </p>
      {isLoading && !status ? (
        <Card className="mb-10">
          <p className="text-sm text-slate-400">Loading dynamic fee records from THORNode...</p>
        </Card>
      ) : status && status.records.length > 0 ? (
        <div className="mb-10">
          <div className="grid gap-3 md:hidden">
            {status.records.map((record) => (
              <DynamicFeeMobileCard
                key={recordKey(record.thorname, record.pair)}
                record={record}
                current={currentEntries.get(recordKey(record.thorname, record.pair))}
              />
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-surface-elevated md:block">
            <table className="w-full min-w-[860px] text-left">
              <caption className="sr-only">Current dynamic L1 fee records from THORNode</caption>
              <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th scope="col" className="py-3 pl-4 pr-4">Thorname</th>
                  <th scope="col" className="py-3 pr-4">Pair</th>
                  <th scope="col" className="py-3 pr-4">Whitelist</th>
                  <th scope="col" className="py-3 pr-4">Dynamic bps</th>
                  <th scope="col" className="py-3 pr-4">Last epoch</th>
                  <th scope="col" className="py-3 pr-4">Sealed fees</th>
                  <th scope="col" className="py-3 pr-4">Current fees</th>
                  <th scope="col" className="py-3 pr-4">Current volume</th>
                </tr>
              </thead>
              <tbody>
                {status.records.map((record) => (
                  <DynamicFeeRow
                    key={recordKey(record.thorname, record.pair)}
                    record={record}
                    current={currentEntries.get(recordKey(record.thorname, record.pair))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {orphanCurrentEntries.length > 0 && (
            <Card className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-amber-300">Current accumulators without sealed records</h2>
              <p className="mb-3 text-sm text-slate-400">
                THORNode is exposing in-progress TOR volume or fees for these pairs before a matching sealed record is available in this snapshot.
              </p>
              <dl className="grid gap-3 text-xs md:grid-cols-2">
                {orphanCurrentEntries.map((entry) => (
                  <div key={recordKey(entry.thorname, entry.pair)} className="rounded border border-border p-3">
                    <dt className="font-mono text-accent">{entry.thorname}</dt>
                    <dd className="mt-1 break-words text-slate-300">{entry.pair}</dd>
                    <dd className="mt-2 text-slate-400">Epoch {formatEpoch(entry.epoch)} / fees {formatTorUsd(entry.feesTorBaseUnits)} / volume {formatTorUsd(entry.volumeTorBaseUnits)}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      ) : (
        <Card className="mb-10">
          <p className="text-sm text-slate-400">No sealed dynamic-fee records are available. Treat this as no live evidence, not as zero activity.</p>
        </Card>
      )}

      <div className="mb-12 grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold">Dynamic bps distribution</h2>
          {status && status.records.length > 0 && (
            <p className="mb-3 text-xs text-slate-400">
              {floorPinnedCount ?? 'Unavailable'} at floor / {ceilingPinnedCount ?? 'Unavailable'} at ceiling across {status.records.length.toLocaleString()} tracked records.
            </p>
          )}
          <BpsDistribution records={status?.records ?? []} />
        </Card>
        <Card className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold">Operational evidence</h2>
          <details className="group min-w-0 max-w-full overflow-hidden">
            <summary className="cursor-pointer break-words text-sm text-accent underline-offset-4 hover:underline">
              Show exact Mimir keys and endpoint fields
            </summary>
            <div className="mt-4 min-w-0 max-w-full space-y-4 overflow-hidden break-words text-xs text-slate-400">
              <div>
                <p className="mb-1 font-semibold text-slate-300">Mimir keys</p>
                <ul className="space-y-1">
                  <li><code>L1DynamicFeeEnabled</code>: {status?.mimir.enabled.value ?? 'Unavailable'}</li>
                  <li><code>L1SlipMinBPS</code>: {status?.mimir.slipMinBps.value ?? 'Unavailable'}</li>
                  <li><code>L1DynamicFeeEpochBlocks</code>: {status?.mimir.epochBlocks.value ?? `default ${status?.mimir.epochBlocks.defaultValue ?? 'Unavailable'}`}</li>
                  <li><code>L1DynamicFeeFloorBPS</code>: {status?.mimir.floorBps.value ?? `default ${status?.mimir.floorBps.defaultValue ?? 'Unavailable'}`}</li>
                  <li><code>L1DynamicFeeCeilingBPS</code>: {status?.mimir.ceilingBps.value ?? `default ${status?.mimir.ceilingBps.defaultValue ?? 'Unavailable'}`}</li>
                  <li><code>L1DynamicFeeStepBPS</code>: {status?.mimir.stepBps.value ?? `default ${status?.mimir.stepBps.defaultValue ?? 'Unavailable'}`}</li>
                  <li><code>L1DynamicFeeDeadbandBPS</code>: {status?.mimir.deadbandBps.value ?? `default ${status?.mimir.deadbandBps.defaultValue ?? 'Unavailable'}`}</li>
                  <li><code>L1DynamicFeeWindowEpochs</code>: {status?.mimir.windowEpochs.value ?? `default ${status?.mimir.windowEpochs.defaultValue ?? 'Unavailable'}`}</li>
                  {(status?.mimir.whitelistedPartners ?? []).map((partner) => (
                    <li key={partner.key}><code>{partner.key}</code>: {partner.value ?? 'Unavailable'} ({partner.state})</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-semibold text-slate-300">Endpoint fields</p>
                <p><code>/dynamic_l1_fees</code>: thorname, pair, dynamic_bps, whitelist_state, last_active_epoch, latest_fees_tor.</p>
                <p><code>/dynamic_l1_fees_current</code>: epoch, thorname, pair, volume_tor, fees_tor.</p>
                <p><code>/dynamic_l1_fees/&lbrace;thorname&rbrace;</code>: thorname, whitelist_state, pair, dynamic_bps, last_active_epoch, history.epoch, history.volume_tor, history.fees_tor, history.bps_at_close.</p>
              </div>
              {status && sourceWarningCount !== undefined && sourceWarningCount > 0 && (
                <DynamicFeeSourceWarnings status={status} />
              )}
            </div>
          </details>
        </Card>
      </div>

      <SectionHeader>How the Experiment Works</SectionHeader>
      <div className="mb-12 grid gap-3 md:grid-cols-2">
        {[
          {
            title: 'From one floor to many',
            body: 'Instead of applying one network-wide L1SlipMinBPS to every L1 swap, ADR-026 creates a floor per whitelisted thorname and normalized pair.',
          },
          {
            title: 'Pair normalization',
            body: 'Pairs are direction-agnostic. Non-RUNE endpoints are sorted by full asset string, while swaps with RUNE use ASSET|THOR.RUNE as the pair identity.',
          },
          {
            title: 'Governance-curated whitelist',
            body: 'DYNAMICFEE-WHITELIST-{thorname}=1 applies the dynamic floor. State 2 monitors without applying it. Absent or zero means the default floor is used.',
          },
          {
            title: 'Attribution versus application',
            body: 'Eligible listed thornames can receive full TOR credit for a swap, but the fee floor is selected from the largest affiliate-bps thorname in the memo.',
          },
          {
            title: 'TOR-denominated signal',
            body: 'The controller compares fees_tor across epochs, so RUNE/USD movement is less likely to look like fee-policy performance.',
          },
          {
            title: 'Closed-loop movement',
            body: 'If the last bps change increased fee revenue, the floor keeps moving in that direction. If it reduced revenue, the controller reverses inside configured floor, ceiling, step, window, and deadband settings.',
          },
        ].map((item) => (
          <Card key={item.title}>
            <h3 className="mb-2 text-sm font-semibold">{item.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{item.body}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Community Read</SectionHeader>
      <div className="mb-12 grid gap-3 lg:grid-cols-3">
        <Card>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-green-400">Why supporters like it</h3>
            <Badge variant="default">Context only</Badge>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            A single fee floor is too blunt. Dynamic floors can compete for price-sensitive aggregator flow while preserving revenue where THORChain demand is stickier.
          </p>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-amber-300">What skeptics worry about</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            Zero-bps or tie-ordered memos can still make a whitelisted thorname the largest affiliate-bps selector, large frontends may gain an edge, and sparse routes may never create enough data for the controller.
          </p>
        </Card>
        <Card>
          <h3 className="mb-2 text-sm font-semibold text-blue-400">What it may prove</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            If low dynamic floors still fail to win flow, the bottleneck may be routing quality, liquidity, speed, or app-layer integration rather than base protocol fees.
          </p>
        </Card>
      </div>

      <InterpretationNotes status={status} sourceWarningCount={sourceWarningCount} />
    </PageContainer>
  );
}

export default function DynamicFeesPageClient() {
  const { result, data: status, isLoading, isDegraded, error } = useDynamicL1FeeStatus();

  return (
    <DynamicFeesView
      result={result}
      status={status}
      isLoading={isLoading}
      isDegraded={isDegraded}
      error={error}
    />
  );
}
