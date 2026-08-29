'use client';

import { useMemo, type ReactNode } from 'react';
import {
  Activity,
  Gauge,
  ListChecks,
  RadioTower,
  Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import { PageContainer } from '@/components/layout/PageContainer';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { useDynamicL1FeeStatus } from '@/lib/hooks/useMidgard';
import type {
  DynamicL1FeeStatus,
  LiveDataResult,
} from '@/lib/types';
import {
  currentByRecord,
  currentWithoutSealedRecords,
  enabledState,
  formatBps,
  formatConfigDeadband,
  formatConfigInteger,
  formatEnabledMimirValue,
  formatEpoch,
  formatTor,
  missingLiveValue,
  recordKey,
  dynamicFeeLiveViewState,
} from '@/lib/data/dynamic-fees-helpers';
import {
  LookFirstPanel,
  HistoricalResultsChart,
  BpsDistribution,
  ExperimentContextPanel,
  SourceStatusStrip,
} from '@/components/features/DynamicFeePanels';
import { DynamicFeeRecordsExplorer } from '@/components/features/DynamicFeeRecordsExplorer';
import { DynamicFeeSourceWarnings } from '@/components/features/DynamicFeePanels';

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
    label: 'ADR-026 record',
    href: '/governance#governance-adr-026-dynamic-l1-fees',
    badge: 'proposal',
    description: 'Open the dated governance record before treating live endpoint state as final protocol history.',
  },
];

const dynamicFeesToc: TocItem[] = [
  { id: 'dynamic-fees-live', label: 'Live tracker' },
  { id: 'dynamic-fee-current-controls', label: 'Current controls' },
  { id: 'dynamic-fee-controller-config', label: 'Controller config' },
  { id: 'dynamic-fee-historical-results', label: 'Historical results' },
  { id: 'dynamic-fee-records-explorer', label: 'Records explorer' },
  { id: 'dynamic-fee-orphan-accumulators', label: 'Orphan accumulators' },
  { id: 'dynamic-fee-bps-distribution', label: 'BPS distribution' },
  { id: 'dynamic-fee-context', label: 'Experiment context' },
];

interface DynamicFeesViewProps {
  children?: ReactNode;
  result?: LiveDataResult<DynamicL1FeeStatus>;
  status?: DynamicL1FeeStatus;
  isLoading?: boolean;
  isDegraded?: boolean;
  error?: string;
}

export function DynamicFeesView({
  children,
  result,
  status,
  isLoading = false,
  isDegraded = false,
  error,
}: DynamicFeesViewProps) {
  const currentEntries = useMemo(() => currentByRecord(status), [status]);
  const orphanCurrentEntries = useMemo(() => currentWithoutSealedRecords(status), [status]);
  const liveState = dynamicFeeLiveViewState(status, isLoading);
  const missingValue = missingLiveValue(liveState);
  const enabled = enabledState(status, liveState);
  const whitelistedCount = status?.mimir.whitelistedPartners.filter((partner) => partner.whitelisted).length;
  const trackedPairCount = new Set((status?.records ?? []).map((record) => recordKey(record.thorname, record.pair))).size;
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

      {children}

      <SourceStatusStrip
        result={result}
        status={status}
        isDegraded={isDegraded}
        error={error}
        sourceWarningCount={sourceWarningCount}
      />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      <div id="dynamic-fees-live" className="scroll-mt-24">
      <LookFirstPanel
        status={status}
        liveState={liveState}
        sourceWarningCount={sourceWarningCount}
        floorPinnedCount={floorPinnedCount}
        ceilingPinnedCount={ceilingPinnedCount}
      />
      </div>

      <RelatedChecks id="dynamic-fee-related-checks" checks={dynamicFeeRelatedChecks} className="mb-8" />

      <SectionHeader id="dynamic-fee-current-controls" level="primary">Current Controls</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        These are the control-surface values behind the tracker. The fallback floor is still the base L1 minimum; dynamic floors only apply to active whitelisted thorname and pair records.
      </p>
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<RadioTower className="h-4 w-4" />} label="Controller" value={enabled.value} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Fallback L1 floor" value={status ? formatBps(status.mimir.slipMinBps.value) : missingValue} />
        <StatCard icon={<ListChecks className="h-4 w-4" />} label="Whitelisted" value={whitelistedCount ?? missingValue} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Tracked thorname-pair records" value={status ? trackedPairCount : missingValue} />
        <StatCard icon={<Scale className="h-4 w-4" />} label="Current epoch" value={status?.currentEpoch ?? missingValue} />
      </div>

      <details id="dynamic-fee-controller-config" className="mb-10 rounded-md border border-border bg-surface-elevated p-4">
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

      <DynamicFeeRecordsExplorer
        status={status}
        isLoading={isLoading}
        currentEntries={currentEntries}
        floorBps={floorBps}
        ceilingBps={ceilingBps}
      />
      <div id="dynamic-fee-orphan-accumulators" className="scroll-mt-24" />
      {status && status.records.length > 0 && orphanCurrentEntries.length > 0 && (
        <Card className="mb-10">
          <h2 className="mb-2 text-sm font-semibold text-amber-300">Current accumulators without sealed records</h2>
          <p className="mb-3 text-sm text-slate-400">
            THORNode is exposing in-progress TOR volume or fees for these pairs before a matching sealed record is available in this snapshot.
          </p>
          <dl className="grid gap-3 text-xs md:grid-cols-2">
            {orphanCurrentEntries.map((entry) => (
              <div key={recordKey(entry.thorname, entry.pair)} className="rounded border border-border p-3">
                <dt className="font-mono text-accent">{entry.thorname}</dt>
                <dd className="mt-1 break-words text-slate-300">{entry.pair}</dd>
                <dd className="mt-2 text-slate-400">Epoch {formatEpoch(entry.epoch)} / fees {formatTor(entry.feesTorBaseUnits)} / volume {formatTor(entry.volumeTorBaseUnits)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      <div id="dynamic-fee-bps-distribution" className="mb-12 grid min-w-0 gap-4 lg:grid-cols-[0.9fr_1.1fr]">
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
                  <li><code>L1DynamicFeeEnabled</code>: {formatEnabledMimirValue(status?.mimir.enabled)}</li>
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
              {status && sourceWarningCount !== undefined && sourceWarningCount > 0 && (
                <DynamicFeeSourceWarnings status={status} />
              )}
              </div>
            </div>
          </details>
        </Card>
      </div>

      <ExperimentContextPanel status={status} liveState={liveState} sourceWarningCount={sourceWarningCount} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={dynamicFeesToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

export default function DynamicFeesPageClient({ children }: { children?: ReactNode }) {
  const { result, data: status, isLoading, isDegraded, error } = useDynamicL1FeeStatus();

  return (
    <DynamicFeesView
      result={result}
      status={status}
      isLoading={isLoading}
      isDegraded={isDegraded}
      error={error}
    >
      {children}
    </DynamicFeesView>
  );
}
