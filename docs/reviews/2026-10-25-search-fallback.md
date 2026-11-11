# Search fallback helper: early draft evidence

Related: #298 and #280. This focused draft avoids constructing an unused fallback
after a successful raw search or a plain-text miss. It preserves result identity,
query order and the existing fallback retry when an earlier fallback throws.
It does not change input admission, ranking or the search API.

Baseline: `c51f6cc9d9db9a0dd620fb5c2ecc0ad9fcbbdf64`.
Candidate helper SHA256:
`15d6e3ebecc3a3eb847bcb53819d6dc2f819a24f1865b76f9b133fae67967c86`.

Producer measurements were independently reproduced in a separate code review:

| Observation | Baseline | Candidate |
| --- | ---: | ---: |
| Fallback compilations, six fixed success/plain-miss calls | 6 | 0 |
| Tokenizations in those calls | 6 | 0 |
| Accepted-term expansion callbacks in those calls | 10 | 0 |
| Index attempts over 44 scenarios | 70 | 70 |
| Helper source bytes | 1414 | 1471 (+57) |
| Helper gzip9 bytes | 563 | 588 (+25) |
| Native-stripped helper gzip9 bytes | 525 | 542 (+17) |

The scripted-index matrix has 22 authored cases repeated twice (44 scenarios),
plus 156 term parity cases. Exact results, identity and attempt/error traces match.
Independent review also exercised 40 separately authored rows, term parity for
24 corpus queries, and negative controls for misleading success, broken
instrumentation, forced-zero counters and stale source bindings.

Reproduce the pure helper measurements with Node 22.22.3, from the repository root:

```sh
mkdir -p .artifacts/search-fallback
git show c51f6cc9d9db9a0dd620fb5c2ecc0ad9fcbbdf64:src/lib/search/lunr-query.ts > .artifacts/search-fallback/before.ts
node --experimental-strip-types scripts/reproduce-lunr-fallback.mjs baseline .artifacts/search-fallback/before.ts
node --experimental-strip-types scripts/reproduce-lunr-fallback.mjs candidate src/lib/search/lunr-query.ts .artifacts/search-fallback/before.ts
```

Baseline intentionally exits 1 at the final zero-unnecessary-work assertion;
candidate exits 0. Both print the observations used to compare semantics and work.
No installed application dependency graph is needed for this helper experiment.

These are deterministic helper observations against scripted indexes, not real
Lunr, browser CPU, timing, latency, INP or production performance measurements.
Full candidate CI (including lint, typecheck, Vitest, browser and emitted builds)
and real-Lunr/corpus ranking behavior remain pending. Actual emitted initial
route JavaScript bytes are unknown. Isolated helper gzip increased; no initial
payload improvement or nonincreasing route-byte result is established. If actual
initial route bytes increase, the original no-tradeoff acceptance fails.

Independent review approved only this early draft, not full #298 acceptance,
merge readiness, Task16 completion, a security audit or full web acceptance.
Neither #298 nor #280 is resolved by publication. No merge or deployment is part
of this evidence.
