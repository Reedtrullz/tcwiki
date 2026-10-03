# Contributing to THORChain Wiki

Thank you for helping make THORChain more accessible! This guide explains how to contribute effectively.

## Quick Start

1. Fork the repo and clone your fork.
2. `nvm use` — this project requires Node 22. npm enforces the engine range, and app/proof scripts fail fast with `scripts/require-node22.mjs` if an older runtime is active.
3. `npm ci --include=optional`
4. `npm run dev` — site runs at http://localhost:3000
5. Make changes, then run the local gate below before opening a PR.

```bash
nvm use
df -h /System/Volumes/Data # inspect available capacity before substantial builds
npm run check:release-tracked # fails if release proof commands point at local-only proof files
npm run check:content
npm run check:live-snapshot
npm run check:live-snapshot -- --artifact .artifacts/live-source-drift/local.json # optional bounded JSON evidence
npm run audit:prod
npm run audit:all
npm run typecheck
npm run test:unit
npm run lint
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run smoke:docker # builds and probes the local Docker candidate
npm run test:e2e:visual
npm run test:e2e:links
npm run test:e2e:csp
npm run test:e2e
CHECK_BASE_URL=https://wiki.thorchain.no REQUIRE_RUNTIME_METADATA=1 CSP_ENFORCE=1 npm run check:runtime-url # public runtime/header drift probe
IMAGE_REF=ghcr.io/example/tcwiki@sha256:1111111111111111111111111111111111111111111111111111111111111111 APP_VERSION=1111111111111111111111111111111111111111 ansible-playbook -i inventory/hosts.yml ansible-playbook.yml --syntax-check
```

`npm run test:e2e` starts a fresh standalone server by default and fails closed when relevant input contents or the server artifact differ from the build receipt, including preserved-mtime changes and deleted inputs. Run `npm run build` first for standalone proof, or use `PLAYWRIGHT_WEB_SERVER_COMMAND='npm run dev' npm run test:e2e -- <spec>` for source-mode browser checks while iterating. Set `PLAYWRIGHT_BASE_URL` only when you intentionally want to test an existing local standalone server or a remote deployment. The focused visual lane uses `tests/visual-safety.spec.ts` plus deep-dive visual checks. The focused rendered-link lane uses `tests/link-integrity.spec.ts` to crawl public sitemap routes, verify same-origin links and anchors, and catch hydration/framework console errors. Page-specific browser journeys should live in page-named specs.

Most app and release-proof npm scripts start with the Node 22 guard. If a command reports `THORChain Wiki requires Node.js 22.x`, run `nvm use` from the repository root and rerun the command instead of treating the failed proof as an application result.

Before opening or shipping a PR that changes release scripts, CI wiring, browser specs, or proof docs, run `npm run check:release-tracked`. It fails when package scripts, CI, release docs, or their local script/spec dependencies reference local-only proof files that have not been tracked by git. CI runs the same trackedness audit before the rest of the release-shaped app gate.

CI will run audits, content checks, lint, typecheck, unit tests, both target builds, artifact-bound Cloudflare browser proof, standalone smoke in report-only and enforced CSP modes, Playwright, enforced CSP browser smoke, PR-only Docker image build/scan/runtime plus Ansible syntax checks, and a main-push published-digest Docker smoke before deploy. The deploy playbook probes the candidate's strict readiness contract at `/api/ready?contract=strict` before replacing the live container. Scheduled/manual drift checks also verify live-source snapshots, upload a bounded JSON drift-evidence artifact, and check public runtime headers with enforced CSP expected for production.

For PRs, CI builds and scans the candidate Docker image, then runs the same `npm run smoke:docker` helper in prebuilt-image mode against the scanned tag on `http://127.0.0.1:3011`. For pushes to `main`, CI publishes the scanned digest, pulls that immutable digest in a fresh `Smoke published image` job, and runs the same Docker runtime smoke before the deploy job is allowed to start. Locally, `npm run smoke:docker` performs the same shape of proof by building an image, running it on a free localhost port with strict runtime metadata and enforced CSP, probing health/version/ready/security headers, and then running the narrow browser lane. The Docker smoke covers health/version/ready metadata, the shared readiness contract including `sources.thornode.runePoolPol` RUNEPool/POL status and RUNEPool/POL source posture, security headers, the Home first-screen render, and one mocked loaded-state smoke each for Network, Dynamic Fees, Economics RUNEPool/POL, and Stats; it is intentionally small and does not replace the full standalone Playwright suite.

## How Content Works Today

Most of the site is **curated, hand-written content** in React components and MDX:

- **Section pages** (`/protocol`, `/network`, `/economics`, `/governance`, `/ecosystem`, `/rune`, `/tcy`, etc.) live in `src/app/*/page.tsx`.
- **MDX deep dives** live in `content/deep-dives/*.mdx`, with wrappers under `src/app/deep-dives/*/page.tsx`.
- **Curated data** (chains, ecosystem projects, security incidents, research reports, governance records, milestones) lives in `src/lib/data/static.ts` as sourced records with freshness/confidence metadata.
- **Live data** comes from Midgard and THORNode via `src/lib/api/midgard.ts` and `src/lib/api/thornode.ts`.
- **Navigation and search metadata** lives in `src/lib/content/registry.ts`.

