# Credential-Free VPS Readiness Monitor Design

**Status:** Approved for implementation planning
**Date:** 2026-07-13

## Context

The repository already runs a production-readiness monitor through scheduled GitHub Actions. That monitor samples `https://wiki.thorchain.no/api/ready?contract=strict`, preserves the strict readiness contract, records provider diagnostics, and manages a deduplicated GitHub issue. GitHub's scheduled delivery has been delayed or skipped, so it cannot be the only scheduler for this operational check.

The deployment VPS already uses hardened systemd timers. It has `curl` and `jq`, but no host Node.js runtime. The new fallback must not add a GitHub credential or weaken the intentional `503 degraded` readiness behavior.

## Goals

- Run the strict production-readiness check independently of GitHub's scheduler.
- Keep the VPS credential-free.
- Preserve the existing three-sample aggregation rule exactly: a window passes when at least one valid sample is ready and fails when no sample is ready.
- Retain bounded, machine-readable evidence and explicit degradation/recovery transitions.
- Isolate the monitor from the application container and other workloads on the shared VPS.
- Install and maintain the monitor through the existing Ansible deployment path.

## Non-goals

- Replace the GitHub Actions monitor or its issue lifecycle.
- Add paging, email, webhooks, or another remote alerting service.
- Change `/api/ready`, its strict contract, or deployment rollback semantics.
- Reimplement the GitHub monitor's direct-provider comparison probes.
- Keep an unbounded local evidence history.
- Install Node.js or grant the monitor access to Docker.

## Considered Approaches

### 1. Ansible-managed systemd timer and shell monitor — selected

A small POSIX-compatible shell program uses the VPS's existing `curl` and `jq`. A hardened systemd timer invokes it independently of GitHub Actions. This adds no runtime, secret, vendor, or container privilege and follows established host conventions.

The trade-off is a small amount of aggregation and contract-validation logic in shell. Tests and an explicit evidence schema keep that logic bounded.

### 2. Containerized Node.js monitor

Running the existing Node monitor in a one-shot container would maximize code reuse. It would also require packaging operational scripts into the runtime image, resolving the active immutable image, and granting the service Docker access or another container-launch path. That expands the monitor's privilege and deployment coupling.

### 3. External uptime service

A hosted monitor would provide independent scheduling and remote notifications. It introduces another vendor and alerting contract, and it would not preserve the repository's local evidence model without more integration work.

## Architecture

### Repository-owned assets

- `scripts/check-production-readiness-host.sh` contains the monitor logic.
- `deploy/systemd/tcwiki-readiness-monitor.service` defines the one-shot service.
- `deploy/systemd/tcwiki-readiness-monitor.timer` defines the independent schedule.
- `ansible-playbook.yml` installs the monitor before any application-container mutation.
- `docs/operations.md` documents ownership, evidence, and status inspection.
- `docs/maintenance.md` documents manual execution and rollback/removal.

### Host layout

- System user and group: `tcwiki-readiness`
- Executable: `/usr/local/libexec/tcwiki-readiness-monitor`
- Persistent state: `/var/lib/tcwiki-readiness-monitor`
- Runtime lock directory: `/run/tcwiki-readiness-monitor`
- Evidence: `/var/lib/tcwiki-readiness-monitor/latest.json`
- Transition state: `/var/lib/tcwiki-readiness-monitor/state.json`
- Units: `tcwiki-readiness-monitor.service` and `tcwiki-readiness-monitor.timer`

The service uses systemd `StateDirectory=` and `RuntimeDirectory=` so writable paths are created with the dedicated user's ownership. Ansible owns the user, executable, unit files, daemon reload, and timer enablement.

### Schedule

The timer runs at `:08` and `:38` each hour with up to two minutes of randomized delay. `Persistent=true` catches up one missed invocation after downtime. The schedule is offset from the GitHub monitor's `:23` and `:53` schedules.

Each invocation takes three samples, with 60 seconds between sample starts. The one-shot service uses `TimeoutStartSec=4min`, which allows the complete sampling window while keeping execution bounded.

## Data Flow

1. systemd starts the one-shot service as `tcwiki-readiness`.
2. The script acquires an exclusive lock under `/run/tcwiki-readiness-monitor`. An overlapping invocation exits without altering evidence.
3. The script requests `https://wiki.thorchain.no/api/ready?contract=strict` three times. Each request has a ten-second timeout and a one-megabyte response cap.
4. HTTP `200` and `503` are both accepted transport results. The body must satisfy the strict readiness shape before it can be classified.
5. Each valid response is reduced to a bounded sample summary containing observation time, HTTP status, ready/degraded state, runtime identity, reasons, THORNode source, height, block time/age, lag, and warning categories. Invalid responses become error samples with bounded messages.
6. The aggregate passes if one or more valid samples report `ready: true`. It fails if no sample is ready. The failure reason distinguishes persistent degradation from a window with no valid readiness samples.
7. The complete evidence document is written to a same-directory temporary file and atomically renamed to `latest.json`.
8. The previous state is compared with the aggregate. The script logs `initial`, `degraded`, `recovered`, or `steady` to journald and atomically updates `state.json`.
9. A passing window exits zero. A failed window exits nonzero so systemd exposes the degraded service result while the timer remains active for future runs.

## Evidence Contract

`latest.json` uses a dedicated schema so it cannot be confused with the richer GitHub artifact:

- `schemaVersion: 1`
- `kind: "tcwiki-host-readiness-monitor"`
- `generatedAt`, `startedAt`, and `completedAt`
- `baseUrl`
- `status: "pass" | "fail"`
- `exitCode`
- `failureReason: "none" | "persistent-degraded-readiness" | "no-valid-readiness-samples"`
- bounded human-readable `summary`
- counts for total, ready, degraded, and error samples
- exactly three bounded sample summaries

