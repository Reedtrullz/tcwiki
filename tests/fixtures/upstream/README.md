# Upstream contract fixture v1

`v1.json` is a reviewed, sanitized public-provider capture from 2026-10-03. It records exact source URLs, per-read UTC observation times and separately observed THORNode protocol version/height. It is not a pinned multi-endpoint snapshot, provider agreement proof, current financial accounting or a complete control list. Midgard/Maya indexer heights are explicitly unavailable in these captures.

Only named parser fields and at most three rows are retained; node identities become `redacted-node`, and IPs, wallets, vault/public keys, arbitrary Mimir keys and unknown fields are discarded. Asset identifiers may contain public token contract identifiers. Numbers, base-unit strings, signs, booleans and missing/null fields retain their observed types and values. The ten sequential reads each have a five-second deadline and a 512KiB response ceiling; no raw response archive is saved. The original 128KiB limit correctly marked Maya nodes unavailable; its observed381437-byte body justified the bounded512KiB limit.

Offline `tests/unit/upstream-contracts.test.ts` replays the capture through existing THORNode, Midgard and Maya parsers and mutates a required field to verify degradation. Shape diffs list removed/added selected field paths and types. Differences require review; an unavailable provider is reported independently and never becomes a zero-valued fixture.

Opt-in capture/review:

```sh
node scripts/check-upstream-contracts.mjs --capture .artifacts/upstream-candidate-YYYYMMDD.json
node scripts/check-upstream-contracts.mjs --report .artifacts/upstream-report-YYYYMMDD.json
npm run test:unit -- tests/unit/upstream-contracts.test.ts
```

Outputs must be new files below `.artifacts/`; the command refuses overwrite and does not replace this baseline. Inspect the sanitized JSON and diffs, confirm metadata/redaction, copy a reviewed candidate to a new versioned fixture (or revise v1 deliberately), then run the offline checks and submit a PR. Never update values to make malformed-provider checks pass. The independent scheduled/dispatch workflow retains a seven-day report artifact; ordinary PR tests make no live calls. Reported drift is observation evidence rather than a parser regression verdict. Add fields/sample rows only for a demonstrated parser gap.
