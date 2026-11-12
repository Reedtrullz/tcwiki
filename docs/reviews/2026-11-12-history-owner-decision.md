# History owner decision - 2026-11-12

Closes the owner gate in #200. Storage implementation remains a separate future
issue and is not authorized by this record.

## Decision

- **Owner:** Reidar, acting as the operational owner for this pilot.
- **Backend:** no new service. Use a directory on the existing Racknerd VPS.
- **Destination:** `/var/backups/tcwiki-history/` on `racknerd-2d09df5`, owned by
  the `deploy` user. The first drill wrote `2026-11-12/bundle`.
- **Offsite coverage:** the existing offsite backup has not been verified for
  this path. The VPS is a separate machine from the Cloudflare deployment and
  the local Mac, but this record does not claim an offsite copy yet.

## Accepted caps

- One cohort: current public THORNode controls and quality.
- At most 12 manual captures per UTC day.
- At most 64 KiB decoded JSON per capture.
- Seven-day retention.
- At most 84 snapshots / 5,505,024 bytes (5.25 MiB) before container overhead.
- Reject an over-limit capture visibly; never evict an unexported capture
  silently.
- No raw HTTP bodies, addresses, private queries or a public history service.

## Named comparison task

Compare two dated captures around one Mimir change:

- list changed raw control strings;
- show provider disagreement without merging it into one confident snapshot;
- mark missing samples and clock/provider gaps;
- keep actual, requested and verified heights separate.

The comparison must stay historical. It must not assign an incident cause or
assert continuous availability.

## Retention and refusal behavior

The rehearsal verifies: over-limit captures rejected, expired captures rejected,
backward clocks preserved with a warning, and tampered bundles rejected on
checksum. Details and negative controls are in
`docs/reviews/2026-11-12-history-restore-rehearsal.md`.

## Evidence

- Rehearsal and destination drill: `docs/reviews/2026-11-12-history-restore-rehearsal.md`.
- Script: `scripts/rehearse-history-restore.mjs`.
- Destination listing: `/var/backups/tcwiki-history/2026-11-12/bundle` (3,102 bytes).
- Date: 2026-11-12.
