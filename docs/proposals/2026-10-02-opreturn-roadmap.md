# THORChain Wiki — OP_RETURN roadmap additions

Approved for roadmap inclusion by the owner on 2 October 2026. **Proposed future work; not implemented.** Continues PR-01–66 without duplicating transaction lookup (PR-33 / #198) or knowledge export (PR-62 / #161).

## Delivery order

Add the external archive pointer alongside reviewed examples; follow with a read-only memo decoder. Use those examples to inform the existing transaction evidence pilot. Machine-readable discovery stays in the later export lane. Existing correctness, accessibility and dependency work retains its priority.

| Item | Priority / scope | Roadmap issue |
|---|---|---|
| PR-67: Annotated real transaction examples | P2 / M | [#202](https://github.com/Reedtrullz/tcwiki/issues/202) |
| PR-68: Read-only memo decoder | P2 / M | [#203](https://github.com/Reedtrullz/tcwiki/issues/203) |
| PR-69: External Bitcoin memo archive pointer | P2 / S | [#204](https://github.com/Reedtrullz/tcwiki/issues/204) |
| PR-33: Transaction evidence lookup refinement | Existing P3 / L | [#198](https://github.com/Reedtrullz/tcwiki/issues/198) |
| PR-62: Machine-readable discovery refinement | Existing P3 / M–L | [#161](https://github.com/Reedtrullz/tcwiki/issues/161) |

## Evidence and reuse

Browser research on 2 October covered [OP_RETURN THORChain](https://opreturn.xyz/p/thorchain), [a swap record](https://opreturn.xyz/m/23afd5ba9acde7bb9a36d0fa79bdcc2e999c822011d01b8af8b35cc1b07169e7), address history, collections, learning guides and documented APIs. Current-main comparison used `af210071b3110621ca9a83757697f12d103baae2`; source freshness must be rechecked before implementation.

The wiki already has URL filters, Source Map Copy packet, network diagnostics and refund triage. Reuse them. OP_RETURN's Bitcoin-only coverage and generic token extraction are not an all-chain activity or asset-statistics contract. Direct API access returned 403 / browser blocking during research, so no successful API integration is established.

## PR-67 — Add annotated real transaction examples to existing guides

**Classification:** Learning / Evidence UX; P2; M. **Evidence:** Observed opportunity: OP_RETURN presents raw memos with transaction/block references; the wiki's swap/refund and build/query guides explain evidence requirements.

**Problem:** Readers can learn the protocol stages but cannot inspect a small, reviewed set of real transactions with each memo field and outcome explained.

**Proposed work:** Add a bounded example set for a swap, refund, outbound and vault migration to existing guides. Each example pairs original memo text with field explanations, source chain, transaction and block links, observation/review date, and the outcome evidence actually available. Link from the relevant learning paths and search entries. Real examples must be selected and verified during implementation; today's inspected swap is a research candidate, not a certified teaching fixture.

**Scope boundaries:** No indexer, continuous feed, wallet connection, transaction builder, address watchlist or copied third-party article. Missing lifecycle evidence remains unknown. Separate Bitcoin confirmation from THORChain processing and destination settlement.

**Acceptance target:** Every example has independently reviewable transaction evidence and current primary syntax references; raw and interpreted fields remain distinguishable; source units/case are preserved; examples explain what cannot be inferred. Generated search and content checks pass; the annotated view has an accessible text/table representation.

**Dependencies:** Primary-source review of selected examples. Coordinate with PR-28 / #193 (claim evidence), PR-60 / #159 (execution map), and PR-33 / #198 (transaction triage); examples do not require a live lookup service.

## PR-68 — Add a read-only educational memo decoder

**Classification:** Learning / Bounded Tool; P2; M. **Evidence:** Observed opportunity: OP_RETURN labels the inspected memo as operation '=' and token 'e', but does not explain its streaming or affiliate fields.

**Problem:** Colon-delimited memos are hard to understand, and treating the second field generically as a ticker confuses assets, addresses and migration heights.

**Proposed work:** Let a reader paste an existing memo and inspect its action and supported asset, destination, limit, streaming and affiliate fields beside the unchanged original. Start with the small set of memo families covered by PR-67. Derive grammar, aliases and version applicability from current official developer documentation and THORNode source. Reuse any maintained, compatible parser already present or installed after checking its behavior; otherwise implement only the supported grammar.

**Scope boundaries:** Decode locally without retaining or automatically transmitting input. No wallet/send flow, generated executable memo, remote arbitrary URL fetch, automatic alias guessing or claim that parsed intent executed successfully. Unknown, malformed and unsupported fields stay visible; asset aliases and historical applicability must not be silently resolved using today's state.

**Acceptance target:** Source-backed fixtures cover supported examples, action-specific field meanings, malformed/unknown input, aliases and streaming/affiliate variants. Preserve address/hash case and precision; bound input size and render input as text. Accessible input/output and clear interpretation limitations. Parser success proves interpretation only, not live feature availability or execution.

**Dependencies:** Current primary grammar/version review and PR-08 / #173 (numeric limits) for interpreted numeric display; coordinate PR-67 for examples and PR-21 / #186 for accessibility. No dependency on an OP_RETURN API.

## PR-69 — Add OP_RETURN as an external Bitcoin memo archive source

**Classification:** Source Discovery / Content; P2; S. **Evidence:** Browser-observed THORChain feed and record provenance at https://opreturn.xyz/p/thorchain.

**Problem:** The existing source guide points to explorers but does not identify this useful Bitcoin OP_RETURN archive for inspecting recorded THORChain-like memos.

**Proposed work:** Add one curated, dated external source entry and reuse it in Source Map plus swap/refund and build/query guides. Describe what readers can inspect: payload bytes, transaction/block references and Bitcoin-side history.

**Scope boundaries:** Third-party archive, Bitcoin-only and incomplete by design relative to all THORChain activity. Do not endorse its classification, ticker counts, complete historical coverage, address attribution, or successful cross-chain execution. No iframe, ingestion, polling or API dependency.

**Acceptance target:** The source entry carries URL, review date, confidence and coverage caveat; relevant guides link to the same entry without duplicate data. Content/search checks pass and wording distinguishes recorded bytes from THORChain validation/settlement.

**Dependencies:** Source/link review at implementation time; coordinate PR-67. Fits the existing source registry and curated data conventions.

## Existing proposal refinements

### PR-33 / #198 — Transaction evidence lookup

Use annotated memo/transaction examples to shape the existing one-hash lifecycle view. Preserve raw memo, parsed interpretation, chain-specific transaction links, provider, observation time and block/height evidence. Distinguish source-chain confirmation, THORChain processing and destination settlement. Bitcoin OP_RETURN alone cannot establish the latter two; missing, delayed or conflicting evidence remains explicit. Verify provider contracts before choosing an integration. PR-67/68 are coordination opportunities, not new hard prerequisites.

### PR-62 / #161 — Machine-readable discovery

Add a short registry-generated `llms.txt` pointing to reviewed wiki pages and the bounded JSON export. Consider Markdown for owned articles only after PR-61 / #160 resolves licensing/attribution. Preserve sources, confidence, review dates, content identity and unknown review states. Start with static output; no new API platform, MCP server or A2A layer without a concrete consumer. OP_RETURN documents these interfaces, but its API was not integration-verified in this research.

## Publication verification

Published three new proposal issues and refined two existing issues on 2 October 2026. Exact titles, bodies and OPEN states were read back for all five. The [publication receipt](2026-10-02-opreturn-issue-publication.json) records bodies, hashes and preservation evidence. Original 1 October receipts remain historical and unchanged. No application implementation or deployment occurred.
