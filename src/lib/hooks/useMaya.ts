'use client';

import useSWR from 'swr';
import { MayaAPI } from '@/lib/api/maya';
import type { LiveDataResult, MayaNetworkStats, MayaNode } from '@/lib/types';
import { requireLiveData } from '@/lib/live-presentation';
import { useLivePresentation } from '@/lib/hooks/useLivePresentation';

const SWR_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};


export function useMayaNetwork() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<MayaNetworkStats>>(
    'maya:network',
    () => requireLiveData(() => MayaAPI.getNetwork()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useMayaNodes() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<MayaNode[]>>(
    'maya:nodes',
    () => requireLiveData(() => MayaAPI.getNodes()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}
