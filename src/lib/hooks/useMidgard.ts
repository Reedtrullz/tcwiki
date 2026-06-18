'use client';

import useSWR from 'swr';
import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import { HistoryItem, LiveDataResult, NetworkStats, NetworkStatus, Pool } from '@/lib/types';

const SWR_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
};

function unwrapLiveResult<T>(result: LiveDataResult<T> | undefined, error: unknown, isLoading: boolean) {
  const errorMessage = error instanceof Error ? error.message : undefined;
  return {
    result,
    data: result?.data,
    status: result?.status ?? (errorMessage ? 'degraded' : undefined),
    error: errorMessage ?? result?.error,
    source: result?.source,
    checkedAt: result?.checkedAt,
    isLoading,
    isDegraded: Boolean(errorMessage || result?.status === 'degraded'),
  };
}

export function useNetworkData() {
  const { data, error, isLoading } = useSWR<LiveDataResult<NetworkStats>>(
    'midgard:network',
    () => MidgardAPI.getNetworkData(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function usePools() {
  const { data, error, isLoading } = useSWR<LiveDataResult<Pool[]>>(
    'midgard:pools',
    () => MidgardAPI.getPools(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function useEarningsHistory(interval = 'day', count = 30) {
  const { data, error, isLoading } = useSWR<LiveDataResult<HistoryItem[]>>(
    ['midgard:history', interval, count],
    () => MidgardAPI.getHistory(interval, count),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function useNetworkStatus() {
  const { data, error, isLoading } = useSWR<LiveDataResult<NetworkStatus>>(
    'thornode:network-status',
    () => ThornodeAPI.getNetworkStatus(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}
