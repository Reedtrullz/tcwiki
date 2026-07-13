import { describe, expect, it } from 'vitest';
import {
  deriveStatsDecisionFacts,
  deriveStatsEarningsCoverage,
  deriveStatsEarningsRows,
  deriveStatsMetricCards,
  deriveStatsPoolExplorer,
  deriveStatsPoolSnapshot,
  midgardResultHasCleanHealth,
  midgardSourceIssueIsVisible,
} from '@/lib/stats-dashboard';
import type { HistoryItem, LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus, Pool, SourceMeta } from '@/lib/types';

const networkStats: NetworkStats = {
  totalPooledRune: '100000000',
  totalReserve: '200000000',
  activeNodeCount: 100,
  standbyNodeCount: 20,
  bondingAPY: '0.10',
  liquidityAPY: '0.05',
  nextChurnHeight: 123,
  bondMetrics: {},
};

const operationalStatus: NetworkStatus = {
  state: 'operational',
  summary: 'Network operations are available.',
  tradingPaused: false,
  signingPaused: false,
  lpPaused: false,
  loansPaused: false,
  observedChainsPaused: false,
  securedAssetsPaused: false,
  tcyClaimingPaused: false,
  tcyClaimingSwapPaused: false,
  tcyStakingPaused: false,
  tcyStakeDistributionPaused: false,
  tcyUnstakingPaused: false,
  tcyTradingPaused: false,
  tradeAccountsEnabled: true,
  runePoolEnabled: true,
  wasmPaused: false,
  poolDepositPauseKeys: [],
  chainStatuses: [],
  activeControlKeys: [],
  activeChainKeys: [],
  activeEvidenceKeys: [],
  activePauseKeys: [],
  monitoredControls: [],
  invalidMimirKeys: [],
  sourceWarnings: [],
};

function ok<T>(data: T, source?: SourceMeta): LiveDataResult<T> {
  return {
    status: 'ok',
    checkedAt: '2026-07-04T20:00:00.000Z',
    data,
    source,
  };
}

