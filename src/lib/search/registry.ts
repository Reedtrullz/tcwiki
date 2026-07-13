import {
  CHAIN_RECORDS,
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
  TOKENOMICS_RECORDS,
} from '@/lib/data/static';
import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, SOURCE_CHOICE_DECISIONS, TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import {
  OPERATIONAL_CONTROL_CATALOG,
  REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES,
  UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES,
  operationalControlPrefixSearchKey,
} from '@/lib/operational-controls';
import { MDX_SEARCH_DOCUMENTS } from '@/lib/search/mdx-documents.generated';
import { networkHaltsSource } from '@/lib/sources';
import type { DataConfidence, SourceMeta, SourcedRecord } from '@/lib/types';
import { getConfidenceLabel } from '@/lib/trust';
import { recordAnchor } from '@/lib/utils';
import { ecosystemDirectoryPosture, ecosystemDirectoryPostureLabel } from '@/lib/ecosystem-directory';

export type SearchDocType =
  | 'section'
  | 'deep-dive'
  | 'resource'
  | 'incident'
  | 'ecosystem'
  | 'research'
  | 'governance'
  | 'milestone'
  | 'tokenomics'
  | 'mimir'
  | 'chain'
  | 'glossary'
  | 'source-map'
  | 'task'
  | 'deep-dive-path';

export interface SearchDoc {
  id: string;
  slug: string;
  href: string;
  type: SearchDocType;
  title: string;
  content: string;
  anchor?: string;
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  description: string;
}

const CHAIN_SCOPED_OPERATIONAL_SEARCH_CONTENT = CHAIN_RECORDS.flatMap((record) => {
  const chain = record.data.chain.toUpperCase();
  const chainName = record.data.name;

  return [
    `${chain} halted`,
    `${chainName} halted`,
    `${chain} chain halted`,
    `${chainName} chain halted`,
    `${chain} trading halted`,
    `${chainName} trading halted`,
    `${chain} signing halted`,
    `${chainName} signing halted`,
    `why is ${chain} halted`,
    `why is ${chainName} halted`,
    `HALT${chain}TRADING`,
    `HALTTRADING${chain}`,
    `HALT${chain}CHAIN`,
    `HALTSIGNING${chain}`,
    `HALT${chain}SIGNING`,
    `SOLVENCYHALT${chain}CHAIN`,
  ];
}).join(' ');

const OPERATIONAL_CONTROL_SEARCH_CONTENT = [
  'Official THORNode and Mimir halt keys and related halt terms.',
  'Treat halt, pause, disabled, enabled, RUNEPool, trade accounts, app layer, signing, trading, LP actions, asymmetric withdrawals, secured assets, bank sends, memoless availability, and source warnings as current-only source-backed status.',
  'Network diagnostics owns the current interpretation; this search record routes exact keys and human phrases to the diagnostics view.',
  CHAIN_SCOPED_OPERATIONAL_SEARCH_CONTENT,
  ...OPERATIONAL_CONTROL_CATALOG.flatMap((control) => [
    control.key,
    operationalControlPrefixSearchKey(control.key),
    control.label,
    control.area,
    control.description,
    ...control.searchTerms,
  ]),
  ...REVIEWED_OPERATIONAL_SUPPORT_MIMIR_PREFIXES.flatMap((prefix) => [
    prefix,
    `${prefix} known operational-support Mimir key`,
    `${prefix} source warning review`,
  ]),
  ...UNKNOWN_OPERATION_REVIEW_MIMIR_PREFIXES.flatMap((prefix) => [
    prefix,
    `${prefix} unknown operation-like Mimir key`,
    `${prefix} source review`,
  ]),
  'Known operational-support Mimir keys are review warnings, not direct pause proof.',
  'Unknown operation-like Mimir keys need review before treating the source as clean.',
  'Mimir reference, not a current value. Use Network diagnostics for current values and active states.',
].join(' ');

