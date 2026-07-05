import type { MetadataRoute } from 'next';
import { CONTENT_ENTRIES } from '@/lib/content/registry';
import { routeUrl } from '@/lib/site';

interface PublicRoute {
  path: string;
}

export function publicSitemapRoutes(): PublicRoute[] {
  const routes = [
    {
      path: '/',
    },
    {
      path: '/search',
    },
    ...CONTENT_ENTRIES.map((entry) => ({ path: entry.href })),
  ];

  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.path)) {
      return false;
    }
    seen.add(route.path);
    return true;
  });
}

export function buildSitemap(): MetadataRoute.Sitemap {
  return publicSitemapRoutes().map((route) => ({
    url: routeUrl(route.path),
  }));
}
