# Contributing to THORChain Wiki

Thank you for helping make THORChain more accessible! This guide explains how to contribute effectively.

## Quick Start

1. Fork the repo and clone your fork.
2. `npm install`
3. `npm run dev` — site runs at http://localhost:3000
4. Make changes, run `npm run lint && npm run build` locally.
5. Open a PR. CI will run lint + build + typecheck.

## How Content Works Today

Most of the site is **curated, hand-written content** in React components:

- **Section pages** (`/protocol`, `/network`, `/economics`, `/governance`, `/ecosystem`, `/rune`, `/tcy`, etc.) live in `src/app/*/page.tsx`.
- **Curated data** (chains, ecosystem projects, security incidents, research reports, governance proposals, milestones) lives in `src/lib/data/static.ts`. This is the single source of truth for lists, history, and references.
- **Live data** (pooled RUNE, APY, node counts, earnings history) comes from the Midgard API via `src/lib/api/midgard.ts`.

There is **no CMS or MDX yet**. We are planning to introduce richer original articles (see "Future Direction" below).

## Common Contribution Tasks

### Edit an existing overview page
- Open the relevant file under `src/app/<section>/page.tsx`.
- Follow the existing card + section header patterns and use the design tokens from `globals.css` (`bg-surface-elevated`, `text-accent`, `border-border`, `text-rune`, etc.).
- Keep explanations concise and accurate. Link out to official docs where deeper technical detail exists.

### Update curated data (incidents, ecosystem, research, milestones, etc.)
- Edit `src/lib/data/static.ts`.
- Add proper dates (avoid `2025-02-XX` placeholders).
- For security incidents, include clear "lessons" — this is one of the highest-value parts of the wiki.
- For ecosystem projects, keep chain lists reasonably up-to-date.

### Add a new top-level section
1. Create `src/app/new-section/page.tsx`.
2. Add a navigation item in both `src/components/Header.tsx` and `src/components/Footer.tsx` (or extract a shared list if duplication becomes painful).
3. Add a short entry in the search index in `src/app/search/page.tsx` (we are improving this soon).
4. Update the home page "Explore" grid if appropriate.

### Improve live data or charts
- Work in `src/lib/api/midgard.ts` and the consuming pages (`src/app/page.tsx` and `src/app/stats/page.tsx`).
- We are moving toward consistent SWR usage + better error/loading states.

## Style & Quality Guidelines

- **Design system first**: Use the custom tokens. The stats page is the current outlier — we are fixing it.
- **Mobile-first responsive**: The site already works well on small screens; keep it that way.
- **Accuracy over hype**: THORChain has a complex and sometimes dramatic history. Be factual and balanced, especially around incidents and THORFi.
- **Link generously** to official sources rather than duplicating deep technical content.
- Run `npm run lint && npm run build` before pushing.

## CI & Quality Gates

Every PR runs:
- ESLint (web-vitals + TypeScript rules)
- TypeScript type checking (`tsc --noEmit`)
- Full production build

The "Build & publish image" job only runs on pushes to `main`.

## Future Direction

We are intentionally evolving from a high-quality curated portal + live dashboard into a deeper community wiki with more original, long-form articles, diagrams, and explainers.

This will likely involve:
- Introducing MDX or a lightweight content layer
- A significantly better search experience (full-text + static data)
- More component extraction for maintainability

If you're interested in the deeper content direction, please open an issue or discussion first so we can coordinate.

## Questions?

Open an issue with the `question` label or start a Discussion. We're happy to help you find the right place to contribute.

---

Thanks again for contributing. Clear, accurate, well-presented information helps the entire THORChain ecosystem.