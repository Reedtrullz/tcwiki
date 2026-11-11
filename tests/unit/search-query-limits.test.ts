import { describe, expect, it, vi } from 'vitest';
import {
  SEARCH_QUERY_MAX_CHARACTERS,
  SEARCH_QUERY_MAX_TERMS,
  admitSearchQuery,
  runAdmittedLunrSearch,
} from '@/lib/search/query-limits';

describe('search query admission', () => {
  it('admits ordinary queries and exact identifiers', () => {
    for (const query of ['rune', 'can I swap right now', 'BTC.BTC', 'recommended_min_amount_in', 'a'.repeat(64)]) {
      expect(admitSearchQuery(query), query).toEqual({ ok: true, query });
    }
  });

  it('admits the exact character and term boundaries', () => {
    expect(admitSearchQuery('a'.repeat(SEARCH_QUERY_MAX_CHARACTERS)).ok).toBe(true);
    const terms = Array.from({ length: SEARCH_QUERY_MAX_TERMS }, (_, index) => `term${index}`).join(' ');
    expect(admitSearchQuery(terms).ok).toBe(true);
  });

  it('rejects overlong input before the index is touched', () => {
    const search = vi.fn(() => [{ ref: 'rune', score: 1 }]);
    const query = 'a'.repeat(SEARCH_QUERY_MAX_CHARACTERS + 1);
    expect(admitSearchQuery(query)).toEqual({
      ok: false,
      reason: 'too-long',
      message: `Search is limited to ${SEARCH_QUERY_MAX_CHARACTERS} characters. Shorten the query and try again.`,
    });
    expect(runAdmittedLunrSearch({ search }, query)).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });

  it('rejects too many distinct terms before the index is touched', () => {
    const search = vi.fn(() => [{ ref: 'rune', score: 1 }]);
    const query = Array.from({ length: SEARCH_QUERY_MAX_TERMS + 1 }, (_, index) => `term${index}`).join(' ');
    const admission = admitSearchQuery(query);
    expect(admission).toMatchObject({ ok: false, reason: 'too-many-terms' });
    expect(admission.ok ? '' : admission.message).toBe(
      `Search is limited to ${SEARCH_QUERY_MAX_TERMS} distinct terms. Remove some terms and try again.`,
    );
    expect(runAdmittedLunrSearch({ search }, query)).toEqual([]);
    expect(search).not.toHaveBeenCalled();
  });

  it('counts repeated terms once and delegates admitted queries unchanged', () => {
    expect(admitSearchQuery('rune '.repeat(SEARCH_QUERY_MAX_TERMS)).ok).toBe(true);
    const search = vi.fn(() => [{ ref: 'rune', score: 1 }]);
    expect(runAdmittedLunrSearch({ search }, 'RUNE settlement')).toEqual([{ ref: 'rune', score: 1 }]);
    expect(search).toHaveBeenCalledWith('RUNE settlement');
    expect(search).toHaveBeenCalledTimes(1);
  });
});
