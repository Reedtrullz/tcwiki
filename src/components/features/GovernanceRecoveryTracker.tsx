import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { recoveryClaimChecks } from '@/lib/data/governance-page';
import type { RecoveryRecord, RecoveryRecordSummary } from '@/lib/data/governance-page';

interface GovernanceRecoveryTrackerProps {
  currentRecoveryRecords: RecoveryRecord[];
  currentRecoveryRecordSummary: RecoveryRecordSummary[];
}

export function GovernanceRecoveryTracker({
  currentRecoveryRecords,
  currentRecoveryRecordSummary,
}: GovernanceRecoveryTrackerProps) {
  return (
    <section className="mb-12">
      <SectionHeader level="primary">Current Incident & Recovery Tracker</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        Conservative tracker for records explicitly tagged as current or needing current recovery review. Historical unresolved records remain in the incident archive below unless they are re-verified for current tracking.
      </p>
      <details className="group mb-4" open={true}>
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-300">
          Show summary and claim-check detail
          <span className="transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        {currentRecoveryRecordSummary.map((item) => (
          <Card key={item.label} padding="sm" className="border-border">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-100">{item.value}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
          </Card>
        ))}
        </div>
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {recoveryClaimChecks.map((item) => (
          <Card key={item.claim} padding="sm" className="border-amber-500/15">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Check Before Claiming</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-200">{item.claim}</h3>
            <dl className="mt-3 space-y-2 text-xs leading-relaxed text-slate-400">
              <div>
                <dt className="font-semibold text-slate-300">Start with</dt>
                <dd>{item.startWith}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-300">Verify</dt>
                <dd>{item.verify}</dd>
              </div>
              <div>
                <dt className="font-semibold text-amber-300">Do not claim</dt>
                <dd>{item.avoid}</dd>
              </div>
            </dl>
          </Card>
        ))}
        </div>
      </details>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {currentRecoveryRecords.map((record) => (
          <Card key={record.id}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{record.recordType}</p>
                <h3 className="mt-1 text-sm font-semibold">{record.title}</h3>
              </div>
              <Badge variant={record.badge.variant}>{record.badge.label}</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{record.description}</p>
            <p className="mt-2 text-xs text-slate-400">{record.impact}</p>
            <dl className="mt-4 space-y-3 rounded-md border border-border bg-surface p-3 text-xs leading-relaxed text-slate-400">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">Use This For</dt>
                <dd className="mt-1">{record.guidance.focus}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">Verify Next</dt>
                <dd className="mt-1">
                  <ul className="space-y-1">
                    {record.guidance.verifyNow.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-slate-500">Boundary</dt>
                <dd className="mt-1">{record.guidance.boundary}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
            <div className="mt-4 grid gap-2 border-t border-border pt-3 sm:grid-cols-2">
              <Link
                href={record.archiveHref}
                className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {record.archiveLinkLabel}
                <span className="mt-1 block font-normal leading-relaxed text-slate-400">
                  Jump to the full dated record and source metadata below.
                </span>
              </Link>
              <Link
                href="/network#network-diagnostics"
                className="rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Check current diagnostics
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
