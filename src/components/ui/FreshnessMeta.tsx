import type { ReactNode } from 'react';
import type { FreshnessMeta as FreshnessMetaType, SourceMeta } from '@/lib/types';
import { getConfidenceLabel, getConfidenceTone, getFreshnessLabel } from '@/lib/trust';
import { Badge } from '@/components/ui/Badge';

interface FreshnessMetaProps {
  freshness: FreshnessMetaType;
  sources?: SourceMeta[];
  compact?: boolean;
}

function hasSourceDetails(source: SourceMeta): boolean {
  return Boolean(source.retrievedAt || source.notes);
}

function SourceDetails({ source, compact }: { source: SourceMeta; compact: boolean }) {
  if (!hasSourceDetails(source)) {
    return null;
  }

  return (
    <details className="inline-block align-baseline">
      <summary
        aria-label={`Show source details for ${source.label}`}
        className="inline cursor-pointer list-none text-slate-400 underline decoration-dotted underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {compact ? 'details' : 'source details'}
      </summary>
      <div className="mt-1 flex max-w-xs flex-col gap-1 rounded border border-border bg-surface px-2 py-1 leading-relaxed text-slate-400">
        {source.retrievedAt && <span>Retrieved {source.retrievedAt}</span>}
        {source.notes && <span>{source.notes}</span>}
      </div>
    </details>
  );
}

function SourceLink({ source, children }: { source: SourceMeta; children: ReactNode }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-slate-400 transition-colors hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {children}
    </a>
  );
}

export function FreshnessMeta({ freshness, sources = [], compact = false }: FreshnessMetaProps) {
  const primarySource = sources[0];
  const secondarySources = sources.slice(1);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
      <Badge variant={getConfidenceTone(freshness.confidence)}>
        {getConfidenceLabel(freshness.confidence)}
      </Badge>
      <span>{getFreshnessLabel(freshness)}</span>
      {freshness.nextReviewDue && (
        <>
          <span>·</span>
          <span>Review due {freshness.nextReviewDue}</span>
        </>
      )}
      {freshness.reviewedBy && (
        <>
          <span>·</span>
          <span>Reviewed by {freshness.reviewedBy}</span>
        </>
      )}
      {primarySource && (
        <>
          <span>·</span>
          <div className="inline-flex flex-wrap items-center gap-1">
            <SourceLink source={primarySource}>
              {compact ? primarySource.label : `Source: ${primarySource.label}`}
            </SourceLink>
            <SourceDetails source={primarySource} compact={compact} />
            {secondarySources.length > 0 && (
              <details className="inline-block">
                <summary
                  aria-label={`Show ${secondarySources.length} additional source${secondarySources.length === 1 ? '' : 's'} for ${primarySource.label}`}
                  className="inline cursor-pointer list-none text-slate-400 underline decoration-dotted underline-offset-4 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  +{secondarySources.length} source{secondarySources.length === 1 ? '' : 's'}
                </summary>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 rounded border border-border bg-surface px-2 py-1">
                  {secondarySources.map((source) => (
                    <span key={`${source.label}-${source.url}`} className="inline-flex flex-wrap items-center gap-1">
                      <SourceLink source={source}>{source.label}</SourceLink>
                      <SourceDetails source={source} compact />
                    </span>
                  ))}
                </div>
              </details>
            )}
          </div>
        </>
      )}
    </div>
  );
}
