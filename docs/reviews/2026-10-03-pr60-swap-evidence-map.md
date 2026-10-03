# PR-60: source-qualified swap execution map

An ordered, semantic diagram in the builder guide distinguishes source-chain inclusion, THORChain observation, protocol processing, outbound/refund handling and independent destination-chain inclusion. One curated static record supplies its text, links and separate 3 October review cohort. Internal asset transfers can omit an external outbound; a zero or missing transaction hash is not invented. Provider processing status does not establish destination settlement or ownership. Current halts cannot retrospectively explain a historical transaction.

The official transaction-query tutorial was read on 3 October; its stage fields support the provider-stage explanation. The existing swap/refund and halt references retain their authored retrieval dates, and the article/registry review dates remain unchanged. CSS boxes and an ordered list provide the same reading order, with decorative arrows hidden from assistive technology. No animation library or live query is introduced.

Verification: focused map/heading tests, all 710 unit tests in 62 files, TypeScript, lint, content checks, both runtime builds and Next standalone smoke passed. Nine desktop guide/rendered-link checks passed in each actual built Next and WikiDO runtime. Final map checks passed on desktop and mobile in both runtimes, including contained width, WCAG rule audit, keyboard activation and ordered stage boundaries. These are automated checks, not human screen-reader certification.

Candidate base is PR258, with PR249 node/source coverage inherited. No main merge or deployment. Commits are unsigned because the interactive signing agent is unavailable in this session.
