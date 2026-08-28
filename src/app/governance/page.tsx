import Link from 'next/link';
import {
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
} from '@/lib/data/static';
import {
  governanceToc,
  governanceRelatedChecks,
  governanceClaimChecks,
  recoveryClaimChecks,
  recoveryReviewGuidanceById,
  archiveLaneBadgeVariants,
} from '@/lib/data/governance-page';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { PageTableOfContents } from '@/components/layout/PageTableOfContents';
import { RelatedChecks } from '@/components/features/RelatedChecks';
import { GovernanceIncidentArchiveExplorer } from '@/components/features/GovernanceIncidentArchiveExplorer';
import { ClaimCheckCard } from '@/components/features/ClaimCheckCard';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'THORChain Governance And History | THORChain Wiki',
  description: 'Source-backed THORChain governance records, Mimir context, milestones, incident history, recovery tracker, and research.',
  path: '/governance',
});

const entry = getContentEntry('governance');


function recoveryReviewGuidance(id: string) {
  return recoveryReviewGuidanceById[id] ?? {
    focus: 'Promoted recovery record that needs claim-specific review before present-tense wording.',
    verifyNow: [
      'Open the dated record and source metadata.',
      'Check current Network diagnostics and relevant product controls.',
      'Look for newer official sources before claiming final recovery or user-action availability.',
    ],
    boundary: 'Do not use tracker inclusion alone as proof of current safety, solvency, restitution, or product availability.',
  };
}

function incidentTrackerBadge(status: 'current' | 'needs-review') {
  return status === 'needs-review'
    ? { label: 'Needs current review', variant: 'danger' as const }
    : { label: 'Explicit current tracker', variant: 'warning' as const };
}

function governanceRecoveryTrackerBadge(status: string) {
  return status.toLowerCase().includes('needs')
    ? { label: 'Needs current review', variant: 'danger' as const }
    : { label: 'Explicit recovery tracker', variant: 'warning' as const };
}

