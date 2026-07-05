import type { Metadata } from 'next';
import { routeUrl } from '@/lib/site';

const defaultImageAlt = 'THORChain Wiki source-backed protocol encyclopedia';

export function createRouteMetadata({
  title,
  description,
  path,
  imageAlt = defaultImageAlt,
}: {
  title: string;
  description: string;
  path: string;
  imageAlt?: string;
}): Metadata {
  const canonical = routeUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/twitter-image'],
    },
  };
}
