# ILP removal claim review — 2 October 2026

Scope: the current/historical ILP claim in `clp.mdx` and `liquidity-actions.mdx`, not a re-review of every article claim. Article-wide review dates stay unchanged; the reviewed paragraph records its own observation date.

Official CLP documentation, retrieved 2026-10-02:
https://docs.thorchain.org/technical-documentation/thorchain-finance/continuous-liquidity-pools#impermanent-loss-protection
The removal notice explicitly applies to all liquidity providers. Its older coverage formulas below that notice are historical context.

Official ADR-005 amendment, retrieved 2026-10-02:
https://dev.thorchain.org/architecture/adr-005-deprecate-ilp.html#amendment-1-nov-23-permanently-sunset-ilp
The changelog dates Amendment 1 to 2023-11-07 and describes permanent sunset with FULLIMPLOSSPROTECTIONBLOCKS=0. The earlier grandfathering proposal does not override the later amendment. No live Mimir/state readback or implementation-height claim is inferred from these documents.

Correction: impermanent loss, not impermanent loss protection, can outweigh swap-fee income. ILP is historical and does not promise current coverage. The existing LP action/live-control caveats remain. Search is regenerated from the corrected owned paragraphs.
