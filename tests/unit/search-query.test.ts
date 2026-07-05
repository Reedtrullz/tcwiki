import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
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
});
