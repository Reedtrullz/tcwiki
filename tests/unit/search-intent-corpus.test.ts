import lunr from 'lunr';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import corpus from '../fixtures/search/intent-corpus.json';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';

const index = lunr(function () {
  this.ref('id'); this.field('title'); this.field('content');
  SEARCH_DOCUMENTS.forEach(doc => this.add(doc));
});
const documents = new Map(SEARCH_DOCUMENTS.map(doc => [doc.id, doc]));
type IntentCase = { id: string; split: string; query: string; acceptable: string[]; confusing: string[]; negative?: boolean; current?: boolean; exact?: boolean };
const cases: IntentCase[] = corpus;
const rows = cases.map(entry => {
  const results = runSafeLunrSearch(index, entry.query).flatMap(result => {
    const doc = documents.get(result.ref);
    return doc ? [{ ...doc, score: result.score }] : [];
  });
  const top5 = rankSearchResults(entry.query, results).slice(0, 5).map(doc => doc.id);
  const rank = top5.findIndex(id => entry.acceptable.includes(id));
  return { id: entry.id, split: entry.split, top5, top1Success: entry.negative ? top5.length === 0 : rank === 0,
    top5Success: entry.negative ? top5.length === 0 : rank >= 0, confusingFirst: entry.confusing.includes(top5[0]),
    current: entry.current === true, exact: entry.exact === true };
});
const report = {
  documentCount: SEARCH_DOCUMENTS.length,
  splits: ['development', 'held-out'].map(split => {
    const subset = rows.filter(row => row.split === split);
    return { split, queries: subset.length, top1Success: subset.filter(row => row.top1Success).length, top5Success: subset.filter(row => row.top5Success).length };
  }), rows,
};

describe('offline search intent corpus', () => {
  it('keeps exact identifiers and current-operation questions on their intended evidence paths', () => {
    if (process.env.REPORT_SEARCH_INTENTS === '1') console.log('SEARCH_INTENT_REPORT=' + JSON.stringify(report));
    const failures = rows.filter(row => (row.current || row.exact) && (!row.top1Success || row.confusingFirst));
    expect(failures).toEqual([]);
    for (const entry of cases) for (const id of entry.acceptable) expect(documents.has(id), `Corpus destination ${id} must exist`).toBe(true);
  });
  it('reports baseline regressions without turning previously missed typo queries into fabricated successes', () => {
    if (process.env.REPORT_SEARCH_INTENTS === '1') return;
    const baseline = JSON.parse(readFileSync(new URL('../fixtures/search/intent-baseline.json', import.meta.url), 'utf8')) as typeof report;
    const prior = new Map(baseline.rows.map(row => [row.id, row]));
    for (const row of rows) {
      const previous = prior.get(row.id);
      expect(previous, `Unrecorded corpus case ${row.id}`).toBeDefined();
      if (previous?.top1Success) expect(row.top1Success, `${row.id} top-1 regression`).toBe(true);
      if (previous?.top5Success) expect(row.top5Success, `${row.id} top-5 regression`).toBe(true);
    }
  });
});
