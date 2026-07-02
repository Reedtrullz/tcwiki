import {
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
} from '@/lib/data/static';
import { CONTENT_ENTRIES } from '@/lib/content/registry';
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
  | 'glossary';

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
      'Related controls include HALTTRADING, HALTSIGNING, PAUSELP, PAUSELOANS, HALTCHURNING, HALTWASMGLOBAL, TRADEACCOUNTSENABLED, and RUNEPOOLENABLED.',
      'Treat halt, pause, disabled, enabled, RUNEPool, trade accounts, app layer, signing, trading, LP actions, and memoless availability as current-only source-backed status.',
    ].join(' '),
  },
];

const mdxBySlug = new Map(MDX_SEARCH_DOCUMENTS.map((doc) => [doc.slug, doc]));
const contentEntrySlugs = new Set(CONTENT_ENTRIES.map((entry) => entry.href));

function withAnchor(slug: string, anchor?: string) {
  return anchor ? `${slug}#${anchor}` : slug;
}

function searchMeta<T>(record: SourcedRecord<T>) {
  return {
    confidence: record.freshness.confidence,
    reviewedAt: record.freshness.checkedAt,
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
  ...MDX_SEARCH_DOCUMENTS.filter((doc) => !contentEntrySlugs.has(doc.slug)).map((doc) => ({
    ...doc,
    href: doc.slug,
    type: doc.slug.startsWith('/deep-dives/') ? 'deep-dive' as const : 'resource' as const,
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
        record.data.description,
        `Impact: ${record.data.impact}.`,
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
      content: `${record.data.description} Category: ${record.data.category}. Status: ${record.data.status}. Chains: ${record.data.chains.join(', ')}. ${record.sources.map((source) => source.label).join(' ')}`,
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
      content: `${record.data.description} ${record.data.type} ${record.data.status} ${record.sources.map((source) => source.label).join(' ')}`,
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
      content: `${record.data.description} ${record.sources.map((source) => source.label).join(' ')}`,
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
      sources: term.sources,
      content: `${term.term} ${term.definition} ${term.category} ${term.sources.map((source) => source.label).join(' ')}`,
    };
  }),
];
