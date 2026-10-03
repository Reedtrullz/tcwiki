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

describe('incident evidence boundaries', () => {
  it('counts repeated source receipts as one independent observation', () => {
    const receipt = readiness(false);
    const result = evidence([{ observedAt: 'one', readiness: receipt }, { observedAt: 'two', readiness: { ...receipt, observedAt: 'two' } }]);
    expect(result).toMatchObject({ observations: { independent: 1, repeated: 1 } });
  });
  it('separates unreachable origin from healthy origin with degraded sources', () => {
    const origin = evidence([{ observedAt: 'one', error: 'connection refused', origin: { healthy: false, reachable: false, error: 'connection refused' } }]);
    const upstream = evidence([{ observedAt: 'one', readiness: readiness(false), origin: { healthy: true, reachable: true, commit: 'abc1234', image: 'ghcr.io/example/tcwiki@sha256:abc' } }]);
    expect(origin).toMatchObject({ incident: { kind: 'origin-liveness' } });
    expect(upstream).toMatchObject({ incident: { kind: 'source-readiness', families: ['THORNode'] } });
  });
  it('identifies a dynamic-fee-only failure without blaming network operation evidence', () => {
    const response = summarizeReadinessResponse({ observedAt: 'one', httpStatus: 503, json: { ready: false, status: 'degraded', checkedAt: 'one', sources: { thornode: { status: 'ok', sourceWarningDetails: [], dynamicFees: { status: 'degraded', checkedAt: 'fee-one', sourceWarningDetails: [{ category: 'source-shape', severity: 'warning', message: 'fee record malformed' }] } } } } });
    expect(evidence([{ readiness: response, origin: { healthy: true } }])).toMatchObject({ incident: { kind: 'feature-degradation', features: ['Dynamic fees'], categories: ['source-shape'] } });
  });
  it('keeps incident fingerprint stable when only sample time or block age changes', () => {
    const first = readiness(false);
    const later = { ...first, checkedAt: 'later', thornode: { ...(first.thornode as object), blockAgeSeconds: 140 } };
    const a = evidence([{ readiness: first, origin: { healthy: true } }]);
    const b = evidence([{ readiness: later, origin: { healthy: true } }]);
    expect(a).toHaveProperty('incident.fingerprint');
    expect((a as unknown as { incident: { fingerprint: string } }).incident.fingerprint).toBe((b as unknown as { incident: { fingerprint: string } }).incident.fingerprint);
  });
});

it('bounds independent monitor body reads even after headers have arrived', async () => {
  const { fetchMonitorJson } = await import('../../scripts/lib/readiness-monitor.mjs');
  let cancelled = false;
  const stalled = new Response(new ReadableStream({ cancel() { cancelled = true; } }));
  await expect(fetchMonitorJson('https://monitor.test', { timeoutMs: 20, fetchImpl: async () => stalled })).rejects.toThrow(/deadline/);
  expect(cancelled).toBe(true);
});

it('rejects oversized independent monitor bodies', async () => {
  const { fetchMonitorJson } = await import('../../scripts/lib/readiness-monitor.mjs');
  await expect(fetchMonitorJson('https://monitor.test', { fetchImpl: async () => new Response(' '.repeat(1048577)) })).rejects.toThrow(/1MiB/);
});

it('updates one incident without losing its first observation and records recovery', async () => {
  const { buildReadinessIncidentUpdate } = await import('../../scripts/lib/readiness-monitor.mjs');
  const failed = evidence([{ readiness: readiness(false), origin: { healthy: true } }]);
  const first = buildReadinessIncidentUpdate(failed, '', 'https://github.test/evidence/first');
  expect(first.action).toBe('create');
  const repeated = buildReadinessIncidentUpdate(failed, first.body, 'https://github.test/evidence/latest');
  expect(repeated.action).toBe('update');
  expect(repeated.body).toContain('Initial evidence: https://github.test/evidence/first');
  expect(repeated.historyComment).toBeUndefined();
  const origin = evidence([{ error: 'timeout', origin: { healthy: false } }]);
  const changed = buildReadinessIncidentUpdate(origin, repeated.body, 'https://github.test/evidence/origin');
  expect(changed.historyComment).toContain(repeated.body);
  const recovered = buildReadinessIncidentUpdate(evidence([{ readiness: readiness(true), origin: { healthy: true } }]), changed.body, 'https://github.test/evidence/recovered');
  expect(recovered.action).toBe('recover');
  expect(recovered.recoveryComment).toContain('not continuous uptime');
});
