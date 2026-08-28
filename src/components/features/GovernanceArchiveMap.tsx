import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { ArchiveLane } from '@/lib/data/governance-page';

interface GovernanceArchiveMapProps {
  archiveLanes: ArchiveLane[];
}

export function GovernanceArchiveMap({ archiveLanes }: GovernanceArchiveMapProps) {
  return (
    <section className="mb-12">
      <div className="mb-4 max-w-3xl">
        <SectionHeader className="mb-3" level="primary">Dated Archive Map</SectionHeader>
        <p className="text-sm leading-relaxed text-slate-400">
          Use the lane map before diving into the archive. Counts are navigation aids, not health scores, and every lane still needs the claim-specific checks above.
          Read each record or posture badge on its own terms before treating dated material as current protocol behavior.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {archiveLanes.map((lane) => (
          <Link
            key={lane.title}
            href={lane.href}
            className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant={lane.badgeVariant}>{lane.badge}</Badge>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{lane.count} records</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-100">{lane.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{lane.summary}</p>
            <dl className="mt-4 space-y-2 border-t border-border pt-3 text-[11px] leading-relaxed text-slate-400">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">Archive mix</dt>
                <dd>{lane.countLabel}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </div>
    </section>
  );
}
