# PR-27 canonical source drift pilot

This implements issue #192 as a bounded report-only pilot. The allowlist names five entries from `src/lib/sources.ts`; their affected record IDs are derived by exact URL matches against `CONTENT_ENTRIES` in `src/lib/content/registry.ts`.

| Source ID | Canonical source | Affected curated records |
|---|---|---|
| `network-halts` | `https://dev.thorchain.org/concepts/network-halts.html` | `deep-dive-app-layer`, `deep-dive-liquidity-actions`, `deep-dive-mimir-halt-controls`, `deep-dive-streaming-swaps-refunds`, `deep-dives`, `docs`, `ecosystem`, `glossary`, `governance`, `home`, `network`, `protocol`, `search` |
| `fees` | `https://dev.thorchain.org/concepts/fees.html` | `deep-dive-build-query-data`, `deep-dive-streaming-swaps-refunds`, `deep-dives`, `dynamic-fees`, `economics`, `glossary` |
| `memos` | `https://dev.thorchain.org/concepts/memos.html` | `deep-dive-build-query-data`, `deep-dive-liquidity-actions`, `deep-dive-streaming-swaps-refunds`, `deep-dives`, `glossary`, `protocol` |
| `swap-guide` | `https://dev.thorchain.org/swap-guide/quickstart-guide.html` | `deep-dive-build-query-data`, `deep-dive-clp`, `deep-dive-streaming-swaps-refunds`, `deep-dives`, `glossary`, `protocol` |
| `dynamic-l1-fees-adr` | `https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md` | `dynamic-fees`, `glossary` |

The initial snapshot in `tests/fixtures/source-drift/baseline.json` was captured on 2026-10-03 at 05:44:42 UTC. All five sources returned HTTP 200 and passed extraction. HTML extraction reads only a unique `<main>` or `<article>` region. It normalizes visible text, common entities, and whitespace, and includes resolved article links in the content hash. Markdown keeps text and fenced examples; simple empty named anchors are recorded as links. Unsupported tags, embedded Markdown HTML, ambiguous regions, and invalid encodings remain `unverified-content` without a hash.

The fetcher follows at most three redirects, and every hop must remain HTTPS on that source's explicit hostname allowlist. It reads at most 256 KiB of decoded body per response, uses an 8-second request timeout and a 40-second report deadline, and runs at most two source checks concurrently. It retries one timeout, network error, 5xx, or 429; a 429 honors `Retry-After` within the report deadline. Reports retain HTTP status, final URL, ETag or Last-Modified, normalized SHA-256, and a diff capped at 40 changed text lines and 20 changed links.

`npm run report:source-drift` compares the checked-in snapshot offline and writes nothing. Live refresh requires `--refresh --artifact PATH`; output must be a new file under `.artifacts/`, and the serialized artifact is capped at 4 MiB. The daily `operations.yml` lane uploads that report with seven-day retention and only has `contents: read` permission. It does not publish issues or modify editorial records, review dates, or source prose. `kind: tcwiki-canonical-source-drift` and `schemaVersion: 1` identify the report shape for downstream consumers.

This pilot checks changes to the five primary sources. It records HTML article links and Markdown named anchors as links; Markdown link syntax remains in the normalized text and diff. It does not fetch link destinations or crawl other wiki links. A response over the body cap is `body-too-large`; content outside the supported extraction subset is `unverified-content`. The pilot does not claim broad external-link health.

Validation on the candidate checkout: the focused source-drift suite passes 12 tests; the live refresh captured all five sources; offline report returned five unchanged records against the seeded snapshot. No content review dates or wiki prose were changed.

Parent review added regression coverage for a long Retry-After exceeding the report deadline, partial-body timeout evidence, and a 304 response with an unrelated canonical baseline. Retry/body failure now produces a per-source timeout result, rather than rejecting the entire report. Conditional validators are sent/reused only when canonical and final URL identity match. Cleanup failures produce a bounded diagnostic rather than an empty catch.

Final parent verification: 708 unit tests across 61 files, typecheck, scoped ESLint and content validation passed. A bounded live recheck returned five HTTP 304 unchanged snapshots against the initial baseline; the offline mode also reported five unchanged. App source is unchanged; no application runtime rebuild or production action is claimed for this report-only CLI/workflow change. The first parent full suite had 707 tests before the added partial-body regression; the final suite includes it.
