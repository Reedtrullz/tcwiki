import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import { CONTENT_ENTRIES } from '@/lib/content/registry';
import { publicSitemapRoutes } from '@/lib/sitemap';
import { SITE_ORIGIN, routeUrl } from '@/lib/site';

const appDirectory = join(process.cwd(), 'src/app');

function collectPageFiles(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) {
        return collectPageFiles(path);
      }
      return entry === 'page.tsx' ? [path] : [];
    })
    .sort();
}

function pageFileToRoute(path: string) {
  const relativePath = relative(appDirectory, path);
  const routeDirectory = dirname(relativePath);
  if (routeDirectory === '.') {
    return '/';
  }

  const segments = routeDirectory.split(sep);
  if (segments.some((segment) => segment.startsWith('(') || segment.startsWith('@') || segment.startsWith('['))) {
    return null;
  }

  return `/${segments.join('/')}`;
}

describe('site discovery routes', () => {
  it('builds canonical absolute URLs', () => {
    expect(routeUrl('/')).toBe(SITE_ORIGIN);
    expect(routeUrl('/network')).toBe(`${SITE_ORIGIN}/network`);
    expect(routeUrl('network')).toBe(`${SITE_ORIGIN}/network`);
  });

  it('exposes home, search, and every registry content route exactly once', () => {
    const routes = publicSitemapRoutes();
    const paths = routes.map((route) => route.path);
    const expectedPaths = Array.from(new Set(['/', '/search', ...CONTENT_ENTRIES.map((entry) => entry.href)]));

    expect(paths).toEqual(expectedPaths);
    expect(new Set(paths).size).toBe(paths.length);
    expect(CONTENT_ENTRIES.some((entry) => entry.id === 'home' && entry.href === '/')).toBe(true);
    expect(paths.some((path) => path.includes('#'))).toBe(false);
    expect(paths.some((path) => path.includes('?'))).toBe(false);
    expect(paths.some((path) => path.startsWith('/api/'))).toBe(false);
    expect(paths).not.toContain('/opengraph-image');
    expect(paths).not.toContain('/twitter-image');
  });

  it('keeps physical public page routes aligned with the sitemap', () => {
    const physicalRoutes = collectPageFiles(appDirectory)
      .map(pageFileToRoute)
      .filter((route): route is string => Boolean(route));
    const sitemapRoutes = publicSitemapRoutes().map((route) => route.path);

    expect([...physicalRoutes].sort()).toEqual([...sitemapRoutes].sort());
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