## Source Posture & Reader Paths Checklist

The wiki now treats source posture, search journeys, and deep-dive paths as part of the content contract. When changing page claims or adding content, update the supporting metadata instead of patching visible copy alone:

- Update the matching `CONTENT_ENTRIES` record when a page title, claim surface, confidence label, source set, review date, or review cadence changes.
- Keep `RouteSourcePosture` on static education/reference routes and refresh its `useFor` and `verifyBeforeClaiming` copy when the page purpose changes.
- Add or update `TASK_INTENT_GUIDES` when a common reader job, task-search phrase, or answer anchor changes.
- Add or update `DEEP_DIVE_READER_PATHS` when a deep dive changes the recommended reading order, audience, follow-up checks, or current-state caveats.
- Preserve source-map `decision`, `claimExamples`, and `nonClaims` whenever adding a source family or changing how a source should be used.
- Keep ecosystem `useFor` and `verifyBeforeUse` fields specific; this directory is a source-listed pointer list, not an endorsement or safety review.
- Run `npm run check:content` after registry, source-map, glossary, deep-dive, task-guide, or route-anchor changes.
- Add focused unit or Playwright coverage when a visible journey, anchor, source label, or search result path changes.

## A focused correction and review example

Use the [source correction template](.github/ISSUE_TEMPLATE/source-correction.md) for editorial changes and the [runtime defect template](.github/ISSUE_TEMPLATE/runtime-defect.md) for a visible failure. The [PR template](.github/PULL_REQUEST_TEMPLATE.md) separates source evidence, artifact proof and acceptance. Choose the checks that exercise the change; a spelling correction does not need a live financial inquiry. CI remains the complete repository gate.

For example, a hypothetical correction to the Mimir halt guide would record:

- Record: `deep-dive-mimir-halt-controls`, `/deep-dives/mimir-halt-controls#what-mimirs-can-prove`, `content/deep-dives/mimir-halt-controls.mdx`.
- Claim: distinguish raw halt values from a route executing successfully. Proposed wording preserves the current-only limitation and existing anchor.
- Evidence: link the relevant primary THORNode control implementation at an immutable revision and its exact section. Record when that source was observed and when the claim was reviewed; neither is the event date or build date.
- Decision: state whether the cited revision supports the wording, which versions it covers and which execution evidence is absent. Keep conflicting evidence explicit. Update only the reviewed record/claim date; a fetch does not review the whole article.
- Implementation: edit the MDX and relevant source/registry metadata. Run `npm run generate:search` and `npm run check:content`, then the source-label/anchor tests that cover the claim. Test the rendered guide and search destination on the serving runtime if a reader path changes. Record exact commands and failures, rather than copying a generic list as completed proof.

This is a workflow example, not a newly approved protocol claim. A reviewer should be able to open the stated record and primary evidence, reproduce the changed reader path, and identify any remaining content acceptance.

For a new article, add `content/deep-dives/<slug>.mdx`, its thin `src/app/deep-dives/<slug>/page.tsx` wrapper through `DeepDiveShell`, and a content-registry entry with source/review metadata. Update the relevant reader path; regenerate search and check content so navigation, search, public anchors and sitemap stay aligned. Reuse the existing pattern instead of a scaffolding generator.

For application behavior, run focused units, typecheck and lint, then build and exercise the affected visible states on the named runtime. Next proof uses `npm run build`, `npm run smoke:standalone` and the default standalone browser lane. Cloudflare proof uses `npm run build:cloudflare`, the manifest-validating `node scripts/start-cloudflare-candidate.mjs` launcher and an explicit `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3015 PLAYWRIGHT_RUNTIME=cloudflare CSP_ENFORCE=1 npm run test:e2e -- <affected-spec> --project=chromium --workers=1`. Dry-run uploads do not prove hydration. Separate production readback and owner release approval from either local lane.

Preserve author/source attribution and identify externally quoted material. The repository's rights inventory and owner licensing decision must govern redistribution; this guide grants no additional rights to third-party material.

## Common Contribution Tasks

### Edit an existing overview page
- Open the relevant file under `src/app/<section>/page.tsx`.
- Follow the existing card + section header patterns and use the design tokens from `globals.css` (`bg-surface-elevated`, `text-accent`, `border-border`, `text-rune`, etc.).
- Keep explanations concise and accurate. Link out to official docs where deeper technical detail exists.
- If the route is a static education/reference page, keep the registry-backed source posture visible and source dates current.

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
- Run the full local gate from Quick Start before pushing substantial changes.

## CI & Quality Gates

Every PR runs:
- Production dependency audit (`npm run audit:prod`)
- Curated content and generated search checks (`npm run check:content`)
- ESLint (web-vitals + TypeScript rules)
- TypeScript type checking (`tsc --noEmit`)
- Vitest unit tests
- Full production build
- Standalone server smoke tests
- Playwright smoke tests
- Docker image build, runtime/header probe, narrow Docker browser smoke, and Ansible syntax validation for PRs
- Published digest pull plus Docker runtime/browser smoke before main deploys

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
