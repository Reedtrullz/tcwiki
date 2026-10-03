'use client';

import useSWR from 'swr';
import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI, { reassessThornodeResult } from '@/lib/api/thornode';
import {
  DynamicL1FeeStatus,
  DEFAULT_MIDGARD_POOL_PERIOD,
  HistoryItem,
  LiveDataResult,
  MidgardHealth,
  MidgardPoolPeriod,
  NetworkStats,
  NetworkStatus,
  Pool,
  RunePoolPolStatus,
  SwapQuoteProbeResult,
  SwapQuoteRequest,
  ThorchainNodeCoverageRow,
} from '@/lib/types';
import { liveDegraded } from '@/lib/trust';
import { requireLiveData } from '@/lib/live-presentation';
import { useLivePresentation } from '@/lib/hooks/useLivePresentation';
import { liveResultIsDegraded } from '@/lib/live-result';
import { DAILY_VOLUME_POOLS } from '@/lib/daily-volume';

const SWR_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
  shouldRetryOnError: false,
};


export function useNetworkData() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<NetworkStats>>(
    'midgard:network',
    () => requireLiveData(() => MidgardAPI.getNetworkData()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function usePools(period: MidgardPoolPeriod = DEFAULT_MIDGARD_POOL_PERIOD) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<Pool[]>>(
    ['midgard:pools', period],
    () => requireLiveData(() => MidgardAPI.getPools('available', period)),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useMidgardHealth() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<MidgardHealth>>(
    'midgard:health',
    () => requireLiveData(() => MidgardAPI.getHealth()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useEarningsHistory(interval = 'day', count = 30) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<HistoryItem[]>>(
    ['midgard:history', interval, count],
    () => requireLiveData(() => MidgardAPI.getHistory(interval, count)),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'historical' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useDailyVolume() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<Record<string, unknown>[]>[]>(
    'midgard:daily-volume',
    () => MidgardAPI.getDailyVolumeHistories(),
    SWR_OPTIONS
  );

  const result = data ? {
    status: data.every((entry) => !liveResultIsDegraded(entry)) ? 'ok' as const : 'degraded' as const,
    data,
    checkedAt: data.map(entry => entry.checkedAt).filter((time): time is string => Boolean(time)).sort()[0],
    sources: data.flatMap(entry => entry.sources ?? (entry.source ? [entry.source] : [])),
  } : undefined;

  const live = useLivePresentation(result, error, isLoading, isValidating, { kind: 'historical' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
  return { data: live.result?.data?.slice(0, DAILY_VOLUME_POOLS.length), networkResult: live.result?.data?.[DAILY_VOLUME_POOLS.length], result: live.result, error: live.error, isLoading, isDegraded: live.isDegraded, refresh: live.refresh, isRefreshing: live.isRefreshing };
}

export function useNetworkStatus(initialResult?: LiveDataResult<NetworkStatus>) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<NetworkStatus>>(
    'thornode:network-status',
    () => requireLiveData(() => ThornodeAPI.getNetworkStatus()),
    initialResult ? { ...SWR_OPTIONS, fallbackData: initialResult, revalidateOnMount: true } : SWR_OPTIONS
  );
  const seedClock = Date.parse(initialResult?.assessedAt ?? '');
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'operational', reassess: reassessThornodeResult }, () => mutate(current => current, { revalidate: true, throwOnError: false }), Number.isFinite(seedClock) ? seedClock : undefined);
}

export function useThorchainNodeCoverage() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<ThorchainNodeCoverageRow[]>>(
    'thornode:node-coverage',
    () => requireLiveData(() => ThornodeAPI.getNodeCoverage()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'aggregate' }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useDynamicL1FeeStatus() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<DynamicL1FeeStatus>>(
    'thornode:dynamic-l1-fee-status',
    () => requireLiveData(() => ThornodeAPI.getDynamicL1FeeStatus()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'operational', reassess: reassessThornodeResult }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
}

export function useRunePoolPolStatus() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<LiveDataResult<RunePoolPolStatus>>(
    'thornode:runepool-pol-status',
    () => requireLiveData(() => ThornodeAPI.getRunePoolPolStatus()),
    SWR_OPTIONS
  );
  return useLivePresentation(data, error, isLoading, isValidating, { kind: 'operational', reassess: reassessThornodeResult }, () => mutate(current => current, { revalidate: true, throwOnError: false }));
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
  const errorMessage = error instanceof Error ? error.message : undefined;
  const result = data ?? (errorMessage ? liveDegraded<SwapQuoteProbeResult>(errorMessage) : undefined);
  return { result, data: result?.data, status: result?.status, error: errorMessage ?? result?.error, source: result?.source, sources: result?.sources, checkedAt: result?.checkedAt, isLoading, isDegraded: liveResultIsDegraded(result) };
}
