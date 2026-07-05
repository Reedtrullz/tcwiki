export const SITE_ORIGIN = 'https://wiki.thorchain.no';

export function routeUrl(path: string) {
  if (path === '/') {
    return SITE_ORIGIN;
  }

  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}
