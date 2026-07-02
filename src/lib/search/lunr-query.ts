interface LunrSearchResult {
  ref: string;
  score: number;
}

interface LunrSearchIndex {
  search(query: string): LunrSearchResult[];
}

const SAFE_SEARCH_TERM = /^[a-z0-9]+$/i;

export function getSearchQueryTerms(query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  const terms = normalizedQuery
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 1);

  return Array.from(new Set([normalizedQuery, ...terms]))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
}

function getSafeFallbackQuery(query: string) {
  return getSearchQueryTerms(query)
    .filter((term) => SAFE_SEARCH_TERM.test(term))
    .map((term) => `${term}*`)
    .join(' ');
}

export function runSafeLunrSearch(index: LunrSearchIndex, query: string): LunrSearchResult[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  try {
    return index.search(trimmedQuery);
  } catch {
    const fallbackQuery = getSafeFallbackQuery(trimmedQuery);
    if (!fallbackQuery) {
      return [];
    }

    try {
      return index.search(fallbackQuery);
    } catch {
      return [];
    }
  }
}
