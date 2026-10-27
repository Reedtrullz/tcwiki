# PR-31 curated wiki updates

Baseline: worktree `/Users/reidar/.codex/worktrees/wiki-header-ci/thorchain-wiki`, branch `codex/wiki-curated-update-feed`, HEAD `88efbf0079afa51c565fd319e9f6e57d56ae8e80`. The existing untracked red test was preserved at `.superpowers/sdd/2026-10-02-entire-workplan/pr31-red.log`; it failed before execution because `@/lib/wiki-updates` did not exist.

The update list is authored static content, not a commit stream or provider poll. Stable IDs and the same two records drive `/updates` and `/updates/feed.xml`. Each record has distinct source observation and wiki review dates; the sitemap adds `lastModified` only for `/updates` using its latest authored review date.

The 2 October ILP record follows [the focused ILP source review](2026-10-02-ilp-removal.md): official CLP documentation and amended ADR state that protection was removed. The article-wide review date remains separate. This does not claim current protection or LP returns.

The 3 October memoless record follows [the claim evidence pilot review](2026-10-03-pr28-claim-evidence-pilot.md): the THORNode v3.20.0 release supports only the listed handler, refund-simulation and inbound-observation work. It does not establish the August halt/re-enable/spam chronology or present availability. The feed labels this as a wiki evidence update, not a new incident.

Implementation uses `PageContainer`, the registry-backed `PageSourcePosture`, and the existing content registry for a footer-only `/updates` link. No new dependency or live source request was added. The implementation environment did not serve the production site, so production behavior is unverified; the parent will run final browser checks and handle publication.

Checks: focused Vitest for `wiki-updates.test.ts` and `site-discovery.test.ts` passed (8 tests); TypeScript typecheck passed; scoped ESLint passed; `npm run check:content` passed, including current generated MDX search and curated-data validation. The supplied initial red log remains unchanged (SHA-256 `8a7aea0658170769199541602ccf3f13516ef7a35b149a2b2b74ebc4648eeb23`). `tests/updates.spec.ts` and the updated route metadata browser assertion were added but not run here. No search regeneration was needed because no MDX or indexed content changed. Production and browser behavior were not verified in this worktree.

## Parent verification

The final shared `WikiChangeRecord` type lives in types.ts; source references have one authority on the enclosing SourcedRecord. The new collection participates in generic curated source/freshness/unique-ID checks. Its RSS dates come from authored review records, not the current clock. An absolute canonical RSS metadata URL removes Next/vinext relative-URL differences. The rendered-link check validates the one explicitly registered RSS data route and its content type separately from sitemap pages.

Final 695 units/63 files, TypeScript, scoped lint/content, both final builds and Next standalone smoke passed. Sixteen desktop/mobile checks passed in each built runtime, including full route-specific metadata, RSS/update boundaries, rendered links and accessibility/320px/announcement/FormData regressions. Earlier failures remain in bounded local logs: RSS metadata relativity, feed order assumptions, and server-seed/implicit-grid issues, corrected before this proof. Source/article review dates are preserved; no protocol news feed or deployment. Commits are unsigned because the interactive signer is unavailable.
