import type { SearchDoc } from '@/lib/search/registry';

export type SearchFilterId =
  | 'all'
  | 'task'
  | 'source-map'
  | 'live'
  | 'pages'
  | 'deep-dive'
  | 'ecosystem'
  | 'governance'
  | 'glossary'
  | 'needs-review';

interface SearchFilterSpec {
  id: SearchFilterId;
  label: string;
  description: string;
}

export interface SearchFilterOption extends SearchFilterSpec {
  count: number;
}

export interface SearchSourceDisclosureRow {
  label: string;
  url: string;
  retrievedAt?: string;
  notes?: string;
}

export interface SearchSourceRetrievalSummary {
  label: string;
  datedSourceCount: number;
  hasUndatedSources: boolean;
}

export const SEARCH_FILTER_SPECS: SearchFilterSpec[] = [
  {
    id: 'all',
    label: 'All',
    description: 'Every matching wiki result.',
  },
  {
    id: 'task',
    label: 'Tasks',
    description: 'Guided answers for common reader jobs.',
  },
  {
    id: 'source-map',
    label: 'Source Map',
    description: 'Evidence boundaries and source-use guidance.',
  },
  {
    id: 'live',
    label: 'Live State',
    description: 'Current-only status, Mimir, and dashboard pages.',
  },
  {
    id: 'needs-review',
    label: 'Needs Review',
    description: 'Matches whose source confidence or current tracker state needs review before relying on them.',
  },
  {
    id: 'pages',
    label: 'Pages',
    description: 'Top-level wiki sections and resource pages.',
  },
  {
    id: 'deep-dive',
    label: 'Deep Dives',
    description: 'Long-form explainers.',
  },
  {
    id: 'ecosystem',
    label: 'Ecosystem',
    description: 'Interfaces, wallets, tools, and safety checks.',
  },
  {
    id: 'governance',
    label: 'Governance',
    description: 'Incidents, proposals, research, and milestones.',
  },
  {
    id: 'glossary',
    label: 'Glossary',
    description: 'Definitions and short reference entries.',
  },
];

const searchFilterIds = new Set<SearchFilterId>(SEARCH_FILTER_SPECS.map((filter) => filter.id));

const liveRoutePrefixes = ['/network', '/stats', '/dynamic-fees'];
const liveTargetHrefs = new Set([
  '/docs#current-protocol-state',
  '/economics#runepool-pol-live',
  '/rune#rune-number-router',
  '/tcy#tcy-current-controls',
]);
const governanceTypes = new Set<SearchDoc['type']>(['governance', 'incident', 'research', 'milestone']);
const pageTypes = new Set<SearchDoc['type']>(['section', 'resource', 'tokenomics']);
const startingPointTypes = new Set<SearchDoc['type']>(['task', 'source-map', 'deep-dive-path']);
const exactDestinationTypes = new Set<SearchDoc['type']>(['deep-dive', 'chain', 'glossary', 'incident', 'tokenomics']);
const queryStopwords = new Set(['a', 'an', 'and', 'are', 'can', 'do', 'does', 'for', 'guide', 'i', 'is', 'me', 'my', 'of', 'the', 'to', 'use', 'what', 'when', 'where', 'which', 'who', 'why']);
const searchTypeLabels: Record<SearchDoc['type'], string> = {
  section: 'Page',
  'deep-dive': 'Deep Dive',
  resource: 'Resource',
  incident: 'Incident',
  ecosystem: 'Ecosystem',
  research: 'Research',
  governance: 'Governance',
  milestone: 'Milestone',
  tokenomics: 'Tokenomics',
  mimir: 'Mimir Control',
  chain: 'Supported Chain',
  glossary: 'Glossary',
  'source-map': 'Source Map',
  task: 'Task Guide',
  'deep-dive-path': 'Reader Path',
};

function normalizePresentationText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function meaningfulWords(value: string) {
  return normalizePresentationText(value)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !queryStopwords.has(word));
}

