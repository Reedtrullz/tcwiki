import { TASK_INTENT_GUIDES } from '@/lib/content/registry';
import type { SearchDoc } from '@/lib/search/registry';

export type SearchResultWithScore = SearchDoc & { score: number };

const taskGuidesBySearchId = new Map(TASK_INTENT_GUIDES.map((guide) => [`task:${guide.id}`, guide]));
const TASK_QUERY_STOPWORDS = new Set([
  'a',
  'an',
  'are',
  'can',
  'did',
  'do',
  'does',
  'for',
  'how',
  'i',
  'is',
  'me',
  'my',
  'of',
  'should',
  'the',
  'to',
  'use',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
]);

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizedWords(value: string) {
  return normalizeSearchText(value)
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function taskQueryBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'task') {
    return 0;
  }

  const guide = taskGuidesBySearchId.get(doc.id);
  if (!guide) {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const candidateTexts = [
    guide.label,
    guide.question,
    guide.description,
    ...guide.searchTerms,
  ].map(normalizeSearchText);

  if (candidateTexts.some((text) => text === normalizedQuery)) {
    return 1000;
  }

  if (candidateTexts.some((text) => text.includes(normalizedQuery) || normalizedQuery.includes(text))) {
    return 750;
  }

  const words = normalizedWords(query).filter((word) => !TASK_QUERY_STOPWORDS.has(word));
  const combined = candidateTexts.join(' ');
  if (words.length > 1 && words.every((word) => combined.includes(word))) {
    return 500;
  }

  return 0;
}

function glossaryDefinitionBoost(query: string, doc: SearchDoc) {
  if (doc.type !== 'glossary') {
    return 0;
  }

  const normalizedQuery = normalizeSearchText(query);
  const normalizedTitle = normalizeSearchText(doc.title);
  if (!normalizedQuery || !normalizedTitle) {
    return 0;
  }

  const definitionQueries = [
    `what is ${normalizedTitle}`,
    `what are ${normalizedTitle}`,
    `define ${normalizedTitle}`,
    `${normalizedTitle} definition`,
    `definition of ${normalizedTitle}`,
  ];

  if (definitionQueries.includes(normalizedQuery)) {
    return 1000;
  }

  return normalizedQuery === normalizedTitle && normalizedWords(normalizedTitle).length > 1 ? 750 : 0;
}

export function rankSearchResults<T extends SearchResultWithScore>(query: string, results: T[]): T[] {
  return results
    .map((result, index) => ({
      result,
      index,
      adjustedScore: result.score + taskQueryBoost(query, result) + glossaryDefinitionBoost(query, result),
    }))
    .sort((a, b) => {
      if (b.adjustedScore !== a.adjustedScore) {
        return b.adjustedScore - a.adjustedScore;
      }
      return a.index - b.index;
    })
    .map(({ result }) => result);
}
