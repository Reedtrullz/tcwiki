# History export, backup and restore rehearsal - 2026-11-12

Evidence for #200. Synthetic only; no production storage was added.

## Current storage state

`cloudflare/do-entry.mjs` still forwards to the app:

- `WikiDO.fetch` returns `app.fetch(request, this.env, this.state)` (lines 9-11).
- A repository search for `state.storage`, `storage.sql` and `.storage.` returns no matches.

History storage remains unimplemented. The PR-35 preparation is merged, but the
owner gate is still open.

## Drill

Command, from the repository root on Node 22.22.3:

```sh
node --experimental-sqlite scripts/rehearse-history-restore.mjs .artifacts/history-restore-final
```

Cohort: three synthetic snapshots using the PR-35 schema version 1 (collector and
source identity, actual/requested/verified heights, observed/request-start/
collection/delivery timestamps, raw controls, applicability and quality).

Enforced limits: 64 KiB per capture, 12 captures per UTC day, seven-day
retention, 5.25 MiB total.

Steps: write a source SQLite database, export one JSON per capture with a
manifest and SHA-256 checksums, copy the bundle to a separate backup directory,
restore into a new empty SQLite database, then compare rows and bytes. The
backup directory is a local stand-in; the owner destination is still unset.

## Results

| Check | Result |
| --- | --- |
| Captures | 3 |
| Total cohort bytes | 1,962 |
| Largest capture | 654 B |
| Bundle | 3 snapshot JSON files, `manifest.json` (843 B), `checksums.sha256` (297 B) |
| Manifest captures | 3 |
| Backup verification | 3/3 checksums match |
| Restored rows | 3 |
| Source vs restored database | Byte-identical, SHA-256 `438dcc3ab83bbe474a8ee73026e372a280243e8236ac05d2b48f3db21e3a9724` |
| Manifest SHA-256 | `32c906125542822fedf796554b5f7748e6f6285a10cd45a260ccca34a311ca07` |
| Result | PASS |

## Negative controls

| Control | Observed |
| --- | --- |
| 66,611-byte capture | Rejected: `capture exceeds 65536 bytes` |
| Eight-day-old capture | Rejected: `older than the 7-day retention` |
| Backward wall clock | Warning only; the timestamp is preserved, not normalized |
| Tampered snapshot | Rejected on checksum mismatch |

## What this proves, and what it does not

Proves: the bounded bundle format, checksum verification, isolated restore and
refusal behavior work on synthetic data at the stated limits.

Does not prove: backend account quota, a real backup destination, production
retention behavior, real provider captures, or that the eventual Durable Object
SQLite implementation matches this rehearsal. It is not a backup-success claim.

## Remaining owner inputs

- Name and role of the operational owner.
- Accepted backend and verified account headroom.
- Named backup destination.
- The exact pair-comparison task.
- Acceptance of the 12/day, 64 KiB, seven-day and 5.25 MiB caps.

## Non-claims

No real snapshots, provider polling, production storage, retention job, quota
check or offsite backup was exercised.
