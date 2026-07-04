import {
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
} from '@/lib/data/static';
import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, SOURCE_CHOICE_DECISIONS, TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { MDX_SEARCH_DOCUMENTS } from '@/lib/search/mdx-documents.generated';
import type { DataConfidence, SourceMeta, SourcedRecord } from '@/lib/types';
import { recordAnchor } from '@/lib/utils';

export type SearchDocType =
  | 'section'
  | 'deep-dive'
  | 'resource'
  | 'incident'
  | 'ecosystem'
  | 'research'
  | 'governance'
  | 'milestone'
  | 'mimir'
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

const OPERATIONAL_HALT_SEARCH_DOCUMENTS: SearchDoc[] = [
  {
    id: 'mimir:official-halt-controls',
    slug: '/network',
    href: '/network',
    type: 'mimir',
    title: 'Official Mimir halt and enablement controls',
    confidence: 'official',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-07-16',
    sources: [
      {
        label: 'THORChain Network Halts',
        url: 'https://dev.thorchain.org/concepts/network-halts.html',
      },
    ],
    description: 'Live Mimir controls that can pause or disable THORChain operations.',
    content: [
      'Official THORNode and Mimir halt keys and related halt terms.',
      'StreamingSwapPause means streaming swap pause behavior should be checked from live Mimir.',
      'HaltMemoless means memoless transaction handling may be halted.',
      'RUNEPoolHaltDeposit means RUNEPool deposits may be halted; use RUNEPool deposit halt as the human-readable phrase.',
      'RUNEPoolHaltWithdraw means RUNEPool withdrawals may be halted.',
      'Related controls include HALTTRADING, HALTSIGNING, PAUSELP, PAUSELOANS, HALTCHURNING, HALTWASMGLOBAL, TRADEACCOUNTSENABLED, TRADEACCOUNTSDEPOSITENABLED, MANUALSWAPSTOSYNTHDISABLED, RUNEPOOLENABLED, and BANKSENDENABLED.',
      'Node and operator controls include PauseBond, PauseUnbond, HaltRebond, HaltOperatorRotate, and HaltOracle.',
      'Scoped controls include PAUSELPDEPOSIT, PauseAsymWithdrawal, HaltSecuredDeposit, HaltSecuredWithdraw, HaltWasmDeployer, HaltWasmCs, and HaltWasmContract.',
      'Treat halt, pause, disabled, enabled, RUNEPool, trade accounts, app layer, signing, trading, LP actions, asymmetric withdrawals, secured assets, bank sends, and memoless availability as current-only source-backed status.',
    ].join(' '),
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
        `Status: ${record.data.status}.`,
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
    return {
      id: `governance:${record.data.id}`,
      slug: '/governance',
      href: withAnchor('/governance', anchor),
      anchor,
      type: 'governance' as const,
      title: record.data.title,
      description: record.data.description,
      ...searchMeta(record),
      content: `${record.data.description} Type: ${record.data.type}. Status: ${record.data.status}. Created: ${record.data.createdDate}. Expires: ${record.data.expiryDate}. Voting period: ${record.data.votingPeriod}. ${record.sources.map((source) => source.label).join(' ')}`,
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
