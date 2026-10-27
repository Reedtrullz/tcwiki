# Provider request disclosure (proposal PR-50, issue #149)

Opening main is `686b63b`; the local slice builds on unmerged PR246 (`abc06c7`). The existing THORNode quote path sends exactly `from_asset`, `to_asset` and `amount` in 1e8 base units. There is no destination/wallet address or affiliate parameter. Quotes remain manual; operation reads and Midgard summaries remain automatic public reads.

Visible copy beside Check route states what the action sends before submission. Native disclosures list configured destinations and parameters, linking to the source-map/failover guidance. The THORNode provider list comes from the existing shared runtime defaults; Midgard's existing endpoint constant is exported and reused without changing its order or request behavior. Adaptive last-success selection means either configured THORNode provider can be used first, so copy does not promise a fixed primary.

The copy distinguishes local filtering, shareable URL data, ordinary provider request metadata and the actual `strict-origin-when-cross-origin` referrer policy. Copying pair/amount URLs shares those values; opening a copied wiki URL transmits its query to the wiki host. Existing source-map packets contain displayed source links/claim guidance, and raw quote details contain the provider response. No full transaction-history or future diagnostic-export claim is made.

Verification:42focused diagnostics/banner unit tests, typecheck and lint pass (zero errors, one existing warning). Both builds and standalone smoke pass; all30 network/docs/glossary journeys pass on Cloudflare and the initial Next run. After a wording refinement to reflect adaptive provider order, both final Next disclosure cases pass before publication. The request test inspects the actual URL, checks its exact three parameter names and1500000base-unit amount for0.015, and verifies zero quote requests before submission.

This is a reversible transparency change. It adds no tracking, consent system, request storage, proxy or legal conclusion. Main and production remain untouched. Per-command unsigned candidate commits preserve global signing configuration.