export const OPERATIONAL_HALT_SEARCH_DOCUMENTS: SearchDoc[] = [
  {
    id: 'mimir:official-halt-controls',
    slug: '/network',
    href: '/network#network-diagnostics',
    anchor: 'network-diagnostics',
    type: 'mimir',
    title: 'Mimir halt and enablement controls (current diagnostics)',
    confidence: 'official',
    reviewedAt: '2026-07-08',
    nextReviewDue: '2026-08-08',
    sources: [networkHaltsSource],
    description: 'Official Mimir control reference for THORChain operations. Current values and active states come from Network diagnostics, not this search record.',
    content: OPERATIONAL_CONTROL_SEARCH_CONTENT,
  },
];

const mdxBySlug = new Map(MDX_SEARCH_DOCUMENTS.map((doc) => [doc.slug, doc]));
const contentEntrySlugs = new Set(CONTENT_ENTRIES.map((entry) => entry.href));

function withAnchor(slug: string, anchor?: string) {
  return anchor ? `${slug}#${anchor}` : slug;
}

function splitInternalHref(href: string) {
  const [path, anchor] = href.split('#');
  return { path, anchor };
}

function tokenomicsRecordRoute(id: string) {
  return id === 'tcy-recovery-context' ? '/tcy' : '/rune';
}

function searchMeta<T>(record: SourcedRecord<T>) {
  return {
    confidence: record.freshness.confidence,
    reviewedAt: record.freshness.checkedAt,
    nextReviewDue: record.freshness.nextReviewDue ?? record.freshness.checkedAt,
    sources: record.sources,
  };
}

