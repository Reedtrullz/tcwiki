# Operations Runbook

## Deploy Inputs

Deploys require immutable image and version inputs. `REQUIRE_READY=0` is the explicit default: source-confidence degradation is reported but does not block a deploy. Set `REQUIRE_READY=1` for a deliberate upstream-readiness gate; degraded candidate or deployed readiness then fails closed and the existing rollback path is used.

```bash
IMAGE_REF='ghcr.io/reedtrullz/tcwiki@sha256:<digest>'
APP_VERSION='<git-sha>'
ansible-playbook -i inventory/hosts.yml ansible-playbook.yml
```

The playbook refuses mutable tags and missing versions. Production deploys default to `CSP_ENFORCE=1`; set `CSP_ENFORCE=0` only for an explicit report-only rollback or diagnostic run, and record that exception in release evidence.

## Deploy And Evidence Boundaries

Do not deploy from local work unless the user explicitly requests a deploy. Local release checks
such as `npm run build`, `npm run smoke:standalone`, `git diff --check`, and Ansible syntax checks
must be run under Node 22; app and release-proof npm scripts fail fast through `scripts/require-node22.mjs`
when an older runtime is active. Local checks are local evidence only. They do not prove that GitHub CI passed, that a GHCR image was published,
or that production changed.
Use `npm run check:release-tracked` before treating local release evidence as ship-ready; it fails when package scripts, CI, release docs, or their local script/spec dependencies reference local-only proof files that have not been tracked by git. CI runs the same trackedness audit before the rest of the release-shaped app gate.

When reporting release state, keep these boundaries explicit:

- Local proof: command, result, branch, and whether the worktree was dirty.
- CI proof: GitHub run ID or URL, if actually checked.
- Published-image proof: immutable GHCR digest, if actually published.
- Pre-deploy image proof: published digest pulled and passed Docker runtime/browser smoke, if actually run.
- Production proof: live endpoint readback date/time, `/api/health`, `/api/version`, and expected
  `/api/ready?contract=strict` state and headers, if actually checked.

## Health And Version Checks

Check the deployed app:

```bash
curl -fsS https://wiki.thorchain.no/api/health
curl -fsS https://wiki.thorchain.no/api/version
curl -sS -D - 'https://wiki.thorchain.no/api/ready?contract=strict'
```

Expected:

- `status` is `healthy`.
- `version` matches the deployed commit SHA.
- `commit` matches the deployed commit SHA.
- `image` is an immutable `@sha256:` digest ref when set by deployment.
- `runtime.verified` is `true` and `runtime.warnings` is empty for deployed production checks.
- `/api/ready?contract=strict` returns `ready: true` and `status: ready` before claiming upstream readiness. Ready means the app has usable, contract-valid source data; it does not mean THORChain has no active operational controls or review caveats.
- `/api/ready` can intentionally return `503 degraded`; use a body-preserving command so the JSON diagnostics are still visible.
- `/api/ready` checks visible Midgard datasets, THORNode operation state, the dynamic L1 fee tracker source contract, and RUNEPool/POL status/source posture through `sources.thornode.runePoolPol`.
- `/api/ready` keeps HTTP responses `no-store`, but concurrent and repeated requests share one server-side upstream snapshot for up to 10 seconds. Use `checkedAt` as the snapshot time; a repeated value inside that window is intentional request deduplication, not proof that the endpoint is stuck.
- `/api/ready` degrades on runtime identity problems only when `RUNTIME_METADATA_REQUIRED=1`; production containers set this so missing commit/image provenance is not treated as clean readiness.
- `/api/ready` keeps `reasons` and `sourceWarnings` as simple strings for probes, exposes top-level `warnings` for non-blocking source caveats, and includes `sourceWarningDetails` with severity, category, action, keys, and scopes when warnings need operator review. Only exact THORNode `severity: review` / `category: mimir-support` details are non-blocking, and their messages remain in both the THORNode warning arrays and top-level `warnings`. Unknown review keys, warning/critical details, conflicting classifications, and raw warnings without a matching support detail remain blocking `reasons`.

