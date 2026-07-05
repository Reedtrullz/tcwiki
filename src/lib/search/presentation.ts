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
  | 'glossary';

interface SearchFilterSpec {
  id: SearchFilterId;
  label: string;
  description: string;
}

export interface SearchFilterOption extends SearchFilterSpec {
  count: number;
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
const governanceTypes = new Set<SearchDoc['type']>(['governance', 'incident', 'research', 'milestone']);
const pageTypes = new Set<SearchDoc['type']>(['section', 'resource', 'tokenomics']);

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
  if (
    doc.type === 'mimir' ||
    doc.type === 'chain' ||
    liveRoutePrefixes.some((prefix) => doc.href === prefix || doc.href.startsWith(`${prefix}#`))
  ) {
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

export function getSearchFilterSpec(filterId: SearchFilterId) {
  return SEARCH_FILTER_SPECS.find((filter) => filter.id === filterId) ?? SEARCH_FILTER_SPECS[0];
}

export function buildSearchFilterOptions(results: SearchDoc[]): SearchFilterOption[] {
  const counts = new Map<SearchFilterId, number>(SEARCH_FILTER_SPECS.map((filter) => [filter.id, 0]));
  counts.set('all', results.length);

  for (const result of results) {
    const filterId = classifySearchDoc(result);
    counts.set(filterId, (counts.get(filterId) ?? 0) + 1);
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

  return results.filter((result) => classifySearchDoc(result) === filterId);
}

export function getSearchStartingPoints<T extends SearchDoc>(results: T[], limit = 3): T[] {
  const seenHrefs = new Set<string>();
  const startingPoints: T[] = [];

  for (const result of results) {
    if (result.type !== 'task' && result.type !== 'source-map') {
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
