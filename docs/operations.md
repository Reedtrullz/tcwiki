# Operations Runbook

## Deploy Inputs

Deploys require immutable image and version inputs:

```bash
IMAGE_REF='ghcr.io/reedtrullz/tcwiki@sha256:<digest>'
APP_VERSION='<git-sha>'
ansible-playbook -i inventory/hosts.yml ansible-playbook.yml
```

The playbook refuses mutable tags and missing versions.

## Health And Version Checks

Check the deployed app:

```bash
curl -fsS https://wiki.thorchain.no/api/health
curl -fsS https://wiki.thorchain.no/api/version
```

Expected:

- `status` is `healthy`.
- `version` matches the deployed commit SHA.
- `image` is a digest ref when set by deployment.

## Rollback Behavior

The Ansible playbook captures the previous container image before replacing the container.
If health or version readback fails, it attempts to restart the previous image, verifies health,
and still exits nonzero so CI does not report a successful deploy.

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

Use report-only CSP until a stricter policy has been tested against Next.js inline scripts.
