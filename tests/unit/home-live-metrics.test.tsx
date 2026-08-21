import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LiveDataResult, MidgardHealth, NetworkStats, Pool } from '@/lib/types';
import HomePage from '@/app/HomePageClient';

const source = { label: 'Midgard', url: 'https://midgard.thorchain.network/v2/network' };
const checkedAt = '2026-07-06T00:00:00.000Z';

const hookState = vi.hoisted(() => ({
  network: vi.fn(),
  health: vi.fn(),
  status: vi.fn(),
  pools: vi.fn(),
}));

vi.mock('@/lib/hooks/useMidgard', () => ({
  useNetworkData: () => hookState.network(),
  useMidgardHealth: () => hookState.health(),
  useNetworkStatus: () => hookState.status(),
  usePools: () => hookState.pools(),
}));

function networkData(overrides: Partial<NetworkStats> = {}): NetworkStats {
  return {
    totalPooledRune: '100000000000',
    totalReserve: '200000000000',
    activeNodeCount: 100,
    standbyNodeCount: 20,
    bondingAPY: '0.10',
    liquidityAPY: '0.05',
    nextChurnHeight: 123,
    bondMetrics: {},
    ...overrides,
  };
}

function okResult<T>(data: T, resultSource = source): LiveDataResult<T> {
  return {
    status: 'ok',
    checkedAt,
    data,
    source: resultSource,
  };
}

function hookResult<T>({
  result,
  isLoading = false,
  isDegraded = false,
}: {
  result?: LiveDataResult<T>;
  isLoading?: boolean;
  isDegraded?: boolean;
}) {
  return {
    result,
    data: result?.data,
    status: result?.status,
    error: result?.error,
    source: result?.source,
    sources: result?.sources,
    checkedAt: result?.checkedAt,
    isLoading,
    isDegraded,
  };
}

function healthResult(): ReturnType<typeof hookResult<MidgardHealth>> {
  return hookResult({
    result: okResult({
      severity: 'ok',
      reasons: [],
      checkedAt,
      provider: 'Midgard',
      lagBlocks: 0,
      lagSeconds: 0,
    }),
  });
}

function poolsResult(): ReturnType<typeof hookResult<Pool[]>> {
  return hookResult({
    result: okResult([
      { asset: 'BTC.BTC', assetDepth: '1', runeDepth: '1', status: 'available' },
      { asset: 'ETH.ETH', assetDepth: '1', runeDepth: '1', status: 'available' },
    ]),
  });
}

function loadingResult<T>() {
  return hookResult<T>({ isLoading: true });
}

describe('Home live metric trust posture', () => {
  beforeEach(() => {
    hookState.network.mockReturnValue(hookResult({ result: okResult(networkData()) }));
    hookState.health.mockReturnValue(healthResult());
    hookState.status.mockReturnValue(loadingResult());
    hookState.pools.mockReturnValue(poolsResult());
  });

  it('keeps headline metric cards in loading state while Midgard is unresolved', () => {
    hookState.network.mockReturnValue(loadingResult<NetworkStats>());
    hookState.pools.mockReturnValue(loadingResult<Pool[]>());

    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('Pooled RUNE');
    expect(html).toContain('Midgard Pool Rows');
    expect(html).toContain('Counts Midgard');
    expect(html).toContain('not proof that a route will quote or settle');
    expect(html).not.toContain('Available Pools');
    expect(html).toContain('Loading');
    expect(html).toContain('Loading live source');
    expect(html).not.toContain('Midgard sources are degraded');
  });

  it('does not render warning-backed Midgard metric values as clean headline numbers', () => {
    const warningBackedData: NetworkStats & { sourceWarnings: string[] } = {
      ...networkData(),
      sourceWarnings: ['Midgard network snapshot is warning-backed.'],
    };
    hookState.network.mockReturnValue(hookResult({
      result: okResult(warningBackedData),
      isDegraded: true,
    }));

    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('Source warning');
    expect(html).toContain('One or more Midgard sources are degraded, warning-backed, provider-mismatched, or missing health confirmation');
    expect(html).toMatch(/Pooled RUNE[\s\S]*Unavailable/);
    expect(html).toMatch(/Bonding APY[\s\S]*Unavailable/);
    expect(html).toMatch(/Active Nodes[\s\S]*Unavailable/);
  });

  it('does not render Midgard headline numbers as clean when provider health is degraded', () => {
    hookState.health.mockReturnValue(hookResult({
      result: okResult({
        severity: 'degraded',
        reasons: ['Midgard health is degraded.'],
        checkedAt,
        provider: 'Midgard',
      }),
    }));

    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('Midgard degraded');
    expect(html).toContain('missing health confirmation');
    expect(html).toMatch(/Pooled RUNE[\s\S]*Unavailable/);
    expect(html).toMatch(/Midgard Pool Rows[\s\S]*Unavailable/);
    expect(html).not.toContain('1,000');
  });

  it('does not render Midgard headline numbers as clean when health and data providers differ', () => {
    const liquifySource = { label: 'Liquify Midgard', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network' };
    hookState.network.mockReturnValue(hookResult({ result: okResult(networkData(), liquifySource) }));

    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('provider-mismatched');
    expect(html).toMatch(/Pooled RUNE[\s\S]*Unavailable/);
    expect(html).toMatch(/Bonding APY[\s\S]*Unavailable/);
    expect(html).toMatch(/Active Nodes[\s\S]*Unavailable/);
    expect(html).toMatch(/Midgard Pool Rows[\s\S]*2/);
  });

  it('keeps lower home previews bounded by static source posture', () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain('Start With The Claim');
    expect(html).toContain('Learn in Sequence');
    expect(html).toContain('Live Operations Snapshot');
    expect(html).not.toContain('Ecosystem');
    expect(html).not.toContain('Research');
    expect(html).not.toContain('Listed Needs review');
  });
});
