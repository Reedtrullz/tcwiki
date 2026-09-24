import { describe, expect, it } from 'vitest';
import { deriveDailyVolumeSummary } from '@/lib/daily-volume';
import { liveOk } from '@/lib/trust';

function ok(rows: Record<string, unknown>[]) {
  return liveOk(rows, { label: 'Test Midgard', url: 'https://test/v2' }, '2026-09-24T00:00:00Z');
}

describe('deriveDailyVolumeSummary', () => {
  it('sums pool volumes for the latest nonzero day and computes 7d-average delta', () => {
    // Day 8 is a zeroed current-day row; days 1-7 are the trailing week.
    const rows = (daily: number[]) => ok(
      daily.map((usdCents, index) => ({
        startTime: String(1_700_000_000 + index * 86_400),
        totalVolume: String(usdCents * 100),
        totalVolumeUSD: String(usdCents),
      }))
    );

    const summary = deriveDailyVolumeSummary([
      { asset: 'ETH.ETH', result: rows([1_000_000, 2_000_000, 3_000_000, 4_000_000, 5_000_000, 6_000_000, 7_000_000, 0]) },
      { asset: 'BTC.BTC', result: rows([2_000_000, 4_000_000, 6_000_000, 8_000_000, 10_000_000, 12_000_000, 14_000_000, 0]) },
    ]);

    // Latest nonzero day is day 7: ETH 7M + BTC 14M cents = $210K.
    expect(summary.usdVolumeLabel).toBe('$210.0K');
    expect(summary.usdAvgLabel).toBe('$105.0K');
    expect(summary.deltaPct).toBeCloseTo(100, 1);
    expect(summary.deltaLabel).toBe('+100.0%');
    expect(summary.pools.map((pool) => pool.asset)).toEqual(['BTC.BTC', 'ETH.ETH']);
    expect(summary.topPools[0].shareLabel).toBe('66.7%');
  });

  it('drops pools that had no volume on the aggregated day and tolerates failures', () => {
    const summary = deriveDailyVolumeSummary([
      {
        asset: 'ETH.ETH',
        result: {
          status: 'degraded' as const,
          error: 'Midgard source did not respond',
          checkedAt: '2026-09-24T00:00:00Z',
        },
      },
      {
        asset: 'BTC.BTC',
        result: ok([
          { startTime: '1_700_000_000'.replace(/_/g, ''), totalVolume: '100000000', totalVolumeUSD: '1000000' },
          { startTime: '1700086400', totalVolume: '0', totalVolumeUSD: '0' },
        ]),
      },
    ]);

    expect(summary.pools.map((pool) => pool.asset)).toEqual(['BTC.BTC']);
    expect(summary.usdVolumeLabel).toBe('$10.0K');
    expect(summary.usdAvgLabel).toBe('Unavailable');
    expect(summary.deltaLabel).toBe('');
  });
});
