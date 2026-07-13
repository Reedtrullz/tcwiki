# Credential-Free VPS Readiness Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent, credential-free VPS systemd timer that samples public strict readiness three times, publishes bounded local evidence, and records degraded/recovered transitions without changing application availability.

**Architecture:** A repository-owned POSIX shell monitor uses only `curl`, `jq`, `flock`, and standard host tools. Ansible installs it before container mutation and enables a hardened twice-hourly systemd timer. GitHub Actions remains the full-contract, direct-provider, and remote-notification lane.

**Tech Stack:** POSIX shell, curl 8.x, jq 1.7, util-linux flock 2.39, systemd 255, Ansible 10.7, TypeScript 6, Vitest 4, Node.js 22.

## Global Constraints

- Keep `/api/ready?contract=strict` and its intentional `200 ready` / `503 degraded` behavior unchanged.
- Take exactly three samples, 60 seconds apart; pass with at least one valid ready sample and fail with no ready sample.
- Probe `https://wiki.thorchain.no`, not the local container URL.
- Do not install host Node.js, grant Docker access, or provision credentials, paging, email, webhooks, or another remote alerting service.
- Retain only `latest.json`, `state.json`, and bounded host journald history.
- Run as non-login account `tcwiki-readiness` with systemd-managed state/runtime directories.
- Use `TimeoutStartSec=4min`, `OnCalendar=*-*-* *:08,38:00`, `RandomizedDelaySec=2min`, and `Persistent=true` exactly.
- Install prerequisites and assets before pulling, stopping, or replacing application containers.
- A failed window exits nonzero without disabling the timer or changing application availability.
- Keep GitHub responsible for full JavaScript contract validation, direct-provider probes, and issue lifecycle.
- Use Node.js 22 for repository checks; stop long loops below 30 GiB free on `/System/Volumes/Data`.

## File Map

- Create `scripts/check-production-readiness-host.sh`: lock, sample, validate, aggregate, atomically publish, log, and exit.
- Create `tests/unit/host-readiness-monitor.test.ts`: deterministic process tests with fake commands.
- Create `deploy/systemd/tcwiki-readiness-monitor.service`: hardened one-shot unit.
- Create `deploy/systemd/tcwiki-readiness-monitor.timer`: twice-hourly independent schedule.
- Modify `ansible-playbook.yml`: pre-container dependency/account/asset/timer installation.
- Modify `tests/unit/deploy-config.test.ts`: ordering, hardening, cadence, path, docs, and credential exclusions.
- Modify `scripts/lib/release-tracked.mjs` and `tests/unit/release-tracked.test.ts`: track shell/systemd deploy assets.
- Modify `docs/operations.md` and `docs/maintenance.md`: operations, evidence, manual execution, and removal.

---

### Task 1: Implement the bounded host monitor

**Files:**
- Create: `tests/unit/host-readiness-monitor.test.ts`
- Create: `scripts/check-production-readiness-host.sh`

**Interfaces:**
- Consumes: `GET https://wiki.thorchain.no/api/ready?contract=strict`; `TCWIKI_READINESS_{CURL,JQ,SLEEP,FLOCK,MV}_BIN`; `TCWIKI_READINESS_{STATE,RUNTIME}_DIR`.
- Produces: `latest.json` kind `tcwiki-host-readiness-monitor`; `state.json` shape `{status, since}`; transition marker on stdout; exit `0` for pass/overlap and `1` for failed window.

- [ ] **Step 1: Write the failing process test harness**

Create `tests/unit/host-readiness-monitor.test.ts` with these complete helpers and cases:

```typescript
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const scriptPath = join(process.cwd(), 'scripts/check-production-readiness-host.sh');
const roots: string[] = [];
type Response = { body?: string; status?: number; exitCode?: number; stderr?: string };

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
    status: ready ? 'ready' : 'degraded', ready,
    checkedAt: '2026-07-13T12:00:00.000Z',
    version: 'a65c870925585bfa755c16777b7ff05528d278a8',
    commit: 'a65c870925585bfa755c16777b7ff05528d278a8',
    image: 'ghcr.io/reedtrullz/tcwiki@sha256:df0b1daed24b5e28bbf9cc24260d68ca2d867264046747d427dd928796357547',
    reasons: ready ? [] : ['THORNode is stale.'],
    sources: {
      midgard: { status: 'ok' },
      thornode: {
        status: ready ? 'ok' : 'degraded',
        source: { label: 'Liquify', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain' },
        thorchainHeight: 26990000,
        thorchainBlockTime: '2026-07-13T11:58:00.000Z',
        thorchainBlockAgeSeconds: ready ? 5 : 120,
        heightLagBlocks: ready ? 0 : 20,
        sourceWarningDetails: ready ? [] : [{ category: 'freshness' }],
      },
    },
  });
}

function run(path: string, responses: Response[], extra: NodeJS.ProcessEnv = {}) {
  const bin = join(path, 'bin');
  const fixtures = join(path, 'fixtures');
  mkdirSync(bin, { recursive: true });
  mkdirSync(fixtures, { recursive: true });
  executable(join(bin, 'curl'), `#!/bin/sh
