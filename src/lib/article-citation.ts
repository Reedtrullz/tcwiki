import type { ContentEntry } from '@/lib/content/registry';
import { routeUrl } from '@/lib/site';

export function buildArticleCitation(entry: ContentEntry, boundary: string, format: 'text' | 'markdown', fragment = ''): string {
  const url = routeUrl(entry.href) + (fragment.startsWith('#') ? fragment : '');
  const title = format === 'markdown' ? `[${entry.title.replace(/[\[\]\\]/g, '\\$&')}](${url})` : `${entry.title}\n${url}`;
  return [title, `Wiki review: ${entry.reviewedAt}; next review due: ${entry.nextReviewDue}; confidence: ${entry.confidence}.`,
    `Evidence boundary: ${boundary}`, 'Sources:',
    ...entry.sources.map(source => `- ${source.label}: ${source.url}${source.retrievedAt ? `; source retrieved ${source.retrievedAt}` : '; retrieval date not recorded'}${source.notes ? `; ${source.notes}` : ''}`),
    'Citation metadata only. Source retrieval and wiki review do not establish current protocol state. Article redistribution policy awaits owner approval.',
  ].join('\n');
}
