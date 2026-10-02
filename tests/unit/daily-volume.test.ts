import { describe, expect, it } from 'vitest';
import { deriveDailyVolumeSummary } from '@/lib/daily-volume';
import { liveOk } from '@/lib/trust';

const day = 86_400;
const start = Date.parse('2026-10-01T00:00:00Z') / 1000;
const observedAt = Date.parse('2026-10-02T12:00:00Z');
const row = (time: number, cents: unknown = '10000', rune: unknown = '100000000') => ({ startTime: String(time), endTime: String(time + day), totalVolume: rune, totalVolumeUSD: cents });
const entry = (rows: Record<string, unknown>[], asset = 'BTC.BTC') => ({ asset, result: liveOk(rows, { label: 'Test Midgard', url: 'https://test/v2' }, '2026-10-02T12:00:00Z') });

describe('deriveDailyVolumeSummary', () => {
  it('selects the completed zero UTC day rather than a positive open day or older nonzero day', () => {
    const summary = deriveDailyVolumeSummary([entry([row(start + day, '900000'), row(start, '0', '0'), row(start - day)])], observedAt);
    expect(summary.usdVolume).toBe(0);
    expect(summary.runeVolume).toBe(0);
    expect(summary.pools).toHaveLength(1);
    expect(summary.deltaPct).toBe(-100);
    expect(summary.periodLabel).toBe('2026-10-01 UTC');
    expect(summary.comparisonDays).toBe(1);
  });
  it('uses fixed trailing UTC days and removes identical duplicates independent of response order', () => {
    const rows = [row(start), row(start - day), row(start - 2 * day), row(start - 8 * day, '900000')];
    const summary = deriveDailyVolumeSummary([entry([...rows.reverse(), row(start)])], observedAt);
    expect(summary.usdVolume).toBe(100);
    expect(summary.usdAvg7d).toBe(100);
    expect(summary.comparisonDays).toBe(2);
    expect(summary.pools).toHaveLength(1);
  });
  it('withholds missing, negative, malformed, incomplete and conflicting day values', () => {
    for (const rows of [[], [{ ...row(start), totalVolumeUSD: undefined }], [row(start, '-1')], [row(start, '0x10')], [{ ...row(start), endTime: String(start + 100) }], [row(start), row(start, '20000')]]) {
      // Remove the field explicitly: the row helper has a default.
      if (rows[0] && rows[0].totalVolumeUSD === undefined) delete rows[0].totalVolumeUSD;
      const summary = deriveDailyVolumeSummary([entry(rows)], observedAt);
      expect(summary.usdVolume).toBeNull();
      expect(summary.usdVolumeLabel).toBe('Unavailable');
    }
  });
  it('changes the selected day exactly at UTC rollover, never backfilling missing today with yesterday', () => {
    const histories = [entry([row(start)])];
    expect(deriveDailyVolumeSummary(histories, (start + day) * 1000).usdVolume).toBe(100);
    expect(deriveDailyVolumeSummary(histories, (start + 2 * day) * 1000).usdVolume).toBeNull();
  });
});

it('keeps a selected-pool subtotal separate from the documented network aggregate and each provider', () => {
  const btc = entry([row(start)]);
  const eth = { asset: 'ETH.ETH', result: liveOk([row(start, '30000')], { label: 'Other provider', url: 'https://other/v2' }, '2026-10-02T11:59:00Z') };
  const failed = { asset: 'THOR.TCY', result: { status: 'degraded' as const, error: 'Unavailable', checkedAt: '2026-10-02T11:58:00Z' } };
  const network = entry([row(start, '100000')]).result;
  const summary = deriveDailyVolumeSummary([btc, eth, failed], observedAt, network);
  expect(summary.usdVolume).toBe(400);
  expect(summary.networkUsdVolume).toBe(1000);
  expect(summary.pools.map(p => p.share)).toEqual([75, 25]);
  expect(summary.pools.map(p => p.sourceResult.source?.label)).toEqual(['Other provider', 'Test Midgard']);
  expect(summary.coverage.map(p => [p.asset, p.included])).toEqual([['BTC.BTC', true], ['ETH.ETH', true], ['THOR.TCY', false]]);
  expect(summary.coverage[2].result.checkedAt).toBe('2026-10-02T11:58:00Z');
});

it('does not substitute a subset or stale-period network result for missing network volume', () => {
  const summary = deriveDailyVolumeSummary([entry([row(start)])], observedAt, entry([row(start - day)]).result);
  expect(summary.usdVolume).toBe(100);
  expect(summary.networkUsdVolume).toBeNull();
  expect(summary.networkUsdVolumeLabel).toBe('Unavailable');
});

it('explains missing, invalid and incomplete selected periods without treating them as zero', () => {
  const histories = [entry([], 'ABSENT'), entry([{ ...row(start), totalVolumeUSD: undefined }], 'MISSING'), entry([row(start, '-1')], 'INVALID'), entry([{ ...row(start), endTime: String(start + 100) }], 'INCOMPLETE')];
  const summary = deriveDailyVolumeSummary(histories, observedAt);
  expect(summary.coverage.map(pool => pool.reason)).toEqual(['Selected completed day absent', 'Missing volume fields', 'Invalid volume fields', 'Incomplete daily interval']);
  expect(summary.usdVolume).toBeNull();
});