function hasExactDestinationMatch(query: string, result: SearchDoc | undefined) {
  if (!result || !exactDestinationTypes.has(result.type)) {
    return false;
  }

  const normalizedQuery = normalizePresentationText(query);
  if (!normalizedQuery) {
    return false;
  }

  const normalizedTitle = normalizePresentationText(result.title);
  if (
    normalizedTitle === normalizedQuery ||
    normalizedQuery === `what is ${normalizedTitle}` ||
    normalizedQuery === `what are ${normalizedTitle}` ||
    normalizedQuery === `define ${normalizedTitle}` ||
    normalizedQuery === `${normalizedTitle} definition`
  ) {
    return true;
  }

  if (
    result.type === 'glossary' &&
    normalizedQuery.includes(normalizedTitle) &&
    /\b(?:affiliate|definition|docs|guide|lookup|meaning|reference|term)\b/.test(normalizedQuery)
  ) {
    return true;
  }

  const words = meaningfulWords(query);
  if (words.length < 2) {
    return false;
  }

  const normalizedContent = normalizePresentationText(result.content);

  if (words.every((word) => normalizedTitle.includes(word))) {
    return true;
  }

  return words.length >= 2 && (result.type === 'deep-dive' || result.type === 'incident') && words.every((word) => normalizedContent.includes(word));
}

function hasExactMimirKeyMatch(query: string, result: SearchDoc | undefined) {
  if (!result || result.type !== 'mimir') {
    return false;
  }

  const compactQuery = query.trim().replace(/[^a-z0-9]+/gi, '').toLowerCase();
  if (
    compactQuery.length < 6 ||
    !/^(?:halt|pause|enable|disable|manualswap|runepoolhalt|tradeaccounts|banksend|streamingswap|solvencyhalt)/.test(compactQuery)
  ) {
    return false;
  }

  const compactContent = normalizePresentationText(result.content).replace(/\s+/g, '');
  const scopedPrefixMatch = [
    'pauselpdeposit',
    'pauseasymwithdrawal',
    'haltsecureddeposit',
    'haltsecuredwithdraw',
    'haltwasmdeployer',
    'haltwasmcs',
    'haltwasmcontract',
  ].some((prefix) => compactQuery.startsWith(prefix) && compactContent.includes(prefix));
  if (scopedPrefixMatch) {
    return true;
  }

  return compactContent.includes(compactQuery);
}

function hasExactGovernanceIdentifierMatch(query: string, result: SearchDoc | undefined) {
  if (!result || result.type !== 'governance') {
    return false;
  }

  const normalizedQuery = normalizePresentationText(query);
  const queryMatch = /^adr\s*0*(\d+)$/.exec(normalizedQuery);
  if (!queryMatch) {
    return false;
  }

  const compactIdentifier = `adr${queryMatch[1]}`;
  const compactResultText = normalizePresentationText(`${result.title} ${result.content}`).replace(/\s+/g, '');
  return compactResultText.includes(compactIdentifier);
}

export function normalizeSearchFilter(filter: string | null): SearchFilterId {
  return filter && searchFilterIds.has(filter as SearchFilterId) ? filter as SearchFilterId : 'all';
}

export function classifySearchDoc(doc: SearchDoc): SearchFilterId {
  if (doc.type === 'task') {
    return 'task';
  }
  if (doc.type === 'source-map') {
    return 'source-map';
  }
  if (isLiveSearchDoc(doc)) {
    return 'live';
  }
  if (doc.type === 'deep-dive' || doc.type === 'deep-dive-path') {
    return 'deep-dive';
  }
  if (doc.type === 'ecosystem') {
    return 'ecosystem';
  }
  if (governanceTypes.has(doc.type)) {
    return 'governance';
  }
  if (doc.type === 'glossary') {
    return 'glossary';
  }
  if (pageTypes.has(doc.type)) {
    return 'pages';
  }

  return 'pages';
}

function isLiveSearchDoc(doc: SearchDoc) {
  return (
    doc.type === 'mimir' ||
    doc.type === 'chain' ||
    liveTargetHrefs.has(doc.href) ||
    liveRoutePrefixes.some((prefix) => doc.href === prefix || doc.href.startsWith(`${prefix}#`))
  );
}

