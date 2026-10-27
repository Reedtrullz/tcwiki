import { useCallback, useEffect, useMemo, useRef } from 'react';
import { replaceExplorerUrl } from '@/lib/explorer-url';
import { normalizeStatsPoolPeriod, type StatsPoolExplorerFilters, type StatsPoolSortKey } from '@/lib/stats-dashboard';
import type { MidgardPoolPeriod } from '@/lib/types';

const poolSortQueryValues: Record<string, StatsPoolSortKey> = {
  depth: 'runeDepth',
  runeDepth: 'runeDepth',
  volume: 'volume24hRune',
  volume24hRune: 'volume24hRune',
  volume24hUsd: 'volume24hRune',
  liquidity: 'liquidityUsd',
  liquidityUsd: 'liquidityUsd',
  apy: 'poolAPYPercent',
  apyPercent: 'poolAPYPercent',
  poolAPY: 'poolAPYPercent',
  annualPercentageRate: 'annualPercentageRatePercent',
  asset: 'asset',
};

const poolSortParamValues: Record<StatsPoolSortKey, string> = {
  runeDepth: 'depth',
  volume24hRune: 'volume',
  liquidityUsd: 'liquidity',
  annualPercentageRatePercent: 'annualPercentageRate',
  poolAPYPercent: 'poolAPY',
  asset: 'asset',
};

function normalizePoolSortParam(value: string | null): StatsPoolSortKey {
  if (!value) {
    return 'runeDepth';
  }
  return poolSortQueryValues[value] ?? 'runeDepth';
}

function normalizePoolOptionParam(value: string | null, availableValues: string[]) {
  if (!value || value === 'all') {
    return 'all';
  }
  return availableValues.includes(value) ? value : 'all';
}

export interface UsePoolExplorerFiltersResult {
  poolFilters: StatsPoolExplorerFilters;
  updatePoolFilters: (partial: Partial<StatsPoolExplorerFilters>) => void;
  replacePoolFiltersInUrl: (nextFilters: StatsPoolExplorerFilters) => void;
  poolAvailableChains: string[];
  poolAvailableStatuses: string[];
  poolPeriod: MidgardPoolPeriod;
  updatePoolPeriod: (period: MidgardPoolPeriod) => void;
}

export function usePoolExplorerFilters({
  pathname,
  searchParamString,
  poolAvailableChains,
  poolAvailableStatuses,
}: {
  pathname: string;
  searchParamString: string;
  poolAvailableChains: string[];
  poolAvailableStatuses: string[];
}): UsePoolExplorerFiltersResult {
  const searchParams = useMemo(() => new URLSearchParams(searchParamString), [searchParamString]);

  const poolFilters = useMemo<StatsPoolExplorerFilters>(() => ({
    query: searchParams.get('pool_q') ?? '',
    chain: normalizePoolOptionParam(searchParams.get('pool_chain'), poolAvailableChains),
    status: normalizePoolOptionParam(searchParams.get('pool_status'), poolAvailableStatuses),
    sort: normalizePoolSortParam(searchParams.get('pool_sort')),
  }), [poolAvailableChains, poolAvailableStatuses, searchParams]);
  const poolPeriod = normalizeStatsPoolPeriod(searchParams.get('pool_period'));

  const latestPoolFiltersRef = useRef(poolFilters);
  useEffect(() => {
    latestPoolFiltersRef.current = poolFilters;
  }, [poolFilters]);

  const replacePoolFiltersInUrl = useCallback((nextFilters: StatsPoolExplorerFilters) => {
    const params = new URLSearchParams(searchParamString);
    const query = nextFilters.query.slice(0, 256);
    if (query) {
      params.set('pool_q', query);
    } else {
      params.delete('pool_q');
    }
    if (nextFilters.chain !== 'all') {
      params.set('pool_chain', nextFilters.chain);
    } else {
      params.delete('pool_chain');
    }
    if (nextFilters.status !== 'all') {
      params.set('pool_status', nextFilters.status);
    } else {
      params.delete('pool_status');
    }
    if (nextFilters.sort !== 'runeDepth') {
      params.set('pool_sort', poolSortParamValues[nextFilters.sort]);
    } else {
      params.delete('pool_sort');
    }
    const queryString = params.toString();
    replaceExplorerUrl(pathname + (queryString ? '?' + queryString : '') + '#available-pools', ['pool_q', 'pool_chain', 'pool_status', 'pool_sort']);
  }, [pathname, searchParamString]);

  const updatePoolFilters = useCallback((partialFilters: Partial<StatsPoolExplorerFilters>) => {
    const next = { ...latestPoolFiltersRef.current, ...partialFilters };
    latestPoolFiltersRef.current = next;
    replacePoolFiltersInUrl(next);
  }, [replacePoolFiltersInUrl]);

  const updatePoolPeriod = useCallback((period: MidgardPoolPeriod) => {
    const params = new URLSearchParams(searchParamString);
    params.set('pool_period', period);
    const queryString = params.toString();
    replaceExplorerUrl(pathname + (queryString ? '?' + queryString : '') + '#available-pools', ['pool_period']);
  }, [pathname, searchParamString]);

  return {
    poolFilters,
    updatePoolFilters,
    replacePoolFiltersInUrl,
    poolAvailableChains,
    poolAvailableStatuses,
    poolPeriod,
    updatePoolPeriod,
  };
}
