import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { controlApplicabilityResponse, readyResponse } from '../helpers/readiness-contract-fixture';

const commit = 'a'.repeat(40);
function identity(image: string, sha = commit) {
  return { version: sha, commit: sha, image, runtime: { version: sha, commit: sha, image, strict: true, verified: true, warnings: [] } };
}

type Options = {
  lane?: 'next' | 'cloudflare';
  convergesAt?: Record<string, number>;
  stalledPath?: string;
  missingStrict?: boolean;
  wrongArtifact?: boolean;
  badCsp?: boolean;
  requireReady?: boolean;
  degraded?: boolean;
  responseMs?: number;
};
function probe(options: Options = {}) {
  const lane = options.lane ?? 'cloudflare';
  const image = `${lane === 'next' ? 'ghcr.io/reedtrullz/tcwiki' : 'cloudflare-worker'}@sha256:${'b'.repeat(64)}`;
  const expected = identity(image);
  const fixture = {
    ...options, expected, previous: identity(image, 'c'.repeat(40)),
    enforcedCsp: lane === 'cloudflare',
    ready: options.degraded ? controlApplicabilityResponse(false) : readyResponse(),
  };
  const result = spawnSync(process.execPath, ['--import', './tests/helpers/runtime-probe-fixture.mjs', 'scripts/check-runtime-url.mjs'], {
    encoding: 'utf8', timeout: 10000,
    env: { ...process.env, CHECK_BASE_URL: 'https://fixture.invalid', EXPECTED_VERSION: commit,
      EXPECTED_COMMIT_SHA: commit, EXPECTED_IMAGE_REF: image, REQUIRE_RUNTIME_METADATA: '1',
      REQUIRE_READY: options.requireReady ? '1' : '0', CSP_ENFORCE: lane === 'cloudflare' ? '1' : '0',
      RUNTIME_PROBE_BUDGET_MS: '90000', RUNTIME_PROBE_FIXTURE: JSON.stringify(fixture) },
  });
  expect(result.error).toBeUndefined();
  const summary = JSON.parse(result.stderr.match(/RUNTIME_FIXTURE_SUMMARY (.+)/)?.[1] ?? '{}') as {
    elapsedMs: number; cancelled: number; requests: { path: string; elapsedMs: number; timeoutMs: number }[];
  };
  return { ...result, summary };
}

describe('full release verifier rollout contract', () => {
  it.each(['next', 'cloudflare'] as const)('accepts %s identity converging after 40 seconds and checks every release endpoint', (lane) => {
    const result = probe({ lane, convergesAt: { '/api/health': 40000 } });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Runtime probe passed');
    expect(result.summary.elapsedMs).toBeGreaterThanOrEqual(40000);
    expect(result.summary.elapsedMs).toBeLessThan(90000);
    expect([...new Set(result.summary.requests.map((r) => r.path))]).toEqual(['/api/health', '/api/version', '/api/ready', '/', '/api/csp-report']);
  });

  it('rejects a permanent wrong identity at the shared deadline', () => {
    const result = probe({ convergesAt: { '/api/health': 100000 } });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('overall deadline exceeded');
    expect(result.summary.elapsedMs).toBe(90000);
    expect(result.summary.requests.every((r) => r.elapsedMs < 90000)).toBe(true);
  });

  it('does not restart the deadline when the version endpoint remains stale after health converges', () => {
    const result = probe({ convergesAt: { '/api/health': 40000, '/api/version': 100000 } });
    expect(result.status).not.toBe(0);
    expect(result.summary.elapsedMs).toBe(90000);
    expect(result.summary.requests.some((r) => r.path === '/api/ready')).toBe(false);
  });

  it('rejects missing strict runtime metadata', () => {
    const result = probe({ missingStrict: true });
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain('Runtime probe passed');
  });

  it('rejects a different immutable artifact even when the full commit matches', () => {
    const result = probe({ wrongArtifact: true });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Expected image');
    expect(result.stdout).not.toContain('Runtime probe passed');
  });

  it('accepts late version and readiness identity within the same shared budget', () => {
    const result = probe({ convergesAt: { '/api/version': 40000, '/api/ready': 85000 } });
    expect(result.status).toBe(0);
    expect(result.summary.elapsedMs).toBeGreaterThanOrEqual(85000);
    expect(result.summary.elapsedMs).toBeLessThan(90000);
  });

  it('cancels each stalled request within five seconds and stops at the shared deadline', () => {
    const result = probe({ stalledPath: '/api/health' });
    expect(result.status).not.toBe(0);
    expect(result.summary.elapsedMs).toBe(90000);
    expect(result.summary.cancelled).toBe(result.summary.requests.length);
    expect(result.summary.requests.every((r) => r.timeoutMs <= 5000 && r.timeoutMs <= 90000-r.elapsedMs)).toBe(true);
  });

  it('rejects a response that only completes at the deadline', () => {
    const result = probe({ convergesAt: { '/api/health': 90000 }, responseMs: 5000 });
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain('Runtime probe passed');
    expect(result.summary.elapsedMs).toBe(90000);
  });

  it.each(['next', 'cloudflare'] as const)('rejects bad %s CSP after correct runtime identity', (lane) => {
    const result = probe({ lane, badCsp: true });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('report-uri');
    expect(result.summary.requests.some((r) => r.path === '/api/csp-report')).toBe(false);
  });

  it('keeps degraded source/applicability warnings visible in the independent non-ready probe', () => {
    const result = probe({ degraded: true });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('Readiness degraded but non-blocking');
    expect(result.stderr).toContain('Operational-control semantics have not been reviewed');
  });

  it('does not admit degraded source readiness when strict readiness is required', () => {
    const result = probe({ degraded: true, requireReady: true });
    expect(result.status).not.toBe(0);
    expect(result.stdout).not.toContain('Runtime probe passed');
  });

  it('emits bounded per-attempt timing, status and sanitized identity diagnostics', () => {
    const result = probe({ convergesAt: { '/api/health': 1000 } });
    const lines = result.stdout.split('\n').filter((line) => line.startsWith('Runtime probe attempt '));
    expect(result.status).toBe(0);
    expect(lines.length).toBeGreaterThan(5);
    for (const line of lines) {
      expect(line.length).toBeLessThan(400);
      const record = JSON.parse(line.slice('Runtime probe attempt '.length));
      expect(record.elapsedMs).toBeGreaterThanOrEqual(0);
      expect(record.status).toBeGreaterThanOrEqual(200);
      expect(record).not.toHaveProperty('body');
    }
    expect(lines.join('\n')).toContain('"commit":"'+ 'c'.repeat(40)+'"');
    expect(lines.join('\n')).toContain('"commit":"'+commit+'"');
  });
});
