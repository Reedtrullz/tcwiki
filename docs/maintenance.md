# THORChain Wiki Maintenance

## Review Cadence

- Review live-data behavior after Midgard or THORNode schema changes, endpoint failures, or protocol incidents.
- Review curated static records at least monthly, or sooner when official docs, incident reports, ADRs, or tokenomics pages change.
- Run `npm run check:content` after editing deep dives, curated records, glossary terms, or search metadata.
- `npm run check:content` fails when `nextReviewDue` is before today's date. Use `CONTENT_CHECK_TODAY=YYYY-MM-DD` for deterministic local audits, and use `ALLOW_OVERDUE_CONTENT=1` only with explicit release evidence and non-claims.
- Run `npm run check:live-snapshot` when reviewing supported-chain records. It compares curated supported chains with live THORNode `inbound_addresses`; CI runs it on the scheduled/manual live-source drift job rather than every PR.

## Confidence Labels

- `official`: source-backed by official THORChain docs, dev docs, live THORNode/Midgard endpoints, or official incident reporting.
- `curated`: manually reviewed from credible ecosystem or research sources, but not an official protocol statement.
- `historical`: useful for past context; do not turn into a current availability claim.
- `needs-review`: intentionally conservative. Keep visible until a current source confirms the record.

## Deploy Verification

- Local proof is not deploy proof. Keep local checks, CI checks, image publication, deployment, and live readback separate.
- Before claiming production readiness, verify the immutable image ref and read back `/api/health`, `/api/version`, and `/api/ready`.
- `/api/health` is liveness-only. `/api/ready` is the upstream readiness and source-confidence endpoint.
- Release-shaped smoke and deploy checks should validate `/api/ready` shape, metadata, and reasons, but source-confidence degradation is non-blocking unless `REQUIRE_READY=1` is set for a deliberate upstream-readiness audit.
- Do not reintroduce mutable `latest` deploys; deploys must use digest image refs.
- Local Playwright runs start a fresh standalone server by default. Use `PLAYWRIGHT_BASE_URL` only when deliberately proving an existing standalone server or remote deployment.
- PR CI builds, scans, and runs the Docker image before deploy code can publish; the `main` publish job scans the locally built image before pushing it to GHCR.

## CSP Promotion

- Keep the policy in report-only mode while new UI routes and MDX content are changing.
- Review structured `/api/csp-report` logs for blocked directive, blocked origin/path, document path, and source file.
- Production and standalone CSP must not include `unsafe-eval` or `unsafe-inline`; the Next proxy generates a per-request nonce and the root layout intentionally renders dynamically so framework scripts receive it.
- Use `CSP_ENFORCE=1 npm run smoke:standalone` for a local enforced-policy header smoke, then `CSP_ENFORCE=1 npm run test:e2e` to confirm normal browser page loads do not emit `/api/csp-report` reports under enforced headers.
- Promote production from report-only to enforced `Content-Security-Policy` only after Playwright smoke, local browser checks, and report logs show no expected violations.

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
npm run test:e2e
IMAGE_REF=ghcr.io/example/tcwiki@sha256:0000000000000000000000000000000000000000000000000000000000000000 APP_VERSION=local ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```
