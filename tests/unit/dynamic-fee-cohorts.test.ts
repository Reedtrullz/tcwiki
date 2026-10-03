import { describe, expect, it } from 'vitest';
import { deriveDynamicL1FeeStatus } from '@/lib/api/thornode';
import { historyEpochRows } from '@/lib/data/dynamic-fees-helpers';
import type { DynamicL1FeeHistoryEntry, DynamicL1FeeThornameHistory } from '@/lib/types';

function attribution(thorname: string, history: DynamicL1FeeHistoryEntry[]): DynamicL1FeeThornameHistory {
  return { thorname, whitelistValue: 1, whitelistState: 'active', pairs: [{ thorname, pair: 'BTC.BTC|ETH.ETH', dynamicBps: 2, whitelistValue: 1, whitelistState: 'active', lastActiveEpoch: 3, history }] };
}
function status(histories: DynamicL1FeeThornameHistory[]) {
  return deriveDynamicL1FeeStatus({}, { entries: [] }, { epoch: '4', entries: [] }, { thorchainHeight: 100, snapshotPinned: true, thorchainBlockTime: '2026-10-03T00:00:00Z' }, histories);
}
const first = { epoch: 1, feesTorBaseUnits: '100', volumeTorBaseUnits: '100', bpsAtClose: 2 };
const second = { epoch: 1, feesTorBaseUnits: null, volumeTorBaseUnits: '1', bpsAtClose: 10 };

describe('stored fee attribution cohorts', () => {
  it('discloses changing membership, missing fields, retention gaps and an unweighted controller mean', () => {
    const rows = historyEpochRows(status([attribution('ss', [first, { ...first, epoch: 3 }]), attribution('aa', [second])]));
    expect(rows[0]).toMatchObject({ samples: 2, feesTorBaseUnits: BigInt(100), averageBps: 6, missingFeesSamples: 1, missingVolumeSamples: 0, cohort: ['aa|BTC.BTC|ETH.ETH', 'ss|BTC.BTC|ETH.ETH'] });
    expect(rows[1]).toMatchObject({ samples: 1, gapBefore: 1, cohort: ['ss|BTC.BTC|ETH.ETH'] });
  });
  it('compares only attribution keys present in every loaded epoch when requested', () => {
    const rows = historyEpochRows(status([attribution('ss', [first, { ...first, epoch: 3 }]), attribution('aa', [second])]), { commonCohort: true });
    expect(rows.map(row => row.samples)).toEqual([1, 1]);
    expect(rows[0]).toMatchObject({ averageBps: 2, missingFeesSamples: 0, cohort: ['ss|BTC.BTC|ETH.ETH'] });
  });
  it('keeps an empty common cohort unavailable and preserves stored zeros', () => {
    const disjoint = status([attribution('ss', [first]), attribution('aa', [{ ...second, epoch: 3 }])]);
    expect(historyEpochRows(disjoint, { commonCohort: true }).map(row => [row.samples, row.feesTorBaseUnits, row.averageBps])).toEqual([[0, null, null], [0, null, null]]);
    const zero = status([attribution('ss', [{ epoch: 1, feesTorBaseUnits: '0', volumeTorBaseUnits: '0', bpsAtClose: 0 }])]);
    expect(historyEpochRows(zero)[0]).toMatchObject({ feesTorBaseUnits: BigInt(0), volumeTorBaseUnits: BigInt(0), averageBps: 0, missingFeesSamples: 0 });
  });
  it('counts identical duplicate attribution once and discloses duplication', () => {
    const source = attribution('ss', [first]);
    expect(historyEpochRows(status([source, structuredClone(source)]))[0]).toMatchObject({ feesTorBaseUnits: BigInt(100), samples: 1, duplicateSamples: 1 });
  });
  it('excludes conflicting duplicate attribution instead of choosing a revenue total', () => {
    expect(historyEpochRows(status([attribution('ss', [first]), attribution('ss', [{ ...first, feesTorBaseUnits: '200' }])]))[0])
      .toMatchObject({ feesTorBaseUnits: null, averageBps: null, conflictingSamples: 1, missingFeesSamples: 1, samples: 1 });
  });
});
