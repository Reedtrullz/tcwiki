'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useNetworkStatus } from '@/lib/hooks/useMidgard';
import { liveResultIsDegraded } from '@/lib/live-result';
import { summarizeSourceWarning } from '@/lib/source-warnings';
import { getOperationalControlCatalogEntry } from '@/lib/operational-controls';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';

type ControlTone = 'success' | 'warning' | 'danger' | 'info';

interface TcyControlsViewProps {
  result?: LiveDataResult<NetworkStatus>;
  status?: NetworkStatus;
  isLoading?: boolean;
}

interface TcyControlDefinition {
  label: string;
  keyName: string;
  accessor: (status: NetworkStatus) => boolean | null | undefined;
  activeLabel: string;
  inactiveLabel: string;
  unavailableDetail: string;
  detail: string;
}

interface TcyControlViewModel {
  label: string;
  keyName: string;
  value: string;
  tone: ControlTone;
  detail: string;
  rawValue: boolean | null | undefined;
}

type TcyControlInput = Omit<TcyControlDefinition, 'label' | 'detail'>;

const TCY_CONTROL_INPUTS: TcyControlInput[] = [
  {
    keyName: 'TCYCLAIMINGHALT',
    accessor: (status) => status.tcyClaimingPaused,
    activeLabel: 'Paused',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean claiming-halt value was available in the checked diagnostics.',
  },
  {
    keyName: 'TCYCLAIMINGSWAPHALT',
    accessor: (status) => status.tcyClaimingSwapPaused,
    activeLabel: 'Paused',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean claim-swap halt value was available in the checked diagnostics.',
  },
  {
    keyName: 'TCYSTAKINGHALT',
    accessor: (status) => status.tcyStakingPaused,
    activeLabel: 'Paused',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean staking-halt value was available in the checked diagnostics.',
  },
  {
    keyName: 'TCYSTAKEDISTRIBUTIONHALT',
    accessor: (status) => status.tcyStakeDistributionPaused,
    activeLabel: 'Paused',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean distribution-halt value was available in the checked diagnostics.',
  },
  {
    keyName: 'TCYUNSTAKINGHALT',
    accessor: (status) => status.tcyUnstakingPaused,
    activeLabel: 'Paused',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean unstaking-halt value was available in the checked diagnostics.',
  },
  {
    keyName: 'HALTTCYTRADING',
    accessor: (status) => status.tcyTradingPaused,
    activeLabel: 'Halted',
    inactiveLabel: 'No active halt',
    unavailableDetail: 'No clean TCY trading halt value was available in the checked diagnostics.',
  },
];

const TCY_CLAIM_KEYS = new Set(['TCYCLAIMINGHALT', 'TCYCLAIMINGSWAPHALT']);
const TCY_STAKING_KEYS = new Set(['TCYSTAKINGHALT', 'TCYSTAKEDISTRIBUTIONHALT', 'TCYUNSTAKINGHALT']);
const TCY_TRADING_KEYS = new Set(['HALTTCYTRADING']);

export const TCY_CONTROL_DEFINITIONS: TcyControlDefinition[] = TCY_CONTROL_INPUTS.map((control) => {
  const catalogEntry = getOperationalControlCatalogEntry(control.keyName);
  if (catalogEntry.area !== 'TCY') {
    throw new Error(`Expected ${control.keyName} to be a TCY operational control, got ${catalogEntry.area}.`);
  }

  return {
    ...control,
    label: catalogEntry.label,
    detail: catalogEntry.description,
  };
});

function badgeVariant(tone: ControlTone) {
  switch (tone) {
    case 'success':
      return 'success';
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
  }
}

