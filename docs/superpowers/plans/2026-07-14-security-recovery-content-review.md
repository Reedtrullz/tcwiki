# Security and Recovery Content Review Implementation Plan

> **For agentic workers:** Execute this plan autonomously, one task at a time. Keep a live checklist, use tests before content changes where practical, and stop only at an explicit checkpoint, a genuine blocker, or the fully verified release handoff.

**Goal:** Complete one evidence-backed review release for the wiki's coupled TSS/GG20 security and TCY/THORFi recovery material, synchronize every derived search and presentation surface, and ship it through the normal release path without weakening or conflating production readiness.

**Architecture:** Treat the work as two claim cohorts sharing a single source-verification layer. Central source metadata lives in `src/lib/sources.ts`; curated records live in `src/lib/data/static.ts`; route/deep-dive metadata and task guides live in `src/lib/content/registry.ts`; glossary definitions live in `src/lib/content/glossary.ts`; long-form claims live in MDX. Tests lock the cross-surface claim boundaries before metadata is advanced. Generated MDX search is refreshed only after the source content is final.

**Tech stack:** The checked-in `package.json` and lockfile are authoritative: Next.js 16, React 19, TypeScript 6, MDX, Vitest 4, Playwright 1.61, Node.js 22.22.3, GitHub Actions, and the Docker/Ansible release pipeline. Do not install or upgrade dependencies as part of this content review.

## Why this is the next release

The content-review report has no overdue records, but 120 records become due within 30 days. The best first batch is not all 120: the security/recovery records below share the same official incident, upgrade, tokenomics, and recovery sources, and they already cross-link through search, guides, glossary terms, governance records, and two deep dives. Reviewing them atomically reduces contradictory wording while keeping the pull request independently reviewable.

The deployed readiness monitor remains a separate operational concern. A valid `503 degraded` response from `/api/ready?contract=strict` does not invalidate a content release, and this plan must not change readiness thresholds, provider selection, host monitoring, systemd configuration, or issue `#63` merely to make deployment proof look green.

## Scope contract

### Included records

- Deep dives: `deep-dive-tss`, `deep-dive-tcy-recovery-timeline`.
- Task guides: `tss-security-claims`, `tcy-recovery`.
- Incidents: `gg20-vault-exploit-2026`, `thorfi-unwind-2025`.
- Governance: `adr-028-recovery`, `thorfi-unwind`.
- Tokenomics: `tcy-recovery-context`.
- Directly coupled glossary terms: `tss`, `gg20`, `dkls`, `schnorr`, `paillier`, `mta`, `multi-prime-modulus`, `key-sign-failures`, `keyverify`, `compromised-vault`, `tcy`, and `savers`.
- Shared official source records used by those claims, including TCY developer/tokenomics material, THORFi unwind material, both GG20 exploit reports, v3.19.x upgrade material, and TSS/vault documentation.

### Explicitly deferred

- The standalone Bifrost, churning, slashing, THORSwap, chain, and generic source-map review cohorts.
- Product redesign, search-ranking churn unrelated to corrected source text, and new live-data features.
- Changes to `/api/ready`, provider failover, scheduled workflows, the VPS host monitor, or deployment policy.
- A blanket date bump for records that were not individually re-read against primary evidence.

## Non-negotiable claim boundaries

- Use official THORChain documentation, release notes, governance material, and incident reports as primary evidence. Secondary sources may provide discovery context but cannot advance `official` review metadata by themselves.
- Distinguish the historical GG20 exploit mechanics from the current signing implementation. Do not state that DKLS, Schnorr, dual-scheme vaults, validator-age rules, or other proposals are deployed unless a current primary source proves it.
- Preserve THORFi and Savers/Lending as historical context. TCY must not be described as proof of par redemption, guaranteed recovery, or restored Savers/Lending availability.
- Keep ADR-028 at `needs-review` unless a current official source establishes its accepted and implemented state. A newer source date alone is not enough to promote confidence.
- A source that is still reachable is not automatically current evidence. Record what was verified, what remains historical, and what is still unknown.
- Centralize shared `SourceMeta` definitions in `src/lib/sources.ts`; do not reintroduce duplicate URL/label/date objects in registries or datasets.
- Update `reviewedAt` and `nextReviewDue` only for records actually reviewed. Use the execution date and the repository's normal one-month review cadence.

## File map

### Source and content files

- Modify `src/lib/sources.ts`: verified source metadata, notes, and any newly required official primary source.
- Modify `src/lib/data/static.ts`: incident, governance, and tokenomics records.
- Modify `src/lib/content/registry.ts`: deep-dive metadata and task guides.
- Modify `src/lib/content/glossary.ts`: directly coupled definitions and claim cautions.
- Modify `content/deep-dives/tss.mdx`: historical exploit mechanics, dated mitigations, and current-status boundary.
- Modify `content/deep-dives/tcy-recovery-timeline.mdx`: historical unwind, token mechanics, recovery caveats, and current checks.
- Regenerate `src/lib/search/mdx-documents.generated.ts` after MDX changes.

