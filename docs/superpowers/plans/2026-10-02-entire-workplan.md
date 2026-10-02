# THORChain Wiki Entire Workplan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Work through all 69 published proposals in dependency order, shipping verified corrections first and then bounded reader/evidence pilots, with an explicit evidence-backed disposition for every proposal.

**Architecture:** Preserve curated React/MDX ownership and the existing API/trust/source registries. Extend the current Cloudflare forwarding Worker + WikiDO/vinext serving path, while keeping the supported Next standalone/Docker verification path and rollback evidence. Reuse current helpers and native browser behavior; avoid a CMS, new generic transport, rules engine, account system or graph platform.

**Tech Stack:** TypeScript, React 19, Next App Router, MDX, Tailwind 4, SWR, installed Vitest/Playwright/axe, vinext/Vite, Cloudflare Workers/Durable Objects, Node 22, GitHub Actions; Docker/Ansible for their existing supported verification/rollback role. Reconfirm installed versions at execution start.

**Spec:** All live proposal issues PR-01–PR-69, captured in [the source inventory](2026-10-02-entire-workplan-source.json); [original portfolio](../../proposals/2026-10-01-improvement-portfolio.md), [deeper portfolio](../../proposals/2026-10-01-deeper-improvement-portfolio.md), and [OP_RETURN additions/refinements](../../proposals/2026-10-02-opreturn-roadmap.md). Live issue acceptance and scope take precedence over old discovery evidence.

## Global Constraints

- This is an execution plan, not implementation or deployment authorization. This planning turn changes documents only. Later execution should use the then-current main and authorized scope.
- Preserve the dirty primary checkout. The inventory records 21 tracked-file hashes plus git status; untracked material is WIP too. Use an isolated checkout/worktree for implementation; do not reset, stash, switch or clean the owner's checkout.
- Inspect cleanup hooks before tests. Never delete authored/changed/tracked files, discard WIP or repin content dates to make checks green.
- All source/network facts need current primary review at implementation. Quote/parser success, requested height, source-chain confirmation and self-reported identity have limited meanings; none proves cross-chain settlement or universal availability.
- Preserve base-unit precision, unknown/missing/degraded states, warning compatibility, bounded requests, nonce CSP, accessible controls and static editorial ownership. No wallet/sign/send flows or retained reader-address history.
- Before long builds, check `df -h /System/Volumes/Data` and stop below 30 GiB. Use bounded scratch/build directories; retain required rollback and retirement evidence.
- Default to one implementation lane plus one independent editorial/UX lane. Serialize shared data types, THORNode, registry, generated content and CI/release edits. Agent route availability and quota must be checked under current policy if delegation is used; parallelism is optional.
- Full-text exports depend on owner-approved rights. Historical storage depends on an owner, capacity/retention and tested recovery. Human trial acceptance cannot be substituted with automated tests.

## Review Focus

1. Did the fix address the shared root cause and every caller without expanding its scope?
2. Do providers, units, periods, timing, requested/observed height and warnings survive normalization through UI/export/readiness?
3. Does proof exercise the actual serving artifact and target? Is promotion exclusive and rollback reproducible?
4. Are source/version and current-versus-historical claims reviewed, and accessibility/privacy preserved?
5. Did an optional pilot solve a named task without introducing unnecessary infrastructure?

---

## Current evidence and the first gate

The inventory was captured on 2 October 2026 from remote main `686b63b1b04f9f6c3045904a552c519a89cced91`. The primary local checkout is older (`798e344`) and dirty; its CURRENT_STATE.md is a historical local review, not today's serving-runtime proof.

