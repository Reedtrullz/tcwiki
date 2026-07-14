# THORChain Wiki Maintenance

## Review Cadence

- Review live-data behavior after Midgard or THORNode schema changes, endpoint failures, or protocol incidents.
- Review curated static records at least monthly, or sooner when official docs, incident reports, ADRs, or tokenomics pages change.
- Run `npm run check:content` after editing deep dives, curated records, glossary terms, or search metadata.
- `npm run check:content` fails when `nextReviewDue` is before today's date. Use `CONTENT_CHECK_TODAY=YYYY-MM-DD` for deterministic local audits, and use `ALLOW_OVERDUE_CONTENT=1` only with explicit release evidence and non-claims.
- Run `npm run report:content-reviews` to build a dated, machine-readable queue across curated records, route entries, task guides, reader paths, and glossary metadata. The weekly operational workflow uploads the 30-day queue as an artifact and fails when any item is overdue. Use `--today YYYY-MM-DD` and `--horizon-days N` for deterministic planning; `--allow-overdue` is an evidence-only escape hatch, not a content refresh.
- Run `npm run check:live-snapshot` when reviewing supported-chain records. It compares curated supported chains with same-provider, height-pinned THORNode `inbound_addresses` snapshots and fails on duplicate chains, missing operation fields, provider disagreement, stale/far-future latest-block timestamps, or curated/live chain drift; CI runs it on the scheduled/manual live-source drift job rather than every PR. Use `npm run check:live-snapshot -- --artifact .artifacts/live-source-drift/local.json` when you need a bounded JSON evidence artifact for review notes.
- Before merging content-shape changes, use the source-posture and reader-path checklist in `CONTRIBUTING.md`. It covers route `CONTENT_ENTRIES`, `RouteSourcePosture`, `TASK_INTENT_GUIDES`, `DEEP_DIVE_READER_PATHS`, source-map non-claims, ecosystem use/check fields, and the focused tests expected when journeys or anchors change.

## Confidence Labels

- `official`: source-backed by official THORChain docs, dev docs, live THORNode/Midgard endpoints, or official incident reporting.
- `curated`: manually reviewed from credible ecosystem or research sources, but not an official protocol statement.
- `historical`: useful for past context; do not turn into a current availability claim.
- `needs-review`: intentionally conservative. Keep visible until a current source confirms the record.

## Deploy Verification

- Local proof is not deploy proof. Keep local checks, CI checks, image publication, deployment, and live readback separate.
- Before claiming production readiness, verify the immutable image ref and read back `/api/health`, `/api/version`, and `/api/ready`.
- `/api/health` is liveness-only. `/api/ready` is the upstream readiness and source-confidence endpoint for visible Midgard datasets, THORNode operation state, the dynamic L1 fee tracker, RUNEPool/POL status, RUNEPool/POL source posture at `sources.thornode.runePoolPol`, and strict runtime metadata when `RUNTIME_METADATA_REQUIRED=1`.
- `/api/health`, `/api/version`, and `/api/ready` include `runtime` diagnostics. Production evidence should show `runtime.verified: true`, commit metadata shaped like a git SHA, and image metadata shaped like an immutable `@sha256:` ref.
- `/api/ready` `reasons` and `sourceWarnings` remain string-compatible for simple monitors; top-level `warnings` carries non-blocking source caveats, and `sourceWarningDetails` carries structured category/action/key context for diagnostics. A ready response may retain THORNode warnings only when every retained warning has an exact `severity: review` / `category: mimir-support` detail and is mirrored in top-level `warnings`. Unknown review keys, unmatched warning strings, and every `warning` or `critical` detail still fail readiness closed.
- Readiness responses remain `Cache-Control: no-store`; the server deduplicates concurrent probes and reuses the seven-check upstream snapshot for at most 10 seconds. Compare `checkedAt` before treating two responses as independent source reads.
- Release-shaped smoke and deploy checks should validate `/api/ready` shape, metadata, and reasons. Ansible accepts degraded source confidence by default (`REQUIRE_READY=0`), while `REQUIRE_READY=1` makes degraded candidate or deployed readiness fail closed and trigger the existing rollback path.
- Do not reintroduce mutable `latest` deploys; deploys must use digest image refs.
- Local Playwright runs start a fresh standalone server by default. Use `PLAYWRIGHT_BASE_URL` only when deliberately proving an existing standalone server or remote deployment.
- App and release-proof npm scripts fail fast through `scripts/require-node22.mjs`; run `nvm use` before interpreting local smoke, build, lint, typecheck, audit, content, unit, or Playwright output.
- PR CI builds, scans, and runs the Docker image before deploy code can publish; the `main` publish job scans the locally built image before pushing it to GHCR, then a separate `Smoke published image` job pulls and smokes the immutable digest before deploy can start.

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

