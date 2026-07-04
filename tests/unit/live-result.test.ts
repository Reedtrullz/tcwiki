import { describe, expect, it } from 'vitest';
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
