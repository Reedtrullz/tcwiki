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

This project requires Node 22. The npm install path enforces the `package.json` engine range, and app/proof scripts also fail fast with `scripts/require-node22.mjs`; run `nvm use` before local development or release evidence.

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
- **Health, readiness, and version checks**: The site exposes `/api/health`, `/api/ready`, and `/api/version`. `/api/health` is liveness-only; `/api/ready` carries upstream source confidence, RUNEPool/POL status, RUNEPool/POL source posture at `sources.thornode.runePoolPol`, and strict runtime identity diagnostics when `RUNTIME_METADATA_REQUIRED=1`. Ansible keeps the Docker health check on liveness and verifies health, version, image digest, commit metadata, and runtime diagnostics. Rollback uses the previous `/api/version` readback with Docker env fallback, verifies restored metadata, then fails closed after rollback attempts.
- **Runtime headers**: Production deploys are configured to emit nonce-based `Content-Security-Policy` by default. Set `CSP_ENFORCE=0` only as an explicit rollback/diagnostic escape hatch, and keep enforced CSP smoke coverage green before shipping.

Recommended local release-shaped gate:

```bash
nvm use
df -h /System/Volumes/Data # stop if free space is below 50 GiB
npm run check:release-tracked # fails if release proof commands point at local-only proof files
npm run check:content
npm run check:live-snapshot # pinned same-provider THORNode supported-chain drift check
npm run check:live-snapshot -- --artifact .artifacts/live-source-drift/local.json # optional durable drift evidence
npm run audit:prod
npm run audit:all
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run smoke:docker # builds and probes a local Docker candidate; set SKIP_DOCKER_BROWSER_SMOKE=1 to skip the narrow browser lane
npm run test:e2e:visual # focused route overflow / first-viewport visual safety smoke
npm run test:e2e:links # rendered internal links, anchors, and hydration/runtime console crawl
npm run test:e2e
npm run test:e2e:csp
CHECK_BASE_URL=https://wiki.thorchain.no REQUIRE_RUNTIME_METADATA=1 CSP_ENFORCE=1 npm run check:runtime-url # public runtime/header drift probe
IMAGE_REF=ghcr.io/example/tcwiki@sha256:1111111111111111111111111111111111111111111111111111111111111111 APP_VERSION=1111111111111111111111111111111111111111 ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```

`npm run smoke:docker` builds a local image with strict runtime metadata, runs it on a free localhost port with enforced CSP, probes `/api/health`, `/api/version`, `/api/ready`, security headers, and then runs the narrow `@docker-smoke` browser lane against that same container. Set `DOCKER_SMOKE_PULL=1` to refresh the base image, `SKIP_DOCKER_BROWSER_SMOKE=1` for the API/header-only pass, or `DOCKER_SMOKE_KEEP_IMAGE=1` when debugging the built image.

`npm run check:release-tracked` verifies that release-proof package scripts, CI wiring, release docs, and their local script/spec dependencies do not point at local-only proof files. Run it before treating local release evidence as ship-ready, especially after adding new scripts, Playwright specs, or shared test helpers. CI runs the same trackedness audit before the rest of the release-shaped app gate.

PR CI builds and scans the candidate Docker image, then runs the same `npm run smoke:docker` helper in prebuilt-image mode against the scanned tag exposed at `http://127.0.0.1:3011`. On pushes to `main`, CI publishes the scanned digest, pulls that immutable digest in a fresh `Smoke published image` job, and runs the same runtime/header/browser smoke before Ansible can deploy it. That lane is intentionally narrow: health/version/ready metadata, the shared readiness contract, security headers, the Home first-screen smoke, and one mocked loaded-state smoke each for Network, Dynamic Fees, Economics RUNEPool/POL, and Stats, not the full Playwright suite. The visual lane lives in `tests/visual-safety.spec.ts` plus the deep-dive visual checks. The rendered link lane crawls public sitemap routes in `tests/link-integrity.spec.ts`, verifies same-origin links and anchors, and fails on hydration/framework console problems. Page-specific journeys live in page-named specs so failures point at the feature area.

`npm run test:e2e` starts a fresh standalone server by default and fails closed when source files are newer than `.next/standalone/server.js`. Run `npm run build` first for standalone proof, or use `PLAYWRIGHT_WEB_SERVER_COMMAND='npm run dev' npm run test:e2e -- <spec>` for source-mode browser checks while iterating. To test an already running standalone server or a remote deployment instead, set `PLAYWRIGHT_BASE_URL`, for example:

```bash
PLAYWRIGHT_BASE_URL=https://wiki.thorchain.no npm run test:e2e
```

The deployment setup preflights a candidate container on localhost before replacing the live container. It is still not a full blue/green traffic switch, but bad image/version/strict readiness contract candidates (`/api/ready?contract=strict`) are rejected before the existing container is touched, and rollback is attempted if replacement health or version readback fails.

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
