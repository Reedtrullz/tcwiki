# Reader task trial pack - 2026-11-12

Ready-to-run before/after trial for #187. This restates the task list from
`2026-10-03-pr22-reader-trial-pack.md` at current main; the original baseline
measurements remain historical.

## Goal

Measure whether readers find a result and its caveat with fewer detours, without
losing source-warning interpretation.

## Setup

- Routes: `/` and `/stats`.
- Viewports: 390x844 and 1280x844.
- Three roles: newcomer, practical user, builder. Pseudonymous labels only.
- Record the exact build SHA and whether live data or fixtures were used.
- Counterbalance baseline and candidate order where practical.
- Stop a task at 180 seconds; preserve the failure and the first wrong choice.
- Do not perform a real transaction.

## Current anchors

- Home: `#home-source-router`, `#home-live-status-heading` (Live Operations
  Snapshot).
- Stats: `#stats-look-here-first`, `#stats-operational-check`,
  `#stats-which-numbers-matter`, `#stats-live-metrics`.

## Tasks (identical wording before and after)

1. Newcomer, start `/`: find where to learn THORChain in sequence; identify
   where a present-tense availability question must be checked. Success requires
   a useful learning destination and distinguishing curated mechanism context
   from current operations.
2. Practical user, start `/stats`: decide whether a displayed available-pool row
   or healthy-looking metric means a chosen swap route will execute. Success
   requires finding the value and its source/caveat and stating that
   availability, quote and settlement need separate checks.
3. Builder, start `/`: choose the correct evidence path for current controls
   versus indexed historical metrics; from `/stats`, find a source/date and
   explain why a current halt does not prove a historical cause. Success requires
   the source family, the observation/review distinction and the current-only
   limitation.

## Measures

For each role and width: elapsed human seconds, success/partial/fail, detours or
incorrect first choice, caveat identified, confidence in interpretation and a
short de-identified note.

| Role | Width | Baseline s/result | Candidate s/result | Caveat preserved | Detours |
| --- | --- | --- | --- | --- | --- |
| Newcomer | 390 / 1280 | pending | pending | pending | pending |
| Practical user | 390 / 1280 | pending | pending | pending | pending |
| Builder | 390 / 1280 | pending | pending | pending | pending |

## Candidate gate

Run the baseline first. Only if it shows the detour hypothesis, implement one
candidate: a compact operational result immediately after the introduction plus
one expandable evidence explanation on Home and Stats. Keep active blockers,
freshness, confidence and sources visible.

Repeat the identical tasks and widths. Accept only when success or time improves
and source-warning interpretation does not regress; otherwise keep the baseline,
record the negative result and close #187 with that evidence.

## Non-claims

No participants have run this pack. Automated tests, screenshots and synthetic
fixtures cannot establish comprehension or task time.
