# Model trial protocol - 2026-11-12

Purpose: run the CLP and reader packs against AI models to test whether the
frozen page text is sufficient for a careful reader to complete the task and
state the caveat. This is clarity evidence, not human comprehension.

## Owner direction and closing rule

On 2026-11-12 the owner asked to use AI models instead of recruiting readers.
The current #199 and #187 acceptance text still requires human trials, so a
model run is preparation until the acceptance is amended.

Proposed amendment to record on both issues before closing on model evidence:

> Replace the human-participant requirement with a model-based comprehension
> trial: at least three different model families, frozen page text, no tools or
> web access, the same task wording and rubrics, and verbatim answers recorded.
> Do not describe the result as human understanding, accessibility or task time.

Without that amendment, the issues stay open after the pilot.

## What this can and cannot establish

Can: whether the page text contains the answer, the caveat and the live-check
path; ambiguous copy or missing anchors show up as model failures or guesses.

Cannot: human comprehension, learning, accessibility, task time, or real-user
behavior. Models may rely on prior knowledge; a correct answer is not proof the
page taught it.

## Frozen inputs

- Record the exact `origin/main` commit and the rendered text snapshot for each
  route before the run.
- No web access, no tool calls, no code execution, no page interaction beyond the
  supplied text.
- One fresh context per model per task. No hints, examples or follow-up coaching.

## Models

Use at least three different families or versions. Record provider, model id,
date, temperature (default) and whether tools or web were enabled. One run per
model for the primary result; an optional second run measures variance.

## CLP task (#199)

Supply the text of `/deep-dives/clp`, including the formula and the lab copy.

Prompt:

```
You are given the text of a wiki page. Use only this text.

1. The lab's default input is 100, input-side depth 1000, output-side depth 1000.
   If the input becomes 200 with the same depths, what do the three displayed
   results show? Give slip, liquidity fee and output.
2. In one sentence: what does this lab not tell you about a real swap?
3. Where on the site would you check whether a real route can execute right now?
```

Scoring key (the lab truncates to eight decimals):

- slip `16.66666666%`
- liquidity fee `27.77777777`
- output `138.88888888`

Pass: all three values within the displayed precision; Q2 names at least one
real limitation (not a quote, live fees/floors, streaming/queue, route or halt
availability, actual execution); Q3 names `/network#check-a-route` or another
live route/quote surface.

## Reader tasks (#187)

Supply the rendered text of `/` and `/stats`, including section headings and
links, but no live API responses beyond what the page shows.

Prompt:

```
You are given the text of two wiki pages. Use only this text.

1. As a newcomer: where would you start to learn THORChain in sequence, and where
   would you check whether something is available right now? Name the sections
   or links.
2. As a practical user on /stats: does an available-pool row or healthy-looking
   metric mean a chosen swap route will execute? Name the value's source or
   caveat and state which checks remain separate.
3. As a builder: which evidence path covers current controls versus indexed
   historical metrics? From /stats, name a source/date and explain why a current
   halt does not prove a historical cause.
```

Pass per task: names a real destination or section, the source family, the
observation/review distinction and the current-only limitation. A generic answer
that would fit any wiki fails.

## Recording

Create `docs/reviews/2026-11-12-model-trial-results.md` with one row per model:
provider/model, date, tools off, task 1-3 (or T1/Q2/Q3), verbatim answer excerpt,
pass/fail per criterion and notes. Do not average across models; report each.

Mark a run "prior knowledge, not page evidence" when the answer uses details that
are absent from the supplied text.

## Stop rules

- If a model asks for missing context, record the question and do not assist.
- If two models fail the same criterion, treat it as a copy or anchor defect and
  fix the page before adding more models.
- Do not publish model names as user acceptance, and do not label the result as a
  human trial.

## Non-claims

No model result is a human comprehension, accessibility, learning-outcome or
task-time measurement. The protocol is the instrument; the owner amendment is
required before model evidence can close either issue.
