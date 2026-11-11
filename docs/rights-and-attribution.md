# Rights and attribution inventory — owner decision pending

Reviewed 3 October 2026 on the unmerged workplan candidate. This inventory records visible provenance and unresolved redistribution scope; it is not a legal determination or a license grant.

## Current evidence

README previously said “MIT”, but the repository has no LICENSE file. The owner's explicit code/content license decision is pending. The implementation plan's approval does not approve a license. Do not describe the inventory or a passing check as that decision.

| Material | Visible provenance | Proposed review/redistribution boundary |
|---|---|---|
| Application code, scripts and configuration | Repository-authored work and dependency/package metadata; 126 TS/TSX source files at this candidate | Owner must select code license and confirm contributor provenance. Dependency licenses remain separate. File count establishes neither ownership nor rights. |
| Seventeen MDX explainers and curated React prose/data | Repository-authored explanations with source links/review metadata in `src/lib/content/registry.ts`, `src/lib/sources.ts` and `src/lib/data/static.ts` | Owner must select content scope/license and review external quotations before full-text export. Source citations alone do not establish redistribution permission. |
| `governance-comprehensive.mdx` | States that it was compiled from developer Discord through inebotten; includes attributed participant quotations | Keep private/community-source text outside any new full-text export until provenance, permission and intended publication scope are reviewed. Do not copy private logs or assume access grants reuse rights. Existing source is preserved pending editorial work. |
| Official docs, blog, GitLab and external resources | SourceMeta links and source-qualified summaries | Export pointers/metadata only at this stage. Do not include full external articles. Retain labels, source URLs, dates and coverage caveats. |
| Public Midgard/THORNode values | Dynamic API observations with provider/check-time/limitation metadata | A fetched sample does not certify financial truth, execution or rights to bulk redistribution. Do not silently freeze operational values in a full-text/offline export. |
| npm-registry dependencies and build tools | `pnpm-lock.yaml` package metadata and their own package licenses | Follow individual dependency notices; an owner license does not relicense dependencies. No third-party asset permission is inferred. |
| Original diagrams/teaching examples prepared during the workplan | Repository-author attribution plus cited primary protocol sources and dated transaction references | Original diagram code can follow an adopted owner policy; external images, private inputs and copied provider prose need their own review. |

This is a category inventory with a targeted external-quote exception, not a verified per-author chain of title. No private Discord fetch or bulk external copying was performed.

## Recorded owner decision

Recorded 11 November 2026 by the owner (Reidar):

- Code license and scope: MIT for repository-authored code under `src/`, `scripts/` and configuration. See `LICENSE`.
- Owned explanation/content license and scope: CC BY 4.0 for repository-authored prose, MDX explainers and curated records. See `LICENSE-CONTENT`.
- Contributor expectations/attribution: inbound = outbound under the same split; see `CONTRIBUTING.md`. Existing authors and sources stay attributed.
- External/private/community exclusions: Discord quotations and participant statements (including the governance archive), external article text, live provider values, dependencies and THORChain marks stay excluded. See `NOTICE`.
- Date, owner and approval evidence: 11 November 2026, owner Reidar, recorded in the license change merged through #160.

The earlier pending state is superseded by this record. Do not infer approval from elapsed time or main-merge approval alone; this record is the approval.

## Present export and contribution posture

New interoperable exports may include route IDs, titles, descriptions, canonical/source links, review dates and limitations. Full article Markdown/PDF redistribution, private extracts and bulk external content are gated on the owner's choice and provenance review. Browser print for a reader's current article view must retain its citations and historical/current boundary; it does not create a new redistribution license.

Contributors should cite exact primary sources/revisions, retain attribution, identify quotations and avoid sending private logs or secrets. This inventory and the contribution templates are preparation for the owner decision, not an assignment of contributors' rights.
