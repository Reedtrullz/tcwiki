# PR-46 return-basis evidence

Scope: THORChain Wiki issue [#145](https://github.com/Reedtrullz/tcwiki/issues/145), implemented from branch `codex/wiki-pool-return-basis` at baseline `fa871456dee4aa770ef0359d890f3a4de54f49ac`.

## Repository fixture

The existing captured `/pools` fixture is [`tests/fixtures/upstream/v1.json`](../../tests/fixtures/upstream/v1.json), contract `midgard-pools`, observed `2026-10-03T00:05:30.970Z` from `https://gateway.liquify.com/chain/thorchain_midgard/v2/pools?status=available`. SHA-256: `c0bb702b8503a1710ec6dee90c1de75f8fde3176f889c8dfa5d881251b1a009d`.

Its three rows contain `poolAPY` decimal strings (`0.0222938113558262`, `0.031173281015140164`, `0.021701630066496058`); none contains `annualPercentageRate`. The captured request omits `period`, so the source schema's default applies to that capture. These are source fixture values, not an assertion about current live returns.

## Pinned upstream contract

Reviewed the official Midgard OpenAPI document at immutable GitLab revision [`fa490034b043b17df8bb8d4d2e30a16b9abe5ab4`](https://gitlab.com/thorchain/midgard/-/blob/fa490034b043b17df8bb8d4d2e30a16b9abe5ab4/openapi/openapi.yaml) (raw document SHA-256: `4785c06fd0cc0264212bba777ef476d74bddfddb2466e2ffc986d2a1f6882707`).

For `GET /v2/pools`, the spec accepts `period` values `1h`, `24h`, `7d`, `14d`, `30d`, `90d`, `100d`, `180d`, `365d`, and `all`; default is `14d`. The UI offers the finite durations through `365d` and leaves out unbounded `all`.

The `/pools` response schema describes both `annualPercentageRate` and `poolAPY` as a “Float, Annual Percentage Yield of earning to depth (earning/depth) estimated from a period (configurable by the period parameter, default is 14)” and gives `0.1` as a 10% yearly-return example. It does not document a distinct APR formula or a conversion/compounding relationship between these keys. The implementation therefore preserves both provider fields independently, displays each decimal-scale field as a percentage (`×100`), ranks only within the selected field, and makes no APR/APY conversion.

The request's selected `period` is included in both the exact Midgard request/provenance URL and the SWR cache key. The UI displays the selected period beside pool rows and exposes the source URL and retrieval time.

Parent review independently retrieved the complete pinned OpenAPI document and matched SHA2564785c06fd0cc0264212bba777ef476d74bddfddb2466e2ffc986d2a1f6882707. Added a failing-to-passing API-boundary regression for all/unsupported/injected periods; invalid periods now return degraded without fetching. Updated the shared deterministic pool fixture matcher for the explicit period. Combined with operation/policy PR242; productchanges merged automatically. Final651unit tests/types/lint/content/bothbuilds/Nextsmoke and47stats/network/home/runtimebrowserchecks eachNext/actualWikiDO passed, withone desktop-only skip on each target. No mainmerge/deploy.
