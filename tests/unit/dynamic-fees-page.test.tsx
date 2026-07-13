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
  histories: [
    {
      thorname: 'ss',
      whitelistValue: 1,
      whitelistState: 'active',
      pairs: [
        {
          thorname: 'ss',
          pair: 'THOR.RUNE|THOR.TCY',
          dynamicBps: 1,
          whitelistValue: 1,
          whitelistState: 'active',
          lastActiveEpoch: 1864,
          history: [
            {
              epoch: 1864,
              volumeTorBaseUnits: '185642164687',
              feesTorBaseUnits: '123938141',
              bpsAtClose: 1,
            },
          ],
        },
      ],
    },
  ],
  sourceFreshness: {
    thorchainHeight: 26849569,
    thorchainBlockTime: '2026-07-03T12:00:00.000Z',
    thorchainBlockAgeSeconds: 9,
    snapshotPinned: true,
  },
  sourceWarnings: [],
  sourceWarningDetails: [],
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
    expect(html).toContain('Look Here First');
    expect(html).toContain('Revenue signal');
    expect(html).toContain('Coverage Check');
    expect(html).toContain('Partial coverage');
    expect(html).toContain('Current epoch rows');
    expect(html).toContain('1 current accumulator');
    expect(html).toContain('Rows with sealed record');
    expect(html).toContain('1 / 1');
    expect(html).toContain('Sealed history');
    expect(html).toContain('1 samples / 1 epochs');
    expect(html).toContain('Volume is demand context, not proof that the lower floor won routing flow.');
    expect(html).toContain('Historical Results');
    expect(html).toContain('Pair Movement Snapshot');
    expect(html).toContain('Show pair-level history details');
    expect(html).toContain('Interpretation Notes');
    expect(html).toContain('Keep these as guardrails for the live numbers.');
    expect(html).toContain('L1-to-L1 scope');
    expect(html).toContain('Affiliate attribution versus applied floor');
    expect(html).toContain('ADR-026 dynamic L1 fee model');
    expect(html).toContain('Source retrieved 2026-07-04');
    expect(html).toContain('THORChain Devs ADR-026 discussion');
    expect(html).toContain('Source retrieved 2026-07-05');
    expect(html).toContain('THORNode');
    expect(html).toContain('L1DynamicFeeEnabled');
    expect(html).toContain('L1DynamicFeeWindowEpochs');
    expect(html).toContain('10% default');
    expect(html).toContain('DYNAMICFEE-WHITELIST-SS');
    expect(html).toContain('THOR.RUNE|THOR.TCY');
    expect(html).toContain('Search tracked records');
    expect(html).toContain('Whitelist');
    expect(html).toContain('Bps position');
    expect(html).toContain('Current epoch');
    expect(html).toContain('Showing 1 of 1');
    expect(html).toContain('1 bps');
    expect(html).toContain('1.24 TOR');
    expect(html).toContain('1.9K TOR');
    expect(html).not.toContain('$1.24');
    expect(html).not.toContain('$1,856.42');
    expect(html).toContain('fees_tor');
    expect(html).toContain('volume_tor');
    expect(html).toContain('Insufficient samples for trend');
    expect(html).toContain('Context only');
    expect(html).toContain('Not causal proof');
    expect(html).toContain('Show controller configuration');
    expect(html).toContain('Current records and sparse sealed history do not prove revenue lift');
    expect(html).not.toContain('Evidence Boundary');
    expect(html).not.toContain('Remaining Non-Claims');
  });

  it('renders route source posture before the live tracker when provided', () => {
    const html = renderToStaticMarkup(
      <DynamicFeesView result={liveResult} status={status}>
        <section aria-label="Page Source Posture">Route source boundary</section>
      </DynamicFeesView>
    );

    expect(html.indexOf('Route source boundary')).toBeGreaterThan(-1);
    expect(html.indexOf('id="dynamic-fees-live"')).toBeGreaterThan(-1);
    expect(html.indexOf('Route source boundary')).toBeLessThan(html.indexOf('id="dynamic-fees-live"'));
    expect(html.indexOf('Route source boundary')).toBeLessThan(html.indexOf('Experiment Context'));
  });

  it('summarizes pair-level movement without turning it into revenue proof', () => {
    const pairStatus: DynamicL1FeeStatus = {
      ...status,
      records: [
        status.records[0],
        {
          ...status.records[0],
          thorname: 'symbiosis',
          pair: 'BTC.BTC|ETH.ETH',
          dynamicBps: 4,
          latestFeesTorBaseUnits: '1800000000',
        },
      ],
      currentEntries: [
        status.currentEntries[0],
      ],
      histories: [
        {
          ...status.histories[0],
          pairs: [
            {
              ...status.histories[0].pairs[0],
              history: [
                {
                  epoch: 1862,
                  volumeTorBaseUnits: '100000000000',
                  feesTorBaseUnits: '100000000',
                  bpsAtClose: 3,
                },
                {
                  epoch: 1863,
                  volumeTorBaseUnits: '185642164687',
                  feesTorBaseUnits: '123938141',
                  bpsAtClose: 1,
                },
              ],
            },
          ],
        },
        {
          thorname: 'symbiosis',
          whitelistValue: 1,
          whitelistState: 'active',
          pairs: [
            {
              thorname: 'symbiosis',
              pair: 'BTC.BTC|ETH.ETH',
              dynamicBps: 4,
              whitelistValue: 1,
              whitelistState: 'active',
              lastActiveEpoch: 1864,
              history: [
                {
                  epoch: 1862,
                  volumeTorBaseUnits: '200000000000',
                  feesTorBaseUnits: '200000000',
                  bpsAtClose: 6,
                },
                {
                  epoch: 1864,
                  volumeTorBaseUnits: '300000000000',
                  feesTorBaseUnits: '300000000',
                  bpsAtClose: 4,
                },
              ],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: pairStatus }} status={pairStatus} />);

    expect(html).toContain('Pair Movement Snapshot');
    expect(html).toContain('Bps moved');
    expect(html).toContain('2 / 2');
    expect(html).toContain('Current activity');
    expect(html).toContain('1 / 2');
    expect(html).toContain('Moved down 2 bps');
    expect(html).toContain('Top sealed pairs');
    expect(html).toContain('Current accumulator');
    expect(html).toContain('Pair movement is controller evidence, not proof of revenue lift or partner attribution quality.');
    expect(html).not.toContain('Pair movement proves revenue lift');
  });

  it('renders absent dynamic-fee enablement as default disabled instead of unknown', () => {
    const absentEnabledStatus: DynamicL1FeeStatus = {
      ...status,
      mimir: {
        ...status.mimir,
        enabled: {
          key: 'L1DynamicFeeEnabled',
          value: null,
          defaultValue: 0,
          effectiveValue: 0,
          state: 'absent',
        },
      },
    };
    const html = renderToStaticMarkup(
      <DynamicFeesView result={{ ...liveResult, data: absentEnabledStatus }} status={absentEnabledStatus} />
    );

    expect(html).toContain('Disabled by default');
    expect(html).toContain('<code>L1DynamicFeeEnabled</code>: absent (default 0)');
    expect(html).not.toContain('Controller</span><span>Unknown');
  });

  it('renders missing TOR data as insufficient samples instead of zero', () => {
    const html = renderToStaticMarkup(<DynamicFeesView result={liveResult} status={status} />);

    expect(html).toContain('Insufficient samples');
    expect(html).not.toContain('$0.00');
  });

  it('renders nonzero sub-cent TOR amounts as less than one cent instead of zero', () => {
    const subCentStatus: DynamicL1FeeStatus = {
      ...status,
      records: [
        {
          ...status.records[0],
          latestFeesTorBaseUnits: '1',
        },
      ],
      currentEntries: [
        {
          ...status.currentEntries[0],
          feesTorBaseUnits: '1',
          volumeTorBaseUnits: '1',
        },
      ],
      histories: [
        {
          ...status.histories[0],
          pairs: [
            {
              ...status.histories[0].pairs[0],
              history: [
                {
                  ...status.histories[0].pairs[0].history[0],
                  feesTorBaseUnits: '1',
                  volumeTorBaseUnits: '1',
                },
              ],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: subCentStatus }} status={subCentStatus} />);

    expect(html).toContain('&lt;0.01 TOR');
    expect(html).not.toContain('$0.01');
    expect(html).not.toContain('$0.00');
  });

  it('fails closed for malformed TOR amount strings instead of crashing or rendering zero', () => {
    const malformedStatus: DynamicL1FeeStatus = {
      ...status,
      records: [
        {
          ...status.records[0],
          latestFeesTorBaseUnits: 'not-a-decimal-amount',
        },
      ],
      currentEntries: [
        {
          ...status.currentEntries[0],
          feesTorBaseUnits: '1e6',
          volumeTorBaseUnits: '1'.repeat(81),
        },
      ],
      histories: [
        {
          ...status.histories[0],
          pairs: [
            {
              ...status.histories[0].pairs[0],
              history: [
                {
                  ...status.histories[0].pairs[0].history[0],
                  feesTorBaseUnits: '1000000 ',
                  volumeTorBaseUnits: '0x10',
                },
              ],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: malformedStatus }} status={malformedStatus} />);

    expect(html).toContain('Insufficient samples');
    expect(html).not.toContain('$0.00');
    expect(html).not.toContain('$NaN');
    expect(html).not.toContain('Infinity');
  });

  it('formats TOR totals too large for chart math without rendering unsafe numbers', () => {
    const tooLargeWholeTor = BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1);
    const tooLargeTorBaseUnits = (tooLargeWholeTor * BigInt(100000000)).toString();
    const hugeStatus: DynamicL1FeeStatus = {
      ...status,
      records: [
        {
          ...status.records[0],
          latestFeesTorBaseUnits: tooLargeTorBaseUnits,
        },
      ],
      currentEntries: [
        {
          ...status.currentEntries[0],
          feesTorBaseUnits: tooLargeTorBaseUnits,
          volumeTorBaseUnits: tooLargeTorBaseUnits,
        },
      ],
      histories: [
        {
          ...status.histories[0],
          pairs: [
            {
              ...status.histories[0].pairs[0],
              history: [
                {
                  ...status.histories[0].pairs[0].history[0],
                  feesTorBaseUnits: tooLargeTorBaseUnits,
                  volumeTorBaseUnits: tooLargeTorBaseUnits,
                },
              ],
            },
          ],
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: hugeStatus }} status={hugeStatus} />);

    expect(html).toContain('9,007,199,254,740,992 TOR');
    expect(html).toContain('fees_tor unavailable for chart math');
    expect(html).not.toContain('$9,007,199,254,740,992');
    expect(html).not.toContain('$0.00');
    expect(html).not.toContain('$NaN');
    expect(html).not.toContain('Infinity');
  });

  it('keeps the bps distribution CSP-compatible without inline style attributes', () => {
    const html = renderToStaticMarkup(<DynamicFeesView result={liveResult} status={status} />);

    expect(html).toContain('w-[100%]');
    expect(html).not.toContain('style="width:');
  });

  it('counts tracked thorname-pair records independently when pairs overlap', () => {
    const overlappingStatus: DynamicL1FeeStatus = {
      ...status,
      records: [
        ...status.records,
        {
          ...status.records[0],
          thorname: 'symbiosis',
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: overlappingStatus }} status={overlappingStatus} />);

    expect(html).toContain('Tracked thorname-pair records');
    expect(html).toMatch(/Tracked thorname-pair records[\s\S]*>2<\/p>/);
  });

  it('keeps caveat-resolution copy from overclaiming protocol or community evidence', () => {
    const html = renderToStaticMarkup(<DynamicFeesView result={liveResult} status={status} />);

    expect(html).toContain('ADR-026 v1 applies to eligible L1 swaps');
    expect(html).toContain('Discord can explain debate and operating concerns, but it is not canonical protocol evidence.');
    expect(html).toContain('Current records and sparse sealed history do not prove revenue lift');
    expect(html).toContain('Per-swap evidence exposing the memo thornames');
    expect(html).not.toContain('Discord proves');
    expect(html).not.toContain('proves revenue lift');
    expect(html).not.toContain('proves route competitiveness');
  });

  it('surfaces source warnings in the evidence disclosure', () => {
    const warnedStatus: DynamicL1FeeStatus = {
      ...status,
      sourceWarnings: [
        'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
      ],
      sourceWarningDetails: [
        {
          severity: 'warning',
          category: 'source-shape',
          message: 'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
          action: 'Treat the affected dynamic-fee record, history, or current accumulator as partial until THORNode returns consistent fields.',
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: warnedStatus }} status={warnedStatus} />);

    expect(html).toContain('Source warnings');
    expect(html).toContain('Source warnings 1');
    expect(html).toContain('First: source-shape / Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.');
    expect(html).toContain('exists without a sealed dynamic_l1_fees record');
    expect(html).toContain('Action: Treat the affected dynamic-fee record, history, or current accumulator as partial until THORNode returns consistent fields.');
    expect(html).toContain('/dynamic_l1_fees_current');
  });

  it('summarizes unknown Mimir keys in live source posture', () => {
    const warnedStatus: DynamicL1FeeStatus = {
      ...status,
      sourceWarnings: ['Unknown operation-like Mimir keys need review: PRIVATE-KEY-A, PRIVATE-KEY-B.'],
      sourceWarningDetails: [
        {
          severity: 'review',
          category: 'unknown-operation',
          message: 'Unknown operation-like Mimir keys need review: PRIVATE-KEY-A, PRIVATE-KEY-B.',
          action: 'Review the operation-like key family before interpreting it as non-pausing.',
          keys: ['PRIVATE-KEY-A', 'PRIVATE-KEY-B'],
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: warnedStatus }} status={warnedStatus} />);

    expect(html).toContain('First: unknown-operation / 2 operation-like Mimir keys need review.');
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
      sourceWarningDetails: [
        {
          severity: 'warning',
          category: 'source-shape',
          message: 'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
          action: 'Treat the affected dynamic-fee record, history, or current accumulator as partial until THORNode returns consistent fields.',
        },
      ],
    };
    const html = renderToStaticMarkup(<DynamicFeesView result={{ ...liveResult, data: pendingStatus }} status={pendingStatus} />);

    expect(html).toContain('Current accumulators without sealed records');
    expect(html).toContain('2 current accumulators');
    expect(html).toContain('1 / 2');
    expect(html).toContain('1 current row lack a matching /dynamic_l1_fees record.');
    expect(html).toContain('headline numbers remain partial');
    expect(html).toContain('symbiosis');
    expect(html).toContain('BTC.BTC|THOR.RUNE');
    expect(html).toContain('13.76758445 TOR');
    expect(html).toContain('45,935.46591197 TOR');
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
    expect(html).toContain('Sources unavailable');
    expect(html).toContain('Coverage unavailable');
    expect(html).toContain('Live proof unavailable');
    expect(html).toMatch(/Controller[\s\S]*Unavailable/);
    expect(html).toMatch(/Whitelisted[\s\S]*Unavailable/);
    expect(html).toMatch(/Current epoch[\s\S]*Unavailable/);
    expect(html).toContain('No sealed samples');
    expect(html).not.toContain('Sources clean');
    expect(html).not.toMatch(/Sources loading|Coverage loading|Live proof loading/);
    expect(html).toContain('How the Experiment Works');
    expect(html).toContain('No sealed dynamic-fee records are available');
    expect(html.indexOf('THORNode dynamic fee sources did not provide a usable snapshot')).toBeLessThan(html.indexOf('Look Here First'));
  });

  it('reserves loading labels for an in-flight snapshot', () => {
    const html = renderToStaticMarkup(<DynamicFeesView isLoading />);

    expect(html).toContain('Sources loading');
    expect(html).toContain('Coverage loading');
    expect(html).toContain('Live proof loading');
    expect(html).toMatch(/Controller[\s\S]*Loading/);
    expect(html).toMatch(/Whitelisted[\s\S]*Loading/);
    expect(html).toMatch(/Current epoch[\s\S]*Loading/);
    expect(html).not.toContain('Sources unavailable');
  });
});