### Primary verification files

- Modify `tests/unit/source-labels.test.tsx`.
- Modify `tests/unit/search-registry.test.ts`.
- Modify `tests/unit/search-ranking.test.ts` only if corrected terminology changes intended routing.
- Modify `tests/unit/search-presentation.test.ts` only if source posture or confidence presentation changes.
- Modify `tests/governance.spec.ts`.
- Modify `tests/tcy.spec.ts`.
- Modify `tests/deep-dives.spec.ts`.
- Modify `tests/docs-glossary.spec.ts`.
- Modify `tests/search.spec.ts` only for high-value end-to-end journeys not already covered elsewhere.

---

## Task 1: Establish the baseline and source-claim matrix

- [ ] Confirm the branch starts from current `origin/main` and contains only this plan.
- [ ] Run the disk guard before the first build/test loop:

```bash
if [ -d /System/Volumes/Data ]; then df -h /System/Volumes/Data; else df -h /; fi
```

Stop and report if free space is below 30 GiB.

- [ ] Pin all repository commands to Node 22.22.3:

```bash
fnm exec --using 22.22.3 node --version
fnm exec --using 22.22.3 npm --version
```

- [ ] Capture the current review queue and included metadata without editing tracked files:

```bash
fnm exec --using 22.22.3 npm run report:content-reviews -- --horizon-days 30
git status --short
```

- [ ] Build a working source-claim matrix in the task notes or PR draft with one row per included record and these fields: record ID, current confidence, current `reviewedAt`, current `nextReviewDue`, source URLs, claim being checked, primary-source result, proposed wording/status, and unresolved uncertainty.
- [ ] Open every primary source directly. Record HTTP availability, visible publication/update date, relevant claim, and whether the source describes historical action, a proposal, or current implementation.
- [ ] Search current official release/governance documentation for superseding evidence. Do not substitute search snippets for opened-source evidence.
- [ ] Checkpoint: present the completed matrix before changing claims. If evidence conflicts, preserve the conservative wording and mark the uncertainty rather than guessing.

**Baseline acceptance:** The matrix covers every included record and every shared source. No content metadata has changed yet. Unrelated due-soon records remain out of scope.

## Task 2: Add RED cross-surface guardrails

- [ ] In `tests/unit/source-labels.test.tsx`, add a table-driven cohort test that resolves every included record and asserts:
  - the intended confidence and tracker posture;
  - official source labels and canonical URLs;
  - the new review date and next-review date for reviewed records;
  - historical/current distinctions for the two incidents;
  - ADR-028 remains `needs-review` unless Task 1 proved otherwise.
- [ ] In `tests/unit/search-registry.test.ts`, add assertions that generated/curated search documents expose the same confidence, review dates, source URLs, and conservative recovery/security wording.
- [ ] Add focused terminology assertions for claims most likely to drift:
  - `DKLS` and `Schnorr` route to the TSS guide/deep dive without asserting completed migration;
  - `Paillier`, `MTA`, and `multi-prime modulus` remain incident-root-cause vocabulary;
  - `TCY recovery`, `Savers available`, and `par redemption` route to the recovery guide and preserve the historical/market-dependent caveat;
  - `ADR-028` remains visibly needs-review unless primary proof supports promotion.
- [ ] Run only the focused unit files and confirm the new date/content expectations fail before implementation:

```bash
fnm exec --using 22.22.3 npm run test:unit -- tests/unit/source-labels.test.tsx tests/unit/search-registry.test.ts tests/unit/search-ranking.test.ts tests/unit/search-presentation.test.ts
```

- [ ] Confirm at least one newly added cohort assertion fails for the expected stale date or wording. An unchanged pre-existing test passing is not RED proof.

**RED acceptance:** Failures are caused by the intended stale metadata or wording, not by broken fixtures or environment drift. Commit no generated file yet.

## Task 3: Review and refresh the TSS/GG20 cohort

- [ ] Reconcile the two official exploit reports, v3.19.x upgrade material, and current TSS/vault documentation.
- [ ] Update shared source records once in `src/lib/sources.ts`. Notes must say whether each source supports historical exploit mechanics, dated mitigation, a plan, or current implementation.
- [ ] Update `content/deep-dives/tss.mdx` so it clearly separates:
  1. threshold-signature architecture;
  2. the historical GG20 exploit/root cause;
  3. dated post-incident mitigations;
  4. proposals or migration directions;
  5. what an operator must verify live today.
