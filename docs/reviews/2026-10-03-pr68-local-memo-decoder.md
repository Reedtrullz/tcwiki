# PR-68 local educational memo decoder

Reviewed: 2026-10-03  
Review cohort: 2026-10-03 through 2026-11-03  
Baseline: branch `codex/wiki-memo-decoder`, commit `d65fc2039300ad6e3e92274b3e5ea5efb12165c1`

## Purpose and source basis

The decoder is a local teaching aid embedded in the Build And Query THORChain Data guide. It preserves the input verbatim and interprets only a small subset of the official memo grammar. The official developer memo page was reviewed on 2026-10-03. THORNode source was pinned to v3.20.3, commit [`b08d81f79275093b0fcb753e0d68ff1c16c51cb8`](https://gitlab.com/thorchain/thornode/-/tree/b08d81f79275093b0fcb753e0d68ff1c16c51cb8).

The ignored source review extract `.superpowers/sdd/2026-10-02-entire-workplan/pr67-memo-source.txt` has SHA-256 `3dd33b3dceee0bfa5e80fc566d74d1a881d666f9cee832ca3575bca6bd80e2b6`. Its referenced official memo HTML capture has SHA-256 `cf695b347c1a1ec182b85a825b6750c8c09d75d697c94c8929c6ca092e0dcd0d`.

| Pinned source file | SHA-256 |
|---|---|
| `x/thorchain/memo/memo_swap.go` | `2f21b9789d9987fee1366e00cffe01c9d984aa38a7082aa3a60e61b913f50c24` |
| `x/thorchain/memo/memo_parser.go` | `419caa28b1f42450c1fbf1ca7f786ab4bd6b9a1f55d0fb8609eb3adb8d90b483` |
| `x/thorchain/memo/memo_outbound.go` | `c144b57cdfa35362eee631fc4e2c333791cb3643e9498248d679afc84d99e8d0` |
| `x/thorchain/memo/memo_migrate.go` | `d34e6a9be3c99104a7e71c6f9b20cd3688a9145d4cd96b55410ff6fd5d96ba7c` |
| `x/thorchain/memo/memo_refund.go` | `ffc72ca1bc301f65aed390bf046453083d71c832b158d311b9b1259fe8301693` |
| `common/tx.go` | `9be1ad052607f1dc2e717120d45355a0675fca6bad3a4caa16cf5da9bd202689` |
| `common/asset.go` | `5ac23fdaf5fbba87801b045d36729940b0bddd52545efa21a8c5a8c3a2602595` |

## Supported interpretation subset

- Market swap action tokens `=`, `s`, and `SWAP`, plus literal asset, optional destination/refund tokens, integer price limits, and bounded streaming tuple fields.
- Affiliate names and basis-point tokens as literal memo fields. A single fee token may be shown beside each name, or counts may match. The local tool stops at eight names as an implementation bound.
- `OUT` and `REFUND` with bounded transaction-ID shapes: 64 hexadecimal characters, `0x` plus 64 hex characters, 64 hex characters plus a numeric Cosmos index suffix, or 87–88 Base58 characters. Raw case is preserved and no identifier lookup occurs.
- `MIGRATE` with a signed int64 height token.
- Decimal integer price limits through uint256. On the non-streaming price field, integer-coefficient scientific notation is bounded to exponents 0–77. Fractional forms and scientific forms outside that bound are shown as unsupported.
- Streaming interval and quantity tokens are bounded to uint64. A zero quantity is shown as queue-context dependent; the decoder does not infer a final stream count.

The local parser accepts at most 250 UTF-8 bytes. This is a tool bound, not a claim about the protocol memo limit. The guide’s example buttons use only the four reviewed PR-67 memo values and pass only each record’s ID, title, and original memo string to the client component.

## Limitations

This is not a THORNode-compatible validator. The decoder does not load keeper state, current or historical chain state, version-specific aliases, dynamic fees, or configured affiliate limits. The official memo guide states a 1,000-bps affiliate figure while the pinned parser contains a 10,000-bps maximum basis-point constant; affiliate configuration is also runtime-dependent. This tool leaves fee tokens raw and does not claim either limit is validated or currently applicable.

Asset notation is displayed literally. Short codes and historical aliases such as `tr` remain unresolved. Destination/refund values and THORNames are not validated or resolved; ownership and chain applicability are unknown. Outbound/refund IDs receive shape checks only. `|` suffixes, limit-swap forms, DEX fields, and later swap fields remain visible in the unchanged original and are reported as unsupported. No copied example becomes transaction guidance.

No input is saved, analyzed remotely, or transmitted. The component does not construct or send a memo, query a provider, or resolve aliases from present-day state. A decoded action is syntax and intent evidence only; it proves no feature availability, quote validity, execution, refund completion, or settlement.

## Review evidence

Source-backed unit coverage exercises supported action aliases and fields, exact case and precision, source integer widths, uint256/scientific boundaries, affiliate list forms, unknown actions, suffixes, malformed values, and UTF-8 size limits. A focused browser spec covers keyboard input, the four local examples, 320px overflow, scoped WCAG rules, and absence of interaction-triggered requests. The browser spec is authored but intentionally not run in this handoff; runtime proof remains with the parent review.

The builder guide’s existing content review dates remain unchanged. This decoder rule record has its own curated review dates above.

Parent review adds hydration gating for both runtime controls, scans the whole decoder section rather than only its heading, and verifies oversized/unsupported input preservation and recovery. Runtime proof follows before publication.

Final parent validation: all 711 unit tests across 62 files, typecheck, scoped lint, content checks, both builds and standalone smoke passed. The final built Next and actual WikiDO runs each passed eight desktop/mobile decoder checks: keyboard interaction, four reviewed examples, unsupported/oversized original preservation and recovery, 320px containment and a WCAG scan of the whole decoder. No memo was transmitted and no external request was triggered while typing. The first Worker privacy assertion mistakenly included background same-origin prefetch chunks; the final assertion checks input transmission and external requests while permitting ordinary page asset loading. No main merge, deployment or human learning acceptance.
