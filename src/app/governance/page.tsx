import Link from 'next/link';
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
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { GovernanceIncidentArchiveExplorer } from '@/components/features/GovernanceIncidentArchiveExplorer';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'THORChain Governance And History | THORChain Wiki',
  description: 'Source-backed THORChain governance records, Mimir context, milestones, incident history, recovery tracker, and research.',
  path: '/governance',
});

const entry = getContentEntry('governance');

const governanceRelatedChecks: RelatedCheck[] = [
  {
    label: 'Recovery tracker',
    href: '/governance#current-recovery',
    badge: 'current review',
    description: 'Start with records explicitly tagged as current or needing current recovery review.',
  },
  {
    label: 'TCY timeline',
    href: '/deep-dives/tcy-recovery-timeline#timeline',
    badge: 'deep dive',
    description: 'Separate the THORFi/TCY debt timeline from later exploit-recovery records.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'live state',
    description: 'Check current halts, signing, and source warnings before extending a dated record to now.',
  },
  {
    label: 'Mimir halt guide',
    href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
    badge: 'guide',
    description: 'Separate operational halt evidence from historical governance or recovery records.',
  },
];

const governanceClaimChecks = [
  {
    title: 'Operational Mimir claim',
    badge: 'live state',
    badgeVariant: 'warning' as const,
    use: 'Whether trading, signing, LP actions, churning, TCY controls, or chain operations are active now.',
    verify: 'Use Network diagnostics and current THORNode/Mimir evidence before using present-tense availability wording.',
    avoid: 'Do not infer live availability from a proposal, incident archive, milestone, or missing halt mention.',
    href: '/network#network-diagnostics',
    linkLabel: 'Check live diagnostics',
  },
  {
    id: 'governance-proposal-status',
    title: 'ADR or proposal status',
    badge: 'dated record',
    badgeVariant: 'info' as const,
    use: 'What an ADR, proposal, milestone, or governance record said at the cited review point.',
    verify: 'Use the record source, source-map guidance, and any linked live tracker before calling a design active.',
    avoid: 'Do not treat proposed, draft, needs-review, or historical records as final live protocol behavior.',
    href: '/docs#official-protocol-documentation',
    linkLabel: 'Check official sources',
  },
  {
    title: 'Incident root-cause claim',
    badge: 'security history',
    badgeVariant: 'danger' as const,
    use: 'Exploit cause, affected vault/chain scope, patch wording, migration context, and dated security lessons.',
    verify: 'Use incident reports plus the Network Security path before summarizing safety or cryptographic details.',
    avoid: 'Do not convert a dated exploit report, restart, or patch into proof of present-day safety.',
    href: '/deep-dives#deep-dive-path-network-security',
    linkLabel: 'Read security path',
  },
  {
    title: 'Recovery or solvency claim',
    badge: 'current review',
    badgeVariant: 'warning' as const,
    use: 'Post-exploit recovery state, THORFi/TCY recovery framing, and records tagged for current review.',
    verify: 'Use the current recovery tracker, TCY recovery timeline, dated upgrade notes, and live diagnostics together.',
    avoid: 'Do not claim final recovery, par redemption, current solvency, or product availability from one record.',
    href: '#current-recovery',
    linkLabel: 'Review recovery tracker',
  },
  {
    title: 'Community sentiment claim',
    badge: 'context',
    badgeVariant: 'default' as const,
    use: 'Debate topics, open questions, or how contributors described tradeoffs in community channels.',
    verify: 'Use community sources only as context, then confirm protocol facts through official or live sources.',
    avoid: 'Do not present Discord chatter as canonical protocol proof or representative sentiment without sampling.',
    href: '/docs#community-channels',
    linkLabel: 'Check community boundary',
  },
];

const recoveryClaimChecks = [
  {
    claim: 'Savers or Lending are available now',
    startWith: 'Archived feature sources',
    verify: 'Official archived docs and any current interface/source claiming reactivation.',
    avoid: 'Do not describe archived mechanics as current deposit or borrowing instructions.',
  },
  {
    claim: 'A claimant can claim or stake TCY right now',
    startWith: 'TCY timeline plus live network diagnostics',
    verify: 'TCY guide, official claim interface, and TCY Mimir controls such as TCYCLAIMINGHALT or TCYSTAKINGHALT.',
    avoid: 'Do not infer availability from historical TCY launch copy alone.',
  },
  {
    claim: 'TCY restored the original debt value',
    startWith: 'TCY source caveats',
    verify: 'Market and distribution evidence outside this tracker; official developer docs say full recovery is not guaranteed.',
    avoid: 'Do not state par recovery, redemption value, or investment outcome as fact.',
  },
  {
    claim: 'Post-exploit recovery is complete',
    startWith: 'Current recovery tracker records',
    verify: 'Dated exploit reports, upgrade notes, ADR/proposal status, and live network diagnostics.',
    avoid: 'Do not convert a restart, patch, or proposal into proof of final recovery completion.',
  },
];

