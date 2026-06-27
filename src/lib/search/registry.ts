import {
  ECOSYSTEM_PROJECT_RECORDS,
  GOVERNANCE_PROPOSAL_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  RESEARCH_REPORT_RECORDS,
  SECURITY_INCIDENT_RECORDS,
} from '@/lib/data/static';
import { CONTENT_ENTRIES } from '@/lib/content/registry';
import { MDX_SEARCH_DOCUMENTS } from '@/lib/search/mdx-documents.generated';

export interface SearchDoc {
  id: string;
  slug: string;
  title: string;
  content: string;
}

const OPERATIONAL_HALT_SEARCH_DOCUMENTS: SearchDoc[] = [
  {
    id: 'mimir:official-halt-controls',
    slug: '/network',
    title: 'Official Mimir halt and enablement controls',
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

export const SEARCH_DOCUMENTS: SearchDoc[] = [
  ...OPERATIONAL_HALT_SEARCH_DOCUMENTS,
  ...CONTENT_ENTRIES.map((entry) => ({
    id: entry.id,
    slug: entry.href,
    title: entry.title,
    content: [
      entry.description,
      entry.body,
      mdxBySlug.get(entry.href)?.content ?? '',
      entry.tags.join(' '),
      entry.sources.map((source) => source.label).join(' '),
    ].join(' '),
  })),
  ...MDX_SEARCH_DOCUMENTS.filter((doc) => !contentEntrySlugs.has(doc.slug)),
  ...SECURITY_INCIDENT_RECORDS.map((record) => ({
    id: `incident:${record.data.id}`,
    slug: '/governance',
    title: record.data.title,
    content: [
      record.data.description,
      `Impact: ${record.data.impact}.`,
      `Lessons: ${record.data.lessons.join('; ')}.`,
      record.data.url ?? '',
      record.sources.map((source) => source.label).join(' '),
    ].join(' '),
  })),
  ...ECOSYSTEM_PROJECT_RECORDS.map((record) => ({
    id: `ecosystem:${record.data.id}`,
    slug: '/ecosystem',
    title: record.data.name,
    content: `${record.data.description} Category: ${record.data.category}. Chains: ${record.data.chains.join(', ')}.`,
  })),
  ...RESEARCH_REPORT_RECORDS.map((record) => ({
    id: `research:${record.data.id}`,
    slug: '/governance',
    title: record.data.title,
    content: `${record.data.summary} By ${record.data.author} from ${record.data.source} on ${record.data.date}. ${record.data.keyInsights.join(' ')}`,
  })),
  ...GOVERNANCE_PROPOSAL_RECORDS.map((record) => ({
    id: `governance:${record.data.id}`,
    slug: '/governance',
    title: record.data.title,
    content: `${record.data.description} ${record.data.type} ${record.data.status} ${record.sources.map((source) => source.label).join(' ')}`,
  })),
  ...PROTOCOL_MILESTONE_RECORDS.map((record) => ({
    id: `milestone:${record.data.date}:${record.data.title}`,
    slug: '/governance',
    title: record.data.title,
    content: `${record.data.description} ${record.sources.map((source) => source.label).join(' ')}`,
  })),
];
