# PR-62 metadata-only knowledge export pilot

This pilot serves one named consumer: a builder downloads ordinary JSON to inspect stable route, claim, and source IDs offline, with Node.js as the only example runtime. It derives its three August memoless claim entities from `src/lib/data/static.ts` and route/source metadata from the existing registries. It contains no copied article, private Discord text, or external source prose. The owner license decision remains unanswered; the rights inventory permits this metadata-only scope.

## Contract: `thorchain-wiki-knowledge/1`

`schemaVersion` is an integer major contract version. `entities` are source-backed claims with stable `claim:<id>` IDs, claim scope/decision, observed and review dates, version scope, explicit limitations, a route anchor, and a stable source ID derived from the source URL. `relationships` carry explicit `supersedes`, `read-alongside`, and `governed-by` edges. `routes` expose only route identity, title, confidence, review dates, and source labels/URLs. No value is inferred for an absent date.

`identity.authoredInputs` maps each authoritative TypeScript input path to its SHA-256. `generator` identifies the generator version and source hash; package name/version identify this producer. `checksum` is SHA-256 over the canonical compact JSON serialization of the entire document excluding `checksum` itself. Formatting whitespace is excluded. Consumers should treat an unknown major schema as unsupported and this export as inert metadata, not executable instructions or current protocol state.

The historical halt/re-enable chronology remains `needs-review`: the cited v3.20.0 release does not establish the full sequence. The separate current-only availability claim supersedes using that historical claim to answer a present-tense question and makes no availability assertion. Record-level review dates remain independent from claim review dates.

## Builder sample

Download the plain file and inspect stable IDs without installing project tooling:

```sh
curl -fsS https://wiki.thorchain.no/knowledge/v1.json -o thorchain-knowledge.json
node -e 'const k=require("./thorchain-knowledge.json"); console.log(JSON.stringify({schemaVersion:k.schemaVersion, checksum:k.checksum.value, claims:k.entities.map(({id,route,source})=>({id,route,source:source.id}))}, null, 2))'
```

The checked-in file is generated from source, is limited to 256 KiB, and is checked alongside curated content. Run `npm run generate:knowledge` after changing an authoritative input and `npm run check:knowledge` to reject stale output. `public/llms.txt` is a short registry-derived pointer list to this JSON, the governance page, and the builder's query guide/reading path; it contains review metadata only.

## Boundaries and evidence

This is static export output, not a hosted API, graph database, MCP/A2A service, semantic platform, or full-text license grant. The links are checked against the existing content registry and the incident claim anchors rendered by `ClaimCitations`. This pilot establishes generator/content consistency in the repository; runtime serving and public-route behavior require the parent task's separate proof.

## Parent verification

The parent added direct rejection of deleted registered routes, deleted MDX section anchors and missing supersession claims, reusing the maintained MDX heading parser. Exported route nodes use `route:<registryId>` so every relationship resolves to an exported node. Source retrieval dates/notes remain authored metadata; absent dates remain absent. `recordConfidence` preserves the enclosing incident's confidence, while each independent claim retains its own decision. Package identity and canonical origin come from their existing authorities. The authored-input hashes include the guide and heading/link checker dependencies, so stale output is rejected after those change.

All 701 unit tests in65files, types/lint/content, deterministic regeneration/checksum, both final builds and Next smoke passed. Four initial serving/evidence-link/security-header checks passed on desktop/mobile in each runtime. After incorporating the separately verified seed/grid follow-up, final14desktop/mobile checks passed in each actual built Next and WikiDO runtime, including metadata serving, all three claim anchors/source links, loaded/degraded WCAG,320px, announcement and FormData checks. The consumer JSON is11954bytes and contains no full article/private Discord text. These are candidate proofs, not human content acceptance or production serving. No main merge/deploy.

Stacked on PR260 with PR255's three-claim pilot integrated as a prerequisite, plus its focused browser/width follow-up. Commits are unsigned because the interactive signing agent is unavailable.
