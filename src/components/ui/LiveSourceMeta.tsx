import { LiveDataResult, MidgardHealth, NetworkStatusSourceWarning, SourceHealthSeverity } from '@/lib/types';
import { formatEvidenceTimestamp } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { liveResultHasSourceWarnings } from '@/lib/live-result';
import { collectSourceWarningSignals } from '@/lib/source-warnings';
import { AdditionalSourceDisclosure, SourceMetaLink } from '@/components/ui/SourceMetaDisclosure';

interface LiveSourceMetaProps {
  result?: LiveDataResult<unknown>;
  onRefresh?: () => unknown;
  health?: MidgardHealth;
  healthResult?: LiveDataResult<MidgardHealth>;
}

function healthVariant(severity: SourceHealthSeverity) {
  switch (severity) {
    case 'ok':
      return 'success';
    case 'warning':
    case 'unknown':
      return 'warning';
    case 'degraded':
      return 'danger';
  }
}

function healthLabel(health: MidgardHealth) {
  if (health.lagBlocks !== undefined && health.lagSeconds !== undefined) {
    return `${health.lagBlocks} block lag / ${Math.round(health.lagSeconds / 60)} min`;
  }
  if (health.lagBlocks !== undefined) {
    return `${health.lagBlocks} block lag`;
  }
  if (health.lagSeconds !== undefined) {
    return `${Math.round(health.lagSeconds / 60)} min lag`;
  }
  return 'Lag unavailable';
}

function sourceBadge(
  result: LiveDataResult<unknown>,
  health: MidgardHealth | undefined,
  healthUnavailable: boolean,
  healthSourceMismatch: boolean
) {
  if (result.status === 'degraded') {
    return { label: 'Degraded', variant: 'warning' as const };
  }
  if (healthUnavailable || health?.severity === 'degraded') {
    return { label: 'Source degraded', variant: 'danger' as const };
  }
  if (
    healthSourceMismatch ||
    liveResultHasSourceWarnings(result) ||
    health?.severity === 'warning' ||
    health?.severity === 'unknown'
  ) {
    return { label: 'Source warning', variant: 'warning' as const };
  }
  return { label: 'Current-only', variant: 'success' as const };
}

function sameSourceGroup(sourceUrl: string, candidateUrl: string) {
  try {
    return new URL(sourceUrl).origin === new URL(candidateUrl).origin;
  } catch {
    return sourceUrl === candidateUrl;
  }
}

function sanitizeWarningMessage(message: string) {
  const compact = message.trim();
  if (/keys?.+review:/i.test(compact) || /mimir.+:/i.test(compact)) {
    return compact.replace(/:\s*.+\.?$/, '.');
  }
  return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
}

