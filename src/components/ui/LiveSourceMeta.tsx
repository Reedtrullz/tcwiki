import { LiveDataResult, MidgardHealth, SourceHealthSeverity } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

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

export function LiveSourceMeta({ result, health, healthResult }: LiveSourceMetaProps) {
  if (!result) {
    return <p className="text-[11px] text-slate-600">Loading live source...</p>;
  }

  const checkedAt = new Date(result.checkedAt).toLocaleString();
  const sources = result.sources?.length ? result.sources : result.source ? [result.source] : [];
  const resolvedHealth = healthResult ? healthResult.data : health;
  const healthUnavailable = Boolean(healthResult && !healthResult.data);

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <Badge variant={result.status === 'ok' ? 'success' : 'warning'}>
          {result.status === 'ok' ? 'Current-only' : 'Degraded'}
        </Badge>
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
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
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
      {healthUnavailable && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
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
