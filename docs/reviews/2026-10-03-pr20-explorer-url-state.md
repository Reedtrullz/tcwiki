# Explorer URL state (proposal PR-20, issue #185)

## Candidate and behavior

The opening main baseline is `686b63b`. This branch combines the unmerged PR244 pool-return/period candidate and PR243 fee cohorts before applying the explorer contract. Those prerequisite merges retain their own PRs; no main merge occurred.

Each explorer still owns its parser, validation and defaults. One small native-history writer merges only that explorer's allowlisted keys into the current browser URL. It preserves unrelated parameters and the reader's existing fragment, adopts a default fragment only when none exists, rejects external/cross-route destinations and does not grow history for each keystroke. Reset removes owned filters only. Source map, protocol, ecosystem, glossary, incident archive, article library, available pools and fee records use it. Fee filters now have validated `fee_q`, `fee_whitelist`, `fee_bps`, and `fee_current` URLs. Pool period remains independent from pool filters.

Rapid text edits preserve spaces and read fresh URL state rather than stale render state. Inputs on statically rendered explorers remain disabled until handlers hydrate. Real back/forward, copied URLs and reloads restore filters; query edits keep editing focus while real fragment destinations still reveal their disclosure and heading.

## Runtime source review

Installed Next's `01-app/01-getting-started/04-linking-and-navigating.md` Native History section explicitly uses `history.replaceState(null, '', url)`. The installed vinext navigation shim distinguishes external writes from its own history envelopes; supplying a captured framework-owned `history.state` bypassed the external update path. The implementation uses the documented null form, allowing the runtime to preserve its metadata. Fee records subscribe to the existing browser URL with `useSyncExternalStore`, receiving a dedicated query-edit event rather than manufacturing browser traversal. Other explorers retain their existing reader hooks.

Initial candidate journeys exposed real anchor-focus theft and filter hydration races. Synthetic `popstate` for each keystroke caused unnecessary vinext traversal; this was removed. Explicit waits for hydrated/enabled inputs avoid tests sending characters before event handlers exist. A final select assertion also needed to wait for its URL change; no extra product state framework was introduced to fix that assertion.

## Verification

- 679 unit tests across 58 files passed. Typecheck and lint passed with zero errors and one pre-existing Cloudflare default-export warning.
- Content generation/checks passed, preserving the two narrowly proposed overdue exceptions through October 9. Production audit reports zero vulnerabilities; the separately documented full build-tool advisory exception is unchanged.
- Both fresh standalone and actual WikiDO builds passed. Latest standalone smoke passed while preserving the live unsupported `PAUSELOANS` readiness warning.
- The broad 84-case run passed 79 applicable Cloudflare cases with five intentional viewport skips. Next passed 78 with one premature select-URL assertion; after its wait correction, all 30 affected explorer/fee journeys passed on each runtime. Other 49 applicable Next cases already passed in the broad run. The source/control behavior is unchanged by the final test wait.
- The affected journeys cover desktop/mobile rapid multiword entry, simultaneous fee/pool filters, copied URLs, reload, history restoration, invalid parameters, reset, retained fragments and unrelated query parameters. Existing article destinations and header navigation were included in the broad run.

Exact pushed-head CI remains a separate gate. No production browser/physical-device/screen-reader certification, main merge or deployment. Git candidate commits are unsigned per command because the interactive signer is unavailable; global signing settings are unchanged.
