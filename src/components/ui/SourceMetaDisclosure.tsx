import type { ReactNode } from 'react';
import type { SourceMeta } from '@/lib/types';
import { cn } from '@/lib/utils';

export function hasSourceDetails(source: SourceMeta): boolean {
  return Boolean(source.retrievedAt || source.notes);
}

export function SourceMetaLink({
  source,
  children,
  className,
}: {
  source: SourceMeta;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'min-w-0 max-w-full break-words text-slate-400 transition-colors [overflow-wrap:anywhere] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        className
      )}
    >
      {children}
    </a>
  );
}

export function SourceMetaDetails({
  source,
  compact = false,
  summaryLabel,
  className,
}: {
  source: SourceMeta;
  compact?: boolean;
  summaryLabel?: string;
  className?: string;
}) {
  if (!hasSourceDetails(source)) {
    return null;
  }

  return (
    <details className={cn('inline-block max-w-full align-baseline [overflow-wrap:anywhere]', className)}>
      <summary
        aria-label={`Show source retrieval details for ${source.label}`}
        className="inline max-w-full cursor-pointer list-none break-words text-slate-400 underline decoration-dotted underline-offset-4 [overflow-wrap:anywhere] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {summaryLabel ?? (compact ? 'retrieval details' : 'source retrieval details')}
      </summary>
      <div className="mt-1 flex max-w-[min(20rem,calc(100vw-2rem))] flex-col gap-1 rounded border border-border bg-surface px-2 py-1 leading-relaxed text-slate-400 [overflow-wrap:anywhere]">
        {source.retrievedAt && <span>Source retrieved {source.retrievedAt}</span>}
        {source.notes && <span>{source.notes}</span>}
      </div>
    </details>
  );
}

export function AdditionalSourceDisclosure({
  sources,
  primaryLabel,
  itemLabelSingular = 'source',
  itemLabelPlural = 'sources',
  renderSource,
  panelClassName,
  className,
}: {
  sources: SourceMeta[];
  primaryLabel: string;
  itemLabelSingular?: string;
  itemLabelPlural?: string;
  renderSource?: (source: SourceMeta) => ReactNode;
  panelClassName?: string;
  className?: string;
}) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <details className={cn('inline-block min-w-0 max-w-full', className)}>
      <summary
        aria-label={`Show ${sources.length} additional ${sources.length === 1 ? itemLabelSingular : itemLabelPlural} for ${primaryLabel}`}
        className="inline cursor-pointer list-none break-words text-slate-400 underline decoration-dotted underline-offset-4 [overflow-wrap:anywhere] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        +{sources.length} {sources.length === 1 ? itemLabelSingular : itemLabelPlural}
      </summary>
      <div
        className={cn(
          'mt-1 flex max-w-[min(42rem,calc(100vw-2rem))] flex-wrap gap-x-2 gap-y-1 rounded border border-border bg-surface px-2 py-1 [overflow-wrap:anywhere]',
          panelClassName
        )}
      >
        {sources.map((source) => (
          <span key={`${source.label}-${source.url}`} className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1 [overflow-wrap:anywhere]">
            {renderSource ? renderSource(source) : (
              <>
                <SourceMetaLink source={source}>{source.label}</SourceMetaLink>
                <SourceMetaDetails source={source} compact />
              </>
            )}
          </span>
        ))}
      </div>
    </details>
  );
}
