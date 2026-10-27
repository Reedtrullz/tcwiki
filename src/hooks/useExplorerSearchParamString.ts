'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  getExplorerSearchParamString,
  subscribeExplorerQuery,
} from '@/lib/explorer-url';

/**
 * Explorer filter query string that stays in sync with `replaceExplorerUrl`.
 * Next `useSearchParams` alone can lag behind `history.replaceState` (Next 16.4+),
 * which resets controlled search inputs to the last committed URL value while typing.
 * Server/hydration still seed from Next so SSR markup matches the request URL.
 */
export function useExplorerSearchParamString(): string {
  const nextString = useSearchParams().toString();
  const getServerSnapshot = useCallback(() => nextString, [nextString]);
  return useSyncExternalStore(
    subscribeExplorerQuery,
    getExplorerSearchParamString,
    getServerSnapshot,
  );
}
