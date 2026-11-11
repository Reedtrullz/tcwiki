# Rights and licensing decision basis - 2026-11-11

Purpose: give the owner one reviewable choice for #160. This is a provenance and
policy summary, not a legal determination. It selects no license.

Current main: `d662b11c50ab8508c90c62b087e5c5304985218a`.
Prior inventory: `docs/rights-and-attribution.md` (3 October 2026).

## Current state

- No `LICENSE` and no `NOTICE` file in the repository.
- `README.md` records "Owner licensing decision pending" and links the inventory.
- 17 MDX deep dives, 157 TypeScript/TSX source files and 3 public files.
- `pnpm-lock.yaml` dependencies keep their own licenses; an owner license cannot
  relicense them.
- `public/llms.txt` already limits the machine export to registry metadata:
  "Article text is not redistributed here."

## What the owner controls

Owned and licensable: application code, scripts, configuration, the MDX
explainers and the curated records in `src/lib/data/static.ts`.

Not owned, or not established: quotations and participant statements in the
governance archive, external documentation and blog text, live Midgard/THORNode
values, dependency code and the THORChain name or marks.

The repository has no per-author chain of title. Contributions to date are
assumed to land under whatever license the owner records, on an inbound =
outbound basis; that assumption should be stated in `CONTRIBUTING.md`.

## Options

| | A. MIT code + CC BY 4.0 content | B. MIT for all owned material | C. All rights reserved |
| --- | --- | --- | --- |
| Code license | MIT | MIT | None; default copyright |
| Owned prose license | CC BY 4.0 | MIT | None |
| Reuse by others | Allowed with attribution | Allowed with copyright notice | No reuse grant |
| Commercial reuse | Allowed with attribution | Allowed | Not granted |
| Derivatives | Allowed with attribution | Allowed | Not granted |
| Contributor model | Inbound = outbound, split by material | Inbound = outbound MIT | Explicit permission needed |
| Export posture | Metadata now; full text may be opened later under CC BY | Metadata now; full text may be opened under MIT | Metadata only |
| Main risk | Attribution duty on prose; quoted material must stay excluded | MIT is unusual for prose and gives weaker attribution | Blocks reuse and complicates contributions |
| Effort | S-M | S | S |

### Option A - MIT code, CC BY 4.0 owned content

Best fit for a public educational wiki. Code stays easy to reuse; prose requires
attribution and keeps the source links visible.

Changes: add `LICENSE` (MIT), add `LICENSE-CONTENT` (CC BY 4.0 legal text),
add `NOTICE` with scope and exclusions, update the README license section and
add a licensing section to `CONTRIBUTING.md`. Keep `public/llms.txt` metadata-only
unless a separate full-text export decision is made.

### Option B - MIT for everything owned

Simplest single-license story: one `LICENSE`, one inbound rule, no split between
code and prose.

Changes: add `LICENSE` (MIT) and `NOTICE`, update README and CONTRIBUTING, keep
the metadata-only export.

Tradeoff: MIT requires only the copyright notice, so prose attribution is weaker
than CC BY. Some readers may still assume text is not reusable.

### Option C - All rights reserved, metadata-only

Maximum control. The repository stays public to read and fork under GitHub's
terms, but no broader reuse is granted.

Changes: add a `LICENSE` stating all rights reserved, add `NOTICE` with scope and
exclusions, update README and CONTRIBUTING to require explicit permission for
contributions, keep the metadata-only export.

Tradeoff: contributors and downstream aggregators have no clear reuse path; the
wiki stays source-available rather than open.

## Exclusions that apply to every option

- Governance Discord quotations and participant statements, until provenance and
  permission are reviewed.
- External articles, docs and blog text: links and short quotations only.
- Live Midgard/THORNode values: no frozen bulk redistribution.
- Dependencies: their own licenses and notices.
- THORChain name and marks: no trademark grant.

## Recommendation

Option A. It matches the wiki's public-education purpose, keeps code permissive,
requires attribution for prose and makes the quoted/community boundary explicit.
Choose B if a single license matters more than prose attribution. Choose C if
control matters more than reuse.

## Owner decision

- [x] Option A: MIT code + CC BY 4.0 owned content
- [ ] Option B: MIT for all owned material
- [ ] Option C: All rights reserved, metadata-only
- [x] Confirm owned scope: code, MDX explainers, curated records
- [x] Confirm exclusions above
- [x] Confirm inbound = outbound contribution terms

Owner: Reidar
Date: 2026-11-11
Evidence link: the license change merged through #160 (LICENSE, LICENSE-CONTENT, NOTICE, README, CONTRIBUTING).

## After the decision

1. Add the chosen license and notice files.
2. Reconcile README, CONTRIBUTING and `public/llms.txt` with the choice.
3. Replace the pending section in `docs/rights-and-attribution.md`.
4. Run `pnpm run check:content` and the build.
5. Link this record from #160 and close it.

## Non-claims

No legal advice, no per-author chain of title, no permission for external
quotations, and no inference from public access or elapsed time.
