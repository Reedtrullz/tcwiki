import { describe, expect, it } from 'vitest';
import { deriveStatsDecisionFacts, deriveStatsMetricCards } from '@/lib/stats-dashboard';
import type { LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus } from '@/lib/types';

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

function ok<T>(data: T): LiveDataResult<T> {
  return {
    status: 'ok',
    checkedAt: '2026-07-04T20:00:00.000Z',
    data,
  };
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
      midgardHealthResult: ok(health),
      statusResult: ok(operationalStatus),
      earningsIntervals: 30,
      earningsIntervalsWithValues: 30,
    });

    expect(facts).toEqual([
      expect.objectContaining({ label: 'Headline metrics', value: 'Loaded', tone: 'success' }),
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
      expect.objectContaining({ label: 'Midgard health', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Operations', value: 'Degraded', tone: 'danger' }),
      expect.objectContaining({ label: 'Earnings history', value: 'Degraded', tone: 'danger' }),
    ]);
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
});