const recoveryStateMatrix = [
  {
    title: 'THORFi debt unwind',
    badge: 'historical',
    badgeVariant: 'info' as const,
    status: 'Deprecated products, TCY framing, and historical-open liabilities belong in dated THORFi and TCY records.',
    evidence: 'Use archived Savers/Lending docs, Proposal 6/TCY sources, and the TCY recovery timeline.',
    nonClaim: 'No made-whole proof, current Savers/Lending availability, or deposit/borrow instruction.',
    href: '/deep-dives/tcy-recovery-timeline#timeline',
    linkLabel: 'Open TCY timeline',
  },
  {
    title: 'GG20 exploit recovery',
    badge: 'current review',
    badgeVariant: 'warning' as const,
    status: 'The v3.19.x restart and accepted ADR-028 conciliation are separate from the earlier THORFi debt unwind and from the still-planned migration away from GG20.',
    evidence: 'Use exploit reports, v3.19 upgrade notes, the immutable accepted ADR-028 source, and full incident records.',
    nonClaim: 'No final recovery-complete or present-day safety proof.',
    href: '/deep-dives#deep-dive-path-network-security',
    linkLabel: 'Read TSS context',
  },
  {
    title: 'Current user actions',
    badge: 'live checks',
    badgeVariant: 'danger' as const,
    status: 'TCY claim, stake, distribution, unstake, claim-swap, and trading state are live-control questions.',
    evidence: 'Use Network diagnostics, TCY controls, official interface evidence, and source warnings.',
    nonClaim: 'No user eligibility, redemption value, or transaction-success proof.',
    href: '/tcy#tcy-current-controls',
    linkLabel: 'Check TCY controls',
  },
];

const recoveryReviewGuidanceById: Record<string, {
  focus: string;
  verifyNow: string[];
  boundary: string;
}> = {
  'incident:gg20-vault-exploit-2026': {
    focus: 'Dated official exploit, restart, patch, and migration context for the May 2026 GG20 vault incident.',
    verifyNow: [
      'Network diagnostics for current halts, signing, route limits, and source warnings.',
      'Security deep dives for the dated GG20/TSS attack scope and migration wording.',
      'TCY controls only when the claim is about current claim, stake, distribution, unstake, or trade actions.',
    ],
    boundary: 'Do not use the incident record, restart, or v3.19 notes as proof that recovery is complete, users are made whole, or present-day safety is guaranteed.',
  },
  'governance:adr-028-recovery': {
    focus: 'Accepted ADR-028 decision and one-time v3.19.0 conciliation migration for the May 2026 exploit-created accounting gap.',
    verifyNow: [
      'The immutable v3.19.0 ADR before describing its reserve, Saver, treasury, or stuck-swap allocation waterfall.',
      'Current release and Network diagnostics before converting the historical migration into present protocol availability or safety.',
      'TCY controls and official interface evidence before saying a user can claim, stake, trade, or receive distributions now.',
    ],
    boundary: 'ADR-028 acceptance proves the conciliation decision and migration design, not that every loss was restored, recovery is complete, current vaults are safe, or any user action is enabled.',
  },
};

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

