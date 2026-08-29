import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { StatsPoolExplorerFilters, StatsPoolSortKey } from '@/lib/stats-dashboard';

const poolSortQueryValues: Record<string, StatsPoolSortKey> = {
  depth: 'runeDepth',
  runeDepth: 'runeDepth',
  volume: 'volume24hRune',
  volume24hRune: 'volume24hRune',
  volume24hUsd: 'volume24hRune',
  liquidity: 'liquidityUsd',
  liquidityUsd: 'liquidityUsd',
  apy: 'apyPercent',
  apyPercent: 'apyPercent',
  asset: 'asset',
};

const poolSortParamValues: Record<StatsPoolSortKey, string> = {
  runeDepth: 'depth',
  volume24hRune: 'volume',
  liquidityUsd: 'liquidity',
  apyPercent: 'apy',
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
}

export function usePoolExplorerFilters({
  router,
  pathname,
  searchParamString,
  poolAvailableChains,
  poolAvailableStatuses,
}: {
  router: AppRouterInstance;
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

  const latestPoolFiltersRef = useRef(poolFilters);
  useEffect(() => {
    latestPoolFiltersRef.current = poolFilters;
  }, [poolFilters]);

  const replacePoolFiltersInUrl = useCallback((nextFilters: StatsPoolExplorerFilters) => {
    const params = new URLSearchParams(searchParamString);
    const query = nextFilters.query.trim();
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
    router.replace(
      pathname + (queryString ? '?' + queryString : '') + '#available-pools',
      { scroll: false },
    );
  }, [pathname, router, searchParamString]);

  const updatePoolFilters = useCallback((partialFilters: Partial<StatsPoolExplorerFilters>) => {
    replacePoolFiltersInUrl({
      ...latestPoolFiltersRef.current,
      ...partialFilters,
    });
  }, [replacePoolFiltersInUrl]);

  return {
    poolFilters,
    updatePoolFilters,
    replacePoolFiltersInUrl,
    poolAvailableChains,
    poolAvailableStatuses,
  };
}
