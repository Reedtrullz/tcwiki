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
| PR-12 | PR221 open; CI passed | 139f3e4; CI37079891867; typed warning provenance/compatibility and malformed details preserved |
| PR-39 | PR215 open; CI passed | a9b3ab5; CI37035192897; canonical alias RED5/full513/types/lint |
| PR-13 | PR224 open; CI passed | 713dc92; CI37080866037; ten bounded sanitized v3.20.3 captures, explicit report-only drift review |
| PR-06 | PR216 open; CI passed | 2938a70; CI37036720991; supplied-clock states/full520/8Next network checks; deadline/resume never auto-probe |
| PR-18 | verified candidate | stalled read timeout/cancellation, bounded batch/depth/fields and suppressed-item response count; RED2 then GREEN11; full508/types/lint pass |
| PR-14 | verified candidate |23 actual WikiDO browser checks passed after reproducing/fixing missing MDX provider; CSP enforced; manifest-bound local candidate |
| PR-53 | verified candidate | explicit Next/Docker + CF source/config/copy roots; tracked/untracked/missing RED to GREEN |
| PR-54 | verified candidate | shared eight-case app/script identity parity matrix; metadata verified is validation not attestation |
| PR-15 | implemented candidate; operational gate | complete module/asset/config manifest, tested-artifact promotion and exclusive targets; real production rollback/readbacks await authorized release window |
| PR-17 | PR214 open; CI passed | f4786a7; CI37034658367; audits0/full508/both targets 8Next+23CF browser |
| PR-56 | PR214 open; CI passed | f4786a7; removed unused dependencies and starter SVGs after consumer review |
| PR-10 | PR225 open; CI passed | b8a504c; CI37081330585; per-cycle coalescing, 12 to 8 reads, optional slow source nonblocking |
| PR-11 | PR226 open; CI passed | f70c90f; CI37082493599; bounded 12s collection/5s request, cooldown/manual retry |
| PR-43 | PR227 open; CI passed | 433465e; CI37083785483; started/observed/completed/assessed times, monotonic cache age |
| PR-07 | PR235 open; integration in progress | d0bb5a9;597units;both builds/smoke;offline aging/recovery each runtime; combine234 for economics destinations |
| PR-57 | PR229 open; CI passed | 433465e; CI37084390703; bounded decoded JSON/rows/depth/string/numeric fields |
| PR-44 | PR230 open; successor audit gate passed | 6852c2c+70a08a3; strict official echoed height and CORS evidence; full audit failure retained; scoped exception proposed PR232 |
| PR-42 | PR237 open; CI passed | 88e2890; CI37090784031SUCCESS;609units/20networkchecks eachtarget |
| PR-51 | PR231 open; successor audit gate passed | e425f90; Node absent host; shared JS/jq fixtures,584units; own CI full-audit failure retained; scoped exception proposed PR232 |
| PR-16 | PR238 open; CI passed | 98c75ed;CI37091851223SUCCESS;612units/16runtime-feechecks eachtarget; origin/source/feature receipts and deduplicated incident lifecycle |
| PR-45 | PR239 open; CI passed | 6fc370c;CI37092219298SUCCESS;immutableTHORNode3.20.3/b08d81f;36activation rules verified/2unsupported;620units;strictJS/jq applicabilityparity;rawcontrols retained;38network/economics/runtimechecks pertarget |
| PR-52 | PR240 open; CI passed | 9474fec;629units/54files;RED2→GREEN137focused;shareddefaults/age policy;actual3readyreceipts showNextlag1/Workerlag10;32network/runtimebrowserchecks eachtarget |
| PR-04 | PR218 open; CI passed | 6b130055; CI37039713892; completed UTC day/zero/duplicate/gap/rollover; separate aggregate and actual comparison days |
| PR-38 | PR220 open; CI passed | 0982935; https://github.com/Reedtrullz/tcwiki/pull/220; CI37040858697; full542/types/lint/both builds; UTC chronology/gaps/overlap; 11 checks each Next/CF stats; full32 CF checks, one desktop-only skip |
| PR-05 | PR218 open; CI passed | 6b130055; CI37039713892; seven bounded histories (14 fallback), provider/failed coverage; scoped visible pool-row regression |
| PR-09 | PR223 open; local verified | c818d47; https://github.com/Reedtrullz/tcwiki/pull/223; full545/types/lint/both builds; 3 economics browser checks each Next/CF; actual price UTC interval/provider/age, degraded price USD withheld; CI pending |
| PR-40 | PR241 open; CI passed | 639units;24fee/runtimechecks eachNext/CF; shared bounds classifier |
| PR-41 | PR243 open; CI passed | 644units;26fee/runtimechecks eachNext/CF; partial field and common cohort evidence |
| PR-46 | PR244 open; CI passed | db6d638+integration242;651units;47stats/network/home/runtimechecks eachNext/CF plus1skip;separate reportedAPR/APY identity/decimalscale/same-field ranking, boundedshareableperiod/provenance/cachekey |
| PR-65 | queued | issue #164 |
| PR-19 | PR228 open; CI passed | 1c93efa; CI37087634182; one active disclosure, hydration gate/native form values, connected empty panels |
| PR-24 | PR233 open; CI passed | 1ca5fcd; exact-head CI passed;552units;26browser checks each target plus4device skips |
| PR-66 | PR234 open; local verified | 31a4bbb;552units;both builds/smoke;20browser checks each Next/CF plus4device skips |



