# THORChain Wiki

Community-maintained encyclopedia and reference for the THORChain protocol — architecture, economics, governance, ecosystem, and live network data.

**Live site**: [wiki.thorchain.no](https://wiki.thorchain.no)

## What this is

A focused, high-signal resource that complements the official THORChain documentation. It provides:

- Clear overviews of protocol mechanics, tokenomics, and security model
- Curated history (security incidents with lessons, governance milestones, research)
- Live network statistics and charts (powered by Midgard)
- An ecosystem directory and quick links to the best official resources

The goal is to make THORChain more approachable for users, node operators, developers, and researchers without duplicating the full depth of the official docs.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

- `src/app/` — All page content (mostly React Server Components + client islands for live data)
- `src/lib/data/static.ts` — Curated content (chains, ecosystem, incidents, milestones, research, governance). This is the main "wiki" data source today.
- `src/lib/api/midgard.ts` — Resilient client for live network data (failover across endpoints).
- `src/components/` — Header, Footer, and (future) shared UI primitives.
- `Dockerfile` + `ansible-playbook.yml` — Production self-hosted deployment (see below).

## Contributing

We welcome improvements! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to edit existing pages or add new ones
- How to update the curated data (incidents, ecosystem projects, research, etc.)
- Local development workflow
- PR expectations and CI checks

## Deployment

- **Production**: Self-hosted via Docker (standalone Next.js output) + Ansible on a VPS.
- **CI**: GitHub Actions builds, lints, type-checks, and publishes images to GHCR on every push to `main`.
- **Health checks**: The site exposes `/api/health`; Ansible uses this for zero-downtime-ish rollouts with automatic rollback on failure.

The deployment setup is intentionally simple and production-grade. We prefer to keep changes to the Ansible side minimal.

## Tech Stack

- Next.js 16 (App Router) + React 19
- Tailwind v4 with custom OKLCH dark-only design system
- TypeScript (strict)
- Recharts for live statistics
- Lunr (client-side search — being improved)
- Self-hosted Docker + Ansible (no Vercel dependency in production)

## Status & Direction

This project is in active evolution toward a deeper community wiki with more original, long-form articles while preserving its strength as a clean, fast reference + live dashboard.

Current focus areas (see the improvement plan in the repo session notes for details):
- Visual and component consistency
- Much stronger in-site search
- Better contributor experience and documentation
- Gradual introduction of richer original content

## License

MIT (or project default — update as appropriate).

---

*Not affiliated with THORChain. Data sourced from the public Midgard API and community research.*