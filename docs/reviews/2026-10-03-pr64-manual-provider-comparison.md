# PR-64: compare two independent control observations

Network diagnostics now offer an explicit comparison of six named raw Mimir controls from the two existing fixed THORNode providers. Each click makes one bounded read per provider through the shared transport. The optional requested height is validated before any request; no URL or credentials are accepted. Comparison does not fail over, alter the active-provider choice or hedge ordinary polls.

Each observation retains provider URL, request interval, checked time, requested/observed response height, pin verification, scalar raw value and exact signed-int64 normalization. Valid zero stays zero. Missing, malformed and ambiguous alias values remain distinct. A mismatch cannot participate in a comparison. Differing samples only receive a same-height conflict label when both requested heights are verified and equal; other differences can reflect time/height skew. Neither equality nor conflict proves consensus or availability. Block age and THORNode version are explicitly uncollected by this narrow raw-control pilot.

The local receipt-age display marks retained samples after30s and on tab resume, withdrawing comparison eligibility without fetching again. Raw observations remain visible. No provider score, majority rule, history database or automatic comparison was added.

Validation: missing-module RED then four source-contract boundary cases;116focused and all703units/65files, types, scoped lint, content, both builds and standalone smoke passed. Each actual built Next and WikiDO run passed34desktop/mobile network/source-map checks. The explicit comparison journey proves no comparison before action, exactly two fixed requests, exposed matching-height headers, a verified field conflict, keyboard action,320pxcontainment and local stale withdrawal without extra comparisons. The initial test selected height100, already used by the ordinary status fixture; a distinct777 comparison height correctly isolates manual reads. Both final complete runs pass.

Base PR270. No main merge or deployment. Commits are unsigned because the interactive signer is unavailable.
