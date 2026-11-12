# CLP learning lab trial pack - 2026-11-12

Ready-to-run human trial for #199. No participant has been recruited.

## Goal

Show that readers understand the shipped lab's model/quote/execution boundary
and can find the live route check. Synthetic algebra tests do not establish
comprehension.

## Setup

- Page: `/deep-dives/clp`, lab outputs "Model slip ratio", "Model liquidity fee"
  and "Model output after liquidity fee".
- Record the exact build SHA before each session and whether live data or
  fixtures were used.
- Run 2-3 participants. Use pseudonymous labels only (P1, P2, P3); no names,
  wallets, private queries or recordings without separate permission.
- Phone 390x844 and desktop 1280x844 if practical; the lab is one page, so one
  width per participant is acceptable when time is short.

## Facilitator rules

- Read the task wording exactly. Do not explain the lab or the intended answer.
- Stop at 120 seconds and record the first wrong interpretation.
- Ask the two questions after the task, without prompting toward the wording on
  the page.

## Tasks

1. Open the CLP page and use the lab. Change "Input amount (x)" from 100 to 200
   with both depths at 1000, calculate, and report the three displayed results.
   Success: the participant completes the interaction and reads the three values.
2. In one sentence: what does this lab not tell you about a real swap?
   Pass: names at least one real limitation, such as "not a quote", live fees or
   floors, streaming/queue ordering, route or halt availability, or actual
   execution and settlement.
3. Where would you check whether a real route can execute right now?
   Pass: names `/network#check-a-route` or another live route/quote surface.

## Scoring

| Participant | Width | T1 done | Q2 limitation | Q3 live check | Notes |
| --- | --- | --- | --- | --- | --- |
| P1 | | | | | |
| P2 | | | | | |
| P3 | | | | | |

Overall pass: every participant completes T1 and Q3, and every Q2 names at least
one real limitation. If any participant misses Q2 or Q3, keep #199 open, file one
scoped copy or link fix from the observed confusion, and re-test the affected
criterion.

## Non-claims

The pack is the instrument, not the result. No comprehension, learning or
accessibility outcome is claimed until participants run it.