Exit `0` means at least one sample was ready, including a source-usable sample that retains fully disclosed review-only `mimir-support` caveats. A nonzero result is acceptable proof only when `latest.json` reports `status: fail`, its failure reason matches the samples, and the timer remains enabled and active. It is not proof of an application outage.

Stop scheduling without changing the application:

```bash
sudo systemctl disable --now tcwiki-readiness-monitor.timer
```

For complete removal, preserve required evidence first, then run:

```bash
sudo systemctl disable --now tcwiki-readiness-monitor.timer
sudo systemctl stop tcwiki-readiness-monitor.service
test "$(sudo systemctl is-active tcwiki-readiness-monitor.service || true)" = inactive
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

## CSP Enforcement

- Production deploys set `CSP_ENFORCE=1` and should emit `Content-Security-Policy`, not `Content-Security-Policy-Report-Only`.
- `CSP_ENFORCE=0` is an explicit rollback/diagnostic escape hatch only. Record the exception, reason, and follow-up evidence if it is used.
- Local standalone smoke runs report-only by default and enforced mode when `CSP_ENFORCE=1` is set, so both comparison modes remain easy to test before release.
- Review structured `/api/csp-report` logs for blocked directive, blocked origin/path, document path, and source file.
- Production and standalone CSP must not include `unsafe-eval` or `unsafe-inline`; the Next proxy generates a per-request nonce and the root layout intentionally renders dynamically so framework scripts receive it.
- Use `CSP_ENFORCE=1 npm run smoke:standalone` for a local enforced-policy header smoke, then `npm run test:e2e:csp` to confirm CSP-sensitive browser paths do not emit `/api/csp-report` reports under enforced headers.
- Do not ship CSP-affecting changes while report-only browser runs still show `style-src-elem` or other normal-page violations.
- Use `CHECK_BASE_URL=https://wiki.thorchain.no REQUIRE_RUNTIME_METADATA=1 CSP_ENFORCE=1 npm run check:runtime-url` for a public runtime/header drift probe. Leave `REQUIRE_READY=1` unset unless deliberately auditing upstream readiness.

## Standard Local Gate

Use Node 22, then run:

```bash
nvm use
df -h /System/Volumes/Data # stop if free space is below 50 GiB
npm run check:release-tracked # fails if release proof commands point at local-only proof files
npm run check:content
npm run report:content-reviews -- --horizon-days 30 --artifact .artifacts/content-reviews/local.json
npm run check:live-snapshot # live-source drift audit, optional for ordinary copy-only edits
npm run check:live-snapshot -- --artifact .artifacts/live-source-drift/local.json # optional bounded JSON evidence
npm run audit:prod
npm run audit:all
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run smoke:docker # local Docker candidate with strict runtime metadata and enforced CSP
npm run test:e2e:visual # focused route overflow / first-viewport visual safety smoke
npm run test:e2e:links # rendered internal links, anchors, and hydration/runtime console crawl
npm run test:e2e
npm run test:e2e:csp
CHECK_BASE_URL=https://wiki.thorchain.no REQUIRE_RUNTIME_METADATA=1 CSP_ENFORCE=1 npm run check:runtime-url # public runtime/header drift probe
npm run check:production-readiness -- --samples 1 --interval-ms 0 --artifact .artifacts/readiness-monitor/local.json # sampled public readiness plus direct-provider evidence
IMAGE_REF=ghcr.io/example/tcwiki@sha256:1111111111111111111111111111111111111111111111111111111111111111 APP_VERSION=1111111111111111111111111111111111111111 ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```
