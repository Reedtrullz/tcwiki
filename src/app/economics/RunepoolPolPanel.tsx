'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useNetworkStatus, useRunePoolPolStatus } from '@/lib/hooks/useMidgard';
import { liveResultIsDegraded } from '@/lib/live-result';
import { summarizeSourceWarning } from '@/lib/source-warnings';
import type { LiveDataResult, NetworkStatus, RunePoolPolStatus } from '@/lib/types';

const RUNE_BASE_UNITS = BigInt(100000000);

type FactTone = 'success' | 'warning' | 'danger' | 'info';

interface RunePoolPolViewProps {
  result?: LiveDataResult<RunePoolPolStatus>;
  status?: RunePoolPolStatus;
  isLoading?: boolean;
  networkResult?: LiveDataResult<NetworkStatus>;
  networkStatus?: NetworkStatus;
  networkLoading?: boolean;
}

function badgeVariant(tone: FactTone) {
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

function factCardClass(tone: FactTone) {
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

function formatRune(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return 'Unavailable';
  }

  try {
    const raw = BigInt(value);
    const sign = raw < BigInt(0) ? '-' : '';
    const absolute = raw < BigInt(0) ? -raw : raw;
    const rounded = (absolute + RUNE_BASE_UNITS / BigInt(2)) / RUNE_BASE_UNITS;
    return `${sign}${rounded.toLocaleString('en-US')} RUNE`;
  } catch {
    return 'Unavailable';
  }
}

function parseRuneBaseUnits(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

function formatUnitValue(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return 'Unavailable';
  }

  try {
    return BigInt(value).toLocaleString('en-US');
  } catch {
    return 'Unavailable';
  }
}

function availabilityValue(value: boolean | null | undefined, isLoading: boolean | undefined) {
  if (isLoading && value === undefined) {
    return { value: 'Loading', tone: 'info' as const, detail: 'Network diagnostics are still loading RUNEPool controls.' };
  }
  if (value === true) {
    return { value: 'Control enabled', tone: 'success' as const, detail: '`RUNEPOOLENABLED` is active in the checked network snapshot; this is not deposit, withdrawal, wallet, or future-availability proof.' };
  }
  if (value === false) {
    return { value: 'Disabled', tone: 'danger' as const, detail: '`RUNEPOOLENABLED` is disabled in the checked network snapshot.' };
  }
  return { value: 'Unavailable', tone: 'warning' as const, detail: '`RUNEPOOLENABLED` was not available in the checked diagnostics.' };
}

function actionPauseValue(
  paused: boolean | null | undefined,
  enabled: boolean | null | undefined,
  label: string,
  key: string,
  isLoading: boolean | undefined
) {
  if (isLoading && paused === undefined) {
    return { value: 'Loading', tone: 'info' as const, detail: `Network diagnostics are still loading ${label}.` };
  }
  if (enabled === false) {
    return { value: 'Disabled', tone: 'danger' as const, detail: 'RUNEPool itself is disabled, so action availability is not open.' };
  }
  if (paused === true) {
    return { value: 'Paused', tone: 'danger' as const, detail: `\`${key}\` is active in the checked network snapshot.` };
  }
  if (paused === false) {
    return { value: 'No active halt', tone: 'success' as const, detail: `\`${key}\` is present and inactive in the checked network snapshot; this clears the tracked halt only.` };
  }
  return { value: 'Needs review', tone: 'warning' as const, detail: `No clean \`${key}\` state was available; do not treat this as open.` };
}

function sourceQuality(result: LiveDataResult<RunePoolPolStatus> | undefined, isLoading: boolean | undefined) {
  if (!result && isLoading) {
    return { value: 'Loading', tone: 'info' as const, detail: 'Waiting for the pinned THORNode RUNEPool snapshot.' };
  }
  if (!result?.data) {
    return { value: 'Unavailable', tone: 'danger' as const, detail: result?.error ?? 'No usable RUNEPool accounting snapshot was returned.' };
  }
  if (liveResultIsDegraded(result)) {
    return { value: 'Source warning', tone: 'warning' as const, detail: `${result.data.sourceWarnings.length || 1} warning-backed source condition needs review.` };
  }
  return { value: 'Current-only', tone: 'success' as const, detail: 'Height-pinned THORNode accounting loaded without parser warnings.' };
}

function polScope(status: RunePoolPolStatus | undefined, isLoading: boolean | undefined) {
  if (isLoading && !status) {
    return { value: 'Loading', tone: 'info' as const, detail: 'Waiting for `POL-<Asset>` Mimir keys.' };
  }
  if (!status) {
    return { value: 'Unavailable', tone: 'warning' as const, detail: 'POL-enabled pool scope was not loaded.' };
  }
  if (status.polPools.some((pool) => pool.state === 'unparseable')) {
    return { value: 'Needs review', tone: 'warning' as const, detail: 'One or more `POL-<Asset>` keys was unparseable.' };
  }
  if (status.activePolPoolCount === 0) {
    return { value: 'No active pools', tone: 'warning' as const, detail: 'No active `POL-<Asset>` key was visible in the checked Mimir snapshot.' };
  }
  return {
    value: `${status.activePolPoolCount} active`,
    tone: 'success' as const,
    detail: 'Active `POL-<Asset>` keys show the current POL pool scope, not pool safety or route quality.',
  };
}

function snapshotDetail(status: RunePoolPolStatus | undefined) {
  if (!status) {
    return 'Checked height unavailable';
  }
  const age = status.sourceFreshness.thorchainBlockAgeSeconds;
  return [
    `height ${status.sourceFreshness.thorchainHeight.toLocaleString('en-US')}`,
    status.sourceFreshness.snapshotPinned ? 'height-pinned' : 'not pinned',
    age === undefined ? undefined : `${age}s block age`,
  ].filter(Boolean).join(' / ');
}

function accountingRows(status: RunePoolPolStatus | undefined) {
  return [
    {
      label: 'POL current value',
      value: formatRune(status?.pol.valueRuneBaseUnits),
      detail: '`pol.value`, protocol-owned-liquidity bucket current value',
    },
    {
      label: 'POL PnL',
      value: formatRune(status?.pol.pnlRuneBaseUnits),
      detail: '`pol.pnl`, current POL bucket PnL; can be negative',
    },
    {
      label: 'Provider value',
      value: formatRune(status?.providers.valueRuneBaseUnits),
      detail: '`providers.value`, aggregate provider current value',
    },
    {
      label: 'Provider PnL',
      value: formatRune(status?.providers.pnlRuneBaseUnits),
      detail: '`providers.pnl`, checked accounting only, not APY or future yield',
    },
    {
      label: 'Reserve value',
      value: formatRune(status?.reserve.valueRuneBaseUnits),
      detail: '`reserve.value`, reserve-side current value',
    },
    {
      label: 'Provider pending RUNE',
      value: formatRune(status?.providers.pendingRuneBaseUnits),
      detail: '`providers.pending_rune`, pending provider RUNE, not available liquidity',
    },
  ];
}

function firstActivePolPools(status: RunePoolPolStatus | undefined) {
  return status?.polPools.filter((pool) => pool.state === 'active').slice(0, 12) ?? [];
}

function basisPointsFromParts(part: bigint | null, total: bigint | null) {
  if (part === null || total === null || total <= BigInt(0) || part < BigInt(0)) {
    return null;
  }

  return (part * BigInt(10000) + total / BigInt(2)) / total;
}

function formatPercentFromBasisPoints(basisPoints: bigint | null) {
  if (basisPoints === null) {
    return 'Unavailable';
  }

  const whole = basisPoints / BigInt(100);
  const fractional = (basisPoints % BigInt(100)).toString().padStart(2, '0');
  return `${whole.toLocaleString('en-US')}.${fractional}%`;
}

function svgUnitsFromBasisPoints(basisPoints: bigint | null) {
  if (basisPoints === null) {
    return '0';
  }

  const whole = basisPoints / BigInt(100);
  const fractional = (basisPoints % BigInt(100)).toString().padStart(2, '0');
  return `${whole}.${fractional}`;
}

function bucketCheck(
  label: string,
  first: bigint | null,
  second: bigint | null,
  total: bigint | null,
  detail: string
) {
  if (first === null || second === null || total === null) {
    return {
      label,
      value: 'Unavailable',
      tone: 'warning' as const,
      detail: `${detail} One or more fields were unavailable, so the relationship is not clean evidence.`,
    };
  }

  const combined = first + second;
  if (combined === total) {
    return {
      label,
      value: 'Balances',
      tone: 'success' as const,
      detail,
    };
  }

  const delta = total - combined;
  return {
    label,
    value: 'Needs review',
    tone: 'warning' as const,
    detail: `${detail} Difference versus POL total: ${formatRune(delta.toString())}. Treat this as a source-shape review signal, not a solvency claim.`,
  };
}

function bucketRelationship(status: RunePoolPolStatus | undefined) {
  const providerValue = parseRuneBaseUnits(status?.providers.valueRuneBaseUnits);
  const reserveValue = parseRuneBaseUnits(status?.reserve.valueRuneBaseUnits);
  const polValue = parseRuneBaseUnits(status?.pol.valueRuneBaseUnits);
  const providerPnl = parseRuneBaseUnits(status?.providers.pnlRuneBaseUnits);
  const reservePnl = parseRuneBaseUnits(status?.reserve.pnlRuneBaseUnits);
  const polPnl = parseRuneBaseUnits(status?.pol.pnlRuneBaseUnits);
  const providerBasisPoints = basisPointsFromParts(providerValue, polValue);
  const reserveBasisPoints = basisPointsFromParts(reserveValue, polValue);
  const providerShare = formatPercentFromBasisPoints(providerBasisPoints);
  const reserveShare = formatPercentFromBasisPoints(reserveBasisPoints);
  const splitFieldsAvailable = providerShare !== 'Unavailable' && reserveShare !== 'Unavailable';
  const splitBalances = providerValue !== null && reserveValue !== null && polValue !== null && providerValue + reserveValue === polValue;
  const splitAvailable = splitFieldsAvailable && splitBalances;

  return {
    checks: [
      bucketCheck(
        'Provider + reserve value',
        providerValue,
        reserveValue,
        polValue,
        '`providers.value + reserve.value` compared with `pol.value` from the same pinned RUNEPool snapshot.'
      ),
      bucketCheck(
        'Provider + reserve PnL',
        providerPnl,
        reservePnl,
        polPnl,
        '`providers.pnl + reserve.pnl` compared with `pol.pnl` from the same pinned RUNEPool snapshot.'
      ),
    ],
    split: {
      value: splitAvailable ? 'Split parsed' : splitFieldsAvailable ? 'Needs review' : 'Unavailable',
      tone: splitAvailable ? 'success' as const : 'warning' as const,
      providerShare,
      reserveShare,
      providerWidth: svgUnitsFromBasisPoints(providerBasisPoints),
      reserveWidth: svgUnitsFromBasisPoints(reserveBasisPoints),
      detail: splitAvailable
        ? 'Share of current `pol.value` represented by provider and reserve buckets.'
        : splitFieldsAvailable
          ? 'Value split parsed, but provider plus reserve value does not match `pol.value`; treat the split as review-only.'
        : 'Value split needs clean `providers.value`, `reserve.value`, and `pol.value` fields.',
    },
  };
}

function configFlagLabel(flag: RunePoolPolStatus['depositMaturityBlocks'] | undefined) {
  if (!flag || flag.state === 'absent') {
    return 'Unavailable';
  }
  if (flag.state === 'unparseable') {
    return 'Needs review';
  }
  return flag.value?.toLocaleString('en-US') ?? 'Unavailable';
}

function runePoolDepthLabel(flag: RunePoolPolStatus['minRunePoolDepth'] | undefined) {
  if (!flag || flag.state === 'absent') {
    return 'Unavailable';
  }
  if (flag.state === 'unparseable' || flag.value === null) {
    return 'Needs review';
  }
  return formatRune(String(flag.value));
}

function sourceWarningHeadline(status: RunePoolPolStatus | undefined) {
  const warningCount = status?.sourceWarnings.length ?? 0;
  if (!status || warningCount === 0) {
    return null;
  }

  const firstWarning = summarizeSourceWarning(status.sourceWarningDetails[0], status.sourceWarnings[0]);
  return {
    count: warningCount,
    firstWarning,
    label: `${warningCount} RUNEPool source warning${warningCount === 1 ? '' : 's'}`,
  };
}

function actionDecisionValue(value: string, action: 'deposit' | 'withdraw') {
  switch (value) {
    case 'No active halt':
      return `No tracked ${action} halt`;
    case 'Paused':
      return `${action === 'deposit' ? 'Deposits' : 'Withdrawals'} paused`;
    case 'Disabled':
      return 'RUNEPool disabled';
    case 'Loading':
      return 'Loading';
    case 'Needs review':
      return 'Needs review';
    default:
      return 'Unavailable';
  }
}

export function RunepoolPolView({
  result,
  status,
  isLoading,
  networkResult,
  networkStatus,
  networkLoading,
}: RunePoolPolViewProps) {
  const accounting = sourceQuality(result, isLoading);
  const enabled = availabilityValue(networkStatus?.runePoolEnabled, networkLoading);
  const deposits = actionPauseValue(networkStatus?.runePoolDepositPaused, networkStatus?.runePoolEnabled, 'RUNEPool deposits', 'RUNEPoolHaltDeposit', networkLoading);
  const withdrawals = actionPauseValue(networkStatus?.runePoolWithdrawPaused, networkStatus?.runePoolEnabled, 'RUNEPool withdrawals', 'RUNEPoolHaltWithdraw', networkLoading);
  const scope = polScope(status, isLoading);
  const facts = [
    { label: 'Accounting source', ...accounting },
    { label: 'RUNEPool', ...enabled },
    { label: 'Deposits', ...deposits },
    { label: 'Withdrawals', ...withdrawals },
    { label: 'POL pool scope', ...scope },
  ];
  const activePools = firstActivePolPools(status);
  const warningHeadline = sourceWarningHeadline(status);
  const relationship = bucketRelationship(status);
  const readFirst = [
    {
      label: 'Deposit halt check',
      value: actionDecisionValue(deposits.value, 'deposit'),
      tone: deposits.tone,
      detail: 'Checks RUNEPool enablement and deposit halt controls only; it is not wallet/interface support or future availability proof.',
    },
    {
      label: 'Withdraw halt check',
      value: actionDecisionValue(withdrawals.value, 'withdraw'),
      tone: withdrawals.tone,
      detail: 'Checks RUNEPool enablement and withdraw halt controls; maturity, reserve backstop, user position, wallet/interface, and checked block still matter.',
    },
    {
      label: 'Which value matters?',
      value: accounting.value === 'Current-only' ? 'Provider value/PnL' : accounting.value,
      tone: accounting.tone,
      detail: 'Use provider value and provider PnL for aggregate provider accounting; do not turn it into APY.',
    },
    {
      label: 'Which pools count?',
      value: scope.value,
      tone: scope.tone,
      detail: '`POL-<Asset>` keys describe current POL scope only, not pool safety or route quality.',
    },
    {
      label: 'What not to infer?',
      value: 'No yield proof',
      tone: 'info' as const,
      detail: 'This snapshot is not investment advice, route proof, wallet support, or future performance evidence.',
    },
  ];

  return (
    <section id="runepool-pol-live" className="mb-12 scroll-mt-24">
      <div className="mb-4 max-w-3xl">
        <SectionHeader className="mb-3">RUNEPool/POL Current Snapshot</SectionHeader>
        <p className="text-sm leading-relaxed text-slate-400">
          This panel pairs current THORNode RUNEPool accounting with network diagnostics. Use it to locate the checked value, PnL, enablement flag, and POL scope; do not use it as yield, safety, route-quality, or wallet-flow proof.
        </p>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Read this snapshot first</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {readFirst.map((item) => (
            <div key={item.label} className={`rounded-lg border bg-surface-elevated p-4 ${factCardClass(item.tone)}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
                <Badge variant={badgeVariant(item.tone)}>{item.value}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {facts.map((fact) => (
          <Card key={fact.label} padding="sm" className={factCardClass(fact.tone)}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{fact.label}</p>
              <Badge variant={badgeVariant(fact.tone)}>{fact.value}</Badge>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">{fact.detail}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Bucket Relationship</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Arithmetic checks are source-shape checks, not solvency or yield proof.
            </p>
          </div>
          <Badge variant={relationship.checks.every((check) => check.value === 'Balances') && relationship.split.value === 'Split parsed' ? 'success' : 'warning'}>
            {relationship.checks.every((check) => check.value === 'Balances') && relationship.split.value === 'Split parsed' ? 'Arithmetic matches' : 'Needs review'}
          </Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {relationship.checks.map((check) => (
              <div key={check.label} className={`rounded-md border bg-surface p-3 ${factCardClass(check.tone)}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{check.label}</p>
                  <Badge variant={badgeVariant(check.tone)}>{check.value}</Badge>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{check.detail}</p>
              </div>
            ))}
          </div>
          <div className={`rounded-md border bg-surface p-3 ${factCardClass(relationship.split.tone)}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Value split</p>
              <Badge variant={badgeVariant(relationship.split.tone)}>{relationship.split.value}</Badge>
            </div>
            <svg
              className="h-3 w-full overflow-hidden rounded-full border border-border bg-surface-elevated"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Provider share ${relationship.split.providerShare}, reserve share ${relationship.split.reserveShare}`}
            >
              <rect x="0" y="0" width={relationship.split.providerWidth} height="12" className="fill-accent" opacity="0.85" />
              <rect x={relationship.split.providerWidth} y="0" width={relationship.split.reserveWidth} height="12" className="fill-rune" opacity="0.85" />
            </svg>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Provider share</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-100">{relationship.split.providerShare}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Reserve share</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-100">{relationship.split.reserveShare}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{relationship.split.detail}</p>
          </div>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Accounting Buckets</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{snapshotDetail(status)}</p>
          </div>
          <Link href="/deep-dives/runepool-pol#accounting-checks" className="text-xs font-semibold text-accent underline-offset-4 hover:underline">
            Read the evidence guide
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accountingRows(status).map((row) => (
            <div key={row.label} className="rounded-md border border-border bg-surface p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{row.label}</p>
              <p className="mt-2 break-words text-lg font-semibold text-slate-100">{row.value}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{row.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h3 className="text-base font-semibold text-slate-100">POL-Enabled Pools</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Current `POL-&lt;Asset&gt;` Mimir keys show scope only. Pair this with pool depth and route quote checks before making route or safety claims.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activePools.length > 0 ? activePools.map((pool) => (
              <Badge key={pool.key} variant="success">{pool.asset}</Badge>
            )) : (
              <Badge variant="warning">{isLoading ? 'Loading pools' : 'No active POL keys'}</Badge>
            )}
            {status && status.activePolPoolCount > activePools.length && (
              <Badge variant="default">+{status.activePolPoolCount - activePools.length} more</Badge>
            )}
          </div>
          {status?.polPools.some((pool) => pool.state === 'unparseable') && (
            <p className="mt-3 text-xs leading-relaxed text-amber-300">
              Some POL Mimir keys need review before treating the pool-scope list as clean.
            </p>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-slate-100">Source Posture</h3>
          <div className="mt-3">
            <LiveSourceMeta result={result} />
          </div>
          {warningHeadline && (
            <div className="mt-3 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
              <p className="font-semibold">{warningHeadline.label} need review before treating accounting as clean.</p>
              <p className="mt-1 break-words text-amber-100/90">First warning: {warningHeadline.firstWarning}</p>
            </div>
          )}
          {networkResult && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Network diagnostics</p>
              <LiveSourceMeta result={networkResult} />
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="text-base font-semibold text-slate-100">Availability Caveats</h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          These Mimir values can affect whether a provider can act even when accounting data loads. They are caveats, not proof that a wallet flow is supported.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="font-mono text-xs text-slate-300">RUNEPoolDepositMaturityBlocks</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-100">{configFlagLabel(status?.depositMaturityBlocks)}</dd>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Deposit maturity can affect when withdrawals become eligible.</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="font-mono text-xs text-slate-300">RUNEPoolMaxReserveBackstop</dt>
            <dd className="mt-2 text-sm font-semibold text-slate-100">{configFlagLabel(status?.maxReserveBackstop)}</dd>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Reserve backstop constraints can affect withdrawal availability.</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <dt className="text-xs font-semibold text-slate-300">Minimum RUNEPool depth</dt>
            <p className="mt-1 font-mono text-[11px] text-slate-500">MINRUNEPOOLDEPTH</p>
            <dd className="mt-2 text-sm font-semibold text-slate-100">{runePoolDepthLabel(status?.minRunePoolDepth)}</dd>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">Current Mimir minimum-depth signal; it is not the current RUNEPool balance or proof that a wallet action is available.</p>
          </div>
        </dl>
      </Card>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <details className="rounded-lg border border-border bg-surface-elevated p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">Show exact RUNEPool fields used</summary>
          <dl className="mt-3 grid gap-2 text-xs leading-relaxed text-slate-400 sm:grid-cols-2">
            {[
              ['pol.rune_deposited', formatRune(status?.pol.runeDepositedBaseUnits)],
              ['pol.rune_withdrawn', formatRune(status?.pol.runeWithdrawnBaseUnits)],
              ['pol.value', formatRune(status?.pol.valueRuneBaseUnits)],
              ['pol.pnl', formatRune(status?.pol.pnlRuneBaseUnits)],
              ['pol.current_deposit', formatRune(status?.pol.currentDepositRuneBaseUnits)],
              ['providers.units', formatUnitValue(status?.providers.units)],
              ['providers.pending_units', formatUnitValue(status?.providers.pendingUnits)],
              ['providers.pending_rune', formatRune(status?.providers.pendingRuneBaseUnits)],
              ['providers.value', formatRune(status?.providers.valueRuneBaseUnits)],
              ['providers.pnl', formatRune(status?.providers.pnlRuneBaseUnits)],
              ['reserve.units', formatUnitValue(status?.reserve.units)],
              ['reserve.value', formatRune(status?.reserve.valueRuneBaseUnits)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="break-words font-mono text-slate-300">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </details>

        <details className="rounded-lg border border-border bg-surface-elevated p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-200">
            Show source warnings and non-claims{status?.sourceWarnings.length ? ` (${status.sourceWarnings.length})` : ''}
          </summary>
          <div className="mt-3 space-y-3 text-xs leading-relaxed text-slate-400">
            {status?.sourceWarnings.length ? (
              <ul className="space-y-1">
                {status.sourceWarnings.map((warning) => (
                  <li key={warning} className="break-words text-amber-300">{warning}</li>
                ))}
              </ul>
            ) : (
              <p>No RUNEPool parser warnings in the current loaded snapshot.</p>
            )}
            <p>
              This panel does not prove future yield, investment suitability, route competitiveness, user-specific provider balances, or that a wallet can deposit or withdraw after this checked block.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}

export function RunepoolPolPanel() {
  const {
    result,
    data,
    isLoading,
  } = useRunePoolPolStatus();
  const {
    result: networkResult,
    data: networkStatus,
    isLoading: networkLoading,
  } = useNetworkStatus();

  return (
    <RunepoolPolView
      result={result}
      status={data}
      isLoading={isLoading}
      networkResult={networkResult}
      networkStatus={networkStatus}
      networkLoading={networkLoading}
    />
  );
}
