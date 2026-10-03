# PR-65 — THORChain node coverage source review

**Reviewed:** 2026-10-03 · **Target:** PR242 worktree at `16f0741d75c89e596248189aa2418cc6805b5e57` · **Scope:** issue #164 only.

The live endpoint counts below are the sample shared for this task on 2026-10-03; they are recorded as time-bound evidence, not a fresh reading by the implementation run.

## Baseline correction

The existing Midgard `getNodes()` call reads `/v2/nodes` from `https://gateway.liquify.com/chain/thorchain_midgard/v2/nodes` with fallback `https://midgard.thorchain.network/v2/nodes`. The bounded live sample available for this review contained 649 rows with address and public-key fields (`nodeAddress`, `ed25519`, `secp256k1`) and no status or version. It cannot support a current THORNode validator/account roster or a status/version table. The existing Midgard `/v2/network` active and standby counts remain useful as a separate summary sample, linked to its own exact response URL and retrieval time.

The relevant status/version source is THORNode `/thorchain/nodes`: primary `https://gateway.liquify.com/chain/thorchain_api/thorchain/nodes`, fallback `https://thornode.thorchain.network/thorchain/nodes`. The 2026-10-03 sample returned 199 endpoint rows: 103 Active, 70 Standby, 16 Disabled, and 10 Whitelisted. These figures are a dated observation; provider state and counts can change. The endpoint response also contains fields outside this view, including IP address, operator address, public keys, bond, and slash points. The implementation projects only `node_address`, `status`, and `version` into its client result and UI.

## Protocol source check

The reviewed operational-control boundary remains the immutable THORNode 3.20.3 source revision [`b08d81f79275093b0fcb753e0d68ff1c16c51cb8`](https://gitlab.com/thorchain/thornode/-/tree/b08d81f79275093b0fcb753e0d68ff1c16c51cb8). At that revision:

- [`x/thorchain/grpc_query.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/grpc_query.go) routes the `Nodes` request to `queryNodes`.
- [`x/thorchain/querier.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/querier.go#L1204) builds that response from `ListValidatorsWithBond` and emits the node address, status, and version alongside additional fields. The exact raw `querier.go` content fetched for this review has SHA-256 `a701c73710fe4e2e8a9adf133cb7ef0021c75485c2ab1326a05f8f741d816fa5`.
- In that same query, a leaving validator whose bond is at or below one unit can be emitted with no `node_address`, status `Unknown`, and version `0.0.0`. The coverage normalizer preserves this source row and the table labels its missing address; a supplied malformed address still makes the provider response ineligible for acceptance.
- [`x/thorchain/keeper/v1/keeper_node_account.go`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_node_account.go#L50) defines the source query as validator-type node accounts with nonzero bond. This is the endpoint's returned account set, not every chain account.

The current source function is named `queryNodes`; the older `queryNodeAccounts` location was not treated as evidence. The source search was limited to the endpoint dispatch and the matching query and keeper files at the pinned revision. The response's IP, operator contact/address, key, bond, and slash-point fields are excluded. Displayed version strings are observations only; they do not prove a node's complete binary or control applicability. Existing control interpretation remains reviewed only for THORNode 3.20.3 at the pinned revision above.

## Implementation boundary

The bounded fetch uses the existing THORNode provider order, request deadline, and 2 MiB / 4,096-row JSON reader, then applies a stricter 300-row coverage cap and duplicate-address/field validation before accepting a provider. It makes one `/nodes` request per provider attempt and performs no per-node enrichment. Returned fields are string-only; bond and slash-point numbers are neither retained nor converted through JavaScript `Number`.

Each THORNode and Midgard result keeps its own exact endpoint URL and retrieval time. The UI reports roster-row status and version distributions, missing fields, and the separate Midgard summary counts with each source's freshness metadata. Differences between those samples are explicitly not an outage signal. The table uses a native disclosure, labeled search and row-limit controls, and a labeled keyboard-focusable horizontal-scroll region. A THORNode row whose source omits its address remains part of loaded-universe counts and is visible as `Missing address`.


## Parent verification and integration

The parent privately combined PR246 prerequisites after committing the bounded worker patch (`fc8b009`); main remains untouched. It independently retrieved the pinned query/keeper/dispatch source and matched `querier.go` SHA-256 above. Keeper file SHA-256 is `5b45ab8a95ccc2e7f2e19ca849b323f18f172338f0f6af17845f205b8e1921f4`; dispatch file hash is `d68c4fd9d51c396db74b5b459fc055c655f221630ac2b3c2795ac38c936790d4`.

693 unit tests across 60 files, typecheck, lint (one existing warning), content checks, both builds and standalone smoke pass. The network/accessibility runs covered 28 cases per runtime. Initial Next runs passed 26 and exposed duplicated status/version text selectors, an incorrect provider label and a macOS headless native-select key assumption. These were corrected with semantic list scoping, a deterministic independent Midgard sample and native type-ahead. A standalone native-select probe reproduced the platform behavior: ArrowDown/Enter and End did not select another option, while typing5 then Tab selected50. The final coverage journeys pass on desktop/mobile on each runtime; the other26 Next cases and27 Cloudflare cases passed in the broader runs. The actual product/source payload did not change during these test corrections.

The final journey verifies separate samples/source URLs, unfamiliar status/version values, disclosure keyboard entry, address filtering, bounded native row-limit choice and keyboard exit. IP fields do not appear in the rendered panel. Exact-head CI, actual production, physical-device and human screen-reader acceptance remain separate. No per-node polling, operator/contact disclosure, main merge or deployment.