export default function GovernancePage() {
  const currentIncidentRecords = SECURITY_INCIDENT_RECORDS
    .flatMap((record) => {
      const trackerStatus = record.data.trackerStatus;
      if (trackerStatus !== 'current' && trackerStatus !== 'needs-review') {
        return [];
      }
      return [{
        id: `incident:${record.data.id}`,
        title: record.data.title,
        description: record.data.description,
        impact: record.data.impact,
        badge: incidentTrackerBadge(trackerStatus),
        freshness: record.freshness,
        sources: record.sources,
        recordType: 'Incident record',
        archiveHref: `/governance#${recordAnchor('incident', record.data.id)}`,
        archiveLinkLabel: 'Open incident record',
        guidance: recoveryReviewGuidance(`incident:${record.data.id}`),
      }];
    });
  const currentGovernanceRecoveryRecords = GOVERNANCE_PROPOSAL_RECORDS
    .filter((record) => record.data.trackerStatus === 'current' || record.data.trackerStatus === 'needs-review')
    .map((record) => ({
      id: `governance:${record.data.id}`,
      title: record.data.title,
      description: record.data.description,
      impact: record.data.status,
      badge: governanceRecoveryTrackerBadge(record.data.status),
      freshness: record.freshness,
      sources: record.sources,
      recordType: 'Governance record',
      archiveHref: `/governance#${recordAnchor('governance', record.data.id)}`,
      archiveLinkLabel: 'Open governance record',
      guidance: recoveryReviewGuidance(`governance:${record.data.id}`),
    }));
  const currentRecoveryRecords = [...currentIncidentRecords, ...currentGovernanceRecoveryRecords];
  const currentRecoveryRecordSummary = [
    {
      label: 'Tracked records',
      value: String(currentRecoveryRecords.length),
      description: 'Current or needs-review records promoted from the full governance and incident archive.',
    },
    {
      label: 'Evidence path',
      value: 'Record + live check',
      description: 'Use the full dated record first, then current Network diagnostics before present-tense claims.',
    },
  ];
  const operationalGovernanceRecords = GOVERNANCE_PROPOSAL_RECORDS.filter((record) => (
    record.data.status === 'Live' ||
    record.data.votingPeriod.toLowerCase().includes('current-only') ||
    record.data.status.toLowerCase().includes('live')
  ));
  const currentOrReviewIncidentRecords = SECURITY_INCIDENT_RECORDS.filter((record) => (
    record.data.trackerStatus === 'current' ||
    record.data.trackerStatus === 'needs-review' ||
    record.freshness.confidence === 'needs-review'
  ));
  const historicalOpenIncidentRecords = SECURITY_INCIDENT_RECORDS.filter((record) => (
    record.data.trackerStatus === 'historical-open' ||
    (!record.data.resolved && record.data.trackerStatus !== 'current' && record.data.trackerStatus !== 'needs-review')
  ));
  const archiveLanes = [
    {
      title: 'Current recovery lane',
      badge: 'current review',
      badgeVariant: archiveLaneBadgeVariants.warning,
      href: '#current-recovery',
      count: currentRecoveryRecords.length,
      countLabel: 'promoted records',
      summary: 'Start here for records explicitly promoted from the archive into current recovery review.',
    },
    {
      title: 'Governance records lane',
      badge: 'dated + live',
      badgeVariant: archiveLaneBadgeVariants.info,
      href: '#governance-records',
      count: GOVERNANCE_PROPOSAL_RECORDS.length,
      countLabel: `${operationalGovernanceRecords.length} operational/current-only`,
      summary: 'Use for ADRs, operational parameters, recovery-path records, and historical unwind context.',
    },
    {
      title: 'Incident archive lane',
      badge: 'security history',
      badgeVariant: archiveLaneBadgeVariants.danger,
      href: '#security-incidents',
      count: SECURITY_INCIDENT_RECORDS.length,
      countLabel: `${currentOrReviewIncidentRecords.length} current/review, ${historicalOpenIncidentRecords.length} historical-open`,
      summary: 'Use for exploit root-cause, illicit-flow, and recovery-history records without flattening them into today.',
    },
    {
      title: 'Research and milestones lane',
      badge: 'dated context',
      badgeVariant: archiveLaneBadgeVariants.default,
      href: '#protocol-milestones',
      count: PROTOCOL_MILESTONE_RECORDS.length + RESEARCH_REPORT_RECORDS.length,
      countLabel: `${PROTOCOL_MILESTONE_RECORDS.length} milestones, ${RESEARCH_REPORT_RECORDS.length} reports`,
      summary: 'Use for timeline context and third-party or ecosystem analysis before checking current evidence.',
    },
  ];

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Governance & History</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        ADRs, Mimir context, milestones, incidents, and research. Vote percentages are shown only when source-backed.
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      <PageSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'Source-backed ADR, Mimir, incident, milestone, and recovery-history context.',
          'Dated incident and governance records with explicit current-review labels.',
        ]}
        verifyBeforeClaiming={[
          'Current node consensus, live Mimir values, active recovery status, or final governance outcome.',
          'That a historical incident record proves present-day network safety or solvency.',
        ]}
      />
      <RelatedChecks
        checks={governanceRelatedChecks}
        className="mb-12"
        title="Continue From Here"
        description="Move from dated governance and incident records into current diagnostics, recovery review, or the historical recovery path before making present-tense claims."
        badgeLabel="claim path"
      />

      <div id="governance-claim-checks" className="scroll-mt-24"><details className="mb-12 rounded-lg border border-border bg-surface-elevated px-4 py-3">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          Claim checks by type
        </summary>
        {/* Legacy anchor for registry and search links that target the proposal-status claim check. */}
        <span id="governance-proposal-status" className="sr-only" aria-hidden="true" />
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
          Start with the claim type. Governance records are useful for dated decisions and history; live controls, incident root-cause wording, recovery status, and community interpretation need separate proof paths.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {governanceClaimChecks.map((check) => (
            <ClaimCheckCard
              key={check.title}
              id={recordAnchor('claim-check', check.title)}
              anchorId={check.id}
              badge={check.badge}
              badgeVariant={check.badgeVariant}
              title={check.title}
              use={check.use}
              verify={check.verify}
              avoid={check.avoid}
              href={check.href}
              linkLabel={check.linkLabel}
            />
          ))}
        </div>
      </details>
      </div>

      <section id="current-recovery" className="scroll-mt-24 mb-12">
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
            <Card key={`current:${record.id}`}>
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

      <section id="governance-archive-map" className="mb-12 scroll-mt-24">
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

      <section id="governance-records" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3" level="primary">Governance Records</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Dated governance and operational records. The status badge describes the record evidence posture; use live diagnostics before turning it into a current action claim.
          </p>
        </div>
        <div className="space-y-2">
          {GOVERNANCE_PROPOSAL_RECORDS.map((record) => {
            const proposal = record.data;
            return (
              <Card key={proposal.id} id={recordAnchor('governance', proposal.id)} className="scroll-mt-24">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono text-accent">{proposal.id}</span>
                      <h3 className="text-sm font-semibold">{proposal.title}</h3>
                    </div>
                    <p className="text-xs text-slate-400">{proposal.description}</p>
                  </div>
                  <Badge variant={proposal.status === 'Live' ? 'success' : proposal.status.includes('Needs') ? 'warning' : 'info'} className="shrink-0">
                    {proposal.status}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
                  <span>{proposal.type}</span>
                  <span>Created: {proposal.createdDate}</span>
                  <span>Record status: {proposal.expiryDate}</span>
                  {proposal.votesFor !== undefined && <span>For: {proposal.votesFor}%</span>}
                  {proposal.votesAgainst !== undefined && <span>Against: {proposal.votesAgainst}%</span>}
                  {proposal.threshold !== undefined && <span>Threshold: {proposal.threshold}%</span>}
                </div>
                <div className="mt-3">
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <section id="protocol-milestones" className="scroll-mt-24">
          <SectionHeader level="primary">Milestones</SectionHeader>
          <div className="space-y-0">
            {PROTOCOL_MILESTONE_RECORDS.map((record) => (
              <div
                key={`${record.data.date}-${record.data.title}`}
                id={recordAnchor('milestone', `${record.data.date}-${record.data.title}`)}
                className="scroll-mt-24 flex gap-3 py-2.5 border-b border-border last:border-0"
              >
                <span className="text-[11px] text-slate-400 font-mono shrink-0 w-20">{record.data.date}</span>
                <div>
                  <p className="text-sm font-medium">{record.data.title}</p>
                  <p className="text-xs text-slate-400">{record.data.description}</p>
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>
              </div>
            ))}
          </div>
        </section>

        <GovernanceIncidentArchiveExplorer incidentRecords={SECURITY_INCIDENT_RECORDS} />
      </div>

      <section id="governance-research" className="scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader level="primary">Research</SectionHeader>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Dated analysis and roadmap context. Treat these as period framing until current protocol, route, or recovery sources agree.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RESEARCH_REPORT_RECORDS.map((record) => {
            const report = record.data;
            return (
              <Card key={report.id} id={recordAnchor('research', report.id)} hover className="scroll-mt-24">
                <p className="text-[11px] text-slate-400 mb-1">{report.date} · {report.source} · {report.author}</p>
                <h3 className="text-sm font-semibold mb-2">{report.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{report.summary}</p>
                <div className="mt-3">
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-[11px] text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline"
                >
                  Research source
                </a>
              </Card>
            );
          })}
        </div>
      </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={governanceToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
