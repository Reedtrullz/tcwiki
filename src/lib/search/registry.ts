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

const mdxBySlug = new Map(MDX_SEARCH_DOCUMENTS.map((doc) => [doc.slug, doc]));
const contentEntrySlugs = new Set(CONTENT_ENTRIES.map((entry) => entry.href));

export const SEARCH_DOCUMENTS: SearchDoc[] = [
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
