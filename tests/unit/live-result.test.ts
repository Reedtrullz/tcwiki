import { describe, expect, it } from 'vitest';
import { collectSourceWarningSignals } from '@/lib/source-warnings';
import { liveResultHasSourceWarnings, liveResultIsDegraded } from '@/lib/live-result';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';

function liveOk<T>(data: T): LiveDataResult<T> {
  return {
    status: 'ok',
    checkedAt: '2026-07-04T00:00:00.000Z',
    data,
  };
}

describe('live result trust helpers', () => {
  it('keeps ok payloads without source warnings clean', () => {
    const result = liveOk({ totalPooledRune: '1' });

    expect(liveResultHasSourceWarnings(result)).toBe(false);
    expect(liveResultIsDegraded(result)).toBe(false);
  });

  it('treats warning-bearing ok payloads as degraded for UI labels', () => {
    const result = liveOk({
      state: 'degraded',
      sourceWarnings: ['Unknown operation-like Mimir keys need review.'],
    } satisfies Pick<NetworkStatus, 'state' | 'sourceWarnings'>);

    expect(liveResultHasSourceWarnings(result)).toBe(true);
    expect(liveResultIsDegraded(result)).toBe(true);
  });

  it('treats structured source warning details as degraded even without legacy warning strings', () => {
    const result = liveOk({
      sourceWarningDetails: [
        {
          severity: 'review',
          category: 'unknown-operation',
          message: 'Unknown operation-like Mimir keys need review.',
          action: 'Review the operation-like key family before interpreting it as non-pausing.',
        },
      ],
    });

    expect(liveResultHasSourceWarnings(result)).toBe(true);
    expect(liveResultIsDegraded(result)).toBe(true);
  });

  it('detects source warnings inside array payloads', () => {
    const result = liveOk([
      { asset: 'BTC.BTC', sourceWarnings: [] },
      { asset: 'ETH.ETH', sourceWarnings: ['ETH pool source was partial.'] },
    ]);

    expect(liveResultHasSourceWarnings(result)).toBe(true);
    expect(liveResultIsDegraded(result)).toBe(true);
  });

  it('detects source warnings inside nested object and array wrappers', () => {
    const result = liveOk({
      schemaVersion: 1,
      network: { snapshot: [{ nested: { sourceWarnings: ['Nested source warning.'] } }] },
      selectedPool: { warnings: [], sourceWarningDetails: [] },
    });

    expect(liveResultHasSourceWarnings(result)).toBe(true);
    expect(liveResultIsDegraded(result)).toBe(true);
  });

  it('handles cyclic object graphs while finding nested warnings', () => {
    const wrapper: Record<string, unknown> = {};
    wrapper.self = wrapper;
    wrapper.nested = [{ sourceWarnings: ['Warning behind a cycle.'] }];
    const result = liveOk(wrapper);

    expect(liveResultHasSourceWarnings(result)).toBe(true);
    expect(liveResultIsDegraded(result)).toBe(true);
  });

  it('keeps transport-degraded results degraded even without data warnings', () => {
    const result: LiveDataResult<{ value: string }> = {
      status: 'degraded',
      checkedAt: '2026-07-04T00:00:00.000Z',
      error: 'Source did not respond.',
    };

    expect(liveResultHasSourceWarnings(result)).toBe(false);
    expect(liveResultIsDegraded(result)).toBe(true);
  });
});

it('keeps malformed warning contracts fail closed instead of silently labeling them clean', () => {
  for (const data of [
    { sourceWarnings: [{ unexpected: true }] },
    { sourceWarningDetails: [{ severity: 'warning', message: 'Incomplete detail' }] },
    { sourceWarningDetails: [{ severity: 'warning', category: 'source-shape', message: 'Invalid keys', action: 'Review', keys: 'BTC' }] },
  ]) {
    expect(liveResultHasSourceWarnings(liveOk(data))).toBe(true);
    expect(liveResultIsDegraded(liveOk(data))).toBe(true);
  }
});

it('preserves distinct action and key provenance when compact warning messages match', () => {
  const first = { severity: 'warning' as const, category: 'source-shape' as const, message: 'Partial source', action: 'Review BTC', keys: ['BTC'], scopes: ['BTC'] };
  const second = { ...first, action: 'Review ETH', keys: ['ETH'], scopes: ['ETH'] };
  const signals = collectSourceWarningSignals({ nested: [{ sourceWarningDetails: [first, second, first] }] });
  expect(signals.details).toEqual([first, second]);
});
