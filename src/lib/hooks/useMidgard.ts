'use client';

import useSWR from 'swr';
import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import {
  DynamicL1FeeStatus,
  HistoryItem,
  LiveDataResult,
  MidgardHealth,
  NetworkStats,
  NetworkStatus,
  Pool,
  RunePoolPolStatus,
  SwapQuoteProbeResult,
  SwapQuoteRequest,
} from '@/lib/types';
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

export function useMidgardHealth() {
  const { data, error, isLoading } = useSWR<LiveDataResult<MidgardHealth>>(
    'midgard:health',
    () => MidgardAPI.getHealth(),
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

export function useDynamicL1FeeStatus() {
  const { data, error, isLoading } = useSWR<LiveDataResult<DynamicL1FeeStatus>>(
    'thornode:dynamic-l1-fee-status',
    () => ThornodeAPI.getDynamicL1FeeStatus(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function useRunePoolPolStatus() {
  const { data, error, isLoading } = useSWR<LiveDataResult<RunePoolPolStatus>>(
    'thornode:runepool-pol-status',
    () => ThornodeAPI.getRunePoolPolStatus(),
    SWR_OPTIONS
  );
  return unwrapLiveResult(data, error, isLoading);
}

export function useSwapQuoteProbe(request: SwapQuoteRequest | null, enabled = Boolean(request), requestVersion = 0) {
  const { data, error, isLoading } = useSWR<LiveDataResult<SwapQuoteProbeResult>>(
    enabled && request
      ? ['thornode:swap-quote-probe', request.fromAsset, request.toAsset, request.amountBaseUnits, requestVersion]
      : null,
    () => {
      if (!request) {
        throw new Error('Swap quote request is not set.');
      }
      return ThornodeAPI.getSwapQuoteProbe(request);
    },
    {
      refreshInterval: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 1000,
    }
  );
  return unwrapLiveResult(data, error, isLoading);
}
