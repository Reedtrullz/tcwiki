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
| PR-65 | local verified; PR publishing | fc8b009+246integration;693units;bothbuilds/Nextsmoke;28network/accessibilitycases pertarget with correctedsemantic/provider/native-select tests;boundedaddress/status/version and independentMidgardcounts |
| PR-19 | PR228 open; CI passed | 1c93efa; CI37087634182; one active disclosure, hydration gate/native form values, connected empty panels |
| PR-24 | PR233 open; CI passed | 1ca5fcd; exact-head CI passed;552units;26browser checks each target plus4device skips |
| PR-66 | PR234 open; local verified | 31a4bbb;552units;both builds/smoke;20browser checks each Next/CF plus4device skips |



| PR-20 | PR246 open; local verified | 679units/58files;bothbuilds/Nextsmoke;Cloudflare79/84 with5skips;Next78 plus final30/30 affected journeys eachtarget;owned query keys, rapid edits, fragments, hydration and browser restoration |
PR31 final: curated updates/RSS derive from two authored source-qualified records, with historical protocol events separate from wiki review dates. 695 units, both final builds/Next smoke and16desktop/mobile browserchecks each runtime passed. Shared seed/a11y/grid followup committed separately for PR255/256. No main merge/deploy.

PR22 disposition: four technical route/viewport observations captured with source/buildreceipt and visible sourceboundary; one newcomer/practical/builder taskpack with explicitpendinghumanresults. No participant, comprehension/time-improvement oraccepted UIredesign claim. Revisit when actualparticipantsavailable.
