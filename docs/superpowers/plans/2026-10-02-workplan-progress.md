# SDD ledger — plan: docs/superpowers/plans/2026-10-02-entire-workplan.md

Base: 686b63b1b04f9f6c3045904a552c519a89cced91

## Authorization

Execute all accepted work and create/push GitHub PRs; do not merge to main. User explicitly overrides 30GiB threshold. Primary WIP remains preserved.

## Rulings and interface preflight

- Ruling: use PR-keyed task briefs from the master plan rather than the skill task parser, which expects a different heading template; keep identical acceptance/scope and explicit per-task evidence. Cost if wrong: bookkeeping mismatch, not changed product scope.
- Ruling: independent implementation slices use stacked branches/PRs until owner merge; downstream features may build on unmerged predecessors with explicit base/diff boundaries. Cost if wrong: more merge coordination; no automatic main integration.
- Preflight: PR08 numeric contract feeds PR09/34/68 and financial displays; preserve exact base units and existing null behavior.
- Preflight: PR12 warnings feed PR13/16/35/47/51; retain string compatibility and fail-closed policy.
- Preflight: PR10/11/43 timing + PR44 pinning feed PR42/47/49/64; keep observation/request/delivery times separate. #205 already handles readiness age delivery.
- Preflight: PR24 anchors feed PR25/60/62; public fragments must stay stable.
- Preflight: PR02/28 evidence feeds PR29/30/31/62; no bulk date repin.
- Preflight: PR14/53/54/15 release contract feeds all runtime proofs; current target variables are CF=1/VPS=0 (read-only verified).
- Routed model catalog remains stale after sync with discovery failures; routed children blocked by user policy. Independently available native Luna can be used for final review.

## Tasks

| Proposal | Status | Commit/PR/evidence |
|---|---|---|
| PR-01 | PR open; local verified |155dc79; https://github.com/Reedtrullz/tcwiki/pull/209; readonly drift diagnostic RED→GREEN; primary React/Vitest mismatches preserved; current locked install matched; CF/VPS vars and version readback |
| PR-37 | PR open; local verified | 172f288; https://github.com/Reedtrullz/tcwiki/pull/207; 482 unit tests/types; lint 0 errors; CI37025577308SUCCESS; broad review pending |
| PR-02 | PR open; local verified |155dc79; https://github.com/Reedtrullz/tcwiki/pull/209; scoped exceptions RED→GREEN; strict default rejects overdue; candidate two exemptions through2026-10-09 proposed at owner merge; no review-date changes |
| PR-55 | PR open; local verified |155dc79; https://github.com/Reedtrullz/tcwiki/pull/209; mtime/deletion/server replacement RED→GREEN; real standalone build receipt generated; 495 unit tests/types/lint; real build and standalone smoke passed (live age warnings retained) |
| PR-59 | verified candidate | official CLP removal and amended ADR005 reviewed2026-10-02; claim-specific date, overall dates preserved; search regenerated; 506 unit/types/build +8 standalone browser checks |
| PR-08 | PR open; local verified | e2e61d4; https://github.com/Reedtrullz/tcwiki/pull/208; 479 unit tests/types; fractional bounds reviewed and corrected; CI37030208807 passed |
| PR-03 | PR open; local verified |6398da9+e082581; https://github.com/Reedtrullz/tcwiki/pull/213; parent review fixed acceptance timing/address/shape/slash tests; 486units/types/lint; single source disclosed |
| PR-12 | PR221 open; local verified | 139f3e4; https://github.com/Reedtrullz/tcwiki/pull/221; origin-typed warnings, shared cycle-safe collector; wording/malformed/provenance regressions; full520/types/lint; integration with220 full549/types; CI pending |
| PR-39 | PR215 open; CI passed | a9b3ab5; CI37035192897; canonical alias RED5/full513/types/lint |
| PR-13 | queued | issue #178 |
| PR-06 | PR216 open; CI passed | 2938a70; CI37036720991; supplied-clock states/full520/8Next network checks; deadline/resume never auto-probe |
| PR-18 | verified candidate | stalled read timeout/cancellation, bounded batch/depth/fields and suppressed-item response count; RED2 then GREEN11; full508/types/lint pass |
| PR-14 | verified candidate |23 actual WikiDO browser checks passed after reproducing/fixing missing MDX provider; CSP enforced; manifest-bound local candidate |
| PR-53 | verified candidate | explicit Next/Docker + CF source/config/copy roots; tracked/untracked/missing RED to GREEN |
| PR-54 | verified candidate | shared eight-case app/script identity parity matrix; metadata verified is validation not attestation |
| PR-15 | implemented candidate; operational gate | complete module/asset/config manifest, tested-artifact promotion and exclusive targets; real production rollback/readbacks await authorized release window |
| PR-17 | PR214 open; CI passed | f4786a7; CI37034658367; audits0/full508/both targets 8Next+23CF browser |
| PR-56 | PR214 open; CI passed | f4786a7; removed unused dependencies and starter SVGs after consumer review |
| PR-10 | queued | issue #175 |
| PR-11 | queued | issue #176 |
| PR-43 | queued | issue #142 |
| PR-07 | queued | issue #172 |
| PR-57 | queued | issue #156 |
| PR-44 | queued | issue #143 |
| PR-42 | queued | issue #141 |
| PR-51 | queued | issue #150 |
| PR-16 | queued | issue #181 |
| PR-45 | queued | issue #144 |
| PR-52 | queued | issue #151 |
| PR-04 | PR218 open; CI passed | 6b130055; CI37039713892; completed UTC day/zero/duplicate/gap/rollover; separate aggregate and actual comparison days |
| PR-38 | PR220 open; CI passed | 0982935; https://github.com/Reedtrullz/tcwiki/pull/220; CI37040858697; full542/types/lint/both builds; UTC chronology/gaps/overlap; 11 checks each Next/CF stats; full32 CF checks, one desktop-only skip |
| PR-05 | PR218 open; CI passed | 6b130055; CI37039713892; seven bounded histories (14 fallback), provider/failed coverage; scoped visible pool-row regression |
| PR-09 | in progress | POL price source/actual period/interval age; focused25/types/lint; bounded economics browser review underway |
| PR-40 | queued | issue #139 |
| PR-41 | queued | issue #140 |
| PR-46 | queued | issue #145 |
| PR-65 | queued | issue #164 |
| PR-19 | queued | issue #184 |
| PR-24 | queued | issue #189 |
| PR-66 | queued | issue #165 |
| PR-20 | queued | issue #185 |
| PR-21 | queued | issue #186 |
| PR-25 | queued | issue #190 |
| PR-58 | queued | issue #157 |
| PR-26 | queued | issue #191 |
| PR-49 | queued | issue #148 |
| PR-50 | queued | issue #149 |
| PR-27 | queued | issue #192 |
| PR-28 | queued | issue #193 |
| PR-29 | queued | issue #194 |
| PR-30 | queued | issue #195 |
| PR-32 | queued | issue #197 |
| PR-31 | queued | issue #196 |
| PR-61 | queued | issue #160 |
| PR-23 | queued | issue #188 |
| PR-69 | queued | issue #204 |
| PR-67 | queued | issue #202 |
| PR-60 | queued | issue #159 |
| PR-68 | queued | issue #203 |
| PR-34 | queued | issue #199 |
| PR-36 | queued | issue #201 |
| PR-22 | queued | issue #187 |
| PR-48 | queued | issue #147 |
| PR-47 | queued | issue #146 |
| PR-62 | queued | issue #161 |
| PR-33 | queued | issue #198 |
| PR-63 | queued | issue #162 |
| PR-64 | queued | issue #163 |
| PR-35 | queued | issue #200 |

