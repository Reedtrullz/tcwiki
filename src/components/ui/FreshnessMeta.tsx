import { FreshnessMeta as FreshnessMetaType, SourceMeta } from '@/lib/types';
import { getConfidenceLabel, getConfidenceTone, getFreshnessLabel } from '@/lib/trust';
import { Badge } from '@/components/ui/Badge';

interface FreshnessMetaProps {
  freshness: FreshnessMetaType;
  sources?: SourceMeta[];
  compact?: boolean;
}

export function FreshnessMeta({ freshness, sources = [], compact = false }: FreshnessMetaProps) {
  const primarySource = sources[0];

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
      <Badge variant={getConfidenceTone(freshness.confidence)}>
        {getConfidenceLabel(freshness.confidence)}
      </Badge>
      <span>{getFreshnessLabel(freshness)}</span>
      {primarySource && (
        <>
          <span>·</span>
          <a
            href={primarySource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            {compact ? primarySource.label : `Source: ${primarySource.label}`}
          </a>
        </>
      )}
    </div>
  );
}
