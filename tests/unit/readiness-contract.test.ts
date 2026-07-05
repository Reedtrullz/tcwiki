import { describe, expect, it } from 'vitest';

const { assertReadinessContract } = await import('../../scripts/lib/readiness-contract.mjs') as {
  assertReadinessContract: (json: unknown) => void;
};

const thornodeSources = [
  { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
  { label: 'THORNode latest block', url: 'https://thornode.thorchain.network/cosmos/base/tendermint/v1beta1/blocks/latest' },
  { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=26799999' },
  { label: 'THORNode inbound addresses', url: 'https://thornode.thorchain.network/thorchain/inbound_addresses?height=26799999' },
  { label: 'THORNode version', url: 'https://thornode.thorchain.network/thorchain/version?height=26799999' },
  { label: 'THORNode lastblock', url: 'https://thornode.thorchain.network/thorchain/lastblock?height=26799999' },
];

const dynamicFeeSources = [
  { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
  { label: 'THORNode latest block', url: 'https://thornode.thorchain.network/cosmos/base/tendermint/v1beta1/blocks/latest' },
  { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=26799999' },
  { label: 'THORNode dynamic L1 fee records', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees?height=26799999' },
  { label: 'THORNode dynamic L1 fee current epoch', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees_current?height=26799999' },
  { label: 'THORNode dynamic L1 fee history ss', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees/ss?height=26799999' },
];

function readinessResponse() {
  return {
    status: 'degraded',
    ready: false,
    checkedAt: '2026-07-04T00:00:00.000Z',
    version: 'development',
    commit: 'unknown',
    image: 'unknown',
    runtime: {
      version: 'development',
      commit: 'unknown',
      image: 'unknown',
      strict: false,
      verified: false,
      warnings: [
        'Runtime version metadata is missing or still using a local placeholder.',
        'Runtime commit metadata is missing or not a git SHA.',
        'Runtime image metadata is missing or not an immutable sha256 digest ref.',
      ],
    },
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
        source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
        sources: thornodeSources,
        sourceCount: thornodeSources.length,
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
          sources: dynamicFeeSources,
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

function readyResponse() {
  const response = readinessResponse();
  response.status = 'ready';
  response.ready = true;
  response.reasons = [];
  response.sources.thornode.dynamicFees.sourceWarnings = [];
  response.sources.thornode.dynamicFees.sourceWarningDetails = [];
  return response;
}

describe('readiness runtime contract helper', () => {
  it('accepts the dynamic-fee readiness subsection', () => {
    expect(() => assertReadinessContract(readinessResponse())).not.toThrow();
  });

  it('accepts warning-free ready responses', () => {
    expect(() => assertReadinessContract(readyResponse())).not.toThrow();
  });

  it('rejects readiness responses that omit runtime diagnostics', () => {
    const response = readinessResponse();
    delete (response as { runtime?: unknown }).runtime;

    expect(() => assertReadinessContract(response)).toThrow(/runtime must be an object/);
  });

  it('rejects mismatched runtime diagnostics', () => {
    const response = readinessResponse();
    response.runtime.commit = 'deadbeef';

    expect(() => assertReadinessContract(response)).toThrow(/runtime\.commit must match/);
  });

  it('rejects claimed runtime verification that contradicts metadata values', () => {
    const response = readinessResponse();
    response.runtime.verified = true;
    response.runtime.warnings = [];

    expect(() => assertReadinessContract(response)).toThrow(/runtime\.verified must match runtime metadata validation/);
  });

  it('rejects ready responses with strict unverified runtime metadata', () => {
    const response = readyResponse();
    response.runtime.strict = true;

    expect(() => assertReadinessContract(response)).toThrow(/strict runtime metadata/);
  });

  it('rejects readiness responses that omit dynamic-fee diagnostics', () => {
    const response = readinessResponse();
    delete (response.sources.thornode as { dynamicFees?: unknown }).dynamicFees;

    expect(() => assertReadinessContract(response)).toThrow(/sources\.thornode\.dynamicFees must be an object/);
  });

  it('rejects contradictory ready status flags', () => {
    const response = readyResponse();
    response.ready = false;

    expect(() => assertReadinessContract(response)).toThrow(/status and ready flag/);
  });

  it('rejects ready responses with degraded visible source subsections', () => {
    const response = readyResponse();
    response.sources.midgard.visibleData.earnings.status = 'degraded';

    expect(() => assertReadinessContract(response)).toThrow(/visibleData\.earnings\.status/);
  });

  it('rejects ready responses without source metadata on ready source checks', () => {
    const response = readyResponse();
    delete (response.sources.midgard.visibleData.earnings as { source?: unknown }).source;

    expect(() => assertReadinessContract(response)).toThrow(/visibleData\.earnings\.source must be present/);
  });

  it('rejects ready responses with mixed Midgard health and visible-data providers', () => {
    const response = readyResponse();
    response.sources.midgard.source = { label: 'THORChain Midgard Health', url: 'https://midgard.thorchain.network/v2/health' };
    response.sources.midgard.visibleData.network.source = {
      label: 'Liquify Midgard Network',
      url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network',
    };

    expect(() => assertReadinessContract(response)).toThrow(/visibleData\.network\.source must share provider origin/);
  });

  it('rejects ready responses that omit visible source subsections with a clear path', () => {
    const response = readyResponse();
    delete (response.sources.midgard.visibleData as { earnings?: unknown }).earnings;

    expect(() => assertReadinessContract(response)).toThrow(/sources\.midgard\.visibleData\.earnings must be an object/);
  });

  it('rejects ready responses with dynamic-fee warning details', () => {
    const response = readyResponse();
    response.sources.thornode.dynamicFees.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'unknown-operation',
        message: 'Dynamic fee source returned an unknown warning detail.',
        action: 'Review the dynamic-fee source warning before treating readiness as clean.',
      },
    ];

    expect(() => assertReadinessContract(response)).toThrow(/dynamicFees\.sourceWarningDetails/);
  });

  it('rejects ready responses with mixed THORNode and dynamic-fee providers', () => {
    const response = readyResponse();
    response.sources.thornode.source = { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' };
    response.sources.thornode.dynamicFees.source = {
      label: 'Liquify THORNode',
      url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
    };

    expect(() => assertReadinessContract(response)).toThrow(/dynamicFees\.source must share provider origin/);
  });

  it('rejects ready responses without exact THORNode network endpoint evidence', () => {
    const response = readyResponse();
    response.sources.thornode.sources = [
      { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
    ];

    expect(() => assertReadinessContract(response)).toThrow(/sources\.thornode\.sources must include latest Cosmos block/);
  });

  it('rejects ready responses without exact dynamic-fee endpoint evidence', () => {
    const response = readyResponse();
    response.sources.thornode.dynamicFees.sources = dynamicFeeSources.filter((source) => !source.url.includes('/dynamic_l1_fees_current'));

    expect(() => assertReadinessContract(response)).toThrow(/dynamicFees\.sources must include height-pinned \/dynamic_l1_fees_current/);
  });
});
