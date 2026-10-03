import { parseDeepDiveSource } from './deep-dive-toc.mjs';

// The pilot deliberately supports only its registered guide and incident claims.
export function validateKnowledgeLinks({ entries, claims, taskHref, readSource }) {
  const routes = new Map(entries.map(entry => [entry.href, entry]));
  for (const path of ['/governance', '/deep-dives/build-query-data']) {
    if (!routes.has(path)) throw new Error(`Deleted knowledge route: ${path}`);
  }
  const [path, anchor, extra] = taskHref.split('#');
  if (path !== '/deep-dives/build-query-data' || !anchor || extra !== undefined) throw new Error('Unsupported knowledge reading link.');
  const source = readSource('content/deep-dives/build-query-data.mdx');
  if (!parseDeepDiveSource(source).headings.some(heading => heading.id === anchor)) throw new Error(`Deleted knowledge section: ${taskHref}`);
  const ids = new Set(claims.map(claim => claim.id));
  if (ids.size !== claims.length) throw new Error('Duplicate knowledge claim ID.');
  for (const claim of claims) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claim.id)) throw new Error(`Invalid stable claim ID: ${claim.id}`);
    const url = new URL(claim.source.url);
    if (url.protocol !== 'https:') throw new Error(`Invalid claim source: ${claim.id}`);
    if (claim.supersedes && !ids.has(claim.supersedes)) throw new Error(`Deleted knowledge claim: ${claim.supersedes}`);
  }
}