- [ ] Update `deep-dive-tss` and `tss-security-claims` in `src/lib/content/registry.ts` with synchronized source/review metadata and conservative task wording.
- [ ] Update `gg20-vault-exploit-2026` in `src/lib/data/static.ts`; keep its tracker status aligned with current official evidence.
- [ ] Update the TSS/security glossary terms in `src/lib/content/glossary.ts`. Definitions must not turn incident-specific mechanics into generic node-failure explanations or turn proposed cryptography into a deployed-state claim.
- [ ] Run the focused unit suite from Task 2 until this cohort is green.
- [ ] Checkpoint: inspect the diff only for the TSS cohort and source definitions. Confirm no TCY claim or unrelated review date moved accidentally.

**TSS acceptance:** Every current-state sentence has a current official source or is explicitly framed as unknown/planned. Search still routes architecture questions to the deep dive and exploit questions to the incident record.

## Task 4: Review and refresh the TCY/THORFi cohort

- [ ] Reconcile official tokenomics/TCY documentation, the THORFi unwind record, archived product documentation, and any current official ADR-028/governance evidence.
- [ ] Update shared source records in `src/lib/sources.ts`; reuse existing definitions and add a source only when it materially supports a missing claim.
- [ ] Update `content/deep-dives/tcy-recovery-timeline.mdx` so it clearly separates:
  1. the historical THORFi unwind;
  2. TCY claim and staking mechanics;
  3. the distinct GG20 incident;
  4. market-dependent recovery limits;
  5. current checks for users and operators.
- [ ] Update `deep-dive-tcy-recovery-timeline` and `tcy-recovery` in `src/lib/content/registry.ts`.
- [ ] Update `tcy-recovery-context`, `thorfi-unwind-2025`, `thorfi-unwind`, and `adr-028-recovery` in `src/lib/data/static.ts`.
- [ ] Update only directly coupled TCY/Savers glossary terms in `src/lib/content/glossary.ts`.
- [ ] Keep historical incidents historical. Do not imply that TCY itself reopens Savers/Lending or guarantees full debt recovery.
- [ ] Run the focused unit suite from Task 2 until both cohorts are green.
- [ ] Checkpoint: inspect the diff for confidence promotion, tracker-status changes, and date changes. Every one must map to a row in the Task 1 matrix.

**TCY acceptance:** The same recovery caveat appears coherently in tokenomics, governance/incidents, the guide, deep dive, glossary, and search. ADR-028 confidence changes only with explicit primary proof.

## Task 5: Synchronize generated search and browser journeys

- [ ] Generate MDX search after final prose is stable:

```bash
fnm exec --using 22.22.3 npm run generate:search
```

- [ ] Review `git diff -- src/lib/search/mdx-documents.generated.ts` semantically. Changed generated payloads must belong only to `/deep-dives/tss` and `/deep-dives/tcy-recovery-timeline`; any other document payload is a scope failure.
- [ ] Prove generator determinism by running `npm run generate:search` a second time and confirming it produces no additional diff.
- [ ] Extend focused browser tests for the highest-risk user journeys:
  - governance distinguishes current GG20 tracking, historical THORFi, and ADR-028 confidence;
  - `/tcy` links to the recovery timeline and shows market-dependent wording;
  - TSS and TCY deep dives expose sources/review metadata and current-check sections;
  - glossary filtering finds security/recovery terms with conservative definitions;
  - search routes `DKLS`, `GG20 attack`, `TCY recovery`, `Savers available`, and `ADR-028` to the intended first action/result.
- [ ] Prefer the existing page-specific specs. Add to `tests/search.spec.ts` only when the assertion genuinely spans the whole search interaction.
- [ ] Run focused browser tests:

```bash
fnm exec --using 22.22.3 npx playwright test tests/governance.spec.ts tests/tcy.spec.ts tests/deep-dives.spec.ts tests/docs-glossary.spec.ts tests/search.spec.ts --project=chromium
```

**Search/browser acceptance:** Generated search is clean, route ordering remains intentional, and no content correction silently changes the user's task journey.

## Task 6: Run the full proportional release gates

- [ ] Verify tracked-release hygiene and content determinism:

```bash
fnm exec --using 22.22.3 npm run check:release-tracked
fnm exec --using 22.22.3 npm run check:content
git diff --check
git status --short
```

- [ ] Run static and unit gates:

```bash
fnm exec --using 22.22.3 npm run lint
fnm exec --using 22.22.3 npm run typecheck
fnm exec --using 22.22.3 npm run test:unit
fnm exec --using 22.22.3 npm run audit:prod
fnm exec --using 22.22.3 npm run audit:all
```