function historyInterval(
  startTime: string,
  earnings: string,
  bondingEarnings = earnings,
  liquidityEarnings = '0'
): HistoryItem {
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

function pool(
  asset: string,
  {
    runeDepth,
    status = 'available',
    liquidityInUSD,
    volume24h,
    poolAPY,
  }: {
    runeDepth?: string;
    status?: string;
    liquidityInUSD?: string;
    volume24h?: string;
    poolAPY?: string;
  }
): Pool {
  const item: Pool = {
    asset,
    assetDepth: '100000000',
    runeDepth: runeDepth ?? '',
    status,
  };
  if (liquidityInUSD !== undefined) {
    item.liquidityInUSD = liquidityInUSD;
  }
  if (volume24h !== undefined) {
    item.volume24h = volume24h;
  }
  if (poolAPY !== undefined) {
    item.poolAPY = poolAPY;
  }
  return item;
}

describe('stats dashboard decision facts', () => {
  it('summarizes usable live metrics without turning them into durable proof', () => {
    const health: MidgardHealth = {
      severity: 'ok',
      reasons: [],
      checkedAt: '2026-07-04T20:00:00.000Z',
      lagBlocks: 2,
    };

    const facts = deriveStatsDecisionFacts({
      networkLoading: false,
      earningsLoading: false,
      networkResult: ok(networkStats),
      earningsResult: ok([{}]),
      poolsResult: ok([
        {
          asset: 'BTC.BTC',
          assetDepth: '100000000',
          runeDepth: '100000000',
          status: 'available',
        },
      ]),
      midgardHealthResult: ok(health),
      statusResult: ok(operationalStatus),
      earningsIntervals: 30,
      earningsIntervalsWithValues: 30,
      poolCount: 1,
    });

    expect(facts).toEqual([
      expect.objectContaining({ label: 'Headline metrics', value: 'Loaded', tone: 'success' }),
      expect.objectContaining({
        label: 'Midgard pool rows',
        value: '1 row',
        tone: 'success',
        detail: expect.stringContaining('Midgard available-pool rows, not route quote proof'),
      }),
      expect.objectContaining({ label: 'Midgard health', value: '2 block lag', tone: 'success' }),
      expect.objectContaining({ label: 'Operations', value: 'No active pause', tone: 'success' }),
      expect.objectContaining({
        label: 'Earnings history',
        value: '30 intervals',
        tone: 'success',
        detail: expect.stringContaining('not durable revenue proof'),
      }),
    ]);
  });

  it('marks missing and warning-backed data as degraded instead of healthy or zero', () => {
    const facts = deriveStatsDecisionFacts({
      networkLoading: false,
      earningsLoading: false,
      networkResult: {
        status: 'ok',
        checkedAt: '2026-07-04T20:00:00.000Z',
        data: { sourceWarnings: ['Metric source warning.'] } as unknown as NetworkStats,
      },
      earningsResult: {
        status: 'degraded',
        checkedAt: '2026-07-04T20:00:00.000Z',
        error: 'History source unavailable',
      },
      poolsResult: {
        status: 'degraded',
        checkedAt: '2026-07-04T20:00:00.000Z',
        error: 'Pools source unavailable',
      },
      midgardHealthResult: {
        status: 'degraded',
        checkedAt: '2026-07-04T20:00:00.000Z',
        error: 'Health source unavailable',
      },
      statusResult: {
        status: 'ok',
        checkedAt: '2026-07-04T20:00:00.000Z',
        data: { sourceWarnings: ['THORNode source warning.'] } as unknown as NetworkStatus,
      },
      earningsIntervals: 0,
      earningsIntervalsWithValues: 0,
    });

    expect(facts.map((fact) => fact.value)).not.toContain('0');
    expect(facts).toEqual([
      expect.objectContaining({ label: 'Headline metrics', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Midgard pool rows', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Midgard health', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Operations', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Earnings history', value: 'Degraded', tone: 'danger' }),
    ]);
  });

  it('warns when loaded Midgard metrics and health come from different providers', () => {
    const health: MidgardHealth = {
      severity: 'ok',
      reasons: [],
      checkedAt: '2026-07-04T20:00:00.000Z',
      lagBlocks: 1,
    };
    const healthSource = { label: 'THORChain Midgard health', url: 'https://midgard.thorchain.network/v2/health' };
    const visibleSource = { label: 'Liquify Midgard network', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network' };

    const facts = deriveStatsDecisionFacts({
      networkLoading: false,
      earningsLoading: false,
      networkResult: ok(networkStats, visibleSource),
      earningsResult: ok([{}], visibleSource),
      poolsResult: ok([{
        asset: 'BTC.BTC',
        assetDepth: '100000000',
        runeDepth: '100000000',
        status: 'available',
      }], visibleSource),
      midgardHealthResult: ok(health, healthSource),
      statusResult: ok(operationalStatus),
      earningsIntervals: 30,
      earningsIntervalsWithValues: 30,
      poolCount: 1,
    });

    expect(facts).toEqual([
      expect.objectContaining({
        label: 'Headline metrics',
        value: 'Source mismatch',
        tone: 'warning',
        detail: expect.stringContaining('different provider'),
      }),
      expect.objectContaining({
        label: 'Midgard pool rows',
        value: 'Source mismatch',
        tone: 'warning',
        detail: expect.stringContaining('different provider'),
      }),
      expect.objectContaining({ label: 'Midgard health', value: '1 block lag', tone: 'success' }),
      expect.objectContaining({ label: 'Operations', value: 'No active pause', tone: 'success' }),
      expect.objectContaining({
        label: 'Earnings history',
        value: 'Source mismatch',
        tone: 'warning',
        detail: expect.stringContaining('different provider'),
      }),
    ]);
  });

  it('exposes a reusable clean-health gate for compact headline metrics', () => {
    const health: MidgardHealth = {
      severity: 'ok',
      reasons: [],
      checkedAt: '2026-07-04T20:00:00.000Z',
      lagBlocks: 1,
    };
    const healthSource = { label: 'THORChain Midgard health', url: 'https://midgard.thorchain.network/v2/health' };
    const matchingSource = { label: 'THORChain Midgard network', url: 'https://midgard.thorchain.network/v2/network' };
    const otherSource = { label: 'Liquify Midgard network', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network' };

    expect(midgardResultHasCleanHealth(ok(networkStats, matchingSource), ok(health, healthSource))).toBe(true);
    expect(midgardResultHasCleanHealth(ok(networkStats, otherSource), ok(health, healthSource))).toBe(false);
    expect(midgardResultHasCleanHealth(ok(networkStats, matchingSource), ok({ ...health, severity: 'warning' }, healthSource))).toBe(false);
    expect(midgardSourceIssueIsVisible(ok(networkStats, otherSource), ok(health, healthSource), false)).toBe(true);
    expect(midgardSourceIssueIsVisible(undefined, ok(health, healthSource), true)).toBe(false);
  });

  it('warns when only part of the earnings history is usable', () => {
    const facts = deriveStatsDecisionFacts({
      networkLoading: true,
      earningsLoading: false,
      earningsResult: ok([{}]),
      earningsIntervals: 30,
      earningsIntervalsWithValues: 24,
    });

    expect(facts.find((fact) => fact.label === 'Earnings history')).toEqual(expect.objectContaining({
      value: '24/30 usable',
      tone: 'warning',
      detail: expect.stringContaining('Some intervals'),
    }));
  });

  it('summarizes Midgard pool rows without converting missing optional fields to zero', () => {
    const snapshot = deriveStatsPoolSnapshot([
      {
        asset: 'BTC.BTC',
        assetDepth: '100000000',
        runeDepth: '200000000',
        status: 'available',
        liquidityInUSD: '1000000.25',
        volume24h: '25000000000000',
        poolAPY: '0.125',
      },
      {
        asset: 'ETH.ETH',
        assetDepth: '100000000',
        runeDepth: '100000000',
        status: 'available',
      },
    ], false);

    expect(snapshot).toEqual(expect.objectContaining({
      totalPools: 2,
      chainCount: 2,
      totalRuneDepth: 3,
      summary: 'Showing 2 Midgard available-pool rows across 2 chains.',
    }));
    expect(snapshot.deepestPool).toEqual(expect.objectContaining({
      asset: 'BTC.BTC',
      runeDepthLabel: '2 RUNE',
      liquidityUsdLabel: '$1M',
      volume24hRuneLabel: '250K RUNE',
      apyLabel: '12.50%',
    }));
    expect(snapshot.rows[1]).toEqual(expect.objectContaining({
      asset: 'ETH.ETH',
      liquidityUsd: null,
      volume24hRune: null,
      liquidityUsdLabel: 'Unavailable',
      volume24hRuneLabel: 'Unavailable',
      apyLabel: 'Unavailable',
    }));
  });

  it('renders live-shaped Midgard liquidity in USD and 24h volume in RUNE', () => {
    const snapshot = deriveStatsPoolSnapshot([{
      asset: 'AVAX.AVAX',
      assetDepth: '2101068965099',
      runeDepth: '132314140943190',
      status: 'available',
      liquidityInUSD: '1046552.4742136128',
      volume24h: '29109830445174',
      poolAPY: '0',
    }], false);

    expect(snapshot.rows[0]).toEqual(expect.objectContaining({
      liquidityUsdLabel: '$1.05M',
      volume24hRune: 291098.30445174,
      volume24hRuneLabel: '291K RUNE',
      apyLabel: '0.00%',
    }));
    expect(snapshot.highestVolumePool?.asset).toBe('AVAX.AVAX');
  });

  it('filters and sorts Midgard pool rows while keeping missing values last', () => {
    const snapshot = deriveStatsPoolSnapshot([
      pool('BTC.BTC', {
        runeDepth: '300000000',
        status: 'available',
        liquidityInUSD: '1000000',
        volume24h: '500000000000',
        poolAPY: '0.05',
      }),
      pool('ETH.ETH', {
        runeDepth: '200000000',
        status: 'staged',
        liquidityInUSD: '500000',
        volume24h: '90000000000000',
        poolAPY: '0.12',
      }),
      pool('ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48', {
        status: 'available',
        liquidityInUSD: '250000',
      }),
      pool('SOL.SOL', {
        runeDepth: '100000000',
        status: 'available',
        volume24h: '4000000000000',
        poolAPY: '0.02',
      }),
    ], false);

    const ethVolume = deriveStatsPoolExplorer(snapshot.rows, {
      query: 'eth',
      chain: 'ETH',
      status: 'all',
      sort: 'volume24hRune',
    });

    expect(ethVolume.rows.map((row) => row.asset)).toEqual([
      'ETH.ETH',
      'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
    ]);
    expect(ethVolume.totalRows).toBe(4);
    expect(ethVolume.filteredRows).toBe(2);
    expect(ethVolume.activeFilterLabels).toEqual(['Search: eth', 'Chain: ETH', 'Sort: 24h volume (RUNE)']);
    expect(ethVolume.availableChains).toEqual(['BTC', 'ETH', 'SOL']);
    expect(ethVolume.availableStatuses).toEqual(['available', 'staged']);
    expect(ethVolume.summary).toBe('Showing 2 of 4 pool rows after filters.');

    const availableApy = deriveStatsPoolExplorer(snapshot.rows, {
      query: '',
      chain: 'all',
      status: 'available',
      sort: 'apyPercent',
    });

    expect(availableApy.rows.map((row) => row.asset)).toEqual([
      'BTC.BTC',
      'SOL.SOL',
      'ETH.USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48',
    ]);
    expect(availableApy.activeFilterLabels).toEqual(['Status: available', 'Sort: APY']);
  });

  it('keeps real zero source values as zero while missing values stay unavailable', () => {
    const zeroStats: NetworkStats = {
      ...networkStats,
      totalPooledRune: '0',
      totalReserve: '0',
      activeNodeCount: 0,
      standbyNodeCount: 0,
      bondingAPY: '0',
      liquidityAPY: '0',
    };

    expect(deriveStatsMetricCards(zeroStats, 'Unavailable')).toEqual([
      expect.objectContaining({ id: 'pooledRune', value: '0', unit: 'RUNE' }),
      expect.objectContaining({ id: 'bondingApy', value: '0.00%' }),
      expect.objectContaining({ id: 'activeNodes', value: 0, description: expect.stringContaining('Standby nodes: 0') }),
      expect.objectContaining({ id: 'reserveRune', value: '0', unit: 'RUNE' }),
    ]);

    expect(deriveStatsMetricCards(undefined, 'Unavailable')).toEqual([
      expect.objectContaining({ id: 'pooledRune', value: 'Unavailable' }),
      expect.objectContaining({ id: 'bondingApy', value: 'Unavailable' }),
      expect.objectContaining({ id: 'activeNodes', value: 'Unavailable' }),
      expect.objectContaining({ id: 'reserveRune', value: 'Unavailable' }),
    ]);
  });

  it('derives earnings coverage without treating missing interval amounts as zero', () => {
    const intervals = [
      historyInterval('1704067200', '100000000', '60000000', '40000000'),
      historyInterval('1704153600', '', '', ''),
      historyInterval('1704240000', '300000000', '100000000', '200000000'),
    ];

    const rows = deriveStatsEarningsRows(intervals);
    const coverage = deriveStatsEarningsCoverage(rows, false);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual(expect.objectContaining({
      earnings: 3,
      nodeOps: 1,
      lps: 2,
    }));
    expect(rows[1]).toEqual(expect.objectContaining({
      earnings: null,
      nodeOps: null,
      lps: null,
    }));
    expect(coverage).toEqual(expect.objectContaining({
      availableIntervals: 2,
      unavailableIntervals: 1,
      recentIntervalCount: 3,
      recentAvailableIntervals: 2,
      recentUnavailableIntervals: 1,
      totalEarnings: 4,
      recentSevenEarnings: 4,
      recentRows: rows,
      summary: expect.stringContaining('2 include a valid total earnings value'),
    }));
  });

  it('uses the newest seven intervals for recent earnings coverage', () => {
    const intervals = Array.from({ length: 8 }, (_, index) => (
      historyInterval(String(1_704_067_200 + index * 86_400), String(100_000_000 * (index + 1)))
    ));

    const rows = deriveStatsEarningsRows(intervals);
    const coverage = deriveStatsEarningsCoverage(rows, false);

    expect(rows.map((row) => row.earnings)).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
    expect(coverage.recentRows.map((row) => row.earnings)).toEqual([8, 7, 6, 5, 4, 3, 2]);
    expect(coverage.recentAvailableIntervals).toBe(7);
    expect(coverage.recentUnavailableIntervals).toBe(0);
    expect(coverage.recentSevenEarnings).toBe(35);
  });

  it('reports sparse newest-window coverage without filling missing values with zero', () => {
    const intervals = Array.from({ length: 8 }, (_, index) => (
      historyInterval(
        String(1_704_067_200 + index * 86_400),
        index === 7 ? '' : String(100_000_000 * (index + 1))
      )
    ));

    const rows = deriveStatsEarningsRows(intervals);
    const coverage = deriveStatsEarningsCoverage(rows, false);

    expect(coverage.recentRows.map((row) => row.earnings)).toEqual([null, 7, 6, 5, 4, 3, 2]);
    expect(coverage.recentIntervalCount).toBe(7);
    expect(coverage.recentAvailableIntervals).toBe(6);
    expect(coverage.recentUnavailableIntervals).toBe(1);
    expect(coverage.recentSevenEarnings).toBe(27);
  });
});
