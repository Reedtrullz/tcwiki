'use client';

import useSWR from 'swr';
import MidgardAPI from '@/lib/api/midgard';
import { NetworkStats, HistoryItem, Pool } from '@/lib/types';

const fetcher = {
  network: () => MidgardAPI.getNetworkData(),
  pools: () => MidgardAPI.getPools(),
  history: (interval = 'day', count = 30) => MidgardAPI.getHistory(interval, count),
};

export function useNetworkData() {
  const { data, error, isLoading } = useSWR<NetworkStats>('network', fetcher.network, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });
  return { data, error, isLoading };
}

export function usePools() {
  const { data, error, isLoading } = useSWR<Pool[]>('pools', fetcher.pools, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });
  return { data, error, isLoading };
}

export function useEarningsHistory(interval = 'day', count = 30) {
  const { data, error, isLoading } = useSWR<HistoryItem[]>(
    ['history', interval, count],
    () => fetcher.history(interval, count),
    {
      refreshInterval: 60000,
      revalidateOnFocus: false,
    }
  );
  return { data, error, isLoading };
}
