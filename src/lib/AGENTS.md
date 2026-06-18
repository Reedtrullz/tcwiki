# src/lib/ — Domain Layer Guide

## OVERVIEW
`src/lib/` contains the wiki’s domain layer: live Midgard access, curated static data, shared types, hooks, and small utilities.

## STRUCTURE
- `api/midgard.ts` — resilient live-data client with endpoint failover.
- `api/thornode.ts` — THORNode/Mimir status client.
- `data/static.ts` — curated source-of-truth datasets and freshness metadata.
- `hooks/` — SWR hooks wrapping live data access.
- `content/registry.ts` — central route/content/source registry.
- `search/registry.ts` — generated search documents plus curated records.
- `types.ts` — shared domain and freshness/confidence types.
- `utils.ts` — small reusable helpers.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Change live THORChain data fetching | `src/lib/api/midgard.ts`, `src/lib/api/thornode.ts` | Fetch clients, 5000ms timeout, failover order matters |
| Update curated wiki content | `src/lib/data/static.ts` | Use the existing data objects and `withFreshness()` metadata |
| Add or adjust SWR data access | `src/lib/hooks/useMidgard.ts` | Keep refresh behavior consistent |
| Add or rename shared domain shapes | `src/lib/types.ts` | Update all downstream consumers together |
| Add a small helper | `src/lib/utils.ts` or `src/lib/trust.ts` | Keep helpers tiny and framework-agnostic |

## CONVENTIONS
- Prefer the Midgard endpoint priority defined by Heimdall docs; do not reorder without a protocol reason.
- Treat RUNE values as `1e8` units everywhere in lib code; convert only at presentation boundaries.
- Malformed or missing base-unit values return `null` and render as unavailable; only valid numeric zero may display as zero.
- Preserve `current-only` provenance wording when describing live data.
- Keep static content authoritative: use `withFreshness()` for curated records and include confidence + verification fields.
- Confidence values are limited to `official`, `curated`, `historical`, and `needs-review`.
- SWR hooks use `refreshInterval: 60000` and `revalidateOnFocus: false` unless there is a strong reason to change both callers and docs.
- Keep types centralized in `types.ts`; avoid duplicating interfaces in feature components.
- Keep utilities generic and dependency-light.

## ANTI-PATTERNS
- No `index.ts` barrel files in `src/lib/` subdirectories.
- No `as any` or `@ts-ignore`.
- No duplicate curated datasets outside `static.ts`.
- No endpoint-specific assumptions in hooks or UI; keep live-data logic inside `api/`.
- No hidden unit conversions for RUNE.
- No silent live-data fallbacks to zero or empty lists.
- No ad hoc freshness fields; reuse the existing freshness/confidence system.
