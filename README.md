# THORChain Wiki

Community-maintained encyclopedia and reference for the THORChain protocol: architecture, economics, governance history, ecosystem context, and current-only live network status.

**Live site**: [wiki.thorchain.no](https://wiki.thorchain.no)

## What this is

A focused, high-signal resource that complements the official THORChain documentation. It provides:

- Clear overviews of protocol mechanics, tokenomics, and security model
- Curated history (security incidents with lessons, governance milestones, research)
- Live network statistics and status with Midgard and THORNode provenance
- An ecosystem directory and quick links to the best official resources

The goal is to make THORChain more approachable for users, node operators, developers, and researchers without duplicating the full depth of the official docs.

## Getting Started

```bash
nvm use
npm ci --include=optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

This project requires Node 22; npm enforces the `package.json` engine range.

## Project Structure

- `src/app/` — All page content (mostly React Server Components + client islands for live data)
- `content/deep-dives/` — MDX source for long-form explainers.
- `src/lib/data/static.ts` — Sourced curated records for chains, ecosystem, incidents, milestones, research, and governance.
- `src/lib/api/midgard.ts` and `src/lib/api/thornode.ts` — Live data clients with source/degraded-state results.
- `src/lib/content/registry.ts` — Central navigation, search, and content metadata registry.
- `src/components/` — Header, Footer, shared UI primitives, and live status surfaces.
- `Dockerfile` + `ansible-playbook.yml` — Production self-hosted deployment (see below).

For release-shaped local runtime checks after `npm run build`, use `npm run start:standalone` or `npm run smoke:standalone` rather than `next start`.

## Contributing

We welcome improvements! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to edit existing pages or add new ones
- How to update the curated data (incidents, ecosystem projects, research, etc.)
- Local development workflow
- PR expectations and CI checks

## Deployment

- **Production**: Self-hosted via Docker (standalone Next.js output) + Ansible on a VPS.
- **CI**: GitHub Actions audits production dependencies, lints, type-checks, runs unit tests, builds, and runs Playwright smoke tests.
- **Images**: GHCR images are deployed by immutable digest, not mutable `latest`.
- **Health, readiness, and version checks**: The site exposes `/api/health`, `/api/ready`, and `/api/version`. `/api/health` is liveness-only; `/api/ready` carries upstream source confidence. Ansible keeps the Docker health check on liveness and verifies health, version, image, and runtime metadata. Rollback uses the previous `/api/version` readback with Docker env fallback, verifies restored metadata, then fails closed after rollback attempts.

Recommended local release-shaped gate:

```bash
nvm use
df -h /System/Volumes/Data # stop if free space is below 50 GiB
npm run check:content
npm run check:live-snapshot
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

`npm run test:e2e` starts a fresh standalone server by default. To test an already running standalone server or a remote deployment instead, set `PLAYWRIGHT_BASE_URL`, for example:

```bash
PLAYWRIGHT_BASE_URL=https://wiki.thorchain.no npm run test:e2e
```

The deployment setup preflights a candidate container on localhost before replacing the live container. It is still not a full blue/green traffic switch, but bad image/version/readiness-shape candidates are rejected before the existing container is touched, and rollback is attempted if replacement health or version readback fails.

## Tech Stack

- Next.js 16 (App Router) + React 19
- Tailwind v4 with custom OKLCH dark-only design system
- TypeScript (strict)
- Recharts for live statistics
- Lunr for registry-backed client-side search
- Self-hosted Docker + Ansible (no Vercel dependency in production)
- Vitest unit tests + Playwright smoke tests

## Status & Direction

This project is in active evolution toward a deeper community wiki with more original, long-form articles while preserving its strength as a clean, fast reference + live dashboard.

Current focus areas:
- Source-backed protocol content with explicit freshness/confidence metadata
- Conservative current-only wording for live protocol state
- Better coverage of Mimir, halts, TCY, THORFi history, App Layer, and incident history
- Reliable local and CI verification

## License

MIT.

---

*Not affiliated with THORChain. Live data is current-only from Midgard and THORNode sources; curated content should stay dated and source-linked.*
