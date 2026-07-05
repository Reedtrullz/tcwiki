import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';
import {
  buildSearchFilterOptions,
  classifySearchDoc,
  filterSearchResults,
  getSearchStartingPoints,
  normalizeSearchFilter,
} from '@/lib/search/presentation';

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  SEARCH_DOCUMENTS.forEach((doc) => this.add(doc));
});

const searchDocumentsById = new Map(SEARCH_DOCUMENTS.map((doc) => [doc.id, doc]));

function rankedResults(query: string) {
  const mapped = runSafeLunrSearch(searchIndex, query).flatMap((result) => {
    const doc = searchDocumentsById.get(result.ref);
    return doc ? [{ ...doc, score: result.score }] : [];
  });

  return rankSearchResults(query, mapped);
}

describe('search presentation helpers', () => {
  it('classifies live, source-map, task, deep-dive path, and governance results for filters', () => {
    const dynamicFeesSection = SEARCH_DOCUMENTS.find((doc) => doc.id === 'dynamic-fees');
    const sourceMap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'source-map:current-protocol-state');
    const task = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:swap-availability');
    const chain = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:sol');
    const deepDivePath = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-path:network-security');
    const incident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:gg20-vault-exploit-2026');

    expect(dynamicFeesSection && classifySearchDoc(dynamicFeesSection)).toBe('live');
    expect(sourceMap && classifySearchDoc(sourceMap)).toBe('source-map');
    expect(task && classifySearchDoc(task)).toBe('task');
    expect(chain && classifySearchDoc(chain)).toBe('live');
    expect(deepDivePath && classifySearchDoc(deepDivePath)).toBe('deep-dive');
    expect(incident && classifySearchDoc(incident)).toBe('governance');
  });

  it('builds count-bearing filter options and filters without inventing zero-result groups', () => {
    const results = rankedResults('dynamic L1 fee');
    const options = buildSearchFilterOptions(results);
    const optionIds = options.map((option) => option.id);

    expect(optionIds[0]).toBe('all');
    expect(optionIds).toContain('task');
    expect(optionIds).toContain('source-map');
    expect(optionIds).toContain('live');
    expect(options.find((option) => option.id === 'all')?.count).toBe(results.length);
    expect(options.filter((option) => option.id !== 'all').every((option) => option.count > 0)).toBe(true);
    expect(filterSearchResults(results, 'source-map').every((result) => classifySearchDoc(result) === 'source-map')).toBe(true);
  });

  it('selects deduped task and source-map starting points', () => {
    const startingPoints = getSearchStartingPoints(rankedResults('which source should I trust'));

    expect(startingPoints.length).toBeGreaterThan(0);
    expect(startingPoints[0].id).toBe('task:source-choice');
    expect(startingPoints.map((result) => result.id)).toContain('task:source-choice');
    expect(new Set(startingPoints.map((result) => result.href)).size).toBe(startingPoints.length);
    expect(startingPoints.every((result) => result.type === 'task' || result.type === 'source-map')).toBe(true);
  });

  it('normalizes unsupported filters back to all', () => {
    expect(normalizeSearchFilter('deep-dive')).toBe('deep-dive');
    expect(normalizeSearchFilter('unsupported')).toBe('all');
    expect(normalizeSearchFilter(null)).toBe('all');
  });
});
