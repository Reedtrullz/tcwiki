import { LiveDataResult, MidgardHealth, SourceHealthSeverity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { liveResultHasSourceWarnings } from '@/lib/live-result';

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

function sourceBadge(result: LiveDataResult<unknown>, health: MidgardHealth | undefined, healthUnavailable: boolean) {
  if (result.status === 'degraded') {
    return { label: 'Degraded', variant: 'warning' as const };
  }
  if (healthUnavailable || health?.severity === 'degraded') {
    return { label: 'Source degraded', variant: 'danger' as const };
  }
  if (liveResultHasSourceWarnings(result) || health?.severity === 'warning' || health?.severity === 'unknown') {
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

export function LiveSourceMeta({ result, health, healthResult }: LiveSourceMetaProps) {
  if (!result) {
    return <p className="text-xs text-slate-400">Loading live source...</p>;
  }

  const checkedAt = new Date(result.checkedAt).toLocaleString();
  const sources = result.sources?.length ? result.sources : result.source ? [result.source] : [];
  const healthSource = healthResult?.source;
  const healthMatchesMetric = !healthSource || sources.length === 0 ||
    sources.some((source) => sameSourceGroup(source.url, healthSource.url));
  const resolvedHealth = healthMatchesMetric ? (healthResult ? healthResult.data : health) : undefined;
  const healthUnavailable = Boolean(healthResult && !healthResult.data && healthMatchesMetric);
  const primaryBadge = sourceBadge(result, resolvedHealth, healthUnavailable);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        <Badge variant={primaryBadge.variant}>{primaryBadge.label}</Badge>
        <span>Checked {checkedAt}</span>
        {sources.length > 0 && (
          <span role="list" aria-label="Live data sources" className="contents">
            {sources.map((source) => (
              <span key={`${source.label}-${source.url}`} role="listitem" className="inline-flex">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {source.label}
                </a>
              </span>
            ))}
          </span>
        )}
      </div>
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
          <span>Metric via {sources.map((source) => source.label).join(', ') || 'unknown source'}</span>
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
