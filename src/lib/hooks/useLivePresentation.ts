'use client';
import { useEffect, useState } from 'react';
import type { LiveDataResult } from '@/lib/types';
import { assessLivePresentation, type LivePresentationPolicy } from '@/lib/live-presentation';
import { liveResultIsDegraded } from '@/lib/live-result';

export function useLivePresentation<T>(result: LiveDataResult<T> | undefined, error: unknown, isLoading: boolean, isValidating: boolean, policy: LivePresentationPolicy<T>, refresh: () => unknown, initialNow?: number) {
  // Node/Worker navigator may exist without onLine. Initial markup is shared;
  // browser connectivity is observed only after hydration.
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => initialNow ?? Date.now());
  const interval = policy.kind === 'operational' ? 1000 : policy.kind === 'aggregate' ? 10000 : 0;
  useEffect(() => {
    const update = () => { setNow(Date.now()); setOnline(navigator.onLine); };
    const timer = interval ? window.setInterval(update, interval) : undefined;
    document.addEventListener('visibilitychange', update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      if (timer !== undefined) window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [interval]);
  useEffect(() => {
    const timer = window.setTimeout(() => { setNow(Date.now()); setOnline(navigator.onLine); }, 0);
    return () => window.clearTimeout(timer);
  }, [result?.checkedAt]);
  const errorMessage = error instanceof Error ? error.message : !online ? 'Browser is offline.' : undefined;
  const assessedAt = now;
  const resolved = result || errorMessage ? assessLivePresentation(result, errorMessage, isValidating, policy, assessedAt) : undefined;
  return { result: resolved, data: resolved?.data, status: resolved?.status, error: errorMessage ?? resolved?.error,
    source: resolved?.source, sources: resolved?.sources, checkedAt: resolved?.checkedAt, isLoading,
    isDegraded: liveResultIsDegraded(resolved), isRefreshing: isValidating, refresh };
}
