'use client';

import useSWR from 'swr';
import { MayaAPI } from '@/lib/api/maya';
import type { LiveDataResult, MayaNetworkStats, MayaNode } from '@/lib/types';
import { liveDegraded } from '@/lib/trust';
import { liveResultIsDegraded } from '@/lib/live-result';

const SWR_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
};

function unwrapLiveResult<T>(result: LiveDataResult<T> | undefined, error: unknown, isLoading: boolean) {
  const errorMessage = error instanceof Error ? error.message : undefined;
  const resolvedResult = result ?? (errorMessage ? liveDegraded<T>(errorMessage) : undefined);
  return {
    result: resolvedResult,
    data: resolvedResult?.data,
    status: resolvedResult?.status,
    error: errorMessage ?? resolvedResult?.error,
    source: resolvedResult?.source,
    sources: resolvedResult?.sources,
    checkedAt: resolvedResult?.checkedAt,
    isLoading,
    isDegraded: liveResultIsDegraded(resolvedResult),
  };
}

export function useMayaNetwork() {
  const { data, error, isLoading } = useSWR<LiveDataResult<MayaNetworkStats>>(
    'maya:network',
    () => MayaAPI.getNetwork(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function useMayaNodes() {
  const { data, error, isLoading } = useSWR<LiveDataResult<MayaNode[]>>(
    'maya:nodes',
    () => MayaAPI.getNodes(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}
