import { AlertTriangle, CheckCircle2, RadioTower } from 'lucide-react';
import { LiveDataResult, NetworkStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

interface NetworkStatusBannerProps {
  result?: LiveDataResult<NetworkStatus>;
  isLoading?: boolean;
}

interface EvidenceRow {
  id: string;
  scope: string;
  impact: string;
  source: string;
  key: string;
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

function formatBlockAge(seconds: number): string {
  if (seconds < 0) {
    return `${formatBlockAge(Math.abs(seconds))} in future`;
  }
  if (seconds < 60) {
    return `${seconds} sec`;
  }
  if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'min' : 'min'}`;
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

export function NetworkStatusBanner({ result, isLoading = false }: NetworkStatusBannerProps) {
  const status = result?.data;
  const isPaused = status?.state === 'paused';
  const isDegraded = result?.status === 'degraded' || status?.state === 'degraded';
  const isUnknown = status?.state === 'unknown';
  const isUnavailable = (!result || !status) && !isLoading;
  const hasInvalidMimirKeys = Boolean(status && status.invalidMimirKeys.length > 0);
  const hasSourceWarnings = Boolean(status && (hasInvalidMimirKeys || status.sourceWarnings.length > 0));
  const scheduledMimirKeys = status?.scheduledMimirKeys ?? [];
  const hasScheduledMimirKeys = scheduledMimirKeys.length > 0;
  const scheduledControls = status?.monitoredControls.filter((control) => control.state === 'scheduled') ?? [];
  const hasTrustWarning = isPaused || isDegraded || isUnknown || isUnavailable || hasSourceWarnings || hasScheduledMimirKeys;
  const activeControlKeys = status?.activeControlKeys ?? status?.activePauseKeys ?? [];
  const sourceMetaResult: LiveDataResult<NetworkStatus> | undefined = result && status && hasSourceWarnings && result.status === 'ok'
    ? { ...result, status: 'degraded' }
    : result;
  const chainsWithEvidence = status?.chainStatuses
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
    .filter((chain) => chain.mimirKeys.length > 0 || chain.inboundFields.length > 0) ?? [];
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
    }));
  const chainMimirEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.mimirKeys.map((key) => ({
      id: `${chain.chain}:${key}`,
      scope: chain.chain,
      impact: getEvidenceImpact(key),
      source: 'Mimir',
      key,
    }))
  ));
  const inboundEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.inboundFields.map((field) => ({
      id: `${chain.chain}:inbound:${field}`,
      scope: chain.chain,
      impact: getInboundEvidenceImpact(field),
      source: 'inbound_addresses',
      key: `THORNode inbound_addresses.${field}`,
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
      : isDegraded
      ? 'Network status source degraded'
      : isPaused && hasSourceWarnings
        ? 'Live sources show paused operations with source warnings'
      : isPaused
        ? 'Live sources show paused operations'
      : hasSourceWarnings
          ? hasInvalidMimirKeys
            ? 'Live sources have unparseable Mimir controls'
            : 'Live sources have Mimir warnings to review'
      : hasScheduledMimirKeys
          ? 'Live sources show scheduled Mimir controls'
          : 'Live sources show no global halt flags';

  return (
    <Card
      className={hasTrustWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/20'}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 text-accent">
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
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              {isLoading
                ? 'Fetching THORNode Mimir and inbound-address state.'
                : result?.error ?? status?.summary ?? 'Current-only THORNode status is unavailable.'}
            </p>
            {activeControlKeys.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">
                Active monitored controls: {formatKeyCount(activeControlKeys.length)}. Supporting source keys are listed in operational evidence.
              </p>
            )}
            {hasScheduledMimirKeys && (
              <p className="mt-2 text-xs text-sky-300">
                Scheduled monitored controls: {formatKeyCount(scheduledMimirKeys.length)}. These are not counted as paused at THORChain height {status?.thorchainHeight ?? 'unavailable'}.
              </p>
            )}
            {hasSourceWarnings && (
              <div className="mt-2 space-y-1 text-xs text-amber-300">
                {(status?.sourceWarnings ?? []).map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
                <p>Do not treat missing active halt flags as complete proof until these values are checked.</p>
              </div>
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

      {status && status.chainStatuses.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="list" aria-label="Per-chain live operation state">
          {status.chainStatuses.map((chain) => {
            const unparseableKeys = chain.unparseableMimirKeys ?? [];
            const chainSourceWarnings = chain.sourceWarnings ?? [];
            const scheduledKeys = chain.scheduledMimirKeys ?? [];
            const inheritedMimirKeys = chain.inheritedMimirKeys ?? [];
            const paused = chain.halted ||
              chain.tradingPaused ||
              chain.lpActionsPaused ||
              chain.lpDepositPaused ||
              chain.signingPaused ||
              Boolean(chain.securedAssetDepositPaused) ||
              Boolean(chain.securedAssetWithdrawPaused) ||
              Boolean(chain.asymWithdrawalPaused);
            const hasChainWarning = unparseableKeys.length > 0 || chainSourceWarnings.length > 0;
            const details = [
              chain.halted ? 'halted' : null,
              chain.tradingPaused ? 'trading' : null,
              chain.signingPaused ? 'signing' : null,
              chain.lpActionsPaused ? 'LP' : null,
              !chain.lpActionsPaused && chain.lpDepositPaused ? 'LP deposits' : null,
              chain.securedAssetDepositPaused ? 'secured deposits' : null,
              chain.securedAssetWithdrawPaused ? 'secured withdrawals' : null,
              chain.asymWithdrawalPaused ? 'asym withdrawals' : null,
              inheritedMimirKeys.length > 0 ? 'global control' : null,
              scheduledKeys.length > 0 ? 'scheduled' : null,
              unparseableKeys.length > 0 ? 'Mimir warning' : null,
              chainSourceWarnings.length > 0 ? 'source warning' : null,
            ].filter((item): item is string => item !== null);
            const statusText = details.length > 0 ? details.join(' / ') : 'open';
            const sourceKeyCount = uniqueStrings([
              ...chain.activeMimirKeys,
              ...chain.lpDepositPauseKeys,
              ...(chain.securedAssetDepositPauseKeys ?? []),
              ...(chain.securedAssetWithdrawPauseKeys ?? []),
              ...(chain.asymWithdrawalPauseKeys ?? []),
              ...inheritedMimirKeys,
            ]).length + (chain.inboundAddressEvidenceFields?.length ?? 0);
            const hasChainScheduled = scheduledKeys.length > 0;
            return (
              <div
                key={chain.chain}
                role="listitem"
                aria-label={`${chain.chain}: ${statusText}`}
                className={`rounded-md border px-3 py-2 ${paused || hasChainWarning || hasChainScheduled ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-surface/70'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{chain.chain}</span>
                  <RadioTower aria-hidden="true" className={paused || hasChainWarning ? 'h-3.5 w-3.5 text-amber-400' : hasChainScheduled ? 'h-3.5 w-3.5 text-sky-400' : 'h-3.5 w-3.5 text-emerald-400'} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {statusText}
                </p>
                {sourceKeyCount > 0 && (
                  <p className="mt-1 text-[11px] text-slate-400" aria-label={`${chain.chain} active source evidence count`}>
                    Evidence: {formatEvidenceCount(sourceKeyCount)}
                  </p>
                )}
                {scheduledKeys.length > 0 && (
                  <p className="mt-1 text-[11px] text-sky-300" aria-label={`${chain.chain} scheduled Mimir key count`}>
                    Scheduled: {formatKeyCount(scheduledKeys.length)}
                  </p>
                )}
                {hasChainWarning && (
                  <div className="mt-2 space-y-1" aria-label={`${chain.chain} source warnings`}>
                    <p className="text-[11px] text-amber-300">
                      Warning: {unparseableKeys.length + chainSourceWarnings.length} issue{unparseableKeys.length + chainSourceWarnings.length === 1 ? '' : 's'}
                    </p>
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
                )}
              </div>
            );
          })}
        </div>
      )}

      {evidenceRows.length > 0 && (
        <details className="mt-4 rounded-md border border-border bg-surface/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-slate-300">
            <span>Operational evidence</span>
            <span className="shrink-0 text-[11px] font-normal text-slate-400">{formatEvidenceCount(evidenceCount)}</span>
          </summary>
          <div className="border-t border-border px-3 py-3">
            <p className="text-[11px] text-slate-400">
              Supporting active Mimir keys and inbound-address fields from the live THORNode source above. These source values explain the compact chain-card states.
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
                  </div>
                  <code className="mt-1 block break-all font-mono text-[10px] leading-relaxed text-amber-200">
                    {row.key}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="min-w-[640px] text-left text-[11px]">
                <caption className="sr-only">Active source evidence for network operation state</caption>
                <thead className="text-slate-400">
                  <tr>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Scope</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Source</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Impact</th>
                    <th scope="col" className="pb-2 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-300">
                  {evidenceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-2 pr-4 font-medium">{row.scope}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.source}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-400">{row.impact}</td>
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

      {scheduledMimirKeys.length > 0 && (
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

      {status && status.invalidMimirKeys.length > 0 && (
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

      {status && status.monitoredControls.length > 0 && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Monitored Mimir controls
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {status.monitoredControls.map((control) => (
              <span
                key={control.key}
                title={control.description}
                className={`rounded border px-2 py-1 text-[11px] ${getControlClassName(control.state, control.active)}`}
              >
                {control.label}: {getControlStateLabel(control.key, control.state)}
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Current actions depend on these controls and per-chain flags; check live sources before assuming swaps,
            signing, LP actions, asymmetric withdrawals, TCY, trade-account, secured-asset, bank-send, or app-layer availability.
          </p>
        </div>
      )}
    </Card>
  );
}
