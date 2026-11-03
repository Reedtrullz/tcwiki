import lunr from 'lunr';
import { describe, expect, it, vi } from 'vitest';
import { getSearchQueryTerms, runSafeLunrSearch } from '@/lib/search/lunr-query';

const index = lunr(function () {
  this.ref('id');
  this.field('title');
  this.add({ id: 'rune', title: 'RUNE settlement asset' });
  this.add({ id: 'tss', title: 'Threshold signatures' });
  this.add({ id: 'notation', title: 'SECURE+ secured asset THOR.RUNE BTC.BTC notation' });
});

describe('safe Lunr search queries', () => {
  it('keeps query terms useful for snippets', () => {
    expect(getSearchQueryTerms('RUNE settlement')).toEqual([
      'rune settlement',
      'settlement',
      'rune',
    ]);
    expect(getSearchQueryTerms('  RUNE:rune BTC.BTC  ')).toEqual(['rune:rune btc.btc', 'rune', 'btc']);
    expect(getSearchQueryTerms('İ K RÜNE')).toEqual(['i̇ k rüne', 'ne']);
  });

  it('falls back to tokenized search when Lunr query syntax is invalid', () => {
    expect(runSafeLunrSearch(index, 'rune:').map((result) => result.ref)).toContain('rune');
    expect(runSafeLunrSearch(index, 'title:').map((result) => result.ref)).toEqual([]);
    expect(runSafeLunrSearch(index, 'foo~x')).toEqual([]);
  });

  it('falls back to tokenized search when asset notation syntax returns no raw matches', () => {
    expect(runSafeLunrSearch(index, 'SECURE+').map((result) => result.ref)).toContain('notation');
    expect(runSafeLunrSearch(index, 'THOR.RUNE').map((result) => result.ref)).toContain('notation');
    expect(runSafeLunrSearch(index, 'BTC.BTC').map((result) => result.ref)).toContain('notation');
  });

  it.each([
    { query: ' RUNE settlement ', results: [{ ref: 'rune', score: 1 }] },
    { query: 'BTC.BTC', results: [{ ref: 'notation', score: 2 }] },
    { query: 'unknown words', results: [] },
  ])('avoids fallback tokenization when raw search suffices for $query', ({ query, results }) => {
    const search = vi.fn(() => results);
    const split = vi.spyOn(String.prototype, 'split');
    let tokenizations: number;
    let actual: ReturnType<typeof runSafeLunrSearch>;
    try {
      actual = runSafeLunrSearch({ search }, query);
      tokenizations = split.mock.calls.length;
    } finally {
      split.mockRestore();
    }
    expect(actual).toBe(results);
    expect(tokenizations).toBe(0);
    expect(search.mock.calls).toHaveLength(1);
  });

  it.each([
    { query: '', outcomes: [], calls: [] },
    { query: ' \t ', outcomes: [], calls: [] },
    { query: '!!!', outcomes: ['throw'], calls: ['!!!'] },
    { query: '日本', outcomes: ['throw'], calls: ['日本'] },
    { query: 'RÜNE 日本', outcomes: ['miss', 'hit'], calls: ['RÜNE 日本', 'ne ne*'] },
    { query: 'rune', outcomes: ['throw', 'hit'], calls: ['rune', 'rune rune*'] },
    { query: 'rune:', outcomes: ['miss', 'throw', 'hit'], calls: ['rune:', 'rune rune*', 'rune rune*'] },
    { query: 'rune:', outcomes: ['miss', 'throw', 'throw'], calls: ['rune:', 'rune rune*', 'rune rune*'] },
    { query: 'rune:', outcomes: ['throw', 'throw'], calls: ['rune:', 'rune rune*'] },
    { query: 'rune:rune btc', outcomes: ['miss', 'hit'], calls: ['rune:rune btc', 'rune rune* btc btc*'] },
  ])('preserves attempts for $query with $outcomes', ({ query, outcomes, calls }) => {
    const hit = [{ ref: 'result', score: 3 }];
    let attempt = 0;
    const search = vi.fn((argument: string) => {
      expect(argument).toBe(calls[attempt]);
      const outcome = outcomes[attempt++];
      if (outcome === 'throw') throw new Error('search failed');
      return outcome === 'hit' ? hit : [];
    });
    expect(runSafeLunrSearch({ search }, query)).toEqual(outcomes.includes('hit') ? hit : []);
    expect(search.mock.calls).toEqual(calls.map((argument) => [argument]));
  });
});
