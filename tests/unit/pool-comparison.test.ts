import { describe, expect, it } from 'vitest';
import { deriveStatsPoolRows, derivePoolComparison, normalizePoolComparison } from '@/lib/stats-dashboard';

describe('bounded comparison of the loaded pool universe', () => {
  it('preserves at most three distinct bounded IDs without resolving asset aliases', () => {
    const params = new URLSearchParams();
    for (const asset of ['BTC.BTC', 'BTC.BTC', 'ETH.ETH', 'GAIA.ATOM', 'SOL.SOL']) params.append('compare_pool', asset);
    expect(normalizePoolComparison(params)).toEqual(['BTC.BTC', 'ETH.ETH', 'GAIA.ATOM']);
    expect(normalizePoolComparison(new URLSearchParams('compare_pool=%3Cscript%3E&compare_pool=bt&compare_pool=BTC.BTC'))).toEqual(['BTC.BTC']);
    expect(normalizePoolComparison(new URLSearchParams({ compare_pool: 'A'.repeat(10000) }))).toEqual([]);
  });
  it('compares existing rows without filling missing metrics or fetching missing pools', () => {
    const rows = deriveStatsPoolRows([{ asset: 'BTC.BTC', assetDepth: '1', runeDepth: '0', status: 'available' }]);
    expect(derivePoolComparison(rows, ['BTC.BTC', 'ETH.ETH'])).toEqual([
      { asset: 'BTC.BTC', row: rows[0], reason: null },
      { asset: 'ETH.ETH', row: null, reason: 'Not in the loaded pool snapshot' },
    ]);
    expect(rows[0].runeDepth).toBe(0);
    expect(rows[0].poolAPYPercent).toBeNull();
    expect(rows[0].poolAPYLabel).toBe('Unavailable');
  });
  it('withholds an ambiguous duplicate instead of choosing a plausible metric', () => {
    const rows = deriveStatsPoolRows([
      { asset: 'BTC.BTC', assetDepth: '1', runeDepth: '100000000', status: 'available' },
      { asset: 'BTC.BTC', assetDepth: '1', runeDepth: '200000000', status: 'available' },
    ]);
    expect(derivePoolComparison(rows, ['BTC.BTC'])).toEqual([{ asset: 'BTC.BTC', row: null, reason: 'Duplicate asset rows are not uniquely comparable' }]);
  });
});