const archiveLaneBadgeVariants = {
  warning: 'warning',
  info: 'info',
  danger: 'danger',
  default: 'default',
} as const;

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
    {
      label: 'Non-claim',
      value: 'Not final recovery proof',
      description: 'Tracker inclusion does not prove solvency, restitution, product availability, or completion.',
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
      firstCheck: 'Pair each record with live diagnostics before present-tense claims.',
      summary: 'Start here for records explicitly promoted from the archive into current recovery review.',
    },
    {
      title: 'Governance records lane',
      badge: 'dated + live',
      badgeVariant: archiveLaneBadgeVariants.info,
      href: '#governance-records',
      count: GOVERNANCE_PROPOSAL_RECORDS.length,
      countLabel: `${operationalGovernanceRecords.length} operational/current-only`,
      firstCheck: 'Read the record status before treating an ADR, Mimir item, or proposal as live behavior.',
      summary: 'Use for ADRs, operational parameters, recovery-path records, and historical unwind context.',
    },
    {
      title: 'Incident archive lane',
      badge: 'security history',
      badgeVariant: archiveLaneBadgeVariants.danger,
      href: '#security-incidents',
      count: SECURITY_INCIDENT_RECORDS.length,
      countLabel: `${currentOrReviewIncidentRecords.length} current/review, ${historicalOpenIncidentRecords.length} historical-open`,
      firstCheck: 'Use the posture badge first: resolved, current tracker, needs review, or historical open.',
      summary: 'Use for exploit root-cause, illicit-flow, and recovery-history records without flattening them into today.',
    },
    {
      title: 'Research and milestones lane',
      badge: 'dated context',
      badgeVariant: archiveLaneBadgeVariants.default,
      href: '#protocol-milestones',
      count: PROTOCOL_MILESTONE_RECORDS.length + RESEARCH_REPORT_RECORDS.length,
      countLabel: `${PROTOCOL_MILESTONE_RECORDS.length} milestones, ${RESEARCH_REPORT_RECORDS.length} reports`,
      firstCheck: 'Good for period framing; not enough for current protocol, route, or recovery claims.',
      summary: 'Use for timeline context and third-party or ecosystem analysis before checking current evidence.',
    },
  ];

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Governance & History</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        ADRs, Mimir context, milestones, incidents, and research. Vote percentages are shown only when source-backed.
      </p>
      <RouteSourcePosture
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

      <section id="governance-claim-checks" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Governance Claim Checks</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Start with the claim type. Governance records are useful for dated decisions and history; live controls, incident root-cause wording, recovery status, and community interpretation need separate proof paths.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {governanceClaimChecks.map((check) => {
            const content = (
              <>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={check.badgeVariant}>{check.badge}</Badge>
                  <h3 className="text-base font-semibold text-slate-100">{check.title}</h3>
                </div>
                <dl className="grid gap-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-3">
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
                    <dd className="mt-1">{check.use}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">Verify</dt>
                    <dd className="mt-1">{check.verify}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Claim</dt>
                    <dd className="mt-1">{check.avoid}</dd>
                  </div>
                </dl>
                <Link href={check.href} className="mt-4 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                  {check.linkLabel}
                </Link>
              </>
            );

            if ('id' in check && check.id === 'governance-proposal-status') {
              return (
                <Card key={check.title} id="governance-proposal-status" padding="md" className="scroll-mt-24">
                  {content}
                </Card>
              );
            }

            return (
              <Card key={check.title} padding="md">
                {content}
              </Card>
            );
          })}
        </div>
      </section>

      <section id="current-recovery" className="scroll-mt-24 mb-12">
        <SectionHeader>Current Incident & Recovery Tracker</SectionHeader>
        <p className="mb-4 max-w-3xl text-sm text-slate-400">
          Conservative tracker for records explicitly tagged as current or needing current recovery review. Historical unresolved records remain in the incident archive below unless they are re-verified for current tracking.
        </p>
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {currentRecoveryRecordSummary.map((item) => (
            <Card key={item.label} padding="sm" className="border-border">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-100">{item.value}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.description}</p>
            </Card>
          ))}
        </div>
        <div className="mb-4 rounded-lg border border-border bg-surface-elevated p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Recovery State Matrix</h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
              Separate the historical debt unwind, post-exploit recovery review, and live user-action checks before using recovery language.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {recoveryStateMatrix.map((item) => (
              <div key={item.title} className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                  <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
                </div>
                <dl className="space-y-3 text-xs leading-relaxed text-slate-400">
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">State</dt>
                    <dd className="mt-1">{item.status}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-slate-500">Evidence</dt>
                    <dd className="mt-1">{item.evidence}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wider text-amber-300">Boundary</dt>
                    <dd className="mt-1">{item.nonClaim}</dd>
                  </div>
                </dl>
                <Link href={item.href} className="mt-4 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                  {item.linkLabel}
                </Link>
              </div>
            ))}
          </div>
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
        <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Safe current wording</p>
          <p className="mt-1 max-w-4xl text-sm leading-relaxed text-slate-300">
            The GG20 exploit record remains a current security tracker, while ADR-028 is now source-backed as Accepted and implemented through the one-time v3.19.0 conciliation migration. Use this section to decide what to verify next; neither record proves every loss was restored, final recovery, current vault safety, or user-action availability.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentRecoveryRecords.map((record) => (
            <Card key={`current:${record.id}`} className="border-amber-500/20 bg-amber-500/5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{record.recordType}</p>
                  <h3 className="mt-1 text-sm font-semibold">{record.title}</h3>
                </div>
                <Badge variant={record.badge.variant}>{record.badge.label}</Badge>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{record.description}</p>
              <p className="mt-2 text-xs text-amber-300">{record.impact}</p>
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
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Use This For</dt>
                  <dd className="mt-1">{record.guidance.boundary}</dd>
                </div>
              </dl>
              <div className="mt-3">
                <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
              </div>
              <div className="mt-4 grid gap-2 border-t border-amber-500/15 pt-3 sm:grid-cols-2">
                <Link
                  href={record.archiveHref}
                  className="rounded-md border border-amber-500/20 bg-surface px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
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
                  <span className="mt-1 block font-normal leading-relaxed text-slate-400">
                    Verify live halts, signing, TCY controls, and source warnings.
                  </span>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="governance-archive-map" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Dated Archive Map</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Use the lane map before diving into the archive. Counts are navigation aids, not health scores, and every lane still needs the claim-specific checks above.
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
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">First check</dt>
                  <dd>{lane.firstCheck}</dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      </section>

      <section id="governance-records" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Governance Records</SectionHeader>
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
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Milestones</h2>
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
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Research</h2>
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
    </PageContainer>
  );
}
