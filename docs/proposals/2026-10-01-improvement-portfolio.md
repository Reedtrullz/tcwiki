# THORChain Wiki — future PR portfolio

Reviewed 1 October 2026. **Proposed future PRs — concept/design only. Not implemented.** All 36 proposals were approved for concept-only issue publication on 1 October 2026 and are now #166–#201. Implementation remains a separate decision. This is a portfolio to select from, not a commitment to implement every idea.

## Assessment

The wiki combines a community encyclopedia, task-oriented source guide, curated protocol history, and current-only network dashboards. Its intended readers include newcomers, users investigating swaps or liquidity actions, node operators, integration developers, and researchers. The most valuable direction is a reference that helps a reader identify the evidence needed for a particular claim, inspect that evidence, and retain its date and limitations.

Strengths already present:

- Central route/content, task, reader-path, glossary, and source registries; dated source/confidence metadata; sourced MDX explainers.
- Provider failover, same-provider height-pinned THORNode snapshots, explicit unknown/degraded states, and conservative operation-control interpretation.
- RUNEPool/POL accounting, TCY controls, dynamic-fee records/history, pool/earnings exploration, daily volume, searchable governance history, and a working route quote probe.
- Registry-backed navigation, search filters, URL state in most explorers, article reading paths, mobile layouts, keyboard search, a skip link, contrast checks, and chart data tables.
- Extensive unit/browser tests, generated-content and link checks, strict runtime identity/readiness contracts, nonce CSP, pinned Actions, vulnerability gates, scanned Docker artifacts, preflight/rollback, and independent operational monitoring.

The main opportunities are correctness at time/unit/provenance boundaries, verification of the actual Cloudflare serving artifact, an honest content-review workflow, more focused reader journeys, and tools for evidence reuse. Avoid a CMS rewrite, wallet execution, generic component libraries, or abstraction projects without a concrete consumer.

## Reviewed state and evidence limits

