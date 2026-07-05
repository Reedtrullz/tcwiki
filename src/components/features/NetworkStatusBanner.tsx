import Link from 'next/link';
import { AlertTriangle, CheckCircle2, RadioTower } from 'lucide-react';
import {
  ChainOperationalStatus,
  LiveDataResult,
  NetworkStatus,
  NetworkStatusSourceWarning,
  OperationalControlStatus,
} from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

type NetworkStatusBannerVariant = 'compact' | 'diagnostic';

const MAX_DISCLOSURE_KEYS = 80;

interface NetworkStatusBannerProps {
  result?: LiveDataResult<NetworkStatus>;
  isLoading?: boolean;
  variant?: NetworkStatusBannerVariant;
}

interface EvidenceRow {
  id: string;
  scope: string;
  impact: string;
  source: string;
  key: string;
  state: 'active' | 'scheduled' | 'warning-only';
}

interface ChainPresentation {
  chain: ChainOperationalStatus;
  labels: string[];
  statusText: string;
  directEvidenceCount: number;
  inheritedEvidenceCount: number;
  warningCount: number;
  scheduledCount: number;
  rank: number;
  cardClassName: string;
  iconClassName: string;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function formatKeyCount(count: number) {
  return `${count} ${count === 1 ? 'key' : 'keys'}`;
}

function formatEvidenceCount(count: number) {
  return `${count} evidence ${count === 1 ? 'item' : 'items'}`;
}

function formatWarningCount(count: number) {
  return `${count} source ${count === 1 ? 'warning' : 'warnings'}`;
}

function formatBlockAge(seconds: number): string {
  if (seconds < 0) {
    return `${formatBlockAge(Math.abs(seconds))} in future`;
  }
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min`;
  }
  const hours = Math.round(seconds / 3600);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

function isExactMimirKey(key: string) {
  return !key.includes('*');
}

function isEnablementControlKey(key: string) {
  return key === 'TRADEACCOUNTSENABLED' ||
    key === 'TRADEACCOUNTSDEPOSITENABLED' ||
    key === 'RUNEPOOLENABLED' ||
    key === 'BANKSENDENABLED';
}

function getControlStateLabel(key: string, state: string) {
  if (!isEnablementControlKey(key)) {
    if (state === 'active') {
      const upperKey = key.toUpperCase();
      if (upperKey.includes('DISABLED')) {
        return 'disabled';
      }
      if (upperKey.includes('PAUSE')) {
        return 'paused';
      }
      if (upperKey.includes('HALT')) {
        return 'halted';
      }
    }

    return state;
  }

  if (state === 'inactive') {
    return 'enabled';
  }

  if (state === 'disabled') {
    return 'disabled';
  }

  return state;
}

function getControlClassName(state: string, active: boolean) {
  if (active) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }
  if (state === 'unparseable') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  if (state === 'scheduled') {
    return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
  }
  if (state === 'not-monitored') {
    return 'border-slate-700 bg-slate-900 text-slate-400';
  }
  return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300';
}

function getControlGroup(control: OperationalControlStatus) {
  const key = control.key.toUpperCase();
  if (key.includes('TCY') || key.includes('RUNEPOOL')) {
    return 'TCY and RUNEPool';
  }
  if (key.includes('SECURED')) {
    return 'Secured assets';
  }
  if (key.includes('WASM')) {
    return 'WASM/app layer';
  }
  if (key.includes('BOND') || key.includes('CHURN') || key.includes('OPERATOR') || key.includes('ORACLE')) {
    return 'Node operations';
  }
  if (key.includes('LP') || key.includes('LOAN') || key.includes('ASYM')) {
    return 'Liquidity';
  }
  if (key.includes('TRADE') || key.includes('BANKSEND') || key.includes('MEMOLESS') || key.includes('SWAP')) {
    return 'Trading and transfers';
  }
  return 'Signing and chain observation';
}

function getDashScopedChain(key: string, prefix: string) {
  const upperKey = key.toUpperCase();
  const upperPrefix = prefix.toUpperCase();
  return upperKey.startsWith(upperPrefix) ? upperKey.slice(upperPrefix.length).split('-')[0] : null;
}

function getEvidenceScope(key: string) {
  return getDashScopedChain(key, 'PAUSELPDEPOSIT-') ??
    getDashScopedChain(key, 'PAUSEASYMWITHDRAWAL-') ??
    getDashScopedChain(key, 'HALTSECUREDDEPOSIT-') ??
    getDashScopedChain(key, 'HALTSECUREDWITHDRAW-') ??
    (key.toUpperCase().startsWith('HALTWASM') ? 'WASM/app layer' : 'Network');
}

function getEvidenceImpact(key: string) {
  const upperKey = key.toUpperCase();
  if (upperKey.startsWith('PAUSELPDEPOSIT-')) {
    return 'LP deposit pause';
  }
  if (upperKey.startsWith('PAUSEASYMWITHDRAWAL-')) {
    return 'Asym withdrawal pause';
  }
  if (upperKey.startsWith('HALTSECUREDDEPOSIT-')) {
    return 'Secured deposit halt';
  }
  if (upperKey.startsWith('HALTSECUREDWITHDRAW-')) {
    return 'Secured withdrawal halt';
  }
  if (upperKey.startsWith('HALTWASMDEPLOYER-')) {
    return 'WASM deployer halt';
  }
  if (upperKey.startsWith('HALTWASMCS-')) {
    return 'WASM checksum halt';
  }
  if (upperKey.startsWith('HALTWASMCONTRACT-')) {
    return 'WASM contract halt';
  }
  if (upperKey === 'NODEPAUSECHAINGLOBAL') {
    return 'Node chain pause';
  }
  return 'Monitored control flag';
}

function getInboundEvidenceImpact(field: string) {
  switch (field) {
    case 'halted':
      return 'Inbound halted flag';
    case 'global_trading_paused':
      return 'Inbound global trading pause';
    case 'chain_trading_paused':
      return 'Inbound chain trading pause';
    case 'chain_lp_actions_paused':
      return 'Inbound LP action pause';
    default:
      return 'Inbound operation flag';
  }
}

function parseWarningKeys(message: string) {
  const [, rawKeys] = message.split(':');
  if (!rawKeys) {
    return [];
  }
  return rawKeys
    .replace(/\.$/, '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function fallbackWarningDetail(message: string): NetworkStatusSourceWarning {
  const category = message.includes('Unknown operation-like')
    ? 'unknown-operation'
    : message.includes('Known operational-support')
      ? 'mimir-support'
      : message.includes('Unknown chain-scoped')
        ? 'unknown-chain'
        : message.includes('could not be parsed')
          ? 'mimir-parse'
          : message.includes('latest block timestamp')
            ? 'freshness'
            : message.includes('omitted') || message.includes('missing') || message.includes('did not include')
              ? 'source-shape'
              : 'other';
  const keys = category === 'unknown-operation' || category === 'unknown-chain' || category === 'mimir-support'
    ? parseWarningKeys(message)
    : [];

  return {
    severity: category === 'unknown-operation' || category === 'unknown-chain' || category === 'mimir-support' ? 'review' : 'warning',
    category,
    message,
    action: 'Review this source warning before treating the live status as clean.',
    ...(keys.length > 0 ? { keys } : {}),
  };
}

function getWarningDetails(status: NetworkStatus | undefined) {
  if (!status) {
    return [];
  }
  return status.sourceWarningDetails?.length
    ? status.sourceWarningDetails
    : status.sourceWarnings.map(fallbackWarningDetail);
}

function getWarningTitle(detail: NetworkStatusSourceWarning) {
  if ((detail.category === 'unknown-operation' || detail.category === 'unknown-chain') && detail.keys?.length) {
    return `${detail.keys.length} ${detail.category === 'unknown-operation' ? 'operation-like' : 'chain-scoped'} Mimir ${detail.keys.length === 1 ? 'key needs' : 'keys need'} review.`;
  }
  if (detail.category === 'mimir-support' && detail.keys?.length) {
    return `${detail.keys.length} operational-support Mimir ${detail.keys.length === 1 ? 'key is' : 'keys are'} present.`;
  }
  if (detail.category === 'mimir-parse' && detail.keys?.length) {
    return `${formatKeyCount(detail.keys.length)} monitored Mimir ${detail.keys.length === 1 ? 'key was' : 'keys were'} unparseable.`;
  }
  return detail.message;
}

function getWarningTone(detail: NetworkStatusSourceWarning) {
  if (detail.severity === 'review') {
    return 'border-slate-700 bg-slate-900/70 text-slate-300';
  }
  if (detail.severity === 'critical') {
    return 'border-red-500/25 bg-red-500/10 text-red-200';
  }
  return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
}

function hasKeyLikeWarning(detail: NetworkStatusSourceWarning) {
  return detail.category === 'unknown-operation' ||
    detail.category === 'unknown-chain' ||
    detail.category === 'mimir-support' ||
    detail.category === 'mimir-parse';
}

function getDisclosureKeys(keys: string[] | undefined) {
  const allKeys = keys ?? [];
  const visibleKeys = allKeys.slice(0, MAX_DISCLOSURE_KEYS);
  return {
    visibleKeys,
    hiddenCount: Math.max(0, allKeys.length - visibleKeys.length),
  };
}

function getInheritedLabel(key: string) {
  const upperKey = key.toUpperCase();
  if (upperKey === 'HALTTRADING') {
    return 'Global trading control';
  }
  if (upperKey === 'HALTSIGNING') {
    return 'Global signing control';
  }
  if (upperKey === 'PAUSELP') {
    return 'Global LP control';
  }
  if (upperKey === 'HALTCHAINGLOBAL' || upperKey === 'NODEPAUSECHAINGLOBAL') {
    return 'Global chain control';
  }
  return 'Global control';
}

function chainHasActiveKey(chain: ChainOperationalStatus, pattern: RegExp) {
  return chain.activeMimirKeys.some((key) => pattern.test(key.toUpperCase()));
}

function getChainPresentation(chain: ChainOperationalStatus): ChainPresentation {
  const inheritedMimirKeys = chain.inheritedMimirKeys ?? [];
  const directEvidenceKeys = uniqueStrings([
    ...chain.activeMimirKeys,
    ...chain.lpDepositPauseKeys,
    ...(chain.securedAssetDepositPauseKeys ?? []),
    ...(chain.securedAssetWithdrawPauseKeys ?? []),
    ...(chain.asymWithdrawalPauseKeys ?? []),
  ]);
  const inboundFields = chain.inboundAddressEvidenceFields ?? [];
  const unparseableKeys = chain.unparseableMimirKeys ?? [];
  const chainSourceWarnings = chain.sourceWarnings ?? [];
  const scheduledKeys = chain.scheduledMimirKeys ?? [];
  const directLabels = [
    chain.halted && (chainHasActiveKey(chain, /(?:CHAIN|SOLVENCY)/) || inboundFields.includes('halted')) ? 'Chain halted' : null,
    chain.tradingPaused && (chainHasActiveKey(chain, /TRADING/) || inboundFields.includes('global_trading_paused') || inboundFields.includes('chain_trading_paused')) ? 'Trading halted' : null,
    chain.signingPaused && chainHasActiveKey(chain, /SIGNING/) ? 'Signing paused' : null,
    chain.lpActionsPaused && (chainHasActiveKey(chain, /^PAUSELP[A-Z0-9]+$/) || inboundFields.includes('chain_lp_actions_paused')) ? 'LP actions paused' : null,
    chain.lpDepositPaused ? 'LP deposits paused' : null,
    chain.securedAssetDepositPaused ? 'Secured deposits paused' : null,
    chain.securedAssetWithdrawPaused ? 'Secured withdrawals paused' : null,
    chain.asymWithdrawalPaused ? 'Asym withdrawals paused' : null,
  ].filter((label): label is string => label !== null);
  const inheritedLabels = uniqueStrings(inheritedMimirKeys.map(getInheritedLabel));
  const labels = [
    ...directLabels,
    ...(directLabels.length === 0 ? inheritedLabels : []),
    ...(scheduledKeys.length > 0 ? ['Scheduled control'] : []),
    ...(unparseableKeys.length > 0 ? ['Mimir warning'] : []),
    ...(chainSourceWarnings.length > 0 ? ['Source warning'] : []),
  ];
  const warningCount = unparseableKeys.length + chainSourceWarnings.length;
  const directEvidenceCount = directEvidenceKeys.length + inboundFields.length;
  const inheritedEvidenceCount = inheritedMimirKeys.length;
  const hasDirectRisk = directLabels.length > 0 || warningCount > 0;
  const hasScheduled = scheduledKeys.length > 0;
  const inheritedOnly = directLabels.length === 0 && inheritedMimirKeys.length > 0;

  return {
    chain,
    labels,
    statusText: labels.length > 0 ? labels.join(' / ') : 'Open',
    directEvidenceCount,
    inheritedEvidenceCount,
    warningCount,
    scheduledCount: scheduledKeys.length,
    rank: hasDirectRisk ? 0 : hasScheduled ? 1 : inheritedOnly ? 2 : 3,
    cardClassName: hasDirectRisk
      ? 'border-amber-500/25 bg-amber-500/5'
      : hasScheduled
        ? 'border-sky-500/25 bg-sky-500/5'
        : inheritedOnly
          ? 'border-slate-700 bg-slate-900/50'
          : 'border-border bg-surface/70',
    iconClassName: hasDirectRisk
      ? 'text-amber-400'
      : hasScheduled
        ? 'text-sky-400'
        : inheritedOnly
          ? 'text-slate-500'
          : 'text-emerald-400',
  };
}

function getActionSummary(status: NetworkStatus | undefined, chainPresentations: ChainPresentation[]) {
  if (!status) {
    return [];
  }
  const activeControls = status.monitoredControls
    .filter((control) => control.active)
    .map((control) => `${control.label}: ${getControlStateLabel(control.key, control.state)}`);
  const directChainActions = chainPresentations
    .filter((chain) => chain.rank === 0)
    .flatMap((chain) => chain.labels.filter((label) => !label.includes('warning')));
  return uniqueStrings([...activeControls, ...directChainActions]);
}

function renderControlChip(control: OperationalControlStatus) {
  return (
    <span
      key={control.key}
      title={control.description}
      className={`rounded border px-2 py-1 text-[11px] ${getControlClassName(control.state, control.active)}`}
    >
      {control.label}: {getControlStateLabel(control.key, control.state)}
    </span>
  );
}

function chunkControlsByGroup(controls: OperationalControlStatus[]) {
  const groups = new Map<string, OperationalControlStatus[]>();
  for (const control of controls) {
    const group = getControlGroup(control);
    groups.set(group, [...(groups.get(group) ?? []), control]);
  }
  return [...groups.entries()];
}

export function NetworkStatusBanner({ result, isLoading = false, variant = 'diagnostic' }: NetworkStatusBannerProps) {
  const status = result?.data;
  const isPaused = status?.state === 'paused';
  const isDegraded = result?.status === 'degraded' || status?.state === 'degraded';
  const isUnknown = status?.state === 'unknown';
  const isUnavailable = (!result || !status) && !isLoading;
  const hasInvalidMimirKeys = Boolean(status && status.invalidMimirKeys.length > 0);
  const warningDetails = getWarningDetails(status);
  const hasSourceWarnings = Boolean(status && (hasInvalidMimirKeys || status.sourceWarnings.length > 0 || warningDetails.length > 0));
  const scheduledMimirKeys = status?.scheduledMimirKeys ?? [];
  const hasScheduledMimirKeys = scheduledMimirKeys.length > 0;
  const scheduledControls = status?.monitoredControls.filter((control) => control.state === 'scheduled') ?? [];
  const hasTrustWarning = isPaused || isDegraded || isUnknown || isUnavailable || hasSourceWarnings || hasScheduledMimirKeys;
  const activeControlKeys = status?.activeControlKeys ?? status?.activePauseKeys ?? [];
  const sourceMetaResult: LiveDataResult<NetworkStatus> | undefined = result && status && hasSourceWarnings && result.status === 'ok'
    ? { ...result, status: 'degraded' }
    : result;
  const chainPresentations = (status?.chainStatuses ?? [])
    .map(getChainPresentation)
    .sort((left, right) => left.rank - right.rank || left.chain.chain.localeCompare(right.chain.chain));
  const directlyAffectedChains = chainPresentations.filter((chain) => chain.rank === 0);
  const inheritedOnlyChains = chainPresentations.filter((chain) => chain.rank === 2);
  const activeActions = getActionSummary(status, chainPresentations);
  const keyReviewCount = warningDetails
    .filter(hasKeyLikeWarning)
    .reduce((count, warning) => count + (warning.keys?.length ?? 0), 0);
  const highPriorityWarnings = warningDetails.filter((warning) => warning.severity !== 'review');
  const priorityControls = status?.monitoredControls.filter((control) => (
    control.active ||
    control.state === 'disabled' ||
    control.state === 'scheduled' ||
    control.state === 'unparseable'
  )) ?? [];
  const secondaryControls = status?.monitoredControls.filter((control) => !priorityControls.includes(control)) ?? [];

  const chainsWithEvidence = (status?.chainStatuses ?? [])
    .map((chain) => ({
      chain: chain.chain,
      mimirKeys: uniqueStrings([
        ...chain.activeMimirKeys,
        ...chain.lpDepositPauseKeys,
        ...(chain.securedAssetDepositPauseKeys ?? []),
        ...(chain.securedAssetWithdrawPauseKeys ?? []),
        ...(chain.asymWithdrawalPauseKeys ?? []),
      ]),
      inboundFields: chain.inboundAddressEvidenceFields ?? [],
    }))
    .filter((chain) => chain.mimirKeys.length > 0 || chain.inboundFields.length > 0);
  const activeEvidenceKeys = status?.activeEvidenceKeys ?? [...new Set(chainsWithEvidence.flatMap((chain) => chain.mimirKeys))];
  const chainEvidenceKeySet = new Set(chainsWithEvidence.flatMap((chain) => chain.mimirKeys));
  const controlEvidenceRows: EvidenceRow[] = activeControlKeys
    .filter((key) => isExactMimirKey(key) && !chainEvidenceKeySet.has(key))
    .map((key) => ({
      id: `control:${key}`,
      scope: 'Network',
      impact: 'Monitored control flag',
      source: 'Mimir',
      key,
      state: 'active',
    }));
  const chainMimirEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.mimirKeys.map((key) => ({
      id: `${chain.chain}:${key}`,
      scope: chain.chain,
      impact: getEvidenceImpact(key),
      source: 'Mimir',
      key,
      state: 'active' as const,
    }))
  ));
  const inboundEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.inboundFields.map((field) => ({
      id: `${chain.chain}:inbound:${field}`,
      scope: chain.chain,
      impact: getInboundEvidenceImpact(field),
      source: 'inbound_addresses',
      key: `THORNode inbound_addresses.${field}`,
      state: 'active' as const,
    }))
  ));
  const describedEvidenceKeys = new Set([
    ...controlEvidenceRows.map((row) => row.key),
    ...chainMimirEvidenceRows.map((row) => row.key),
  ]);
  const scopedEvidenceRows: EvidenceRow[] = activeEvidenceKeys
    .filter((key) => !describedEvidenceKeys.has(key))
    .map((key) => ({
      id: `scoped:${key}`,
      scope: getEvidenceScope(key),
      impact: getEvidenceImpact(key),
      source: 'Mimir',
      key,
      state: 'active',
    }));
  const evidenceRows = [...controlEvidenceRows, ...chainMimirEvidenceRows, ...inboundEvidenceRows, ...scopedEvidenceRows];
  const evidenceCount = evidenceRows.length;
  const Icon = hasTrustWarning ? AlertTriangle : CheckCircle2;
  const title = isLoading
    ? 'Checking live network status'
    : isUnavailable
      ? 'Network status unavailable'
      : isUnknown
        ? 'Network status unknown'
        : isPaused && hasSourceWarnings
          ? 'Paused operations need source review'
          : isPaused
            ? 'Live sources show paused operations'
            : isDegraded || hasSourceWarnings
              ? 'Network status source degraded'
              : hasScheduledMimirKeys
                ? 'Live sources show scheduled Mimir controls'
                : 'Live sources show no global halt flags';
  const summary = isLoading
    ? 'Fetching THORNode Mimir, inbound-address, version, and block evidence.'
    : result?.error ?? status?.summary ?? 'Current-only THORNode status is unavailable.';
  const compact = variant === 'compact';

  return (
    <Card
      className={hasTrustWarning ? 'border-amber-500/30 bg-surface-elevated' : 'border-emerald-500/20'}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <div className={hasTrustWarning ? 'mt-0.5 text-amber-300' : 'mt-0.5 text-emerald-300'}>
            <Icon className="h-5 w-5" />
          </div>
          <div role="status" aria-live="polite" aria-atomic="true" aria-busy={isLoading}>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{title}</h2>
              {status?.state && (
                <Badge variant={hasTrustWarning ? 'warning' : 'success'}>
                  {status.state}
                </Badge>
              )}
              {hasSourceWarnings && (
                <Badge variant="warning">Source warning</Badge>
              )}
            </div>
            <p className="mt-1 max-w-4xl text-sm text-slate-400">{summary}</p>
            {highPriorityWarnings.length > 0 && (
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {highPriorityWarnings.slice(0, compact ? 1 : 2).map((warning) => (
                  <div key={`${warning.category}:${warning.message}`} className={`rounded-md border px-2.5 py-2 text-xs ${getWarningTone(warning)}`}>
                    <p className="font-semibold">{getWarningTitle(warning)}</p>
                    <p className="mt-1 text-slate-300/80">{warning.action}</p>
                  </div>
                ))}
              </div>
            )}
            {keyReviewCount > 0 && (
              <p className="mt-2 text-xs text-slate-400">
                {formatKeyCount(keyReviewCount)} {keyReviewCount === 1 ? 'needs' : 'need'} Mimir review; exact raw keys stay in diagnostics, not the headline.
              </p>
            )}
          </div>
        </div>
        <div className="min-w-52">
          <LiveSourceMeta result={sourceMetaResult} />
          {status?.thorNodeVersion && (
            <p className="mt-1 text-[11px] text-slate-400">THORNode {status.thorNodeVersion}</p>
          )}
          {status?.thorchainHeight && (
            <p className="mt-1 text-[11px] text-slate-400">
              THORChain height {status.thorchainHeight}
              {status.thorchainSnapshotPinned === false ? ' / snapshot unpinned' : ''}
              {status.thorchainBlockTime ? ` / block time ${new Date(status.thorchainBlockTime).toLocaleTimeString()}` : ''}
              {status.thorchainBlockAgeSeconds !== undefined ? ` / Block age ${formatBlockAge(status.thorchainBlockAgeSeconds)}` : ''}
              {status.thorchainLastblockSpread !== undefined && status.thorchainLastblockSpread > 0 ? ` / lastblock spread ${status.thorchainLastblockSpread} blocks` : ''}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Look here first
        </p>
        <div className="grid gap-2 md:grid-cols-4" aria-label="Look here first">
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Posture</p>
            <p className="mt-1 text-sm font-semibold">
              {isLoading ? 'Checking' : isUnavailable ? 'Unavailable' : isPaused ? 'Paused' : isDegraded || hasSourceWarnings ? 'Degraded' : 'Operational'}
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions affected</p>
            <p className="mt-1 text-sm font-semibold">{status ? activeActions.length > 0 ? activeActions.slice(0, 2).join(', ') : 'None observed' : 'Unavailable'}</p>
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Chains</p>
            <p className="mt-1 text-sm font-semibold">
              {status
                ? `${directlyAffectedChains.length} affected${inheritedOnlyChains.length > 0 ? ` / ${inheritedOnlyChains.length} inherited` : ''}`
                : 'Unavailable'}
            </p>
          </div>
          <div className="rounded-md border border-border bg-surface/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data quality</p>
            <p className="mt-1 text-sm font-semibold">{status ? warningDetails.length > 0 ? formatWarningCount(warningDetails.length) : 'Sources clean' : 'Pending'}</p>
          </div>
        </div>
      </div>

      {status && activeActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Top affected actions">
          {activeActions.slice(0, compact ? 4 : 8).map((action) => (
            <span key={action} className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
              {action}
            </span>
          ))}
        </div>
      )}

      {compact && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Compact view hides raw Mimir keys. Use Network diagnostics for exact evidence and grouped controls.
          </span>
          <Link href="/network" className="font-semibold text-accent transition-colors hover:text-rune">
            Open diagnostics
          </Link>
        </div>
      )}

      {!compact && status && warningDetails.length > 0 && (
        <details className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-amber-200">
            <span>Source warnings and Mimir review queue</span>
            <span className="shrink-0 text-[11px] font-normal text-amber-300/80">{formatWarningCount(warningDetails.length)}</span>
          </summary>
          <div className="space-y-2 border-t border-amber-500/20 px-3 py-3">
            {warningDetails.map((warning) => {
              const { visibleKeys, hiddenCount } = getDisclosureKeys(warning.keys);
              return (
                <div key={`${warning.category}:${warning.message}`} className={`rounded-md border p-2 text-xs ${getWarningTone(warning)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={warning.severity === 'review' ? 'default' : warning.severity === 'critical' ? 'danger' : 'warning'}>
                      {warning.category}
                    </Badge>
                    <p className="font-semibold">{getWarningTitle(warning)}</p>
                  </div>
                  <p className="mt-1 text-slate-300/80">{warning.action}</p>
                  {warning.scopes?.length ? (
                    <p className="mt-1 text-[11px] text-slate-400">Scope: {warning.scopes.join(', ')}</p>
                  ) : null}
                  {warning.keys?.length ? (
                    <details className="mt-2 rounded border border-slate-700 bg-slate-950/40">
                      <summary className="cursor-pointer list-none px-2 py-1 text-[11px] font-semibold text-slate-300">
                        Show {formatKeyCount(warning.keys.length)}
                      </summary>
                      <div className="flex flex-wrap gap-1.5 border-t border-slate-700 p-2">
                        {visibleKeys.map((key) => (
                          <code key={key} className="break-all rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-[10px] text-amber-200">
                            {key}
                          </code>
                        ))}
                        {hiddenCount > 0 && (
                          <span className="rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-[10px] text-slate-400">
                            {hiddenCount} more keys hidden from the rendered page; source remains degraded.
                          </span>
                        )}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
            <p className="text-[11px] text-amber-100/70">
              Do not treat missing active halt flags as complete proof until these warnings are reviewed.
            </p>
          </div>
        </details>
      )}

      {!compact && status && chainPresentations.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Per-chain live operation state">
          {chainPresentations.map((presentation) => {
            const chain = presentation.chain;
            const unparseableKeys = chain.unparseableMimirKeys ?? [];
            const chainSourceWarnings = chain.sourceWarnings ?? [];
            const scheduledKeys = chain.scheduledMimirKeys ?? [];
            return (
              <div
                key={chain.chain}
                role="listitem"
                aria-label={`${chain.chain}: ${presentation.statusText}`}
                className={`rounded-md border px-3 py-2 ${presentation.cardClassName}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{chain.chain}</span>
                  <RadioTower aria-hidden="true" className={`h-3.5 w-3.5 ${presentation.iconClassName}`} />
                </div>
                <p className="mt-1 min-h-8 text-[11px] leading-relaxed text-slate-400">
                  {presentation.statusText}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {presentation.directEvidenceCount > 0 && (
                    <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200" aria-label={`${chain.chain} direct source evidence count`}>
                      Direct: {formatEvidenceCount(presentation.directEvidenceCount)}
                    </span>
                  )}
                  {presentation.inheritedEvidenceCount > 0 && (
                    <span className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-400" aria-label={`${chain.chain} inherited global control count`}>
                      Inherited: {formatKeyCount(presentation.inheritedEvidenceCount)}
                    </span>
                  )}
                  {presentation.scheduledCount > 0 && (
                    <span className="rounded border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-200" aria-label={`${chain.chain} scheduled Mimir key count`}>
                      Scheduled: {formatKeyCount(presentation.scheduledCount)}
                    </span>
                  )}
                  {presentation.warningCount > 0 && (
                    <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-200" aria-label={`${chain.chain} source warning count`}>
                      Warning: {presentation.warningCount} issue{presentation.warningCount === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                {presentation.warningCount > 0 && (
                  <details className="mt-2 rounded border border-amber-500/20 bg-slate-950/30" aria-label={`${chain.chain} source warnings`}>
                    <summary className="cursor-pointer list-none px-2 py-1 text-[11px] font-semibold text-amber-200">
                      Show chain warnings
                    </summary>
                    <div className="space-y-1 border-t border-amber-500/20 p-2">
                      {unparseableKeys.map((key) => (
                        <code key={key} className="block break-all rounded border border-amber-500/20 bg-slate-950/40 px-1.5 py-1 text-[10px] text-amber-200">
                          {key}
                        </code>
                      ))}
                      {chainSourceWarnings.map((warning) => (
                        <p key={warning} className="text-[10px] leading-relaxed text-amber-200">
                          {warning}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
                {scheduledKeys.length > 0 && (
                  <details className="mt-2 rounded border border-sky-500/20 bg-slate-950/30">
                    <summary className="cursor-pointer list-none px-2 py-1 text-[11px] font-semibold text-sky-200">
                      Show scheduled keys
                    </summary>
                    <div className="flex flex-wrap gap-1.5 border-t border-sky-500/20 p-2">
                      {scheduledKeys.map((key) => (
                        <code key={key} className="break-all rounded border border-sky-500/20 bg-slate-950/40 px-1.5 py-1 text-[10px] text-sky-100">
                          {key}
                        </code>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!compact && evidenceRows.length > 0 && (
        <details className="mt-4 rounded-md border border-border bg-surface/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-300">
            <span>Operational evidence</span>
            <span className="shrink-0 text-[11px] font-normal text-slate-400">{formatEvidenceCount(evidenceCount)}</span>
          </summary>
          <div className="border-t border-border px-3 py-3">
            <p className="text-[11px] text-slate-400">
              Active Mimir keys and inbound-address fields from the live THORNode source above. Global controls appear once here instead of being repeated on every inherited chain card.
            </p>
            <div className="mt-3 space-y-2 sm:hidden" role="list" aria-label="Active source evidence for network operation state">
              {evidenceRows.map((row) => (
                <div key={`mobile:${row.id}`} role="listitem" className="rounded-md border border-border bg-slate-950/30 p-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="font-semibold text-slate-300">{row.scope}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.source}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.impact}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-400">{row.state}</span>
                  </div>
                  <code className="mt-1 block break-all font-mono text-[10px] leading-relaxed text-amber-200">
                    {row.key}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="min-w-[720px] text-left text-[11px]">
                <caption className="sr-only">Active source evidence for network operation state</caption>
                <thead className="text-slate-400">
                  <tr>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Scope</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Source</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Impact</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">State</th>
                    <th scope="col" className="pb-2 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-300">
                  {evidenceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-2 pr-4 font-medium">{row.scope}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.source}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.impact}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.state}</td>
                      <td className="py-2">
                        <code className="break-all rounded border border-border bg-slate-950/50 px-1.5 py-1 text-[10px] text-amber-200">
                          {row.key}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      )}

      {!compact && scheduledMimirKeys.length > 0 && (
        <details className="mt-4 rounded-md border border-sky-500/20 bg-sky-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-sky-200">
            <span>Scheduled monitored Mimir keys</span>
            <span className="shrink-0 text-[11px] font-normal text-sky-300/80">{formatKeyCount(scheduledMimirKeys.length)}</span>
          </summary>
          <div className="border-t border-sky-500/20 px-3 py-3">
            <p className="text-[11px] text-sky-100/70">
              These height-based controls exist in live Mimir but are not active at the sampled THORChain height.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {scheduledMimirKeys.map((key) => (
                <code key={key} className="break-all rounded border border-sky-500/20 bg-slate-950/50 px-1.5 py-1 text-[10px] text-sky-100">
                  {key}
                </code>
              ))}
            </div>
            {scheduledControls.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-100/80">
                  Scheduled control details
                </p>
                <div className="mt-2 space-y-2">
                  {scheduledControls.map((control) => (
                    <div key={`scheduled:${control.key}`} className="rounded border border-sky-500/20 bg-slate-950/30 p-2 text-[11px]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-sky-100">{control.label}</span>
                        <code className="break-all text-sky-100/80">{control.key}</code>
                      </div>
                      <p className="mt-1 text-sky-100/70">{control.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      {!compact && status && status.invalidMimirKeys.length > 0 && (
        <details className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-amber-200">
            <span>Unparseable monitored Mimir keys</span>
            <span className="shrink-0 text-[11px] font-normal text-amber-300/80">{formatKeyCount(status.invalidMimirKeys.length)}</span>
          </summary>
          <div className="border-t border-amber-500/20 px-3 py-3">
            <p className="text-[11px] text-amber-100/70">
              These keys existed in the live Mimir response but did not contain a plain numeric value, so they were not counted as inactive.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {status.invalidMimirKeys.map((key) => (
                <code key={key} className="break-all rounded border border-amber-500/20 bg-slate-950/50 px-1.5 py-1 text-[10px] text-amber-200">
                  {key}
                </code>
              ))}
            </div>
          </div>
        </details>
      )}

      {!compact && status && status.monitoredControls.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Priority Mimir controls
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {priorityControls.length > 0 ? (
              priorityControls.map(renderControlChip)
            ) : (
              <span className="text-xs text-slate-400">No active, disabled, scheduled, or unparseable monitored controls.</span>
            )}
          </div>
          {secondaryControls.length > 0 && (
            <details className="mt-3 rounded-md border border-border bg-surface/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-300">
                <span>Show inactive and not-monitored controls</span>
                <span className="shrink-0 text-[11px] font-normal text-slate-400">{secondaryControls.length} controls</span>
              </summary>
              <div className="space-y-4 border-t border-border px-3 py-3">
                {chunkControlsByGroup(secondaryControls).map(([group, controls]) => (
                  <div key={group}>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {controls.map(renderControlChip)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            Current actions depend on these controls and per-chain flags; check live sources before assuming swaps,
            signing, LP actions, asymmetric withdrawals, TCY, trade-account, secured-asset, bank-send, or app-layer availability.
          </p>
        </div>
      )}
    </Card>
  );
}
