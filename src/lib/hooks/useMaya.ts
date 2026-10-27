'use client';

import useSWR from 'swr';
import { MayaAPI } from '@/lib/api/maya';
import type { LiveDataResult, MayaNetworkStats, MayaNode } from '@/lib/types';
import { SWR_OPTIONS, unwrapLiveResult } from '@/lib/hooks/live-data';

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
