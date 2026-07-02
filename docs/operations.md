# Operations Runbook

## Deploy Inputs

Deploys require immutable image and version inputs:

```bash
IMAGE_REF='ghcr.io/reedtrullz/tcwiki@sha256:<digest>'
APP_VERSION='<git-sha>'
ansible-playbook -i inventory/hosts.yml ansible-playbook.yml
```

The playbook refuses mutable tags and missing versions.

## Deploy And Evidence Boundaries

Do not deploy from local work unless the user explicitly requests a deploy. Local release checks
such as `npm run build`, `npm run smoke:standalone`, `git diff --check`, and Ansible syntax checks
are local evidence only. They do not prove that GitHub CI passed, that a GHCR image was published,
or that production changed.

When reporting release state, keep these boundaries explicit:

- Local proof: command, result, branch, and whether the worktree was dirty.
- CI proof: GitHub run ID or URL, if actually checked.
- Published-image proof: immutable GHCR digest, if actually published.
- Production proof: live endpoint readback date/time, `/api/health`, `/api/version`, and expected
  headers, if actually checked.

## Health And Version Checks

Check the deployed app:

```bash
curl -fsS https://wiki.thorchain.no/api/health
curl -fsS https://wiki.thorchain.no/api/version
curl -fsS https://wiki.thorchain.no/api/ready
```

Expected:

- `status` is `healthy`.
- `version` matches the deployed commit SHA.
- `image` is a digest ref when set by deployment.
- `/api/ready` returns `ready: true` and `status: ready` before claiming upstream readiness.

## Rollback Behavior

The Ansible playbook captures the previous container image before replacing the container.
It also reads the previous `/api/version` response and falls back to Docker environment metadata when
that endpoint is unavailable. If health or version readback fails, it attempts to restart the previous
image, restores that runtime metadata, verifies rollback health, version, image, and container
environment including `VERSION`, and still exits nonzero so CI does not report a successful deploy.

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
- `Content-Security-Policy-Report-Only`

The default CSP is nonce-based report-only and must not include `unsafe-inline` or `unsafe-eval`. The root layout is intentionally dynamic so Next can attach the per-request nonce to framework scripts. Set `CSP_ENFORCE=1` for local enforced-policy smoke, and keep Playwright’s no-report CSP check passing, before considering production enforcement.
