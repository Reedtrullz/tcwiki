import {
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
} from '@/lib/data/static';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/layout/PageContainer';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'THORChain Governance And History | THORChain Wiki',
  description: 'Source-backed THORChain governance records, Mimir context, milestones, incident history, recovery tracker, and research.',
  path: '/governance',
});

export default function GovernancePage() {
  const currentRecoveryRecords = SECURITY_INCIDENT_RECORDS.filter((record) => !record.data.resolved);

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Governance & History</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        ADRs, Mimir context, milestones, incidents, and research. Vote percentages are shown only when source-backed.
      </p>

      <section id="current-recovery" className="scroll-mt-24 mb-12">
        <SectionHeader>Current Incident & Recovery Tracker</SectionHeader>
        <p className="mb-4 max-w-3xl text-sm text-slate-500">
          Conservative tracker for open or needs-review incident and recovery records. These entries are curated snapshots; use the linked sources and live THORNode status before making current operational claims.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentRecoveryRecords.map((record) => {
            const incident = record.data;
            return (
              <Card key={`current:${incident.id}`} className="border-amber-500/20 bg-amber-500/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{incident.title}</h3>
                  <Badge variant={record.freshness.confidence === 'needs-review' ? 'danger' : 'warning'}>
                    {record.freshness.confidence === 'needs-review' ? 'Needs current review' : 'Open / current-only'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">{incident.description}</p>
                <p className="mt-2 text-xs text-amber-300">{incident.impact}</p>
                <div className="mt-3">
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <SectionHeader>Governance Records</SectionHeader>
      <div className="space-y-2 mb-12">
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
                  <p className="text-xs text-slate-500">{proposal.description}</p>
                </div>
                <Badge variant={proposal.status === 'Live' ? 'success' : proposal.status.includes('Needs') ? 'warning' : 'info'} className="shrink-0">
                  {proposal.status}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-600">
                <span>{proposal.type}</span>
                <span>Created: {proposal.createdDate}</span>
                <span>Review: {proposal.expiryDate}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Milestones</h2>
          <div className="space-y-0">
            {PROTOCOL_MILESTONE_RECORDS.map((record) => (
              <div
                key={`${record.data.date}-${record.data.title}`}
                id={recordAnchor('milestone', `${record.data.date}-${record.data.title}`)}
                className="scroll-mt-24 flex gap-3 py-2.5 border-b border-border last:border-0"
              >
                <span className="text-[11px] text-slate-600 font-mono shrink-0 w-20">{record.data.date}</span>
                <div>
                  <p className="text-sm font-medium">{record.data.title}</p>
                  <p className="text-xs text-slate-500">{record.data.description}</p>
                  <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Security Incidents</h2>
          <div className="space-y-2">
            {SECURITY_INCIDENT_RECORDS.map((record) => {
              const incident = record.data;
              return (
                <Card key={incident.id} id={recordAnchor('incident', incident.id)} className="scroll-mt-24">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-sm font-semibold">{incident.title}</h3>
                    <Badge variant={incident.resolved ? 'success' : 'warning'}>{incident.resolved ? 'Resolved' : 'Open / needs review'}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {incident.description} <span className="text-amber-300">{incident.impact}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {incident.lessons.map((lesson) => (
                      <span key={lesson} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{lesson}</span>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <FreshnessMeta freshness={record.freshness} sources={record.sources} />
                    {incident.url && (
                      <a
                        href={incident.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-[11px] text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
                      >
                        Incident source
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Research</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RESEARCH_REPORT_RECORDS.map((record) => {
          const report = record.data;
          return (
            <Card key={report.id} id={recordAnchor('research', report.id)} hover className="scroll-mt-24">
              <p className="text-[11px] text-slate-500 mb-1">{report.date} · {report.source} · {report.author}</p>
              <h3 className="text-sm font-semibold mb-2">{report.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{report.summary}</p>
              <div className="mt-3">
                <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
              </div>
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex text-[11px] text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
              >
                Research source
              </a>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
