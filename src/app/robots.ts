import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, routeUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/search?*'],
      },
    ],
    sitemap: routeUrl('/sitemap.xml'),
    host: SITE_ORIGIN,
  };
}
