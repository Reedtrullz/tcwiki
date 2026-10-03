import { WIKI_CHANGE_RECORDS } from '@/lib/data/static';
import { routeUrl } from '@/lib/site';

const escapeXml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

export function latestWikiUpdateDate(): string {
  return WIKI_CHANGE_RECORDS.reduce(
    (latest, item) => item.data.reviewedAt > latest ? item.data.reviewedAt : latest,
    WIKI_CHANGE_RECORDS[0]?.data.reviewedAt ?? '1970-01-01'
  );
}

export function buildWikiUpdateFeed(): string {
  const items = [...WIKI_CHANGE_RECORDS]
    .sort((a, b) => b.data.reviewedAt.localeCompare(a.data.reviewedAt))
    .map(({ data, sources }) => `
    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(routeUrl(data.href))}</link>
      <guid isPermaLink="false">urn:tcwiki:update:${escapeXml(data.id)}</guid>
      <pubDate>${new Date(`${data.reviewedAt}T00:00:00.000Z`).toUTCString()}</pubDate>
      <description>${escapeXml(`${data.summary} Source observation: ${data.sourceDate}. Wiki review: ${data.reviewedAt}. Sources: ${sources.map(source => `${source.label} (${source.url})`).join('; ')}.`)}</description>
    </item>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>THORChain Wiki updates</title>
    <link>${escapeXml(routeUrl("/updates"))}</link>
    <description>Curated, source-backed updates to THORChain Wiki content.</description>
    <lastBuildDate>${new Date(`${latestWikiUpdateDate()}T00:00:00.000Z`).toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;
}