`state.json` stores only the last aggregate status and the timestamp at which that status began. It is not an event log. Historical output remains in journald, whose retention is managed at the host level.

The monitor must never write response headers, credentials, environment dumps, or full unbounded response bodies.

## Contract Validation and Error Handling

A response is valid only when JSON parsing succeeds and the following monitor-critical strict-contract fields have the expected types and values:

- `status` is `ready` or `degraded`.
- `ready` is boolean and agrees with `status`.
- `checkedAt`, `version`, `commit`, and `image` are non-empty strings.
- `reasons` is an array.
- `sources.midgard` and `sources.thornode` are objects.
- HTTP status is `200` when ready and `503` when degraded.

This bounded host validator intentionally covers the fields used for aggregation and evidence; it does not duplicate every nested assertion in `scripts/lib/readiness-contract.mjs`. The GitHub monitor remains responsible for full JavaScript contract validation and direct-provider diagnostics.

Timeouts, DNS/TLS failures, oversized responses, malformed JSON, contract mismatches, and unexpected HTTP statuses become error samples. They do not reuse stale evidence as a current sample and cannot produce a false pass.

Temporary files are removed on exit. Atomic rename leaves the previous complete evidence in place if a run crashes before publication. Error text and readiness reasons are whitespace-normalized and length-bounded before storage or logging.

Ansible installs and validates monitoring prerequisites before stopping or replacing the live application container. A monitor installation failure therefore fails early without disturbing the running application. The timer does not run as part of the deploy transaction, so a currently degraded network cannot block an otherwise valid application deployment.

## Service Hardening

The service is a non-root `Type=oneshot` unit with no home directory, login shell, Docker group, secrets, or supplementary privileges. The unit includes:

- `NoNewPrivileges=true`
- `PrivateTmp=true`
- `ProtectHome=true`
- `ProtectSystem=strict`
- `StateDirectory=tcwiki-readiness-monitor`
- `RuntimeDirectory=tcwiki-readiness-monitor`
- `CapabilityBoundingSet=`
- `LockPersonality=true`
- `MemoryDenyWriteExecute=true`
- `ProtectControlGroups=true`
- `ProtectKernelModules=true`
- `ProtectKernelTunables=true`
- `RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6`
- `RestrictSUIDSGID=true`
- a bounded `TimeoutStartSec`

The executable and unit files are root-owned and not writable by the service user.

## Testing Strategy

### Script behavior

A Vitest harness spawns the shell script with temporary state/runtime directories and deterministic fake `curl` and sleep commands. Fixtures cover:

- three ready samples;
- mixed ready, degraded, and transport-error samples;
- three degraded samples;
- three transport or contract errors;
- malformed and oversized responses;
- ready/status and HTTP/status disagreement;
- first-run, degraded, recovered, and steady transitions;
- atomic evidence replacement after a successful run;
- preservation of previous evidence after an interrupted run;
- overlap rejection through the lock.

The production defaults remain three samples and 60-second intervals. Test-only command and timing injection must be explicit and must not alter those defaults.

### Deployment configuration

Existing deployment configuration tests are extended to assert:

- the script and both unit files are tracked;
- Ansible creates the dedicated system account and installs root-owned assets;
- monitor installation precedes application-container mutation;
- the timer cadence, randomized delay, and persistence settings;
- required service hardening and writable-directory boundaries;
- no GitHub token, Docker permission, or remote alert integration;
- operations and maintenance documentation references the exact unit and evidence paths.

The script also receives a shell syntax check. Normal repository lint, typecheck, unit, content, build, standalone smoke, and Playwright checks remain required before merge.

### Live proof

After merge and deployment:

1. Confirm the exact deployed application SHA and immutable image digest remain correct.
2. Confirm the timer is enabled and active with the expected next trigger.
3. Manually start the service and inspect its exit result.
4. Validate `latest.json` against the documented schema and confirm it is owned by `tcwiki-readiness`.
5. Inspect journald for the corresponding status/transition marker.
6. Let at least one timer-triggered run occur and verify its timestamp independently of GitHub Actions.

A live degraded result is acceptable proof only when the service exits nonzero, evidence reports `fail`, and the timer remains active. It is not a claim that production readiness is healthy.

## Rollback and Removal

Application rollback remains unchanged because the monitor is outside the container transaction. To disable the independent scheduler without changing the application, an operator stops and disables `tcwiki-readiness-monitor.timer`. Full removal additionally deletes the two unit files and executable, runs `systemctl daemon-reload`, and optionally removes the dedicated account and bounded state directory after preserving any required evidence. Exact commands belong in `docs/maintenance.md`.

## Acceptance Criteria

- The monitor runs from systemd without Node.js, Docker access, or secrets.
- Its timer is independent of GitHub and scheduled twice hourly at the approved offset.
- Three-sample pass/fail behavior matches the existing GitHub monitor.
- Valid degraded `503` responses are classified as degraded rather than transport failures.
- Invalid or unavailable responses cannot produce a pass.
- Evidence and transition state are atomic, bounded, and written only under the service's systemd-managed directories.
- A failed check never stops the timer or changes application availability.
- Ansible failure cannot mutate the live container before monitor prerequisites are installed.
- Automated tests cover aggregation, contract validation, transitions, locking, atomic writes, unit hardening, and deployment ordering.
- CI and post-deploy VPS evidence satisfy the live-proof checklist without claiming readiness when the strict endpoint remains degraded.
