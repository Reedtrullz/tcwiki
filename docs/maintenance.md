# THORChain Wiki Maintenance

## Review Cadence

- Review live-data behavior after Midgard or THORNode schema changes, endpoint failures, or protocol incidents.
- Review curated static records at least monthly, or sooner when official docs, incident reports, ADRs, or tokenomics pages change.
- Run `npm run check:content` after editing deep dives, curated records, glossary terms, or search metadata.
- `npm run check:content` fails when `nextReviewDue` is before today's date. Use `CONTENT_CHECK_TODAY=YYYY-MM-DD` for deterministic local audits, and use `ALLOW_OVERDUE_CONTENT=1` only with explicit release evidence and non-claims.
- Run `npm run check:live-snapshot` when reviewing supported-chain records. It compares curated supported chains with same-provider, height-pinned THORNode `inbound_addresses` snapshots and fails on duplicate chains, missing operation fields, provider disagreement, stale/far-future latest-block timestamps, or curated/live chain drift; CI runs it on the scheduled/manual live-source drift job rather than every PR.
- Before merging content-shape changes, use the source-posture and reader-path checklist in `CONTRIBUTING.md`. It covers route `CONTENT_ENTRIES`, `RouteSourcePosture`, `TASK_INTENT_GUIDES`, `DEEP_DIVE_READER_PATHS`, source-map non-claims, ecosystem use/check fields, and the focused tests expected when journeys or anchors change.

## Confidence Labels

- `official`: source-backed by official THORChain docs, dev docs, live THORNode/Midgard endpoints, or official incident reporting.
- `curated`: manually reviewed from credible ecosystem or research sources, but not an official protocol statement.
- `historical`: useful for past context; do not turn into a current availability claim.
- `needs-review`: intentionally conservative. Keep visible until a current source confirms the record.

## Deploy Verification

- Local proof is not deploy proof. Keep local checks, CI checks, image publication, deployment, and live readback separate.
- Before claiming production readiness, verify the immutable image ref and read back `/api/health`, `/api/version`, and `/api/ready`.
- `/api/health` is liveness-only. `/api/ready` is the upstream readiness and source-confidence endpoint for visible Midgard datasets, THORNode operation state, and the dynamic L1 fee tracker.
- `/api/ready` `reasons` and `sourceWarnings` remain string-compatible for simple monitors; top-level `warnings` carries non-blocking source caveats, and `sourceWarningDetails` carries structured category/action/key context for diagnostics.
- Release-shaped smoke and deploy checks should validate `/api/ready` shape, metadata, and reasons, but source-confidence degradation is non-blocking unless `REQUIRE_READY=1` is set for a deliberate upstream-readiness audit.
- Do not reintroduce mutable `latest` deploys; deploys must use digest image refs.
- Local Playwright runs start a fresh standalone server by default. Use `PLAYWRIGHT_BASE_URL` only when deliberately proving an existing standalone server or remote deployment.
- PR CI builds, scans, and runs the Docker image before deploy code can publish; the `main` publish job scans the locally built image before pushing it to GHCR.

## CSP Promotion

- Keep production in report-only mode until browser validation shows normal pages emit no `/api/csp-report` events.
- Local standalone smoke runs report-only by default and enforced mode when `CSP_ENFORCE=1` is set.
- Review structured `/api/csp-report` logs for blocked directive, blocked origin/path, document path, and source file.
- Production and standalone CSP must not include `unsafe-eval` or `unsafe-inline`; the Next proxy generates a per-request nonce and the root layout intentionally renders dynamically so framework scripts receive it.
- Use `CSP_ENFORCE=1 npm run smoke:standalone` for a local enforced-policy header smoke, then `npm run test:e2e:csp` to confirm CSP-sensitive browser paths do not emit `/api/csp-report` reports under enforced headers.
- Do not promote production while report-only browser runs still show `style-src-elem` or other normal-page violations.
- Use `CHECK_BASE_URL=https://wiki.thorchain.no npm run check:runtime-url` for a public runtime/header drift probe. Leave `REQUIRE_READY=1` unset unless deliberately auditing upstream readiness.

## Standard Local Gate

Use Node 22, then run:

```bash
nvm use
df -h /System/Volumes/Data # stop if free space is below 50 GiB
npm run check:content
npm run check:live-snapshot # live-source drift audit, optional for ordinary copy-only edits
npm run audit:prod
npm run audit:all
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run test:e2e:visual # focused route overflow / first-viewport smoke
npm run test:e2e
CHECK_BASE_URL=https://wiki.thorchain.no npm run check:runtime-url # public runtime/header drift probe
IMAGE_REF=ghcr.io/example/tcwiki@sha256:0000000000000000000000000000000000000000000000000000000000000000 APP_VERSION=local ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```
