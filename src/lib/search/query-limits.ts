import { runSafeLunrSearch } from '@/lib/search/lunr-query';

// Admission bounds keep URL, form and history queries from reaching the index,
// ranking or snippet work. Long enough for hashes, addresses and asset ids.
export const SEARCH_QUERY_MAX_CHARACTERS = 256;
export const SEARCH_QUERY_MAX_TERMS = 16;

export type SearchQueryAdmission =
  | { ok: true; query: string }
  | { ok: false; reason: 'too-long' | 'too-many-terms'; message: string };

export function admitSearchQuery(raw: string): SearchQueryAdmission {
  const query = raw.trim();
  if (query.length > SEARCH_QUERY_MAX_CHARACTERS) {
    return {
      ok: false,
      reason: 'too-long',
      message: `Search is limited to ${SEARCH_QUERY_MAX_CHARACTERS} characters. Shorten the query and try again.`,
    };
  }
  const terms = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  if (terms.size > SEARCH_QUERY_MAX_TERMS) {
    return {
      ok: false,
      reason: 'too-many-terms',
      message: `Search is limited to ${SEARCH_QUERY_MAX_TERMS} distinct terms. Remove some terms and try again.`,
    };
  }
  return { ok: true, query: raw };
}

interface BoundedSearchIndex {
  search(query: string): Array<{ ref: string; score: number }>;
}

export function runAdmittedLunrSearch(index: BoundedSearchIndex, raw: string) {
  return admitSearchQuery(raw).ok ? runSafeLunrSearch(index, raw) : [];
}