function matchesSearchFilter(doc: SearchDoc, filterId: SearchFilterId) {
  if (filterId === 'all') {
    return true;
  }
  if (filterId === 'live') {
    return isLiveSearchDoc(doc);
  }
  if (filterId === 'needs-review') {
    return doc.confidence === 'needs-review';
  }

  return classifySearchDoc(doc) === filterId;
}

export function getSearchFilterSpec(filterId: SearchFilterId) {
  return SEARCH_FILTER_SPECS.find((filter) => filter.id === filterId) ?? SEARCH_FILTER_SPECS[0];
}

export function getSearchTypeLabel(type: SearchDoc['type']) {
  return searchTypeLabels[type];
}

export function buildSearchFilterOptions(results: SearchDoc[]): SearchFilterOption[] {
  const counts = new Map<SearchFilterId, number>(SEARCH_FILTER_SPECS.map((filter) => [filter.id, 0]));
  counts.set('all', results.length);

  for (const result of results) {
    for (const filter of SEARCH_FILTER_SPECS) {
      if (filter.id === 'all') {
        continue;
      }
      if (matchesSearchFilter(result, filter.id)) {
        counts.set(filter.id, (counts.get(filter.id) ?? 0) + 1);
      }
    }
  }

  return SEARCH_FILTER_SPECS
    .map((filter) => ({
      ...filter,
      count: counts.get(filter.id) ?? 0,
    }))
    .filter((filter) => filter.id === 'all' || filter.count > 0);
}

export function filterSearchResults<T extends SearchDoc>(results: T[], filterId: SearchFilterId): T[] {
  if (filterId === 'all') {
    return results;
  }

  return results.filter((result) => matchesSearchFilter(result, filterId));
}

export function getSearchStartingPoints<T extends SearchDoc>(results: T[], limit = 3, query = ''): T[] {
  if (
    hasExactDestinationMatch(query, results[0]) ||
    hasExactMimirKeyMatch(query, results[0]) ||
    hasExactGovernanceIdentifierMatch(query, results[0])
  ) {
    return [];
  }

  const seenHrefs = new Set<string>();
  const startingPoints: T[] = [];

  for (const result of results) {
    if (!startingPointTypes.has(result.type)) {
      continue;
    }
    if (seenHrefs.has(result.href)) {
      continue;
    }

    seenHrefs.add(result.href);
    startingPoints.push(result);

    if (startingPoints.length >= limit) {
      break;
    }
  }

  return startingPoints;
}

export function excludeSearchStartingPoints<T extends SearchDoc>(results: T[], startingPoints: T[]): T[] {
  if (startingPoints.length === 0) {
    return results;
  }

  const startingPointIds = new Set(startingPoints.map((result) => result.id));
  return results.filter((result) => !startingPointIds.has(result.id));
}

export function getSearchSourceDisclosureRows(sources: SearchDoc['sources']): SearchSourceDisclosureRow[] {
  return sources
    .filter((source) => Boolean(source.retrievedAt || source.notes))
    .map((source) => ({
      label: source.label,
      url: source.url,
      retrievedAt: source.retrievedAt,
      notes: source.notes,
    }));
}

export function getSearchSourceRetrievalSummary(sources: SearchDoc['sources']): SearchSourceRetrievalSummary | null {
  if (sources.length === 0) {
    return null;
  }

  const dates = [...new Set(sources.flatMap((source) => source.retrievedAt ? [source.retrievedAt] : []))].sort();
  const undatedCount = sources.length - sources.filter((source) => Boolean(source.retrievedAt)).length;
  const suffix = undatedCount > 0 ? `; ${undatedCount} source${undatedCount === 1 ? '' : 's'} undated` : '';

  if (dates.length === 0) {
    return {
      label: 'Source retrieval not dated',
      datedSourceCount: 0,
      hasUndatedSources: true,
    };
  }

  if (dates.length === 1) {
    return {
      label: `${dates[0]}${suffix}`,
      datedSourceCount: sources.length - undatedCount,
      hasUndatedSources: undatedCount > 0,
    };
  }

  return {
    label: `${dates[0]} to ${dates.at(-1)}${suffix}`,
    datedSourceCount: sources.length - undatedCount,
    hasUndatedSources: undatedCount > 0,
  };
}
