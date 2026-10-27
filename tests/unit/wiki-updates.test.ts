import { describe, expect, it } from 'vitest';
import { WIKI_CHANGE_RECORDS } from '@/lib/data/static';
import { buildWikiUpdateFeed, latestWikiUpdateDate } from '@/lib/wiki-updates';
import { GET } from '@/app/updates/feed.xml/route';

describe('authored wiki update feed', () => {
  it('uses stable IDs, actual review dates and explicit content-update boundaries', () => {
    expect(new Set(WIKI_CHANGE_RECORDS.map(record => record.data.id)).size).toBe(WIKI_CHANGE_RECORDS.length);
    expect(WIKI_CHANGE_RECORDS.map(record => record.data.id)).toEqual([
      'ilp-history-boundary-2026-10-02',
      'memoless-claim-evidence-2026-10-03',
    ]);
    for (const { data } of WIKI_CHANGE_RECORDS) {
      expect(data.id).toMatch(/^[a-z0-9-]+$/);
      expect(data.sourceDate).toMatch(/^2026-10-0[23]$/);
      expect(data.reviewedAt).toBe(data.sourceDate);
      expect(Number.isFinite(Date.parse(`${data.sourceDate}T00:00:00Z`))).toBe(true);
      expect(data.reviewedAt >= data.sourceDate).toBe(true);
      expect(data.href).toMatch(/^\/(?:deep-dives\/clp|governance#incident-memoless-spam-2026-08)$/);
    }
    expect(latestWikiUpdateDate()).toBe('2026-10-03');
    const feed = buildWikiUpdateFeed();
    expect(feed).toContain('<rss version="2.0"');
    expect(feed).toContain('urn:tcwiki:update:memoless-claim-evidence-2026-10-03');
    expect(feed).toContain('Source observation: 2026-10-03. Wiki review: 2026-10-03.');
    expect(feed).toContain('https://gitlab.com/thorchain/thornode/-/releases/v3.20.0');
    expect(feed).toContain('historical');
    expect(feed).not.toContain('new exploit today');
    expect(feed).not.toContain('&nbsp;');
  });

  it('escapes XML text and attributes', () => {
    const record = WIKI_CHANGE_RECORDS[0];
    const originalTitle = record.data.title;
    record.data.title = 'A & <B> "C"';
    try {
      const feed = buildWikiUpdateFeed();
      expect(feed).toContain('A &amp; &lt;B&gt; &quot;C&quot;');
    } finally {
      record.data.title = originalTitle;
    }
  });
  it('returns the same source-backed authored records in a well-typed feed response', async () => {
    const response = GET();
    expect(response.headers.get('content-type')).toContain('application/rss+xml');
    const feed = await response.text();
    for (const record of WIKI_CHANGE_RECORDS) expect(feed).toContain(`urn:tcwiki:update:${record.data.id}`);
  });
});
