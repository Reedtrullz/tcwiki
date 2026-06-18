# THORChain Wiki — Project Knowledge Base

**Generated:** 2026-06-18
**Branch:** codex/thorchain-wiki-remediation

## OVERVIEW

Community wiki for THORChain protocol. Next.js 16 App Router + React 19 + Tailwind v4. Dark-only design system. Self-hosted Docker + Ansible. No CMS — all content is curated React/MDX.

## STRUCTURE

```
.
├── src/app/              # Routes (see src/app/AGENTS.md)
│   ├── page.tsx          # Home (live stats + curated previews)
│   ├── layout.tsx        # Root shell (Header + Footer)
│   ├── deep-dives/       # Long-form MDX articles (thin wrappers)
│   ├── api/health/       # Docker/Ansible health check with version metadata
│   ├── api/version/      # Runtime version/image endpoint
│   └── [section]/        # Protocol, Network, Economics, etc.
├── src/lib/              # Domain logic (see src/lib/AGENTS.md)
│   ├── api/midgard.ts    # Live data client (failover endpoints)
│   ├── data/static.ts    # Curated wiki data (single source of truth)
│   ├── hooks/            # SWR hooks for live data
│   └── types.ts          # All shared types
├── src/components/       # UI primitives
│   ├── ui/               # Design-system components (Card, StatCard, Badge, FreshnessMeta)
│   ├── layout/           # PageContainer, Header, Footer
│   └── features/         # Page-specific sections (scaffolded)
├── content/deep-dives/     # MDX article source files
├── .github/workflows/ci.yml
├── Dockerfile              # Multi-stage, standalone output
├── ansible-playbook.yml    # VPS deploy + health/version-gated rollback
└── inventory/hosts.yml       # Deploy target
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Edit a section page | `src/app/[section]/page.tsx` | One file per section |
| Add/update curated data | `src/lib/data/static.ts` | Chains, ecosystem, incidents, research, milestones, governance |
| Work with live data | `src/lib/api/midgard.ts` | Midgard failover client. Follow Heimdall conventions |
| Add a new deep-dive article | `content/deep-dives/` + `src/app/deep-dives/[slug]/page.tsx` | See MDX wrapper pattern below |
| Update navigation | `src/lib/content/registry.ts` | Header, footer, home, and deep-dive listings are registry-driven |
| Update search index | `src/lib/search/registry.ts` + generated MDX docs | Run `npm run generate:search` after article edits |
| Update types | `src/lib/types.ts` | All domain types live here |
| Change design tokens | `src/app/globals.css` | OKLCH custom properties |
| Add a shared UI component | `src/components/ui/` | No business logic. Use design tokens only |
| Change deploy config | `Dockerfile`, `ansible-playbook.yml`, `inventory/hosts.yml` | Minimal changes preferred |

## CONVENTIONS

**Routing**
- Next.js App Router. No `pages/` directory.
- Deep-dive articles live in `content/deep-dives/*.mdx`, NOT co-located with routes.
- Route wrappers in `src/app/deep-dives/[slug]/page.tsx` import MDX via `../../../../content/deep-dives/[slug].mdx` and render through `DeepDiveShell` for source/review/edit metadata.
- All route pages use `PageContainer` for consistent `pt-[52px] py-16 px-6` layout.

**Design System**
- Dark-only. No light mode.
- Custom OKLCH tokens in `globals.css`: `surface`, `surface-elevated`, `border`, `accent`, `rune`.
- Use `bg-surface-elevated`, `border-border`, `text-accent`, `text-rune`.
- Stats page is currently an outlier — follow `ui/` component patterns, not stats page styles.

**Data**
- All curated data uses `withFreshness()` helper in `static.ts`.
- Confidence levels: `official`, `curated`, `historical`, `needs-review`.
- Live data: SWR hooks with `refreshInterval: 60000`, `revalidateOnFocus: false`.
- RUNE units are `1e8` (divide by `1e8` for display).
- Follow Heimdall conventions at `/Users/reidar/Projectos/Heimdall/docs/thorchain-data-conventions.md` for Midgard endpoint order, APY display, and `current-only` provenance wording.

**TypeScript**
- Strict mode. No `as any`. No `@ts-ignore`.
- Path alias: `@/*` → `./src/*`.
- No `index.ts` barrel files in subdirectories.

## ANTI-PATTERNS

- `as any` or `@ts-ignore` — forbidden.
- Empty catch blocks — forbidden.
- Adding generic component libraries — use existing `ui/` primitives.
- Duplicating curated data — everything static lives in `src/lib/data/static.ts`.
- Co-locating MDX with routes — use `content/deep-dives/`.
- Adding `npm test` — use the explicit `test:unit` and `test:e2e` scripts.

## COMMANDS

```bash
npm run dev     # localhost:3000
npm run lint    # eslint (next vitals + TS)
npm run typecheck # TypeScript strict check
npm run test:unit # Vitest unit tests
npm run test:e2e  # Playwright smoke tests
npm run check:content # curated data + generated MDX search checks
npm run audit:prod # production dependency audit
npm run build   # next build → standalone output
npm run start:standalone # serve built standalone output locally
npm run smoke:standalone # probes .next/standalone health/version/headers after build
```

## NOTES

- CI runs content checks, production audit, lint, typecheck, unit tests, build, standalone smoke, and Playwright.
- Docker multi-stage build uses `output: "standalone"`. Health check hits `/api/health`; release smoke also probes `/api/version` and security headers.
- Ansible deploys immutable digest/SHA image refs from CI. Do not reintroduce mutable `latest` deploys.
- `content/deep-dives/` is outside `src/` — intentional. MDX pages are imported via relative paths.
- Component architecture is partially scaffolded. `ui/`, `layout/`, `features/` have READMEs with target architecture.
- No `.editorconfig` or `.eslintrc` — uses `eslint.config.mjs` with Next.js defaults.
- No `npm test` script in `package.json`.