[PR #205](https://github.com/Reedtrullz/tcwiki/pull/205) has merged. Its source already reassesses THORNode freshness after retrieval and at readiness delivery and limits reuse of fresh cached evidence. Reconcile PR-07/43 with those changes before designing another fix. This turn verified source changes, not production identity or the older rollout's reported probe results.

Current CI builds/dry-runs/saves a Cloudflare preview but runs its browser suite against standalone. Deployment currently rebuilds the Cloudflare artifact and hashes its entry file. These are the remaining boundaries for PR-14/15; neither starts another migration. The CI target conditions depend on repository variables, which must be read during preflight. Preserve the Cloudflare-primary retirement marker/backups/rollback image pending that verification.

Five dependency PRs remain open: [#130](https://github.com/Reedtrullz/tcwiki/pull/130), [#131](https://github.com/Reedtrullz/tcwiki/pull/131), [#133](https://github.com/Reedtrullz/tcwiki/pull/133), [#134](https://github.com/Reedtrullz/tcwiki/pull/134), [#135](https://github.com/Reedtrullz/tcwiki/pull/135). All show a failed build-check in the captured inventory. Inspected [#135 run 36819055759](https://github.com/Reedtrullz/tcwiki/actions/runs/36819055759) failed at `audit:prod`, before lint/tests/build. Do not assume the other failures share its cause or that their older heads reproduce on current main. PR-01 triages them; PR-17 resolves/group-supersedes updates after the runtime lane exists.

### Start here

- [ ] Read current root/nested AGENTS, installed framework docs, this plan, live issue deltas and current runtime/deploy configuration. Record the base SHA and open worktree/PR inventory.
- [ ] Create/reuse an isolated worktree from verified current main. Keep the planning/source documents available without copying dirty app/content files automatically.
- [ ] Inspect and complete PR-37's non-destructive test-hook slice before ordinary unit runs. Record installed versions and lockfile drift without changing the primary checkout.
- [ ] Establish a reproducible baseline in that worktree. Classify each failure as environment, existing defect, source drift or patch regression. A baseline failure is recorded and fixed by the corresponding issue, not waived silently.
- [ ] Compare each issue with merged changes (especially #205). Mark already-satisfied criteria with exact commit/test evidence; implement only the remainder.

## How to work each task

Use the task's issue as the scope, the paths below as entry points, and its named regressions as the completion check. Before touching a shared function, search every caller and trace transport → normalization → consumer. Proposed new files are handles, not a requirement to create modules if existing code fits.

For each bounded code slice: reproduce the issue with the smallest meaningful offline regression; make it fail for the right reason; fix at the shared boundary; pass that check; run the appropriate gate below; review the final diff; commit and prepare a focused PR linked to the issue. For documentation-only changes use source/content/link review rather than tests that mirror wording. Keep intentional safety copy assertions. No new test framework.

One PR per coherent contract is the default. Closely coupled acceptance may share a PR with separate issue evidence; split collection, UI and operational rollout when their proofs differ. A wave is a sequencing guide, not one enormous PR and not a requirement to block independent work until every item in the previous wave is done. Hard prerequisites and shared-file ownership control the actual schedule.

Use four recorded states: `queued`, `active`, `verified`, `decision-needed`. Every final disposition is either shipped with proof, already satisfied with proof, or deferred/declined with a named reason, owner and revisit trigger. Deferral is not implementation completion. Do not close a feature as delivered while human, license or operational gates remain open.

## Verification and release gates

**Focused gate:** after PR-37, use `npm run test:unit -- <existing-suite...>` for changed logic, plus `npm run lint` and `npm run typecheck` for application/script changes. The task list maps exact suite handles; explicitly proposed suites do not exist yet. Extend existing suites where possible. A meaningful test covers the observed defect or trust boundary, not a copy of implementation.

**Content gate:** for article/registry/source changes run `npm run generate:search`, `npm run check:content`, and relevant content/search/link checks. Inspect generated diff and actual rendered source/anchor behavior. Source capture is not editorial review; no blanket `ALLOW_OVERDUE_CONTENT` bypass after PR-02. Approved exceptions remain scoped and expire.

**Integration gate:** after coupled contracts or at a wave milestone, run on the actual final candidate:

```sh
npm run check:release-tracked
npm run audit:prod
npm run audit:all
npm run check:content
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run smoke:standalone
CSP_ENFORCE=1 npm run smoke:standalone
npm run test:e2e
npm run test:e2e:csp
npm run build:cloudflare
npx wrangler deploy --config wrangler.do.jsonc --dry-run
```

The existing browser setup uses standalone. In PR-14 add a documented invocation that starts and exercises the built Cloudflare/WikiDO candidate (not merely vite dev), with target/base URL, identity and retained artifact recorded. Until it exists, the commands above do **not** prove Cloudflare browser compatibility. Use existing fixtures for missing/slow providers, CSP, MDX/search/hydration, URL history and degraded UI. Dry-run is upload/config proof only. For Docker/deployment-input changes also run `npm run smoke:docker` and the existing Ansible syntax check, where that target is supported. An audit exception needs explicit current approval and expiry; no silent weakening.

**Release gate:** after an authorized merge/release, promote the tested artifact under PR-15, validate one active target, preserve the previous artifact/version, and use the existing runtime checker against the public domain and direct Worker URL with the exact expected SHA/ref. Check health, strict readiness/reasons, CSP, one affected rendered journey and rollback identity. Do not reroute to or recreate the retired VPS container as an incidental part of this plan. Run a bounded observation window with independent samples for timing/monitor changes; use dataset-specific limits, not a new universal TTL.

**Human/operational gate:** record actual participants and task outcomes for PR-22/34 and any pilot needing learning acceptance; record the owner decision for PR-61 and the capacity/retention/restore receipt for PR-35. Local tests, CI, live readback, protocol-source review and human acceptance are distinct evidence columns.

## File and interface map

| Area | Existing responsibility | Planned change boundary |
|---|---|---|
| Provider clients: `src/lib/api/{thornode,midgard,maya}.ts`, `trust.ts`, `live-result.ts`, `types.ts` | Fetch, normalize, preserve raw units/quality | Bounded inputs/deadlines; semantic evidence fields; keep old string-warning clients compatible |
| `readiness-snapshot.ts`, `src/app/api/ready/route.ts`, `scripts/lib/readiness-*`, host check | Cached readiness and independent monitoring | Reassess age; preserve original observation; strict identity/source contract; deduplicate actual observations |
| `operational-controls.ts`, `network-diagnostics.ts` | Reviewed control meaning and quote reconciliation | Version/activation scope and timed evidence; no generic rules engine |
| `daily-volume.ts`, `stats-dashboard.ts`, `data/dynamic-fees-helpers.ts` | Time-series and comparable metrics | Valid interval identity/cohorts, coverage and metric basis; avoid a generic timeseries layer |
| Content/source/search registries, MDX generator, MDX components | Authored evidence, discovery and fragments | Stable IDs; small claim cohort; one parse/anchor contract; bounded derived outputs |
| UI feature/layout primitives and explorer clients | Reader journeys and disclosures | Native details/hash/print, keyboard/focus, URL state and explicitly local tools |
| CI, runtime identity/trackedness/freshness scripts, Cloudflare entries/config | Build and release identity | Exercise production-shaped candidate, manifest all deploy inputs, promote once with exclusive target and rollback |

All exact source paths carried from issue evidence were checked against the captured main tree. Extra proposed locations must be verified during execution; current path names and supported APIs can change. Interface extensions for timing/pinning/exports must distinguish requested values from observed values and keep unknown explicit. Reuse existing type definitions; version persisted/exported data only at the output boundary that needs compatibility.

## Ordered waves and milestones

| Wave | Ordered proposals | Milestone / exit evidence |
|---|---|---|
| 0 — Establish a safe, current baseline | PR-01, PR-37, PR-02, PR-55, PR-59 | An isolated checkout can be verified without deleting authored files. Current runtime, CI blockers and editorial release exceptions are documented. |
| 1 — Correct the shared data and evidence contracts | PR-08, PR-03, PR-12, PR-39, PR-13, PR-06, PR-18 | Malformed data, numeric boundaries, warning semantics and expired quotes have deterministic conservative behavior. |
| 2 — Make collection, runtime proof and release reliable | PR-14, PR-53, PR-54, PR-15, PR-17, PR-56, PR-10, PR-11, PR-43, PR-07, PR-57, PR-44, PR-42, PR-51, PR-16, PR-45, PR-52 | Both supported targets have explicit proof; the Cloudflare candidate is exercised and identified. Collection timing, pinning and monitors preserve evidence boundaries. |
| 3 — Make analytics comparable and honest | PR-04, PR-38, PR-05, PR-09, PR-40, PR-41, PR-46, PR-65 | Time periods, coverage, valuation dates, fee cohorts and return basis are visible and tested. |
| 4 — Improve discovery, navigation and accessible recovery | PR-19, PR-24, PR-66, PR-20, PR-21, PR-25, PR-58, PR-26, PR-49, PR-50 | Keyboard and shared links work; search has an evaluated baseline; degraded/no-JavaScript journeys have useful source-qualified fallbacks. |
| 5 — Build the editorial evidence and learning content | PR-27, PR-28, PR-29, PR-30, PR-32, PR-31, PR-61, PR-23, PR-69, PR-67, PR-60 | A small reviewed claim cohort, editorial queue, change feed and real examples are usable. Licensing is an explicit owner decision. |
| 6 — Ship bounded learning and reuse pilots | PR-68, PR-34, PR-36, PR-22, PR-48, PR-47, PR-62 | Small local tools and exports meet named reader tasks. Human trials and licensing gates remain visible. |
| 7 — Add read-only transaction and provider investigation | PR-33, PR-63, PR-64 | One-hash triage, one allowlisted API recipe and a two-provider comparison preserve unknowns, timing and privacy. |
| 8 — Pilot historical operational evidence | PR-35 | A bounded recorded-history pilot has an owner, retention/quota budget, versioned schema and tested export/restore; gaps remain explicit. |

The order below intentionally strengthens a few prerequisites beyond the published minimum: PR-15 uses trackedness/identity checks; full PR-42/47/49 use the timing/pinning contracts; PR-68 uses reviewed PR-67 examples; PR-33 uses provider disclosure and bounded transport. These are execution dependencies for the chosen full slices, not new scope. Published “coordinate” links remain soft unless listed as prerequisites below. PR-30/31/29 could ship smaller independent slices earlier; this schedule uses their full reviewed-cohort versions.

PR-61 rights inventory and PR-35 ownership/budget investigation can start during Wave 0 without starting their gated implementation. PR-69 and verified PR-67 examples can also run in the editorial lane early after source review; they do not wait for a live transaction service. Pull forward independent high-priority corrections when this avoids delay, while preserving the prerequisites.

## Task checklist

Every proposal appears exactly once below. Complete shared execution/review gates in addition to the issue acceptance. For a source-only or decision task, the specified manual artifact is its verification; do not invent code/tests solely to tick a box.

### Wave 0 — Establish a safe, current baseline

#### PR-01 — Document the serving architecture and diagnose checkout drift

**Issue:** [#166](https://github.com/Reedtrullz/tcwiki/issues/166) · Foundation / Developer Experience / Operations; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `README.md`; `docs/operations.md`; `.github/workflows/ci.yml`; `cloudflare/do-entry.mjs`; `CURRENT_STATE.md (local-only review; do not treat as upstream truth)`; `wrangler.do.jsonc`; `playwright.config.ts`.

**Execution note:** Inventory local/main/artifact drift and the five open dependency PRs before installing or testing. Read current Cloudflare configs, repository deploy variables, installed framework docs and every relevant AGENTS.md. Record which commands exercise which target.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Date the current serving/rollback diagram; document Next local/Docker versus vinext/DO paths; add a small read-only preflight reporting HEAD, upstream divergence, dirty state, Node and installed-versus-lockfile key versions.
- [ ] Verify the acceptance: A new contributor can select the production-shaped verification command and understand what it proves. The diagnostic reports the observed local Vitest mismatch without changing files.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Record installed versions/audit or consumer search as appropriate; run both supported build targets for dependency changes.

**Stop at this boundary:** Documentation and diagnostic output only; no pulling into dirty work, installing dependencies, changing deploy variables or deleting rollback assets.

#### PR-37 — Make platform cleanup inspectable and preserve authored files

**Issue:** [#136](https://github.com/Reedtrullz/tcwiki/issues/136) · Developer Safety / Foundation; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `scripts/clean-platform-artifacts.mjs`; `package.json`; `tests/unit/platform-cleanup.test.ts (proposed; create only if no existing suite covers the boundary)`.

**Execution note:** Inspect the cleanup script before invoking any npm unit-test command, since pretest:unit currently calls it. Run the new safety regression directly with installed Vitest in an isolated fixture/checkout before changing that hook.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Make ordinary tests non-destructive. Report candidate numbered files; use an explicit cleanup action only for reviewed, identical, untracked duplicates. Retain narrowly recognized OS metadata cleanup if needed.
- [ ] Verify the acceptance: Isolated fixtures prove tracked files, nonidentical authored copies and untracked WIP survive the normal test command. Dry-run output names exact candidates; explicit removal is limited to reviewed identical duplicates.
- [ ] Run the new isolated-file safety check with `node scripts/require-node22.mjs` then direct `npx vitest run tests/unit/platform-cleanup.test.ts` before using the npm hook (suite proposed).

**Stop at this boundary:** No workspace cleanup in this mission; do not delete authored, changed or tracked files, recurse into unrelated trees, or add a cleanup framework.

#### PR-02 — Replace blanket overdue-content bypass with scoped exceptions

**Issue:** [#167](https://github.com/Reedtrullz/tcwiki/issues/167) · Foundation / Content Reliability; P1; S–M.

**Start after:** PR-01. **Published coordination:** None; coordinate with existing content WIP.

**Files / checks:** `.github/workflows/ci.yml`; `scripts/lib/content-review-schedule.mjs`; `docs/maintenance.md`; `tests/unit/content-review-schedule.test.ts`.

**Execution note:** Inventory overdue records and preserve the existing reviewed-content WIP as a separate integration lane. Replace blanket bypasses with selected, owned, dated exceptions; do not refresh dates merely to unblock CI.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Restore normal overdue enforcement; permit only named records with an owner, reason, expiry and linked follow-up. Emit exceptions in CI summaries and visible record posture. Coordinate with the existing September 30 authored refresh rather than changing dates without reviewing sources.
- [ ] Verify the acceptance: A stale record blocks an ordinary release; a scoped exception is disclosed and expires; unrelated overdue records still block; deterministic date fixtures cover all three cases.
- [ ] Run `npm run test:unit -- tests/unit/content-review-schedule.test.ts`.

**Stop at this boundary:** No automatic semantic approval, bulk repinning, readiness-policy relaxation or forced content rewrites.

#### PR-55 — Fingerprint actual standalone build inputs instead of inferring freshness from mtimes

**Issue:** [#154](https://github.com/Reedtrullz/tcwiki/issues/154) · Developer Experience / Verification; P2; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `scripts/lib/standalone-freshness.mjs`; `tests/unit/standalone-freshness.test.ts`; `tests/unit/standalone-assets.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Record a deterministic content fingerprint of the actual standalone inputs at build time and compare it before serving that artifact. Exclude unrelated proposal/test documents; include generated app content, config and dependency lock inputs. Show changed/missing inputs in the failure message.
- [ ] Verify the acceptance: Content change with preserved mtime, deletion, relevant config change and generated content change fail; unrelated proposal edits pass. Receipt matches the served build and absent receipts are reported explicitly.
- [ ] Run `npm run test:unit -- tests/unit/standalone-freshness.test.ts tests/unit/standalone-assets.test.ts`.

**Stop at this boundary:** No automatic rebuild of dirty WIP, hashing node_modules, replacement of all build tooling or conflation with Cloudflare bundle identity in [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180).

#### PR-59 — Correct contradictory current-versus-historical ILP teaching copy

**Issue:** [#158](https://github.com/Reedtrullz/tcwiki/issues/158) · Editorial Correctness / Domain; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate the later claim model with [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193).

**Files / checks:** `content/deep-dives/clp.mdx`; `content/deep-dives/liquidity-actions.mdx`; `src/lib/search/mdx-documents.generated.ts`; `tests/deep-dives.spec.ts`; `tests/search.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Correct the specific CLP risk paragraph; distinguish impermanent loss from historical protection, link the removal evidence and retain a clearly dated historical pointer if useful. Update the claim's review evidence and generated search together.
- [ ] Verify the acceptance: The two articles agree on current applicability and distinguish IL from ILP. A reviewed source revision/removal reference supports the correction; searches/snippets do not continue teaching current ILP protection.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/deep-dives.spec.ts tests/search.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No bulk freshness repinning, personalized financial guidance or rewrite of all liquidity economics. Preserve existing authored content WIP.

### Wave 1 — Correct the shared data and evidence contracts

#### PR-08 — Enforce symmetric numeric limits at presentation boundaries

**Issue:** [#173](https://github.com/Reedtrullz/tcwiki/issues/173) · Correctness / Core Data; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/trust.ts`; `src/app/economics/RunepoolPolPanel.tsx`; `src/lib/stats-dashboard.ts`; `tests/unit/trust.test.ts`; `tests/unit/runepool-pol-panel.test.tsx`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Check both signed bounds, preserve exact base-unit strings/BigInt through accounting, and reuse the existing converter where a chart/approximate display needs Number. Make approximate USD calculations explicit and guard overflow/nonfinite results.
- [ ] Verify the acceptance: Small boundary tests cover both signs, zero, fractions, malformed syntax and nonfinite output. Positive/negative PnL survives formatting and never silently becomes a misleading finite rounded accounting total.
- [ ] Run `npm run test:unit -- tests/unit/trust.test.ts tests/unit/runepool-pol-panel.test.tsx`.

**Stop at this boundary:** No arbitrary-precision library, branded-type migration or rewriting already-correct BigInt formatting.

#### PR-03 — Validate Maya before accepting a provider response

**Issue:** [#168](https://github.com/Reedtrullz/tcwiki/issues/168) · Reliability / Core Data; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/api/maya.ts`; `src/components/features/MayaNodePanel.tsx`; `src/lib/api/midgard.ts`; `tests/unit/maya.test.ts (proposed; create only if no existing suite covers the boundary)`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Remove the duplicate provider alias; use an actual second endpoint only after capability/source verification. Validate shape, units, APY scale, bond and slash-point fields before provider acceptance, following the existing Midgard pattern.
- [ ] Verify the acceptance: Malformed success degrades cleanly; valid zero survives; invalid APY never renders NaN%; each distinct provider is attempted at most once per pass; small mocked Maya tests cover fallback and validation.
- [ ] Run the smallest proposed offline regression directly, then through the repaired unit-test hook.

**Stop at this boundary:** Keep Maya independent of THORChain; do not invent redundancy or generalize all APIs behind a new client framework.

#### PR-12 — Carry structured warnings from parser to readiness and UI

**Issue:** [#177](https://github.com/Reedtrullz/tcwiki/issues/177) · Architecture / Trust Reliability; P1; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/live-result.ts`; `src/lib/api/thornode.ts`; `src/app/api/ready/route.ts`; `src/components/ui/LiveSourceMeta.tsx`; `tests/unit/live-result.test.ts`; `tests/unit/ready-route.test.ts`; `tests/unit/readiness-warning-policy.test.ts`; `tests/unit/readiness-contract.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Emit existing structured category/severity/action/key fields where warnings originate; carry them unchanged and derive compatibility strings from them. Make aggregate warning traversal consistent for supported shapes.
- [ ] Verify the acceptance: Wording changes cannot change severity/readiness; nested/composite warnings remain visible; unknown or unmatched warnings still fail closed. Existing readiness compatibility tests remain green.
- [ ] Run `npm run test:unit -- tests/unit/live-result.test.ts tests/unit/ready-route.test.ts tests/unit/readiness-warning-policy.test.ts tests/unit/readiness-contract.test.ts`.

**Stop at this boundary:** Preserve the current allowlisted review-only readiness policy and string clients; no wholesale error framework or relaxed fail-closed rules.

#### PR-39 — Reject conflicting canonical Mimir key aliases

**Issue:** [#138](https://github.com/Reedtrullz/tcwiki/issues/138) · Core Reliability / Trust Boundary; P1; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Coordinate with [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177); conflict detection can ship independently using current warning structures.

**Files / checks:** `src/lib/api/thornode.ts`; `tests/unit/thornode.test.ts`; `tests/unit/ready-route.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Canonicalize once at the response boundary, retain original spellings, detect collisions, and reject or mark conflicting values unknown before deriving controls. Define whether identical aliases are tolerated and disclosed.
- [ ] Verify the acceptance: Input insertion order and capitalization cannot change a clean control decision. Conflicts produce actionable provenance and conservative availability/readiness; identical aliases have deterministic behavior.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/ready-route.test.ts`.

**Stop at this boundary:** No new meaning for unknown controls; retain scoped-key parsing and readiness warning rules. A synthetic provider-shape defect is not proof it has occurred on mainnet.

#### PR-13 — Add small versioned upstream contract fixtures

**Issue:** [#178](https://github.com/Reedtrullz/tcwiki/issues/178) · Testing / Developer Experience / Reliability; P1; M.

**Start after:** PR-03, PR-12. **Published coordination:** [PR-03](https://github.com/Reedtrullz/tcwiki/issues/168) for Maya normalization; coordinate with [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177)'s warning contracts.

**Files / checks:** `tests/unit/thornode.test.ts`; `tests/unit/midgard.test.ts`; `scripts/check-live-chain-snapshot.mjs`; `src/lib/types.ts`; `tests/unit/live-chain-snapshot.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add a bounded opt-in capture/review procedure for sanitized provider responses with source URL, observation time, protocol version and height. Keep a small canonical fixture per important schema plus malformed variants, and an independent scheduled shape report.
- [ ] Verify the acceptance: Offline tests reproduce the captures; one intentional shape change produces a useful diff and warning, not zero-valued fallback. Scheduled provider failure cannot be mistaken for a local regression.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/midgard.test.ts tests/unit/live-chain-snapshot.test.ts`.

**Stop at this boundary:** No mandatory live calls in ordinary PR tests, retained user addresses, giant response archives or auto-accepting changed shapes.

#### PR-06 — Expire quote evidence and withdraw stale availability claims

**Issue:** [#171](https://github.com/Reedtrullz/tcwiki/issues/171) · Correctness / Reliability / UX; P1; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/network-diagnostics.ts`; `src/components/features/NetworkStatusBanner.tsx`; `src/lib/api/thornode.ts`; `tests/unit/network-diagnostics.test.ts`; `tests/unit/network-status-banner.test.tsx`; `tests/network.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Give quote proof explicit valid/expired/expiry-unknown states, evaluated at a supplied clock. Update on expiry and tab resume; request a new quote only through the existing explicit action. Keep pair and amount matching, and report “quoted at” rather than imply settlement.
- [ ] Verify the acceptance: Fake-clock tests cover before/at/after expiry, unknown expiry, input changes and suspended-tab resume. Expired evidence loses the positive availability presentation and cannot drive current refund-triage claims.
- [ ] Run `npm run test:unit -- tests/unit/network-diagnostics.test.ts tests/unit/network-status-banner.test.tsx`. Exercise `npx playwright test tests/network.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No transaction execution, wallet instructions or automatic background quote loop.

#### PR-18 — Bound CSP report ingestion and expose suppressed-report counts

**Issue:** [#183](https://github.com/Reedtrullz/tcwiki/issues/183) · Security Hardening / Observability; P2; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/app/api/csp-report/route.ts`; `tests/unit/csp-report.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Bound read duration, nested/batch report count and individual logged-field lengths; preserve cancellation/redaction. Emit a bounded count of discarded/suppressed reports without logging their content.
- [ ] Verify the acceptance: Existing valid report formats still return 204; stalled, oversized, deeply nested and oversized-field fixtures terminate predictably; report rates cannot cause unbounded logs; private URL query data remains absent.
- [ ] Run `npm run test:unit -- tests/unit/csp-report.test.ts`.

**Stop at this boundary:** Hardening opportunity, not a demonstrated exploit. No authentication requirement that prevents browser reporting, user identifiers or external telemetry vendor.

### Wave 2 — Make collection, runtime proof and release reliable

#### PR-14 — Run browser and CSP proof against the Cloudflare candidate

**Issue:** [#179](https://github.com/Reedtrullz/tcwiki/issues/179) · Release Reliability / Testing; P1; M.

**Start after:** PR-01. **Published coordination:** None.

**Files / checks:** `.github/workflows/ci.yml`; `playwright.config.ts`; `tests/runtime.spec.ts`; `wrangler.do.jsonc`; `tests/routes.spec.ts`; `tests/deep-dives.spec.ts`; `tests/search.spec.ts`; `tests/network.spec.ts`; `tests/dynamic-fees.spec.ts`.

**Execution note:** Current CI already builds, dry-runs and saves a Cloudflare candidate, but the browser command uses standalone. Add the missing actual vinext/DO browser lane; do not create a second migration.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add a bounded vinext/DO browser lane for search, MDX tables/anchors, URL filters, hydrated live fixtures, CSP and runtime identity. Prefer a local target-runtime candidate; use an isolated preview only if required, with explicit cleanup and permission boundaries.
- [ ] Verify the acceptance: CI reports which runtime and artifact was exercised; a vinext-only hydration/MDX regression fails that lane; the candidate bundle used for proof is retained and linked to release identity.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/runtime.spec.ts tests/routes.spec.ts tests/deep-dives.spec.ts tests/search.spec.ts tests/network.spec.ts tests/dynamic-fees.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Retain Docker/Next rollback proof; do not relabel standalone browser tests as Cloudflare validation.

#### PR-53 — Extend release trackedness to the actual Cloudflare inputs

**Issue:** [#152](https://github.com/Reedtrullz/tcwiki/issues/152) · Release Foundation / Developer Experience; P1; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180).

**Files / checks:** `scripts/lib/release-tracked.mjs`; `scripts/check-release-tracked.mjs`; `cloudflare/do-entry.mjs`; `tests/unit/release-tracked.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add explicit Cloudflare release roots and the actual import/copy inputs consumed by its build. Fail when a release-required file is missing or untracked; list the checked scope in output. Reuse the existing walker where it fits.
- [ ] Verify the acceptance: Isolated tracked/untracked/missing fixtures cover Worker/app entry, runtime config and generated/copied release inputs. Check output names both target families and cannot pass solely on the old 39-script scope.
- [ ] Run `npm run test:unit -- tests/unit/release-tracked.test.ts`.

**Stop at this boundary:** Do not write a bundler, resolve every application module syntactically, or call this whole-artifact integrity. That is [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180)'s separate boundary.

#### PR-54 — Reuse runtime identity validation or prove exact parity

**Issue:** [#153](https://github.com/Reedtrullz/tcwiki/issues/153) · Architecture / Verification; P2; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180) and [PR-51](https://github.com/Reedtrullz/tcwiki/issues/150).

**Files / checks:** `src/lib/runtime-metadata.ts`; `scripts/lib/runtime-metadata-contract.mjs`; `tests/unit/runtime-metadata.test.ts`; `tests/unit/readiness-contract.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Consume the existing small module from both environments with minimal typing, if compatible with both build targets. Otherwise use one shared fixture matrix that proves equivalent outcomes and explicitly documents verified's identity-validation meaning.
- [ ] Verify the acceptance: Both environments agree on valid digests, mutable references, placeholders, short/bad SHAs and missing values. Target builds pass without pulling server-only code into browser bundles; display cannot overstate self-reported metadata as independent attestation.
- [ ] Run `npm run test:unit -- tests/unit/runtime-metadata.test.ts tests/unit/readiness-contract.test.ts`.

**Stop at this boundary:** No validator framework, cryptographic attestation service or separate manifest design; [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180) covers artifact identity.

#### PR-15 — Identify the whole Worker artifact and verify the routed release

**Issue:** [#180](https://github.com/Reedtrullz/tcwiki/issues/180) · Operations / Supply-Chain Reliability; P1; M.

**Start after:** PR-14, PR-53, PR-54. **Published coordination:** [PR-14](https://github.com/Reedtrullz/tcwiki/issues/179).

**Files / checks:** `.github/workflows/ci.yml`; `wrangler.do.jsonc`; `tests/unit/deploy-config.test.ts`; `tests/unit/runtime-metadata.test.ts`; `tests/runtime.spec.ts`.

**Execution note:** Current deployment hashes dist/server/index.js and rebuilds in its release job. Replace that narrow identity with the tested deploy-input manifest and promote that artifact. Inspect current target flags; do not re-enable retired VPS serving.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Generate a deterministic manifest digest for the actual module/asset/config input set, promote the tested artifact, enforce mutually exclusive production targets, and verify public domain identity/CSP/strict contract after propagation. Document and rehearse Worker version rollback separately from Docker rollback.
- [ ] Verify the acceptance: Changing an asset/module/config changes identity; all production readbacks match the promoted bundle; conflicting targets fail before deployment; rollback evidence records previous and restored Worker versions.
- [ ] Run `npm run test:unit -- tests/unit/deploy-config.test.ts tests/unit/runtime-metadata.test.ts`. Exercise `npx playwright test tests/runtime.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No secret values in manifests, DNS changes bundled into ordinary app releases, or removal of rollback containers/backups.

#### PR-17 — Coordinate framework upgrades and report dependency reachability

**Issue:** [#182](https://github.com/Reedtrullz/tcwiki/issues/182) · Security Process / Developer Experience; P2; S–M.

**Start after:** PR-14. **Published coordination:** None; current update PRs should precede future grouping changes.

**Files / checks:** `.github/dependabot.yml`; `package.json`; `package-lock.json`; `Dockerfile`.

**Execution note:** Resolve open dependency PRs #130, #131, #133, #134 and #135 against current main, recording actual failing steps. Main has a newer Next lock entry after #205/#132; supersede obsolete bumps rather than downgrade. Group only compatible changes.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Group compatible framework maintenance, keep incompatible major moves separately reviewed, and add a concise audit triage receipt listing package path, affected artifact, upstream fix and reachability assessment. Investigate Cloudflare transitive findings through their owning dependencies.
- [ ] Verify the acceptance: A framework update's CI covers Next and Cloudflare lanes; full and production audits pass or have an explicitly approved, dated exception; severity alone is not presented as proof of exploitation.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Record installed versions/audit or consumer search as appropriate; run both supported build targets for dependency changes.

**Stop at this boundary:** Existing #132 owns the immediate Next patch. Do not create another Next-upgrade issue, downgrade audit thresholds, or replace dependency remediation with a theoretical exploit disclaimer.

#### PR-56 — Remove unused math dependencies and starter assets after consumer checks

**Issue:** [#155](https://github.com/Reedtrullz/tcwiki/issues/155) · Maintenance / Simplification; P2; S.

**Start after:** PR-17. **Published coordination:** None; coordinate dependency updates with existing open PRs.

**Files / checks:** `package.json`; `next.config.ts`; `package-lock.json`; `public/ (consumer-checked starter assets only)`.

**Execution note:** Confirm no current MDX formula or asset consumer before removal. Preserve any real consumer; remove only unused entries, then render representative articles on both targets.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Reconfirm consumers on current main and remove only the unused direct math packages and unreferenced starter assets. Keep package/lockfile consistent and verify MDX rendering on both supported targets.
- [ ] Verify the acceptance: Consumer search and representative formula/article rendering are recorded; no imports or asset URLs break, dependency lock is reproducible and both target checks pass. If a real consumer is found, preserve that item.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Record installed versions/audit or consumer search as appropriate; run both supported build targets for dependency changes.

**Stop at this boundary:** No math-rendering migration, removal of real illustrations, speculative API-helper deletion or churn across unrelated dependencies.

#### PR-10 — Reuse pinned THORNode reads within one collection cycle

**Issue:** [#175](https://github.com/Reedtrullz/tcwiki/issues/175) · Performance / Reliability / Architecture; P2; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/readiness-snapshot.ts`; `src/lib/api/thornode.ts`; `tests/unit/thornode.test.ts`; `tests/unit/ready-route.test.ts`.

**Execution note:** Trace all current network/fee/POL collectors and callers. Share one request-cycle context only for immutable reads at one provider/height; avoid a persistent global cache or provider mixing.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Introduce one request-scoped provider/height context for shared immutable reads, retaining independent feature normalization and warning quality. Cache/in-flight keys must include provider, path and height. Expose feature snapshot differences rather than pretend all data is atomic.
- [ ] Verify the acceptance: Mocked request counts decrease for one provider cycle; fallback starts a separate context and never mixes heights. Slow/failed fee history does not hide usable network/POL evidence. Record real latency before claiming speed improvement.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/ready-route.test.ts`.

**Stop at this boundary:** No global cross-provider cache, persistent history store, or coalescing quotes. Keep existing snapshot lag configuration.

#### PR-11 — Bound collection deadlines and respect provider throttling

**Issue:** [#176](https://github.com/Reedtrullz/tcwiki/issues/176) · Reliability / Performance; P2; M.

**Start after:** PR-10. **Published coordination:** None; coordinate with [PR-10](https://github.com/Reedtrullz/tcwiki/issues/175) to avoid competing transport edits.

**Files / checks:** `src/lib/api/thornode.ts`; `scripts/check-runtime-url.mjs`; `tests/unit/thornode.test.ts`; `tests/unit/readiness-monitor.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add an overall budget and propagate cancellation; retain partial results/warnings for optional history. Honor bounded Retry-After for rate limits and expose a manual quote retry state. Put explicit timeout/deadline bounds on release verification.
- [ ] Verify the acceptance: Fake timers/mocked fetch prove upper bounds, request cancellation and cleanup under slow/stalled providers, 429 and fallback. Same-provider/height evidence remains intact; quote input/halts are not repeatedly retried.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/readiness-monitor.test.ts`.

**Stop at this boundary:** Do not hedge all providers, retry semantic input errors, or count throttling as protocol halt.

#### PR-43 — Record collection timing and evaluate age at the decision boundary

**Issue:** [#142](https://github.com/Reedtrullz/tcwiki/issues/142) · Reliability / Evidence Foundation; P1; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Coordinate with [PR-07](https://github.com/Reedtrullz/tcwiki/issues/172) and [PR-11](https://github.com/Reedtrullz/tcwiki/issues/176); each can ship a bounded part independently.

**Files / checks:** `src/lib/api/thornode.ts`; `src/lib/readiness-snapshot.ts`; `tests/unit/thornode.test.ts`; `tests/unit/ready-route.test.ts`; `tests/unit/readiness-contract.test.ts`.

**Execution note:** Merged #205 already moves THORNode age assessment after retrieval, expires cached fresh evidence and reassesses delivery. Reproduce only residual timing/provenance/clock-skew gaps; retain its tests and existing 12s/30s policy.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Record startedAt/completedAt, block observation time and duration; define checkedAt precisely. Recompute age when returning cached evidence and when making readiness/availability decisions, with explicit clock-skew handling.
- [ ] Verify the acceptance: Fake-clock tests include a slow first provider, fallback, history delay, cached return and negative age. A block that became too old during collection cannot be described by its earlier age as fresh.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/ready-route.test.ts tests/unit/readiness-contract.test.ts`.

**Stop at this boundary:** No universal TTL, clock synchronization service or weakening of stale-data limits. Preserve request budgets from [PR-11](https://github.com/Reedtrullz/tcwiki/issues/176).

#### PR-07 — Distinguish last good data from fresh operational evidence

**Issue:** [#172](https://github.com/Reedtrullz/tcwiki/issues/172) · Reliability / UX; P1; M.

**Start after:** PR-06. **Published coordination:** [PR-06](https://github.com/Reedtrullz/tcwiki/issues/171) for quote behavior; can develop other dataset states independently.

**Files / checks:** `src/lib/hooks/useMidgard.ts`; `src/lib/hooks/useMaya.ts`; `src/components/ui/LiveSourceMeta.tsx`; `src/lib/hooks/`; `src/components/ui/FreshnessMeta.tsx`; `tests/unit/network-status-banner.test.tsx`; `tests/unit/source-labels.test.tsx`; `tests/unit/home-live-metrics.test.tsx`; `tests/network.spec.ts`; `tests/home.spec.ts`; `tests/economics.spec.ts`.

**Execution note:** Compare with merged #205 first: cached readiness age is already reassessed at delivery. Implement only remaining browser/dataset freshness gaps; historical chart periods retain their interval meaning.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Define freshness policy separately for operational, aggregate and historical data. Show refreshing, last good, stale and unavailable states; re-evaluate age on resume/reconnect and offer one manual refresh action. Preserve values as dated context while preventing stale operation evidence from implying availability.
- [ ] Verify the acceptance: A browser journey covers load, elapsed time, offline, failed refresh and recovery; labels retain checkedAt/provider. Stale operations are conservative; historical intervals are not incorrectly marked invalid merely because they are old.
- [ ] Run `npm run test:unit -- tests/unit/network-status-banner.test.tsx tests/unit/source-labels.test.tsx tests/unit/home-live-metrics.test.tsx`. Exercise `npx playwright test tests/network.spec.ts tests/home.spec.ts tests/economics.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Reuse SWR; no new global store, mandatory rapid polling or guessed universal TTL.

#### PR-57 — Bound response parsing and request-input work at provider boundaries

**Issue:** [#156](https://github.com/Reedtrullz/tcwiki/issues/156) · Reliability / Security Hardening; P2; M.

**Start after:** PR-11, PR-13. **Published coordination:** [PR-11](https://github.com/Reedtrullz/tcwiki/issues/176); coordinate fixtures with [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178) and report ingestion with [PR-18](https://github.com/Reedtrullz/tcwiki/issues/183).

**Files / checks:** `src/lib/api/thornode.ts`; `src/lib/api/midgard.ts`; `src/lib/api/maya.ts`; `tests/unit/thornode.test.ts`; `tests/unit/midgard.test.ts`; `tests/unit/maya.test.ts (proposed; create only if no existing suite covers the boundary)`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Set documented, fixture-informed byte/row/digit limits at the smallest common transport/conversion boundary. Abort oversized reads before full parsing where the runtime supports streams; reject excessive quote input before numeric conversion. Reuse existing numeric-limit conventions.
- [ ] Verify the acceptance: Over-limit streams, advertised/actual length mismatch, very large arrays and long numeric input fail with explicit warnings and bounded work. Normal recorded responses fit with documented headroom; provider failover/deadlines still work on both targets.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/midgard.test.ts`.

**Stop at this boundary:** No arbitrary low caps, truncation silently described as complete, new transport dependency, or generic threat platform.

#### PR-44 — Distinguish requested height from verified response height

**Issue:** [#143](https://github.com/Reedtrullz/tcwiki/issues/143) · Evidence Foundation / Integration Reliability; P1; M.

**Start after:** PR-13. **Published coordination:** [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178); coordinate with [PR-10](https://github.com/Reedtrullz/tcwiki/issues/175) and [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142).

**Files / checks:** `src/lib/api/thornode.ts`; `scripts/lib/readiness-contract.mjs`; `tests/unit/thornode.test.ts`; `tests/unit/live-chain-snapshot.test.ts`.

**Execution note:** Check endpoint version/capabilities first. A height in the URL is requested pinning; without observed response evidence the state stays unverified.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Model requestedHeight, observedHeight and pinning verification separately. Check documented headers/response evidence where available and add a bounded provider-capability test; otherwise label requested pinning accurately.
- [ ] Verify the acceptance: Ignored/mismatched-height fixtures cannot produce Verified pinning; unsupported echo is explicitly unverified. Source URLs retain requested height and comparisons never conflate requested and observed values.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/live-chain-snapshot.test.ts`.

**Stop at this boundary:** No accusation that current providers ignore height, extra arbitrary-height production sweeps, or mixing provider snapshots to manufacture agreement. Review endpoint capabilities before choosing a probe.

#### PR-42 — Reconcile quotes with later or contradictory operation evidence

**Issue:** [#141](https://github.com/Reedtrullz/tcwiki/issues/141) · Correctness / Core UX; P1; M.

**Start after:** PR-06, PR-43. **Published coordination:** [PR-06](https://github.com/Reedtrullz/tcwiki/issues/171); [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142) supplies better timing evidence for the full reconciliation.

**Files / checks:** `src/lib/network-diagnostics.ts`; `src/components/features/NetworkStatusBanner.tsx`; `tests/unit/network-diagnostics.test.ts`; `tests/unit/network-status-banner.test.tsx`; `tests/network.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Preserve both findings, their provider/time context and the contradiction. Say that a quote was returned while current controls limit or cannot confirm execution; require explicit recheck after a material state change. Establish precedence using evidence time and scope.
- [ ] Verify the acceptance: A later blocker prevents an unconditional positive availability claim; unrelated controls do not block the pair. Same-time provider disagreement, diagnostics failure and input changes retain all evidence and stay conservative.
- [ ] Run `npm run test:unit -- tests/unit/network-diagnostics.test.ts tests/unit/network-status-banner.test.tsx`. Exercise `npx playwright test tests/network.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Do not make diagnostics prove settlement, hide the quote body, or auto-submit transactions. Expiration is separately owned by [PR-06](https://github.com/Reedtrullz/tcwiki/issues/171).

#### PR-51 — Align the independent host monitor with the strict readiness contract

**Issue:** [#150](https://github.com/Reedtrullz/tcwiki/issues/150) · Operations / Reliability; P1; S–M.

**Start after:** PR-12, PR-43, PR-54. **Published coordination:** [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177) for any new warning fields; coordinate with [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142) and [PR-54](https://github.com/Reedtrullz/tcwiki/issues/153).

**Files / checks:** `scripts/check-production-readiness-host.sh`; `scripts/lib/readiness-contract.mjs`; `tests/unit/host-readiness-monitor.test.ts`; `tests/unit/readiness-contract.test.ts`.

**Execution note:** Retain the independent host monitor and vantage. Check whether Node is available before choosing shared code versus equivalent jq fixtures; #205 app fixes do not prove host contract parity.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Validate the same required identity/source contract in the host path. Prefer a tiny wrapper around the existing shared validator if the host runtime supports it; otherwise maintain a deliberately equivalent jq check with shared positive/negative fixtures.
- [ ] Verify the acceptance: Both consumers reject missing/malformed identity, absent runtime and contradictions between ready and required source states/reasons. Both accept a valid body; alert formatting and nonzero failure exit remain intact. Timestamp parsing/age rules must be shared if strengthened with [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142): the present shared validator only requires checkedAt to be a nonempty string, so this reproduction does not prove it independently rejects every malformed field.
- [ ] Run `npm run test:unit -- tests/unit/host-readiness-monitor.test.ts tests/unit/readiness-contract.test.ts`.

**Stop at this boundary:** Preserve independent scheduling and network vantage. Do not weaken the strict contract, assume Node exists on the host, or infer that production is currently returning the synthetic malformed body.

#### PR-16 — Separate origin liveness, source readiness and feature degradation

**Issue:** [#181](https://github.com/Reedtrullz/tcwiki/issues/181) · Observability / Operations; P2; M.

**Start after:** PR-12, PR-43, PR-51. **Published coordination:** [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177).

**Files / checks:** `.github/workflows/operations.yml`; `scripts/lib/readiness-monitor.mjs`; `src/app/api/ready/route.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Include liveness/identity, source family, affected feature, warning category, independent sample count and linked artifact in alert summaries. Deduplicate by incident fingerprint and record recovery without discarding chronology. Bound deployment readiness work separately from optional feature history.
- [ ] Verify the acceptance: Fixtures for origin failure, healthy origin/degraded upstream, feature-only degradation and recovery produce distinct explanations. Cached snapshots do not count as independent observations. Repeated identical windows update one incident.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above.

**Stop at this boundary:** Preserve strict readiness and existing warning policy; no silent “healthy” fallback or arbitrary threshold increase.

#### PR-45 — Attach protocol applicability and activation rules to control definitions

**Issue:** [#144](https://github.com/Reedtrullz/tcwiki/issues/144) · Domain Architecture / Reliability; P2; M.

**Start after:** PR-39. **Published coordination:** [PR-39](https://github.com/Reedtrullz/tcwiki/issues/138); coordinate with [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193) and [PR-40](https://github.com/Reedtrullz/tcwiki/issues/139).

**Files / checks:** `src/lib/operational-controls.ts`; `src/lib/api/thornode.ts`; `tests/unit/thornode.test.ts`; `tests/unit/network-diagnostics.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Extend the existing catalog only with the semantic fields actually consumed: activation mode, absence meaning, scope and reviewed source/version range. Start with controls already monitored; render an applicability warning for unsupported semantics rather than silently reuse a rule.
- [ ] Verify the acceptance: Table-driven boundary tests cover before/at/after height, absent/invalid values and unsupported versions. Parser, display and search reference the same reviewed meaning; exact source revisions are reviewable.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/network-diagnostics.test.ts`.

**Stop at this boundary:** No generic rules engine, speculative version history, hard-coded guesses for every Mimir, or deriving code truth from a mutable develop ADR alone.

#### PR-52 — Make intentional script/app data-policy differences explicit

**Issue:** [#151](https://github.com/Reedtrullz/tcwiki/issues/151) · Architecture / Domain Reliability; P2; M.

**Start after:** PR-45. **Published coordination:** [PR-45](https://github.com/Reedtrullz/tcwiki/issues/144) for reviewed control semantics; coordinate with [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178).

**Files / checks:** `scripts/lib/live-chain-snapshot.mjs`; `src/lib/api/thornode.ts`; `wrangler.jsonc`; `tests/unit/live-chain-snapshot.test.ts`; `tests/unit/thornode.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Name the actual supported policy profiles and document their differences. Share only truly common constants or reviewed control semantics through a small existing-compatible module; add a parity check for fields intended to match.
- [ ] Verify the acceptance: Receipts disclose applied lag/age policy. Intentional differences have fixtures and rationale; unintended provider/default drift fails a narrow check. A configurable app lag is never reported as the script's fixed one-block policy.
- [ ] Run `npm run test:unit -- tests/unit/live-chain-snapshot.test.ts tests/unit/thornode.test.ts`.

**Stop at this boundary:** No universal configuration engine, forced equality between independent monitors, or refactor of every API client. Keep deliberate independence and bounded deadlines.

### Wave 3 — Make analytics comparable and honest

#### PR-04 — Select completed daily-volume intervals explicitly

**Issue:** [#169](https://github.com/Reedtrullz/tcwiki/issues/169) · Correctness / Analytics; P1; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/daily-volume.ts`; `src/components/features/DailyVolumeLeaderboard.tsx`; `tests/unit/daily-volume.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Normalize bucket boundaries and numeric fields; select the most recent completed UTC day using explicit observation time. Preserve genuine zeros; distinguish absent, invalid and incomplete data. Return selected period and comparison-window coverage.
- [ ] Verify the acceptance: Fixtures cover completed zero day, positive in-progress day, missing/negative fields, out-of-order/duplicate intervals and UTC rollover. A partial trailing window is labeled with its actual count, not advertised as seven days.
- [ ] Run `npm run test:unit -- tests/unit/daily-volume.test.ts`.

**Stop at this boundary:** Fix period/accounting semantics for the current requested universe; universe expansion belongs in [PR-05](https://github.com/Reedtrullz/tcwiki/issues/170).

#### PR-38 — Normalize earnings chronology and interval identity before aggregation

**Issue:** [#137](https://github.com/Reedtrullz/tcwiki/issues/137) · Correctness / Analytics; P1; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Coordinate with [PR-04](https://github.com/Reedtrullz/tcwiki/issues/169); no hard prerequisite.

**Files / checks:** `src/lib/stats-dashboard.ts`; `src/lib/api/midgard.ts`; `src/components/features/StatsEarningsTable.tsx`; `tests/unit/stats-dashboard.test.ts`; `tests/unit/midgard.test.ts`; `tests/stats.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Retain validated start/end timestamps, sort by time, detect duplicates/overlaps and missing periods, and label UTC boundaries explicitly. Separate chronological chart order from newest-first recent rows. State loaded/completed period coverage.
- [ ] Verify the acceptance: Permuting a valid response preserves totals/window selection; duplicate/conflicting intervals cannot inflate totals; boundary, gap, rollover and timezone fixtures preserve explicit period labels. Existing partial-total warnings remain.
- [ ] Run `npm run test:unit -- tests/unit/stats-dashboard.test.ts tests/unit/midgard.test.ts`. Exercise `npx playwright test tests/stats.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** This is earnings history; [PR-04](https://github.com/Reedtrullz/tcwiki/issues/169) owns swap-volume periods. Reuse its accepted interval principles without building a generic timeseries library.

#### PR-05 — Define the leaderboard universe and retain each pool's provenance

**Issue:** [#170](https://github.com/Reedtrullz/tcwiki/issues/170) · Core Functionality / Trust UX; P1; M.

**Start after:** PR-04. **Published coordination:** [PR-04](https://github.com/Reedtrullz/tcwiki/issues/169).

**Files / checks:** `src/lib/daily-volume.ts`; `src/lib/hooks/useMidgard.ts`; `src/components/ui/LiveSourceMeta.tsx`; `tests/unit/daily-volume.test.ts`; `tests/unit/stats-dashboard.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: First label a selected-pool subtotal honestly and expose included/failed assets, period coverage and per-pool sources. Where the API provides a documented all-network aggregate, use that for the total. Treat full-universe ranking as a bounded optional extension with explicit discovery, cap and omitted count.
- [ ] Verify the acceptance: An omitted or failed pool cannot produce an unlabeled network total/share. Mixed-provider fixtures preserve every provider and time; known zero and unavailable are distinct. Request counts are capped and tested.
- [ ] Run `npm run test:unit -- tests/unit/daily-volume.test.ts tests/unit/stats-dashboard.test.ts`.

**Stop at this boundary:** No unbounded all-pool history fan-out; no mixing a network-total denominator with subset totals silently.

#### PR-09 — Pair the POL USD price with its actual source interval

**Issue:** [#174](https://github.com/Reedtrullz/tcwiki/issues/174) · Correctness / Analytics UX; P1; S–M.

**Start after:** PR-08. **Published coordination:** [PR-08](https://github.com/Reedtrullz/tcwiki/issues/173).

**Files / checks:** `src/app/economics/RunepoolPolPanel.tsx`; `src/app/economics/RunepoolPolPanel.tsx`; `tests/unit/runepool-pol-panel.test.tsx`; `tests/unit/stats-dashboard.test.ts`; `tests/economics.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Select a complete price-plus-interval record; retain its provider and quality. Label USD as a reference valuation at that daily interval, with age and mismatch caveats; withhold it when price evidence is invalid.
- [ ] Verify the acceptance: Fixtures with a missing final price show the earlier price's real date; degraded/stale history is disclosed; RUNE accounting remains available independently. UI/source tests distinguish POL snapshot time from valuation time.
- [ ] Run `npm run test:unit -- tests/unit/runepool-pol-panel.test.tsx tests/unit/stats-dashboard.test.ts`. Exercise `npx playwright test tests/economics.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Do not silently replace the daily reference with a spot oracle or claim contemporaneous USD accounting.

#### PR-40 — Validate fee configuration relationships and bounds labels

**Issue:** [#139](https://github.com/Reedtrullz/tcwiki/issues/139) · Correctness / Fee Analytics; P1; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-45](https://github.com/Reedtrullz/tcwiki/issues/144) for versioned policy.

**Files / checks:** `src/lib/api/thornode.ts`; `src/lib/data/dynamic-fees-helpers.ts`; `src/components/features/DynamicFeePanels.tsx`; `tests/unit/thornode.test.ts`; `tests/unit/dynamic-fees-page.test.tsx`; `tests/dynamic-fees.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Validate relationships and required positive values using reviewed protocol rules; distinguish below/inside/above/equal/unknown/invalid configuration. Reuse one classification for filters, distribution and pair cards.
- [ ] Verify the acceptance: Inverted/missing/equal bounds, zero epoch length, out-of-range records and clamp cases have explicit states; no invalid value matches Inside bounds. Known valid source fixtures retain exact raw/effective values.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/dynamic-fees-page.test.tsx`. Exercise `npx playwright test tests/dynamic-fees.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Do not clamp silently, infer an active fee from a malformed configuration, or choose defaults from an unversioned document without review.

#### PR-41 — Expose fee-history cohorts and field-level aggregate coverage

**Issue:** [#140](https://github.com/Reedtrullz/tcwiki/issues/140) · Analytics / Trust UX; P1; M.

**Start after:** PR-40. **Published coordination:** [PR-40](https://github.com/Reedtrullz/tcwiki/issues/139); coordinate with [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178) for real schema fixtures.

**Files / checks:** `src/lib/data/dynamic-fees-helpers.ts`; `src/components/features/DynamicFeePanels.tsx`; `tests/unit/dynamic-fees-page.test.tsx`; `tests/dynamic-fees.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Show cohort membership, missing-field counts and retention gaps; label sums as attributed stored samples, and label controller-floor means explicitly. Offer a comparable-cohort view before interpreting trends; define deduplication and any effective-rate metric from reviewed attribution semantics.
- [ ] Verify the acceptance: Partial fields and changing cohorts remain visible; duplicate attribution cannot silently become unique-revenue proof; controller mean and any computed effective fee ratio have different names/units. Unequal-volume fixtures expose their difference.
- [ ] Run `npm run test:unit -- tests/unit/dynamic-fees-page.test.tsx`. Exercise `npx playwright test tests/dynamic-fees.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No causal revenue-lift claim, reconstruction of missing epochs or assumption that attributed totals equal unique protocol revenue. [PR-35](https://github.com/Reedtrullz/tcwiki/issues/200) owns durable historical storage.

#### PR-46 — Preserve reported APR/APY basis and make the pool period explicit

**Issue:** [#145](https://github.com/Reedtrullz/tcwiki/issues/145) · Analytics Correctness / UX; P2; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Coordinate with [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178); no hard prerequisite for truthful labels.

**Files / checks:** `src/lib/api/midgard.ts`; `src/lib/stats-dashboard.ts`; `tests/unit/midgard.test.ts`; `tests/unit/stats-dashboard.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Retain field identity, explicit requested period, scale and source. Label reported APR/APY according to reviewed API semantics; include the interval beside ranking and comparison controls.
- [ ] Verify the acceptance: APR-only, APY-only, both-present/disagreeing and missing fixtures preserve raw identity; rankings compare the same metric/basis. Period changes are bounded, shareable and reflected in cache keys/provenance.
- [ ] Run `npm run test:unit -- tests/unit/midgard.test.ts tests/unit/stats-dashboard.test.ts`.

**Stop at this boundary:** No invented compounding conversion, future-return recommendation, or conflation with Maya's parser work in [PR-03](https://github.com/Reedtrullz/tcwiki/issues/168).

#### PR-65 — Show THORChain validator-set and version coverage

**Issue:** [#164](https://github.com/Reedtrullz/tcwiki/issues/164) · Advanced / Network Product; P3; M.

**Start after:** PR-13, PR-45, PR-08. **Published coordination:** [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178), [PR-45](https://github.com/Reedtrullz/tcwiki/issues/144); coordinate with [PR-08](https://github.com/Reedtrullz/tcwiki/issues/173).

**Files / checks:** `src/lib/api/midgard.ts`; `src/app/network/NetworkPageClient.tsx`; `tests/unit/midgard.test.ts`; `tests/unit/trust.test.ts`; `tests/network.spec.ts`; `tests/accessibility.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Reuse the existing helper for a bounded THORChain node table and version distribution with status, missing-field coverage, source time and clearly reviewed semantics. Relate loaded rows to summary counts without asserting an unexplained mismatch is an outage.
- [ ] Verify the acceptance: Partial/missing/unknown statuses and versions remain visible; totals describe the loaded universe. Numeric bounds, keyboard access, source degradation and version applicability pass recorded fixtures; no N-per-node polling.
- [ ] Run `npm run test:unit -- tests/unit/midgard.test.ts tests/unit/trust.test.ts`. Exercise `npx playwright test tests/network.spec.ts tests/accessibility.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No operator scoring, network-security guarantee, IP/contact enrichment, bond recommendation or replication of Maya-specific policy. Keep protocol interpretations reviewed and read-only.

### Wave 4 — Improve discovery, navigation and accessible recovery

#### PR-19 — Make header disclosures keyboard-complete

**Issue:** [#184](https://github.com/Reedtrullz/tcwiki/issues/184) · UX / Accessibility; P2; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/components/Header.tsx`; `tests/navigation.spec.ts`; `src/components/Header.tsx`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Use ordinary disclosure semantics: toggle the active group, set its actual trigger for focus return, link buttons to panels, and close predictably on route change or outside interaction. Audit keyboard behavior of all four header panel types together.
- [ ] Verify the acceptance: Keyboard/browser checks cover open, repeated toggle, Escape, focus return, switching groups, mobile navigation and navigation completion. Hidden panels cannot retain focus.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/navigation.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Keep registry navigation and native buttons/links; no mega-menu redesign or ARIA menu widget unless its full behavior is wanted.

#### PR-24 — Index deep-dive sections and unify heading identity

**Issue:** [#189](https://github.com/Reedtrullz/tcwiki/issues/189) · Discovery / Content Architecture; P2; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `scripts/generate-mdx-search.mjs`; `src/mdx-components.tsx`; `src/lib/content/registry.ts`; `scripts/lib/deep-dive-toc.mjs`; `tests/unit/deep-dive-toc.test.ts`; `tests/unit/search-registry.test.ts`; `tests/deep-dives.spec.ts`; `tests/search.spec.ts`; `tests/link-integrity.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Reuse installed MDX tooling to derive headings/anchors and bounded section documents from one parse. Preserve explicit IDs and existing public fragments; keep curated task intent and reader-path metadata editorial.
- [ ] Verify the acceptance: Formatting, punctuation, Unicode and duplicate headings produce deterministic unique IDs; old anchors resolve; section queries land on the actual matching section; generated checks and rendered-link tests share the contract.
- [ ] Run `npm run test:unit -- tests/unit/deep-dive-toc.test.ts tests/unit/search-registry.test.ts`. Exercise `npx playwright test tests/deep-dives.spec.ts tests/search.spec.ts tests/link-integrity.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No content-format migration, automatic rewrite of all URLs or entire prose copies for each heading.

#### PR-66 — Open collapsed dashboard destinations when readers navigate to them

**Issue:** [#165](https://github.com/Reedtrullz/tcwiki/issues/165) · UX / Accessibility; P2; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-21](https://github.com/Reedtrullz/tcwiki/issues/186) and [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189).

**Files / checks:** `src/components/layout/PageTableOfContents.tsx`; `tests/unit/deep-dive-toc.test.ts`; `tests/stats.spec.ts`; `tests/navigation.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: On explicit hash navigation, reveal the target's necessary details ancestors, apply the existing header offset and preserve usable focus. Handle direct links, reload and history; explain unavailable conditional targets rather than silently claiming navigation succeeded.
- [ ] Verify the acceptance: Direct/reloaded/keyboard/TOC/back-forward destinations reveal the requested section below the header; loading, empty and error states retain meaningful fallback. Disclosure state remains reader-controlled outside explicit navigation.
- [ ] Run `npm run test:unit -- tests/unit/deep-dive-toc.test.ts`. Exercise `npx playwright test tests/stats.spec.ts tests/navigation.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Use native details/hash behavior and a small shared hook only if multiple consumers need it. No new scrolling library, forced opening of all panels, or replacement of [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189)'s content heading IDs.

#### PR-20 — Make explorer URL behavior consistent and include fee filters

**Issue:** [#185](https://github.com/Reedtrullz/tcwiki/issues/185) · UX / Architecture; P2; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/components/features/DynamicFeeRecordsExplorer.tsx`; `src/hooks/usePoolExplorerFilters.ts`; `src/components/features/ProtocolChainFinder.tsx`; `src/components/features/SourceMapExplorer.tsx`; `tests/unit/dynamic-fees-page.test.tsx`; `tests/unit/ecosystem-directory.test.ts`; `tests/unit/glossary-explorer.test.ts`; `tests/unit/source-map-explorer.test.ts`; `tests/dynamic-fees.spec.ts`; `tests/search.spec.ts`; `tests/docs-glossary.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add namespaced, validated fee query parameters and define one simple browser-history contract for explorer state. Extract only the repeated URL-write helper, retaining feature-specific validation and defaults.
- [ ] Verify the acceptance: Copy/reload/back/forward work for each changed explorer; malformed filters fall back predictably; rapid typing does not lose newer state; unrelated parameters survive.
- [ ] Run `npm run test:unit -- tests/unit/dynamic-fees-page.test.tsx tests/unit/ecosystem-directory.test.ts tests/unit/glossary-explorer.test.ts tests/unit/source-map-explorer.test.ts`. Exercise `npx playwright test tests/dynamic-fees.spec.ts tests/search.spec.ts tests/docs-glossary.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Preserve existing URLs, unrelated query parameters, anchors and aliases; no universal filter framework or new state library.

#### PR-21 — Test accessibility beyond contrast and initial loading

**Issue:** [#186](https://github.com/Reedtrullz/tcwiki/issues/186) · Accessibility / Testing; P1–P2; M.

**Start after:** PR-19. **Published coordination:** [PR-19](https://github.com/Reedtrullz/tcwiki/issues/184) for corrected header behavior.

**Files / checks:** `tests/accessibility.spec.ts`; `src/components/features/StatsEarningsTable.tsx`; `src/components/layout/PageTableOfContents.tsx`; `tests/navigation.spec.ts`; `tests/network.spec.ts`; `tests/search.spec.ts`; `tests/deep-dives.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Reuse installed axe for a bounded broader rule set, inject deterministic loaded/degraded fixtures, and add keyboard journeys for search, header and route checking. Check 200–400% zoom/reflow and reduced-motion handling where animation exists.
- [ ] Verify the acceptance: Findings point to actual nodes; loaded/error states and deep-dive tables are covered; a keyboard user can reach, operate and leave controls; meaningful updates announce once rather than on every poll.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/accessibility.spec.ts tests/navigation.spec.ts tests/network.spec.ts tests/search.spec.ts tests/deep-dives.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Retain existing readable tables/cards; do not add duplicate chart summaries blindly. Human screen-reader/device acceptance remains a separate task.

#### PR-25 — Evaluate search intent before changing ranking rules

**Issue:** [#190](https://github.com/Reedtrullz/tcwiki/issues/190) · Product Quality / Testing; P2; M.

**Start after:** PR-24. **Published coordination:** [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189) for evaluating section-level destinations.

**Files / checks:** `src/lib/search/ranking.ts`; `src/lib/search/lunr-query.ts`; `tests/unit/search-ranking.test.ts`; `src/app/search/SearchPageClient.tsx`; `tests/unit/search-query.test.ts`; `tests/unit/search-presentation.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Build a small offline query set with intended task, acceptable destinations, confusing alternatives, typos, exact keys/assets and negative controls. Report top-k intent success and regressions; consolidate only overlapping rules that the corpus justifies.
- [ ] Verify the acceptance: Baseline metrics are committed, high-risk operation questions route to evidence rather than historical availability claims, and new rules show improvement on held-out examples without degrading exact identifiers.
- [ ] Run `npm run test:unit -- tests/unit/search-ranking.test.ts tests/unit/search-query.test.ts tests/unit/search-presentation.test.ts`.

**Stop at this boundary:** No embeddings service, user-query tracking or wholesale ranker rewrite.

#### PR-58 — Add route recovery and a useful unmatched-route experience

**Issue:** [#157](https://github.com/Reedtrullz/tcwiki/issues/157) · Reliability / UX; P2; M.

**Start after:** PR-14, PR-21. **Published coordination:** [PR-14](https://github.com/Reedtrullz/tcwiki/issues/179); coordinate accessibility with [PR-21](https://github.com/Reedtrullz/tcwiki/issues/186).

**Files / checks:** `src/app/error.tsx (proposed)`; `src/app/not-found.tsx (proposed)`; `tests/routes.spec.ts`; `tests/navigation.spec.ts`.

**Execution note:** Read installed framework error-boundary docs and verify vinext support before selecting the retry signature. Record streamed-response status limitations rather than assert every response becomes 404.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add the minimum supported route boundary and dark-theme unmatched-route view: retry affected content, retain meaningful navigation/source guidance, and offer existing search without automatic redirection. Verify the actual retry API for the chosen framework version/target; installed docs use retry, so do not assume an older signature.
- [ ] Verify the acceptance: A controlled rendering throw can recover without losing all navigation; keyboard focus and status announcements work. Unknown routes have useful links and correct target-specific response/indexing behavior, including streamed-response limitations. CSP remains enforced.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/routes.spec.ts tests/navigation.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No replacement of handled provider-error UI, exception details exposed to readers, new telemetry vendor or experimental global routing unless needed.

#### PR-26 — Measure search startup, route bundles and DO contention

**Issue:** [#191](https://github.com/Reedtrullz/tcwiki/issues/191) · Performance / Architecture; P2; M discovery slice.

**Start after:** PR-14, PR-25. **Published coordination:** [PR-14](https://github.com/Reedtrullz/tcwiki/issues/179); coordinate search experiments with [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189)/25.

**Files / checks:** `src/app/search/SearchPageClient.tsx`; `cloudflare/do-entry.mjs`; `src/app/layout.tsx`; `tests/runtime.spec.ts`; `tests/search.spec.ts`; `tests/network.spec.ts`.

**Execution note:** Keep the measured baseline even if no optimization is justified. Name artifact, hardware/network, payload, concurrency and load; do not infer DO serialization or cache nonce-bearing HTML.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Record compressed route payloads, search construction time, interaction latency and a bounded mixed content/readiness concurrency test. Based on results, prebuild/load the index, defer unused charts, or separate static reference rendering from live collection while preserving CSP.
- [ ] Verify the acceptance: Before/after evidence identifies exact artifact/device/load; relevance, CSP and readiness remain unchanged. If no material bottleneck is measured, retain the baseline and defer architecture changes.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/runtime.spec.ts tests/search.spec.ts tests/network.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** First PR is a measured baseline plus only a demonstrated small optimization. Single DO does not imply all asynchronous work is serialized. Static caching cannot reuse nonce-bearing HTML casually.

#### PR-49 — Server-seed one bounded operational summary and provide a no-JavaScript path

**Issue:** [#148](https://github.com/Reedtrullz/tcwiki/issues/148) · Reliability / UX; P2; L.

**Start after:** PR-07, PR-10, PR-43, PR-14. **Published coordination:** [PR-07](https://github.com/Reedtrullz/tcwiki/issues/172), [PR-10](https://github.com/Reedtrullz/tcwiki/issues/175), [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142); coordinate verification with [PR-14](https://github.com/Reedtrullz/tcwiki/issues/179).

**Files / checks:** `src/app/network/page.tsx`; `src/app/network/NetworkPageClient.tsx`; `src/lib/readiness-snapshot.ts`; `tests/unit/ready-route.test.ts`; `tests/unit/network-status-banner.test.tsx`; `tests/network.spec.ts`; `tests/runtime.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Pilot one bounded server summary using existing collectors, seed SWR with its timestamp/quality, and revalidate in the browser. Provide a clear static explanation/source path when collection fails or JavaScript is disabled.
- [ ] Verify the acceptance: No-JavaScript and blocked-provider checks retain meaningful source-qualified information. Client refresh replaces seeded evidence coherently; stale seed cannot masquerade as fresh. Test collection deadlines, hydration, CSP and failure behavior against the actual Cloudflare candidate.
- [ ] Run `npm run test:unit -- tests/unit/ready-route.test.ts tests/unit/network-status-banner.test.tsx`. Exercise `npx playwright test tests/network.spec.ts tests/runtime.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Keep nonce CSP and dynamic/no-store HTML behavior. No personalized rendering, indefinite HTML snapshot cache, duplicated server transport or promise of faster loading without measurement.

#### PR-50 — Explain external-provider requests at the point of use

**Issue:** [#149](https://github.com/Reedtrullz/tcwiki/issues/149) · Privacy Transparency / UX; P2; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-47](https://github.com/Reedtrullz/tcwiki/issues/146) and [PR-63](https://github.com/Reedtrullz/tcwiki/issues/162).

**Files / checks:** `src/lib/api/thornode.ts`; `src/app/network/NetworkPageClient.tsx`; `src/lib/source-map-explorer.ts`; `tests/unit/network-diagnostics.test.ts`; `tests/network.spec.ts`; `tests/docs-glossary.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add concise provider/request disclosure beside explicit quote and diagnostic actions, with a maintained list of request destinations and parameters. Keep quotes manual and explain what an exported packet contains.
- [ ] Verify the acceptance: Readers can identify destination, transmitted parameters and what stays local before requesting a quote. Copy matches actual client behavior, remains accessible and does not bury the primary action.
- [ ] Run `npm run test:unit -- tests/unit/network-diagnostics.test.ts`. Exercise `npx playwright test tests/network.spec.ts tests/docs-glossary.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No new tracking, request-history storage, silently introduced proxy, consent framework or legal conclusion. Existing referrer controls should be described accurately.

### Wave 5 — Build the editorial evidence and learning content

#### PR-27 — Detect primary-source changes and external-link decay

**Issue:** [#192](https://github.com/Reedtrullz/tcwiki/issues/192) · Content Reliability / Automation; P2; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/lib/sources.ts`; `scripts/report-content-reviews.mjs`; `tests/link-integrity.spec.ts`; `.github/workflows/operations.yml`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add a bounded scheduled checker for allowlisted canonical sources, retaining status, final URL, validator/hash and a useful normalized diff. Map changed sources back to affected records; distinguish transient blocking/rate limits from removed content.
- [ ] Verify the acceptance: A fixture source change identifies dependent records; harmless chrome changes do not create a review storm; redirects, 429 and timeouts retain evidence and recover on bounded retry.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above.

**Stop at this boundary:** No crawling Discord/private sources, arbitrary URLs, automatic prose updates or semantic certification. Live API payload changes require [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178)'s schema logic rather than full-page hashing.

#### PR-28 — Pilot claim-level source and version evidence

**Issue:** [#193](https://github.com/Reedtrullz/tcwiki/issues/193) · Content Architecture / Core Product; P2; M pilot.

**Start after:** PR-02. **Published coordination:** [PR-02](https://github.com/Reedtrullz/tcwiki/issues/167).

**Files / checks:** `src/lib/types.ts`; `src/lib/content/registry.ts`; `content/deep-dives/governance-comprehensive.mdx`; `src/components/features/PageSourcePosture.tsx`; `tests/unit/source-labels.test.tsx`; `tests/unit/static-data-freshness.test.ts`.

**Execution note:** Pick one small governance/incident cohort; add only claim fields consumed by review/citation. Apply reviewed metadata to that cohort before downstream exports, avoiding a whole-wiki schema migration.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Pilot stable claim IDs on one governance/incident cohort: source reference, observed/version scope, current/historical/design classification, review decision and superseding claim. Render a compact claim citation and derive review work from the affected claims.
- [ ] Verify the acceptance: Each pilot claim can be traced to its actual cited evidence; conflicting/superseded states stay explicit; changing one source does not reset unrelated review dates; search/citations expose claim scope.
- [ ] Run `npm run test:unit -- tests/unit/source-labels.test.tsx tests/unit/static-data-freshness.test.ts`.

**Stop at this boundary:** Keep static/MDX editorial ownership; no database/CMS, migration of every sentence or automatic live-state assertions.

#### PR-29 — Turn the existing review report into an actionable editorial queue

**Issue:** [#194](https://github.com/Reedtrullz/tcwiki/issues/194) · Developer Experience / Editorial UX; P2; S–M.

**Start after:** PR-02. **Published coordination:** [PR-02](https://github.com/Reedtrullz/tcwiki/issues/167); [PR-27](https://github.com/Reedtrullz/tcwiki/issues/192) can enrich the queue later without blocking its initial release.

**Files / checks:** `scripts/report-content-reviews.mjs`; `scripts/lib/content-review-schedule.mjs`; `.github/workflows/operations.yml`; `tests/unit/content-review-schedule.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Publish a concise CI step summary or local HTML/Markdown queue with exact source file/record IDs, due dates, owner, source links and changed-source context. Offer explicit export to a prefilled review issue for selected items.
- [ ] Verify the acceptance: An editor can open the relevant record/source from the queue, see why review is needed, and record an evidence-backed decision. IDs survive reruns; duplicate tasks are detected.
- [ ] Run `npm run test:unit -- tests/unit/content-review-schedule.test.ts`.

**Stop at this boundary:** Start with report output rather than an authenticated editor application. Issue publication is an explicit action; do not spam one issue per record or mark source fetch as review completion.

#### PR-30 — Separate content invariants from editorial wording snapshots

**Issue:** [#195](https://github.com/Reedtrullz/tcwiki/issues/195) · Testing / Developer Experience; P2; S–M.

**Start after:** PR-28. **Published coordination:** [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193) for the pilot cohort's claim identity; independent generic invariant cleanup can be scoped separately.

**Files / checks:** `tests/unit/chain-data-content-review.test.ts`; `scripts/check-curated-data.mjs`; `tests/unit/liquidity-economics-content-review.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Keep structural/source/anchor/unit/current-versus-historical invariants machine checked. Where an exact date or phrase represents an editorial decision, identify its reviewed cohort/claim evidence in a small fixture rather than duplicating it across code. Retain targeted assertions for safety-critical copy.
- [ ] Verify the acceptance: A cosmetic paragraph edit does not break unrelated tests; removing a source, qualifier, anchor or historical boundary still fails. Review-date updates remain attributable to a real evidence change.
- [ ] Run `npm run test:unit -- tests/unit/chain-data-content-review.test.ts tests/unit/liquidity-economics-content-review.test.ts`.

**Stop at this boundary:** No deletion of meaningful regression checks, replacement with hashes, generic schema library, or splitting large files merely because of line count.

#### PR-32 — Provide contribution and review templates that preserve evidence

**Issue:** [#197](https://github.com/Reedtrullz/tcwiki/issues/197) · Developer Experience / Community Workflow; P2; S.

**Start after:** PR-01. **Published coordination:** [PR-01](https://github.com/Reedtrullz/tcwiki/issues/166).

**Files / checks:** `CONTRIBUTING.md`; `src/lib/content/registry.ts`; `.github/ISSUE_TEMPLATE/ (proposed, only templates justified by the manual example)`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add small templates for article/source correction, runtime defect and implementation PR review; document one complete example. Reuse content checks to identify omissions and link focused verification commands appropriate to the serving runtime.
- [ ] Verify the acceptance: A newcomer can propose a correction with source/date/confidence and review boundary; a new article remains discoverable and searchable; runtime PRs state artifact/runtime proof separately from human content acceptance.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above.

**Stop at this boundary:** No scaffolding generator unless the manual example demonstrably remains error-prone; no requirement that every copy edit run a live financial inquiry.

#### PR-31 — Publish a curated “what changed” feed

**Issue:** [#196](https://github.com/Reedtrullz/tcwiki/issues/196) · Product / Discoverability; P2; M.

**Start after:** PR-28. **Published coordination:** [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193) for claim-level updates; basic route-level feed can ship first.

**Files / checks:** `src/lib/data/static.ts`; `src/lib/content/registry.ts`; `src/lib/sitemap.ts`; `tests/unit/site-discovery.test.ts`.

**Execution note:** Initial route-level feed may be simpler than the full claim-aware slice. Keep one authored record source and stable IDs; do not convert raw commits into protocol news.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add a small authored change record for substantive content updates, showing what changed, affected route/claim, source date and review date. Render a page and feed from the same records; use genuine modification metadata for discoverability.
- [ ] Verify the acceptance: Stable feed IDs and valid dates; update links resolve; an old incident's renewed review is distinguished from the incident occurring today; robots/metadata and feed validation have focused coverage.
- [ ] Run `npm run test:unit -- tests/unit/site-discovery.test.ts`.

**Stop at this boundary:** Do not report build time as editorial review, turn raw git commits into protocol news, or infer live events from polling.

#### PR-61 — Record owner-approved licensing and attribution policy

**Issue:** [#160](https://github.com/Reedtrullz/tcwiki/issues/160) · Governance / Interoperability Foundation; P3; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; coordinate with [PR-32](https://github.com/Reedtrullz/tcwiki/issues/197).

**Files / checks:** `CONTRIBUTING.md`; `src/lib/data/static.ts`.

**Execution note:** Prepare a rights/provenance inventory now and request the owner decision during execution. Approval of this workplan is not approval of a license; full-text redistribution waits for the explicit choice.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Prepare an inventory of original code/content versus externally attributed material; obtain the owner's explicit licensing choice and record scope, attribution and contribution expectations. Link the adopted policy from export/contribution surfaces.
- [ ] Verify the acceptance: Owner decision is recorded; included material has identified provenance and redistribution scope, and any exclusions are visible. Repository/contribution/export wording agrees.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. The owner choice and rights inventory are required evidence, not something tests can approve.

**Stop at this boundary:** Do not choose a license for the owner, infer rights to third-party/private content, copy full external articles or provide a legal determination. Metadata-only exports may be scoped separately after review.

#### PR-23 — Add printable article views and portable citations

**Issue:** [#188](https://github.com/Reedtrullz/tcwiki/issues/188) · Product / Reading UX / Interoperability; P2; S–M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None.

**Files / checks:** `src/components/features/DeepDiveShell.tsx`; `src/components/ui/SourceMetaDisclosure.tsx`; `src/app/globals.css`; `src/components/features/SourceMapExplorer.tsx`; `tests/deep-dives.spec.ts`; `tests/source-posture.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Use browser print and CSS to show readable article content, expanded sources, canonical URL, review dates and historical/current boundaries. Add copy citation as text/Markdown and a small source-rich article export where it can reuse existing content.
- [ ] Verify the acceptance: Print preview is legible across page breaks and wide tables; copied citations include title/section URL, source URLs and dates; clipboard failure has visible fallback; exported live references carry observation time and limitations.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/deep-dives.spec.ts tests/source-posture.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Start with curated articles. Do not freeze live dashboards as apparently current evidence, add a PDF service or silently cache offline operational results.

#### PR-69 — Add OP_RETURN as an external Bitcoin memo archive source

**Issue:** [#204](https://github.com/Reedtrullz/tcwiki/issues/204) · Source Discovery / Content; P2; S.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Source/link review at implementation time; coordinate [PR-67](https://github.com/Reedtrullz/tcwiki/issues/202). Fits the existing source registry and curated data conventions.

**Files / checks:** `src/lib/sources.ts`; `src/lib/data/static.ts`; `src/lib/content/registry.ts`; `content/deep-dives/streaming-swaps-refunds.mdx`; `content/deep-dives/build-query-data.mdx`; `tests/unit/static-data-freshness.test.ts`; `tests/unit/search-registry.test.ts`; `tests/docs-glossary.spec.ts`; `tests/link-integrity.spec.ts`.

**Execution note:** Review the current third-party link and add one registry entry reused by guides/source map. This is Bitcoin-only discovery context; no API integration, iframe or polling.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add one curated, dated external source entry and reuse it in Source Map plus swap/refund and build/query guides. Describe what readers can inspect: payload bytes, transaction/block references and Bitcoin-side history.
- [ ] Verify the acceptance: The source entry carries URL, review date, confidence and coverage caveat; relevant guides link to the same entry without duplicate data. Content/search checks pass and wording distinguishes recorded bytes from THORChain validation/settlement.
- [ ] Run `npm run test:unit -- tests/unit/static-data-freshness.test.ts tests/unit/search-registry.test.ts`. Exercise `npx playwright test tests/docs-glossary.spec.ts tests/link-integrity.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Third-party archive, Bitcoin-only and incomplete by design relative to all THORChain activity. Do not endorse its classification, ticker counts, complete historical coverage, address attribution, or successful cross-chain execution. No iframe, ingestion, polling or API dependency.

#### PR-67 — Add annotated real transaction examples to existing guides

**Issue:** [#202](https://github.com/Reedtrullz/tcwiki/issues/202) · Learning / Evidence UX; P2; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** Primary-source review of selected examples. Coordinate with PR-28 / #193 (claim evidence), PR-60 / #159 (execution map), and PR-33 / #198 (transaction triage); examples do not require a live lookup service.

**Files / checks:** `content/deep-dives/streaming-swaps-refunds.mdx`; `content/deep-dives/build-query-data.mdx`; `content/deep-dives/tss.mdx (verify migration example belongs here before editing)`; `src/lib/content/registry.ts`; `src/lib/sources.ts`; `tests/unit/swap-glossary-route-content-review.test.ts`; `tests/deep-dives.spec.ts`; `tests/search.spec.ts`.

**Execution note:** Select and independently verify a small real swap/refund/outbound/vault-migration set during execution. The inspected OP_RETURN record is a candidate only; do not publish it as a certified fixture.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add a bounded example set for a swap, refund, outbound and vault migration to existing guides. Each example pairs original memo text with field explanations, source chain, transaction and block links, observation/review date, and the outcome evidence actually available. Link from the relevant learning paths and search entries. Real examples must be selected and verified during implementation; today's inspected swap is a research candidate, not a certified teaching fixture.
- [ ] Verify the acceptance: Every example has independently reviewable transaction evidence and current primary syntax references; raw and interpreted fields remain distinguishable; source units/case are preserved; examples explain what cannot be inferred. Generated search and content checks pass; the annotated view has an accessible text/table representation.
- [ ] Run `npm run test:unit -- tests/unit/swap-glossary-route-content-review.test.ts`. Exercise `npx playwright test tests/deep-dives.spec.ts tests/search.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No indexer, continuous feed, wallet connection, transaction builder, address watchlist or copied third-party article. Missing lifecycle evidence remains unknown. Separate Bitcoin confirmation from THORChain processing and destination settlement.

#### PR-60 — Add one annotated execution-and-evidence map to a learning path

**Issue:** [#159](https://github.com/Reedtrullz/tcwiki/issues/159) · Product / Education; P3; M.

**Start after:** PR-24, PR-21, PR-59. **Published coordination:** [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189) for stable destinations; coordinate with [PR-21](https://github.com/Reedtrullz/tcwiki/issues/186) and [PR-59](https://github.com/Reedtrullz/tcwiki/issues/158).

**Files / checks:** `content/deep-dives/clp.mdx`; `content/deep-dives/build-query-data.mdx`; `src/lib/content/registry.ts`; `tests/unit/deep-dive-toc.test.ts`; `tests/deep-dives.spec.ts`; `tests/accessibility.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Pilot one source-reviewed SVG/CSS diagram with an equivalent ordered text/table view and links to relevant anchored explanations. Mark evidence boundaries and possible failure/refund branches explicitly.
- [ ] Verify the acceptance: Keyboard/screen-reader users receive the same stages and caveats; narrow screens retain readable labels. Every semantic edge has reviewable source evidence and no green line implies a completed live transaction.
- [ ] Run `npm run test:unit -- tests/unit/deep-dive-toc.test.ts`. Exercise `npx playwright test tests/deep-dives.spec.ts tests/accessibility.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No diagram framework, animated execution claim, real transaction tracker ([PR-33](https://github.com/Reedtrullz/tcwiki/issues/198)) or simulation engine ([PR-34](https://github.com/Reedtrullz/tcwiki/issues/199)). Start with one maintained map.

### Wave 6 — Ship bounded learning and reuse pilots

#### PR-68 — Add a read-only educational memo decoder

**Issue:** [#203](https://github.com/Reedtrullz/tcwiki/issues/203) · Learning / Bounded Tool; P2; M.

**Start after:** PR-08, PR-67, PR-21. **Published coordination:** Current primary grammar/version review and PR-08 / #173 (numeric limits) for interpreted numeric display; coordinate [PR-67](https://github.com/Reedtrullz/tcwiki/issues/202) for examples and PR-21 / #186 for accessibility. No dependency on an OP_RETURN API.

**Files / checks:** `src/lib/ (reuse a compatible parser; otherwise one bounded memo-decoder module, proposed)`; `src/components/features/ (one local decoder view, proposed)`; `tests/unit/memo-decoder.test.ts (proposed; create only if no existing suite covers the boundary)`; `tests/unit/trust.test.ts`; `tests/accessibility.spec.ts`; `tests/deep-dives.spec.ts`.

**Execution note:** Keep the original memo unchanged and decode locally. Verify current source grammar/version/aliases, support only the reviewed families, and never silently resolve historical aliases through current state.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Let a reader paste an existing memo and inspect its action and supported asset, destination, limit, streaming and affiliate fields beside the unchanged original. Start with the small set of memo families covered by [PR-67](https://github.com/Reedtrullz/tcwiki/issues/202). Derive grammar, aliases and version applicability from current official developer documentation and THORNode source. Reuse any maintained, compatible parser already present or installed after checking its behavior; otherwise implement only the supported grammar.
- [ ] Verify the acceptance: Source-backed fixtures cover supported examples, action-specific field meanings, malformed/unknown input, aliases and streaming/affiliate variants. Preserve address/hash case and precision; bound input size and render input as text. Accessible input/output and clear interpretation limitations. Parser success proves interpretation only, not live feature availability or execution.
- [ ] Run `npm run test:unit -- tests/unit/trust.test.ts`. Exercise `npx playwright test tests/accessibility.spec.ts tests/deep-dives.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Decode locally without retaining or automatically transmitting input. No wallet/send flow, generated executable memo, remote arbitrary URL fetch, automatic alias guessing or claim that parsed intent executed successfully. Unknown, malformed and unsupported fields stay visible; asset aliases and historical applicability must not be silently resolved using today's state.

#### PR-34 — Build one educational protocol scenario lab

**Issue:** [#199](https://github.com/Reedtrullz/tcwiki/issues/199) · Stretch / Learning Product; P3; L.

**Start after:** PR-08, PR-21. **Published coordination:** [PR-08](https://github.com/Reedtrullz/tcwiki/issues/173) for arithmetic; [PR-21](https://github.com/Reedtrullz/tcwiki/issues/186) for interaction accessibility.

**Files / checks:** `content/deep-dives/clp.mdx`; `content/deep-dives/incentive-pendulum.mdx`; `src/lib/operational-controls.ts`; `tests/unit/trust.test.ts`; `tests/accessibility.spec.ts`; `tests/deep-dives.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Choose one small lab first: CLP amount/depth/slip or Mimir scheduled/active/expired controls. Show source-backed equations/rules, assumptions and the resulting state, with accessible numeric inputs and deterministic examples. Add other mechanisms only after learner feedback.
- [ ] Verify the acceptance: Known source examples and boundary tests reproduce the intended model; invalid inputs cannot produce plausible nonsense; users can explain its key limitation and link to the relevant live check.
- [ ] Run `npm run test:unit -- tests/unit/trust.test.ts`. Exercise `npx playwright test tests/accessibility.spec.ts tests/deep-dives.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Toy scenarios, not quotes, price targets, investment returns, exact protocol execution or a full simulator. Current primary rule/version review is required before implementation.

#### PR-36 — Let readers save a learning path without an account

**Issue:** [#201](https://github.com/Reedtrullz/tcwiki/issues/201) · Optional Product / Learning UX; P3; M.

**Start after:** Wave 0 safety/baseline; otherwise independent. **Published coordination:** None; [PR-31](https://github.com/Reedtrullz/tcwiki/issues/196) can later enrich “updated since saved” information.

**Files / checks:** `src/lib/content/registry.ts`; `src/components/features/DeepDiveShell.tsx`; `tests/unit/search-registry.test.ts`; `tests/deep-dives.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add opt-in browser-local completed-step/bookmark state with explicit reset and optional JSON export/import. Keep chosen path in the URL; show updated/superseded content since a bookmark without implying that reading equals competence.
- [ ] Verify the acceptance: Disabled/private/unavailable storage leaves navigation usable; reload resumes the chosen path; imports are size/schema bounded; removed IDs degrade to a recoverable link; no reading history is sent to an analytics endpoint.
- [ ] Run `npm run test:unit -- tests/unit/search-registry.test.ts`. Exercise `npx playwright test tests/deep-dives.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No account, server tracking, wallet identity, notifications or course platform. Defer offline service-worker caching until readers demonstrate that need.

#### PR-22 — Put the reader's answer before repeated evidence-routing copy

**Issue:** [#187](https://github.com/Reedtrullz/tcwiki/issues/187) · Product / UX; P2; M.

**Start after:** PR-07, PR-21. **Published coordination:** [PR-07](https://github.com/Reedtrullz/tcwiki/issues/172) for trustworthy live summaries.

**Files / checks:** `src/app/HomePageClient.tsx`; `src/app/stats/StatsPageClient.tsx`; `src/components/features/PageSourcePosture.tsx`; `src/components/features/ClaimCheckCard.tsx`; `tests/home.spec.ts`; `tests/stats.spec.ts`; `tests/source-posture.spec.ts`.

**Execution note:** Recruit one newcomer, one practical user and one builder for the same before/after tasks at phone/desktop widths. Agents can prepare/run technical journeys; human comprehension acceptance requires actual participants.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Run three short newcomer/user/builder task trials, then test a compact answer/status summary with one expandable evidence explanation. Keep important source warnings next to the result, and route deeper instructions through existing task links.
- [ ] Verify the acceptance: Record before/after time and success for the same tasks at phone/desktop widths; readers locate the result and its caveat with fewer detours; source-warning interpretation is preserved.
- [ ] Record the issue-specific source/configuration/manual proof and apply the gates above. Exercise `npx playwright test tests/home.spec.ts tests/stats.spec.ts tests/source-posture.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** A measured two-route trial, not a site redesign. Do not hide active blockers, confidence or sources to gain visual simplicity.

#### PR-48 — Compare a bounded selection of pools on a consistent basis

**Issue:** [#147](https://github.com/Reedtrullz/tcwiki/issues/147) · Product / Analytics; P3; M.

**Start after:** PR-46, PR-20. **Published coordination:** [PR-46](https://github.com/Reedtrullz/tcwiki/issues/145); coordinate with [PR-05](https://github.com/Reedtrullz/tcwiki/issues/170), [PR-08](https://github.com/Reedtrullz/tcwiki/issues/173) and [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178).

**Files / checks:** `src/components/features/StatsPoolExplorer.tsx`; `src/lib/stats-dashboard.ts`; `src/lib/api/midgard.ts`; `tests/unit/stats-dashboard.test.ts`; `tests/unit/stats-page-client.test.tsx`; `tests/stats.spec.ts`; `tests/accessibility.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Select up to three already loaded pools and render an accessible comparison table with metric basis, period, source age, missing-value states and universe coverage. Encode selection in the existing URL-state pattern. Add detail requests only if a named comparison question needs them.
- [ ] Verify the acceptance: Same-basis comparisons remain understandable on narrow screens and by keyboard; missing metrics remain missing. Reload/back/forward restore selection, and ordinary comparison adds no provider requests.
- [ ] Run `npm run test:unit -- tests/unit/stats-dashboard.test.ts tests/unit/stats-page-client.test.tsx`. Exercise `npx playwright test tests/stats.spec.ts tests/accessibility.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No portfolio optimizer, wallet connection, return forecast, asset recommendation or unconditional per-pool request fan-out.

#### PR-47 — Export the evidence actually observed in a live diagnostic

**Issue:** [#146](https://github.com/Reedtrullz/tcwiki/issues/146) · Product / Interoperability; P2; M.

**Start after:** PR-12, PR-43, PR-44. **Published coordination:** [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177), [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142), [PR-44](https://github.com/Reedtrullz/tcwiki/issues/143) for a fully qualified export; a smaller pilot must label unsupported fields.

**Files / checks:** `src/lib/source-map-explorer.ts`; `src/components/features/SourceMapExplorer.tsx`; `src/app/network/NetworkPageClient.tsx`; `tests/unit/source-map-explorer.test.ts`; `tests/network.spec.ts`; `tests/docs-glossary.spec.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add an explicit export action for one bounded diagnostic snapshot as JSON and readable Markdown. Include schema version, requested/observed height, collection times, provider URLs, quality/warnings, units and runtime identity where actually known; label missing fields. Reuse current evidence types and the visible copy fallback.
- [ ] Verify the acceptance: Partial, degraded, stale and unsupported-pinning exports match displayed evidence, preserve raw units and render safely when clipboard permission fails. Snapshot output is deterministic except explicit observation metadata; test schema compatibility and import as inert data.
- [ ] Run `npm run test:unit -- tests/unit/source-map-explorer.test.ts`. Exercise `npx playwright test tests/network.spec.ts tests/docs-glossary.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** Export only evidence already collected. No accounts, background recording, private address capture, transaction execution or implied provider attestation. This is separate from [PR-23](https://github.com/Reedtrullz/tcwiki/issues/188)'s printable authored articles.

#### PR-62 — Export a versioned, curated knowledge graph as ordinary JSON

**Issue:** [#161](https://github.com/Reedtrullz/tcwiki/issues/161) · Advanced / Interoperability; P3; M–L.

**Start after:** PR-28, PR-61, PR-24. **Published coordination:** [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193), [PR-61](https://github.com/Reedtrullz/tcwiki/issues/160); coordinate section IDs with [PR-24](https://github.com/Reedtrullz/tcwiki/issues/189) and updates with [PR-31](https://github.com/Reedtrullz/tcwiki/issues/196).

**Files / checks:** `src/lib/content/registry.ts`; `src/lib/data/static.ts`; `src/lib/search/registry.ts`; `public/llms.txt (proposed generated output)`; `scripts/ (one bounded export generator, location chosen after consumer check)`; `tests/unit/search-registry.test.ts`; `tests/unit/site-discovery.test.ts`.

**Execution note:** Include the 2 October refinement: generate a short llms.txt from the registry pointing to reviewed pages and JSON. Owned-article Markdown is conditional on #61 and a named consumer; no API/MCP/A2A platform.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Generate a bounded versioned JSON artifact for reviewed entities/relationships: stable IDs, route/title, source/confidence/review metadata, terminology and reading links. Include content/build identity and a checksum; start with one cohort covered by [PR-28](https://github.com/Reedtrullz/tcwiki/issues/193).
- [ ] Verify the acceptance: Schema and compatibility are documented; every exported fact points to its evidence and unknown review state remains unknown. Generation is deterministic, stale/deleted links fail a narrow check, and consumers can inspect a sample without special infrastructure.
- [ ] Run `npm run test:unit -- tests/unit/search-registry.test.ts tests/unit/site-discovery.test.ts`. Check deterministic regeneration, broken/deleted links, schema compatibility and the llms.txt output; owned Markdown remains conditional.

**Stop at this boundary:** No graph database, CMS, hosted semantic service, automatically generated claims or full third-party text without the policy in [PR-61](https://github.com/Reedtrullz/tcwiki/issues/160). [PR-31](https://github.com/Reedtrullz/tcwiki/issues/196)'s human update feed remains a different output.

### Wave 7 — Add read-only transaction and provider investigation

#### PR-33 — Add a read-only transaction evidence triage pilot

**Issue:** [#198](https://github.com/Reedtrullz/tcwiki/issues/198) · Stretch / Advanced / Core Product; P3; L.

**Start after:** PR-06, PR-08, PR-13, PR-50, PR-57. **Published coordination:** [PR-06](https://github.com/Reedtrullz/tcwiki/issues/171), [PR-08](https://github.com/Reedtrullz/tcwiki/issues/173), [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178).

**Files / checks:** `src/components/features/NetworkStatusBanner.tsx`; `src/lib/api/midgard.ts`; `content/deep-dives/streaming-swaps-refunds.mdx`; `tests/unit/network-diagnostics.test.ts`; `tests/unit/midgard.test.ts`; `tests/network.spec.ts`.

**Execution note:** Include the 2 October refinement: raw memo, parsed interpretation and separate source-chain confirmation, THORChain processing and destination settlement. Verify chosen provider contracts; OP_RETURN API availability was not established.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Start with one public transaction-hash lookup and a cited lifecycle timeline, linking the exact indexer/raw source used. Show unresolved/missing evidence and compare the actual transaction's time/inputs with current context without assigning a cause from present halts.
- [ ] Verify the acceptance: Sanitized fixtures cover observed, partial, refunded, multiple outbound and not-found cases; stale/indexer failures stay unknown; amounts/fees retain units; historical and current evidence cannot be conflated.
- [ ] Run `npm run test:unit -- tests/unit/network-diagnostics.test.ts tests/unit/midgard.test.ts`. Exercise `npx playwright test tests/network.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No wallet connection, signing, send instructions, automatic blame, recovery promises, stored address history or arbitrary URL fetches. Validate hash/chain inputs and privacy before adding providers.

#### PR-63 — Pilot an allowlisted, read-only API query recipe workbench

**Issue:** [#162](https://github.com/Reedtrullz/tcwiki/issues/162) · Stretch / Developer Product; P3; L.

**Start after:** PR-13, PR-44, PR-50, PR-57. **Published coordination:** [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178), [PR-44](https://github.com/Reedtrullz/tcwiki/issues/143), [PR-50](https://github.com/Reedtrullz/tcwiki/issues/149), [PR-57](https://github.com/Reedtrullz/tcwiki/issues/156).

**Files / checks:** `content/deep-dives/build-query-data.mdx`; `src/lib/source-map-explorer.ts`; `src/lib/api/thornode.ts`; `tests/unit/source-map-explorer.test.ts`; `tests/unit/thornode.test.ts`; `tests/docs-glossary.spec.ts`; `tests/network.spec.ts`.

**Execution note:** First check whether the maintained static recipe already answers the reader task. If it does, record that result; otherwise one explicit, fixed, allowlisted request uses the existing transport.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Pilot one existing recipe, such as a current control read: show the fixed URL, request once on explicit action, and display bounded raw/normalized evidence with units, height-verification limits, source quality and expiry. Reuse current transport/types.
- [ ] Verify the acceptance: Only allowlisted requests are possible; size/deadline limits apply. Invalid/version-drift responses show useful warnings, copy exports remain inert, and the workbench never converts a requested height into verified pinning without evidence.
- [ ] Run `npm run test:unit -- tests/unit/source-map-explorer.test.ts tests/unit/thornode.test.ts`. Exercise `npx playwright test tests/docs-glossary.spec.ts tests/network.spec.ts --project=chromium` against the stated candidate target; expand the existing journeys only where acceptance requires it.

**Stop at this boundary:** No arbitrary URL fetcher, credentials, mutation endpoints, wallet/address/memo tooling, unattended polling or general API-console platform. Stop if a maintained static example answers the user need adequately.

#### PR-64 — Compare two providers on explicit request without implying consensus

**Issue:** [#163](https://github.com/Reedtrullz/tcwiki/issues/163) · Stretch / Evidence Product; P3; M–L.

**Start after:** PR-39, PR-43, PR-44. **Published coordination:** [PR-39](https://github.com/Reedtrullz/tcwiki/issues/138), [PR-43](https://github.com/Reedtrullz/tcwiki/issues/142), [PR-44](https://github.com/Reedtrullz/tcwiki/issues/143); coordinate with [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178).

**Files / checks:** `src/lib/api/thornode.ts`; `scripts/lib/live-chain-snapshot.mjs`; `tests/unit/thornode.test.ts`; `tests/unit/live-chain-snapshot.test.ts`.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Add an opt-in comparison of two fixed providers for one bounded control dataset. Show timestamps/heights, field conflicts, missing data and semantic normalization; explain time skew and requested-height proof separately.
- [ ] Verify the acceptance: Equal, conflicting, unsupported-height, stale and unavailable fixtures remain distinguishable. Only explicit comparison adds the bounded second request; a newer sample is never mislabelled disagreement solely because it changed.
- [ ] Run `npm run test:unit -- tests/unit/thornode.test.ts tests/unit/live-chain-snapshot.test.ts`.

**Stop at this boundary:** No automatic hedging of every poll, majority-vote truth, signed-consensus claim, persistent history service ([PR-35](https://github.com/Reedtrullz/tcwiki/issues/200)) or production provider scoring without evidence.

### Wave 8 — Pilot historical operational evidence

#### PR-35 — Pilot recorded operational snapshots and explicit historical comparison

**Issue:** [#200](https://github.com/Reedtrullz/tcwiki/issues/200) · Stretch / Research / Observability; P3; L–XL.

**Start after:** PR-10, PR-12, PR-13, PR-15. **Published coordination:** [PR-10](https://github.com/Reedtrullz/tcwiki/issues/175), [PR-12](https://github.com/Reedtrullz/tcwiki/issues/177), [PR-13](https://github.com/Reedtrullz/tcwiki/issues/178), [PR-15](https://github.com/Reedtrullz/tcwiki/issues/180).

**Files / checks:** `src/lib/readiness-snapshot.ts`; `scripts/lib/readiness-monitor.mjs`; `wrangler.do.jsonc`; `tests/unit/readiness-monitor.test.ts`; `tests/unit/readiness-contract.test.ts`.

**Execution note:** Stop before storage work unless an operational owner accepts quota/retention, backup/export/restore and a named comparison task. Choose existing storage only after checking usage; no full-chain archive.

- [ ] Revalidate against current main and record the source/caller baseline.
- [ ] Implement the smallest reviewed slice: Capture a bounded, versioned set of public control/quality snapshots with provider, actual height, observed time and collector version. Pilot fixed retention and a simple comparison/replay UI that highlights changed controls, gaps and source disagreement.
- [ ] Verify the acceptance: Recorded views are unmistakably historical; missing intervals remain gaps; schema upgrades preserve old evidence; retention/export/restore and bounded usage are tested; clocks and provider/height differences stay visible.
- [ ] Run `npm run test:unit -- tests/unit/readiness-monitor.test.ts tests/unit/readiness-contract.test.ts`.

**Stop at this boundary:** Start read-only and small. No full-chain archive, raw response hoarding, proof of continuous history or automatic incident narratives. A storage/quota/backup design and operational owner are prerequisites to implementation.

## Decision gates for the optional scope

| Proposal | Decision before further work | Smallest acceptable first result |
|---|---|---|
| PR-22 | Actual readers/participants available | Recorded task baseline; keep human acceptance pending until trials happen |
| PR-26 | Measured startup/payload/contention bottleneck | Reproducible measurements; no architectural optimization when no material problem appears |
| PR-28 / 62 | One reviewed cohort and consumer for reuse | Small static claim cohort and JSON/llms.txt; Markdown only with rights and demand |
| PR-33 | Maintained provider contract and one-hash investigation need | One bounded read-only timeline with unknowns; no wallet/indexer platform |
| PR-34 / 60 / 68 | Source/version rules and a concrete learning task | One lab, one maintained map, a few reviewed memo families; expand after feedback |
| PR-35 | Owner, quota/retention and backup/restore accepted | Small recorded operational cohort, explicit gaps and recoverable export |
| PR-36 | Reader need for persistence | Browser-local state/reset; no accounts/service worker |
| PR-48 / 65 | Consistent metric/meaning and loaded universe | Existing-data comparison/table; no per-pool/per-node fan-out |
| PR-61 | Explicit owner rights/license choice | Inventory and decision receipt; no inferred permission to redistribute third-party prose |
| PR-63 / 64 | Static evidence cannot adequately answer the task | One allowlisted manual recipe / two fixed provider comparison; no unattended polling |

Working through the entire plan means addressing these decisions explicitly as well as implementing accepted slices. Do not quietly abandon an item or mark a documented deferral as a shipped feature. Keep a decision-needed item separate so it does not block independent corrections.

## Tracking, review and handoff

Use this file's task checkboxes and the existing issue/PR links; no new project-management system. Keep a short milestone receipt with base/final SHA, issue IDs, changed contract, focused/integration commands and results, CI artifact/run, candidate/live identity where checked, rollback reference, source reviews and human/owner gates. Store no secrets or raw reader inputs.

At each milestone:

- [ ] Rebase the next isolated slice on the verified integrated main; do not automatically pull unrelated WIP into it.
- [ ] Check shared contracts with downstream callers; review source, privacy/accessibility and both target proofs as applicable.
- [ ] Confirm the actual deployed artifact only after an authorized release. Failed source checks retain reasons; liveness alone is insufficient.
- [ ] Verify the primary checkout's opening WIP hashes/status remain intact, and keep rollback/retirement assets.
- [ ] Update relevant issue/PR evidence when authorized, record remaining decisions and log a concise Obsidian summary.

**Recommended start:** Wave 0, in order: current-source/runtime inventory → safe cleanup hook → reproducible checks → scoped editorial gate and targeted ILP correction. Then the shared data-contract lane and production-shaped browser/release lane. Keep the source-reviewed OP_RETURN registry/examples in the independent editorial lane when it avoids waiting on runtime work.

**Completion criterion:** all 69 proposals have a reviewed disposition; every delivered slice satisfies its acceptance and applicable CI/runtime/source/human gates; remaining deferrals have a visible reason and revisit trigger. A passing test count, merged PR or this planning document alone is not that completion evidence.

## Planning verification

This plan was checked for exactly 69 unique tasks (PR-01–69), prerequisite order, coverage of the 2 October PR-33/62 refinements, and current-main existence of source paths carried from issue evidence. The source inventory retains full live issue bodies, open dependency PR status and opening WIP hashes. No app code, dependencies, tests, CI settings, issue state or deployment was changed by this planning turn; implementation gates above are prospective.
