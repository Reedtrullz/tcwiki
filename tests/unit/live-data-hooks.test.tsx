import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MidgardAPI from '@/lib/api/midgard';
import { deriveNetworkStatus } from '@/lib/api/thornode';
import {
  useEarningsHistory, useMidgardHealth, useNetworkData, useNetworkStatus,
  usePools, useSwapQuoteProbe, useThorchainNodeCoverage,
} from '@/lib/hooks/useMidgard';
import { useMayaNetwork, useMayaNodes } from '@/lib/hooks/useMaya';
import type { useLivePresentation } from '@/lib/hooks/useLivePresentation';
import type { LiveDataResult, SwapQuoteRequest } from '@/lib/types';

const swr = vi.hoisted(() => vi.fn());
vi.mock('swr', () => ({ default: swr }));
const now = Date.parse('2026-10-27T00:00:00Z');
const source = { label: 'Fixture', url: 'https://example.com' };
const mutate = vi.fn();
type HookResult = ReturnType<typeof useLivePresentation<unknown>>;

function configure(result?: LiveDataResult<unknown>, error?: unknown, isLoading = false, isValidating = false) {
  swr.mockReturnValue({ data: result, error, isLoading, isValidating, mutate });
}

function renderHook(readHook: () => HookResult) {
  let observed: HookResult | undefined;
  function Probe() {
    observed = readHook();
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  if (!observed) throw new Error('Hook did not render');
  return observed;
}

function sample(checkedAt = now): LiveDataResult<{ total: number }> {
  return { status: 'ok', data: { total: 0 }, source, sources: [source], checkedAt: new Date(checkedAt).toISOString() };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  swr.mockReset();
  mutate.mockReset();
  configure();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe.each([
  ['THORChain network', useNetworkData, 'midgard:network', 'aggregate'],
  ['THORChain pools', usePools, ['midgard:pools', '14d'], 'aggregate'],
  ['Midgard health', useMidgardHealth, 'midgard:health', 'aggregate'],
  ['Node coverage', useThorchainNodeCoverage, 'thornode:node-coverage', 'aggregate'],
  ['Earnings', useEarningsHistory, ['midgard:history', 'day', 30], 'historical'],
  ['Maya network', useMayaNetwork, 'maya:network', 'aggregate'],
  ['Maya nodes', useMayaNodes, 'maya:nodes', 'aggregate'],
] as const)('%s hook', (_name, readHook, key, kind) => {
  it('preserves loading, cache keys, polling and disabled automatic retries', () => {
    configure(undefined, undefined, true);
    expect(renderHook(readHook)).toMatchObject({ isLoading: true, isDegraded: false, result: undefined });
    expect(swr).toHaveBeenLastCalledWith(key, expect.any(Function), {
      refreshInterval: 60000, revalidateOnFocus: false, shouldRetryOnError: false,
    });
  });

  it('retains zero values and source metadata', () => {
    const result = sample();
    configure(result);
    expect(renderHook(readHook)).toMatchObject({
      data: { total: 0 }, source, sources: [source], checkedAt: result.checkedAt,
      isDegraded: false, result: { presentation: { kind, state: kind === 'historical' ? 'historical' : 'current' } },
    });
  });

  it('keeps cached data as last-good after a failed refresh', () => {
    configure(sample(), new Error('Refresh failed'));
    expect(renderHook(readHook)).toMatchObject({
      data: { total: 0 }, source, error: 'Refresh failed', isDegraded: true,
      result: { presentation: { kind, state: 'last-good' } },
    });
  });

  it('preserves aggregate staleness and historical interval meaning', () => {
    configure(sample(now - 120001));
    expect(renderHook(readHook)).toMatchObject({
      data: { total: 0 }, isDegraded: kind !== 'historical',
      result: { presentation: { kind, state: kind === 'historical' ? 'historical' : 'stale' } },
    });
  });

  it('exposes refreshing state and refreshes without dropping cached data', () => {
    const result = sample();
    configure(result, undefined, false, true);
    const value = renderHook(readHook);
    expect(value).toMatchObject({ isRefreshing: true, result: { presentation: { state: 'refreshing' } } });
    value.refresh();
    expect(mutate).toHaveBeenCalledWith(expect.any(Function), { revalidate: true, throwOnError: false });
    expect(mutate.mock.lastCall?.[0](result)).toBe(result);
  });

  it('reports unavailable evidence after an initial failure', () => {
    configure(undefined, new Error('Source failed'));
    expect(renderHook(readHook)).toMatchObject({
      error: 'Source failed', isDegraded: true,
      result: { presentation: { kind, state: 'unavailable' } },
    });
  });
});

it('keeps requireLiveData rejecting unusable provider responses', async () => {
  vi.spyOn(MidgardAPI, 'getNetworkData').mockResolvedValue({ status: 'degraded', error: 'No usable data', checkedAt: new Date(now).toISOString() });
  renderHook(useNetworkData);
  await expect(swr.mock.lastCall?.[1]()).rejects.toThrow('No usable data');
});

it('retains explicit pool periods and earnings arguments', () => {
  renderHook(() => usePools('7d'));
  expect(swr.mock.lastCall?.[0]).toEqual(['midgard:pools', '7d']);
  renderHook(() => useEarningsHistory('week', 8));
  expect(swr.mock.lastCall?.[0]).toEqual(['midgard:history', 'week', 8]);
});

it('preserves server fallback, mount revalidation and the seed assessment clock', () => {
  const blockTime = new Date(now - 60000).toISOString();
  const data = deriveNetworkStatus({}, [], '3.20.3', 100, { thorchainBlockTime: blockTime });
  const result = { ...sample(), data, assessedAt: blockTime,
    collection: { startedAt: blockTime, completedAt: blockTime, durationMs: 0 } };
  configure(result);
  const value = renderHook(() => useNetworkStatus(result));
  expect(swr.mock.lastCall?.[2]).toEqual({
    refreshInterval: 60000, revalidateOnFocus: false, shouldRetryOnError: false,
    fallbackData: result, revalidateOnMount: true,
  });
  expect(value.result?.assessedAt).toBe(blockTime);
});

it('reassesses retained operational evidence and marks failed reads conservatively', () => {
  const blockTime = new Date(now - 60000).toISOString();
  const data = deriveNetworkStatus({}, [], '3.20.3', 100, { thorchainBlockTime: blockTime });
  configure({ ...sample(), data, collection: { startedAt: blockTime, completedAt: blockTime, durationMs: 0 } }, new Error('Refresh failed'));
  expect(renderHook(useNetworkStatus)).toMatchObject({
    isDegraded: true, result: { assessedAt: new Date(now).toISOString(), presentation: { kind: 'operational', state: 'stale' } },
    data: { sourceWarningDetails: expect.arrayContaining([
      expect.objectContaining({ category: 'freshness', keys: ['browser-refresh'] }),
      expect.objectContaining({ category: 'freshness', keys: ['block.header.time'] }),
    ]) },
  });
});

it('keeps quote probes opt-in and separate from periodic refresh behavior', () => {
  function DisabledProbe() { useSwapQuoteProbe(null); return null; }
  renderToStaticMarkup(createElement(DisabledProbe));
  expect(swr.mock.lastCall?.[0]).toBeNull();
  const request: SwapQuoteRequest = { fromAsset: 'BTC.BTC', toAsset: 'ETH.ETH', amountBaseUnits: '100000000' };
  function Probe() { useSwapQuoteProbe(request, true, 2); return null; }
  renderToStaticMarkup(createElement(Probe));
  expect(swr).toHaveBeenLastCalledWith(
    ['thornode:swap-quote-probe', 'BTC.BTC', 'ETH.ETH', '100000000', 2], expect.any(Function),
    { refreshInterval: 0, revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 1000 },
  );
});
