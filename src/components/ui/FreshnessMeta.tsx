import type { FreshnessMeta as FreshnessMetaType, SourceMeta } from '@/lib/types';
import { getConfidenceLabel, getConfidenceTone, getFreshnessLabel } from '@/lib/trust';
import { Badge } from '@/components/ui/Badge';
import { AdditionalSourceDisclosure, SourceMetaDetails, SourceMetaLink } from '@/components/ui/SourceMetaDisclosure';

interface FreshnessMetaProps {
  freshness: FreshnessMetaType;
  sources?: SourceMeta[];
  compact?: boolean;
}

export function FreshnessMeta({ freshness, sources = [], compact = false }: FreshnessMetaProps) {
  const primarySource = sources[0];
  const secondarySources = sources.slice(1);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] text-slate-400">
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
          <div className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1">
            <SourceMetaLink source={primarySource}>
              {compact ? primarySource.label : `Source: ${primarySource.label}`}
            </SourceMetaLink>
            <SourceMetaDetails source={primarySource} compact={compact} />
            <AdditionalSourceDisclosure sources={secondarySources} primaryLabel={primarySource.label} />
          </div>
        </>
      )}
    </div>
  );
}
