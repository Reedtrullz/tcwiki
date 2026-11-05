# Portfolio content review 2026-11-05

This is a source review of the overdue wiki records on `codex/tcwiki-content-graph-20261105`. It does not refresh chain observations.

## Documents re-read

The CLP documentation page retrieved on 2026-11-05 says impermanent loss protection has been removed for all liquidity providers. ADR-005 Amendment 1 is titled "Permanently Sunset ILP" and gives blockheight 13,333,333. Those two pages support the existing ILP history wording. The record's source date stays 2026-10-02 because the updates feed treats that as the original observation. Freshness checkedAt is 2026-11-05 and the next review is 2026-12-06.

The preserved GitLab release HTML capture does not contain the memoless release-note sentences. Native custom tool output in the 2026-10-02 archive contains both listed memoless ERC20 sentences. The previously cited API-body SHA-256 was not recovered as bytes, so it is not reused. The memoless wiki record keeps its 2026-10-03 source date. Its freshness check moved to 2026-11-05. No present-availability claim was added.

`https://opreturn.xyz/p/thorchain` still presents a third-party Bitcoin OP_RETURN archive and links Bitcoin explorers. The source-map caveat is unchanged. `checkedAt` stays 2026-10-03 because the existing unit test pins that observation. `nextReviewDue` is 2026-12-06. The updates entry and the two derived search documents follow the same dates. Generated search files were not rewritten because those dates are read from the source records.

Pinned THORNode `memo.go` at `b08d81f79275093b0fcb753e0d68ff1c16c51cb8` maps `=` and `s` to swap and `out` to outbound. That supports the memo interpretation already in the transaction records. It is not a receipt for any transaction.

## Transaction bodies

Five October response bodies were recovered from the archived session and match their recorded SHA-256 values. The Bitcoin outbound transaction was fetched again on 2026-11-05 and returned the same original bytes. The Blockscout migration transaction returned a new body. Its decoded method, MIGRATE memo, amount, addresses, timestamp, status, and block number still match the record. That new body has no block field, so the record no longer says the field is null. October source dates stay historical. nextReviewDue remains 2026-11-03, so hosted check:content is still expected to fail those four records.

## Minimatch

GHSA-g3hv-75wg-m249 covers minimatch `>=7 <11.0.1`. The only locked caller on that range is `@typescript-eslint/typescript-estree@8.62.1`, which calls `require("minimatch").minimatch(path, pattern, {dot:true})`. minimatch 11.0.4 still exports that function and the `dot` option. The six eslint callers request minimatch 3.x and call it as the v3 function, which 11.0.4 is not. The workspace declaration is only the estree-scoped minimatch 11.0.4 pin. Installed pnpm 10.34.5 regenerated the lock with install --lockfile-only --ignore-scripts and no offline flag. The generated lock pins estree to minimatch 11.0.4 and the six eslint callers to 3.1.5. No packages were installed. The hosted audit test calls the estree named export with dot true and false, and calls the eslint copy as the legacy function. That test was not run here. Audit and caller compatibility remain pending hosted QA.

