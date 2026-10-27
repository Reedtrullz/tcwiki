import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { appThornodeDataPolicy, THORNODE_CHAIN_SET_POLICY } from '../../scripts/lib/thornode-data-policy.mjs';

describe('THORNode collection policies', () => {
  it.each([undefined, '', 'bad', '0', '-1', '1.5', '21', 'Infinity'])('retains the default app lag for invalid configuration %s', value => {
    expect(appThornodeDataPolicy(value)).toMatchObject({ profile: 'app-operations', snapshotLagBlocks: 1 });
  });
  it('keeps actual runtime configuration distinct from the independent chain-set check', () => {
    const worker = JSON.parse(readFileSync('wrangler.do.jsonc', 'utf8'));
    const fetchHandler = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
    expect(appThornodeDataPolicy(worker.vars.THORNODE_SNAPSHOT_LAG_BLOCKS).snapshotLagBlocks).toBe(10);
    expect(appThornodeDataPolicy(fetchHandler.vars.THORNODE_SNAPSHOT_LAG_BLOCKS).snapshotLagBlocks).toBe(1);
    expect(THORNODE_CHAIN_SET_POLICY).toMatchObject({ profile: 'independent-chain-set', snapshotLagBlocks: 1 });
    expect(appThornodeDataPolicy('20').snapshotLagBlocks).toBe(20);
  });
});