| PR-20 | queued | issue #185 |
| PR-21 | PR247 open; local verified | 7551177;651units;65browserchecks eachruntime plus5skips;single semantic announcement and stable repeated-refresh text |
| PR-25 | local verified; PR publishing | 24 offline cases; development14/14 and held-out8/10 at top1/top5; exact/current cases all pass;31focused tests/types/lint; no ranking changes or query tracking |
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

- PR222 warning integration published and attached, base220; PR223 POL price provenance published and attached, base220. PR19 header disclosure sidecar in progress; PR13 independent scheduled shape report never runs in ordinary PR tests.

- PR221 CI37079891867 passed; PR222/223/224 CI pending. PR10 context stabilizes fallback order per cycle despite concurrent feature completion; quote reads remain independent.

- PR11 browser mock corrected CORS exposure of Retry-After; inaccessible headers use documented60s default. Next local port3000 was busy with unrelated work; exact data-worktree built candidate verified on owned3016 and cleaned via trap. Old20s timing fixture now exceeds12s budget; retained its freshness regression at2s retrieval/11-to13s block age, without weakening delivery age checks.

- PR224 CI37080866037, PR225 CI37081330585, PR226 CI37082493599 passed. PR43 readiness cache also expires by monotonic clock; rolling wall time backward cannot extend retention. Freshness thresholds remain12s/30s. Full568 units and both builds/standalone smoke passed; live14s block-age warnings remained visible.

- PR57 bounds verified in both actual built runtimes,18network checks each desktop/mobile; full574units. Test response doubles now use real Response streams; daily-history mock supplies a fresh body per request. Unknown compressed wire length is not treated as decoded length; decoded bytes remain capped. PR24 anchor sidecar active.

- PR227 CI37083785483 passed. PR228 CI37083819955 caught persistent hidden-header content in thirteen old page-wide selector checks; focused navigation remained passing. Parent isolates follow-up at878af86 in managed wiki-header-ci rather than changing PR24 sidecar WIP. Scope actual main content/form and test hidden presence correctly; full candidate browser validation underway.

PR07: existing merged205 reassessment is reused; operational12/30s source policy unchanged. Aggregate aging reflects two missed60s refresh opportunities; historical intervals retain their meaning. SWR retains successful values on failed fetches, no automatic quote recheck, no rapid retry. Offline/resume/failure/manual recovery journey passes desktop/mobile on both runtimes. Full economics journey on this branch reveals the independent closed-details anchor issue now fixed by PR234; integration is required before claiming full acceptance.
PR66 candidate: direct/reload/history/keyboard disclosure destinations and unavailable-target notice pass on both runtimes. First notice assertion collided with Next route announcer; scoped to the visible navigation notice. Shared layout listener serves multiple TOCs and cross-route URLs without changing public IDs. No deployment or main merge.

