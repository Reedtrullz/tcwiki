import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
import { getSearchQueryTerms, runSafeLunrSearch } from '@/lib/search/lunr-query';

const index = lunr(function () {
  this.ref('id');
  this.field('title');
  this.add({ id: 'rune', title: 'RUNE settlement asset' });
  this.add({ id: 'tss', title: 'Threshold signatures' });
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
});
