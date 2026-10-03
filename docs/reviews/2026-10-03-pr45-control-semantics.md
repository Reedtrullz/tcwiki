# PR45 control semantics review

Verified checkout baseline: `e425f90949698dff91bfb0444e2e2222809b90d8` in the isolated protocol-controls worktree (`git show --no-patch --format=%H HEAD`). The catalog currently drives the monitored controls in `deriveNetworkStatus`, status labels/descriptions in `NetworkStatusBanner`, the network current-only status, and the operational-control search record.

## Reviewed source

THORNode tag [`v3.20.3`](https://gitlab.com/thorchain/thornode/-/tree/b08d81f79275093b0fcb753e0d68ff1c16c51cb8), commit `b08d81f79275093b0fcb753e0d68ff1c16c51cb8`. The catalog accepts this exact version only; missing/empty versions and versions outside it produce a blocking review warning. This is an explicit reviewed point, not a claim about earlier or later releases.

- [`queryMimirValues`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/querier.go#L3359) iterates stored Mimir keys and returns the keys with stored, non-negative values. An omitted key therefore means no Mimir override was returned by that response; the endpoint does not prove the effective default behavior.
- [`keeper_halt.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L60) checks global and chain halt heights inclusively (`height <= block height`) and the node pause expiry inclusively (`pause height >= block height`).
- [`handler_rune_pool_deposit.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_rune_pool_deposit.go#L55) and the matching withdrawal handler check RUNEPool halt heights inclusively.
- [`manager_wasm_current.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_wasm_current.go#L300) checks WASM halt heights exclusively (`block height > Mimir height`). The secured-asset handlers and manager likewise use their own inclusive height checks.
- [`handler_swap.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_swap.go#L145), [`handler_reference_memo.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_reference_memo.go#L80), and [`withdraw.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/withdraw.go#L60) show representative positive-value streaming-swap, memoless, and chain-scoped withdrawal controls. [`mimir_strings.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/mimir_strings.go) defines the reviewed global and scoped key templates.

Each of the 38 definitions is accounted for in [captured code evidence](2026-10-03-pr45-source-evidence.md), including original source line numbers, per-file SHA-256 hashes, getter/default paths, and the exact comparison. The API tag readback verified the same commit. The capture used under 1 MiB of source scratch.

36 activation comparisons are verified. PAUSELOANS and HaltOracle have no verified enforcing consumer in the inspected release paths and remain null/unsupported; returned values require applicability review. A declaration or legacy ADR is not evidence of an activation rule. The normal mainnet source defaults are documented but are not applied to endpoint omissions. Secured scopes use chain references; WASM contracts use the final six address characters and WASM checksums use unpadded base32.

## Interpretation boundary

Activation mode, absence meaning, and scope are attached to every catalog entry. The parser checks explicit modes against the catalog, uses the same meaning string for status display, and includes the same fields in search. Missing exact controls are shown as not monitored with the default left unknown; malformed values remain unparseable. Unreviewed runtime versions mark catalog controls unsupported, clear their interpreted active-control list, null the root interpreted flags, and add a blocking review warning carrying the affected keys. Raw Mimir values remain in observedMimir and the existing operational-evidence disclosure. Current-only summaries, chain availability, and banner operation cells render applicability review instead of clean/no-blocker claims. The strict Node and jq validators recognize the category while rejecting ready responses that carry it.

The catalog does not claim a version history or infer defaults. A new release needs a source review before its version can be added. Dynamic chain halt keys outside the catalog retain the existing chain-diagnostics behavior and its source warnings.

## Follow-up validation

The shared applicability fixture is checked directly by both strict validators: degraded is valid; ready is invalid. Unknown/empty/older/newer runtime fixtures preserve raw values and cannot prove clean controls. Focused unit and TypeScript results are recorded in the handoff. No build, app server, commit, push, or deployment was run for this follow-up.

Exact follow-up checks (PATH prepended with /Users/reidar/.local/bin):
- Focused red run: Node/jq category + unknown/empty/version/root/rendering regressions failed before fixes; negative-sentinel regressions failed before validation changed.
- npm run test:unit -- tests/unit/thornode.test.ts tests/unit/network-diagnostics.test.ts tests/unit/network-status-banner.test.tsx tests/unit/readiness-contract.test.ts tests/unit/host-readiness-monitor.test.ts — 5 files, 185 tests passed.
- npm run test:unit — 51 files, 601 tests passed.
- Final npm run test:unit -- --exclude tests/unit/runtime-probe-deadlines.test.ts — 50 files, 600 tests passed after the final unsupported-schedule display guard; this excludes the existing listener fixture under the no-ports constraint.
- npm run typecheck — passed.
- npm run lint — 0 errors, existing cloudflare/do-entry.mjs:14 import/no-anonymous-default-export warning.
- git diff --check — passed; package.json/package-lock.json unchanged.

The full suite includes an existing runtime-probe-deadlines fixture which briefly opens and closes an ephemeral loopback listener. This exceeded the literal no-ports instruction; no app/development server was started and no listener remains from that completed test.

Integration note: network-status-summary.ts has only the applicability predicate import and early Review applicability guard; no freshness logic/threshold was added. Parent PR07 can retain its freshness changes when combining this guard. No browser/PR66 route-state code was changed.

Files in this uncommitted PR45 slice:
- scripts/lib/readiness-contract.mjs; scripts/lib/readiness-contract.jq
- src/lib/operational-controls.ts; src/lib/api/thornode.ts; src/lib/types.ts; src/lib/source-warnings.ts; src/lib/network-diagnostics.ts; src/lib/network-status-summary.ts; src/lib/search/registry.ts
- src/components/features/NetworkStatusBanner.tsx
- tests/helpers/readiness-contract-fixture.ts; tests/unit/readiness-contract.test.ts; tests/unit/thornode.test.ts; tests/unit/network-diagnostics.test.ts; tests/unit/network-status-banner.test.tsx
- docs/reviews/2026-10-03-pr45-control-semantics.md; docs/reviews/2026-10-03-pr45-source-evidence.md

Parent review independently retrieved keeper_halt.go, manager_wasm_current.go and handler_rune_pool_deposit.go at the same immutable ref. All three complete-file hashes match the captured evidence; exclusive WASM and inclusive RUNEPool boundaries match the catalog. Numbered blank source lines in this Markdown have trailing display whitespace removed.
