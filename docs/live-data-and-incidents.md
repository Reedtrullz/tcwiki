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
- streaming-swap, memoless-transaction, secured-asset deposit/withdraw, app-layer/WASM, oracle, and node-operator halt flags

## Operational Halt Coverage

When updating live status code or copy, check both exact Mimir keys and key families. The wiki should avoid saying a feature is open when any relevant scoped halt is active or unclassified.

Minimum coverage to keep visible or searchable:

- Global and chain operations: `HALTTRADING`, `HALTSIGNING`, `HALTCHAINGLOBAL`, `HALT<CHAIN>TRADING`, `HALTSIGNING<CHAIN>`, `HALT<CHAIN>CHAIN`, `NODEPAUSECHAINGLOBAL`.
- Liquidity operations: `PAUSELP`, `PAUSELP<CHAIN>`, `PAUSELPDEPOSIT-<ASSET>`, `StreamingSwapPause`.
- TCY and legacy THORFi: `PAUSELOANS`, `HALTTCYTRADING`, `TCYCLAIMINGHALT`, `TCYCLAIMINGSWAPHALT`, `TCYSTAKINGHALT`, `TCYSTAKEDISTRIBUTIONHALT`, `TCYUNSTAKINGHALT`.
- Trade, secured, and RUNEPool operations: `TRADEACCOUNTSENABLED`, `HALTSECUREDGLOBAL`, `HaltSecuredDeposit-<CHAIN>`, `HaltSecuredWithdraw-<CHAIN>`, `RUNEPOOLENABLED`, `RUNEPoolHaltDeposit`, `RUNEPoolHaltWithdraw`.
- App-layer and operator controls: `HaltWasmGlobal`, `HaltWasmDeployer-<ADDRESS>`, `HaltWasmCs-<CHECKSUM>`, `HaltWasmContract-<SUFFIX>`, `HaltOracle`, `HaltMemoless`, `PauseBond`, `PauseUnbond`, `HaltRebond`, `HaltOperatorRotate`.

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