export const SEARCH_DOCUMENTS: SearchDoc[] = [
  ...OPERATIONAL_HALT_SEARCH_DOCUMENTS,
  ...CONTENT_ENTRIES.map((entry) => ({
    id: entry.id,
    slug: entry.href,
    href: entry.href,
    type: entry.category,
    title: entry.title,
    confidence: entry.confidence,
    reviewedAt: entry.reviewedAt,
    nextReviewDue: entry.nextReviewDue,
    sources: entry.sources,
    description: entry.description,
    content: [
      entry.description,
      entry.body,
      mdxBySlug.get(entry.href)?.content ?? '',
      entry.tags.join(' '),
      entry.sources.map((source) => source.label).join(' '),
    ].join(' '),
  })),
  ...TASK_INTENT_GUIDES.map((guide) => {
    const { path, anchor } = splitInternalHref(guide.href);
    const sourceChoiceContent = guide.id === 'source-choice'
      ? SOURCE_CHOICE_DECISIONS.map((decision) => [
        decision.claim,
        decision.startWith.label,
        decision.why,
        decision.nextChecks.map((check) => `${check.label} ${check.description}`).join(' '),
        decision.avoidClaiming,
      ].join(' ')).join(' ')
      : '';

    return {
      id: `task:${guide.id}`,
      slug: path,
      href: guide.href,
      anchor,
      type: 'task' as const,
      title: guide.label,
      confidence: guide.confidence,
      reviewedAt: guide.reviewedAt,
      nextReviewDue: guide.nextReviewDue,
      sources: guide.sources,
      description: guide.description,
      content: [
        guide.label,
        guide.question,
        guide.description,
        guide.searchTerms.join(' '),
        ['swap-availability', 'why-paused'].includes(guide.id) ? CHAIN_SCOPED_OPERATIONAL_SEARCH_CONTENT : '',
        sourceChoiceContent,
        guide.sources.map((source) => source.label).join(' '),
      ].join(' '),
    };
  }),
  ...DEEP_DIVE_READER_PATHS.map((path) => {
    const anchor = `deep-dive-path-${path.id}`;
    const entries = path.entryIds.flatMap((entryId) => {
      const entry = CONTENT_ENTRIES.find((candidate) => candidate.id === entryId);
      return entry ? [entry] : [];
    });

    return {
      id: `deep-dive-path:${path.id}`,
      slug: '/deep-dives',
      href: withAnchor('/deep-dives', anchor),
      anchor,
      type: 'deep-dive-path' as const,
      title: path.title,
      confidence: path.confidence,
      reviewedAt: path.reviewedAt,
      nextReviewDue: path.nextReviewDue,
      sources: path.sources,
      description: path.description,
      content: [
        'deep dive reader path learning path article sequence',
        path.title,
        path.audience,
        path.description,
        entries.map((entry) => `${entry.title} ${entry.description} ${entry.tags.join(' ')}`).join(' '),
        path.verifyBeforeClaiming.join(' '),
        path.followUpLinks.map((link) => `${link.label} ${link.description}`).join(' '),
        path.searchTerms.join(' '),
        path.sources.map((source) => source.label).join(' '),
      ].join(' '),
    };
  }),
  ...MDX_SEARCH_DOCUMENTS.filter((doc) => !contentEntrySlugs.has(doc.slug)).map((doc) => ({
    ...doc,
    href: doc.slug,
    type: doc.slug.startsWith('/deep-dives/') ? 'deep-dive' as const : 'resource' as const,
  })),
  ...CHAIN_RECORDS.map((record) => {
    const chain = record.data;
    const anchor = recordAnchor('chain', chain.chain);
    return {
      id: `chain:${chain.chain.toLowerCase()}`,
      slug: '/protocol',
      href: withAnchor('/protocol', anchor),
      anchor,
      type: 'chain' as const,
      title: `${chain.name} (${chain.chain}) supported chain`,
      description: chain.statusNote ?? `${chain.name} is listed in the curated supported-chain snapshot. Current availability remains live/current-only.`,
      ...searchMeta(record),
      content: [
        chain.name,
        chain.chain,
        `${chain.chain}.${chain.chain}`,
        `${chain.chain}.${chain.chain} asset notation`,
        `${chain.name} ${chain.chain} supported chain`,
        `${chain.name} chain support`,
        chain.supported ? 'listed supported live inbound address current-only chain availability' : 'needs review unsupported',
        `Address formats: ${chain.addressFormats.join(' ')}`,
        chain.dustThreshold ? `Dust threshold: ${chain.dustThreshold}` : '',
        chain.statusNote ?? '',
        chain.explorer,
        record.sources.map((source) => source.label).join(' '),
      ].join(' '),
    };
  }),
  ...SOURCE_MAP_SECTION_RECORDS.map((record) => ({
    id: `source-map:${record.data.id}`,
    slug: '/docs',
    href: withAnchor('/docs', record.data.id),
    anchor: record.data.id,
    type: 'source-map' as const,
    title: record.data.title,
    description: record.data.use,
    ...searchMeta(record),
    content: [
      record.data.title,
      record.data.decision,
      record.data.use,
      record.data.caveat,
      record.data.claimExamples.join(' '),
      record.data.nonClaims.join(' '),
      record.data.links.map((source) => `${source.label} ${source.notes ?? ''}`).join(' '),
      record.sources.map((source) => source.label).join(' '),
    ].join(' '),
  })),
  ...SECURITY_INCIDENT_RECORDS.map((record) => {
    const anchor = recordAnchor('incident', record.data.id);
    return {
      id: `incident:${record.data.id}`,
      slug: '/governance',
      href: withAnchor('/governance', anchor),
      anchor,
      type: 'incident' as const,
      title: record.data.title,
      description: record.data.description,
      ...searchMeta(record),
      content: [
        `Date: ${record.data.date}.`,
        `Type: ${record.data.type}.`,
        record.data.description,
        `Impact: ${record.data.impact}.`,
        `Resolved: ${record.data.resolved ? 'yes' : 'no'}.`,
        record.data.resolutionDate ? `Resolution date: ${record.data.resolutionDate}.` : '',
        `Lessons: ${record.data.lessons.join('; ')}.`,
        record.data.url ?? '',
        record.sources.map((source) => source.label).join(' '),
      ].join(' '),
    };
  }),
  ...ECOSYSTEM_PROJECT_RECORDS.map((record) => {
    const anchor = recordAnchor('ecosystem', record.data.id);
    return {
      id: `ecosystem:${record.data.id}`,
      slug: '/ecosystem',
      href: withAnchor('/ecosystem', anchor),
      anchor,
      type: 'ecosystem' as const,
      title: record.data.name,
      description: record.data.description,
      ...searchMeta(record),
      content: [
        record.data.description,
        `Use for: ${record.data.useFor.join(' ')}`,
        `Check before use: ${record.data.verifyBeforeUse.join(' ')}`,
        `Category: ${record.data.category}.`,
        `Directory posture: ${ecosystemDirectoryPostureLabel(ecosystemDirectoryPosture(record.freshness.confidence))}.`,
        `Source confidence: ${getConfidenceLabel(record.freshness.confidence)}.`,
        `Chains: ${record.data.chains.join(', ')}.`,
        record.sources.map((source) => source.label).join(' '),
      ].join(' '),
    };
  }),
  ...RESEARCH_REPORT_RECORDS.map((record) => {
    const anchor = recordAnchor('research', record.data.id);
    return {
      id: `research:${record.data.id}`,
      slug: '/governance',
      href: withAnchor('/governance', anchor),
      anchor,
      type: 'research' as const,
      title: record.data.title,
      description: record.data.summary,
      ...searchMeta(record),
      content: `${record.data.summary} By ${record.data.author} from ${record.data.source} on ${record.data.date}. ${record.data.keyInsights.join(' ')} ${record.sources.map((source) => source.label).join(' ')}`,
    };
  }),
  ...GOVERNANCE_PROPOSAL_RECORDS.map((record) => {
    const anchor = recordAnchor('governance', record.data.id);
    const trackerContent = record.data.trackerStatus
      ? ` Current recovery tracker: ${record.data.trackerStatus}.`
      : '';
    const recordId = String(record.data.id);
    const adrNumber = /\badr-(\d+)\b/i.exec(recordId)?.[1] ?? /\badr[-\s]?(\d+)\b/i.exec(record.data.title)?.[1];
    const adrAliases = adrNumber
      ? ` ADR-${adrNumber.padStart(3, '0')} ADR ${adrNumber.padStart(3, '0')} ADR${adrNumber.padStart(3, '0')} ADR-${Number(adrNumber)} ADR${Number(adrNumber)}`
      : '';
    return {
      id: `governance:${record.data.id}`,
      slug: '/governance',
      href: withAnchor('/governance', anchor),
      anchor,
      type: 'governance' as const,
      title: record.data.title,
      description: record.data.description,
      ...searchMeta(record),
      content: `${record.data.id} ${adrAliases} ${record.data.title}. ${record.data.description} Type: ${record.data.type}. Status: ${record.data.status}.${trackerContent} Created: ${record.data.createdDate}. Expires: ${record.data.expiryDate}. Voting period: ${record.data.votingPeriod}. ${record.sources.map((source) => source.label).join(' ')}`,
    };
  }),
  ...PROTOCOL_MILESTONE_RECORDS.map((record) => {
    const anchor = recordAnchor('milestone', `${record.data.date}-${record.data.title}`);
    return {
      id: `milestone:${record.data.date}:${record.data.title}`,
      slug: '/governance',
      href: withAnchor('/governance', anchor),
      anchor,
      type: 'milestone' as const,
      title: record.data.title,
      description: record.data.description,
      ...searchMeta(record),
      content: `Date: ${record.data.date}. Title: ${record.data.title}. ${record.data.description} ${record.sources.map((source) => source.label).join(' ')}`,
    };
  }),
  ...TOKENOMICS_RECORDS.map((record) => {
    const anchor = recordAnchor('tokenomics', record.data.id);
    const slug = tokenomicsRecordRoute(record.data.id);
    return {
      id: `tokenomics:${record.data.id}`,
      slug,
      href: withAnchor(slug, anchor),
      anchor,
      type: 'tokenomics' as const,
      title: record.data.title,
      description: record.data.summary,
      ...searchMeta(record),
      content: [
        record.data.title,
        record.data.summary,
        record.data.figures.map((figure) => `${figure.label} ${figure.value} ${figure.tone}`).join(' '),
        record.sources.map((source) => `${source.label} ${source.notes ?? ''}`).join(' '),
      ].join(' '),
    };
  }),
  ...GLOSSARY_TERMS.map((term) => {
    const anchor = `term-${term.id}`;
    return {
      id: `glossary:${term.id}`,
      slug: '/glossary',
      href: withAnchor('/glossary', anchor),
      anchor,
      type: 'glossary' as const,
      title: term.term,
      description: term.definition,
      confidence: term.confidence,
      reviewedAt: term.reviewedAt,
      nextReviewDue: term.nextReviewDue,
      sources: term.sources,
      content: `${term.term} ${term.definition} ${term.category} ${term.sources.map((source) => source.label).join(' ')}`,
    };
  }),
];
