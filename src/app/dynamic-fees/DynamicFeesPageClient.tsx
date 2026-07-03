'use client';

import { Activity, Gauge, ListChecks, RadioTower, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { useDynamicL1FeeStatus } from '@/lib/hooks/useMidgard';
import type {
  DynamicL1FeeCurrentAccumulator,
  DynamicL1FeeMimirFlag,
  DynamicL1FeeRecord,
  DynamicL1FeeStatus,
  DynamicL1FeeWhitelistState,
  FreshnessMeta as FreshnessMetaType,
  LiveDataResult,
  SourceMeta,
} from '@/lib/types';

const CENT_SCALE = BigInt(1000000);
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);

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
  if (!baseUnits) {
    return 'Insufficient samples';
  }

  const units = BigInt(baseUnits);
  const cents = (units + CENT_SCALE / BigInt(2)) / CENT_SCALE;
  const whole = cents / BigInt(100);
  const fractional = cents % BigInt(100);
  const wholeText = whole <= MAX_SAFE_INTEGER_BIGINT
    ? Number(whole).toLocaleString()
    : whole.toString();

  return `$${wholeText}.${fractional.toString().padStart(2, '0')}`;
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
    <Card padding="sm">
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
    <div className="space-y-3">
      {records.map((record) => (
        <div key={recordKey(record.thorname, record.pair)}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
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
  const sourceWarningCount = status?.sourceWarnings.length ?? 0;

  return (
    <PageContainer>
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant={enabled.variant}>{enabled.value}</Badge>
          <Badge variant="warning">Current-only</Badge>
          <Badge variant="info">ADR-026</Badge>
          {sourceWarningCount > 0 && <Badge variant="warning">Source warnings {sourceWarningCount}</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dynamic L1 Fees</h1>
        <p className="max-w-3xl text-slate-400">
          ADR-026 replaces one global L1 minimum slip floor with whitelisted per-thorname and per-pair floors that move by a TOR-denominated fee-revenue signal.
          Live values below are THORNode snapshots, not durable governance history.
        </p>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Source posture</h2>
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            The ADR text still carries a proposed-design posture while live THORNode endpoints can show enabled Mimirs and tracked records.
            This page separates static design context from live current-only evidence.
          </p>
          <FreshnessMeta freshness={staticFreshness} sources={staticSources} />
        </Card>
        <Card>
          <h2 className="mb-2 text-sm font-semibold">Live source</h2>
          <LiveSourceMeta result={result} />
          {(isDegraded || error) && (
            <p className="mt-3 text-sm text-amber-300">
              {error ?? 'Dynamic fee live data is degraded. Static documentation remains visible.'}
            </p>
          )}
          {sourceWarningCount > 0 && (
            <p className="mt-3 text-sm text-amber-300">
              {sourceWarningCount} dynamic-fee source warning{sourceWarningCount === 1 ? '' : 's'} in this snapshot. First warning: {status?.sourceWarnings[0]}
            </p>
          )}
          {status && (
            <p className="mt-3 text-xs text-slate-400">
              Snapshot height {status.sourceFreshness.thorchainHeight.toLocaleString()} / block time {new Date(status.sourceFreshness.thorchainBlockTime).toLocaleString()} / {formatBlockAge(status.sourceFreshness.thorchainBlockAgeSeconds)}
            </p>
          )}
        </Card>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<RadioTower className="h-4 w-4" />} label="Controller" value={enabled.value} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Fallback L1 floor" value={formatBps(status?.mimir.slipMinBps.value)} />
        <StatCard icon={<ListChecks className="h-4 w-4" />} label="Whitelisted" value={whitelistedCount ?? 'Loading'} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Tracked pairs" value={status ? trackedPairCount : 'Loading'} />
        <StatCard icon={<Scale className="h-4 w-4" />} label="Current epoch" value={status?.currentEpoch ?? 'Loading'} />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Dynamic floor" value={formatConfigInteger(status?.mimir.floorBps, 'bps')} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Dynamic ceiling" value={formatConfigInteger(status?.mimir.ceilingBps, 'bps')} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Step" value={formatConfigInteger(status?.mimir.stepBps, 'bps')} />
        <StatCard icon={<Scale className="h-4 w-4" />} label="Deadband" value={formatConfigDeadband(status?.mimir.deadbandBps)} />
        <StatCard icon={<ListChecks className="h-4 w-4" />} label="Window" value={formatConfigInteger(status?.mimir.windowEpochs, 'epochs')} />
        <StatCard icon={<RadioTower className="h-4 w-4" />} label="Epoch blocks" value={formatConfigInteger(status?.mimir.epochBlocks, 'blocks')} />
      </div>

      <SectionHeader>Tracked Records</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        Sealed records show the maintained dynamic floor for each tracked thorname and pair. Active whitelist records may apply that floor at swap time; monitor records are computed but still use the base L1 floor.
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

      <div className="mb-12 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-4 text-sm font-semibold">Dynamic bps distribution</h2>
          {status && status.records.length > 0 && (
            <p className="mb-3 text-xs text-slate-400">
              {floorPinnedCount ?? 'Unavailable'} at floor / {ceilingPinnedCount ?? 'Unavailable'} at ceiling across {status.records.length.toLocaleString()} tracked records.
            </p>
          )}
          <BpsDistribution records={status?.records ?? []} />
        </Card>
        <Card>
          <h2 className="mb-3 text-sm font-semibold">Operational evidence</h2>
          <details className="group">
            <summary className="cursor-pointer text-sm text-accent underline-offset-4 hover:underline">
              Show exact Mimir keys and endpoint fields
            </summary>
            <div className="mt-4 space-y-4 text-xs text-slate-400">
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
              </div>
              {sourceWarningCount > 0 && (
                <div>
                  <p className="mb-1 font-semibold text-amber-300">Source warnings</p>
                  <ul className="space-y-1 text-amber-300">
                    {status?.sourceWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                </div>
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
          <h3 className="mb-2 text-sm font-semibold text-green-400">Why supporters like it</h3>
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

      <SectionHeader>Caveats and Non-Claims</SectionHeader>
      <Card>
        <ul className="grid gap-2 text-sm leading-relaxed text-slate-400 md:grid-cols-2">
          <li>Applies to L1-to-L1 scope; trade assets, secured assets, synths, and many arb flows are outside this first model.</li>
          <li>Dashboard values are current-only THORNode evidence and can change every block or epoch.</li>
          <li>Multi-affiliate attribution and floor selection differ: eligible thornames can receive TOR credit, but the applied floor comes from the largest affiliate-bps thorname.</li>
          <li>Discord sentiment is curated context, not canonical protocol proof.</li>
          <li>Current fee records do not by themselves prove revenue lift, route competitiveness, or partner attribution quality.</li>
        </ul>
      </Card>
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