set -eu
output=''
while [ "$#" -gt 0 ]; do
  case "$1" in --output) output="$2"; shift 2;; --write-out) shift 2;; *) shift;; esac
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
  rmSync(join(fixtures, 'counter'), { force: true });
  responses.forEach((response, offset) => {
    const index = offset + 1;
    writeFileSync(join(fixtures, `${index}.body`), response.body ?? '');
    writeFileSync(join(fixtures, `${index}.status`), String(response.status ?? 200));
    writeFileSync(join(fixtures, `${index}.exit`), String(response.exitCode ?? 0));
    if (response.stderr) writeFileSync(join(fixtures, `${index}.stderr`), response.stderr);
  });
  return spawnSync('sh', [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      FAKE_CURL_DIR: fixtures,
      TCWIKI_READINESS_CURL_BIN: join(bin, 'curl'),
      TCWIKI_READINESS_SLEEP_BIN: join(bin, 'sleep'),
      TCWIKI_READINESS_STATE_DIR: join(path, 'state'),
      TCWIKI_READINESS_RUNTIME_DIR: join(path, 'run'),
      ...extra,
    },
  });
}

function evidence(path: string) {
  return JSON.parse(readFileSync(join(path, 'state/latest.json'), 'utf8')) as {
    kind: string; status: string; failureReason: string;
    counts: { total: number; ready: number; degraded: number; errors: number };
    samples: Array<{ error?: string }>;
  };
}

