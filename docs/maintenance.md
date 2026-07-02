# THORChain Wiki Maintenance

## Review Cadence

- Review live-data behavior after Midgard or THORNode schema changes, endpoint failures, or protocol incidents.
- Review curated static records at least monthly, or sooner when official docs, incident reports, ADRs, or tokenomics pages change.
- Run `npm run check:content` after editing deep dives, curated records, glossary terms, or search metadata.

## Confidence Labels

- `official`: source-backed by official THORChain docs, dev docs, live THORNode/Midgard endpoints, or official incident reporting.
- `curated`: manually reviewed from credible ecosystem or research sources, but not an official protocol statement.
- `historical`: useful for past context; do not turn into a current availability claim.
- `needs-review`: intentionally conservative. Keep visible until a current source confirms the record.

## Deploy Verification

- Local proof is not deploy proof. Keep local checks, CI checks, image publication, deployment, and live readback separate.
- Before claiming production readiness, verify the immutable image ref and read back `/api/health`, `/api/version`, and `/api/ready`.
- `/api/health` is liveness-only. `/api/ready` is the upstream readiness and source-confidence endpoint.
- Do not reintroduce mutable `latest` deploys; deploys must use digest image refs.

## CSP Promotion

- Keep the policy in report-only mode while new UI routes and MDX content are changing.
- Review structured `/api/csp-report` logs for blocked directive, blocked origin/path, document path, and source file.
- Production report-only policy should not include `unsafe-eval`; development may keep it for tooling.
- Promote from report-only to enforced `Content-Security-Policy` only after Playwright smoke, local browser checks, and report logs show no expected violations.

## Standard Local Gate

Use Node 22, then run:

```bash
nvm use
npm run check:content
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
npm run test:e2e
```
