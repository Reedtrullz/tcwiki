import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-production-readiness-host.sh');
const roots: string[] = [];

type Response = {
  body?: string;
  status?: number;
  exitCode?: number;
  stderr?: string;
};

function root() {
  const path = mkdtempSync(join(tmpdir(), 'tcwiki-host-readiness-'));
  roots.push(path);
  return path;
}

function executable(path: string, source: string) {
  writeFileSync(path, source);
  chmodSync(path, 0o755);
}

function readiness(ready: boolean) {
  return JSON.stringify({
    status: ready ? 'ready' : 'degraded',
    ready,
    checkedAt: '2026-07-13T12:00:00.000Z',
    version: 'a65c870925585bfa755c16777b7ff05528d278a8',
    commit: 'a65c870925585bfa755c16777b7ff05528d278a8',
    image: 'ghcr.io/reedtrullz/tcwiki@sha256:df0b1daed24b5e28bbf9cc24260d68ca2d867264046747d427dd928796357547',
    reasons: ready ? [] : ['THORNode is stale.'],
    sources: {
      midgard: { status: 'ok' },
      thornode: {
        status: ready ? 'ok' : 'degraded',
        source: {
          label: 'Liquify',
          url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
        },
        thorchainHeight: 26990000,
        thorchainBlockTime: '2026-07-13T11:58:00.000Z',
        thorchainBlockAgeSeconds: ready ? 5 : 120,
        heightLagBlocks: ready ? 0 : 20,
        sourceWarningDetails: ready ? [] : [{ category: 'freshness' }],
      },
    },
  });
}

function run(path: string, responses: Response[], extra: Partial<NodeJS.ProcessEnv> = {}) {
  const bin = join(path, 'bin');
  const fixtures = join(path, 'fixtures');
  mkdirSync(bin, { recursive: true });
  mkdirSync(fixtures, { recursive: true });
  executable(join(bin, 'curl'), `#!/bin/sh
set -eu
output=''
while [ "$#" -gt 0 ]; do
  case "$1" in
    --output) output="$2"; shift 2 ;;
    --write-out) shift 2 ;;
    *) shift ;;
  esac
done
counter="$FAKE_CURL_DIR/counter"
index=1
if [ -f "$counter" ]; then index=$(( $(cat "$counter") + 1 )); fi
printf '%s' "$index" > "$counter"
cp "$FAKE_CURL_DIR/$index.body" "$output"
if [ -f "$FAKE_CURL_DIR/$index.stderr" ]; then cat "$FAKE_CURL_DIR/$index.stderr" >&2; fi
code=$(cat "$FAKE_CURL_DIR/$index.exit" 2>/dev/null || printf '0')
if [ "$code" -ne 0 ]; then exit "$code"; fi
cat "$FAKE_CURL_DIR/$index.status"
  `);
  executable(join(bin, 'sleep'), '#!/bin/sh\nexit 0\n');
  executable(join(bin, 'flock'), '#!/bin/sh\nexit 0\n');
  rmSync(join(fixtures, 'counter'), { force: true });
  responses.forEach((response, offset) => {
    const index = offset + 1;
    writeFileSync(join(fixtures, `${index}.body`), response.body ?? '');
    writeFileSync(join(fixtures, `${index}.status`), String(response.status ?? 200));
    writeFileSync(join(fixtures, `${index}.exit`), String(response.exitCode ?? 0));
    if (response.stderr) {
      writeFileSync(join(fixtures, `${index}.stderr`), response.stderr);
    } else {
      rmSync(join(fixtures, `${index}.stderr`), { force: true });
    }
  });
  return spawnSync('sh', [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      FAKE_CURL_DIR: fixtures,
      TCWIKI_READINESS_CURL_BIN: join(bin, 'curl'),
      TCWIKI_READINESS_SLEEP_BIN: join(bin, 'sleep'),
      TCWIKI_READINESS_FLOCK_BIN: join(bin, 'flock'),
      TCWIKI_READINESS_STATE_DIR: join(path, 'state'),
      TCWIKI_READINESS_RUNTIME_DIR: join(path, 'run'),
      ...extra,
    },
  });
}

function evidence(path: string) {
  return JSON.parse(readFileSync(join(path, 'state/latest.json'), 'utf8')) as {
    kind: string;
    status: string;
    failureReason: string;
    summary: string;
    counts: { total: number; ready: number; degraded: number; errors: number };
    samples: Array<{ error?: string }>;
  };
}

