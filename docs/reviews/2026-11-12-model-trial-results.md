# Model trial results - 2026-11-12

Frozen-text model run of the CLP and reader packs. Raw answers are in
`2026-11-12-model-trial-transcripts.md`; prompts and scoring are in
`2026-11-12-model-trial-protocol.md`.

## Inputs

| Input | Value |
| --- | --- |
| Commit | `2024ad2c04f40551422f8f673ecfbec827f9f08d` |
| Captured | 2026-11-12T03:08:25Z |
| Viewport | 1280x900 |
| CLP text | 9,142 chars, SHA-256 `6f9b11132758193a8cb98ecfa8c72123f0d57417009bc03405ffa636d76c133a` |
| Home text | 6,284 chars, SHA-256 `bda245e27501d5e8bb3c6530abde55daba7bc46968eebde33bbd0a84490f5efd` |
| Stats text | 15,538 chars, SHA-256 `4732a01e52e126115be792ffb4afc1437736bcce93ee4bcc4aef1f7581e122e2` |

Models: `openai/gpt-6-luna`, `deepseek/deepseek-v4-pro`, `xai/grok-4.7`.
No tools or web access; one run per model; provider-default temperature.
`openrouter/google/gemma-4-31b-it:free` returned HTTP 429 on both attempts
(provider rate limit) and is not scored.

DeepSeek's reasoning consumed the default 800-token completion budget and left
an empty final answer. It was re-run with 2,600 tokens (CLP) and 7,000 tokens
(reader); both final answers completed with `finish_reason: stop`. That is an
operational note, not a page failure.

## CLP lab (#199)

| Model | Slip | Fee | Output | Q2 limitation | Q3 live check | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| gpt-6-luna | 16.66666667% | 27.77777777 | 138.88888888 | Pass: fixed-depth model, not execution proof | Pass: fresh THORNode quote + Network diagnostics | PASS |
| deepseek-v4-pro | 16.66666667% | 27.77777778 | 138.88888889 | Pass: no execution, streaming, routing, fee floors, halts | Pass: Network diagnostics and/or THORNode quote | PASS |
| grok-4.7 | 16.66666666% | 27.77777777 | 138.88888888 | Pass: fixed-depth leg, not a quote, lists omitted live effects | Pass: THORNode quote + Network diagnostics | PASS |

The lab truncates; Luna and DeepSeek rounded the last digit, while Grok matched
the truncation exactly. The difference is one unit in the eighth decimal and
does not change the model-versus-quote distinction.

## Reader tasks (#187)

| Model | T1 newcomer | T2 practical user | T3 builder | Verdict |
| --- | --- | --- | --- | --- |
| gpt-6-luna | Pass: New to THORChain; Network diagnostics / interface checklist | Pass: Midgard `/pools?status=available` is liquidity context; THORNode quote, freshness, diagnostics separate | Pass: current controls via THORNode/Mimir; indexed metrics via Midgard; current halt is not a past cause | PASS |
| deepseek-v4-pro | Pass: Learn in Sequence -> New to THORChain; Live Operations Snapshot / Network diagnostics | Pass: pool rows are liquidity context; quote, freshness and diagnostics remain separate | Pass: dates `2026-11-12T03:08:21Z`; earnings history 2026-10-14 to 2026-11-12; halt is present-only | PASS |
| grok-4.7 | Pass: Learn in Sequence; Check live operations / Network diagnostics | Pass: 36 Midgard rows are not quote proof; THORNode pause overrides a healthy number | Pass: 29/30 usable intervals; `2026-11-12` incomplete; current-only halt != historical cause | PASS |

## Verdict

All three model families pass both packs, and no failure is shared by two
models. No copy or anchor fix is required. Under the owner's amended acceptance
recorded on #199 and #187 on 2026-11-12, this completes both trials.

## Limits

This is page-clarity evidence, not human comprehension, accessibility, learning
outcome or task time. The prompt forbids outside text, but prior knowledge cannot
be enforced. One run per model; no variance study. The free Gemma boundary
control did not run because of provider rate limiting.
