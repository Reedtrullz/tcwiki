import { describe, expect, it } from 'vitest';
import { bpsPositionForValue, filterDynamicFeeRecords, trustedDynamicConfigValue } from '@/lib/data/dynamic-fees-helpers';
import type { DynamicL1FeeRecord } from '@/lib/types';

function record(dynamicBps: number): DynamicL1FeeRecord {
  return { thorname: 'ss', pair: 'BTC.BTC|ETH.ETH', dynamicBps, whitelistValue: 1, whitelistState: 'active', whitelisted: true, lastActiveEpoch: 1, latestFeesTorBaseUnits: null };
}

describe('dynamic fee bounds filtering', () => {
  it.each([
    [0, 1, 20, 'below'], [1, 1, 20, 'floor'], [10, 1, 20, 'inside'], [20, 1, 20, 'ceiling'], [21, 1, 20, 'above'],
    [5, 5, 5, 'equal'], [0, 0, 0, 'equal'], [5, undefined, 20, 'unknown'], [5, 20, 1, 'invalid'],
  ] as const)('describes %s relative to %s/%s as %s', (bps, floor, ceiling, expected) => {
    expect(bpsPositionForValue(bps, floor, ceiling)).toBe(expected);
  });
  it('never substitutes an untrusted raw value for an explicitly withheld effective config', () => {
    expect(trustedDynamicConfigValue({ key: 'floor', value: 99, effectiveValue: null, state: 'unparseable' })).toBeNull();
  });
  it.each([
    [0, 1, 20], [21, 1, 20], [10, 20, 1], [5, 5, 5], [NaN, 1, 20], [5, NaN, 20],
  ])('never calls %s inside bounds %s/%s', (bps, floor, ceiling) => {
    expect(filterDynamicFeeRecords([record(bps)], new Map(), { query: '', whitelist: 'all', bps: 'inside', current: 'all' }, floor, ceiling)).toEqual([]);
  });
  it('keeps a strict interior observation with valid ordered bounds', () => {
    const inside = record(10);
    expect(filterDynamicFeeRecords([inside], new Map(), { query: '', whitelist: 'all', bps: 'inside', current: 'all' }, 1, 20)).toEqual([inside]);
  });
});
