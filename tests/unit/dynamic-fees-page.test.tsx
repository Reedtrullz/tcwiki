import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DynamicFeesView } from '@/app/dynamic-fees/DynamicFeesPageClient';
import type { DynamicL1FeeStatus, LiveDataResult } from '@/lib/types';

const status: DynamicL1FeeStatus = {
  mimir: {
    enabled: { key: 'L1DYNAMICFEEENABLED', value: 1, state: 'active' },
    slipMinBps: { key: 'L1SLIPMINBPS', value: 10, state: 'active' },
    epochBlocks: { key: 'L1DynamicFeeEpochBlocks', value: null, defaultValue: 14400, effectiveValue: 14400, state: 'absent' },
    floorBps: { key: 'L1DynamicFeeFloorBPS', value: null, defaultValue: 1, effectiveValue: 1, state: 'absent' },
    ceilingBps: { key: 'L1DynamicFeeCeilingBPS', value: null, defaultValue: 20, effectiveValue: 20, state: 'absent' },
    stepBps: { key: 'L1DynamicFeeStepBPS', value: null, defaultValue: 1, effectiveValue: 1, state: 'absent' },
    deadbandBps: { key: 'L1DynamicFeeDeadbandBPS', value: null, defaultValue: 1000, effectiveValue: 1000, state: 'absent' },
    windowEpochs: { key: 'L1DynamicFeeWindowEpochs', value: null, defaultValue: 3, effectiveValue: 3, state: 'absent' },
    whitelistedPartners: [
      {
        key: 'DYNAMICFEE-WHITELIST-SS',
        thorname: 'ss',
        value: 1,
        whitelisted: true,
        state: 'active',
      },
    ],
    invalidKeys: [],
  },
  records: [
    {
      thorname: 'ss',
      pair: 'THOR.RUNE|THOR.TCY',
      dynamicBps: 1,
      whitelistValue: 1,
      whitelistState: 'active',
      whitelisted: true,
      lastActiveEpoch: 0,
      latestFeesTorBaseUnits: null,
    },
  ],
  currentEpoch: 1864,
  currentEntries: [
    {
      thorname: 'ss',
      pair: 'THOR.RUNE|THOR.TCY',
      epoch: 1864,
      volumeTorBaseUnits: '185642164687',
      feesTorBaseUnits: '123938141',
    },
  ],
  sourceFreshness: {
    thorchainHeight: 26849569,
    thorchainBlockTime: '2026-07-03T12:00:00.000Z',
    thorchainBlockAgeSeconds: 9,
    snapshotPinned: true,
  },
  sourceWarnings: [],
  caveats: ['current-only', 'adr-experiment', 'not-historical-fee-proof'],
};

const liveResult: LiveDataResult<DynamicL1FeeStatus> = {
  status: 'ok',
  checkedAt: '2026-07-03T12:00:09.000Z',
  data: status,
  source: {
    label: 'THORNode',
    url: 'https://thornode.thorchain.network/thorchain',
  },
};

describe('DynamicFeesView', () => {
  it('renders source labels, current-only posture, and dynamic fee records', () => {
    const html = renderToStaticMarkup(<DynamicFeesView result={liveResult} status={status} />);

    expect(html).toContain('Dynamic L1 Fees');
    expect(html).toContain('Current-only');
    expect(html).toContain('ADR-026 dynamic L1 min fee per thorname');
    expect(html).toContain('THORNode');
    expect(html).toContain('L1DynamicFeeEnabled');
    expect(html).toContain('L1DynamicFeeWindowEpochs');
    expect(html).toContain('10% default');
    expect(html).toContain('DYNAMICFEE-WHITELIST-SS');
    expect(html).toContain('THOR.RUNE|THOR.TCY');
    expect(html).toContain('1 bps');
    expect(html).toContain('$1.24');
    expect(html).toContain('$1,856.42');
  });

  it('renders missing TOR data as insufficient samples instead of zero', () => {
    const html = renderToStaticMarkup(<DynamicFeesView result={liveResult} status={status} />);

    expect(html).toContain('Insufficient samples');
    expect(html).not.toContain('$0.00');
  });

  it('surfaces source warnings in the evidence disclosure', () => {
    const warnedStatus: DynamicL1FeeStatus = {
      ...status,
      sourceWarnings: [
        'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: warnedStatus }} status={warnedStatus} />);

    expect(html).toContain('Source warnings');
    expect(html).toContain('Source warnings 1');
    expect(html).toContain('First warning: Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.');
    expect(html).toContain('exists without a sealed dynamic_l1_fees record');
    expect(html).toContain('/dynamic_l1_fees_current');
  });

  it('renders current accumulators even when no sealed record exists yet', () => {
    const pendingStatus: DynamicL1FeeStatus = {
      ...status,
      currentEntries: [
        ...status.currentEntries,
        {
          thorname: 'symbiosis',
          pair: 'BTC.BTC|THOR.RUNE',
          epoch: 1864,
          volumeTorBaseUnits: '4593546591197',
          feesTorBaseUnits: '1376758445',
        },
      ],
      sourceWarnings: [
        'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: pendingStatus }} status={pendingStatus} />);

    expect(html).toContain('Current accumulators without sealed records');
    expect(html).toContain('symbiosis');
    expect(html).toContain('BTC.BTC|THOR.RUNE');
    expect(html).toContain('$13.77');
    expect(html).toContain('$45,935.47');
  });

  it('keeps degraded live data visible without hiding the static explainer', () => {
    const degraded: LiveDataResult<DynamicL1FeeStatus> = {
      status: 'degraded',
      checkedAt: '2026-07-03T12:00:09.000Z',
      error: 'THORNode dynamic fee sources did not provide a usable snapshot',
    };
    const html = renderToStaticMarkup(
      <DynamicFeesView result={degraded} isDegraded error={degraded.error} />
    );

    expect(html).toContain('Degraded');
    expect(html).toContain('THORNode dynamic fee sources did not provide a usable snapshot');
    expect(html).toContain('How the Experiment Works');
    expect(html).toContain('No sealed dynamic-fee records are available');
  });
});