describe('host readiness monitor', () => {
  afterEach(() => {
    roots.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true }));
  });

  it('has valid syntax and bounded defaults', () => {
    expect(spawnSync('sh', ['-n', scriptPath]).status).toBe(0);
    const source = readFileSync(scriptPath, 'utf8');
    for (const text of [
      'SAMPLE_COUNT=3',
      'INTERVAL_SECONDS=60',
      '--max-time 10',
      '--max-filesize 1048576',
    ]) {
      expect(source).toContain(text);
    }
  });

  it('passes all-ready and mixed windows', () => {
    const first = root();
    expect(run(first, [1, 2, 3].map(() => ({ body: readiness(true), status: 200 }))).status).toBe(0);
    expect(evidence(first).counts).toEqual({ total: 3, ready: 3, degraded: 0, errors: 0 });

    const second = root();
    expect(run(second, [
      { body: readiness(false), status: 503 },
      { body: readiness(true), status: 200 },
      { exitCode: 28, stderr: 'operation timed out' },
    ]).status).toBe(0);
    expect(evidence(second).counts).toEqual({ total: 3, ready: 1, degraded: 1, errors: 1 });
  });

  it('fails a fully degraded window without treating 503 as transport failure', () => {
    const path = root();
    expect(run(path, [1, 2, 3].map(() => ({ body: readiness(false), status: 503 }))).status).toBe(1);
    expect(evidence(path)).toMatchObject({
      status: 'fail',
      failureReason: 'persistent-degraded-readiness',
      counts: { total: 3, ready: 0, degraded: 3, errors: 0 },
    });
  });

  it('reports mixed failed windows without claiming every sample was degraded', () => {
    const path = root();
    expect(run(path, [
      { body: readiness(false), status: 503 },
      { exitCode: 28, stderr: 'operation timed out' },
      { exitCode: 63, stderr: 'Maximum file size exceeded' },
    ]).status).toBe(1);
    expect(evidence(path)).toMatchObject({
      status: 'fail',
      failureReason: 'persistent-degraded-readiness',
      summary: 'Production readiness had no ready samples; 1 degraded and 2 errored.',
      counts: { total: 3, ready: 0, degraded: 1, errors: 2 },
    });
  });

  it('fails malformed, oversized, and contract-mismatched samples closed', () => {
    const path = root();
    expect(run(path, [
      { body: '{not-json', status: 200 },
      { exitCode: 63, stderr: 'Maximum file size exceeded' },
      { body: readiness(true), status: 503 },
    ]).status).toBe(1);
    const failed = evidence(path);
    expect(failed).toMatchObject({
      failureReason: 'no-valid-readiness-samples',
      counts: { total: 3, ready: 0, degraded: 0, errors: 3 },
    });
    expect(failed.samples.every((sample) => !sample.error || sample.error.length <= 500)).toBe(true);

    const disagreementPath = root();
    const disagreement = JSON.parse(readiness(true)) as { status: string };
    disagreement.status = 'degraded';
    expect(run(disagreementPath, [
      { body: JSON.stringify(disagreement), status: 200 },
      { exitCode: 28, stderr: 'timeout' },
      { exitCode: 28, stderr: 'timeout' },
    ]).status).toBe(1);
    expect(evidence(disagreementPath).counts.errors).toBe(3);
  });

  it('logs initial, steady, degraded, and recovered transitions', () => {
    const path = root();
    const ready = [1, 2, 3].map(() => ({ body: readiness(true), status: 200 }));
    const bad = [1, 2, 3].map(() => ({ body: readiness(false), status: 503 }));
    expect(run(path, ready).stdout).toContain('transition=initial status=pass');
    expect(run(path, ready).stdout).toContain('transition=steady status=pass');
    expect(run(path, bad).stdout).toContain('transition=degraded status=fail');
    expect(run(path, ready).stdout).toContain('transition=recovered status=pass');
  });

  it('preserves old evidence when atomic publication fails', () => {
    const path = root();
    mkdirSync(join(path, 'state'), { recursive: true });
    writeFileSync(join(path, 'state/latest.json'), '{"sentinel":true}\n');
    executable(join(path, 'bad-mv'), '#!/bin/sh\nexit 70\n');
    expect(run(
      path,
      [1, 2, 3].map(() => ({ body: readiness(true), status: 200 })),
      { TCWIKI_READINESS_MV_BIN: join(path, 'bad-mv') },
    ).status).toBe(70);
    expect(readFileSync(join(path, 'state/latest.json'), 'utf8')).toBe('{"sentinel":true}\n');
    expect(readdirSync(join(path, 'state')).filter((name) => /^\.(?:run|latest|state)\./.test(name))).toEqual([]);
  });

  it('reclaims stale monitor scratch without replacing prior evidence early', () => {
    const path = root();
    mkdirSync(join(path, 'state'), { recursive: true });
    mkdirSync(join(path, 'run/.run.stale'), { recursive: true });
    writeFileSync(join(path, 'state/latest.json'), '{"sentinel":true}\n');
    writeFileSync(join(path, 'state/.latest.stale.json'), 'stale\n');
    writeFileSync(join(path, 'state/.state.stale.json'), 'stale\n');
    writeFileSync(join(path, 'run/.run.stale/response.json'), 'stale\n');

    expect(run(path, [1, 2, 3].map(() => ({ body: readiness(true), status: 200 }))).status).toBe(0);
    expect(readdirSync(join(path, 'state')).filter((name) => /^\.(?:latest|state)\./.test(name))).toEqual([]);
    expect(readdirSync(join(path, 'run')).filter((name) => /^\.run\./.test(name))).toEqual([]);
    expect(evidence(path).status).toBe('pass');
  });

  it('skips overlap without replacing evidence', () => {
    const path = root();
    executable(join(path, 'locked'), '#!/bin/sh\nexit 1\n');
    const result = run(
      path,
      [1, 2, 3].map(() => ({ body: readiness(true), status: 200 })),
      { TCWIKI_READINESS_FLOCK_BIN: join(path, 'locked') },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('transition=overlap status=skipped');
    expect(() => readFileSync(join(path, 'state/latest.json'))).toThrow();
  });
});
