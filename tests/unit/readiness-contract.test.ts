import { describe, expect, it } from 'vitest';
import type { NetworkStatusSourceWarning } from '@/lib/types';

const { assertReadinessContract } = await import('../../scripts/lib/readiness-contract.mjs') as {
  assertReadinessContract: (json: unknown) => void;
};

import { readinessResponse, readyResponse, dynamicFeeSources, runePoolPolSources } from '../helpers/readiness-contract-fixture';

describe('readiness runtime contract helper', () => {
  it('accepts the dynamic-fee readiness subsection', () => {
    expect(() => assertReadinessContract(readinessResponse())).not.toThrow();
  });

  it('accepts warning-free ready responses', () => {
    expect(() => assertReadinessContract(readyResponse())).not.toThrow();
  });

  it('accepts ready responses with fully disclosed review-only Mimir support warnings', () => {
    const response = readyResponse();
    const warning = 'Known operational-support Mimir keys present: BURNSYNTHS, SCHEDULEDMIGRATION.';
    response.warnings = [warning];
    response.sources.thornode.sourceWarnings = [warning];
    response.sources.thornode.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'mimir-support',
        message: warning,
        action: 'Inspect these support keys before inferring a user-facing pause.',
        keys: ['BURNSYNTHS', 'SCHEDULEDMIGRATION'],
      },
    ];

    expect(() => assertReadinessContract(response)).not.toThrow();
  });

  it.each([
    {
      label: 'an unknown operation review warning',
      warning: 'Unknown operation-like Mimir keys present: NEWPAUSE.',
      detail: {
        severity: 'review',
        category: 'unknown-operation',
        message: 'Unknown operation-like Mimir keys present: NEWPAUSE.',
        action: 'Review this key before treating readiness as clean.',
      } satisfies NetworkStatusSourceWarning,
    },
    {
      label: 'a warning-severity Mimir support warning',
      warning: 'Known operational-support Mimir keys present: BURNSYNTHS.',
      detail: {
        severity: 'warning',
        category: 'mimir-support',
        message: 'Known operational-support Mimir keys present: BURNSYNTHS.',
        action: 'Review this key before treating readiness as clean.',
      } satisfies NetworkStatusSourceWarning,
    },
  ])('rejects ready responses with $label', ({ warning, detail }) => {
    const response = readyResponse();
    response.warnings = [warning];
    response.sources.thornode.sourceWarnings = [warning];
    response.sources.thornode.sourceWarningDetails = [detail];

    expect(() => assertReadinessContract(response)).toThrow(/review-only mimir-support/);
  });

  it('rejects ready responses when a support warning is not mirrored in top-level warnings', () => {
    const response = readyResponse();
    const warning = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';
    response.sources.thornode.sourceWarnings = [warning];
    response.sources.thornode.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'mimir-support',
        message: warning,
        action: 'Inspect this support key before inferring a user-facing pause.',
      },
    ];

    expect(() => assertReadinessContract(response)).toThrow(/top-level warnings must include/);
  });

  it('rejects ready responses when a support detail is absent from source warning strings', () => {
    const response = readyResponse();
    const warning = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';
    response.sources.thornode.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'mimir-support',
        message: warning,
        action: 'Inspect this support key before inferring a user-facing pause.',
      },
    ];

    expect(() => assertReadinessContract(response)).toThrow(/sourceWarnings must include every/);
  });

  it('normalizes warning-message whitespace before matching ready-response disclosures', () => {
    const response = readyResponse();
    const warning = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';
    response.warnings = [` ${warning} `];
    response.sources.thornode.sourceWarnings = [warning];
    response.sources.thornode.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'mimir-support',
        message: `  ${warning}`,
        action: 'Inspect this support key before inferring a user-facing pause.',
      },
    ];

    expect(() => assertReadinessContract(response)).not.toThrow();
  });

  it('rejects ready responses when a raw source warning lacks a matching support detail', () => {
    const response = readyResponse();
    const warning = 'Known operational-support Mimir keys present: SCHEDULEDMIGRATION.';
    response.warnings = [warning, 'Unclassified warning.'];
    response.sources.thornode.sourceWarnings = [warning, 'Unclassified warning.'];
    response.sources.thornode.sourceWarningDetails = [
      {
        severity: 'review',
        category: 'mimir-support',
        message: warning,
        action: 'Inspect this support key before inferring a user-facing pause.',
      },
    ];

    expect(() => assertReadinessContract(response)).toThrow(/matching review-only mimir-support detail/);
  });

  it('accepts null optional RUNEPool/POL Mimir config values', () => {
    const response = readyResponse();
    const runePoolPol = response.sources.thornode.runePoolPol as {
      depositMaturityBlocksValue: number | null;
      maxReserveBackstopValue: number | null;
    };
    runePoolPol.depositMaturityBlocksValue = null;
    runePoolPol.maxReserveBackstopValue = null;

    expect(() => assertReadinessContract(response)).not.toThrow();
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

  it('rejects readiness responses that omit RUNEPool/POL diagnostics', () => {
    const response = readinessResponse();
    delete (response.sources.thornode as { runePoolPol?: unknown }).runePoolPol;

    expect(() => assertReadinessContract(response)).toThrow(/sources\.thornode\.runePoolPol must be an object/);
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

  it('rejects ready responses with mixed THORNode and RUNEPool/POL providers', () => {
    const response = readyResponse();
    response.sources.thornode.source = { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' };
    response.sources.thornode.runePoolPol.source = {
      label: 'Liquify THORNode',
      url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
    };

    expect(() => assertReadinessContract(response)).toThrow(/runePoolPol\.source must share provider origin/);
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

  it('rejects ready responses without exact RUNEPool/POL endpoint evidence', () => {
    const response = readyResponse();
    response.sources.thornode.runePoolPol.sources = runePoolPolSources.filter((source) => !source.url.includes('/runepool'));

    expect(() => assertReadinessContract(response)).toThrow(/runePoolPol\.sources must include height-pinned \/runepool/);
  });
});

it('rejects manufactured height verification and preserves unsupported echo as unverified', () => {
  const response = readyResponse();
  const source = response.sources.thornode.sources[2] as import('@/lib/types').SourceMeta;
  source.heightPinning = { requestedHeight: 26799999, verification: 'unverified' };
  expect(() => assertReadinessContract(response)).not.toThrow();
  source.heightPinning.verification = 'verified';
  expect(() => assertReadinessContract(response)).toThrow(/matching observed height/);
  source.heightPinning.observedHeight = 26800000;
  expect(() => assertReadinessContract(response)).toThrow(/matching observed height/);
  source.heightPinning.observedHeight = 26799999;
  expect(() => assertReadinessContract(response)).not.toThrow();
  source.url = 'https://thornode.thorchain.network/thorchain/mimir?height=26800000';
  expect(() => assertReadinessContract(response)).toThrow(/requested source URL/);
});
