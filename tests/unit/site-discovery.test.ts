import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { CONTENT_ENTRIES } from '@/lib/content/registry';
import { publicSitemapRoutes } from '@/lib/sitemap';
import { SITE_ORIGIN, routeUrl } from '@/lib/site';

describe('site discovery routes', () => {
  it('builds canonical absolute URLs', () => {
    expect(routeUrl('/')).toBe(SITE_ORIGIN);
    expect(routeUrl('/network')).toBe(`${SITE_ORIGIN}/network`);
    expect(routeUrl('network')).toBe(`${SITE_ORIGIN}/network`);
  });

  it('exposes home, search, and every registry content route exactly once', () => {
    const routes = publicSitemapRoutes();
    const paths = routes.map((route) => route.path);
    const expectedPaths = ['/', '/search', ...CONTENT_ENTRIES.map((entry) => entry.href)];

    expect(paths).toEqual(expectedPaths);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.some((path) => path.includes('#'))).toBe(false);
    expect(paths.some((path) => path.includes('?'))).toBe(false);
    expect(paths.some((path) => path.startsWith('/api/'))).toBe(false);
    expect(paths).not.toContain('/opengraph-image');
    expect(paths).not.toContain('/twitter-image');
  });

  it('keeps sitemap entries to canonical route discovery without fake freshness hints', () => {
    const entries = sitemap();

    expect(entries).toEqual(publicSitemapRoutes().map((route) => ({
      url: routeUrl(route.path),
    })));
  });

  it('allows public pages, points at the sitemap, and excludes API routes from crawlers', () => {
    expect(robots()).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/api/', '/search?*'],
        },
      ],
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
      host: SITE_ORIGIN,
    });
  });
});