## Scheduled Operational Monitoring

`.github/workflows/operations.yml` samples public strict readiness twice per hour at off-peak minutes 23 and 53. The redundant schedule reduces the chance that a delayed or dropped GitHub `schedule` event leaves an hour unobserved. Each run takes three observations one minute apart and probes the configured THORNode latest-block endpoints directly from the runner. The bounded JSON artifact therefore distinguishes app-observed source posture from runner-observed provider height and freshness without storing raw Mimir, inbound-address, or accounting payloads.

The monitor fails only when the full sampling window has no ready observation. A failure opens one deduplicated `Production readiness monitor degraded` issue; a later successful window closes it with recovery evidence. A sample with only fully disclosed review-only `mimir-support` caveats is ready and keeps those caveats in the artifact's warning categories; this is source usability, not a claim that every protocol operation is available. This alert does not authorize changing `REQUIRE_READY`, suppressing warnings, or treating a degraded 503 as an application outage. Investigate the run artifact, provider path, and VPS network first.

THORNode latest-block discovery appends a unique `tcwiki_cache_bust` query value to each request. This bypasses stale intermediary cache entries observed on a geo-routed Liquify backend while keeping displayed provenance URLs canonical. VPS reads remain pinned to `latest - 1`; the Cloudflare Durable Object uses `THORNODE_SNAPSHOT_LAG_BLOCKS=10` because its geo-routed reader was observed returning HTTP 500 for newer pinned heights. Keep the lag bounded and review it against live provider height before changing it. Do not replace the cache key with a fixed value or weaken freshness thresholds.

For a local one-sample diagnostic without waiting:

```bash
npm run check:production-readiness -- --samples 1 --interval-ms 0 --artifact .artifacts/readiness-monitor/local.json
```

### Independent VPS readiness timer

The VPS also runs `tcwiki-readiness-monitor.timer` at minutes 08 and 38 with up to two minutes of randomized delay. It uses the same three-observation rule: the window passes when at least one valid sample is ready and fails when no sample is ready. The host monitor uses a jq counterpart of the required JavaScript identity/source contract because Node is absent on the host (read-only checked2026-10-03). Shared positive/negative fixtures cover parity; GitHub Actions retains direct-provider comparison and issue lifecycle. The service loads the root-owned `/usr/local/libexec/tcwiki-readiness-monitor-lib/readiness-contract.jq`; installation is supplied by Ansible, and missing/invalid library state fails closed. Neither validator independently enforces a timestamp calendar/age policy merely by requiring nonempty checkedAt; the application supplies the delivery age assessment. Candidate changes need owner merge/deploy before host behavior changes.

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

VPS SSH is a separate evidence path. If port 22 refuses before authentication, report that boundary and use the public readiness plus direct-provider artifact; do not claim a container-side provider readback.

## Rollback Behavior

The Ansible playbook captures the previous container image before replacing the container.
It also reads the previous `/api/version` response and falls back to Docker environment metadata when
that endpoint is unavailable. If health or version readback fails, it attempts to restart the previous
image, restores that runtime metadata, verifies rollback health, version, image, and container
environment including `VERSION`, and still exits nonzero so CI does not report a successful deploy.
After a verified Cloudflare cutover, create `/etc/tcwiki/cloudflare-primary` on the VPS. The playbook then refuses an ordinary VPS deployment; an intentional rollback must set `TCWIKI_VPS_ROLLBACK=1`, use an immutable image digest, and restore the previous Caddy/DNS route before validating live readback. Keep the marker and the previous image/config as rollback evidence.

```bash
sudo install -d -m 0755 /etc/tcwiki
printf '%s\n' 'Cloudflare primary; restore VPS only with TCWIKI_VPS_ROLLBACK=1' | sudo tee /etc/tcwiki/cloudflare-primary >/dev/null
```

