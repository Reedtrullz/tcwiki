import { LiveDataResult, MidgardHealth, NetworkStatusSourceWarning, SourceHealthSeverity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { liveResultHasSourceWarnings } from '@/lib/live-result';
import { AdditionalSourceDisclosure, SourceMetaLink } from '@/components/ui/SourceMetaDisclosure';

interface LiveSourceMetaProps {
  result?: LiveDataResult<unknown>;
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

interface WarningSignals {
  messages: string[];
  details: NetworkStatusSourceWarning[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isWarningDetail(value: unknown): value is NetworkStatusSourceWarning {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.severity === 'string' &&
    typeof value.category === 'string' &&
    typeof value.message === 'string' &&
    typeof value.action === 'string';
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function uniqueWarningDetails(details: NetworkStatusSourceWarning[]) {
  const seen = new Set<string>();
  return details.filter((detail) => {
    const key = `${detail.severity}:${detail.category}:${detail.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectWarningSignals(value: unknown): WarningSignals {
  if (Array.isArray(value)) {
    return value.reduce<WarningSignals>((signals, item) => {
      const itemSignals = collectWarningSignals(item);
      return {
        messages: uniqueStrings([...signals.messages, ...itemSignals.messages]),
        details: uniqueWarningDetails([...signals.details, ...itemSignals.details]),
      };
    }, { messages: [], details: [] });
  }

  if (!isRecord(value)) {
    return { messages: [], details: [] };
  }

  const sourceWarnings = Array.isArray(value.sourceWarnings)
    ? value.sourceWarnings.filter((warning): warning is string => typeof warning === 'string')
    : [];
  const sourceWarningDetails = Array.isArray(value.sourceWarningDetails)
    ? value.sourceWarningDetails.filter(isWarningDetail)
    : [];
  const nestedSignals = Object.entries(value)
    .filter(([key]) => key !== 'sourceWarnings' && key !== 'sourceWarningDetails')
    .reduce<WarningSignals>((signals, [, nestedValue]) => {
      const nested = collectWarningSignals(nestedValue);
      return {
        messages: uniqueStrings([...signals.messages, ...nested.messages]),
        details: uniqueWarningDetails([...signals.details, ...nested.details]),
      };
    }, { messages: [], details: [] });

  return {
    messages: uniqueStrings([...sourceWarnings, ...nestedSignals.messages]),
    details: uniqueWarningDetails([...sourceWarningDetails, ...nestedSignals.details]),
  };
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

export function LiveSourceMeta({ result, health, healthResult }: LiveSourceMetaProps) {
  if (!result) {
    return <p className="text-xs text-slate-400">Loading live source...</p>;
  }

  const checkedAt = new Date(result.checkedAt).toLocaleString();
  const sources = result.sources?.length ? result.sources : result.source ? [result.source] : [];
  const primarySource = sources[0];
  const secondarySources = sources.slice(1);
  const healthSource = healthResult?.source;
  const healthMatchesMetric = !healthSource || sources.length === 0 ||
    sources.some((source) => sameSourceGroup(source.url, healthSource.url));
  const resolvedHealth = healthMatchesMetric ? (healthResult ? healthResult.data : health) : undefined;
  const healthUnavailable = Boolean(healthResult && !healthResult.data && healthMatchesMetric);
  const primaryBadge = sourceBadge(result, resolvedHealth, healthUnavailable, !healthMatchesMetric);
  const warningSignals = collectWarningSignals(result.data);
  const warningDetails = warningSignals.details.length
    ? warningSignals.details
    : warningSignals.messages.map((message) => ({
      severity: 'warning' as const,
      category: 'other' as const,
      message,
      action: 'Review this source warning before treating the live value as clean.',
    }));
  const warningCount = warningDetails.length;
  const hiddenKeyCount = warningDetails.reduce((count, detail) => count + countHiddenKeys(detail, detail.message), 0);
  const previewWarnings = warningDetails.slice(0, 3);
  const hiddenWarningCount = Math.max(0, warningDetails.length - previewWarnings.length);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <Badge variant={primaryBadge.variant}>{primaryBadge.label}</Badge>
        <span>Checked {checkedAt}</span>
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
                <li key={`${detail.severity}:${detail.category}:${detail.message}`} className="leading-relaxed">
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
