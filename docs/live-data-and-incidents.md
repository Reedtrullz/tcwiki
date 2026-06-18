# Live Data And Incident Content Runbook

## Source Hierarchy

Use this order when facts disagree:

1. Official THORChain docs or official incident reports.
2. Live THORNode endpoints for current operational state.
3. Live Midgard endpoints for analytics and historical aggregates.
4. Curated third-party research, clearly labeled as curated or needs-review.

## Current-Only Facts

Do not hard-code these as timeless claims:

- Mimir halt flags
- inbound addresses, routers, and gas rates
- outbound fees and queue state
- pool availability, APYs, reserves, bonds, and active node counts
- constants overridden by Mimir
- TCY claim/stake state
- RUNEPool/POL state
- trade-account and secured-asset enablement

## Updating Static Records

When editing `src/lib/data/static.ts`:

- Use `withFreshness()` via the local `record()` helper.
- Include at least one source URL.
- Set confidence to `official`, `curated`, `historical`, or `needs-review`.
- Prefer dated claims over present-tense claims for incidents and product availability.

## Incident Entries

For security incidents, include:

- date
- type
- impact
- whether the issue is resolved or still open/needs review
- conservative lessons
- official or high-quality source URL

Separate protocol exploits from illicit use of open infrastructure. For example, post-Bybit laundering flow should not be labeled as a THORChain protocol exploit unless a source says that directly.

## Live Checks

Useful current-state endpoints:

```bash
curl -fsS https://thornode.thorchain.network/thorchain/mimir | jq
curl -fsS https://thornode.thorchain.network/thorchain/inbound_addresses | jq
curl -fsS https://midgard.thorchain.network/v2/health | jq
curl -fsS https://midgard.thorchain.network/v2/network | jq
curl -fsS https://midgard.thorchain.network/v2/pools | jq 'map(.asset)'
```

Record the check time and make clear that the result is a snapshot.
