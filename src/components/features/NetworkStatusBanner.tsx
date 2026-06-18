import { AlertTriangle, CheckCircle2, RadioTower } from 'lucide-react';
import { LiveDataResult, NetworkStatus } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

interface NetworkStatusBannerProps {
  result?: LiveDataResult<NetworkStatus>;
  isLoading?: boolean;
}

export function NetworkStatusBanner({ result, isLoading = false }: NetworkStatusBannerProps) {
  const status = result?.data;
  const isPaused = status?.state === 'paused';
  const isDegraded = result?.status === 'degraded';
  const isUnavailable = !result && !isLoading;
  const Icon = isPaused || isDegraded || isUnavailable ? AlertTriangle : CheckCircle2;
  const title = isLoading
    ? 'Checking live network status'
    : isUnavailable
      ? 'Network status unavailable'
      : isDegraded
      ? 'Network status source degraded'
      : isPaused
        ? 'Live sources show paused operations'
        : 'Live sources show no global halt flags';

  return (
    <Card className={isPaused || isDegraded || isUnavailable ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/20'}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 text-accent">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">{title}</h2>
              {status?.state && (
                <Badge variant={isPaused ? 'warning' : 'success'}>
                  {status.state}
                </Badge>
              )}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              {isLoading
                ? 'Fetching THORNode Mimir and inbound-address state.'
                : result?.error ?? status?.summary ?? 'Current-only THORNode status is unavailable.'}
            </p>
            {status && status.activePauseKeys.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">
                Active monitored controls: {status.activePauseKeys.join(', ')}
              </p>
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
            const paused = chain.halted || chain.tradingPaused || chain.lpActionsPaused || chain.signingPaused;
            const details = [
              chain.halted ? 'halted' : null,
              chain.tradingPaused ? 'trading' : null,
              chain.signingPaused ? 'signing' : null,
              chain.lpActionsPaused ? 'LP' : null,
            ].filter((item): item is string => item !== null);
            const statusText = paused ? details.join(' / ') : 'open';
            return (
              <div
                key={chain.chain}
                aria-label={`${chain.chain}: ${statusText}`}
                className="rounded-md border border-border bg-surface/70 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold">{chain.chain}</span>
                  <RadioTower aria-hidden="true" className={paused ? 'h-3.5 w-3.5 text-amber-400' : 'h-3.5 w-3.5 text-emerald-400'} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {statusText}
                </p>
              </div>
            );
          })}
        </div>
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
                className={`rounded border px-2 py-1 text-[11px] ${
                  control.active
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    : control.state === 'not-monitored'
                      ? 'border-slate-700 bg-slate-900 text-slate-500'
                      : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                }`}
              >
                {control.label}: {control.state}
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
