import { describe, expect, it } from 'vitest';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { opReturnBitcoinMemoSource } from '@/lib/sources';
import { readFileSync } from 'node:fs';

describe('curated Bitcoin-only memo archive pointer', () => {
  it('owns one dated source record with an explicit classification and settlement boundary', () => {
    const record = SOURCE_MAP_SECTION_RECORDS.find(record => record.data.id === 'bitcoin-memo-archive');
    expect(record?.sources).toContainEqual(opReturnBitcoinMemoSource);
    expect(record?.freshness).toMatchObject({ checkedAt: '2026-10-03', confidence: 'curated' });
    expect(opReturnBitcoinMemoSource.url).toBe('https://opreturn.xyz/p/thorchain');
    expect(record?.data.caveat).toMatch(/Bitcoin.only/);
    expect(record?.data.nonClaims.join(' ')).toMatch(/settlement/);
    expect(record?.data.nonClaims.join(' ')).toMatch(/complete/i);
  });
  it('reuses the source in source map and guides and makes the bounded pointer searchable', () => {
    for (const id of ['docs', 'deep-dive-streaming-swaps-refunds', 'deep-dive-build-query-data']) {
      expect(getContentEntry(id).reviewedAt).toBe('2026-07-14');
      expect(getContentEntry(id).sources).not.toContainEqual(opReturnBitcoinMemoSource);
    }
    for (const slug of ['streaming-swaps-refunds', 'build-query-data']) expect(readFileSync(`content/deep-dives/${slug}.mdx`, 'utf8')).toContain('/docs#bitcoin-memo-archive');
    expect(SEARCH_DOCUMENTS.find(doc => doc.id === 'source-map:bitcoin-memo-archive')?.content).toContain('OP_RETURN');
  });
});
