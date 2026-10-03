# PR-63: use the maintained current-control recipe

Issue #162 explicitly says to stop if a maintained static example adequately answers the reader task. The selected pilot question is: “Which raw HALTTRADING value did the current control provider report, and what does this sample actually prove?” The existing Build And Query THORChain Data guide, source map and network diagnostic already answer it together. This disposition adds no API workbench.

## Reproducible reader recipe

1. Open `/deep-dives/build-query-data#query-plan`. Current protocol control claims start with THORNode, independently of Midgard dashboard metrics.
2. Follow `/network#network-diagnostics`. Read the adjacent current source status and review-applicability warning. If needed, explicitly use the existing refresh action; an unreviewed version must retain raw data without a positive availability interpretation.
3. Expand “Operational evidence”. Find HALTTRADING in the already collected raw Mimir observations. Keep its exact integer/string and provider URL; missing or malformed values remain unknown. Do not convert it into a money amount.
4. Inspect the recorded collection interval, checked/block time and requested/observed response-height proof. A URL requesting a height does not establish a pinned response. A later refresh is a different sample.
5. Use the bounded observed-control export from proposal PR-47 when its PR is integrated, or copy the displayed observation and source receipt manually. Exports are inert evidence, not transaction instructions or provider attestations.

The source map exposes the primary source path and claim boundary without a new request. The existing diagnostic uses the bounded shared transport and reviewed interpretation catalog. The static recipe does not accept URLs, credentials, addresses or mutations. Source warnings, provider failure, unsupported versions and missing height proof remain part of the answer; present controls cannot explain a historical transaction.

## Evidence and decision

Baseline: proposal PR-63 plus `content/deep-dives/build-query-data.mdx` Query Plan, Minimum Safe Query Sequence, Amounts Assets And Units and Error Handling sections; `src/lib/source-map-explorer.ts` evidence packet; `NetworkStatusBanner.tsx` raw operational evidence; bounded transport, response-height and applicability contracts from proposals PR-57/44/45. These are maintained source/caller contracts, not an invented new provider API. The parent diagnostic-export verification also exercises the actual raw observation and unknown height proof on built Next and WikiDO.

The existing recipe satisfies this narrow read task. Stop at the documented plan boundary instead of adding another manual request surface and duplicated decoder. Revisit only with a concrete query the maintained guide and diagnostic cannot answer, such as a separately reviewed historical-height dataset; that would need its own provider contract and source evidence. This does not claim a general-purpose console was implemented.

Validation: 116 focused source-map and THORNode contract tests plus content and diff checks passed. Full runtime proof belongs to the implementation PRs referenced above; this PR changes review documentation only. Base PR267. No main merge or deployment. Commits are unsigned because the interactive signer is unavailable.
