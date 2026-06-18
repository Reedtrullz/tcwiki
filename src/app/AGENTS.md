# src/app/ — Route Layer Guide

## OVERVIEW
App Router route tree for the THORChain wiki: every user-facing page, layout, metadata entry, and API route lives here.

## STRUCTURE
```
src/app/
├── layout.tsx
├── page.tsx
├── api/health/route.ts
├── api/version/route.ts
├── api/csp-report/route.ts
├── search/page.tsx
├── stats/page.tsx
├── deep-dives/[slug]/page.tsx
└── [section]/page.tsx
```

## WHERE TO LOOK
| Task | Location | Notes |
|---|---|---|
| Add/edit a top-level wiki page | `src/app/[section]/page.tsx` | One route directory per topic area. |
| Change the home page | `src/app/page.tsx` | Live stats + curated previews. |
| Update shared app shell | `src/app/layout.tsx` | Metadata, fonts, dark mode, Header/Footer. |
| Edit search behavior | `src/app/search/page.tsx` + `src/lib/search/registry.ts` | Client-side Lunr UX; documents come from registry, MDX, and curated records. |
| Add/update a deep-dive route | `src/app/deep-dives/[slug]/page.tsx` | Thin wrapper around MDX content using `DeepDiveShell`. |
| Update health/version endpoints | `src/app/api/health/route.ts`, `src/app/api/version/route.ts` | Must stay minimal, cacheless, and useful for container/deploy checks. |
| Fix the stats page styling | `src/app/stats/page.tsx` | Currently the main design-system outlier. |

## CONVENTIONS
- Use App Router only; do not add or reference a `pages/` directory.
- Route files should use supported extensions only: `js`, `jsx`, `md`, `mdx`, `ts`, `tsx`.
- Wrap all page content in `PageContainer` for consistent route spacing.
- Deep-dive route wrappers import MDX from `content/deep-dives/[slug].mdx` via relative paths like `../../../../content/deep-dives/[slug].mdx`.
- Deep-dive pages should use `DeepDiveShell` so source/review metadata stays registry-driven.
- Keep `api/health` and `api/version` cacheless and small; do not expand them into general-purpose APIs.
- Preserve `output: "standalone"` assumptions when editing route code that affects Docker deployment.

## ANTI-PATTERNS
- Do not create `pages/` routes or legacy Next.js routing files.
- Do not bypass `PageContainer` unless a route has a documented exception.
- Do not move MDX article content into `src/app/`; keep source articles in `content/deep-dives/`.
- Do not expand health/version endpoints into general-purpose APIs.
- Do not introduce new styling patterns on `stats/page.tsx` that diverge further from the shared UI system.
