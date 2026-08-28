
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
  buildCurrentRecoveryRecords,
  buildArchiveLanes,
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
import { GovernanceRecoveryTracker } from '@/components/features/GovernanceRecoveryTracker';
import { GovernanceArchiveMap } from '@/components/features/GovernanceArchiveMap';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'THORChain Governance And History | THORChain Wiki',
  description: 'Source-backed THORChain governance records, Mimir context, milestones, incident history, recovery tracker, and research.',
  path: '/governance',
});

const entry = getContentEntry('governance');

export default function GovernancePage() {
  const { records: currentRecoveryRecords, summary: currentRecoveryRecordSummary } = buildCurrentRecoveryRecords();
  const archiveLanes = buildArchiveLanes(currentRecoveryRecords.length);

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

      <div id="current-recovery" className="scroll-mt-24">
        <GovernanceRecoveryTracker
          currentRecoveryRecords={currentRecoveryRecords}
          currentRecoveryRecordSummary={currentRecoveryRecordSummary}
        />
      </div>

      <div id="governance-archive-map" className="mb-12 scroll-mt-24">
        <GovernanceArchiveMap archiveLanes={archiveLanes} />
      </div>

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
