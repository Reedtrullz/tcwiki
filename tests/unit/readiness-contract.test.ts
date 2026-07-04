import { describe, expect, it } from 'vitest';

const { assertReadinessContract } = await import('../../scripts/lib/readiness-contract.mjs') as {
  assertReadinessContract: (json: unknown) => void;
};

function readinessResponse() {
  return {
    status: 'degraded',
    ready: false,
    checkedAt: '2026-07-04T00:00:00.000Z',
    version: 'development',
    commit: 'unknown',
    image: 'unknown',
    warnings: [],
    reasons: ['THORNode dynamic fee state is stale.'],
    sources: {
      midgard: {
        status: 'ok',
        source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
        healthWarnings: [],
        sourceWarnings: [],
        sourceWarningDetails: [],
        visibleData: {
          network: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
          pools: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
          earnings: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
        },
      },
      thornode: {
        status: 'ok',
        sourceCount: 1,
        activeControlKeys: [],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        scheduledMimirKeys: [],
        chainStatuses: [],
        monitoredControls: [],
        invalidMimirKeys: [],
        sourceWarnings: [],
        sourceWarningDetails: [],
        dynamicFees: {
          status: 'ok',
          checkedAt: '2026-07-04T00:00:00.000Z',
          source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
          enabledState: 'active',
          enabledValue: 1,
          currentEpoch: 1864,
          trackedRecordCount: 1,
          currentEntryCount: 1,
          whitelistedThornameCount: 1,
          historyThornameCount: 1,
          historySampleCount: 4,
          thorchainHeight: 26800000,
          snapshotPinned: true,
          thorchainBlockTime: '2026-07-04T00:00:00.000Z',
          thorchainBlockAgeSeconds: 2,
          sourceWarnings: ['THORNode dynamic fee state is stale.'],
          sourceWarningDetails: [
            {
              severity: 'warning',
              category: 'freshness',
              message: 'THORNode dynamic fee state is stale.',
              action: 'Refresh the pinned THORNode snapshot.',
            },
          ],
        },
      },
    },
  };
}

describe('readiness runtime contract helper', () => {
  it('accepts the dynamic-fee readiness subsection', () => {
    expect(() => assertReadinessContract(readinessResponse())).not.toThrow();
  });

  it('rejects readiness responses that omit dynamic-fee diagnostics', () => {
    const response = readinessResponse();
    delete (response.sources.thornode as { dynamicFees?: unknown }).dynamicFees;

    expect(() => assertReadinessContract(response)).toThrow(/dynamicFees/);
  });
});