Integration of235 and234 preserves both POL price provenance and browser stale-operation tests. Only unit-file append and progress-ledger conflicts required resolution; no product conflict. Full combined-runtime proof is pending.

Combined candidate:603units/types/lint/both builds/smoke. First broad Next129pass/6fail/5skip and CF123pass/12fail/5skip retained as failed evidence. Server navigator without onLine caused false-offline SSR; connectivity now starts shared and is observed after hydration, with direct Node-like navigator regression. Failed dataset badge assertions now expect Unavailable. Focus must be established before reader-closure assertion. Final focused Next14pass; CF36pass then anchor6pass; initial broad unrelated passes remain prior-source evidence. PR235 initial CI37089728660 failed and hydration fixd78a2c4 published; economics fragment acceptance requires234 combined candidate.234 CI passed.

PR42: valid quote body no longer bypasses operation blockers or missing/failed diagnostics. Pair scope excludes LP-only controls and other chains. Check timestamps disclose later/same/earlier recorded checks without claiming atomic observation or settlement. Material state change latches recheck until explicit quote submission even if controls subsequently clear; no automatic quote requests. Final candidate609units and20browser checks each runtime.
PR45: parent immutable-source retrieval independently matched keeper_halt/manager_wasm/handler_rune_pool_deposit complete-file hashes; exclusive/inclusive boundaries agree. Catalog exactreview3.20.3;older/newer/missingversions withdraw rootinterpretations and retainrawMimirs. PAUSELOANS/HaltOracle remainunsupported. JS/jq recognize blocking applicabilitycategory. Merge with236 retained both freshness and applicability rules. Full620units/types/lint/content/bothbuilds/Nextsmoke;38network/economics/runtimebrowserchecks eachNext/CF passed, including unsupportedversion with rawcontrols visible/no positive availability. Live readiness continues to disclose PAUSELOANS applicability and14sblockage; thresholds unchanged. No merge/deploy.

PR52 full629units/types/lint/tracked66/bothbuilds/Nextsmoke and32network/runtimebrowserchecks eachNext/CF passed. Actual readinessJSON readback confirms all3THORNode source receipts: Nextapp-operationslag1, WikiDOapp-operationslag10, bothwarning12/degraded30. Independentchecker fixture remainslag1/all-usable-chainset agreement; app selection remainsindependent. No thresholds changed.

PR236 exact-head CI37090582106 passed; PR237 CI37090784031 passed. PR16 alert lifecycle fixture creates one issue across repeated identical windows, retains previous cause evidence on change, and closes only after sampled recovery. Production workflow has not been run by this session. Optional dynamic fee history remains requested by the dashboard and is explicitly not requested for required readiness. Full612units/types/lint/content/bothbuilds/Nextsmoke and16runtime/fee browser checks pertarget passed. Invalid smoke:cloudflare invocation after completed CF build was corrected by actual Worker browser evidence; no such npm script exists.

Integration of237/238/240 retains quote reconciliation, nameddatareceipts, strict control-applicability and incident/history boundaries. Only documentation/ledger conflicts needed resolution; productchanges merged automatically. Combined proof is pending.

Combined operation/policy candidate:644units/55files/types/lint/bothbuilds/Nextsmoke and44network/economics/fee/runtimebrowserchecks eachNext/CF passed. Quote body/explicitrecheck, unsupportedversion rawcontrols, offlineaging, sourcepolicy and optionalhistory boundaries coexist. PR238CI37091851223 and239CI37092219298 SUCCESS. PR240CI37092523901 stillpending at05:24. No mainmerge/deploy.

PR46 final:parent matched pinned sourcehash; unsupportedperiodRED→GREEN nofetch;651units/types/lint/content/trackedchecks/bothbuilds/Nextsmoke;47browserchecks eachNext/Worker plus1desktop-onlyskip. APR/APY retain provideridentity and neither compounding nor distinctformulas inferred. Base242CI37093294012 SUCCESS. PR243fee-cohorts open8e1308c,26checks perruntime; its integration is partofPR20 baseline, not this PR46 productdiff.
