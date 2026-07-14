import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { getContentEntry } from '@/lib/content/registry';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { streamingSwapsSource } from '@/lib/sources';

const REVIEWED_AT = '2026-07-14';
const NEXT_REVIEW_DUE = '2026-08-14';

const TERM_IDS = [
  'quote',
  'quote-expiry',
  'recommended-min-amount-in',
  'dust-threshold',
  'refund-address',
  'streaming-swap',
  'liquidity-tolerance-bps',
] as const;

describe('swap glossary and route content review', () => {
  it('refreshes the bounded route and glossary cohort together', () => {
    for (const id of ['docs', 'glossary', 'protocol', 'search']) {
      const entry = getContentEntry(id);
      expect(entry.reviewedAt, id).toBe(REVIEWED_AT);
      expect(entry.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const id of TERM_IDS) {
      const term = GLOSSARY_TERMS.find((candidate) => candidate.id === id);
      expect(term?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(term?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
      expect(term?.confidence, id).toBe('official');
    }
  });

  it('pins the official source set retrieved for this review', () => {
    const reviewedSources = new Map(
      TERM_IDS.flatMap((id) => (
        GLOSSARY_TERMS.find((term) => term.id === id)?.sources ?? []
      )).map((source) => [source.url, source]),
    );

    for (const url of [
      'https://dev.thorchain.org/concepts/querying-thorchain.html',
      'https://dev.thorchain.org/swap-guide/quickstart-guide.html',
      'https://dev.thorchain.org/swap-guide/streaming-swaps.html',
      'https://dev.thorchain.org/concepts/memos.html',
      'https://dev.thorchain.org/concepts/fees.html',
    ]) {
      expect(reviewedSources.get(url)?.retrievedAt, url).toBe(REVIEWED_AT);
    }

    expect(streamingSwapsSource.url).toBe('https://dev.thorchain.org/swap-guide/streaming-swaps.html');
  });

  it('keeps quote and memo fields inside their documented proof boundaries', () => {
    const definition = (id: (typeof TERM_IDS)[number]) => (
      GLOSSARY_TERMS.find((term) => term.id === id)?.definition ?? ''
    );

    expect(definition('quote')).toContain('does not sign, broadcast, or prove settlement');
    expect(definition('quote-expiry')).toContain('valid for only ten minutes');
    expect(definition('recommended-min-amount-in')).toContain('1e8 units of the inbound asset');
    expect(definition('recommended-min-amount-in')).toContain('not an execution guarantee');
    expect(definition('dust-threshold')).toContain('amounts below it are ignored');
    expect(definition('refund-address')).toContain('valid for the inbound asset chain');
    expect(definition('refund-address')).toContain('not a refund cause or delivery proof');
    expect(definition('streaming-swap')).toContain('market swaps auto-stream by default');
    expect(definition('streaming-swap')).toContain('interval 0 enables rapid execution');
    expect(definition('liquidity-tolerance-bps')).toContain('fee-aware minimum output');
    expect(definition('liquidity-tolerance-bps')).toContain('accounts for swap and outbound fees');
  });

  it('carries the reviewed definitions into search and protocol guidance', () => {
    for (const id of TERM_IDS) {
      const term = GLOSSARY_TERMS.find((candidate) => candidate.id === id);
      const searchDoc = SEARCH_DOCUMENTS.find((doc) => doc.id === `glossary:${id}`);
      expect(searchDoc?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(searchDoc?.content, id).toContain(term?.definition);
    }

    const protocolPage = readFileSync('src/app/protocol/page.tsx', 'utf8');
    expect(protocolPage).toContain('Request a fresh quote immediately before submission');
    expect(protocolPage).toContain('market swaps can auto-stream');
    expect(getContentEntry('protocol').sources).toContainEqual(streamingSwapsSource);
  });
});