function countHiddenKeys(detail: NetworkStatusSourceWarning, fallbackMessage: string) {
  if (detail.keys?.length) {
    return detail.keys.length;
  }

  const [, rawKeys] = fallbackMessage.split(':');
  if (!rawKeys || !/keys?/i.test(fallbackMessage)) {
    return 0;
  }

  return rawKeys
    .replace(/\.$/, '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .length;
}

function formatSourceWarningSummary(count: number, hiddenKeyCount: number) {
  const warningLabel = `${count} source ${count === 1 ? 'warning' : 'warnings'}`;
  if (hiddenKeyCount > 0) {
    return `${warningLabel}; ${hiddenKeyCount} raw ${hiddenKeyCount === 1 ? 'key' : 'keys'} hidden from compact view`;
  }
  return `${warningLabel}; open details for the source-quality note`;
}

export function LiveSourceMeta({ result, health, healthResult, onRefresh }: LiveSourceMetaProps) {
  if (!result) {
    return <p className="text-xs text-slate-400">Loading live source...</p>;
  }

  const checkedAt = formatEvidenceTimestamp(result.checkedAt);
  const sources = result.sources?.length ? result.sources : result.source ? [result.source] : [];
  const primarySource = sources[0];
  const secondarySources = sources.slice(1);
  const healthSource = healthResult?.source;
  const healthMatchesMetric = !healthSource || sources.length === 0 ||
    sources.some((source) => sameSourceGroup(source.url, healthSource.url));
  const resolvedHealth = healthMatchesMetric ? (healthResult ? healthResult.data : health) : undefined;
  const healthUnavailable = Boolean(healthResult && !healthResult.data && healthMatchesMetric);
  const sourceStateBadge = sourceBadge(result, resolvedHealth, healthUnavailable, !healthMatchesMetric);
  const presentation = result.presentation?.state;
  const primaryBadge = presentation && presentation !== 'current' && (presentation !== 'historical' || sourceStateBadge.variant === 'success')
    ? { label: { refreshing: 'Refreshing', 'last-good': 'Last good sample', stale: 'Stale context', unavailable: 'Unavailable', historical: 'Historical intervals' }[presentation], variant: presentation === 'historical' ? 'info' as const : 'warning' as const }
    : sourceStateBadge;
  const warningSignals = collectSourceWarningSignals(result.data);
  const structuredMessages = new Set(warningSignals.details.map((detail) => detail.message));
  const warningDetails = [
    ...warningSignals.details,
    ...warningSignals.messages
      .filter((message) => !structuredMessages.has(message))
      .map((message) => ({
      severity: 'warning' as const,
      category: 'other' as const,
      message,
      action: 'Review this source warning before treating the live value as clean.',
      })),
  ];
  const warningCount = warningDetails.length;
  const hiddenKeyCount = warningDetails.reduce((count, detail) => count + countHiddenKeys(detail, detail.message), 0);
  const previewWarnings = warningDetails.slice(0, 3);
  const hiddenWarningCount = Math.max(0, warningDetails.length - previewWarnings.length);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <Badge variant={primaryBadge.variant}>{primaryBadge.label}</Badge>
        <span className="min-w-0 max-w-full break-words [overflow-wrap:anywhere]">Checked {checkedAt}</span>
        {onRefresh && <button type="button" onClick={() => { void onRefresh(); }} disabled={presentation === 'refreshing'} className="rounded text-accent underline underline-offset-2 disabled:opacity-50" aria-label={`Refresh ${primarySource?.label ?? 'live source'} data`}>Refresh source</button>}
        {primarySource && (
          <div aria-label="Live data sources" className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex min-w-0 max-w-full">
              <SourceMetaLink source={primarySource}>
                {primarySource.label}
              </SourceMetaLink>
            </span>
            <AdditionalSourceDisclosure
              sources={secondarySources}
              primaryLabel={primarySource.label}
              itemLabelSingular="endpoint read"
              itemLabelPlural="endpoint reads"
              panelClassName="max-w-full gap-x-3 rounded-md"
              renderSource={(source) => (
                <SourceMetaLink source={source}>{source.label}</SourceMetaLink>
              )}
            />
          </div>
        )}
      </div>
      {warningCount > 0 && (
        <details className="group text-xs text-slate-400">
          <summary className="cursor-pointer list-none break-words text-amber-300 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
            {formatSourceWarningSummary(warningCount, hiddenKeyCount)}
          </summary>
          <ul className="mt-1 space-y-1 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1.5">
            {previewWarnings.map((detail) => {
              const hiddenKeys = countHiddenKeys(detail, detail.message);
              return (
                <li key={JSON.stringify(detail)} className="leading-relaxed">
                  <span className="font-semibold text-amber-200">{detail.severity} / {detail.category}</span>
                  {': '}
                  <span>{sanitizeWarningMessage(detail.message)}</span>
                  {hiddenKeys > 0 && (
                    <span> Exact {hiddenKeys === 1 ? 'key is' : 'keys are'} available only in the source-specific diagnostics.</span>
                  )}
                </li>
              );
            })}
            {hiddenWarningCount > 0 && (
              <li className="leading-relaxed text-slate-500">
                +{hiddenWarningCount} more warning{hiddenWarningCount === 1 ? '' : 's'} hidden here.
              </li>
            )}
          </ul>
        </details>
      )}
      {result.status === 'degraded' && result.error && (
        <p className="text-xs leading-relaxed text-amber-300">{result.error}</p>
      )}
      {resolvedHealth && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          <Badge variant={healthVariant(resolvedHealth.severity)}>
            Midgard {resolvedHealth.severity}
          </Badge>
          <span>{healthLabel(resolvedHealth)}</span>
          {resolvedHealth.provider && <span>via {resolvedHealth.provider}</span>}
          {resolvedHealth.reasons.map((reason) => (
            <span key={reason} className="text-amber-300">
              {reason}
            </span>
          ))}
        </div>
      )}
      {!healthMatchesMetric && healthSource && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          <Badge variant="warning">Health source differs</Badge>
          <span>
            Metric via {primarySource?.label ?? 'unknown source'}
            {secondarySources.length > 0 ? ` (+${secondarySources.length} endpoint reads)` : ''}
          </span>
          <span>health via {healthSource.label}</span>
        </div>
      )}
      {healthUnavailable && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
          <Badge variant="danger">
            Midgard health degraded
          </Badge>
          <span>Lag unavailable</span>
          {healthResult?.error && (
            <span className="text-amber-300">{healthResult.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
