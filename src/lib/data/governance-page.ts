import type { TocItem } from '@/components/layout/PageTableOfContents';
import type { RelatedCheck } from '@/components/features/RelatedChecks';
import type { FreshnessMeta, SourceMeta } from '@/lib/types';
import { GOVERNANCE_PROPOSAL_RECORDS, SECURITY_INCIDENT_RECORDS, PROTOCOL_MILESTONE_RECORDS, RESEARCH_REPORT_RECORDS } from '@/lib/data/static';
import { recordAnchor } from '@/lib/utils';


export const governanceToc: TocItem[] = [
  { id: 'current-recovery', label: 'Recovery tracker' },
  { id: 'governance-archive-map', label: 'Archive map' },
  { id: 'governance-records', label: 'Governance records' },
  { id: 'protocol-milestones', label: 'Milestones & incidents' },
  { id: 'governance-research', label: 'Research' },
];

export const governanceRelatedChecks: RelatedCheck[] = [
  {
    label: 'Comprehensive overview',
    href: '/deep-dives/governance-comprehensive',
    badge: 'deep dive',
    description: 'All ADRs, chain halts, security events, node votes, revenue governance, and community debates in one page.',
  },
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

export const governanceClaimChecks = [
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

export const recoveryClaimChecks = [
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

export const recoveryReviewGuidanceById: Record<string, {
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
  'governance:adr-030-delegated-node-ops': {
    focus: 'Proposed ADR-030 delegate registry for node-management permissions without custody transfer.',
    verifyNow: [
      'The develop ADR status before saying delegation is proposed, accepted, or live.',
      'Release notes and Mimir state before tying ADR-030 to a specific network upgrade.',
      'Node-operator documentation before describing operator workflows that do not exist on mainnet yet.',
    ],
    boundary: 'ADR-030 is design context. It does not prove delegated actions are possible today, and custody remains with the operator key in the proposal.',
  },
  'incident:memoless-spam-2026-08': {
    focus: 'August 2026 memoless halt, cost vote, spam re-halt, and v3.20.0-era feature work.',
    verifyNow: [
      'Current HALTMEMOLESS and MEMOLESSTXNCOST values in Network diagnostics before any present-tense memoless claim.',
      'The v3.20.0 release notes for dated handler, refund, and chain-client work.',
      'Route quotes for concrete swaps; a memoless halt does not prove ordinary swap routes are blocked.',
    ],
    boundary: 'This record proves a scoped availability cycle, not a global outage or a permanent fee level. Cost parameters can be re-voted after the incident window.',
  },
};

export const archiveLaneBadgeVariants = {
  warning: 'warning',
  info: 'info',
  danger: 'danger',
  default: 'default',
} as const;

/* -------------------------------------------------------------------------- */
/*  Helper functions (moved from governance/page.tsx)                        */
/* -------------------------------------------------------------------------- */

export function recoveryReviewGuidance(id: string) {
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

export function incidentTrackerBadge(status: 'current' | 'needs-review') {
  return status === 'needs-review'
    ? { label: 'Needs current review', variant: 'danger' as const }
    : { label: 'Explicit current tracker', variant: 'warning' as const };
}

export function governanceRecoveryTrackerBadge(status: string) {
  return status.toLowerCase().includes('needs')
    ? { label: 'Needs current review', variant: 'danger' as const }
    : { label: 'Explicit recovery tracker', variant: 'warning' as const };
}

/* -------------------------------------------------------------------------- */
/*  Computation logic (moved from governance/page.tsx)                       */
/* -------------------------------------------------------------------------- */

export interface RecoveryRecord {
  id: string;
  title: string;
  description: string;
  impact: string;
  badge: { label: string; variant: 'danger' | 'warning' | 'info' | 'success' | 'default' };
  freshness: FreshnessMeta;
  sources: SourceMeta[];
  recordType: string;
  archiveHref: string;
  archiveLinkLabel: string;
  guidance: { focus: string; verifyNow: string[]; boundary: string };
}

export interface RecoveryRecordSummary {
  label: string;
  value: string;
  description: string;
}

export interface ArchiveLane {
  title: string;
  badge: string;
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  href: string;
  count: number;
  countLabel: string;
  summary: string;
}

export function buildCurrentRecoveryRecords(): {
  records: RecoveryRecord[];
  summary: RecoveryRecordSummary[];
} {
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
        badge: incidentTrackerBadge(trackerStatus as 'current' | 'needs-review'),
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

  const records = [...currentIncidentRecords, ...currentGovernanceRecoveryRecords];
  const summary: RecoveryRecordSummary[] = [
    {
      label: 'Tracked records',
      value: String(records.length),
      description: 'Current or needs-review records promoted from the full governance and incident archive.',
    },
    {
      label: 'Evidence path',
      value: 'Record + live check',
      description: 'Use the full dated record first, then current Network diagnostics before present-tense claims.',
    },
  ];

  return { records, summary };
}

export function buildArchiveLanes(currentRecoveryRecordCount: number): ArchiveLane[] {
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

  return [
    {
      title: 'Current recovery lane',
      badge: 'current review',
      badgeVariant: archiveLaneBadgeVariants.warning,
      href: '#current-recovery',
      count: currentRecoveryRecordCount,
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
}