describe('host readiness monitor', () => {
  afterEach(() => roots.splice(0).forEach((path) => rmSync(path, { recursive: true, force: true })));

  it('has valid syntax and bounded defaults', () => {
    expect(spawnSync('sh', ['-n', scriptPath]).status).toBe(0);
    const source = readFileSync(scriptPath, 'utf8');
    for (const text of ['SAMPLE_COUNT=3', 'INTERVAL_SECONDS=60', '--max-time 10', '--max-filesize 1048576']) expect(source).toContain(text);
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
    expect(evidence(path)).toMatchObject({ status: 'fail', failureReason: 'persistent-degraded-readiness', counts: { total: 3, ready: 0, degraded: 3, errors: 0 } });
  });

  it('fails malformed, oversized, and HTTP/body-mismatched samples closed', () => {
    const path = root();
    expect(run(path, [
      { body: '{not-json', status: 200 },
      { exitCode: 63, stderr: 'Maximum file size exceeded' },
      { body: readiness(true), status: 503 },
    ]).status).toBe(1);
    const failed = evidence(path);
    expect(failed).toMatchObject({ failureReason: 'no-valid-readiness-samples', counts: { total: 3, ready: 0, degraded: 0, errors: 3 } });
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
    expect(run(path, [1, 2, 3].map(() => ({ body: readiness(true), status: 200 })), { TCWIKI_READINESS_MV_BIN: join(path, 'bad-mv') }).status).toBe(70);
    expect(readFileSync(join(path, 'state/latest.json'), 'utf8')).toBe('{"sentinel":true}\n');
    expect(readdirSync(join(path, 'state')).filter((name) => /^\.(?:run|latest|state)\./.test(name))).toEqual([]);
  });

  it('skips overlap without replacing evidence', () => {
    const path = root();
    executable(join(path, 'locked'), '#!/bin/sh\nexit 1\n');
    const result = run(path, [1, 2, 3].map(() => ({ body: readiness(true), status: 200 })), { TCWIKI_READINESS_FLOCK_BIN: join(path, 'locked') });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('transition=overlap status=skipped');
    expect(() => readFileSync(join(path, 'state/latest.json'))).toThrow();
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npm run test:unit -- tests/unit/host-readiness-monitor.test.ts
```

Expected: FAIL because the shell file is missing.

- [ ] **Step 3: Implement the monitor**

Create `scripts/check-production-readiness-host.sh`:

```sh
#!/bin/sh
set -eu

BASE_URL=${TCWIKI_READINESS_BASE_URL:-https://wiki.thorchain.no}
STATE_DIR=${TCWIKI_READINESS_STATE_DIR:-/var/lib/tcwiki-readiness-monitor}
RUNTIME_DIR=${TCWIKI_READINESS_RUNTIME_DIR:-/run/tcwiki-readiness-monitor}
CURL_BIN=${TCWIKI_READINESS_CURL_BIN:-curl}
JQ_BIN=${TCWIKI_READINESS_JQ_BIN:-jq}
SLEEP_BIN=${TCWIKI_READINESS_SLEEP_BIN:-sleep}
FLOCK_BIN=${TCWIKI_READINESS_FLOCK_BIN:-flock}
MV_BIN=${TCWIKI_READINESS_MV_BIN:-mv}
SAMPLE_COUNT=3
INTERVAL_SECONDS=60
ENDPOINT=${BASE_URL%/}/api/ready?contract=strict

mkdir -p "$STATE_DIR" "$RUNTIME_DIR"
exec 9>"$RUNTIME_DIR/monitor.lock"
if ! "$FLOCK_BIN" -n 9; then
  printf '%s\n' 'tcwiki-readiness-monitor transition=overlap status=skipped'
  exit 0
fi

run_dir=$(mktemp -d "$STATE_DIR/.run.XXXXXX")
evidence_tmp=''
state_tmp=''
cleanup() {
  rm -rf "$run_dir"
  if [ -n "$evidence_tmp" ]; then rm -f "$evidence_tmp"; fi
  if [ -n "$state_tmp" ]; then rm -f "$state_tmp"; fi
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
now() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }
bounded_file_text() { "$JQ_BIN" -Rrs 'gsub("\\s+"; " ") | if length > 500 then .[0:497] + "..." else . end' "$1"; }
write_error() { "$JQ_BIN" -n --arg observedAt "$1" --arg error "$2" '{observedAt: $observedAt, error: $error}' > "$3"; }

started_at=$(now)
index=1
while [ "$index" -le "$SAMPLE_COUNT" ]; do
  if [ "$index" -gt 1 ]; then "$SLEEP_BIN" "$INTERVAL_SECONDS"; fi
  observed_at=$(now)
  body="$run_dir/response-$index.json"
  error_file="$run_dir/curl-$index.err"
  sample="$run_dir/sample-$index.json"
  if http_status=$("$CURL_BIN" --silent --show-error --max-time 10 --max-filesize 1048576 --output "$body" --write-out '%{http_code}' "$ENDPOINT" 2>"$error_file"); then
    if ! "$JQ_BIN" --arg observedAt "$observed_at" --argjson httpStatus "$http_status" '
      def nonempty: type == "string" and length > 0;
      def bounded: gsub("\\s+"; " ") | if length > 500 then .[0:497] + "..." else . end;
      def valid:
        (.status == "ready" or .status == "degraded") and (.ready | type == "boolean") and
        ((.status == "ready") == .ready) and (.checkedAt | nonempty) and (.version | nonempty) and
        (.commit | nonempty) and (.image | nonempty) and (.reasons | type == "array") and
        ([.reasons[] | select(type != "string")] | length == 0) and (.sources | type == "object") and
        (.sources.midgard | type == "object") and (.sources.thornode | type == "object") and
        (($httpStatus == 200 and .ready) or ($httpStatus == 503 and (.ready | not)));
      if valid then {
        observedAt: $observedAt,
        readiness: {
          observedAt: $observedAt, httpStatus: $httpStatus, checkedAt, status, ready, version, commit, image,
          reasons: [.reasons[] | bounded],
          thornode: {
            status: (.sources.thornode.status // null),
            source: (if (.sources.thornode.source | type) == "object" then {label: (.sources.thornode.source.label // null), url: (.sources.thornode.source.url // null)} else null end),
            height: (.sources.thornode.thorchainHeight // null),
            blockTime: (.sources.thornode.thorchainBlockTime // null),
            blockAgeSeconds: (.sources.thornode.thorchainBlockAgeSeconds // null),
            heightLagBlocks: (.sources.thornode.heightLagBlocks // null),
            warningCategories: ([.sources.thornode.sourceWarningDetails[]?.category | select(type == "string")] | unique)
          }
        }
      } else error("readiness contract mismatch") end
    ' "$body" > "$sample" 2>"$run_dir/validation-$index.err"; then
      write_error "$observed_at" 'readiness contract mismatch' "$sample"
    fi
  else
    write_error "$observed_at" "$(bounded_file_text "$error_file")" "$sample"
  fi
  index=$((index + 1))
done

completed_at=$(now)
evidence_tmp="$STATE_DIR/.latest.$$.json"
state_tmp="$STATE_DIR/.state.$$.json"
"$JQ_BIN" -s --arg generatedAt "$completed_at" --arg startedAt "$started_at" --arg completedAt "$completed_at" --arg baseUrl "${BASE_URL%/}" '
  . as $samples
  | ([$samples[] | select(has("error") | not) | select(.readiness.ready)] | length) as $ready
  | ([$samples[] | select(has("error") | not) | select(.readiness.ready | not)] | length) as $degraded
  | ([$samples[] | select(has("error"))] | length) as $errors
  | ($ready == 0) as $failed
  | ($failed and $degraded > 0) as $persistent
  | {
      schemaVersion: 1, kind: "tcwiki-host-readiness-monitor", generatedAt: $generatedAt,
      startedAt: $startedAt, completedAt: $completedAt, baseUrl: $baseUrl,
      status: (if $failed then "fail" else "pass" end), exitCode: (if $failed then 1 else 0 end),
      failureReason: (if $persistent then "persistent-degraded-readiness" elif $failed then "no-valid-readiness-samples" else "none" end),
      summary: (if $persistent then "Production readiness remained degraded for all 3 samples." elif $failed then "No production readiness sample was usable; \($degraded) degraded and \($errors) errored." else "Production readiness was usable in \($ready) of 3 samples; \($degraded) degraded and \($errors) errored." end),
      counts: {total: 3, ready: $ready, degraded: $degraded, errors: $errors}, samples: $samples
    }
' "$run_dir"/sample-*.json > "$evidence_tmp"

status=$("$JQ_BIN" -r .status "$evidence_tmp")
reason=$("$JQ_BIN" -r .failureReason "$evidence_tmp")
summary=$("$JQ_BIN" -r .summary "$evidence_tmp")
previous=unknown
previous_since=''
if [ -f "$STATE_DIR/state.json" ]; then
  previous=$("$JQ_BIN" -er '.status | select(. == "pass" or . == "fail")' "$STATE_DIR/state.json" 2>/dev/null || printf unknown)
  previous_since=$("$JQ_BIN" -er '.since | select(type == "string" and length > 0)' "$STATE_DIR/state.json" 2>/dev/null || printf '')
fi
if [ "$previous" = unknown ]; then transition=initial
elif [ "$previous" = "$status" ]; then transition=steady
elif [ "$status" = fail ]; then transition=degraded
else transition=recovered
fi
if [ "$previous" = "$status" ] && [ -n "$previous_since" ]; then since=$previous_since; else since=$completed_at; fi
"$JQ_BIN" -n --arg status "$status" --arg since "$since" '{status: $status, since: $since}' > "$state_tmp"
"$MV_BIN" "$evidence_tmp" "$STATE_DIR/latest.json"
"$MV_BIN" "$state_tmp" "$STATE_DIR/state.json"
printf 'tcwiki-readiness-monitor transition=%s status=%s failure_reason=%s summary=%s\n' "$transition" "$status" "$reason" "$summary"
if [ "$status" = fail ]; then exit 1; fi
```

- [ ] **Step 4: Verify GREEN and commit**

```bash
npm run test:unit -- tests/unit/host-readiness-monitor.test.ts
sh -n scripts/check-production-readiness-host.sh
git diff --check
git add scripts/check-production-readiness-host.sh tests/unit/host-readiness-monitor.test.ts
git commit -m "feat: add credential-free host readiness monitor"
```

Expected: 7 focused tests pass, syntax/diff checks exit `0`, and one monitor commit is created.

---

### Task 2: Install and harden the timer before container mutation

**Files:**
- Create: `deploy/systemd/tcwiki-readiness-monitor.service`
- Create: `deploy/systemd/tcwiki-readiness-monitor.timer`
- Modify: `ansible-playbook.yml:12-74`
- Modify: `tests/unit/deploy-config.test.ts:1-27,126-140`
- Modify: `scripts/lib/release-tracked.mjs:4-18`
- Modify: `tests/unit/release-tracked.test.ts:43-59`

**Interfaces:**
- Consumes: Task 1 shell executable and host `/usr/bin/curl`, `/usr/bin/jq`, `/usr/bin/flock`.
- Produces: root-owned `/usr/local/libexec/tcwiki-readiness-monitor`, dedicated account, hardened units, and enabled timer; state/runtime directories are created by systemd when the service runs.

- [ ] **Step 1: Add failing deployment assertions**

Add these constants to `tests/unit/deploy-config.test.ts` after `globalStyles`:

```typescript
const hostReadinessMonitor = readFileSync('scripts/check-production-readiness-host.sh', 'utf8');
const hostReadinessService = readFileSync('deploy/systemd/tcwiki-readiness-monitor.service', 'utf8');
const hostReadinessTimer = readFileSync('deploy/systemd/tcwiki-readiness-monitor.timer', 'utf8');
```

Add this test after `samples persistent production readiness separately from weekly content review reporting`:

```typescript
it('installs a credential-free hardened readiness timer before container mutation', () => {
  const dependencyIndex = playbook.indexOf('name: Verify readiness monitor host dependencies');
  const installIndex = playbook.indexOf('name: Install tcwiki readiness monitor executable');
  const enableIndex = playbook.indexOf('name: Enable tcwiki readiness monitor timer');
  const pullIndex = playbook.indexOf('name: Pull immutable image from GHCR');
  const assets = [hostReadinessMonitor, hostReadinessService, hostReadinessTimer].join('\n');
  expect(dependencyIndex).toBeGreaterThan(-1);
  expect(installIndex).toBeGreaterThan(dependencyIndex);
  expect(enableIndex).toBeGreaterThan(installIndex);
  expect(enableIndex).toBeLessThan(pullIndex);
  expect(playbook.match(/become: true/g)?.length).toBeGreaterThanOrEqual(7);
  for (const text of ['name: tcwiki-readiness', 'system: true', 'shell: /usr/sbin/nologin', 'dest: /usr/local/libexec/tcwiki-readiness-monitor', 'owner: root', 'mode: "0755"']) expect(playbook).toContain(text);
  for (const text of [
    'User=tcwiki-readiness', 'Group=tcwiki-readiness', 'NoNewPrivileges=true', 'PrivateTmp=true',
    'ProtectHome=true', 'ProtectSystem=strict', 'StateDirectory=tcwiki-readiness-monitor',
    'RuntimeDirectory=tcwiki-readiness-monitor', 'CapabilityBoundingSet=', 'LockPersonality=true',
    'MemoryDenyWriteExecute=true', 'ProtectControlGroups=true', 'ProtectKernelModules=true',
    'ProtectKernelTunables=true', 'RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6',
    'RestrictSUIDSGID=true', 'TimeoutStartSec=4min',
  ]) expect(hostReadinessService).toContain(text);
  expect(hostReadinessTimer).toContain('OnCalendar=*-*-* *:08,38:00');
  expect(hostReadinessTimer).toContain('RandomizedDelaySec=2min');
  expect(hostReadinessTimer).toContain('Persistent=true');
  expect(assets).not.toMatch(/GITHUB_TOKEN|github_pat_|docker\.sock|SupplementaryGroups=docker/);
});
```

Extend the first test in `tests/unit/release-tracked.test.ts` with:

```typescript
expect(collectReleaseReferencedFilesFromText(`
  scripts/check-production-readiness-host.sh
  deploy/systemd/tcwiki-readiness-monitor.service
  deploy/systemd/tcwiki-readiness-monitor.timer
`)).toEqual([
  'deploy/systemd/tcwiki-readiness-monitor.service',
  'deploy/systemd/tcwiki-readiness-monitor.timer',
  'scripts/check-production-readiness-host.sh',
]);
```

- [ ] **Step 2: Run RED**

```bash
npm run test:unit -- tests/unit/deploy-config.test.ts tests/unit/release-tracked.test.ts
```

Expected: FAIL because unit assets and Ansible tasks are absent and trackedness does not recognize their extensions.

- [ ] **Step 3: Create the service unit**

Create `deploy/systemd/tcwiki-readiness-monitor.service`:

```ini
[Unit]
Description=Sample THORChain Wiki production readiness independently of GitHub Actions
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=tcwiki-readiness
Group=tcwiki-readiness
Environment=TCWIKI_READINESS_BASE_URL=https://wiki.thorchain.no
ExecStart=/usr/local/libexec/tcwiki-readiness-monitor
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
StateDirectory=tcwiki-readiness-monitor
StateDirectoryMode=0750
RuntimeDirectory=tcwiki-readiness-monitor
RuntimeDirectoryMode=0750
CapabilityBoundingSet=
LockPersonality=true
MemoryDenyWriteExecute=true
ProtectControlGroups=true
ProtectKernelModules=true
ProtectKernelTunables=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
RestrictSUIDSGID=true
TimeoutStartSec=4min
```

- [ ] **Step 4: Create the timer unit**

Create `deploy/systemd/tcwiki-readiness-monitor.timer`:

```ini
[Unit]
Description=Run THORChain Wiki readiness monitoring twice hourly

[Timer]
OnCalendar=*-*-* *:08,38:00
RandomizedDelaySec=2min
Persistent=true
Unit=tcwiki-readiness-monitor.service

[Install]
WantedBy=timers.target
```

- [ ] **Step 5: Install prerequisites and assets in Ansible**

Insert immediately after `Require immutable image ref` and before `Get current container image`:

```yaml
    - name: Inspect readiness monitor host dependencies
      ansible.builtin.stat:
        path: "{{ item }}"
      loop:
        - /usr/bin/curl
        - /usr/bin/jq
        - /usr/bin/flock
      register: readiness_monitor_dependencies
      changed_when: false

    - name: Verify readiness monitor host dependencies
      ansible.builtin.assert:
        that:
          - item.stat.exists
          - item.stat.executable
        fail_msg: "Required readiness monitor executable {{ item.item }} is unavailable."
      loop: "{{ readiness_monitor_dependencies.results }}"
      loop_control:
        label: "{{ item.item }}"

    - name: Create tcwiki readiness monitor group
      become: true
      ansible.builtin.group:
        name: tcwiki-readiness
        system: true
        state: present

    - name: Create tcwiki readiness monitor user
      become: true
      ansible.builtin.user:
        name: tcwiki-readiness
        group: tcwiki-readiness
        system: true
        create_home: false
        home: /nonexistent
        shell: /usr/sbin/nologin
        state: present

    - name: Ensure local libexec directory exists
      become: true
      ansible.builtin.file:
        path: /usr/local/libexec
        state: directory
        owner: root
        group: root
        mode: "0755"

    - name: Install tcwiki readiness monitor executable
      become: true
      ansible.builtin.copy:
        src: scripts/check-production-readiness-host.sh
        dest: /usr/local/libexec/tcwiki-readiness-monitor
        owner: root
        group: root
        mode: "0755"

    - name: Install tcwiki readiness monitor service
      become: true
      ansible.builtin.copy:
        src: deploy/systemd/tcwiki-readiness-monitor.service
        dest: /etc/systemd/system/tcwiki-readiness-monitor.service
        owner: root
        group: root
        mode: "0644"

    - name: Install tcwiki readiness monitor timer
      become: true
      ansible.builtin.copy:
        src: deploy/systemd/tcwiki-readiness-monitor.timer
        dest: /etc/systemd/system/tcwiki-readiness-monitor.timer
        owner: root
        group: root
        mode: "0644"

    - name: Enable tcwiki readiness monitor timer
      become: true
      ansible.builtin.systemd_service:
        name: tcwiki-readiness-monitor.timer
        daemon_reload: true
        enabled: true
        state: started
```

- [ ] **Step 6: Extend release trackedness**

Add `'ansible-playbook.yml'` immediately before `'Dockerfile'` in `RELEASE_TRACKED_SOURCE_FILES`. Replace `releaseFilePattern` with:

```javascript
const releaseFilePattern = /\b(?:scripts\/[A-Za-z0-9._/-]+\.(?:mjs|sh)|tests\/[A-Za-z0-9._/-]+\.spec\.ts|deploy\/systemd\/[A-Za-z0-9._-]+\.(?:service|timer))\b/g;
```

- [ ] **Step 7: Verify GREEN, trackedness, and Ansible syntax**

```bash
npm run test:unit -- tests/unit/host-readiness-monitor.test.ts tests/unit/deploy-config.test.ts tests/unit/release-tracked.test.ts
IMAGE_REF=ghcr.io/example/tcwiki@sha256:1111111111111111111111111111111111111111111111111111111111111111 APP_VERSION=1111111111111111111111111111111111111111 CSP_ENFORCE=1 REQUIRE_READY=0 ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
git add ansible-playbook.yml deploy/systemd scripts/lib/release-tracked.mjs tests/unit/deploy-config.test.ts tests/unit/release-tracked.test.ts
npm run check:release-tracked
git diff --cached --check
```

Expected: focused tests pass; Ansible prints `playbook: ansible-playbook.yml`; trackedness passes; staged diff is clean.

- [ ] **Step 8: Commit**

```bash
git commit -m "ops: install independent readiness timer"
```

Expected: one commit containing units, pre-container installation, and trackedness guardrails.

---

### Task 3: Add operations and removal runbooks

**Files:**
- Modify: `tests/unit/deploy-config.test.ts:126-170`
- Modify: `docs/operations.md:57-70`
- Modify: `docs/maintenance.md:20-34`

**Interfaces:**
- Consumes: Task 2 unit names and host paths.
- Produces: exact status, manual-run, evidence, journald, disable, and removal commands.

- [ ] **Step 1: Add a failing documentation test**

Add after the host-installation test in `tests/unit/deploy-config.test.ts`:

```typescript
it('documents host readiness evidence, manual checks, and removal', () => {
  expect(operations).toContain('tcwiki-readiness-monitor.timer');
  expect(operations).toContain('/var/lib/tcwiki-readiness-monitor/latest.json');
  expect(operations).toContain('journalctl -u tcwiki-readiness-monitor.service');
  expect(operations).toContain('at least one valid sample is ready');
  expect(operations).toContain('does not open or close GitHub issues');
  expect(maintenance).toContain('systemctl start tcwiki-readiness-monitor.service');
  expect(maintenance).toContain('systemctl disable --now tcwiki-readiness-monitor.timer');
  expect(maintenance).toContain('rm -f /etc/systemd/system/tcwiki-readiness-monitor.service');
  expect(maintenance).toContain('rm -f /usr/local/libexec/tcwiki-readiness-monitor');
  expect(maintenance).toContain('systemctl daemon-reload');
});
```

- [ ] **Step 2: Run RED**

```bash
npm run test:unit -- tests/unit/deploy-config.test.ts
```

Expected: FAIL on the first missing host-monitor runbook string.

- [ ] **Step 3: Extend `docs/operations.md`**

Insert after the existing one-sample GitHub diagnostic and before the VPS SSH caveat:

````markdown
### Independent VPS readiness timer

The VPS also runs `tcwiki-readiness-monitor.timer` at minutes 08 and 38 with up to two minutes of randomized delay. It uses the same three-observation rule: the window passes when at least one valid sample is ready and fails when no sample is ready. The host monitor validates monitor-critical fields; GitHub Actions retains full JavaScript contract validation, direct-provider comparison, and issue lifecycle.

The service runs as non-login account `tcwiki-readiness` with no Docker access or GitHub credential. It writes only latest bounded evidence and transition state. It does not open or close GitHub issues.

```bash
sudo systemctl status tcwiki-readiness-monitor.timer --no-pager
sudo systemctl list-timers tcwiki-readiness-monitor.timer --all --no-pager
sudo systemctl show tcwiki-readiness-monitor.service -p Result -p ExecMainStatus -p Environment
sudo jq . /var/lib/tcwiki-readiness-monitor/latest.json
sudo stat -c '%U:%G %a %n' /var/lib/tcwiki-readiness-monitor/latest.json /var/lib/tcwiki-readiness-monitor/state.json
sudo journalctl -u tcwiki-readiness-monitor.service -n 100 --no-pager
```

`latest.json` uses `kind: tcwiki-host-readiness-monitor`. A valid degraded HTTP `503` is a degraded sample, not a transport failure. A failed window leaves the timer active, exits the one-shot service nonzero, and records `persistent-degraded-readiness` or `no-valid-readiness-samples`. Journald markers distinguish `initial`, `steady`, `degraded`, `recovered`, and skipped `overlap` runs.
````

- [ ] **Step 4: Extend `docs/maintenance.md`**

Insert after `Deploy Verification` and before `CSP Enforcement`:

````markdown
## VPS Readiness Timer

Run the service through systemd so a manual check uses the production account, sandbox, timeout, and writable-directory boundaries:

```bash
status=0
sudo systemctl start tcwiki-readiness-monitor.service || status=$?
sudo systemctl show tcwiki-readiness-monitor.service -p Result -p ExecMainStatus --no-pager
sudo jq . /var/lib/tcwiki-readiness-monitor/latest.json
sudo journalctl -u tcwiki-readiness-monitor.service -n 20 --no-pager
printf 'systemctl start exit: %s\n' "$status"
```

Exit `0` means at least one sample was ready. A nonzero result is acceptable proof only when `latest.json` reports `status: fail`, its failure reason matches the samples, and the timer remains enabled and active. It is not proof of an application outage.

Stop scheduling without changing the application:

```bash
sudo systemctl disable --now tcwiki-readiness-monitor.timer
```

For complete removal, preserve required evidence first, then run:

```bash
sudo systemctl disable --now tcwiki-readiness-monitor.timer
sudo rm -f /etc/systemd/system/tcwiki-readiness-monitor.timer
sudo rm -f /etc/systemd/system/tcwiki-readiness-monitor.service
sudo rm -f /usr/local/libexec/tcwiki-readiness-monitor
sudo systemctl daemon-reload
sudo systemctl reset-failed tcwiki-readiness-monitor.service
sudo rm -rf /var/lib/tcwiki-readiness-monitor
sudo userdel tcwiki-readiness
sudo groupdel tcwiki-readiness 2>/dev/null || true
```

Removing the timer does not stop, restart, or roll back the `tcwiki` container.
````

- [ ] **Step 5: Verify GREEN and commit**

```bash
npm run test:unit -- tests/unit/deploy-config.test.ts
npm run check:release-tracked
git diff --check
git add docs/operations.md docs/maintenance.md tests/unit/deploy-config.test.ts
git commit -m "docs: add VPS readiness timer runbook"
```

Expected: docs guardrail and trackedness pass, diff is clean, and one runbook commit is created.

---

### Task 4: Run release-shaped local verification

**Files:**
- Verify: all Task 1-3 files
- Do not modify unrelated files

**Interfaces:**
- Consumes: three implementation commits.
- Produces: clean review-ready branch with exact local evidence.

- [ ] **Step 1: Check resource and runtime guardrails**

```bash
df -h /System/Volumes/Data
node --version
git status --short --branch
```

Expected: at least 30 GiB free, Node `v22.x`, clean `codex/vps-readiness-monitor` branch.

- [ ] **Step 2: Run focused proof**

```bash
sh -n scripts/check-production-readiness-host.sh
npm run test:unit -- tests/unit/host-readiness-monitor.test.ts tests/unit/deploy-config.test.ts tests/unit/release-tracked.test.ts
IMAGE_REF=ghcr.io/example/tcwiki@sha256:1111111111111111111111111111111111111111111111111111111111111111 APP_VERSION=1111111111111111111111111111111111111111 CSP_ENFORCE=1 REQUIRE_READY=0 ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```

Expected: syntax exits `0`, focused Vitest passes, Ansible prints `playbook: ansible-playbook.yml`.

- [ ] **Step 3: Run the complete repository gate**

Run separately and stop on first failure:

```bash
npm run check:release-tracked
npm run check:content
npm run audit:prod
npm run audit:all
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run smoke:docker
npm run test:e2e
npm run test:e2e:csp
git diff --check
```

Expected: all commands exit `0`; audits satisfy configured threshold; full unit/build/standalone/browser/CSP lanes pass.

- [ ] **Step 4: Review privilege, secret, and branch scope**

```bash
rg -n 'GITHUB_TOKEN|github_pat_|ANSIBLE_SSH_PRIVATE_KEY|docker\.sock|SupplementaryGroups=docker|User=root' scripts/check-production-readiness-host.sh deploy/systemd
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: no secret/Docker/root match in monitor assets; design plus three implementation commits; only planned files; clean worktree.

---

### Task 5: Open, merge, deploy, and prove the timer

**Files:**
- No additional repo files unless review or CI proves a defect
- Update Obsidian only after live proof

**Interfaces:**
- Consumes: clean verified feature branch.
- Produces: green PR, exact main SHA/digest, enabled timer, valid host evidence, independent timer-triggered run, issue evidence comment when #63 is open, and durable log.

- [ ] **Step 1: Push and open a ready PR**

```bash
git push -u origin codex/vps-readiness-monitor
gh pr create \
  --base main \
  --head codex/vps-readiness-monitor \
  --title "[codex] Add independent VPS readiness monitor" \
  --body "Adds a credential-free, Ansible-managed systemd timer that samples public strict readiness three times twice hourly, writes bounded atomic evidence/state, and preserves GitHub Actions as the full-contract and notification lane. Includes process tests, deployment hardening, trackedness guards, and operator/removal runbooks."
```

Expected: push succeeds and GitHub returns the tcwiki PR URL.

- [ ] **Step 2: Verify exact-head PR CI**

```bash
branch_sha=$(git rev-parse HEAD)
gh pr checks --watch
gh pr view --json headRefOid,mergeable,mergeStateStatus,statusCheckRollup
test "$(gh pr view --json headRefOid --jq .headRefOid)" = "$branch_sha"
```

Expected: all required checks pass at exact local SHA; PR is mergeable and clean.

- [ ] **Step 3: Squash merge and watch exact-main deployment**

```bash
gh pr merge --squash --delete-branch
git switch main
git pull --ff-only origin main
main_sha=$(git rev-parse HEAD)
run_id=''
for attempt in $(seq 1 12); do
  run_id=$(gh run list --workflow ci.yml --branch main --commit "$main_sha" --limit 1 --json databaseId --jq '.[0].databaseId')
  if [ -n "$run_id" ]; then break; fi
  sleep 10
done
test -n "$run_id"
gh run watch "$run_id" --exit-status
gh run view "$run_id" --json conclusion,headSha,url,jobs
```

Expected: exact-main run succeeds through build, image scan/publish, digest smoke, Ansible deploy, and public readback; `headSha` equals `main_sha`.

- [ ] **Step 4: Verify exact application identity**

```bash
main_sha=$(git rev-parse HEAD)
ready_file=$(mktemp)
trap 'rm -f "$ready_file"' EXIT
curl -fsS https://wiki.thorchain.no/api/health | jq .
curl -fsS https://wiki.thorchain.no/api/version | jq .
curl -sS -D - 'https://wiki.thorchain.no/api/ready?contract=strict' -o "$ready_file"
jq . "$ready_file"
test "$(jq -r .version "$ready_file")" = "$main_sha"
test "$(jq -r .commit "$ready_file")" = "$main_sha"
jq -e '.image | test("@sha256:[0-9a-f]{64}$")' "$ready_file"
```

Expected: liveness healthy, exact SHA/commit, immutable digest. Readiness may honestly be `200 ready` or `503 degraded`.

- [ ] **Step 5: Verify timer installation and manually run the service**

```bash
ssh -i ~/.ssh/id_rsa_racknerd -o BatchMode=yes deploy@198.23.137.16 '
  set -u
  sudo systemctl is-enabled tcwiki-readiness-monitor.timer
  sudo systemctl is-active tcwiki-readiness-monitor.timer
  sudo systemctl list-timers tcwiki-readiness-monitor.timer --all --no-pager
  sudo systemctl cat tcwiki-readiness-monitor.service tcwiki-readiness-monitor.timer
  status=0
  sudo systemctl start tcwiki-readiness-monitor.service || status=$?
  sudo systemctl show tcwiki-readiness-monitor.service -p Result -p ExecMainStatus -p Environment --no-pager
  sudo jq -e '\''
    .schemaVersion == 1 and
    .kind == "tcwiki-host-readiness-monitor" and
    (.status == "pass" or .status == "fail") and
    .counts.total == 3 and
    (.samples | length == 3)
  '\'' /var/lib/tcwiki-readiness-monitor/latest.json
  sudo stat -c "%U:%G %a %n" /var/lib/tcwiki-readiness-monitor/latest.json /var/lib/tcwiki-readiness-monitor/state.json
  sudo journalctl -u tcwiki-readiness-monitor.service -n 30 --no-pager
  printf "manual_status=%s\n" "$status"
'
```

Expected: timer enabled/active; environment contains only public base URL; evidence valid and owned by `tcwiki-readiness`; transition logged. Nonzero manual status is acceptable only with evidence `status: fail`.

- [ ] **Step 6: Prove a timer-triggered run**

Poll every 30 seconds for at most 35 minutes:

```bash
before=$(ssh -i ~/.ssh/id_rsa_racknerd -o BatchMode=yes deploy@198.23.137.16 "sudo jq -r .generatedAt /var/lib/tcwiki-readiness-monitor/latest.json")
changed=''
for attempt in $(seq 1 70); do
  sleep 30
  after=$(ssh -i ~/.ssh/id_rsa_racknerd -o BatchMode=yes deploy@198.23.137.16 "sudo jq -r .generatedAt /var/lib/tcwiki-readiness-monitor/latest.json")
  if [ "$after" != "$before" ]; then changed=$after; break; fi
  printf 'waiting for timer run: %s/70\n' "$attempt"
done
test -n "$changed"
printf 'timer_generated_at=%s\n' "$changed"
ssh -i ~/.ssh/id_rsa_racknerd -o BatchMode=yes deploy@198.23.137.16 "sudo journalctl -u tcwiki-readiness-monitor.service --since '$before' --no-pager"
```

Expected: `generatedAt` advances and journald shows the timer-started run; timer remains active even if service result is nonzero.

- [ ] **Step 7: Comment on issue #63 only if still open**

```bash
main_sha=$(git rev-parse HEAD)
run_id=$(gh run list --workflow ci.yml --branch main --commit "$main_sha" --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$run_id"
if [ "$(gh issue view 63 --json state --jq .state 2>/dev/null || printf CLOSED)" = OPEN ]; then
  gh issue comment 63 --body "Independent VPS readiness scheduling is deployed at main ${main_sha}. The credential-free systemd timer is enabled and active; a timer-triggered run produced bounded host evidence independently of GitHub Actions. It preserves the three-sample strict-readiness rule and holds no GitHub credential. Exact-main CI/deploy run: ${run_id}."
fi
```

Expected: one factual evidence comment when open; issue state is not changed manually.

- [ ] **Step 8: Log and clean up**

Use the `obsidian` skill to update:

```text
/Users/reidar/Obsidian/Hermes/Hermes/Personal/Projects/THORChain Wiki.md
/Users/reidar/Obsidian/Hermes/Hermes/Daily/13-07-2026.md
```

Record exact main SHA, PR URL, CI/deploy run ID/URL, immutable image digest, timer/service status, manual result, timer-triggered `generatedAt`, evidence status/failure reason, issue-comment URL, and explicit non-claims. Never store SSH keys or token values.

Then run:

```bash
git status --short --branch
git branch --merged main
git ls-remote --heads origin codex/vps-readiness-monitor
```

Expected: clean local main; feature branch merged and remote ref absent after GitHub deletion.