## Logs

The container uses Docker `json-file` logs with rotation. On the VPS:

```bash
docker logs --tail=200 tcwiki
docker inspect tcwiki --format '{{.Config.Image}}'
```

## Backups

The app has no database or CMS. Durable content is in git. Back up:

- GitHub repository
- GHCR image digests for releases
- VPS Caddy/reverse-proxy configuration outside this repo

## Security Headers

Expected response headers include:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy`

The production deploy path is configured for a nonce-based enforced CSP by default. It must not include `unsafe-inline` or `unsafe-eval`. The root layout is intentionally dynamic so Next can attach the per-request nonce to framework scripts. `CSP_ENFORCE=0` is an explicit rollback/diagnostic escape hatch only; record that exception with release evidence if used. Keep `CSP_ENFORCE=1 npm run smoke:standalone` and `npm run test:e2e:csp` passing before shipping CSP-affecting changes. For public drift checks, run:

```bash
CHECK_BASE_URL=https://wiki.thorchain.no REQUIRE_RUNTIME_METADATA=1 CSP_ENFORCE=1 npm run check:runtime-url
```


## Cloudflare candidate promotion and rollback

CI builds one WikiDO candidate, writes `.artifacts/cloudflare-manifest.json`, exercises that exact module/asset/config tree with local Wrangler and enforced CSP, and retains both under `cloudflare-candidate-<commit>`. Production downloads that artifact and checks its complete digest; it does not rebuild it. Both production target flags must be explicit 0/1 and cannot both be 1. The public domain and workers.dev URL must return the expected commit/digest, strict metadata contract and enforced CSP after propagation. Metadata `verified` validates self-reported identity fields; it is not independent attestation or live-source readiness.

Before an authorized production release, record the current Worker version ID, public `/api/version` identity and previous retained artifact. Keep the SQLite WikiDO migration/binding compatible with that version. Run `wrangler versions list --config wrangler.do.jsonc --name thorchain-wiki` to identify the previous version; after owner authorization, use `wrangler rollback <previous-version-id> --config wrangler.do.jsonc --name thorchain-wiki`, then run `check:runtime-url` against both public URLs with that previous commit/digest and enforced CSP. Record previous, candidate and restored version IDs plus readbacks. Never assume code rollback restores Durable Object data or migrations. Re-deploying a retained artifact is a separate fallback if version rollback is incompatible.

The workplan's local manifest tests rehearse detecting tampered/added/deleted modules, assets and policy. They do not constitute a production rollback rehearsal. Actual Worker rollback/readbacks require a separately authorized release window; the current implementation run creates PRs without merging or deploying. Retired VPS markers, backups, timers and tagged rollback images remain intact.

The Vite MDX build uses the same `src/mdx-components.tsx` provider as Next so heading anchors and contained GFM tables agree. Reference: https://mdxjs.com/packages/mdx/#providerimportsource.

### Browser sample age and recovery

Browser live data uses the existing SWR60s fetch cadence with no focus polling. A presentation clock reassesses operation block age every second and on tab resume/online/offline; it does not fetch. Existing12s warning/30s degraded block rules remain authoritative. Aggregate samples become stale context after missing two configured refresh opportunities (120s receipt age); this is a browser sampling policy, not a provider/chain freshness guarantee. Historical intervals retain their period meaning regardless of receipt age.

Failed refreshes keep the prior successful payload, provider and checkedAt and label it Last good sample; first-load failure is Unavailable. Dated operation cells require review rather than implying availability, while observed blockers remain visible. Each source exposes a manual refresh; SWR reconnect recovery remains enabled and automatic error retries are disabled, leaving scheduled/manual recovery. Quote input/expiry policy remains separate and never gains an automatic probe. There is no global store or interval-invalidating universal TTL.
