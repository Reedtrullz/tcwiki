import type { ContentEntry } from '@/lib/content/registry';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { cn } from '@/lib/utils';

interface PageSourcePostureProps {
  entry: ContentEntry;
  useFor: string[];
  verifyBeforeClaiming: string[];
  /** Anchor id so the page TOC can link to the single posture block. */
  id?: string;
  className?: string;
}

/**
 * Canonical, single source-posture surface for a page.
 *
 * Pages should render this ONCE (replacing the previous pattern of a
 * RouteSourcePosture banner plus scattered per-section LiveSourceMeta /
 * FreshnessMeta / "do not claim" boxes). The verify list is collapsed by
 * default so the disclaimer voice stops competing with the content above the
 * fold; the freshness line stays visible because that is the genuinely useful
 * provenance signal.
 */
export function PageSourcePosture({
  entry,
  useFor,
  verifyBeforeClaiming,
  id = 'page-source-posture',
  className,
}: PageSourcePostureProps) {
  return (
    <section
      id={id}
      role="region"
      aria-label="Source and freshness"
      className={cn(
        'rounded-lg border border-border bg-surface-elevated px-4 py-3',
        className
      )}
    >
      <details className="group" open={false}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          <span className="min-w-0">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Source &amp; freshness
            </span>
            <FreshnessMeta
              freshness={{
                checkedAt: entry.reviewedAt,
                confidence: entry.confidence,
                nextReviewDue: entry.nextReviewDue,
              }}
              sources={entry.sources}
              compact
            />
          </span>
          <span className="shrink-0 text-[11px] text-slate-500 transition-colors group-hover:text-slate-300">
            How to use this page ▾
          </span>
        </summary>
        <div className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2">
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Use this page for</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
              {useFor.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
          <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Verify elsewhere before claiming</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
              {verifyBeforeClaiming.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
}
