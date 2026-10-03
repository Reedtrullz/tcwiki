export const EXPLORER_QUERY_EVENT = 'wiki-explorer-query-change';

/** Replace only this explorer's query keys; typing does not create history entries. */
export function mergeExplorerUrl(currentHref: string, nextHref: string, ownedParameters: readonly string[]): string {
  const current = new URL(currentHref), next = new URL(nextHref, current);
  if (next.origin !== current.origin || next.pathname !== current.pathname) throw new Error('Explorer filters must stay on the current route.');
  for (const key of ownedParameters) {
    current.searchParams.delete(key);
    for (const value of next.searchParams.getAll(key)) current.searchParams.append(key, value);
  }
  // Keep a reader's fragment; use the explorer destination when there is none.
  current.hash ||= next.hash;
  return `${current.pathname}${current.search}${current.hash}`;
}

export function replaceExplorerUrl(nextHref: string, ownedParameters: readonly string[]) {
  if (typeof window === 'undefined') return;
  const next = mergeExplorerUrl(window.location.href, nextHref, ownedParameters);
  const current = new URL(window.location.href);
  if (next === `${current.pathname}${current.search}${current.hash}`) return;
  // Public external-write form: both Next and vinext preserve their metadata.
  // Reusing an app-owned state object makes vinext treat this as traversal.
  window.history.replaceState(null, '', next);
  window.dispatchEvent(new Event(EXPLORER_QUERY_EVENT));
}