| Surface | Observed state |
|---|---|
| Local checkout | main at 798e34428882601781f0c0cf045cd7be7286b249 |
| Existing work | 21 modified tracked files and four untracked files, including September 30 content/source/test updates; 25 file hashes captured for preservation checks |
| GitHub main after read-only fetch | af210071b3110621ca9a83757697f12d103baae2 |
| Migration history | PRs [#127](https://github.com/Reedtrullz/tcwiki/pull/127) and [#128](https://github.com/Reedtrullz/tcwiki/pull/128) already merged; proposing migration again would be a duplicate |
| Public endpoints, approximately 11:38 Oslo | health/version/strict-ready each HTTP 200; all report main's exact commit, runtime.verified=true and Worker artifact cloudflare-worker@sha256:4bb45f28f9ed185b15b7751013b39da5c4f030ee56f291259f977b300270c143 |
| Strict readiness sample | ready=true; no reasons; disclosed review warnings remain. One usable sample is not continuous freshness or availability proof |
| Deployment variables | GitHub repository variables show TCWIKI_CLOUDFLARE_DEPLOY_ENABLED=1 and TCWIKI_VPS_DEPLOY_ENABLED=0 |
| Local runtime/dependencies | Node v22.22.3; installed Vitest v4.1.11. Main's lockfile records Vitest 5.0.0. Local checks cannot be presented as an exact-main locked installation |
| Disk | 45 GiB available on Data volume; no full builds or Docker builds undertaken |
| Local checks | Six focused unit files, 124 tests passed; check-only MDX generation current; curated-record validation passed against the dirty local tree |
| Browser observations | Live Home, Stats and Search inspected at the in-app panel width; search for refund returned 18 results. No physical-device, screen-reader, cross-browser, performance or complete visual audit |

Core findings below were checked against GitHub main where it differs from the local checkout. Maya, quote classification, numeric conversion, hooks, POL display, search, header and core readiness code remain materially the same in the areas cited. Main removes an unused daily-volume intermediate; it does not change that aggregation's period-selection behavior. Main adds configurable THORNode lag and a latest-block cache-busting read; those are existing work, not new proposals.

**Evidence labels:** Demonstrated = synthetic check reproduced behavior; Inspected = directly present in code/configuration; Hypothesis = plausible consequence requiring measurement or user testing; Idea = proposed capability; Stretch = larger experiment requiring separate approval and a bounded first release.

### Existing work and duplication decisions

All ten GitHub issues returned by the all-state inventory are closed readiness alerts: #63, #77, #100, #101, #107, #114, #120, #125, #126, #129. Their bodies were reviewed. The six open PRs are [#130](https://github.com/Reedtrullz/tcwiki/pull/130), [#131](https://github.com/Reedtrullz/tcwiki/pull/131), [#132](https://github.com/Reedtrullz/tcwiki/pull/132), [#133](https://github.com/Reedtrullz/tcwiki/pull/133), [#134](https://github.com/Reedtrullz/tcwiki/pull/134), [#135](https://github.com/Reedtrullz/tcwiki/pull/135): ESLint config, icons, Next, MDX, Vitest, Docker Node updates. Recent merged PR titles and bodies for #127/#128 were also checked.

**Immediate existing-work lane:** resolve and validate the security dependency update through #132, coordinated with #130/#133 where required; also investigate the transitive Cloudflare tooling findings. This is not a duplicate new Next-upgrade proposal. CI [36819055759](https://github.com/Reedtrullz/tcwiki/actions/runs/36819055759) fails at audit:prod, reporting Next and Undici/tooling findings. Main locks Next 16.3.4 and Undici 7.29.0. The [Next advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j) identifies 16.3.6 as patched and scopes the exploit condition to attacker-controlled Node ImageResponse content. The inspected social-image routes declare edge runtime and use constant content; this review did not demonstrate that exploit condition or a production compromise. Do not suppress audits or blindly apply forced upgrades.

The dirty September 30 source/content updates already address multiple governance, incident and source-review gaps. Review and land that authored work through its own process; do not regenerate or reimplement it here.

## Prioritization and dependency map

Priority expresses recommended attention, not incident severity: P1 = high-value correctness/foundation, P2 = normal follow-up, P3 = optional experiment. S/M/L/XL are relative scope estimates, not delivery promises.

| Order | Portfolio IDs | Purpose |
|---|---|---|
| Existing-work lane | Open dependency PRs and authored content WIP | Restore an auditable release gate; retain existing work |
| 1 | 01, 02, 03, 04, 06, 08 | Establish accurate operating docs, review policy and small correctness fixes |
| 2 | 05, 07, 09, 12, 13 | Carry trustworthy coverage, freshness, arithmetic and warnings into UI/tests |
| 3 | 10, 11, 14, 15, 16, 17, 18 | Bound requests; prove the serving runtime; improve operations/security process |
| 4 | 19, 20, 21, 22, 23, 24, 25 | Improve navigation, accessibility, reading, citations and discovery |
| 5 | 26, 27, 28, 29, 30, 31, 32 | Measure performance; make evidence and editorial work maintainable |
| Optional pilots | 33, 34, 35, 36 | Transaction triage, education, recorded history and personal reading paths |

Dependencies below are hard prerequisites unless explicitly labeled coordination. Independent P1 correctness fixes can proceed in parallel. No proposal requires all earlier numbers. There are no circular dependencies.

## A. Data correctness and trust foundations

### PR-01 — Document the serving architecture and diagnose checkout drift

**Classification:** Foundation / Developer Experience / Operations; P1; S. **Evidence:** Inspected. [README](/Users/reidar/Projectos/thorchain-wiki/README.md), [CURRENT_STATE](/Users/reidar/Projectos/thorchain-wiki/CURRENT_STATE.md), [operations](/Users/reidar/Projectos/thorchain-wiki/docs/operations.md); main's [CI](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/.github/workflows/ci.yml) and [DO entry](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/cloudflare/do-entry.mjs).

**Problem:** Main README still calls VPS the production deployment and says cutover has not occurred; public runtime identity and deployment variables now describe a Worker. This checkout and installed dependencies also differ from main.

**Proposed PR:** Date the current serving/rollback diagram; document Next local/Docker versus vinext/DO paths; add a small read-only preflight reporting HEAD, upstream divergence, dirty state, Node and installed-versus-lockfile key versions.

**Scope boundaries:** Documentation and diagnostic output only; no pulling into dirty work, installing dependencies, changing deploy variables or deleting rollback assets.

**Acceptance target:** A new contributor can select the production-shaped verification command and understand what it proves. The diagnostic reports the observed local Vitest mismatch without changing files.

**Dependencies:** None.

### PR-02 — Replace blanket overdue-content bypass with scoped exceptions

**Classification:** Foundation / Content Reliability; P1; S–M. **Evidence:** Inspected and observed. Main [CI](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/.github/workflows/ci.yml) sets ALLOW_OVERDUE_CONTENT=1 for ordinary builds; [review schedule](/Users/reidar/Projectos/thorchain-wiki/scripts/lib/content-review-schedule.mjs), [maintenance](/Users/reidar/Projectos/thorchain-wiki/docs/maintenance.md); live search shows the memoless incident due 2026-09-25.

**Problem:** Release CI's unconditional exception undermines the documented review-date gate. Date validity and upstream readiness are different checks.

**Proposed PR:** Restore normal overdue enforcement; permit only named records with an owner, reason, expiry and linked follow-up. Emit exceptions in CI summaries and visible record posture. Coordinate with the existing September 30 authored refresh rather than changing dates without reviewing sources.

**Scope boundaries:** No automatic semantic approval, bulk repinning, readiness-policy relaxation or forced content rewrites.

**Acceptance target:** A stale record blocks an ordinary release; a scoped exception is disclosed and expires; unrelated overdue records still block; deterministic date fixtures cover all three cases.

**Dependencies:** None; coordinate with existing content WIP.

### PR-03 — Validate Maya before accepting a provider response

**Classification:** Reliability / Core Data; P1; S. **Evidence:** Inspected. [Maya API](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/maya.ts), [panel](/Users/reidar/Projectos/thorchain-wiki/src/components/features/MayaNodePanel.tsx), [Midgard normalized failover](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/midgard.ts).

**Problem:** Both Maya provider entries have the same URL. Transport success is accepted before normalization, so malformed data does not trigger normalized failover. Amounts/APYs accept arbitrary strings, then the panel converts them with Number; no Maya-specific unit suite exists in the inspected inventory.

**Proposed PR:** Remove the duplicate provider alias; use an actual second endpoint only after capability/source verification. Validate shape, units, APY scale, bond and slash-point fields before provider acceptance, following the existing Midgard pattern.

**Scope boundaries:** Keep Maya independent of THORChain; do not invent redundancy or generalize all APIs behind a new client framework.

**Acceptance target:** Malformed success degrades cleanly; valid zero survives; invalid APY never renders NaN%; each distinct provider is attempted at most once per pass; small mocked Maya tests cover fallback and validation.

**Dependencies:** None.

### PR-04 — Select completed daily-volume intervals explicitly

**Classification:** Correctness / Analytics; P1; S–M. **Evidence:** Demonstrated. [aggregation](/Users/reidar/Projectos/thorchain-wiki/src/lib/daily-volume.ts), [leaderboard](/Users/reidar/Projectos/thorchain-wiki/src/components/features/DailyVolumeLeaderboard.tsx), [tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/daily-volume.test.ts).

**Problem:** The function selects the latest positive USD bucket, with no end-time/clock check. A later zero bucket returns the earlier positive day; a positive current bucket becomes the headline. Missing USD values are added as zero when other values populate the same day. “Completed day” and “seven-day average” are therefore stronger than the selection logic.

**Proposed PR:** Normalize bucket boundaries and numeric fields; select the most recent completed UTC day using explicit observation time. Preserve genuine zeros; distinguish absent, invalid and incomplete data. Return selected period and comparison-window coverage.

**Scope boundaries:** Fix period/accounting semantics for the current requested universe; universe expansion belongs in PR-05.

**Acceptance target:** Fixtures cover completed zero day, positive in-progress day, missing/negative fields, out-of-order/duplicate intervals and UTC rollover. A partial trailing window is labeled with its actual count, not advertised as seven days.

**Dependencies:** None.

### PR-05 — Define the leaderboard universe and retain each pool's provenance

**Classification:** Core Functionality / Trust UX; P1; M. **Evidence:** Inspected. [daily pool list](/Users/reidar/Projectos/thorchain-wiki/src/lib/daily-volume.ts), [useDailyVolume](/Users/reidar/Projectos/thorchain-wiki/src/lib/hooks/useMidgard.ts), [live metadata](/Users/reidar/Projectos/thorchain-wiki/src/components/ui/LiveSourceMeta.tsx).

**Problem:** Six hard-coded assets are described as total volume/top pools. Each history can fail over independently. The aggregate uses the first checkedAt and omits aggregate source/sources, leaving readers without the full universe/provider/coverage story.

**Proposed PR:** First label a selected-pool subtotal honestly and expose included/failed assets, period coverage and per-pool sources. Where the API provides a documented all-network aggregate, use that for the total. Treat full-universe ranking as a bounded optional extension with explicit discovery, cap and omitted count.

**Scope boundaries:** No unbounded all-pool history fan-out; no mixing a network-total denominator with subset totals silently.

**Acceptance target:** An omitted or failed pool cannot produce an unlabeled network total/share. Mixed-provider fixtures preserve every provider and time; known zero and unavailable are distinct. Request counts are capped and tested.

**Dependencies:** PR-04.

### PR-06 — Expire quote evidence and withdraw stale availability claims

**Classification:** Correctness / Reliability / UX; P1; S–M. **Evidence:** Demonstrated. [deriveRouteAvailability](/Users/reidar/Projectos/thorchain-wiki/src/lib/network-diagnostics.ts), [quote checker](/Users/reidar/Projectos/thorchain-wiki/src/components/features/NetworkStatusBanner.tsx), [quote normalization](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/thornode.ts).

**Problem:** A synthetic quote with expiry=1 still returns available and “Current quote returned.” The checker displays expiry but does not compare it with time; quote polling is disabled. The refund introduction also calls a returned quote proof the route is open now.

**Proposed PR:** Give quote proof explicit valid/expired/expiry-unknown states, evaluated at a supplied clock. Update on expiry and tab resume; request a new quote only through the existing explicit action. Keep pair and amount matching, and report “quoted at” rather than imply settlement.

**Scope boundaries:** No transaction execution, wallet instructions or automatic background quote loop.

**Acceptance target:** Fake-clock tests cover before/at/after expiry, unknown expiry, input changes and suspended-tab resume. Expired evidence loses the positive availability presentation and cannot drive current refund-triage claims.

**Dependencies:** None.

### PR-07 — Distinguish last good data from fresh operational evidence

**Classification:** Reliability / UX; P1; M. **Evidence:** Inspected; prolonged offline behavior is a hypothesis. [SWR hooks](/Users/reidar/Projectos/thorchain-wiki/src/lib/hooks/useMidgard.ts), [Maya hooks](/Users/reidar/Projectos/thorchain-wiki/src/lib/hooks/useMaya.ts), [sourceBadge](/Users/reidar/Projectos/thorchain-wiki/src/components/ui/LiveSourceMeta.tsx).

**Problem:** Metadata badges use result status and warning/health fields, not current age. Hooks expose initial loading but not a shared freshness/revalidation contract. A loaded snapshot can remain visually positive while a tab is suspended or disconnected.

**Proposed PR:** Define freshness policy separately for operational, aggregate and historical data. Show refreshing, last good, stale and unavailable states; re-evaluate age on resume/reconnect and offer one manual refresh action. Preserve values as dated context while preventing stale operation evidence from implying availability.

**Scope boundaries:** Reuse SWR; no new global store, mandatory rapid polling or guessed universal TTL.

**Acceptance target:** A browser journey covers load, elapsed time, offline, failed refresh and recovery; labels retain checkedAt/provider. Stale operations are conservative; historical intervals are not incorrectly marked invalid merely because they are old.

**Dependencies:** PR-06 for quote behavior; can develop other dataset states independently.

### PR-08 — Enforce symmetric numeric limits at presentation boundaries

**Classification:** Correctness / Core Data; P1; S. **Evidence:** Demonstrated and inspected. [runeBaseUnitsToNumber](/Users/reidar/Projectos/thorchain-wiki/src/lib/trust.ts), [POL conversions](/Users/reidar/Projectos/thorchain-wiki/src/app/economics/RunepoolPolPanel.tsx), [stats](/Users/reidar/Projectos/thorchain-wiki/src/lib/stats-dashboard.ts).

**Problem:** runeBaseUnitsToNumber rejects only excessively positive whole values; the synthetic negative input -900719925474099300000000 returns a Number rather than unavailable. POL bypasses the shared converter using Number(BigInt), with other decimal conversions accepting permissive Number syntax.

**Proposed PR:** Check both signed bounds, preserve exact base-unit strings/BigInt through accounting, and reuse the existing converter where a chart/approximate display needs Number. Make approximate USD calculations explicit and guard overflow/nonfinite results.

**Scope boundaries:** No arbitrary-precision library, branded-type migration or rewriting already-correct BigInt formatting.

**Acceptance target:** Small boundary tests cover both signs, zero, fractions, malformed syntax and nonfinite output. Positive/negative PnL survives formatting and never silently becomes a misleading finite rounded accounting total.

**Dependencies:** None.

### PR-09 — Pair the POL USD price with its actual source interval

**Classification:** Correctness / Analytics UX; P1; S–M. **Evidence:** Inspected. [derivePolTrackerSummary and hook wiring](/Users/reidar/Projectos/thorchain-wiki/src/app/economics/RunepoolPolPanel.tsx).

**Problem:** The panel selects the last valid positive price from history but labels it using the last history item's date. A final missing-price row can therefore label an earlier price as later. The hook's earnings result/health/error metadata is discarded, while USD uses that history against a live POL value.

**Proposed PR:** Select a complete price-plus-interval record; retain its provider and quality. Label USD as a reference valuation at that daily interval, with age and mismatch caveats; withhold it when price evidence is invalid.

**Scope boundaries:** Do not silently replace the daily reference with a spot oracle or claim contemporaneous USD accounting.

**Acceptance target:** Fixtures with a missing final price show the earlier price's real date; degraded/stale history is disclosed; RUNE accounting remains available independently. UI/source tests distinguish POL snapshot time from valuation time.

**Dependencies:** PR-08.

## B. Reliability, release verification and operations

### PR-10 — Reuse pinned THORNode reads within one collection cycle

**Classification:** Performance / Reliability / Architecture; P2; M. **Evidence:** Inspected; latency/cost benefit unmeasured. [readiness snapshot](/Users/reidar/Projectos/thorchain-wiki/src/lib/readiness-snapshot.ts), [THORNode status methods](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/thornode.ts).

**Problem:** Network, fee and POL methods independently discover latest height and fetch Mimir. Readiness deduplicates whole probes for ten seconds, but its three domain collectors still repeat shared reads and can select different providers/heights.

**Proposed PR:** Introduce one request-scoped provider/height context for shared immutable reads, retaining independent feature normalization and warning quality. Cache/in-flight keys must include provider, path and height. Expose feature snapshot differences rather than pretend all data is atomic.

**Scope boundaries:** No global cross-provider cache, persistent history store, or coalescing quotes. Keep existing snapshot lag configuration.

**Acceptance target:** Mocked request counts decrease for one provider cycle; fallback starts a separate context and never mixes heights. Slow/failed fee history does not hide usable network/POL evidence. Record real latency before claiming speed improvement.

**Dependencies:** None.

### PR-11 — Bound collection deadlines and respect provider throttling

**Classification:** Reliability / Performance; P2; M. **Evidence:** Inspected. [requestJson, provider loops, history concurrency](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/thornode.ts), [runtime checker](/Users/reidar/Projectos/thorchain-wiki/scripts/check-runtime-url.mjs).

**Problem:** Per-fetch timeouts do not establish a total deadline across provider discovery, parallel snapshot reads and up to four waves of fee-history reads. Runtime URL verification retries fetches without a bounded per-fetch abort.

**Proposed PR:** Add an overall budget and propagate cancellation; retain partial results/warnings for optional history. Honor bounded Retry-After for rate limits and expose a manual quote retry state. Put explicit timeout/deadline bounds on release verification.

**Scope boundaries:** Do not hedge all providers, retry semantic input errors, or count throttling as protocol halt.

**Acceptance target:** Fake timers/mocked fetch prove upper bounds, request cancellation and cleanup under slow/stalled providers, 429 and fallback. Same-provider/height evidence remains intact; quote input/halts are not repeatedly retried.

**Dependencies:** None; coordinate with PR-10 to avoid competing transport edits.

### PR-12 — Carry structured warnings from parser to readiness and UI

**Classification:** Architecture / Trust Reliability; P1; M. **Evidence:** Demonstrated/inspected. [live-result](/Users/reidar/Projectos/thorchain-wiki/src/lib/live-result.ts), [warning classifiers](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/thornode.ts), [ready route](/Users/reidar/Projectos/thorchain-wiki/src/app/api/ready/route.ts), [LiveSourceMeta](/Users/reidar/Projectos/thorchain-wiki/src/components/ui/LiveSourceMeta.tsx).

**Problem:** Warning categories often depend on English message substrings; copy changes can affect machine interpretation. LiveSourceMeta recursively visits object fields, while liveResultHasSourceWarnings checks arrays and immediate warning properties. A synthetic nested LiveDataResult warning is missed by the latter.

**Proposed PR:** Emit existing structured category/severity/action/key fields where warnings originate; carry them unchanged and derive compatibility strings from them. Make aggregate warning traversal consistent for supported shapes.

**Scope boundaries:** Preserve the current allowlisted review-only readiness policy and string clients; no wholesale error framework or relaxed fail-closed rules.

**Acceptance target:** Wording changes cannot change severity/readiness; nested/composite warnings remain visible; unknown or unmatched warnings still fail closed. Existing readiness compatibility tests remain green.

**Dependencies:** None.

### PR-13 — Add small versioned upstream contract fixtures

**Classification:** Testing / Developer Experience / Reliability; P1; M. **Evidence:** Inspected. [THORNode tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/thornode.test.ts), [Midgard tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/midgard.test.ts), [live chain drift script](/Users/reidar/Projectos/thorchain-wiki/scripts/check-live-chain-snapshot.mjs), [domain types](/Users/reidar/Projectos/thorchain-wiki/src/lib/types.ts).

**Problem:** Strong mocked tests do not establish compatibility with changing upstream schemas. The scheduled drift lane concentrates on chains; fee history, RUNEPool, earnings and Maya need a similarly reviewable sample boundary.

**Proposed PR:** Add a bounded opt-in capture/review procedure for sanitized provider responses with source URL, observation time, protocol version and height. Keep a small canonical fixture per important schema plus malformed variants, and an independent scheduled shape report.

**Scope boundaries:** No mandatory live calls in ordinary PR tests, retained user addresses, giant response archives or auto-accepting changed shapes.

**Acceptance target:** Offline tests reproduce the captures; one intentional shape change produces a useful diff and warning, not zero-valued fallback. Scheduled provider failure cannot be mistaken for a local regression.

**Dependencies:** PR-03 for Maya normalization; coordinate with PR-12's warning contracts.

### PR-14 — Run browser and CSP proof against the Cloudflare candidate

**Classification:** Release Reliability / Testing; P1; M. **Evidence:** Inspected. Main [CI](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/.github/workflows/ci.yml), [Playwright configuration](/Users/reidar/Projectos/thorchain-wiki/playwright.config.ts), [runtime tests](/Users/reidar/Projectos/thorchain-wiki/tests/runtime.spec.ts).

**Problem:** CI builds/dry-runs the Cloudflare bundle, but browser/CSP tests explicitly start Next standalone. That proves a different serving stack from vinext in the DO. Existing migration PR browser observations are valuable historical evidence, not a recurring target-runtime gate.

**Proposed PR:** Add a bounded vinext/DO browser lane for search, MDX tables/anchors, URL filters, hydrated live fixtures, CSP and runtime identity. Prefer a local target-runtime candidate; use an isolated preview only if required, with explicit cleanup and permission boundaries.

**Scope boundaries:** Retain Docker/Next rollback proof; do not relabel standalone browser tests as Cloudflare validation.

**Acceptance target:** CI reports which runtime and artifact was exercised; a vinext-only hydration/MDX regression fails that lane; the candidate bundle used for proof is retained and linked to release identity.

**Dependencies:** None.

### PR-15 — Identify the whole Worker artifact and verify the routed release

**Classification:** Operations / Supply-Chain Reliability; P1; M. **Evidence:** Inspected. Main [deploy-cloudflare job](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/.github/workflows/ci.yml) hashes dist/server/index.js, rebuilds before deploying, then reads the workers.dev URL; [entry/config](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/wrangler.do.jsonc).

**Problem:** A single entry-file hash is narrower than the uploaded modules/assets/configuration, and the post-deploy gate does not verify the public custom domain. Two deployment flags can also permit competing jobs unless operational configuration prevents it.

**Proposed PR:** Generate a deterministic manifest digest for the actual module/asset/config input set, promote the tested artifact, enforce mutually exclusive production targets, and verify public domain identity/CSP/strict contract after propagation. Document and rehearse Worker version rollback separately from Docker rollback.

**Scope boundaries:** No secret values in manifests, DNS changes bundled into ordinary app releases, or removal of rollback containers/backups.

**Acceptance target:** Changing an asset/module/config changes identity; all production readbacks match the promoted bundle; conflicting targets fail before deployment; rollback evidence records previous and restored Worker versions.

**Dependencies:** PR-14.

### PR-16 — Separate origin liveness, source readiness and feature degradation

**Classification:** Observability / Operations; P2; M. **Evidence:** Inspected. [operations workflow](/Users/reidar/Projectos/thorchain-wiki/.github/workflows/operations.yml), [monitor evidence](/Users/reidar/Projectos/thorchain-wiki/scripts/lib/readiness-monitor.mjs), [ready route](/Users/reidar/Projectos/thorchain-wiki/src/app/api/ready/route.ts); ten closed readiness alerts in GitHub.

**Problem:** The monitor opens one generic alert after a window with no ready sample. Existing source diagnostics are richer than the issue body. Repeated closed alerts alone do not prove alert noise, an app outage or a particular upstream fault.

**Proposed PR:** Include liveness/identity, source family, affected feature, warning category, independent sample count and linked artifact in alert summaries. Deduplicate by incident fingerprint and record recovery without discarding chronology. Bound deployment readiness work separately from optional feature history.

**Scope boundaries:** Preserve strict readiness and existing warning policy; no silent “healthy” fallback or arbitrary threshold increase.

**Acceptance target:** Fixtures for origin failure, healthy origin/degraded upstream, feature-only degradation and recovery produce distinct explanations. Cached snapshots do not count as independent observations. Repeated identical windows update one incident.

**Dependencies:** PR-12.

### PR-17 — Coordinate framework upgrades and report dependency reachability

**Classification:** Security Process / Developer Experience; P2; S–M. **Evidence:** Inspected. [Dependabot](/Users/reidar/Projectos/thorchain-wiki/.github/dependabot.yml) groups React but not Next/MDX/ESLint; open #130/#132/#133 overlap a framework release; current CI audit failure is linked above.

**Problem:** Separate coupled framework PRs create partial-version review work. Dependency advisories, dev-tooling exposure and executable production attack paths require different evidence.

**Proposed PR:** Group compatible framework maintenance, keep incompatible major moves separately reviewed, and add a concise audit triage receipt listing package path, affected artifact, upstream fix and reachability assessment. Investigate Cloudflare transitive findings through their owning dependencies.

**Scope boundaries:** Existing #132 owns the immediate Next patch. Do not create another Next-upgrade issue, downgrade audit thresholds, or replace dependency remediation with a theoretical exploit disclaimer.

**Acceptance target:** A framework update's CI covers Next and Cloudflare lanes; full and production audits pass or have an explicitly approved, dated exception; severity alone is not presented as proof of exploitation.

**Dependencies:** None; current update PRs should precede future grouping changes.

### PR-18 — Bound CSP report ingestion and expose suppressed-report counts

**Classification:** Security Hardening / Observability; P2; S. **Evidence:** Inspected. [report route](/Users/reidar/Projectos/thorchain-wiki/src/app/api/csp-report/route.ts), [report tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/csp-report.test.ts).

**Problem:** Ingestion already caps bytes, restricts content types, redacts URL query/fragment and limits logged fingerprints. Body reading has no elapsed-time bound; recursive array extraction and attacker-supplied string fields remain additional boundaries worth testing. Log suppression has no aggregate visibility.

**Proposed PR:** Bound read duration, nested/batch report count and individual logged-field lengths; preserve cancellation/redaction. Emit a bounded count of discarded/suppressed reports without logging their content.

**Scope boundaries:** Hardening opportunity, not a demonstrated exploit. No authentication requirement that prevents browser reporting, user identifiers or external telemetry vendor.

**Acceptance target:** Existing valid report formats still return 204; stalled, oversized, deeply nested and oversized-field fixtures terminate predictably; report rates cannot cause unbounded logs; private URL query data remains absent.

**Dependencies:** None.

## C. Reader experience, accessibility and discovery

### PR-19 — Make header disclosures keyboard-complete

**Classification:** UX / Accessibility; P2; S. **Evidence:** Inspected. [Header](/Users/reidar/Projectos/thorchain-wiki/src/components/Header.tsx), [navigation tests](/Users/reidar/Projectos/thorchain-wiki/tests/navigation.spec.ts).

**Problem:** Nav-group buttons set the open group without toggling it; they do not set lastTriggerRef, unlike the other panel buttons. Escape closes panels and restores focus through that shared ref, which can point to another trigger.

**Proposed PR:** Use ordinary disclosure semantics: toggle the active group, set its actual trigger for focus return, link buttons to panels, and close predictably on route change or outside interaction. Audit keyboard behavior of all four header panel types together.

**Scope boundaries:** Keep registry navigation and native buttons/links; no mega-menu redesign or ARIA menu widget unless its full behavior is wanted.

**Acceptance target:** Keyboard/browser checks cover open, repeated toggle, Escape, focus return, switching groups, mobile navigation and navigation completion. Hidden panels cannot retain focus.

**Dependencies:** None.

### PR-20 — Make explorer URL behavior consistent and include fee filters

**Classification:** UX / Architecture; P2; S–M. **Evidence:** Inspected. [fee explorer](/Users/reidar/Projectos/thorchain-wiki/src/components/features/DynamicFeeRecordsExplorer.tsx) keeps local filters; [pool filters](/Users/reidar/Projectos/thorchain-wiki/src/hooks/usePoolExplorerFilters.ts), [chain explorer](/Users/reidar/Projectos/thorchain-wiki/src/components/features/ProtocolChainFinder.tsx), [source explorer](/Users/reidar/Projectos/thorchain-wiki/src/components/features/SourceMapExplorer.tsx) already use URL state.

**Problem:** Most explorer states are shareable, but fee filters disappear on refresh. Several components duplicate history.replaceState plus synthetic popstate behavior; route quote state has another hydration path.

**Proposed PR:** Add namespaced, validated fee query parameters and define one simple browser-history contract for explorer state. Extract only the repeated URL-write helper, retaining feature-specific validation and defaults.

**Scope boundaries:** Preserve existing URLs, unrelated query parameters, anchors and aliases; no universal filter framework or new state library.

**Acceptance target:** Copy/reload/back/forward work for each changed explorer; malformed filters fall back predictably; rapid typing does not lose newer state; unrelated parameters survive.

**Dependencies:** None.

### PR-21 — Test accessibility beyond contrast and initial loading

**Classification:** Accessibility / Testing; P1–P2; M. **Evidence:** Inspected. [accessibility spec](/Users/reidar/Projectos/thorchain-wiki/tests/accessibility.spec.ts) selects only color-contrast on eight routes; [earnings table](/Users/reidar/Projectos/thorchain-wiki/src/components/features/StatsEarningsTable.tsx) already supplies chart alternatives; [TOC](/Users/reidar/Projectos/thorchain-wiki/src/components/layout/PageTableOfContents.tsx).

**Problem:** Contrast checks do not cover disclosure semantics, focus, live-state announcements, loaded chart interactions, zoom/reflow, or the full article/glossary/TCY surface. This is a coverage gap, not a claim that every such interaction fails.

**Proposed PR:** Reuse installed axe for a bounded broader rule set, inject deterministic loaded/degraded fixtures, and add keyboard journeys for search, header and route checking. Check 200–400% zoom/reflow and reduced-motion handling where animation exists.

**Scope boundaries:** Retain existing readable tables/cards; do not add duplicate chart summaries blindly. Human screen-reader/device acceptance remains a separate task.

**Acceptance target:** Findings point to actual nodes; loaded/error states and deep-dive tables are covered; a keyboard user can reach, operate and leave controls; meaningful updates announce once rather than on every poll.

**Dependencies:** PR-19 for corrected header behavior.

### PR-22 — Put the reader's answer before repeated evidence-routing copy

**Classification:** Product / UX; P2; M. **Evidence:** Inspected and visually sampled. [Home](/Users/reidar/Projectos/thorchain-wiki/src/app/HomePageClient.tsx), [Stats](/Users/reidar/Projectos/thorchain-wiki/src/app/stats/StatsPageClient.tsx), [page posture](/Users/reidar/Projectos/thorchain-wiki/src/components/features/PageSourcePosture.tsx), [claim card](/Users/reidar/Projectos/thorchain-wiki/src/components/features/ClaimCheckCard.tsx).

**Problem:** Stats stacks “Look Here First,” operational context and “Which Numbers Matter” before its main analytics. Home similarly offers multiple routing layers. The hypothesis is that repeated instructions delay a focused reader; no task-completion study was performed.

**Proposed PR:** Run three short newcomer/user/builder task trials, then test a compact answer/status summary with one expandable evidence explanation. Keep important source warnings next to the result, and route deeper instructions through existing task links.

**Scope boundaries:** A measured two-route trial, not a site redesign. Do not hide active blockers, confidence or sources to gain visual simplicity.

**Acceptance target:** Record before/after time and success for the same tasks at phone/desktop widths; readers locate the result and its caveat with fewer detours; source-warning interpretation is preserved.

**Dependencies:** PR-07 for trustworthy live summaries.

### PR-23 — Add printable article views and portable citations

**Classification:** Product / Reading UX / Interoperability; P2; S–M. **Evidence:** Inspected. [DeepDiveShell](/Users/reidar/Projectos/thorchain-wiki/src/components/features/DeepDiveShell.tsx), [source disclosures](/Users/reidar/Projectos/thorchain-wiki/src/components/ui/SourceMetaDisclosure.tsx), [CSS](/Users/reidar/Projectos/thorchain-wiki/src/app/globals.css); existing copy behavior in [source chooser](/Users/reidar/Projectos/thorchain-wiki/src/components/features/SourceMapExplorer.tsx).

**Problem:** The article shell offers reading paths, related content and source metadata, but no dedicated print/citation workflow. Dark fixed-navigation layouts and collapsed source details are not tailored to retaining a reference outside the site.

**Proposed PR:** Use browser print and CSS to show readable article content, expanded sources, canonical URL, review dates and historical/current boundaries. Add copy citation as text/Markdown and a small source-rich article export where it can reuse existing content.

**Scope boundaries:** Start with curated articles. Do not freeze live dashboards as apparently current evidence, add a PDF service or silently cache offline operational results.

**Acceptance target:** Print preview is legible across page breaks and wide tables; copied citations include title/section URL, source URLs and dates; clipboard failure has visible fallback; exported live references carry observation time and limitations.

**Dependencies:** None.

### PR-24 — Index deep-dive sections and unify heading identity

**Classification:** Discovery / Content Architecture; P2; M. **Evidence:** Inspected. [MDX generator](/Users/reidar/Projectos/thorchain-wiki/scripts/generate-mdx-search.mjs), [MDX headings](/Users/reidar/Projectos/thorchain-wiki/src/mdx-components.tsx), [manual TOCs](/Users/reidar/Projectos/thorchain-wiki/src/lib/content/registry.ts), [TOC validation](/Users/reidar/Projectos/thorchain-wiki/scripts/lib/deep-dive-toc.mjs).

**Problem:** Generated MDX search records represent whole articles; section identity is maintained separately. Runtime heading extraction handles strings/numbers/arrays but not formatted React children. Duplicate/format-rich headings are a latent edge case rather than a reproduced current broken page.

**Proposed PR:** Reuse installed MDX tooling to derive headings/anchors and bounded section documents from one parse. Preserve explicit IDs and existing public fragments; keep curated task intent and reader-path metadata editorial.

**Scope boundaries:** No content-format migration, automatic rewrite of all URLs or entire prose copies for each heading.

**Acceptance target:** Formatting, punctuation, Unicode and duplicate headings produce deterministic unique IDs; old anchors resolve; section queries land on the actual matching section; generated checks and rendered-link tests share the contract.

**Dependencies:** None.

### PR-25 — Evaluate search intent before changing ranking rules

**Classification:** Product Quality / Testing; P2; M. **Evidence:** Inspected. [ranking](/Users/reidar/Projectos/thorchain-wiki/src/lib/search/ranking.ts), [query safety](/Users/reidar/Projectos/thorchain-wiki/src/lib/search/lunr-query.ts), [ranking tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/search-ranking.test.ts), [search UI](/Users/reidar/Projectos/thorchain-wiki/src/app/search/SearchPageClient.tsx).

**Problem:** Ranking contains many domain regexes and large hand-tuned boosts. Existing examples are useful, but expanding heuristics without a balanced corpus can prioritize one intent at the expense of another. ASCII query tokenization also merits explicit accented/identifier cases.

**Proposed PR:** Build a small offline query set with intended task, acceptable destinations, confusing alternatives, typos, exact keys/assets and negative controls. Report top-k intent success and regressions; consolidate only overlapping rules that the corpus justifies.

**Scope boundaries:** No embeddings service, user-query tracking or wholesale ranker rewrite.

**Acceptance target:** Baseline metrics are committed, high-risk operation questions route to evidence rather than historical availability claims, and new rules show improvement on held-out examples without degrading exact identifiers.

**Dependencies:** PR-24 for evaluating section-level destinations.

### PR-26 — Measure search startup, route bundles and DO contention

**Classification:** Performance / Architecture; P2; M discovery slice. **Evidence:** Inspected; effects unmeasured. [search UI](/Users/reidar/Projectos/thorchain-wiki/src/app/search/SearchPageClient.tsx) constructs Lunr at module evaluation and imports the corpus/ranker; main [DO entry](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/cloudflare/do-entry.mjs) routes application traffic to idFromName('primary'); [layout](/Users/reidar/Projectos/thorchain-wiki/src/app/layout.tsx) uses connection for nonce rendering.

**Problem:** Corpus/index construction, large client islands, repeated API collections and a single application DO are plausible bottlenecks. No bundle, INP, CPU, memory or load measurements here establish one.

**Proposed PR:** Record compressed route payloads, search construction time, interaction latency and a bounded mixed content/readiness concurrency test. Based on results, prebuild/load the index, defer unused charts, or separate static reference rendering from live collection while preserving CSP.

**Scope boundaries:** First PR is a measured baseline plus only a demonstrated small optimization. Single DO does not imply all asynchronous work is serialized. Static caching cannot reuse nonce-bearing HTML casually.

**Acceptance target:** Before/after evidence identifies exact artifact/device/load; relevance, CSP and readiness remain unchanged. If no material bottleneck is measured, retain the baseline and defer architecture changes.

**Dependencies:** PR-14; coordinate search experiments with PR-24/25.

## D. Editorial reliability and maintenance

### PR-27 — Detect primary-source changes and external-link decay

**Classification:** Content Reliability / Automation; P2; M. **Evidence:** Inspected. [source registry](/Users/reidar/Projectos/thorchain-wiki/src/lib/sources.ts), [review report](/Users/reidar/Projectos/thorchain-wiki/scripts/report-content-reviews.mjs), [link spec](/Users/reidar/Projectos/thorchain-wiki/tests/link-integrity.spec.ts) targets same-origin routes/anchors.

**Problem:** Scheduled date review and internal link validation already exist, but neither detects an official source changing before its due date or an external citation redirecting/disappearing.

**Proposed PR:** Add a bounded scheduled checker for allowlisted canonical sources, retaining status, final URL, validator/hash and a useful normalized diff. Map changed sources back to affected records; distinguish transient blocking/rate limits from removed content.

**Scope boundaries:** No crawling Discord/private sources, arbitrary URLs, automatic prose updates or semantic certification. Live API payload changes require PR-13's schema logic rather than full-page hashing.

**Acceptance target:** A fixture source change identifies dependent records; harmless chrome changes do not create a review storm; redirects, 429 and timeouts retain evidence and recover on bounded retry.

**Dependencies:** None.

### PR-28 — Pilot claim-level source and version evidence

**Classification:** Content Architecture / Core Product; P2; M pilot. **Evidence:** Inspected. [types](/Users/reidar/Projectos/thorchain-wiki/src/lib/types.ts), [registry](/Users/reidar/Projectos/thorchain-wiki/src/lib/content/registry.ts), [governance article](/Users/reidar/Projectos/thorchain-wiki/content/deep-dives/governance-comprehensive.mdx), [source posture](/Users/reidar/Projectos/thorchain-wiki/src/components/features/PageSourcePosture.tsx).

**Problem:** Page-level source/review dates cover articles that contain several claims with different evidence windows, proposal states and protocol versions. A page can be recently reviewed without every statement having equally fresh support.

**Proposed PR:** Pilot stable claim IDs on one governance/incident cohort: source reference, observed/version scope, current/historical/design classification, review decision and superseding claim. Render a compact claim citation and derive review work from the affected claims.

**Scope boundaries:** Keep static/MDX editorial ownership; no database/CMS, migration of every sentence or automatic live-state assertions.

**Acceptance target:** Each pilot claim can be traced to its actual cited evidence; conflicting/superseded states stay explicit; changing one source does not reset unrelated review dates; search/citations expose claim scope.

**Dependencies:** PR-02.

### PR-29 — Turn the existing review report into an actionable editorial queue

**Classification:** Developer Experience / Editorial UX; P2; S–M. **Evidence:** Inspected. [report script](/Users/reidar/Projectos/thorchain-wiki/scripts/report-content-reviews.mjs), [schedule helper](/Users/reidar/Projectos/thorchain-wiki/scripts/lib/content-review-schedule.mjs), [weekly workflow](/Users/reidar/Projectos/thorchain-wiki/.github/workflows/operations.yml).

**Problem:** Weekly JSON artifacts and failed checks are already produced, but editors still need to translate records into specific source checks, ownership and acceptance evidence.

**Proposed PR:** Publish a concise CI step summary or local HTML/Markdown queue with exact source file/record IDs, due dates, owner, source links and changed-source context. Offer explicit export to a prefilled review issue for selected items.

**Scope boundaries:** Start with report output rather than an authenticated editor application. Issue publication is an explicit action; do not spam one issue per record or mark source fetch as review completion.

**Acceptance target:** An editor can open the relevant record/source from the queue, see why review is needed, and record an evidence-backed decision. IDs survive reruns; duplicate tasks are detected.

**Dependencies:** PR-02; PR-27 can enrich the queue later without blocking its initial release.

### PR-30 — Separate content invariants from editorial wording snapshots

**Classification:** Testing / Developer Experience; P2; S–M. **Evidence:** Inspected. [chain review tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/chain-data-content-review.test.ts), [content checks](/Users/reidar/Projectos/thorchain-wiki/scripts/check-curated-data.mjs), [liquidity review tests](/Users/reidar/Projectos/thorchain-wiki/tests/unit/liquidity-economics-content-review.test.ts).

**Problem:** Important source/boundary tests coexist with exact wording/date assertions such as provider limits and reviewed cohort dates. Such assertions can force redundant edits during a legitimate source refresh and still cannot establish semantic truth.

**Proposed PR:** Keep structural/source/anchor/unit/current-versus-historical invariants machine checked. Where an exact date or phrase represents an editorial decision, identify its reviewed cohort/claim evidence in a small fixture rather than duplicating it across code. Retain targeted assertions for safety-critical copy.

**Scope boundaries:** No deletion of meaningful regression checks, replacement with hashes, generic schema library, or splitting large files merely because of line count.

**Acceptance target:** A cosmetic paragraph edit does not break unrelated tests; removing a source, qualifier, anchor or historical boundary still fails. Review-date updates remain attributable to a real evidence change.

**Dependencies:** PR-28 for the pilot cohort's claim identity; independent generic invariant cleanup can be scoped separately.

### PR-31 — Publish a curated “what changed” feed

**Classification:** Product / Discoverability; P2; M. **Evidence:** Inspected. [milestone/governance records](/Users/reidar/Projectos/thorchain-wiki/src/lib/data/static.ts), [content metadata](/Users/reidar/Projectos/thorchain-wiki/src/lib/content/registry.ts), [sitemap](/Users/reidar/Projectos/thorchain-wiki/src/lib/sitemap.ts).

**Problem:** Readers can browse dated events, but the inspected route inventory has no editorial update stream connecting changed explanations, source reviews and superseded claims. The sitemap also omits content-specific modification dates.

**Proposed PR:** Add a small authored change record for substantive content updates, showing what changed, affected route/claim, source date and review date. Render a page and feed from the same records; use genuine modification metadata for discoverability.

**Scope boundaries:** Do not report build time as editorial review, turn raw git commits into protocol news, or infer live events from polling.

**Acceptance target:** Stable feed IDs and valid dates; update links resolve; an old incident's renewed review is distinguished from the incident occurring today; robots/metadata and feed validation have focused coverage.

**Dependencies:** PR-28 for claim-level updates; basic route-level feed can ship first.

### PR-32 — Provide contribution and review templates that preserve evidence

**Classification:** Developer Experience / Community Workflow; P2; S. **Evidence:** Inspected. [CONTRIBUTING](/Users/reidar/Projectos/thorchain-wiki/CONTRIBUTING.md), [content guide](/Users/reidar/Projectos/thorchain-wiki/content/AGENTS.md), [registry](/Users/reidar/Projectos/thorchain-wiki/src/lib/content/registry.ts); inspected .github inventory contains workflows/Dependabot, without issue/PR templates.

**Problem:** Adding a sourced article touches route wrapper, registry, sources, headings, reader/task paths and generated search. The documentation is thorough, but the contribution form does not guide a first-time author through evidence and non-claims.

**Proposed PR:** Add small templates for article/source correction, runtime defect and implementation PR review; document one complete example. Reuse content checks to identify omissions and link focused verification commands appropriate to the serving runtime.

**Scope boundaries:** No scaffolding generator unless the manual example demonstrably remains error-prone; no requirement that every copy edit run a live financial inquiry.

**Acceptance target:** A newcomer can propose a correction with source/date/confidence and review boundary; a new article remains discoverable and searchable; runtime PRs state artifact/runtime proof separately from human content acceptance.

**Dependencies:** PR-01.

## E. Bounded advanced and stretch proposals

### PR-33 — Add a read-only transaction evidence triage pilot

**Classification:** Stretch / Advanced / Core Product; P3; L. **Evidence:** Inspected opportunity. [refund triage rows](/Users/reidar/Projectos/thorchain-wiki/src/components/features/NetworkStatusBanner.tsx) explicitly require transaction proof; [Midgard getSwaps/member helpers](/Users/reidar/Projectos/thorchain-wiki/src/lib/api/midgard.ts), [swap/refund article](/Users/reidar/Projectos/thorchain-wiki/content/deep-dives/streaming-swaps-refunds.mdx).

**Problem:** The wiki teaches readers which evidence is missing but cannot follow a public transaction through observed, pending, outbound/refund and unknown states.

**Proposed PR:** Start with one public transaction-hash lookup and a cited lifecycle timeline, linking the exact indexer/raw source used. Show unresolved/missing evidence and compare the actual transaction's time/inputs with current context without assigning a cause from present halts.

**Scope boundaries:** No wallet connection, signing, send instructions, automatic blame, recovery promises, stored address history or arbitrary URL fetches. Validate hash/chain inputs and privacy before adding providers.

**Acceptance target:** Sanitized fixtures cover observed, partial, refunded, multiple outbound and not-found cases; stale/indexer failures stay unknown; amounts/fees retain units; historical and current evidence cannot be conflated.

**Dependencies:** PR-06, PR-08, PR-13.

### PR-34 — Build one educational protocol scenario lab

**Classification:** Stretch / Learning Product; P3; L. **Evidence:** Inspected opportunity. [CLP article](/Users/reidar/Projectos/thorchain-wiki/content/deep-dives/clp.mdx), [incentive article](/Users/reidar/Projectos/thorchain-wiki/content/deep-dives/incentive-pendulum.mdx), [Mimir catalog](/Users/reidar/Projectos/thorchain-wiki/src/lib/operational-controls.ts).

**Problem:** The wiki explains mechanisms in prose, but does not let a learner explore how inputs alter a bounded model or where that model stops describing live behavior.

**Proposed PR:** Choose one small lab first: CLP amount/depth/slip or Mimir scheduled/active/expired controls. Show source-backed equations/rules, assumptions and the resulting state, with accessible numeric inputs and deterministic examples. Add other mechanisms only after learner feedback.

**Scope boundaries:** Toy scenarios, not quotes, price targets, investment returns, exact protocol execution or a full simulator. Current primary rule/version review is required before implementation.

**Acceptance target:** Known source examples and boundary tests reproduce the intended model; invalid inputs cannot produce plausible nonsense; users can explain its key limitation and link to the relevant live check.

**Dependencies:** PR-08 for arithmetic; PR-21 for interaction accessibility.

### PR-35 — Pilot recorded operational snapshots and explicit historical comparison

**Classification:** Stretch / Research / Observability; P3; L–XL. **Evidence:** Inspected opportunity. [readiness collector](/Users/reidar/Projectos/thorchain-wiki/src/lib/readiness-snapshot.ts), [monitor artifacts](/Users/reidar/Projectos/thorchain-wiki/scripts/lib/readiness-monitor.mjs), main [DO binding/config](https://github.com/Reedtrullz/tcwiki/blob/af210071b3110621ca9a83757697f12d103baae2/wrangler.do.jsonc).

**Problem:** Existing current snapshots and expiring CI artifacts cannot support a reliable “what evidence was observed then?” view. A SQLite-backed DO class binding does not mean the app already stores historical data; the inspected entry has no storage calls.

**Proposed PR:** Capture a bounded, versioned set of public control/quality snapshots with provider, actual height, observed time and collector version. Pilot fixed retention and a simple comparison/replay UI that highlights changed controls, gaps and source disagreement.

**Scope boundaries:** Start read-only and small. No full-chain archive, raw response hoarding, proof of continuous history or automatic incident narratives. A storage/quota/backup design and operational owner are prerequisites to implementation.

**Acceptance target:** Recorded views are unmistakably historical; missing intervals remain gaps; schema upgrades preserve old evidence; retention/export/restore and bounded usage are tested; clocks and provider/height differences stay visible.

**Dependencies:** PR-10, PR-12, PR-13, PR-15.

### PR-36 — Let readers save a learning path without an account

**Classification:** Optional Product / Learning UX; P3; M. **Evidence:** Inspected opportunity. [reader paths](/Users/reidar/Projectos/thorchain-wiki/src/lib/content/registry.ts), [article path controls](/Users/reidar/Projectos/thorchain-wiki/src/components/features/DeepDiveShell.tsx). Repository searches found URL-state persistence but no localStorage/sessionStorage reading-progress implementation.

**Problem:** Existing ordered paths and previous/next links provide a good learning spine, but a returning reader cannot mark progress, resume a chosen path, or retain a small personal reading list.

**Proposed PR:** Add opt-in browser-local completed-step/bookmark state with explicit reset and optional JSON export/import. Keep chosen path in the URL; show updated/superseded content since a bookmark without implying that reading equals competence.

**Scope boundaries:** No account, server tracking, wallet identity, notifications or course platform. Defer offline service-worker caching until readers demonstrate that need.

**Acceptance target:** Disabled/private/unavailable storage leaves navigation usable; reload resumes the chosen path; imports are size/schema bounded; removed IDs degrade to a recoverable link; no reading history is sent to an analytics endpoint.

**Dependencies:** None; PR-31 can later enrich “updated since saved” information.

## Second-pass record and stopping rationale

The first pass concentrated on the route/API/trust/readiness flow, current CI/deployment state, data arithmetic, and existing tests. It rejected “add search,” “add navigation,” “add mobile support,” “add health checks,” “add RUNEPool tracker,” and “migrate to Cloudflare”: those already exist.

The second pass examined:

- The editorial source/date lifecycle, authored September 30 WIP, scheduled review queue and English-copy-dependent tests.
- MDX generation versus rendered heading identity, article path continuation, citation/export opportunities, glossary and source-map discoverability.
- The actual Cloudflare entry/config/upload identity, browser gate target, dual deploy flags, monitor issue history and runtime-check deadlines.
- Filter persistence across all explorer styles, header focus ownership, chart alternatives, contrast-only coverage and the mobile first-screen experience.
- Transaction-evidence placeholders, no-account reader persistence, the source registry's potential for change detection, and a bounded history store distinct from an empty SQLite binding.

This produced the editorial/advanced proposals and sharpened the Cloudflare, accessibility, source and data-quality ones. Further ideas were stopped where they became low-value, duplicative or ungrounded. Deferred ideas include a CMS migration, general multi-protocol wiki, wallet execution, AI answer generation, semantic search service, translation program without a maintenance owner, push alerts without historical evidence, and full-chain archival.

## Coverage and remaining uncertainty

| Category | Inspected | Not established |
|---|---|---|
| Product and routes | All top-level route wrappers; Home/Network/Stats/Search/Dynamic Fees client flows; economics/POL, TCY, ecosystem, protocol/source/governance readers; registry and task/path structure | User interviews, conversion/task baselines, every pixel or every article statement |
| Domain/data | Three API clients; THORNode snapshot/fallback/quote/history/controls paths; Midgard normalization; Maya panel; trust/live result; daily volume; stats; POL valuation | Current protocol semantic correctness of every Mimir rule, financial statement or upstream schema |
| Content/discovery | Registry/sources/static metadata and dirty content differences; MDX generator, heading components, TOCs, search query/ranking/presentation structure, glossary and explorers | New primary-source research of all protocol/incident claims; exhaustive relevance evaluation |
| Security/privacy | CSP/proxy/report ingestion, fixed external provider requests, input normalization, runtime metadata; dependency lock and live CI failure; social-image inputs | Penetration testing, exploitability of all dependency advisories, secret/access-control inventory |
| Build/release | Local and current-main manifests/configs; CI/operations; Docker; Ansible preflight/rollback and systemd monitor; vinext/DO entry/config; deployed public identity | Fresh exact-main full build, target-runtime browser CI, Cloudflare control-plane route inventory, origin removal, rollback rehearsal |
| Testing | Unit-suite inventory and targeted implementations; six focused suites actually run; browser mock helpers, navigation/search/layout/links/runtime/contrast specs; content checks run | Full unit/E2E matrix, Firefox/Safari, physical phone, assistive technology |
| Performance | Static import/index creation, polling/request fan-out, readiness TTL, single application DO, duplicate provider reads | Current CPU distribution, memory, throughput, bundle sizes, Web Vitals, cold-tail behavior or cost headroom |
| Persistence | Browser URL state and versioned monitor artifacts; DO entry passes state/env but has no storage calls | Application history database, backups/restores for any future store |
| Developer experience | Guides, scripts, release-tracked checks, package/installed version drift, git history/worktree inventory and current status | Clean-machine onboarding trial or safe resolution of existing worktree/WIP ownership |

No authentication/user-account subsystem or CMS was found in the inspected app paths. Those are not prerequisites for its present reference/dashboards role. Do not add them merely to make the project look more ambitious.

## Verification receipts

The following commands were run without installs, source changes or builds:

~~~sh
node --version
df -h /System/Volumes/Data
node node_modules/vitest/vitest.mjs run tests/unit/daily-volume.test.ts tests/unit/network-diagnostics.test.ts tests/unit/trust.test.ts tests/unit/live-result.test.ts tests/unit/midgard.test.ts tests/unit/thornode.test.ts --maxWorkers=2
node scripts/generate-mdx-search.mjs --check
node scripts/check-curated-data.mjs
~~~

Results: Node v22.22.3; 45 GiB free; 124/124 tests across six files passed in 751 ms on the installed Vitest v4.1.11; generated search current; curated record validation passed. These are dirty-checkout structural checks, not certification of the shipped locked installation or protocol facts.

Final document checks: PR-01–36 are ordered, unique and contain all eight required elements; every local evidence link resolves; hard dependencies are acyclic; the reproduction below executes successfully. All 25 pre-existing dirty/untracked file hashes match the opening snapshot. The only new repository output is this proposal document.

### Synthetic reproductions

The following read-only check reproduces the key outputs using the already-installed jiti dependency. It is documentation, not a new application/test file:

~~~sh
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {createJiti} from 'jiti';
const jiti = createJiti(import.meta.url, {
  alias: {'@': process.cwd() + '/src'}, moduleCache: false, fsCache: false,
});
const {deriveDailyVolumeSummary} = await jiti.import('./src/lib/daily-volume.ts');
const {deriveRouteAvailability} = await jiti.import('./src/lib/network-diagnostics.ts');
const {runeBaseUnitsToNumber} = await jiti.import('./src/lib/trust.ts');
const {liveResultIsDegraded} = await jiti.import('./src/lib/live-result.ts');
const summary = deriveDailyVolumeSummary([{
  asset: 'BTC.BTC',
  result: {status: 'ok', checkedAt: '2026-10-01T00:00:00Z', data: [
    {startTime:'100', totalVolume:'100000000', totalVolumeUSD:'10000'},
    {startTime:'86500', totalVolume:'0', totalVolumeUSD:'0'},
  ]},
}]);
assert.equal(summary.usdVolume, 100); // Returns earlier positive bucket.
assert.equal(deriveRouteAvailability('BTC.BTC','ETH.ETH',undefined,undefined,{
  request:{fromAsset:'BTC.BTC',toAsset:'ETH.ETH',amountBaseUnits:'1'},
  status:'available',summary:'Synthetic quote',
  quote:{expiry:1,expectedAmountOut:'1',fees:{},raw:{}},
}).status, 'available'); // Past expiry is not checked.
assert.equal(runeBaseUnitsToNumber('-900719925474099300000000'), -9007199254740992);
assert.equal(liveResultIsDegraded({
  status:'ok',data:[{status:'ok',data:{sourceWarnings:['Synthetic warning']}}],
}), false); // Nested warning missed.
console.log('Four current behaviors reproduced; these are not desired acceptance assertions.');
JS
~~~

A separate positive second daily bucket returned USD 1 with prior average USD 100, demonstrating that positive activity rather than explicit completion selects the headline. Synthetic results show code behavior; they do not establish a particular production accounting incident.

### Platform references consulted

- [Next advisory](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j): supports dependency versions/attack-condition triage, not a finding of exploitation here.
- [Next CSP guide](https://nextjs.org/docs/app/guides/content-security-policy): nonce rendering needs explicit consideration in any caching experiment; existing root connection/proxy behavior was also inspected.
- [Cloudflare DO rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/): informs the bounded concurrency experiment; no assertion that the single DO is currently overloaded.

## Publication status and non-actions

All 36 earlier proposals were published on explicit owner request as concept-only issues #166–#201. Final title/body/URL/OPEN-state readbacks matched the prepared drafts; all prerequisite and coordination references link to their actual issues. The newer 30 proposals are #136–#165, so all 66 are now published. Publication does not authorize implementation.

During the original discovery phase, no implementation, fixes, dependency installs, refactors, application-code edits, implementation branches, commits, pushes, implementation PRs, deployments, secret changes, production configuration changes, or existing issue/PR edits were performed. Git fetch refreshed remote-tracking evidence; it did not integrate main into the dirty checkout. Only this dedicated planning document and the required Obsidian audit log are authored outputs.

## GitHub publication — earlier 36 proposals

Fresh duplicate check: 40 existing all-state issues and six open dependency PRs; no overlapping proposal issue was found. Main at publication: af210071b3110621ca9a83757697f12d103baae2. Current-main source permalinks replace local-only links; files without tracked counterparts remain explicitly identified as locally reviewed evidence.

| Portfolio ID | Issue | Title |
|---|---|---|
| PR-01 | [#166](https://github.com/Reedtrullz/tcwiki/issues/166) | Document the serving architecture and diagnose checkout drift |
| PR-02 | [#167](https://github.com/Reedtrullz/tcwiki/issues/167) | Replace blanket overdue-content bypass with scoped exceptions |
| PR-03 | [#168](https://github.com/Reedtrullz/tcwiki/issues/168) | Validate Maya before accepting a provider response |
| PR-04 | [#169](https://github.com/Reedtrullz/tcwiki/issues/169) | Select completed daily-volume intervals explicitly |
| PR-05 | [#170](https://github.com/Reedtrullz/tcwiki/issues/170) | Define the leaderboard universe and retain each pool's provenance |
| PR-06 | [#171](https://github.com/Reedtrullz/tcwiki/issues/171) | Expire quote evidence and withdraw stale availability claims |
| PR-07 | [#172](https://github.com/Reedtrullz/tcwiki/issues/172) | Distinguish last good data from fresh operational evidence |
| PR-08 | [#173](https://github.com/Reedtrullz/tcwiki/issues/173) | Enforce symmetric numeric limits at presentation boundaries |
| PR-09 | [#174](https://github.com/Reedtrullz/tcwiki/issues/174) | Pair the POL USD price with its actual source interval |
| PR-10 | [#175](https://github.com/Reedtrullz/tcwiki/issues/175) | Reuse pinned THORNode reads within one collection cycle |
| PR-11 | [#176](https://github.com/Reedtrullz/tcwiki/issues/176) | Bound collection deadlines and respect provider throttling |
| PR-12 | [#177](https://github.com/Reedtrullz/tcwiki/issues/177) | Carry structured warnings from parser to readiness and UI |
| PR-13 | [#178](https://github.com/Reedtrullz/tcwiki/issues/178) | Add small versioned upstream contract fixtures |
| PR-14 | [#179](https://github.com/Reedtrullz/tcwiki/issues/179) | Run browser and CSP proof against the Cloudflare candidate |
| PR-15 | [#180](https://github.com/Reedtrullz/tcwiki/issues/180) | Identify the whole Worker artifact and verify the routed release |
| PR-16 | [#181](https://github.com/Reedtrullz/tcwiki/issues/181) | Separate origin liveness, source readiness and feature degradation |
| PR-17 | [#182](https://github.com/Reedtrullz/tcwiki/issues/182) | Coordinate framework upgrades and report dependency reachability |
| PR-18 | [#183](https://github.com/Reedtrullz/tcwiki/issues/183) | Bound CSP report ingestion and expose suppressed-report counts |
| PR-19 | [#184](https://github.com/Reedtrullz/tcwiki/issues/184) | Make header disclosures keyboard-complete |
| PR-20 | [#185](https://github.com/Reedtrullz/tcwiki/issues/185) | Make explorer URL behavior consistent and include fee filters |
| PR-21 | [#186](https://github.com/Reedtrullz/tcwiki/issues/186) | Test accessibility beyond contrast and initial loading |
| PR-22 | [#187](https://github.com/Reedtrullz/tcwiki/issues/187) | Put the reader's answer before repeated evidence-routing copy |
| PR-23 | [#188](https://github.com/Reedtrullz/tcwiki/issues/188) | Add printable article views and portable citations |
| PR-24 | [#189](https://github.com/Reedtrullz/tcwiki/issues/189) | Index deep-dive sections and unify heading identity |
| PR-25 | [#190](https://github.com/Reedtrullz/tcwiki/issues/190) | Evaluate search intent before changing ranking rules |
| PR-26 | [#191](https://github.com/Reedtrullz/tcwiki/issues/191) | Measure search startup, route bundles and DO contention |
| PR-27 | [#192](https://github.com/Reedtrullz/tcwiki/issues/192) | Detect primary-source changes and external-link decay |
| PR-28 | [#193](https://github.com/Reedtrullz/tcwiki/issues/193) | Pilot claim-level source and version evidence |
| PR-29 | [#194](https://github.com/Reedtrullz/tcwiki/issues/194) | Turn the existing review report into an actionable editorial queue |
| PR-30 | [#195](https://github.com/Reedtrullz/tcwiki/issues/195) | Separate content invariants from editorial wording snapshots |
| PR-31 | [#196](https://github.com/Reedtrullz/tcwiki/issues/196) | Publish a curated “what changed” feed |
| PR-32 | [#197](https://github.com/Reedtrullz/tcwiki/issues/197) | Provide contribution and review templates that preserve evidence |
| PR-33 | [#198](https://github.com/Reedtrullz/tcwiki/issues/198) | Add a read-only transaction evidence triage pilot |
| PR-34 | [#199](https://github.com/Reedtrullz/tcwiki/issues/199) | Build one educational protocol scenario lab |
| PR-35 | [#200](https://github.com/Reedtrullz/tcwiki/issues/200) | Pilot recorded operational snapshots and explicit historical comparison |
| PR-36 | [#201](https://github.com/Reedtrullz/tcwiki/issues/201) | Let readers save a learning path without an account |

Exact final bodies, body hashes, issue URLs, duplicate inventory and verification flags are saved in [the publication receipt](/Users/reidar/Projectos/thorchain-wiki/docs/proposals/2026-10-01-earlier-issue-publication.json). The [newer publication receipt](/Users/reidar/Projectos/thorchain-wiki/docs/proposals/2026-10-01-deeper-issue-publication.json) now records resolved earlier dependencies too. All 66 titles/bodies/URLs/OPEN states were verified after linking. No implementation branch, PR, commit, push, application edit, dependency install or deployment occurred.

## OP_RETURN roadmap follow-up — 2 October 2026

Owner-approved [OP_RETURN roadmap additions](2026-10-02-opreturn-roadmap.md) add PR-67–69 and refine existing PR-33 / #198 and PR-62 / #161. Priorities, scope, acceptance targets and verified issue links are in the follow-up. The portfolio now contains 69 distinct proposals; original issue-publication receipts remain historical. No application implementation or deployment.
