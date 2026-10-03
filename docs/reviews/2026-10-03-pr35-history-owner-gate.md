# PR-35: recorded operational history decision pack

Disposition: storage and replay implementation are deferred until an operational owner accepts the bounded design and backup/restore destination below. This is a concrete preparation PR, not a shipped historical archive. The master plan expressly says: “Stop before storage work unless an operational owner accepts quota/retention, backup/export/restore and a named comparison task.” No acceptance has been received.

## Named task and smallest proposed pilot

An operator compares two dated observations of the public THORNode control/quality cohort around a Mimir change, identifying changed raw controls, provider disagreement and missing samples. The result must stay historical, never retrospectively assign an incident cause or assert continuous availability. Reuse existing collected evidence from PR47 once available; no extra provider polling, full-chain data or addresses.

Proposed limits: one cohort; each normalized snapshot at most64KiBdecodedJSON; explicit manual captures only, at most12perUTCday; seven-dayretention; at most84snapshots/5,505,024bytes (5.25MiB) before container/index overhead. Reject an over-limit capture visibly. Do not evict an unexported capture silently. No raw HTTP bodies or public “historical truth” service. Any scheduled collection is a separate owner decision.

Schema proposal: version1, stable captureID, collector/source identity, actual/requested/verified heights independently, observed/request-start/collection/delivery timestamps, public providerURL, raw control strings, applicability/version scope, quality/warnings and explicit unknowns. No absent value becomes zero. Keep incomparable heights/providers or time-skewed observations separate. An omitted interval is a gap; a backward wall clock is marked, not normalized into invented chronology. Unsupported schema is inert/unusable until an explicit migration keeps original evidence.

## Storage usage and backend decision

Read-only GitHub repository artifact inventory on3October reported479artifacts. The first100returned141,653,537bytes, all unexpired in that page; the next100returned340,600bytes. Those200are a bounded sample, not the full account/storagequota. Existing operations artifacts currently request30-dayretention in this branch. These facts do not establish spare plan quota, backup health or permission to repurpose artifacts. No artifact, workflow, bucket, database or retention was modified.

Prefer existing repository artifacts only if the owner accepts repository quota and the seven-daypilot lifecycle. Artifacts are temporary transport, not a backup. If that does not fit, defer rather than create a new service. The named owner, accepted backend and available account quota remain unanswered.

## Export, backup and restore acceptance required before storage

The owner nominates a separate offline destination for a bounded export bundle, including original per-snapshotJSON, stable-IDmanifest and SHA-256checksums. Verify the bundle before expiry. Restore into an isolated empty location without overwriting current data; verify checksum, schema, count/size limits and preserved timestamps/rawstrings. An unsupported or corrupt item remains an explicit gap with its failure reason. Keep originals available when a schema conversion fails. Existing VPS/offsite backups are time-sensitive and have not been verified by this preparation; no backup success is claimed.

Before implementation, record an actual export→backup→restore drill, quota/refusal fixture, retention/expired-sample behavior and clock/provider-gap comparison. The present pack specifies those checks; it has not run them or stored snapshots. Human acceptance remains a separate owner receipt.

## Revisit trigger

Proceed only when an operational owner supplies: name/role; accepted cohort and12/day/64KiB/seven-daycaps; verified backend/accountheadroom; backupdestination and successful restore receipt; the exact pair-comparison task. Then implement one bounded read-only capture/replay slice with runtime checks. No automatic archival/history claim is authorized by this pack. No mainmerge or deployment.