Both audit scripts use `--audit-level=moderate`; any nonzero exit is blocking. Do not change dependency versions or audit thresholds inside this content PR—open a separate security PR if the existing dependency graph fails.

- [ ] Build and verify the standalone artifact:

```bash
fnm exec --using 22.22.3 npm run build
fnm exec --using 22.22.3 npm run smoke:standalone
```

- [ ] Run browser and security gates:

```bash
fnm exec --using 22.22.3 npm run test:e2e
fnm exec --using 22.22.3 npm run test:e2e:csp
fnm exec --using 22.22.3 npm run test:e2e:links
```

- [ ] Run Docker runtime proof if the local Docker engine is available:

```bash
fnm exec --using 22.22.3 npm run smoke:docker
fnm exec --using 22.22.3 npm run test:e2e:docker-smoke
```

- [ ] Re-run `df -h /System/Volumes/Data` before another expensive loop. Clean owned bounded artifacts if required; do not delete the known virtualization-held worktree while it has live handles.
- [ ] Request an independent review focused on unsupported current-state claims, accidental confidence promotion, source duplication, and generated-search drift. Apply only evidence-backed fixes, then rerun affected gates.

**Gate acceptance:** All required local gates pass on Node 22.22.3. Any skipped Docker/manual gate is called out explicitly and must still pass in GitHub Actions before merge.

## Task 7: Commit, PR, merge, deploy, and read back

- [ ] Keep commits reviewable. Preferred sequence:
  1. test guardrails;
  2. TSS/GG20 source and content refresh;
  3. TCY/THORFi source and content refresh;
  4. generated search and browser proof.
- [ ] Before staging, inspect every changed/untracked file and confirm it belongs to the scope contract.
- [ ] Push `codex/security-recovery-content-review` and open a ready PR with:
  - the source-claim matrix summary;
  - exact included/deferred records;
  - confidence/tracker changes and explicit non-changes;
  - local gate evidence;
  - a statement that readiness issue `#63` is operationally separate.
- [ ] Wait for CI on the exact PR head SHA. Fix failures on the branch; do not merge around them.
- [ ] Squash merge only after required checks are green and review findings are resolved.
- [ ] Verify the main-branch release run for the exact merge SHA through image publication and VPS deploy.
- [ ] Read back production identity from `/api/version` and verify it matches the exact main SHA and immutable image digest.
- [ ] If production identity does not match, stop content verification and classify the failure before changing code: repair/retry the deployment for an identity/publication fault; open a revert PR for a release-introduced content/runtime defect. Preserve the failed run and live readback as evidence, and do not claim the release is deployed.
- [ ] Run production checks:

```bash
fnm exec --using 22.22.3 npm run check:runtime-url -- https://wiki.thorchain.no
PLAYWRIGHT_BASE_URL=https://wiki.thorchain.no fnm exec --using 22.22.3 npm run test:e2e
```

- [ ] Verify the live TSS deep dive, TCY recovery timeline, governance records, TCY page, glossary terms, and representative searches.
- [ ] Record `/api/ready?contract=strict` exactly as observed. A valid degraded response is a non-claim, not a reason to weaken readiness or falsely declare recovery.
- [ ] Do not comment on issue `#63` unless the readiness evidence itself materially changed during this release.
- [ ] Log exact merge SHA, CI/deploy run, image digest, live identity, content scope, source-review date, and readiness non-claim to the THORChain Wiki project note and today's Obsidian daily note.

**Release acceptance:** The exact reviewed commit is live, immutable identity matches, all scoped journeys work in production, and the release record distinguishes content correctness from current chain-provider readiness.

## Final definition of done

- [ ] Every included record was individually checked against opened primary evidence.
- [ ] Review dates advanced only for included records and every confidence/tracker change is justified.
- [ ] Historical incidents, proposals, current implementation, and unknowns are visibly distinct.
- [ ] Shared source metadata is centralized; no duplicate `SourceMeta` object was introduced.
- [ ] The two MDX files and their generated search documents are synchronized.
- [ ] Focused and full gates are green under Node 22.22.3, with exact proof preserved.
- [ ] No unrelated due-soon cohort or readiness/monitoring code changed.
- [ ] The PR is merged, the exact main release is deployed/read back, and Obsidian contains the evidence-backed handoff.

## Follow-on queue after this release

Only after this release is complete, re-run the 30-day report and select the next cohesive cohort. Recommended order:

1. Bifrost, churning, slashing, and node/operator safety claims.
2. Chain/source-map and THORNode/Midgard integration records.
3. THORSwap and ecosystem/product status records.
4. Split the large shared `tests/smoke.spec.ts` by page when a content cohort would otherwise increase merge-collision risk.

Each follow-on remains its own evidence matrix and mergeable PR; do not roll the remaining due-soon queue into this branch.
