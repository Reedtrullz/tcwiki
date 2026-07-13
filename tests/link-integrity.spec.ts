import { test, expect } from '@playwright/test';
import { publicSitemapRoutes } from '../src/lib/sitemap';

interface RenderedLink {
  hash: string;
  path: string;
  rel: string;
  rawHref: string;
  resolvedHref: string;
  sourceRoute: string;
  target: string;
  text: string;
}

interface ConsoleProblem {
  message: string;
  route: string;
  type: string;
}

const LOCAL_ORIGIN = 'http://localhost:3000';
const PRODUCTION_ORIGIN = 'https://wiki.thorchain.no';
const RENDERED_CONSOLE_PROBLEM_PATTERN = /Application error|Unhandled Runtime Error|Hydration failed|hydration error|cannot be a child of|validateDOMNesting|Minified React error|ReferenceError|TypeError/i;

function normalizePath(pathname: string) {
  if (pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '');
}

function linkLabel(link: RenderedLink) {
  return link.text ? `"${link.text}"` : link.rawHref;
}

test.describe('THORChain Wiki rendered link integrity', () => {
  test('rendered internal links point at public routes and existing anchors', async ({ page }) => {
    test.slow();

    const publicRoutes = publicSitemapRoutes().map((route) => route.path);
    const publicRouteSet = new Set(publicRoutes);
    const idsByRoute = new Map<string, Set<string>>();
    const renderedLinks: RenderedLink[] = [];
    const consoleProblems: ConsoleProblem[] = [];
    const newWindowSecurityFailures: string[] = [];
    let currentRoute = '<not navigated>';

    page.on('console', (message) => {
      if (!['error', 'warning'].includes(message.type())) {
        return;
      }

      const text = message.text();
      if (RENDERED_CONSOLE_PROBLEM_PATTERN.test(text)) {
        consoleProblems.push({
          message: text,
          route: currentRoute,
          type: message.type(),
        });
      }
    });
    page.on('pageerror', (error) => {
      consoleProblems.push({
        message: error.message,
        route: currentRoute,
        type: 'pageerror',
      });
    });

    for (const route of publicRoutes) {
      currentRoute = route;
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });

      const snapshot = await page.locator('body').evaluate(() => ({
        ids: Array.from(document.querySelectorAll('[id]'))
          .map((element) => element.id)
          .filter(Boolean),
        links: Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]')).map((anchor) => ({
          rawHref: anchor.getAttribute('href') ?? '',
          resolvedHref: anchor.href,
          rel: anchor.getAttribute('rel') ?? '',
          target: anchor.getAttribute('target') ?? '',
          text: (anchor.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
        })),
      }));

      idsByRoute.set(route, new Set(snapshot.ids));

      for (const link of snapshot.links) {
        if (!link.rawHref || /^(mailto|tel):/i.test(link.rawHref)) {
          continue;
        }

        if (link.target === '_blank') {
          const relTokens = new Set(link.rel.split(/\s+/).filter(Boolean).map((token) => token.toLowerCase()));
          if (!relTokens.has('noopener') || !relTokens.has('noreferrer')) {
            newWindowSecurityFailures.push(`${route}: ${link.text ? `"${link.text}"` : link.rawHref} -> ${link.rawHref} opens a new window without noopener and noreferrer`);
          }
        }

        const url = new URL(link.resolvedHref);
        if (url.origin !== LOCAL_ORIGIN && url.origin !== PRODUCTION_ORIGIN) {
          continue;
        }

        renderedLinks.push({
          ...link,
          hash: decodeURIComponent(url.hash.slice(1)),
          path: normalizePath(url.pathname),
          sourceRoute: route,
        });
      }
    }

    const failures: string[] = [];

    for (const link of renderedLinks) {
      if (!publicRouteSet.has(link.path)) {
        failures.push(`${link.sourceRoute}: ${linkLabel(link)} -> ${link.rawHref} resolves to non-public route ${link.path}`);
        continue;
      }

      if (link.hash && !idsByRoute.get(link.path)?.has(link.hash)) {
        failures.push(`${link.sourceRoute}: ${linkLabel(link)} -> ${link.rawHref} resolves to missing anchor #${link.hash} on ${link.path}`);
      }
    }

    expect(
      consoleProblems.map((problem) => `${problem.route}: ${problem.type}: ${problem.message}`)
    ).toEqual([]);
    expect(newWindowSecurityFailures).toEqual([]);
    expect(failures).toEqual([]);
  });
});
