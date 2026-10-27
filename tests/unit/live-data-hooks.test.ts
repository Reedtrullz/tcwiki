import { describe, expect, it, vi } from 'vitest';
import useSWR from 'swr';
import { useNetworkData } from '@/lib/hooks/useMidgard';
import { useMayaNetwork, useMayaNodes } from '@/lib/hooks/useMaya';
import type { LiveDataResult } from '@/lib/types';

vi.mock('swr', () => ({ default: vi.fn() }));

describe.each([
  ['THORChain network', useNetworkData, 'midgard:network'],
  ['Maya network', useMayaNetwork, 'maya:network'],
  ['Maya nodes', useMayaNodes, 'maya:nodes'],
] as const)('%s hook', (_name, readHook, key) => {
  function read(result: LiveDataResult<unknown> | undefined, error: unknown = undefined, isLoading = false) {
    vi.mocked(useSWR).mockReturnValue({
      data: result,
      error,
      isLoading,
      isValidating: false,
      mutate: vi.fn(),
    });
    return readHook();
  }

  it('preserves loading and polling behavior before data arrives', () => {
    expect(read(undefined, undefined, true)).toEqual({
      result: undefined, data: undefined, status: undefined, error: undefined,
      source: undefined, sources: undefined, checkedAt: undefined,
      isLoading: true, isDegraded: false,
    });
    expect(useSWR).toHaveBeenLastCalledWith(key, expect.any(Function), {
      refreshInterval: 60000, revalidateOnFocus: false,
    });
  });

  it('preserves payload identity and source metadata', () => {
    const source = { label: 'Fixture', url: 'https://example.com' };
    const result = {
      status: 'ok', data: { value: 1 }, source, sources: [source],
      checkedAt: '2026-10-27T00:00:00.000Z',
    } satisfies LiveDataResult<unknown>;
    expect(read(result)).toEqual({
      result, data: result.data, status: 'ok', error: undefined,
      source, sources: [source], checkedAt: result.checkedAt,
      isLoading: false, isDegraded: false,
    });
    expect(read(result).result).toBe(result);
  });

  it('marks warning-bearing payloads as degraded', () => {
    expect(read({
      status: 'ok', checkedAt: '2026-10-27T00:00:00.000Z',
      data: { sourceWarnings: ['Partial response'] },
    }).isDegraded).toBe(true);
  });

  it('turns fetch errors without cached data into degraded results', () => {
    const value = read(undefined, new Error('Source failed'));
    expect(value.error).toBe('Source failed');
    expect(value.result).toMatchObject({ status: 'degraded', error: 'Source failed' });
    expect(value.data).toBeUndefined();
    expect(value.isDegraded).toBe(true);
  });

  it('keeps cached data and its trust state while surfacing a fetch error', () => {
    const result = {
      status: 'ok', checkedAt: '2026-10-27T00:00:00.000Z', data: { value: 1 },
    } satisfies LiveDataResult<unknown>;
    const value = read(result, new Error('Refresh failed'));
    expect(value.result).toBe(result);
    expect(value.error).toBe('Refresh failed');
    expect(value.isDegraded).toBe(false);
  });

  it('preserves result errors and ignores non-Error thrown values', () => {
    const result = {
      status: 'degraded', checkedAt: '2026-10-27T00:00:00.000Z', error: 'Unavailable',
    } satisfies LiveDataResult<unknown>;
    expect(read(result, 'unexpected').error).toBe('Unavailable');
    expect(read(undefined, 'unexpected').result).toBeUndefined();
  });
});
