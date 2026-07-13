import { describe, expect, it } from 'vitest';

const { buildReadinessMonitorEvidence, summarizeReadinessResponse } = await import('../../scripts/lib/readiness-monitor.mjs') as {
  summarizeReadinessResponse: (input: { observedAt: string; httpStatus: number; json: Record<string, unknown> }) => Record<string, unknown>;
  buildReadinessMonitorEvidence: (input: {
    baseUrl: string;
    startedAt: string;
    completedAt: string;
    samples: Array<Record<string, unknown>>;
  }) => {
    status: string;
    failureReason: string;
    counts: { total: number; ready: number; degraded: number; errors: number };
  };
};

function readiness(ready: boolean) {
  return summarizeReadinessResponse({
    observedAt: '2026-07-13T00:00:00.000Z',
    httpStatus: ready ? 200 : 503,
    json: {
      status: ready ? 'ready' : 'degraded',
      ready,
      checkedAt: '2026-07-13T00:00:00.000Z',
      version: 'abc1234',
      commit: 'abc1234',
      image: 'ghcr.io/example/tcwiki@sha256:abc',
      reasons: ready ? [] : ['THORNode is stale.'],
      sources: {
        thornode: {
          status: 'ok',
          source: { label: 'Provider', url: 'https://provider.example/thorchain' },
          thorchainHeight: 100,
          thorchainBlockAgeSeconds: ready ? 5 : 120,
          heightLagBlocks: ready ? 0 : 20,
          sourceWarningDetails: ready ? [] : [{ category: 'freshness' }],
        },
      },
    },
  });
}

function evidence(samples: Array<Record<string, unknown>>) {
  return buildReadinessMonitorEvidence({
    baseUrl: 'https://wiki.example',
    startedAt: '2026-07-13T00:00:00.000Z',
    completedAt: '2026-07-13T00:02:00.000Z',
    samples,
  });
}

describe('production readiness monitor evidence', () => {
  it('passes when the sampling window contains a ready observation', () => {
    const result = evidence([
      { observedAt: 'one', readiness: readiness(false), directProviders: [] },
      { observedAt: 'two', readiness: readiness(true), directProviders: [] },
      { observedAt: 'three', error: 'timeout', directProviders: [] },
    ]);

    expect(result.status).toBe('pass');
    expect(result.failureReason).toBe('none');
    expect(result.counts).toEqual({ total: 3, ready: 1, degraded: 1, errors: 1 });
  });

  it('fails when the full window has no ready observation', () => {
    const result = evidence([
      { observedAt: 'one', readiness: readiness(false), directProviders: [] },
      { observedAt: 'two', error: 'timeout', directProviders: [] },
      { observedAt: 'three', readiness: readiness(false), directProviders: [] },
    ]);

    expect(result.status).toBe('fail');
    expect(result.failureReason).toBe('persistent-degraded-readiness');
    expect(result.counts).toEqual({ total: 3, ready: 0, degraded: 2, errors: 1 });
  });
});
