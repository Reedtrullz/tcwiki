# Contributing to THORChain Wiki

Thank you for helping make THORChain more accessible! This guide explains how to contribute effectively.

## Quick Start

1. Fork the repo and clone your fork.
2. `npm ci --include=optional`
3. `npm run dev` — site runs at http://localhost:3000
4. Make changes, run `npm run lint && npm run typecheck && npm run test:unit && npm run build` locally.
5. Open a PR. CI will run audit, lint, typecheck, unit tests, build, and Playwright smoke tests.

## How Content Works Today

Most of the site is **curated, hand-written content** in React components and MDX:

- **Section pages** (`/protocol`, `/network`, `/economics`, `/governance`, `/ecosystem`, `/rune`, `/tcy`, etc.) live in `src/app/*/page.tsx`.
- **MDX deep dives** live in `content/deep-dives/*.mdx`, with wrappers under `src/app/deep-dives/*/page.tsx`.
- **Curated data** (chains, ecosystem projects, security incidents, research reports, governance records, milestones) lives in `src/lib/data/static.ts` as sourced records with freshness/confidence metadata.
- **Live data** comes from Midgard and THORNode via `src/lib/api/midgard.ts` and `src/lib/api/thornode.ts`.
- **Navigation and search metadata** lives in `src/lib/content/registry.ts`.

## Common Contribution Tasks

### Edit an existing overview page
- Open the relevant file under `src/app/<section>/page.tsx`.
- Follow the existing card + section header patterns and use the design tokens from `globals.css` (`bg-surface-elevated`, `text-accent`, `border-border`, `text-rune`, etc.).
- Keep explanations concise and accurate. Link out to official docs where deeper technical detail exists.

### Update curated data (incidents, ecosystem, research, milestones, etc.)
- Edit `src/lib/data/static.ts`.
- Add proper dates (avoid `2025-02-XX` placeholders).
- Include source URLs, confidence, and review dates through the sourced-record helpers.
- For security incidents, include clear "lessons" — this is one of the highest-value parts of the wiki.
- For ecosystem projects, keep chain lists aligned with live inbound-address checks and do not imply actions are currently open.

### Add a new top-level section
1. Create `src/app/new-section/page.tsx`.
2. Add a content entry in `src/lib/content/registry.ts`.
3. The header, footer, home explore grid, and search index consume the registry.
4. Update the home page "Explore" grid if appropriate.

### Improve live data or charts
- Work in `src/lib/api/midgard.ts` and the consuming pages (`src/app/page.tsx` and `src/app/stats/page.tsx`).
- Use `LiveDataResult<T>` and source/degraded-state copy. Do not convert unavailable upstream data into zero values.

## Style & Quality Guidelines

- **Design system first**: Use the custom tokens. The stats page is the current outlier — we are fixing it.
- **Mobile-first responsive**: The site already works well on small screens; keep it that way.
- **Accuracy over hype**: THORChain has a complex and sometimes dramatic history. Be factual and balanced, especially around incidents and THORFi.
- **Current-only where needed**: Halt flags, inbound addresses, gas rates, fees, APYs, node counts, Mimir values, constants overrides, TCY state, and RUNEPool/POL data are live facts.
- **Link generously** to official sources rather than duplicating deep technical content.
- Run `npm run lint && npm run typecheck && npm run test:unit && npm run build` before pushing.

## CI & Quality Gates

Every PR runs:
- Production dependency audit (`npm run audit:prod`)
- ESLint (web-vitals + TypeScript rules)
- TypeScript type checking (`tsc --noEmit`)
- Vitest unit tests
- Full production build
- Playwright smoke tests

The "Build & publish image" job only runs on pushes to `main`.

## Future Direction

We are intentionally evolving from a high-quality curated portal + live dashboard into a deeper community wiki with more original, long-form articles, diagrams, and explainers.

This will likely involve:
- More source-backed MDX explainers
- More protocol-data validation scripts
- More component extraction for maintainability

If you're interested in the deeper content direction, please open an issue or discussion first so we can coordinate.

## Questions?

Open an issue with the `question` label or start a Discussion. We're happy to help you find the right place to contribute.

---

Thanks again for contributing. Clear, accurate, well-presented information helps the entire THORChain ecosystem.