function cardClass(tone: ControlTone) {
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

function controlValue(definition: TcyControlDefinition, status: NetworkStatus | undefined, isLoading: boolean | undefined): TcyControlViewModel {
  if (!status && isLoading) {
    return {
      label: definition.label,
      keyName: definition.keyName,
      value: 'Loading',
      tone: 'info',
      detail: `Waiting for ${definition.keyName}.`,
      rawValue: undefined,
    };
  }

  if (!status) {
    return {
      label: definition.label,
      keyName: definition.keyName,
      value: 'Unavailable',
      tone: 'danger',
      detail: 'Network diagnostics did not load a usable TCY control snapshot.',
      rawValue: undefined,
    };
  }

  const value = definition.accessor(status);
  if (value === true) {
    return {
      label: definition.label,
      keyName: definition.keyName,
      value: definition.activeLabel,
      tone: 'danger',
      detail: `${definition.keyName} is active in the checked network snapshot. ${definition.detail}`,
      rawValue: value,
    };
  }

  if (value === false) {
    return {
      label: definition.label,
      keyName: definition.keyName,
      value: definition.inactiveLabel,
      tone: 'success',
      detail: `${definition.keyName} is present and inactive in the checked network snapshot. ${definition.detail}`,
      rawValue: value,
    };
  }

  return {
    label: definition.label,
    keyName: definition.keyName,
    value: 'Needs review',
    tone: 'warning',
    detail: `${definition.unavailableDetail} ${definition.detail} Do not treat this as open.`,
    rawValue: value,
  };
}

function sourceQuality(result: LiveDataResult<NetworkStatus> | undefined, isLoading: boolean | undefined) {
  if (!result && isLoading) {
    return { value: 'Loading', tone: 'info' as const, detail: 'Waiting for current THORNode network diagnostics.' };
  }
  if (!result?.data) {
    return { value: 'Unavailable', tone: 'danger' as const, detail: result?.error ?? 'No usable THORNode network-status snapshot was returned.' };
  }
  if (liveResultIsDegraded(result)) {
    return { value: 'Source warning', tone: 'warning' as const, detail: `${result.data.sourceWarnings.length || 1} warning-backed source condition needs review.` };
  }
  return { value: 'Current-only', tone: 'success' as const, detail: 'Height-pinned THORNode diagnostics loaded without source warnings.' };
}

function overallPosture(controls: TcyControlViewModel[], status: NetworkStatus | undefined, isLoading: boolean | undefined) {
  if (!status && isLoading) {
    return { value: 'Loading', tone: 'info' as const, detail: 'Waiting for TCY controls.' };
  }
  if (!status) {
    return { value: 'Unavailable', tone: 'danger' as const, detail: 'Do not make current TCY availability claims until diagnostics load.' };
  }
  const active = controls.filter((control) => control.rawValue === true);
  if (active.length > 0) {
    return {
      value: `${active.length} halted`,
      tone: 'danger' as const,
      detail: `${active.map((control) => control.label).join(', ')} ${active.length === 1 ? 'needs' : 'need'} current review before saying TCY actions are available.`,
    };
  }
  const unknown = controls.filter((control) => control.rawValue !== false);
  if (unknown.length > 0) {
    return {
      value: 'Needs review',
      tone: 'warning' as const,
      detail: `${unknown.length} TCY control ${unknown.length === 1 ? 'value is' : 'values are'} absent or unclear in the checked diagnostics.`,
    };
  }
  return {
    value: 'No tracked TCY halt',
    tone: 'success' as const,
    detail: 'All tracked TCY halt controls were present and inactive at the checked block; this clears halt controls only.',
  };
}

function snapshotDetail(status: NetworkStatus | undefined) {
  if (!status?.thorchainHeight) {
    return 'Checked height unavailable';
  }
  const age = status.thorchainBlockAgeSeconds;
  return [
    `height ${status.thorchainHeight.toLocaleString('en-US')}`,
    status.thorchainSnapshotPinned ? 'height-pinned' : 'not pinned',
    age === undefined ? undefined : `${age}s block age`,
  ].filter(Boolean).join(' / ');
}

function sourceWarningHeadline(status: NetworkStatus | undefined) {
  const warningCount = status?.sourceWarnings.length ?? 0;
  if (!status || warningCount === 0) {
    return null;
  }

  const firstWarning = summarizeSourceWarning(status.sourceWarningDetails?.[0], status.sourceWarnings[0]);
  return {
    count: warningCount,
    firstWarning,
    label: `${warningCount} TCY source warning${warningCount === 1 ? '' : 's'}`,
  };
}

function groupedControlValue(
  controls: TcyControlViewModel[],
  clearValue: string,
  blockedValue: string
) {
  if (controls.some((control) => control.value === 'Loading')) {
    return { value: 'Loading', tone: 'info' as const };
  }
  if (controls.some((control) => control.value === 'Unavailable')) {
    return { value: 'Unavailable', tone: 'danger' as const };
  }
  if (controls.some((control) => control.rawValue === true)) {
    return { value: blockedValue, tone: 'danger' as const };
  }
  if (controls.some((control) => control.rawValue !== false)) {
    return { value: 'Needs review', tone: 'warning' as const };
  }
  return { value: clearValue, tone: 'success' as const };
}

export function TcyControlsView({ result, status, isLoading }: TcyControlsViewProps) {
  const controls = TCY_CONTROL_DEFINITIONS.map((control) => controlValue(control, status, isLoading));
  const posture = overallPosture(controls, status, isLoading);
  const quality = sourceQuality(result, isLoading);
  const warningHeadline = sourceWarningHeadline(status);
  const facts = [
    { label: 'Tracked TCY halt controls', ...posture },
    { label: 'Data quality', ...quality },
  ];
  const claimDecision = groupedControlValue(
    controls.filter((control) => TCY_CLAIM_KEYS.has(control.keyName)),
    'No tracked claim halt',
    'Claim path halted'
  );
  const stakingDecision = groupedControlValue(
    controls.filter((control) => TCY_STAKING_KEYS.has(control.keyName)),
    'No tracked staking halt',
    'Staking path halted'
  );
  const tradingDecision = groupedControlValue(
    controls.filter((control) => TCY_TRADING_KEYS.has(control.keyName)),
    'No tracked trading halt',
    'Trading halted'
  );
  const readFirst = [
    {
      label: 'Claim halt check',
      ...claimDecision,
      detail: 'Checks direct claim and claim-swap halts. Interface status and address eligibility still need separate proof.',
    },
    {
      label: 'Staking halt check',
      ...stakingDecision,
      detail: 'Checks staking, unstaking, and distribution halts. It does not prove yield, timing, or wallet support.',
    },
    {
      label: 'Trading halt check',
      ...tradingDecision,
      detail: 'Checks the TCY trading halt only. A route, pool, quote, and interface path still need current evidence.',
    },
    {
      label: 'Source quality',
      value: quality.value,
      tone: quality.tone,
      detail: 'Source warnings degrade the snapshot even when a direct TCY blocker is visible.',
    },
    {
      label: 'Non-claim',
      value: 'No recovery proof',
      tone: 'info' as const,
      detail: 'These controls do not prove par recovery, market value, user eligibility, or an official interface being live.',
    },
  ];

  return (
    <section id="tcy-current-controls" className="mb-12 scroll-mt-24">
      <div className="mb-4 max-w-3xl">
        <SectionHeader className="mb-3">Current TCY Controls</SectionHeader>
        <p className="text-sm leading-relaxed text-slate-400">
          This panel pulls TCY-specific halt controls from the same current-only THORNode diagnostics used by the Network page. Use it as a halt-control check before saying claiming, staking, unstaking, distributions, claim swaps, or TCY trading are available.
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Read these controls first</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {readFirst.map((item) => (
            <div key={item.label} className={`rounded-lg border bg-surface-elevated p-4 ${cardClass(item.tone)}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                <Badge variant={badgeVariant(item.tone)}>{item.value}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {facts.map((fact) => (
          <Card key={fact.label} padding="sm" className={cardClass(fact.tone)}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fact.label}</p>
              <Badge variant={badgeVariant(fact.tone)}>{fact.value}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{fact.detail}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {controls.map((control) => (
          <Card key={control.keyName} padding="sm" className={cardClass(control.tone)}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-100">{control.label}</h3>
              <Badge variant={badgeVariant(control.tone)}>{control.value}</Badge>
            </div>
            <p className="font-mono text-[11px] text-slate-500">{control.keyName}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{control.detail}</p>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h3 className="text-base font-semibold text-slate-100">Source Posture</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{snapshotDetail(status)}</p>
          <div className="mt-3">
            <LiveSourceMeta result={result} />
          </div>
          {warningHeadline && (
            <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              <p className="font-semibold">{warningHeadline.label} need review before treating TCY controls as clean.</p>
              <p className="mt-1 break-words text-amber-100/90">First warning: {warningHeadline.firstWarning}</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-100">What This Does Not Prove</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            A clean halt-control snapshot does not prove an official claim interface is live, that a wallet supports the flow, that a user is eligible, or that recovery value is guaranteed.
          </p>
          <Link href="/network#network-diagnostics" className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
            Open full Network diagnostics
          </Link>
        </Card>
      </div>

      <details className="mt-4 rounded-lg border border-border bg-surface-elevated p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">
          Show exact TCY keys and source warnings{status?.sourceWarnings.length ? ` (${status.sourceWarnings.length})` : ''}
        </summary>
        <div className="mt-3 grid gap-3 text-xs leading-relaxed text-slate-400 lg:grid-cols-2">
          <div>
            <p className="mb-2 font-semibold uppercase tracking-wider text-slate-500">Tracked keys</p>
            <ul className="space-y-1">
              {TCY_CONTROL_DEFINITIONS.map((control) => (
                <li key={control.keyName} className="break-words font-mono text-slate-300">{control.keyName}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold uppercase tracking-wider text-slate-500">Source warnings</p>
            {status?.sourceWarnings.length ? (
              <ul className="space-y-1">
                {status.sourceWarnings.map((warning) => (
                  <li key={warning} className="break-words text-amber-300">{warning}</li>
                ))}
              </ul>
            ) : (
              <p>No source warnings in the loaded network snapshot.</p>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}

export function TcyControlsPanel() {
  const { result, data, isLoading } = useNetworkStatus();

  return <TcyControlsView result={result} status={data} isLoading={isLoading} />;
}
