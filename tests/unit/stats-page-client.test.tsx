import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StatsPageClient from '@/app/stats/StatsPageClient';
import type { HistoryItem, LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus, Pool, SourceMeta } from '@/lib/types';

const midgardSource: SourceMeta = {
  label: 'THORChain Midgard',
  url: 'https://midgard.thorchain.network/v2/network',
};
const midgardHealthSource: SourceMeta = {
  label: 'THORChain Midgard health',
  url: 'https://midgard.thorchain.network/v2/health',
};
const liquifySource: SourceMeta = {
  label: 'Liquify Midgard',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network',
};
const checkedAt = '2026-07-08T06:00:00.000Z';

const hookState = vi.hoisted(() => ({
  network: vi.fn(),
  earnings: vi.fn(),
  health: vi.fn(),
  status: vi.fn(),
  pools: vi.fn(),
  quote: vi.fn(),
}));

const navigationState = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock('@/lib/hooks/useMidgard', () => ({
  useNetworkData: () => hookState.network(),
  useEarningsHistory: () => hookState.earnings(),
  useMidgardHealth: () => hookState.health(),
  useNetworkStatus: () => hookState.status(),
  usePools: () => hookState.pools(),
  useSwapQuoteProbe: () => hookState.quote(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/stats',
  useRouter: () => ({ replace: navigationState.replace }),
  useSearchParams: () => navigationState.searchParams,
}));

function ok<T>(data: T, source = midgardSource): LiveDataResult<T> {
  return {
    status: 'ok',
    checkedAt,
    data,
    source,
  };
}

function hookResult<T>(result: LiveDataResult<T>) {
  return {
    result,
    data: result.data,
    status: result.status,
    error: result.error,
    source: result.source,
    sources: result.sources,
    checkedAt: result.checkedAt,
    isLoading: false,
    isDegraded: result.status === 'degraded',
  };
}

function networkStats(): NetworkStats {
  return {
    totalPooledRune: '100000000000',
    totalReserve: '200000000000',
    activeNodeCount: 100,
    standbyNodeCount: 20,
    bondingAPY: '0.10',
    liquidityAPY: '0.05',
    nextChurnHeight: 123,
    bondMetrics: {},
  };
}

function earningsInterval({
  startTime = '1704067200',
  earnings = '100000000',
  bondingEarnings = '60000000',
  liquidityEarnings = '40000000',
}: {
  startTime?: string;
  earnings?: string;
  bondingEarnings?: string;
  liquidityEarnings?: string;
} = {}): HistoryItem {
  return {
    startTime,
    endTime: String(Number(startTime) + 86_400),
    liquidityFees: '0',
    blockRewards: '0',
    earnings,
    bondingEarnings,
    liquidityEarnings,
    avgNodeCount: '100',
    runePriceUSD: '5',
    pools: [],
  };
}

function pools(): Pool[] {
  return [
    {
      asset: 'BTC.BTC',
      assetDepth: '100000000',
      runeDepth: '200000000',
      status: 'available',
      liquidityInUSD: '1000000',
      volume24h: '25000000000000',
      poolAPY: '0.10',
    },
  ];
}

function health(severity: MidgardHealth['severity'] = 'ok'): MidgardHealth {
  return {
    severity,
    reasons: severity === 'ok' ? [] : ['Midgard health needs review.'],
    checkedAt,
    lagBlocks: 1,
  };
}

describe('StatsPageClient source posture', () => {
  beforeEach(() => {
    navigationState.replace.mockReset();
    navigationState.searchParams = new URLSearchParams();
    hookState.network.mockReturnValue(hookResult(ok(networkStats())));
    hookState.earnings.mockReturnValue(hookResult(ok([earningsInterval()])));
    hookState.health.mockReturnValue(hookResult(ok(health(), midgardHealthSource)));
    hookState.pools.mockReturnValue(hookResult(ok(pools())));
    hookState.status.mockReturnValue({
      result: undefined as LiveDataResult<NetworkStatus> | undefined,
      data: undefined,
      isLoading: true,
      isDegraded: false,
    });
    hookState.quote.mockReturnValue({
      result: undefined,
      isLoading: false,
      error: undefined,
    });
  });

  it('keeps clean same-provider stats sections free of source-review notices', () => {
    const html = renderToStaticMarkup(<StatsPageClient />);

    expect(html).toContain('Live Metrics');
    expect(html).toContain('Route proof is separate');
    expect(html).toContain('Pool rows show liquidity context. A current route still needs a THORNode quote, source freshness, and network diagnostics.');
    expect(html).toContain('href="/network#check-a-route"');
    expect(html).not.toContain('Headline metric source needs review');
    expect(html).not.toContain('Pool snapshot source needs review');
    expect(html).not.toContain('Earnings history source needs review');
  });

  it('puts the operational check before metric interpretation guidance', () => {
    const html = renderToStaticMarkup(<StatsPageClient />);
    const operationalCheckIndex = html.indexOf('stats-operational-check');
    const numberGuideIndex = html.indexOf('stats-number-guide-heading');

    expect(operationalCheckIndex).toBeGreaterThan(-1);
    expect(numberGuideIndex).toBeGreaterThan(-1);
    expect(operationalCheckIndex).toBeLessThan(numberGuideIndex);
    expect(html).toContain('Check network status before treating loaded metrics as route-ready.');
  });

  it('surfaces source-review notices before loaded Midgard values when provider health differs', () => {
    hookState.network.mockReturnValue(hookResult(ok(networkStats(), liquifySource)));
    hookState.earnings.mockReturnValue(hookResult(ok([earningsInterval()], liquifySource)));
    hookState.pools.mockReturnValue(hookResult(ok(pools(), liquifySource)));

    const html = renderToStaticMarkup(<StatsPageClient />);

    expect(html).toMatch(/Headline metric source needs review[\s\S]*Pooled RUNE/);
    expect(html).toMatch(/Pool snapshot source needs review[\s\S]*Midgard pool rows/);
    expect(html).toMatch(/Earnings history source needs review[\s\S]*Usable intervals/);
    expect(html).toContain('Source needs review');
    expect(html).toContain('provider-mismatched');
  });

  it('does not render zero pool counts when the pool source is unavailable', () => {
    hookState.pools.mockReturnValue({
      result: {
        status: 'degraded',
        checkedAt,
        error: 'Pools source unavailable',
      },
      data: undefined,
      status: 'degraded',
      error: 'Pools source unavailable',
      source: undefined,
      sources: undefined,
      checkedAt,
      isLoading: false,
      isDegraded: true,
    });

    const html = renderToStaticMarkup(<StatsPageClient />);

    expect(html).toMatch(/data-testid="stats-pool-row-count"[^>]*>Unavailable/);
    expect(html).toMatch(/data-testid="stats-pool-chain-count"[^>]*>Unavailable/);
    expect(html).not.toMatch(/data-testid="stats-pool-row-count"[^>]*>0</);
    expect(html).not.toMatch(/data-testid="stats-pool-chain-count"[^>]*>0</);
  });

  it('labels sparse earnings totals as partial valid loaded intervals', () => {
    hookState.earnings.mockReturnValue(hookResult(ok([
      earningsInterval({ startTime: '1704067200', earnings: '100000000' }),
      earningsInterval({ startTime: '1704153600', earnings: '', bondingEarnings: '', liquidityEarnings: '' }),
      earningsInterval({ startTime: '1704240000', earnings: '300000000' }),
    ])));

    const html = renderToStaticMarkup(<StatsPageClient />);

    expect(html).toContain('Latest valid-window total');
    expect(html).toContain('Valid loaded-interval total');
    expect(html).toContain('Partial window');
    expect(html).toContain('Partial total');
    expect(html).toContain('2/3 loaded intervals with totals; 1 unavailable');
    expect(html).not.toContain('Unavailable RUNE');
  });
});
