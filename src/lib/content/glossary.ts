import type { DataConfidence, SourceMeta } from '@/lib/types';
import { slugifyFragment } from '@/lib/utils';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'protocol' | 'economics' | 'operations' | 'history' | 'developer';
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  relatedHrefs: string[];
}

const docsSource: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
};

const devDocsSource: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
};

const networkHaltsSource: SourceMeta = {
  label: 'THORChain Network Halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
};

const archivedSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: slugifyFragment('Asgard vault'),
    term: 'Asgard vault',
    definition: 'A THORChain vault controlled by the active validator set through threshold signing. Vault membership changes during churns.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/tss', '/deep-dives/churning'],
  },
  {
    id: slugifyFragment('Bifrost'),
    term: 'Bifrost',
    definition: 'The chain-client layer active nodes use to observe external-chain transactions and submit observations into THORChain.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/bifrost'],
  },
  {
    id: slugifyFragment('CLP'),
    term: 'CLP',
    definition: 'Continuous Liquidity Pool. THORChain pools price swaps from pool depth and slip, with RUNE paired against external assets.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource, devDocsSource],
    relatedHrefs: ['/deep-dives/clp', '/economics'],
  },
  {
    id: slugifyFragment('Current-only'),
    term: 'Current-only',
    definition: 'A trust label for live Midgard or THORNode data that should be treated as a fresh snapshot, not durable historical truth.',
    category: 'operations',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [devDocsSource],
    relatedHrefs: ['/stats', '/network'],
  },
  {
    id: slugifyFragment('Mimir'),
    term: 'Mimir',
    definition: 'Operational parameter storage used by THORChain nodes. Halt, pause, enablement, and feature-control keys must be read from live THORNode state.',
    category: 'operations',
    confidence: 'official',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [networkHaltsSource],
    relatedHrefs: ['/network', '/governance'],
  },
  {
    id: slugifyFragment('RUNEPool'),
    term: 'RUNEPool',
    definition: 'A RUNE-only participation mechanism whose availability depends on current protocol controls and should not be assumed from static text.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource, networkHaltsSource],
    relatedHrefs: ['/rune', '/network'],
  },
  {
    id: slugifyFragment('Savers'),
    term: 'Savers',
    definition: 'A deprecated historical THORFi feature. Current wiki copy should frame Savers as archived, not presently available yield.',
    category: 'history',
    confidence: 'official',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [archivedSource],
    relatedHrefs: ['/tcy', '/deep-dives/savers'],
  },
  {
    id: slugifyFragment('TCY'),
    term: 'TCY',
    definition: 'A recovery-token framing associated with the THORFi unwind and later recovery context. Current status needs source-specific review.',
    category: 'history',
    confidence: 'needs-review',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-07-16',
    sources: [docsSource, archivedSource],
    relatedHrefs: ['/tcy', '/governance'],
  },
  {
    id: slugifyFragment('TSS'),
    term: 'TSS',
    definition: 'Threshold Signature Scheme. Validators jointly sign vault transactions without a single node holding the complete private key.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/tss'],
  },
];
