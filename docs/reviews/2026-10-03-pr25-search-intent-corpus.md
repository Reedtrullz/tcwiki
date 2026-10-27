# Search intent evaluation (proposal PR-25, issue #190)

## Candidate and scope

Built on the unmerged PR244 candidate (`e4fa516`), including PR24 section-level search destinations and stable anchors. Main remains at the opening `686b63b` baseline. Existing Lunr query escaping and evidence-oriented ranking are exercised directly; this change adds no ranking rules or query collection.

The 24 synthetic offline cases record intent, acceptable destinations, confusing alternatives, typos, exact asset/control/quote identifiers, and negative controls. Fourteen development cases and ten separate held-out cases use the same production index and ranker. Expected destinations were selected before evaluating the results. Held-out queries have not been used to tune ranking in this slice.

## Recorded baseline

| Split | Cases | Intended first result | Intended result in first five |
|---|---:|---:|---:|
| Development | 14 | 14 (100%) | 14 (100%) |
| Held-out | 10 | 8 (80%) | 8 (80%) |

The denominator includes three negative controls whose success means no results. The report commits every top-five ID, so the metric can be audited without hiding irrelevant leading results. `Midgardd API` and `thorchan protcol` are known held-out misses. Current-operation questions and exact identifiers all reach the intended evidence destination first. This small authored corpus establishes a regression baseline, not measured reader satisfaction or comprehensive search quality.

Normal tests reject any loss of a previously successful top-one or top-five case. Current-operation and exact-identifier cases additionally reject a confusing first destination. Destination IDs must exist in the current index. A future ranking consolidation must compare the same committed baseline and show held-out improvement while keeping exact identifiers and current-operation cases intact. Current results do not justify merging unrelated ranking rules.

## Verification

`npm run test:unit -- tests/unit/search-intent-corpus.test.ts tests/unit/search-ranking.test.ts tests/unit/search-query.test.ts tests/unit/search-presentation.test.ts --maxWorkers=1`: 31 tests across four files pass. Typecheck passes; lint has zero errors and the existing Cloudflare default-export warning. The initial run exposed a missing baseline fixture and an inferred empty-array TypeScript type; both were corrected and the normal baseline-reading path was rerun successfully.

Test-only data/evaluation changes do not require a new app build or browser journey. GitHub CI still runs the repository gates on the exact pushed candidate. No production traffic, reader-query tracking, embedding service, main merge or deployment. Candidate commits use per-command unsigned Git because the configured interactive signer is unavailable; global signing settings remain unchanged.
