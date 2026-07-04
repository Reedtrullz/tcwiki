import type { ContentEntry } from '@/lib/content/registry';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';

interface RouteSourcePostureProps {
  entry: ContentEntry;
  useFor: string[];
  verifyBeforeClaiming: string[];
  className?: string;
}

export function RouteSourcePosture({
  entry,
  useFor,
  verifyBeforeClaiming,
  className,
}: RouteSourcePostureProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Page Source Posture</p>
          <FreshnessMeta
            freshness={{
              checkedAt: entry.reviewedAt,
              confidence: entry.confidence,
              nextReviewDue: entry.nextReviewDue,
            }}
            sources={entry.sources}
            compact
          />
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-slate-400">
          {entry.description}
        </p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Use This Page For</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
            {useFor.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Verify Elsewhere Before Claiming</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-300">
            {verifyBeforeClaiming.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}
