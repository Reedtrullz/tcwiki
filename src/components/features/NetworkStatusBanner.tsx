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
  key: string;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function formatKeyCount(count: number) {
  return `${count} ${count === 1 ? 'key' : 'keys'}`;
}

function isExactMimirKey(key: string) {
  return !key.includes('*');
}

function isEnablementControlKey(key: string) {
  return key === 'TRADEACCOUNTSENABLED' || key === 'RUNEPOOLENABLED';
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
  if (state === 'not-monitored') {
    return 'border-slate-700 bg-slate-900 text-slate-500';
  }
  return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300';
}

export function NetworkStatusBanner({ result, isLoading = false }: NetworkStatusBannerProps) {
  const status = result?.data;
  const isPaused = status?.state === 'paused';
  const isDegraded = result?.status === 'degraded';
  const isUnavailable = !result && !isLoading;
  const hasInvalidMimirKeys = Boolean(status && status.invalidMimirKeys.length > 0);
  const hasSourceWarnings = Boolean(status && (hasInvalidMimirKeys || status.sourceWarnings.length > 0));
  const activeControlKeys = status?.activeControlKeys ?? status?.activePauseKeys ?? [];
  const chainsWithEvidence = status?.chainStatuses
    .map((chain) => ({
      chain: chain.chain,
      keys: uniqueStrings([...chain.activeMimirKeys, ...chain.lpDepositPauseKeys]),
    }))
    .filter((chain) => chain.keys.length > 0) ?? [];
  const activeEvidenceKeys = status?.activeEvidenceKeys ?? [...new Set(chainsWithEvidence.flatMap((chain) => chain.keys))];
  const chainEvidenceKeySet = new Set(chainsWithEvidence.flatMap((chain) => chain.keys));
  const controlEvidenceRows: EvidenceRow[] = activeControlKeys
    .filter((key) => isExactMimirKey(key) && !chainEvidenceKeySet.has(key))
    .map((key) => ({
      id: `control:${key}`,
      scope: 'Network',
      impact: 'Monitored control flag',
      key,
    }));
  const chainEvidenceRows: EvidenceRow[] = chainsWithEvidence.flatMap((chain) => (
    chain.keys.map((key) => ({
      id: `${chain.chain}:${key}`,
      scope: chain.chain,
      impact: key.startsWith('PAUSELPDEPOSIT-') ? 'LP deposit pause' : 'Chain operation flag',
      key,
    }))
  ));
  const evidenceRows = [...controlEvidenceRows, ...chainEvidenceRows];
  const evidenceCount = activeEvidenceKeys.length > 0 ? activeEvidenceKeys.length : evidenceRows.length;
  const Icon = isPaused || isDegraded || isUnavailable || hasSourceWarnings ? AlertTriangle : CheckCircle2;
  const title = isLoading
    ? 'Checking live network status'
    : isUnavailable
      ? 'Network status unavailable'
      : isDegraded
      ? 'Network status source degraded'
      : isPaused
        ? 'Live sources show paused operations'
      : hasSourceWarnings
          ? hasInvalidMimirKeys
            ? 'Live sources have unparseable Mimir controls'
            : 'Live sources have Mimir warnings to review'
          : 'Live sources show no global halt flags';

  return (
    <Card className={isPaused || isDegraded || isUnavailable || hasSourceWarnings ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/20'}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{title}</h2>
              {status?.state && (
                <Badge variant={isPaused || hasSourceWarnings ? 'warning' : 'success'}>
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
          <LiveSourceMeta result={result} />
          {status?.thorNodeVersion && (
            <p className="mt-1 text-[11px] text-slate-600">THORNode {status.thorNodeVersion}</p>
          )}
        </div>
      </div>

      {status && status.chainStatuses.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {status.chainStatuses.map((chain) => {
            const unparseableKeys = chain.unparseableMimirKeys ?? [];
            const paused = chain.halted || chain.tradingPaused || chain.lpActionsPaused || chain.lpDepositPaused || chain.signingPaused;
            const hasChainWarning = unparseableKeys.length > 0;
            const details = [
              chain.halted ? 'halted' : null,
              chain.tradingPaused ? 'trading' : null,
              chain.signingPaused ? 'signing' : null,
              chain.lpActionsPaused ? 'LP' : null,
              !chain.lpActionsPaused && chain.lpDepositPaused ? 'LP deposits' : null,
              hasChainWarning ? 'Mimir warning' : null,
            ].filter((item): item is string => item !== null);
            const statusText = details.length > 0 ? details.join(' / ') : 'open';
            const sourceKeyCount = uniqueStrings([...chain.activeMimirKeys, ...chain.lpDepositPauseKeys]).length;
            return (
              <div
                key={chain.chain}
                aria-label={`${chain.chain}: ${statusText}`}
                className={`rounded-md border px-3 py-2 ${paused || hasChainWarning ? 'border-amber-500/20 bg-amber-500/5' : 'border-border bg-surface/70'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{chain.chain}</span>
                  <RadioTower aria-hidden="true" className={paused || hasChainWarning ? 'h-3.5 w-3.5 text-amber-400' : 'h-3.5 w-3.5 text-emerald-400'} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {statusText}
                </p>
                {sourceKeyCount > 0 && (
                  <p className="mt-1 text-[10px] text-slate-600" aria-label={`${chain.chain} active Mimir key count`}>
                    Evidence: {formatKeyCount(sourceKeyCount)}
                  </p>
                )}
                {hasChainWarning && (
                  <div className="mt-2 space-y-1" aria-label={`${chain.chain} unparseable Mimir keys`}>
                    <p className="text-[10px] text-amber-300">
                      Warning: {formatKeyCount(unparseableKeys.length)}
                    </p>
                    {unparseableKeys.map((key) => (
                      <code key={key} className="block break-all rounded border border-amber-500/20 bg-slate-950/40 px-1.5 py-1 text-[10px] text-amber-200">
                        {key}
                      </code>
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
            <span className="shrink-0 text-[11px] font-normal text-slate-500">{formatKeyCount(evidenceCount)}</span>
          </summary>
          <div className="border-t border-border px-3 py-3">
            <p className="text-[11px] text-slate-500">
              Supporting active Mimir keys from the live THORNode source above. These keys explain the compact chain-card states.
            </p>
            <div className="mt-3 space-y-2 sm:hidden" role="list" aria-label="Active Mimir key evidence for network operation state">
              {evidenceRows.map((row) => (
                <div key={`mobile:${row.id}`} role="listitem" className="rounded-md border border-border bg-slate-950/30 p-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    <span className="font-semibold text-slate-300">{row.scope}</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-slate-500">{row.impact}</span>
                  </div>
                  <code className="mt-1 block break-all font-mono text-[10px] leading-relaxed text-amber-200">
                    {row.key}
                  </code>
                </div>
              ))}
            </div>
            <div className="mt-3 hidden overflow-x-auto sm:block">
              <table className="min-w-[640px] text-left text-[11px]">
                <caption className="sr-only">Active Mimir key evidence for network operation state</caption>
                <thead className="text-slate-500">
                  <tr>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Scope</th>
                    <th scope="col" className="whitespace-nowrap pb-2 pr-4 font-medium">Impact</th>
                    <th scope="col" className="pb-2 font-medium">Mimir key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-300">
                  {evidenceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap py-2 pr-4 font-medium">{row.scope}</td>
                      <td className="whitespace-nowrap py-2 pr-4 text-slate-500">{row.impact}</td>
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
          <p className="mt-2 text-[11px] text-slate-600">
            Current actions depend on these controls and per-chain flags; check live sources before assuming swaps,
            signing, LP actions, TCY, trade-account, secured-asset, or app-layer availability.
          </p>
        </div>
      )}
    </Card>
  );
}
