# Loaded accessibility (proposal PR-21, issue #186)

## Scope and baseline

Opening main `686b63b` had contrast and initial navigation checks. This slice builds on the unmerged PR244 candidate (`e4fa516`), which incorporates the corrected PR19 header and PR24/66 destinations. Installed axe-core is reused; no accessibility dependency or duplicate chart summaries are added.

Deterministic loaded and degraded fixtures cover network diagnostics, available pools/earnings, search and a deep-dive table. The broader axe rule set is WCAG2A/AA and WCAG2.1A/AA. Each finding includes rule, impact, help URL, actual node selector and failure summary. Initial failures identified real inaccessible horizontal-scroll regions, alongside three incorrect test assumptions about a textbox role, unavailable-state text and the mobile button's changed accessible name. Those assertions were corrected without suppressing the rules.

The real fixes make per-chain operation/source evidence, pool and earnings overflow regions keyboard focusable with meaningful labels. Native keyboard journeys reach and leave the route checker, search, header disclosures and scroll region; Escape restores trigger focus. Charts show their final data without startup animation. The reduced-motion media rule disables transitions/scroll animation and limits CSS animation duration.

## Reflow and announcements

Loaded dashboards and article tables are checked at 640 and 320 CSS pixels, the reflow widths corresponding to 200% and 400% of a 1280px layout. Page overflow is rejected; dense tables retain their local scroll regions and mobile cards. This is automated CSS viewport/reflow evidence, not physical-device or browser-chrome zoom certification.

A browser MutationObserver watches the network's semantic live-region text across three real manual refreshes. An identical refreshed response does not mutate announcement text; one changed ETH trading control produces one semantic text update; repeating that changed response adds no announcement. Source timestamps and refreshing receipts remain outside that live region. This establishes DOM behavior; human screen-reader announcement quality is a separate acceptance task.

## Verification

The full unit suite passes 651 tests across 55 files with two workers. Typecheck/lint pass with zero errors and one existing Cloudflare default-export warning. Under an earlier four-browser plus unlimited-unit workload, two fixture subprocess tests exceeded their existing five-second deadlines; capacity-bounded rerun passes without changing those deadlines.

Both Next standalone and actual WikiDO builds pass; standalone smoke passes with the unsupported live `PAUSELOANS` readiness warning preserved. Next's full accessibility/navigation/network/search/deep-dive run passes 65 applicable checks with five intentional device-layout skips. The same Cloudflare run against the actual WikiDO artifact also passes 65 applicable checks with five device-layout skips. The explicit Cloudflare gate includes accessibility tests, so future target CI cannot silently omit these states.

No production changes, main merge, dependency installation or telemetry vendor. Human screen-reader/device acceptance and literal browser zoom remain distinct from this automated proof. Candidate commits use per-command unsigned Git because the interactive signer is unavailable; global settings remain unchanged.
