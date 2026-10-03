# PR-48: compare up to three loaded pools

The stats dashboard now compares up to three selected assets from the same loaded Midgard pool snapshot. Selection uses the existing URL restoration contract, preserving unrelated filters. Missing pools, duplicate rows and missing metrics remain unavailable; valid zero stays zero. Comparison adds no pool-detail or extra list requests.

The table states its loaded universe, requested rate window, snapshot depth/liquidity basis and separate provider annualPercentageRate, poolAPY and volume24h fields. It reuses the source age and quality disclosure. Provider volume24h is distinct from the completed UTC-day leaderboard. No compounding conversion, future yield, route availability or settlement is inferred.

Validation: three meaningful RED-to-GREEN boundary tests; 29 focused tests and all 716 unit tests across 64 files passed. Typecheck, scoped lint, content checks, both builds and standalone smoke passed. The final built Next and actual WikiDO runs each passed 27 desktop/mobile stats and URL restoration checks with one desktop-only presentation skip. Keyboard selection, reload/back/forward, missing values, no added provider requests, 320px containment and automated WCAG checks passed. The first browser run exposed an implicit select label containing option text; an explicit associated label fixed the product before both final builds and runs.

Base PR264. No main merge or deployment. Commits are unsigned because the configured interactive signer is unavailable.
