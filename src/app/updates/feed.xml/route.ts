import { buildWikiUpdateFeed } from '@/lib/wiki-updates';

export function GET() {
  return new Response(buildWikiUpdateFeed(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
