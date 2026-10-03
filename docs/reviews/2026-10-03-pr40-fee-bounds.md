# PR40 fee configuration and bounds source review

Baseline: candidate6fc370c, based on integration236; existing helpers classified every non-edge value inside and pair details repeated that rule. Review captured2026-10-03 at immutable THORNodev3.20.3 commit `b08d81f79275093b0fcb753e0d68ff1c16c51cb8`.

Ordered bounds are a mathematical display condition. Inverted bounds cannot define an inside interval; equal bounds are a shared point, not an interior. No recorded bps is clamped for display. Current records can differ from configured bounds and retain their actual value.

The release code permits zero floor, ceiling, step and deadband (not all configuration values require positive numbers). EpochBlocks must be positive for sealing: zero disables sealing even if attribution is enabled. WindowEpochs is clamped to1..30 by the release. Defaults match the normal source map; build overrides, lookup failures and unreviewed runtime versions prevent these receipts from attesting effective execution. The dashboard labels defaults as defaults and retains raw/effective config plus clamp warnings. No historical/default version range is inferred.

## x/thorchain/manager_dynamic_fee_current.go

[Immutable source](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_dynamic_fee_current.go). Full-file SHA256 `ed62525b7b52a5d9ede561183bc91338a238bf37a527ddb6ec3de81668eae474`.

```go
218: func (m *DynamicFeeMgr) EndBlock(ctx cosmos.Context) error {
219: 	enabled := m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeEnabled)
220: 	if enabled != 1 {
221: 		// Drop any accumulator rows still carrying pre-disable volume/fees. If
222: 		// we left them, a later re-enable would add new volume on top of old
223: 		// and seal the mix into a wrong epoch.
224: 		m.clearAccumulators(ctx)
225: 		return nil
226: 	}
227:
228: 	epochBlocks := m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeEpochBlocks)
229: 	if epochBlocks <= 0 {
230: 		return nil
231: 	}
232:
233: 	if ctx.BlockHeight()%epochBlocks != 0 {
234: 		return nil
```

```go
252: 	// Negative mimir values are treated as zero to prevent int64→uint64 wrap
253: 	// (a -1 ceiling would otherwise clamp every record to MaxUint64 bps).
254: 	floorBps := nonNegUint64(m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeFloorBPS))
255: 	ceilingBps := nonNegUint64(m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeCeilingBPS))
256: 	stepBps := nonNegUint64(m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeStepBPS))
257: 	deadbandBps := cosmos.NewUint(nonNegUint64(m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeDeadbandBPS)))
258: 	windowEpochs := clampWindowEpochs(m.keeper.GetConfigInt64(ctx, constants.L1DynamicFeeWindowEpochs))
259: 	tenK := cosmos.NewUint(10000)
```

```go
455: func clampBps(candidate, floorBps, ceilingBps uint64) uint64 {
456: 	if candidate > ceilingBps {
457: 		return ceilingBps
458: 	}
459: 	if candidate < floorBps {
460: 		return floorBps
461: 	}
462: 	return candidate
463: }
464:
465: func clampBpsDown(oldBps, stepBps, floorBps uint64) uint64 {
466: 	if oldBps > stepBps && oldBps-stepBps >= floorBps {
467: 		return oldBps - stepBps
468: 	}
469: 	return floorBps
470: }
471:
472: // nonNegUint64 converts a governance-controlled int64 to uint64, treating
473: // negatives as 0. Without this, a negative mimir value wraps to a very large
474: // uint64 and would make clampBps pin every record to MaxUint64.
475: func nonNegUint64(raw int64) uint64 {
476: 	if raw < 0 {
477: 		return 0
478: 	}
479: 	return uint64(raw)
480: }
481:
482: // clampWindowEpochs bounds the configured gradient-window size to [1,
483: // MaxDynamicFeeHistory]. The lower bound avoids a degenerate empty "before"
484: // window; the upper bound avoids overrunning the bounded history buffer.
485: func clampWindowEpochs(raw int64) int {
486: 	if raw < 1 {
487: 		return 1
488: 	}
489: 	if raw > int64(types.MaxDynamicFeeHistory) {
490: 		return types.MaxDynamicFeeHistory
491: 	}
```

## constants/constants_v1.go

[Immutable source](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go). Full-file SHA256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`.

```go
167: 			L1DynamicFeeEnabled:                 0,                  // enable/disable dynamic L1 min fee
168: 			L1DynamicFeeEpochBlocks:             14400,              // number of blocks per dynamic fee epoch
169: 			L1DynamicFeeFloorBPS:                1,                  // floor basis points for dynamic L1 min fee
170: 			L1DynamicFeeCeilingBPS:              20,                 // ceiling basis points for dynamic L1 min fee
171: 			L1DynamicFeeStepBPS:                 1,                  // step basis points for dynamic L1 min fee adjustment
172: 			L1DynamicFeeDeadbandBPS:             1000,               // % change in fees_rune (in bps, 10000 = 100%) below which the dynamic L1 fee controller holds
173: 			L1DynamicFeeWindowEpochs:            3,                  // epochs averaged on each side of the last bps change when measuring the fees_rune gradient (clamped into [1, MaxDynamicFeeHistory])
174: 			VaultDeficitGasHaltMaxGasMultiplier: 30,                 // multiple of current max gas at which gas-related vault deficits halt signing and trading
```

## x/thorchain/keeper/v1/keeper_config.go

[Immutable source](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_config.go). Full-file SHA256 `324774cce0e22ff24f24d28af3d6c7d04c701c5590e18706485354bce837753e`.

```go
14: func (k KVStore) GetConfigInt64(ctx cosmos.Context, key constants.ConstantName) int64 {
15: 	val, err := k.GetMimir(ctx, key.String())
16: 	if val < 0 || err != nil {
17: 		val = k.GetConstants().GetInt64Value(key)
18: 		if err != nil {
19: 			ctx.Logger().Error("fail to get mimir", "key", key.String(), "error", err)
20: 		}
21: 	}
22: 	return val
23: }
```

Validation: regression fixtures exclude below/above/inverted/shared-point/malformed values from Inside bounds; shared classification drives filters, pair cards and distribution. Raw20/1 and epoch0 remain unchanged with explicit configuration warnings. Final validation: 639unit tests/types/lint/bothbuilds/Nextstandalonesmoke and24fee/runtimebrowserchecks eachNext/CF passed. Four browser scenarios cover inverted/equal/below/above configurations and zero epoch sealing; no invalid or out-of-range record matches Inside bounds.

## History-window bound

[Immutable x/thorchain/types/type_dynamic_fee.go](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/types/type_dynamic_fee.go). Full-fileSHA256 `182f6b4f8dbfc9a6ab6391007746c298df2f9cb52c935898136e0d051085115f` independently retrieved2026-10-03.

```go
10: const MaxDynamicFeeHistory = 30
23: func (m *DynamicFeeRecord) AppendHistory(rec DynamicFeeEpochRecord) {
24:     m.History = append(m.History, rec)
25:     if len(m.History) > MaxDynamicFeeHistory {
26:         m.History = m.History[len(m.History)-MaxDynamicFeeHistory:]
27:     }
28: }
```