Task PR-37: local verified (172f288; seven RED→GREEN file safety checks, full suite482/482, typecheck pass; lint existing warning). PR207 created/attached; not merged.
Ruling: one native Luna sidecar for disjoint PR08 numeric boundaries while parent executes foundation tooling, using subagent-driven-development for that slice; routed discovery remains blocked.

Ruling PR02: propose two exact incident/search-projection exceptions through2026-10-09 for owner review at merge instead of silently repinning unverifiable historical evidence; all other overdue content blocks and this record retains dates. Cost if adopted: one week of explicitly overdue curated content; no automatic renewal.

Ruling: run PR CI against feature bases as well as main so stacked PRs receive the existing full runtime gates. No production push trigger expanded. PR03 Maya sidecar in isolated data checkout; parent implements target-runtime proof.

Cloudflare candidate40999e0: 506 unit tests/types/lint/audit0, both builds and standalone smoke/dry-run passed. Whole-artifact-bound final WikiDO browser run23/23 passed serially after aggregate all-routes test received its appropriate longer timeout; prior failing run was test-wide timeout, not a CSP violation. Live network connection-lost logs are not source availability certification. Commit unsigned after two configured1Password signing failures; global settings preserved. PR pending. Production rollback/readback remains gated by the user request not to merge/deploy.

PR208 CI37030208807 and PR209 CI37030407354 passed all build-check gates. PR210 open https://github.com/Reedtrullz/tcwiki/pull/210 (a39e37e), CI pending. Diagnostic Git fixtures now use per-command unsigned fixture commits: global signing caused a local test hang once1Password locked; no credential/signing requests belong in offline fixtures.

PR212 CSP bounds open https://github.com/Reedtrullz/tcwiki/pull/212 (496ce6c), CI pending. PR210 CI37032161140 passed including the actual Cloudflare browser lane. Dependency install initially hit npm Arborist edgesOut; regenerated the lock from desired manifest with --package-lock-only and verified a clean npmci rather than deleting the lock or changing the primary install.

PR217 integrates reviewed PR208 and213 into the cumulative branch after216 (c9d09ec); full530/types/lint and CI37036891783 passed. No main merge. PR04/05 CF lane passed25 checks but search submission intermittently navigated to empty /search?; do not treat that run as all-green. Pull forward the native form-value correction, then repeat the final candidate runtime lane.

PR218 UTC volume periods/universe open (ecb66d0+b58b536). PR219 native search FormData open (ced5c71); deterministic stale-form regression and2Next+27CF browser checks passed. PR218 CI37038389570 failed on a broad BTC selector targeting a hidden coverage entry; corrected on both branches via exact pool-row assertions (218:6b130055,219:d05848c5), CI reruns pending. Follow-up commits preserve code scope.

## 03 October continuation

- PR219 search FormData CI37039715393 passed after the scoped pool-row correction. Partial contribution to PR20/49; broader recovery tasks remain queued.
- PR221 parent review reproduced and fixed malformed-warning disappearance and compatibility-string reclassification; action/key/scope identity retained. Warning integration with220 is conflict-free and passes549units/types. No main merge/deploy.
