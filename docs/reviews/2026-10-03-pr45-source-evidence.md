# PR45 captured immutable source evidence

Captured 2026-10-03 through the GitLab repository-files API with ref=`b08d81f79275093b0fcb753e0d68ff1c16c51cb8`. The tag API resolved v3.20.3 to this same commit. Excerpts remain reviewable if GitLab browser access returns 403; hashes cover each complete retrieved file and snippets retain original line numbers. Source scratch was bounded to under 1 MiB and removed after capture.

## Per-definition review

All 38 existing definitions are accounted for: 36 comparisons verified, 2 unsupported. Direct -1 is the unset sentinel of the normal non-mocknet getter. Config means GetConfigInt64 falls back to release constants. Source defaults below describe the inspected normal mainnet source build; build overrides, read errors, other protocol gates and endpoint filtering prevent inferring effective availability from endpoint omission. Absence therefore stays unknown in the UI.

| Catalog key | Verified activation | Source default / absence | Captured comparison |
|---|---|---|---|
| `HALTTRADING` | at-or-after-height | direct -1 | [evidence 1](#evidence-1) |
| `StreamingSwapPause` | positive | config 0 | [evidence 2](#evidence-2) |
| `HaltMemoless` | positive | direct -1 | [evidence 3](#evidence-3) |
| `HALTSIGNING` | at-or-after-height | direct -1 via THORClient | [evidence 4](#evidence-4) |
| `PAUSELP` | at-or-after-height | direct -1 | [evidence 5](#evidence-5) |
| `PAUSELPDEPOSIT-*` | positive | direct -1; asset MimirString suffix | [evidence 6](#evidence-6) |
| `PauseAsymWithdrawal-*` | positive | direct -1; only dual-address LP selection becomes symmetric | [evidence 7](#evidence-7) |
| `RUNEPoolHaltDeposit` | at-or-after-height | config 0 | [evidence 8](#evidence-8) |
| `RUNEPoolHaltWithdraw` | at-or-after-height | config 0 | [evidence 9](#evidence-9) |
| `PAUSELOANS` | unsupported | unverified; no enforcing consumer verified | [evidence 10](#evidence-10) |
| `HALTCHAINGLOBAL` | at-or-after-height | direct -1 | [evidence 11](#evidence-11) |
| `NODEPAUSECHAINGLOBAL` | until-height | direct -1; inclusive expiry, including zero at height zero | [evidence 12](#evidence-12) |
| `HALTCHURNING` | at-or-after-height | direct -1 | [evidence 13](#evidence-13) |
| `PauseBond` | positive | config 0 | [evidence 14](#evidence-14) |
| `PauseUnbond` | positive | config 0 | [evidence 15](#evidence-15) |
| `HaltRebond` | positive | config 0 (missing map entry) | [evidence 16](#evidence-16) |
| `HaltOperatorRotate` | positive | config 0 (missing map entry) | [evidence 17](#evidence-17) |
| `HaltOracle` | unsupported | declaration only; enforcing consumer unverified | [evidence 18](#evidence-18) |
| `HALTSECUREDGLOBAL` | at-or-after-height | direct -1 | [evidence 19](#evidence-19) |
| `HaltSecuredDeposit-*` | at-or-after-height | direct -1; chain suffix | [evidence 20](#evidence-20) |
| `HaltSecuredWithdraw-*` | at-or-after-height | direct -1; chain suffix | [evidence 21](#evidence-21) |
| `TCYCLAIMINGHALT` | positive | config 1 | [evidence 22](#evidence-22) |
| `TCYCLAIMINGSWAPHALT` | positive | config 1 | [evidence 23](#evidence-23) |
| `TCYSTAKINGHALT` | positive | config 1 | [evidence 24](#evidence-24) |
| `TCYSTAKEDISTRIBUTIONHALT` | positive | config 1 | [evidence 25](#evidence-25) |
| `TCYUNSTAKINGHALT` | positive | config 1 | [evidence 26](#evidence-26) |
| `HALTTCYTRADING` | at-or-after-height | direct -1 | [evidence 27](#evidence-27) |
| `HALTWASMGLOBAL` | after-height | direct -1 | [evidence 28](#evidence-28) |
| `HaltWasmDeployer-*` | after-height | direct -1; full actor address | [evidence 29](#evidence-29) |
| `HaltWasmCs-*` | after-height | direct -1; unpadded base32 checksum | [evidence 30](#evidence-30) |
| `HaltWasmContract-*` | after-height | direct -1; final six address characters | [evidence 31](#evidence-31) |
| `TRADEACCOUNTSENABLED` | non-positive | config 0 | [evidence 32](#evidence-32) |
| `TRADEACCOUNTSDEPOSITENABLED` | non-positive | config 1 | [evidence 33](#evidence-33) |
| `HaltTradeDeposit-*` | at-or-after-height | direct -1; chain suffix | [evidence 34](#evidence-34) |
| `HaltTradeWithdraw-*` | at-or-after-height | direct -1; chain suffix | [evidence 35](#evidence-35) |
| `MANUALSWAPSTOSYNTHDISABLED` | positive | config 0 (missing map entry) | [evidence 36](#evidence-36) |
| `RUNEPOOLENABLED` | non-positive | config 0 | [evidence 37](#evidence-37) |
| `BANKSENDENABLED` | non-positive | config 0 | [evidence 38](#evidence-38) |

## Common absence and default paths

queryMimirValues iterates stored keys, skips errors and negative values, and does not expand defaults. GetMimir returns -1 when unset; GetConfigInt64 falls back to constants on a negative value or error. GetInt64Value checks build overrides, then the default map, then returns 0 for missing entries. An endpoint omission can also reflect a skipped lookup, so it does not prove the effective default.

## Unsupported fields

PAUSELOANS: the exact x/thorchain directory listing contains 274 entries and no filename containing loan; an enforcing PauseLoans consumer was not verified in the captured source. No activation rule is inferred from old releases or ADRs. Returned values require applicability review.

HaltOracle: the enum is declared, but no enforcing comparison was verified in the inspected manager_oracle_current.go, handler_price_feed_quorum_batch.go and bifrost/oracle/oracle.go. Declaration/default fallback is insufficient evidence of an activation rule. Its mode remains null/unsupported.

Directory-list capture SHA-256: `7afe5e78ec5e22972f958ba764b106985fc083ea6226af46207c4d8f09eac66d`. Exact tree API: https://gitlab.com/api/v4/projects/thorchain%2Fthornode/repository/tree?path=x%2Fthorchain&ref=b08d81f79275093b0fcb753e0d68ff1c16c51cb8&per_page=100&page=N (pages 1–3).

### Endpoint omission

[x/thorchain/querier.go:3356](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/querier.go#L3356) · full-file SHA-256 `a701c73710fe4e2e8a9adf133cb7ef0021c75485c2ab1326a05f8f741d816fa5`

```go
3356: func (qs queryServer) queryMimirValues(ctx cosmos.Context, _ *types.QueryMimirValuesRequest) (*types.QueryMimirValuesResponse, error) {
3357: 	resp := types.QueryMimirValuesResponse{
3358: 		Mimirs: make([]*types.Mimir, 0),
3359: 	}
3360:
3361: 	// collect all keys with set values, not displaying those with votes but no set value
3362: 	keeper := qs.mgr.Keeper()
3363: 	iter := keeper.GetMimirIterator(ctx)
3364: 	defer iter.Close()
3365: 	for ; iter.Valid(); iter.Next() {
3366: 		key := strings.TrimPrefix(string(iter.Key()), "mimir//")
3367: 		value, err := keeper.GetMimir(ctx, key)
3368: 		if err != nil {
3369: 			ctx.Logger().Error("fail to get mimir value", "error", err)
3370: 			continue
3371: 		}
3372: 		if value < 0 {
3373: 			ctx.Logger().Error("negative mimir value set", "key", key, "value", value)
3374: 			continue
3375: 		}
3376: 		resp.Mimirs = append(resp.Mimirs, &types.Mimir{
3377: 			Key:   key,
3378: 			Value: value,
3379: 		})
3380: 	}
3381:
3382: 	return &resp, nil
3383: }
3384:
```

### Direct getter

[x/thorchain/keeper/v1/keeper_mimir_mainnet.go:9](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_mimir_mainnet.go#L9) · full-file SHA-256 `548ee948723c6c66f7625d4635cdca35379e27aa91d15ae9d1d17b5f7c1cf418`

```go
9: func (k KVStore) GetMimir(ctx cosmos.Context, key string) (int64, error) {
10: 	record := int64(-1)
11: 	_, err := k.getInt64(ctx, k.GetKey(prefixMimir, key), &record)
12: 	return record, err
13: }
```

### Config getter

[x/thorchain/keeper/v1/keeper_config.go:14](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_config.go#L14) · full-file SHA-256 `324774cce0e22ff24f24d28af3d6c7d04c701c5590e18706485354bce837753e`

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

### Missing constant default

[constants/constants.go:102](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants.go#L102) · full-file SHA-256 `78e3019439e2f32f9e9dd9629ec227d6fd40f2d0cdcd1390bec69c1f00c07cbd`

```go
102: func (cv *ConstantVals) GetInt64Value(name ConstantName) int64 {
103: 	// check overrides first
104: 	v, ok := int64Overrides[name]
105: 	if ok {
106: 		return v
107: 	}
108:
109: 	v, ok = cv.int64values[name]
110: 	if !ok {
111: 		return 0
112: 	}
113: 	return v
114: }
```

### Bond defaults

[constants/constants_v1.go:39](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go#L39) · full-file SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
39: 			PauseBond:                           0,                  // pauses the ability to bond
40: 			PauseUnbond:                         0,                  // pauses the ability to unbond
```

### Streaming default

[constants/constants_v1.go:68](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go#L68) · full-file SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
68: 			StreamingSwapPause:                  0,                  // pause streaming swaps from being processed or accepted
```

### Trade defaults

[constants/constants_v1.go:114](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go#L114) · full-file SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
114: 			TradeAccountsEnabled:                0,                // enable/disable trade account
115: 			TradeAccountsDepositEnabled:         1,
```

### RUNEPool default

[constants/constants_v1.go:130](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go#L130) · full-file SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
130: 			RUNEPoolEnabled:                     0,                  // enable/disable RUNE Pool
```

### Bank RUNEPool and TCY defaults

[constants/constants_v1.go:143](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_v1.go#L143) · full-file SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
143: 			BankSendEnabled:                     0,                  // enable/disable cosmos bank send messages
144: 			RUNEPoolHaltDeposit:                 0,                  // enable/disable RUNEPool deposit (block height)
145: 			RUNEPoolHaltWithdraw:                0,                  // enable/disable RUNEPool withdraw (block height)
146: 			MinRuneForTCYStakeDistribution:      2_100_00000000,     // Set what is the minimum amount of rune need it on TCY fund in order to be distributed
147: 			MinTCYForTCYStakeDistribution:       100000,             // Set what is the minimum amount of TCY need it on TCY fund in order to be distributed
148: 			TCYStakeSystemIncomeBps:             1000,               // allocate 1000bps (10%) RUNE of all system income to TCY Fund
149: 			TCYClaimingSwapHalt:                 1,                  // enable/disable claiming module rune to tcy swap
150: 			TCYStakeDistributionHalt:            1,                  // enable/disable tcy stake distribution
151: 			TCYStakingHalt:                      1,                  // enable/disable tcy staking
152: 			TCYUnstakingHalt:                    1,                  // enable/disable tcy unstaking
153: 			TCYClaimingHalt:                     1,                  // enable/disable tcy claiming
```

### Mainnet overrides

[constants/constants_mainnet.go:1](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constants_mainnet.go#L1) · full-file SHA-256 `c147c7b3c32d202c1116ee0fd60ae11f8d5ad7d726338aeba91e3edf32f3e0d9`

```go
1: //go:build !mocknet
2: // +build !mocknet
3:
4: package constants
5:
6: import (
7: 	"time"
8: )
9:
10: var ThorchainBlockTime = 6 * time.Second
```

### Scoped key templates

[constants/mimir_strings.go:25](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/mimir_strings.go#L25) · full-file SHA-256 `fc701df0e1889f7a6da9047456ec26ee2a40aa98192f0e953f0ecd54a1497a5c`

```go
25: 	MimirTemplateSecuredAssetHaltDeposit   = "HaltSecuredDeposit-%s"        // Use with Chain
26: 	MimirTemplateSecuredAssetHaltWithdraw  = "HaltSecuredWithdraw-%s"       // Use with Chain
27: 	MimirTemplateTradeAssetHaltDeposit     = "HaltTradeDeposit-%s"          // Use with Chain
28: 	MimirTemplateTradeAssetHaltWithdraw    = "HaltTradeWithdraw-%s"         // Use with Chain
29: 	MimirTemplateWasmHaltChecksum          = "HaltWasmCs-%s"                // Encode the checksum to base32 to fit within mimir's 64 char limit and case insenstivity. Truncate trailing `=` for brevity
30: 	MimirTemplateWasmHaltContract          = "HaltWasmContract-%s"          // Use contract address checksum (last 6) for brevity and to fit inside mimir's 64 char length
31: 	MimirTemplateWasmHaltDeployer          = "HaltWasmDeployer-%s"          // Use full deployer address to prevent a deployer from instantiating new contracts
32: 	MimirTemplateMaxGas                    = "MaxGas-%s"                    // Use with Chain (e.g., MaxGas-ETH)
33: 	MimirTemplateRevShareThorName          = "REVSHARE-%s"                  // Use with thorname (e.g., REVSHARE-foobar)
34: 	MimirTemplateSwitch                    = "EnableSwitch-%s-%s"           // Use with Chain, Symbol
35: 	MimirTemplatePauseLPDeposit            = "PauseLPDeposit-%s"            // Use with Asset MimirString
36: 	MimirTemplateOverSolvencyToTreasuryBps = "OverSolvencyToTreasuryBps-%s" // Use with Asset MimirString
37: 	MimirTemplateHaltSigning               = "HaltSigning%s"                // Use with Chain (mixed case, e.g., HaltSigningETH)
```

### Evidence 1

[x/thorchain/keeper/v1/keeper_halt.go:65](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L65) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
65: 	haltTrading, err := k.GetMimir(ctx, constants.MimirKeyHaltTradingGlobal)
66: 	if err == nil && haltTrading > 0 && haltTrading <= ctx.BlockHeight() {
67: 		return true
68: 	}
69: 	return false
70: }
71:
72: func (k KVStore) IsChainTradingHalted(ctx cosmos.Context, chain common.Chain) bool {
```

### Evidence 2

[x/thorchain/handler_swap.go:147](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_swap.go#L147) · full-file SHA-256 `dd17003b06aa975ed25f2cfa360a8dea25fea145aafb904741adcef8bb7584f2`

```go
147: 		pausedStreaming := h.mgr.Keeper().GetConfigInt64(ctx, constants.StreamingSwapPause)
148: 		if pausedStreaming > 0 {
149: 			return fmt.Errorf("streaming swaps are paused")
150: 		}
151:
152: 		// if either source or target in ragnarok, streaming is not allowed
153: 		for _, asset := range []common.Asset{sourceCoin.Asset, target} {
154: 			key := "RAGNAROK-" + asset.MimirString()
```

### Evidence 3

[x/thorchain/handler_reference_memo.go:86](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_reference_memo.go#L86) · full-file SHA-256 `039f3d53d9565bba126824b155f2efa9a1f88857a877f5499c42dda7195a9836`

```go
86: 	haltMemoless, err := h.mgr.Keeper().GetMimir(ctx, constants.HaltMemoless.String())
87: 	if err != nil {
88: 		ctx.Logger().Error("fail to get HaltMemoless mimir", "error", err)
89: 	}
90: 	if err == nil && haltMemoless > 0 {
91: 		return errors.New("memoless transactions are currently halted")
92: 	}
93:
```

### Evidence 4

[bifrost/pkg/chainclients/shared/signing/halt.go:34](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/bifrost/pkg/chainclients/shared/signing/halt.go#L34) · full-file SHA-256 `650e56c61f21e684880f20f6c25406f0f97add866221ca663befd2d7f533e9c4`

```go
34: 	haltGlobal, err := bridge.GetMimir("HALTSIGNING")
35: 	if err != nil {
36: 		return false, false, fmt.Errorf("fail to get HALTSIGNING mimir: %w", err)
37: 	}
38: 	if haltGlobal > 0 && haltGlobal <= height {
39: 		return true, true, nil
40: 	}
41: 	chainKey := fmt.Sprintf(constants.MimirTemplateHaltSigning, chain)
```

### Evidence 5

[x/thorchain/keeper/v1/keeper_halt.go:116](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L116) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
116: 	pauseLPGlobal, err := k.GetMimir(ctx, "PauseLP")
117: 	if err == nil && pauseLPGlobal > 0 && pauseLPGlobal <= ctx.BlockHeight() {
118: 		return true
119: 	}
120:
121: 	pauseLP, err := k.GetMimir(ctx, fmt.Sprintf("PauseLP%s", chain))
122: 	if err == nil && pauseLP > 0 && pauseLP <= ctx.BlockHeight() {
123: 		ctx.Logger().Debug("chain has paused LP actions", "chain", chain)
```

### Evidence 6

[x/thorchain/keeper/v1/keeper_halt.go:131](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L131) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
131: 	v, err := k.GetMimirWithRef(ctx, constants.MimirTemplatePauseLPDeposit, asset.MimirString())
132: 	if err == nil && v > 0 {
133: 		return true
134: 	}
135: 	return false
136: }
137:
138: func (k KVStore) IsTCYTradingHalted(ctx cosmos.Context) bool {
```

### Evidence 7

[x/thorchain/withdraw.go:167](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/withdraw.go#L167) · full-file SHA-256 `f71572883a95aa860411aa48b750197761a4848f349416008d8e6560943bffc7`

```go
167: 	if pauseAsym > 0 {
168: 		return common.EmptyAsset
169: 	}
```

### Evidence 8

[x/thorchain/handler_rune_pool_deposit.go:61](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_rune_pool_deposit.go#L61) · full-file SHA-256 `9b5e6d0ef6dabaf81d0e4152948c3b82ffb3e4c291338ad1c1a72d2c0ea62235`

```go
61: 	runePoolDepositPaused := h.mgr.Keeper().GetConfigInt64(ctx, constants.RUNEPoolHaltDeposit)
62: 	if runePoolDepositPaused > 0 && ctx.BlockHeight() >= runePoolDepositPaused {
63: 		return fmt.Errorf("RUNEPool deposit paused")
64: 	}
65: 	return nil
66: }
67:
68: func (h RunePoolDepositHandler) handle(ctx cosmos.Context, msg MsgRunePoolDeposit) error {
```

### Evidence 9

[x/thorchain/handler_rune_pool_withdraw.go:63](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_rune_pool_withdraw.go#L63) · full-file SHA-256 `23749fbdf9c464bd104c71de0e8d30b64968b1bf7c1d791340aeb872e2485ab2`

```go
63: 	runePoolWithdrawPaused := h.mgr.Keeper().GetConfigInt64(ctx, constants.RUNEPoolHaltWithdraw)
64: 	if runePoolWithdrawPaused > 0 && ctx.BlockHeight() >= runePoolWithdrawPaused {
65: 		return fmt.Errorf("RUNEPool withdraw paused")
66: 	}
67: 	maxAffBasisPts := h.mgr.Keeper().GetConfigInt64(ctx, constants.MaxAffiliateFeeBasisPoints)
68: 	if !msg.AffiliateBasisPoints.IsZero() && msg.AffiliateBasisPoints.GT(cosmos.NewUint(uint64(maxAffBasisPts))) {
69: 		return fmt.Errorf("invalid affiliate basis points, max: %d, request: %d", maxAffBasisPts, msg.AffiliateBasisPoints.Uint64())
70: 	}
```

### Evidence 10

PAUSELOANS: no enforcing source comparison verified; see Unsupported fields.

### Evidence 11

[x/thorchain/keeper/v1/keeper_halt.go:84](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L84) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
84: 	haltChain, err := k.GetMimir(ctx, "HaltChainGlobal")
85: 	if err == nil && (haltChain > 0 && haltChain <= ctx.BlockHeight()) {
86: 		ctx.Logger().Debug("global is halt")
87: 		return true
88: 	}
89:
90: 	pauseChain, err := k.GetMimir(ctx, "NodePauseChainGlobal")
91: 	if err == nil && pauseChain >= ctx.BlockHeight() {
```

### Evidence 12

[x/thorchain/keeper/v1/keeper_halt.go:90](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L90) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
90: 	pauseChain, err := k.GetMimir(ctx, "NodePauseChainGlobal")
91: 	if err == nil && pauseChain >= ctx.BlockHeight() {
92: 		ctx.Logger().Debug("node global is pause")
93: 		return true
94: 	}
95:
96: 	haltMimirKey := fmt.Sprintf("Halt%sChain", chain)
97: 	haltChain, err = k.GetMimir(ctx, haltMimirKey)
```

### Evidence 13

[x/thorchain/manager_validator_current.go:67](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_validator_current.go#L67) · full-file SHA-256 `ce2c09d201a1d63f462288b8cdd13b1243bd25d43e60d42e0a6839c80829ac90`

```go
67: 	halt, err := vm.k.GetMimir(ctx, "HaltChurning")
68: 	if halt > 0 && halt <= ctx.BlockHeight() && err == nil {
69: 		ctx.Logger().Info("churn event skipped due to mimir has halted churning")
70: 		return nil
71: 	}
72:
73: 	vaults, err := vm.k.GetAsgardVaultsByStatus(ctx, ActiveVault)
74: 	if err != nil {
```

### Evidence 14

[x/thorchain/handler_bond.go:63](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_bond.go#L63) · full-file SHA-256 `dc9ee525103039e88ffdd1280479b8c704286c27b9bd0fa741b88a22fd6d7429`

```go
63: 	bondPause := h.mgr.Keeper().GetConfigInt64(ctx, constants.PauseBond)
64: 	if bondPause > 0 {
65: 		return ErrInternal(nil, "bonding has been paused")
66: 	}
67:
68: 	bond := msg.Bond.Add(nodeAccount.Bond)
69: 	maxBond, err := h.mgr.Keeper().GetMimir(ctx, "MaximumBondInRune")
70: 	if err != nil {
```

### Evidence 15

[x/thorchain/handler_unbond.go:59](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_unbond.go#L59) · full-file SHA-256 `e52419548a44937dd781d47fe44a665113566261b5e655cca8eb52360dea84ba`

```go
59: 	if h.mgr.Keeper().GetConfigInt64(ctx, constants.PauseUnbond) > 0 {
60: 		return fmt.Errorf("unbonding has been paused")
61: 	}
62:
63: 	bp, err := h.mgr.Keeper().GetBondProviders(ctx, msg.NodeAddress)
64: 	if err != nil {
65: 		return ErrInternal(err, fmt.Sprintf("fail to get bond providers(%s)", msg.NodeAddress))
66: 	}
```

### Evidence 16

[x/thorchain/handler_rebond.go:90](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_rebond.go#L90) · full-file SHA-256 `882e9de69eb13fe7484eced7c5708bf7ce51eb9e3ffe32f8b6ce308d9df9a0fd`

```go
90: 	value := h.mgr.Keeper().GetConfigInt64(ctx, constants.HaltRebond)
91: 	if value > 0 {
92: 		return fmt.Errorf("rebond has been disabled by mimir")
93: 	}
94:
95: 	nodeAccount, err := h.mgr.Keeper().GetNodeAccount(ctx, msg.NodeAddress)
96: 	if err != nil {
97: 		return ErrInternal(err, fmt.Sprintf("fail to get node account(%s)", msg.NodeAddress))
```

### Evidence 17

[x/thorchain/handler_operator_rotate.go:51](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_operator_rotate.go#L51) · full-file SHA-256 `fee84368290a6788746b5dbab04c7240d2e302a83cf164d373827ab1f80108ef`

```go
51: 	haltOperatorRotate := h.mgr.Keeper().GetConfigInt64(ctx, constants.HaltOperatorRotate)
52: 	if haltOperatorRotate > 0 {
53: 		return fmt.Errorf("rotate is halted")
54: 	}
55:
56: 	// rotate is only allowed in the first half of churn
57: 	lastChurnHeight := getLastChurnHeight(ctx, h.mgr.Keeper())
58: 	churnInterval := h.mgr.Keeper().GetConfigInt64(ctx, constants.ChurnInterval)
```

### Evidence 18

[constants/constant_values.go:162](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/constants/constant_values.go#L162) · full-file SHA-256 `c7df08d7557f9fcb7642a0d1d9687180c0e74128453d51b64f1ea728652b62a6`

```go
162: 	HaltOracle
163: 	OracleUpdateInterval
```

### Evidence 19

[x/thorchain/manager_secured_asset_current.go:189](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_secured_asset_current.go#L189) · full-file SHA-256 `10648c9717c6299cc1f920a3a1b519f5157f8eeaa8977e6d2cbbfbbdea224daf`

```go
189: 	m, err := h.keeper.GetMimir(ctx, constants.MimirKeySecuredAssetHaltGlobal)
190: 	if err != nil {
191: 		return err
192: 	}
193: 	if m > 0 && m <= ctx.BlockHeight() {
194: 		return fmt.Errorf("secured assets are disabled")
195: 	}
196: 	return nil
```

### Evidence 20

[x/thorchain/handler_secured_asset_deposit.go:82](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_secured_asset_deposit.go#L82) · full-file SHA-256 `0567282a9ab3e00589b32363f5d90e7909ed10ab5177073c1c58fe40e52a942a`

```go
82: 	m, err := h.mgr.Keeper().GetMimirWithRef(ctx, constants.MimirTemplateSecuredAssetHaltDeposit, val)
83: 	if err != nil {
84: 		return err
85: 	}
86: 	if m > 0 && m <= ctx.BlockHeight() {
87: 		return fmt.Errorf("%s secured asset deposits are disabled", val)
88: 	}
89: 	return nil
```

### Evidence 21

[x/thorchain/handler_secured_asset_withdraw.go:44](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_secured_asset_withdraw.go#L44) · full-file SHA-256 `ae2b03850923e739a5a277e3301cfffb8e0262aebca3545e022e51725e221801`

```go
44: 	m, err := h.mgr.Keeper().GetMimirWithRef(ctx, constants.MimirTemplateSecuredAssetHaltWithdraw, msg.Asset.Chain.String())
45: 	if err != nil {
46: 		return err
47: 	}
48: 	if m > 0 && m <= ctx.BlockHeight() {
49: 		return fmt.Errorf("%s secured asset withdrawals are disabled", msg.Asset.Chain)
50: 	}
51:
```

### Evidence 22

[x/thorchain/handler_tcy_claim.go:49](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_tcy_claim.go#L49) · full-file SHA-256 `a7d385a87eed745b32614db89cfd88e222c76d1a82a69130fdcaf4b55e21f0c4`

```go
49: 	claimingHalt := h.mgr.Keeper().GetConfigInt64(ctx, constants.TCYClaimingHalt)
50: 	if claimingHalt > 0 {
51: 		return fmt.Errorf("tcy claiming is halted")
52: 	}
53:
54: 	if !msg.RuneAddress.IsChain(common.THORChain) {
55: 		return cosmos.ErrUnknownRequest("invalid rune address")
56: 	}
```

### Evidence 23

[x/thorchain/manager_network_current.go:2719](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_network_current.go#L2719) · full-file SHA-256 `cf84197fcc096d7f404d56882420f1b1f69f138f51ba74198511e57f7d4743c4`

```go
2719: 	claimingSwapHalt := vm.k.GetConfigInt64(ctx, constants.TCYClaimingSwapHalt)
2720: 	if claimingSwapHalt > 0 {
2721: 		ctx.Logger().Info("claiming module tcy swap is halted")
2722: 		return nil
2723: 	}
2724:
2725: 	claimingRuneBalance := mgr.Keeper().GetRuneBalanceOfModule(ctx, TCYClaimingName)
2726: 	if claimingRuneBalance.IsZero() {
```

### Evidence 24

[x/thorchain/handler_tcy_stake.go:47](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_tcy_stake.go#L47) · full-file SHA-256 `815e4f598b168bad0df78ea5d995342ee5faff9629f9ed6beea55b41ff7ed39f`

```go
47: 	stakingHalt := h.mgr.Keeper().GetConfigInt64(ctx, constants.TCYStakingHalt)
48: 	if stakingHalt > 0 {
49: 		return fmt.Errorf("tcy staking is halted")
50: 	}
51: 	return nil
52: }
53:
54: func (h TCYStakeHandler) handle(ctx cosmos.Context, msg MsgTCYStake) (*cosmos.Result, error) {
```

### Evidence 25

[x/thorchain/manager_network_current.go:2595](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_network_current.go#L2595) · full-file SHA-256 `cf84197fcc096d7f404d56882420f1b1f69f138f51ba74198511e57f7d4743c4`

```go
2595: 	tcyStakeDistributionHalt := vm.k.GetConfigInt64(ctx, constants.TCYStakeDistributionHalt)
2596: 	if tcyStakeDistributionHalt > 0 {
2597: 		ctx.Logger().Info("tcy stake distribution is halted")
2598: 		return
2599: 	}
2600:
2601: 	tcyStakeBalance := mgr.Keeper().GetRuneBalanceOfModule(ctx, TCYStakeName)
2602: 	tcyStakeRune := common.NewCoin(common.RuneNative, tcyStakeBalance)
```

### Evidence 26

[x/thorchain/handler_tcy_unstake.go:48](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_tcy_unstake.go#L48) · full-file SHA-256 `7b32e3ae106be93a1d0fc62a55bcfa770f94824219cad68cdb21b08336ef2925`

```go
48: 	unstakingHalt := h.mgr.Keeper().GetConfigInt64(ctx, constants.TCYUnstakingHalt)
49: 	if unstakingHalt > 0 {
50: 		return fmt.Errorf("tcy unstaking is halt")
51: 	}
52: 	return nil
53: }
54:
55: func (h TCYUnstakeHandler) handle(ctx cosmos.Context, msg MsgTCYUnstake) (*cosmos.Result, error) {
```

### Evidence 27

[x/thorchain/keeper/v1/keeper_halt.go:139](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/keeper/v1/keeper_halt.go#L139) · full-file SHA-256 `2329f2ed8297baacf0c3fff6560fb8e44ccc5809e10ad9dbda684eca1f5b3210`

```go
139: 	haltTCYTrading, err := k.GetMimir(ctx, "HaltTCYTrading")
140: 	if err == nil && (haltTCYTrading > 0 && haltTCYTrading <= ctx.BlockHeight()) {
141: 		ctx.Logger().Debug("TCY trading is halt")
142: 		return true
143: 	}
144:
145: 	return k.IsGlobalTradingHalted(ctx) || k.IsChainHalted(ctx, common.THORChain)
146: }
```

### Evidence 28

[x/thorchain/manager_wasm_current.go:306](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_wasm_current.go#L306) · full-file SHA-256 `4a17e56df8487f0307690ce923769f8e6b2ce675f0d0309161704cc51403c02d`

```go
306: 	v, err := m.keeper.GetMimir(ctx, constants.MimirKeyWasmHaltGlobal)
307: 	if err != nil {
308: 		return err
309: 	}
310: 	if v > 0 && ctx.BlockHeight() > v {
311: 		return errorsmod.Wrap(errors.ErrUnauthorized, "wasm halted")
312: 	}
313: 	return nil
```

### Evidence 29

[x/thorchain/manager_wasm_current.go:383](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_wasm_current.go#L383) · full-file SHA-256 `4a17e56df8487f0307690ce923769f8e6b2ce675f0d0309161704cc51403c02d`

```go
383: 	actorKey := actor.String()
384: 	v, err := m.keeper.GetMimirWithRef(ctx, constants.MimirTemplateWasmHaltDeployer, actorKey)
385: 	if err != nil {
386: 		return err
387: 	}
388: 	if v > 0 && ctx.BlockHeight() > v {
389: 		return errors.ErrUnauthorized
390: 	}
391: 	return nil
392: }
```

### Evidence 30

[x/thorchain/manager_wasm_current.go:331](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_wasm_current.go#L331) · full-file SHA-256 `4a17e56df8487f0307690ce923769f8e6b2ce675f0d0309161704cc51403c02d`

```go
331: 	encoder := base32.StdEncoding
332: 	encoded := encoder.EncodeToString(checksum)
333: 	key := strings.TrimRight(encoded, "=")
334: 	v, err := m.keeper.GetMimirWithRef(ctx, constants.MimirTemplateWasmHaltChecksum, key)
335: 	if err != nil {
336: 		return err
337: 	}
338: 	if v > 0 && ctx.BlockHeight() > v {
339: 		return errorsmod.Wrap(errors.ErrUnauthorized, "checksum halted")
340: 	}
341: 	return nil
342: }
```

### Evidence 31

[x/thorchain/manager_wasm_current.go:318](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_wasm_current.go#L318) · full-file SHA-256 `4a17e56df8487f0307690ce923769f8e6b2ce675f0d0309161704cc51403c02d`

```go
318: 	addrStr := address.String()
319: 	contractKey := addrStr[len(addrStr)-6:]
320: 	v, err := m.keeper.GetMimirWithRef(ctx, constants.MimirTemplateWasmHaltContract, contractKey)
321: 	if err != nil {
322: 		return err
323: 	}
324: 	if v > 0 && ctx.BlockHeight() > v {
325: 		return errorsmod.Wrap(errors.ErrUnauthorized, "contract halted")
326: 	}
327: 	return nil
328: }
```

### Evidence 32

[x/thorchain/handler_trade_account_deposit.go:41](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_trade_account_deposit.go#L41) · full-file SHA-256 `3b2eb2dc5cebaff6efc25850ce773a81e41d882704b39d615cd3cf3403be7369`

```go
41: 	tradeAccountsEnabled := h.mgr.Keeper().GetConfigInt64(ctx, constants.TradeAccountsEnabled)
42: 	tradeAccountsDepositEnabled := h.mgr.Keeper().GetConfigInt64(ctx, constants.TradeAccountsDepositEnabled)
43: 	if tradeAccountsEnabled <= 0 || tradeAccountsDepositEnabled <= 0 {
44: 		return fmt.Errorf("trade accounts are disabled")
45: 	}
46: 	if err := h.checkHalt(ctx, msg.Asset.Chain.String()); err != nil {
47: 		return err
48: 	}
```

### Evidence 33

[x/thorchain/handler_trade_account_deposit.go:42](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_trade_account_deposit.go#L42) · full-file SHA-256 `3b2eb2dc5cebaff6efc25850ce773a81e41d882704b39d615cd3cf3403be7369`

```go
42: 	tradeAccountsDepositEnabled := h.mgr.Keeper().GetConfigInt64(ctx, constants.TradeAccountsDepositEnabled)
43: 	if tradeAccountsEnabled <= 0 || tradeAccountsDepositEnabled <= 0 {
44: 		return fmt.Errorf("trade accounts are disabled")
45: 	}
46: 	if err := h.checkHalt(ctx, msg.Asset.Chain.String()); err != nil {
47: 		return err
48: 	}
49: 	return msg.ValidateBasic()
```

### Evidence 34

[x/thorchain/handler_trade_account_deposit.go:63](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_trade_account_deposit.go#L63) · full-file SHA-256 `3b2eb2dc5cebaff6efc25850ce773a81e41d882704b39d615cd3cf3403be7369`

```go
63: 	m, err := h.mgr.Keeper().GetMimirWithRef(ctx, constants.MimirTemplateTradeAssetHaltDeposit, val)
64: 	if err != nil {
65: 		return err
66: 	}
67: 	if m > 0 && m <= ctx.BlockHeight() {
68: 		return fmt.Errorf("%s trade asset deposits are disabled", val)
69: 	}
70: 	return nil
```

### Evidence 35

[x/thorchain/handler_trade_account_withdrawal.go:88](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_trade_account_withdrawal.go#L88) · full-file SHA-256 `4411dd1750935462f20d5260be82f2b373acfdf40967acb1b15bbd72eefdb3bb`

```go
88: 	m, err := h.mgr.Keeper().GetMimirWithRef(ctx, constants.MimirTemplateTradeAssetHaltWithdraw, val)
89: 	if err != nil {
90: 		return err
91: 	}
92: 	if m > 0 && m <= ctx.BlockHeight() {
93: 		return fmt.Errorf("%s trade asset withdrawals are disabled", val)
94: 	}
95: 	return nil
```

### Evidence 36

[x/thorchain/handler_swap.go:87](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_swap.go#L87) · full-file SHA-256 `dd17003b06aa975ed25f2cfa360a8dea25fea145aafb904741adcef8bb7584f2`

```go
87: 		if target.IsSyntheticAsset() && h.mgr.Keeper().GetConfigInt64(ctx, constants.ManualSwapsToSynthDisabled) > 0 {
88: 			// Reject manual swap attempts for minting synths (encouraging Trade Assets for manual swaps),
89: 			// allowing synth minting only in other contexts like with add liquidity memos (Savers) or internal memos.
90: 			return fmt.Errorf("manual swaps to synths not supported, use trade assets instead")
91: 		}
92: 	}
93:
94: 	if h.mgr.Keeper().IsTradingHalt(ctx, &msg) {
```

### Evidence 37

[x/thorchain/handler_rune_pool_deposit.go:57](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_rune_pool_deposit.go#L57) · full-file SHA-256 `9b5e6d0ef6dabaf81d0e4152948c3b82ffb3e4c291338ad1c1a72d2c0ea62235`

```go
57: 	runePoolEnabled := h.mgr.Keeper().GetConfigInt64(ctx, constants.RUNEPoolEnabled)
58: 	if runePoolEnabled <= 0 {
59: 		return fmt.Errorf("RUNEPool disabled")
60: 	}
61: 	runePoolDepositPaused := h.mgr.Keeper().GetConfigInt64(ctx, constants.RUNEPoolHaltDeposit)
62: 	if runePoolDepositPaused > 0 && ctx.BlockHeight() >= runePoolDepositPaused {
63: 		return fmt.Errorf("RUNEPool deposit paused")
64: 	}
```

### Evidence 38

[x/thorchain/ante.go:186](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/ante.go#L186) · full-file SHA-256 `63f0307b0ce73543c04b5d6214c634f196310177b5597e6a8288e3974c37aa57`

```go
186: 			enabled := ad.keeper.GetConfigInt64(ctx, constants.BankSendEnabled)
187: 			if enabled <= 0 {
188: 				return ctx, cosmos.ErrUnknownRequest("bank sends are disabled")
189: 			}
190: 		}
191: 		return SendAnteHandler(ctx, version, ad.keeper, m)
192: 	case *wasmtypes.MsgStoreCode,
193: 		*wasmtypes.MsgInstantiateContract,
```

## Unverified oracle consumer capture hashes

- [x/thorchain/manager_oracle_current.go](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/manager_oracle_current.go): `e602cc3ca470ed40d61b2fe258332060e2857db4cbecb4d677b527d518ca6c50`

- [x/thorchain/handler_price_feed_quorum_batch.go](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/handler_price_feed_quorum_batch.go): `97bf82ba2556e3cdb83378e997bf8d513811ed1d4fa7eb0ccde623e1ec60c245`

- [bifrost/oracle/oracle.go](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/bifrost/oracle/oracle.go): `5d2f99f318b2078dbcb842fed0a6b1e9f53eb0a9648bfdc61c839d1fdf733773`

## Asymmetric key origin

The chain key supplies the selector captured in Evidence 7; for single-address LPs the earlier branches take priority.

```go
66: 	pauseAsym, _ := mgr.Keeper().GetMimir(ctx, fmt.Sprintf("PauseAsymWithdrawal-%s", pool.Asset.GetChain()))
67: 	assetToWithdraw := assetToWithdraw(msg, lp, pauseAsym)
68:
```

## Baseline integer-default inventory

The complete integer-default block is captured below to make the absence of HaltRebond, HaltOperatorRotate and ManualSwapsToSynthDisabled entries reviewable offline. Missing entries use the captured GetInt64Value zero fallback; live omissions still do not apply that fallback in the wiki.

constants/constants_v1.go · SHA-256 `c81b473ce7ec60a8f1d3d8afd54d30b4a2773e6ac1f287413d9b73681e233b4f`

```go
6: 		int64values: map[ConstantName]int64{
7: 			EmissionCurve:                       6,
8: 			BlocksPerYear:                       5256000,
9: 			MaxRuneSupply:                       -1, // max supply of rune. Default set to -1 to avoid consensus failure
10: 			OutboundTransactionFee:              2_000000,
11: 			NativeOutboundFeeUSD:                2_000000, // $0.02 fee on all swaps and withdrawals
12: 			NativeTransactionFee:                2_000000,
13: 			NativeTransactionFeeUSD:             2_000000,           // $0.02 fee on all on chain txs
14: 			PoolCycle:                           43200,              // Make a pool available every 3 days
15: 			StagedPoolCost:                      10_00000000,        // amount of rune to take from a staged pool on every pool cycle
16: 			PendingLiquidityAgeLimit:            100800,             // age pending liquidity can be pending before its auto committed to the pool
17: 			MinRunePoolDepth:                    10000_00000000,     // minimum rune pool depth to be an available pool
18: 			MaxAvailablePools:                   100,                // maximum number of available pools
19: 			MinimumNodesForBFT:                  4,                  // Minimum node count to keep network running. Below this, Ragnarök is performed.
20: 			DesiredValidatorSet:                 100,                // desire validator set
21: 			AsgardSize:                          40,                 // desired node operators in an asgard vault
22: 			DerivedDepthBasisPts:                0,                  // Basis points to increase/decrease derived pool depth (10k == 1x)
23: 			DerivedMinDepth:                     100,                // in basis points, min derived pool depth
24: 			MaxAnchorSlip:                       1500,               // basis points of rune depth to trigger pausing a derived virtual pool
25: 			MaxAnchorBlocks:                     300,                // max blocks to accumulate swap slips in anchor pools
26: 			DynamicMaxAnchorSlipBlocks:          14400 * 14,         // number of blocks to sample in calculating the dynamic max anchor slip
27: 			DynamicMaxAnchorTarget:              0,                  // target depth of derived virtual pool (in basis points)
28: 			DynamicMaxAnchorCalcInterval:        14400,              // number of blocks to recalculate the dynamic max anchor
29: 			FundMigrationInterval:               360,                // number of blocks THORNode will attempt to move funds from a retiring vault to an active one
30: 			ChurnInterval:                       43200,              // How many blocks THORNode try to rotate validators
31: 			ChurnRetryInterval:                  720,                // How many blocks until we retry a churn (only if we haven't had a successful churn in ChurnInterval blocks
32: 			MissingBlockChurnOut:                0,                  // num of blocks a validator needs to NOT sign between churns
33: 			MaxMissingBlockChurnOut:             0,                  // max number of nodes to be churned out due to not signing blocks
34: 			MaxTrackMissingBlock:                700,                // maximum number of missing blocks to track for a block signer
35: 			BadValidatorRedline:                 3,                  // redline multiplier to find a multitude of bad actors
36: 			LackOfObservationPenalty:            2,                  // add two slash point for each block where a node does not observe
37: 			SigningTransactionPeriod:            300,                // how many blocks before a request to sign a tx by yggdrasil pool, is counted as delinquent.
38: 			DoubleSignMaxAge:                    24,                 // number of blocks to limit double signing a block
39: 			PauseBond:                           0,                  // pauses the ability to bond
40: 			PauseUnbond:                         0,                  // pauses the ability to unbond
41: 			MinimumBondInRune:                   1_000_000_00000000, // 1 million rune
42: 			MaxBondProviders:                    6,                  // maximum number of bond providers
43: 			MaxOutboundAttempts:                 0,                  // maximum retries to reschedule a transaction
44: 			SlashPenalty:                        15000,              // penalty paid (in basis points) for theft of assets
45: 			PauseOnSlashThreshold:               100_00000000,       // number of rune to pause the network on the event a vault is slash for theft
46: 			FailKeygenSlashPoints:               720,                // slash for 720 blocks , which equals 1 hour
47: 			FailKeysignSlashPoints:              2,                  // slash for 2 blocks
48: 			LiquidityLockUpBlocks:               0,                  // the number of blocks LP can withdraw after their liquidity
49: 			ObserveSlashPoints:                  1,                  // the number of slashpoints for making an observation (redeems later if observation reaches consensus
50: 			DoubleBlockSignSlashPoints:          1000,               // slash points for double block sign (3-4 days (over 43200 blocks) rewards lost from 5 minutes (50 blocks))
51: 			MissBlockSignSlashPoints:            1,                  // slash points for not signing a block
52: 			ObservationDelayFlexibility:         10,                 // number of blocks of flexibility for a validator to get their slash points taken off for making an observation
53: 			JailTimeKeygen:                      720 * 6,            // blocks a node account is jailed for failing to keygen. DO NOT drop below tss timeout
54: 			JailTimeKeysign:                     60,                 // blocks a node account is jailed for failing to keysign. DO NOT drop below tss timeout
55: 			NodePauseChainBlocks:                720,                // number of blocks that a node can pause/resume a global chain halt
56: 			NodeOperatorFee:                     500,                // Node operator fee
57: 			EnableDerivedAssets:                 0,                  // enable/disable swapping of derived assets
58: 			MinSwapsPerBlock:                    10,                 // process all swaps if queue is less than this number
59: 			MaxSwapsPerBlock:                    100,                // max swaps to process per block
60: 			EnableOrderBooks:                    0,                  // enable order books instead of swap queue
61: 			EnableAdvSwapQueue:                  0,                  // enable advanced swap queue, value of 2 skips limit swaps and forces all swaps to be market trades
62: 			AdvSwapQueueRapidSwapMax:            1,                  // maximum number of rapid swap iterations per block
63: 			VirtualMultSynths:                   2,                  // pool depth multiplier for synthetic swaps
64: 			VirtualMultSynthsBasisPoints:        10_000,             // pool depth multiplier for synthetic swaps (in basis points)
65: 			MaxSynthPerPoolDepth:                1700,               // percentage (in basis points) of how many synths are allowed relative to pool depth of the related pool
66: 			MaxSynthsForSaversYield:             0,                  // percentage (in basis points) synth per pool where synth yield reaches 0%
67: 			MinSlashPointsForBadValidator:       100,                // The minimum slash point
68: 			StreamingSwapPause:                  0,                  // pause streaming swaps from being processed or accepted
69: 			StreamingSwapMinBPFee:               0,                  // min swap fee (in basis points) for a streaming swap trade
70: 			StreamingSwapMaxLength:              14400,              // max number of blocks a streaming swap can trade for
71: 			StreamingSwapMaxLengthNative:        14400 * 365,        // max number of blocks native streaming swaps can trade over
72: 			StreamingLimitSwapMaxAge:            43200,              // max number of blocks a streaming limit swap can exist before completing (3 days)
73: 			MinCR:                               10_000,             // Minimum collateralization ratio (basis pts)
74: 			MaxCR:                               60_000,             // Maximum collateralization ratio (basis pts)
75: 			LendingLever:                        3333,               // This controls (in basis points) how much lending is allowed relative to rune supply
76: 			MinTxOutVolumeThreshold:             1000_00000000,      // total txout volume (in rune) a block needs to have to slow outbound transactions
77: 			TxOutDelayRate:                      25_00000000,        // outbound rune per block rate for scheduled transactions (excluding native assets)
78: 			TxOutDelayMax:                       17280,              // max number of blocks a transaction can be delayed
79: 			MaxTxOutOffset:                      720,                // max blocks to offset a txout into a future block
80: 			TNSRegisterFee:                      10_00000000,
81: 			TNSRegisterFeeUSD:                   10_00000000, // registration fee for new THORName in USD
82: 			TNSFeeOnSale:                        1000,        // fee for TNS sale in basis points
83: 			TNSFeePerBlock:                      20,
84: 			TNSFeePerBlockUSD:                   20,               // per block cost for TNS in USD
85: 			PermittedSolvencyGap:                100,              // the setting is in basis points
86: 			PermittedSolvencyGapUSD:             500_00000000,     // $500 USD in 1e8 notation
87: 			ValidatorMaxRewardRatio:             1,                // the ratio to MinimumBondInRune at which validators stop receiving rewards proportional to their bond
88: 			MaxNodeToChurnOutForLowVersion:      1,                // the maximum number of nodes to churn out for low version per churn
89: 			ChurnOutForLowVersionBlocks:         21600,            // the blocks after the MinJoinVersion changes before nodes can be churned out for low version
90: 			POLMaxNetworkDeposit:                0,                // Maximum amount of rune deposited into the pools
91: 			POLMaxPoolMovement:                  100,              // Maximum amount of rune to enter/exit a pool per iteration - 1 equals one hundredth of a basis point of pool rune depth
92: 			POLTargetSynthPerPoolDepth:          0,                // target synth per pool depth for POL (basis points)
93: 			POLBuffer:                           0,                // buffer around the POL synth utilization (basis points added to/subtracted from POLTargetSynthPerPoolDepth basis points)
94: 			RagnarokProcessNumOfLPPerIteration:  200,              // the number of LP to be processed per iteration during ragnarok pool
95: 			SynthYieldBasisPoints:               5000,             // amount of the yield the capital earns the synth holder receives if synth per pool is 0%
96: 			SynthYieldCycle:                     0,                // number of blocks when the network pays out rewards to yield bearing synths
97: 			MinimumL1OutboundFeeUSD:             1000000,          // Minimum fee in USD to charge for LP swap, default to $0.01 , nodes need to vote it to a larger value
98: 			MinimumPoolLiquidityFee:             0,                // Minimum liquidity fee made by the pool,active pool fail to meet this within a PoolCycle will be demoted
99: 			ChurnMigrateRounds:                  5,                // Number of rounds to migrate vaults during churn
100: 			AllowWideBlame:                      0,                // allow for a wide blame, only set in mocknet for regression testing tss keysign failures
101: 			MaxAffiliateFeeBasisPoints:          10_000,           // Max allowed affiliate fee basis points
102: 			TargetOutboundFeeSurplusRune:        100_000_00000000, // Target amount of RUNE for Outbound Fee Surplus: the sum of the diff between outbound cost to user and outbound cost to network
103: 			MaxOutboundFeeMultiplierBasisPoints: 30_000,           // Maximum multiplier applied to base outbound fee charged to user, in basis points
104: 			MinOutboundFeeMultiplierBasisPoints: 15_000,           // Minimum multiplier applied to base outbound fee charged to user, in basis points
105: 			EnableUSDFees:                       0,                // enable USD fees
106: 			PreferredAssetOutboundFeeMultiplier: 100,              // multiplier of the current preferred asset outbound fee, if rune balance > multiplier * outbound_fee, a preferred asset swap is triggered
107: 			FeeUSDRoundSignificantDigits:        2,                // number of significant digits to round the RUNE value of USD denominated fees
108: 			MigrationVaultSecurityBps:           0,                // vault bond must be greater than bps of funds value in rune to receive migrations
109: 			CloutReset:                          720,              // number of blocks before clout spent gets reset
110: 			CloutLimit:                          0,                // max clout allowed to spend
111: 			KeygenRetryInterval:                 0,                // number of blocks to wait before retrying a keygen
112: 			SaversStreamingSwapsInterval:        0,                // For Savers deposits and withdraws, the streaming swaps interval to use for the Native <> Synth swap
113: 			RescheduleCoalesceBlocks:            0,                // number of blocks to coalesce rescheduled outbounds
114: 			TradeAccountsEnabled:                0,                // enable/disable trade account
115: 			TradeAccountsDepositEnabled:         1,
116: 			EVMDisableContractWhitelist:         0,                  // enable/disable contract whitelist
117: 			OperationalVotesMin:                 3,                  // Minimum node votes to set an Operational Mimir
118: 			MemolessTxnTTL:                      3600,               // number of blocks before a memoless txn expires
119: 			MemolessTxnRefCount:                 99_999,             // max number of reference ids per chain
120: 			MemolessTxnCost:                     0,                  // additional cost in RUNE to register a memoless txn (operational mimir)
121: 			MemolessTxnMaxUse:                   1,                  // maximum times a reference id can be utilized before refunding (operational mimir)
122: 			L1SlipMinBps:                        0,                  // Minimum L1 asset swap fee in basis points
123: 			TradeAccountsSlipMinBps:             0,                  // Minimum trade asset swap fee in basis points
124: 			SecuredAssetSlipMinBps:              5,                  // Minimum secured asset swap fee in basis points
125: 			SynthSlipMinBps:                     0,                  // Minimum synth asset swap fee in basis points
126: 			DerivedSlipMinBps:                   0,                  // Minimum derived asset swap fee in basis points
127: 			StableSlipMinBps:                    0,                  // Minimum swap fee in basis points for stable-to-stable swaps
128: 			WasmArbSlipMinBps:                   10,                 // Minimum swap fee in basis points for swaps originating from WasmArbContract
129: 			SlipMinBpsMax:                       100,                // Maximum slip min bps for all asset types
130: 			RUNEPoolEnabled:                     0,                  // enable/disable RUNE Pool
131: 			RUNEPoolDepositMaturityBlocks:       14400 * 90,         // blocks from last deposit to allow withdraw
132: 			RUNEPoolMaxReserveBackstop:          5_000_000_00000000, // 5 million RUNE
133: 			SaversEjectInterval:                 0,                  // number of blocks for savers check, disabled if zero
134: 			SystemIncomeBurnRateBps:             1,                  // burn 1bps (0.01%) RUNE of all system income per ADR 17
135: 			DevFundSystemIncomeBps:              500,                // allocate 500bps (5%) RUNE of all system income to dev fund per ADR 18
136: 			MarketingFundSystemIncomeBps:        500,                // allocate 500bps (5%) RUNE of all system income to marketing fund per ADR 21
137: 			PendulumAssetsBasisPoints:           10_000,             // Incentive curve adjustment lever to proportionally underestimate or overestimate Assets needing to be secured.
138: 			PendulumUseEffectiveSecurity:        0,                  // If 1, use the effective security bond (the bond sacrificable to seize L1 Assets) as the securing bond for which to target double the value of the secured Assets. If 0, instead use the whole (rewards-receiving) total effective bond.
139: 			PendulumUseVaultAssets:              0,                  // If 1. use the L1 Assets in the vaults (the Assets seizable by the lower-bond 2/3rds of nodes in each vault) as the Assets to be secured.  If 0, instead use only the L1 Assets in pools, ignoring the L1 Assets in for instance streaming swaps, oversolvencies, and Trade/Bridge Assets.
140: 			TVLCapBasisPoints:                   0,                  // If 0, TVL Cap is set to the effective active bond. If non-zero, the value is interrupted as basis points relative to total active bond
141: 			MultipleAffiliatesMaxCount:          5,                  // maximum number of nested affiliates
142: 			BondSlashBan:                        5_000_00000000,     // 5000 RUNE - amount to slash bond of banned nodes
143: 			BankSendEnabled:                     0,                  // enable/disable cosmos bank send messages
144: 			RUNEPoolHaltDeposit:                 0,                  // enable/disable RUNEPool deposit (block height)
145: 			RUNEPoolHaltWithdraw:                0,                  // enable/disable RUNEPool withdraw (block height)
146: 			MinRuneForTCYStakeDistribution:      2_100_00000000,     // Set what is the minimum amount of rune need it on TCY fund in order to be distributed
147: 			MinTCYForTCYStakeDistribution:       100000,             // Set what is the minimum amount of TCY need it on TCY fund in order to be distributed
148: 			TCYStakeSystemIncomeBps:             1000,               // allocate 1000bps (10%) RUNE of all system income to TCY Fund
149: 			TCYClaimingSwapHalt:                 1,                  // enable/disable claiming module rune to tcy swap
150: 			TCYStakeDistributionHalt:            1,                  // enable/disable tcy stake distribution
151: 			TCYStakingHalt:                      1,                  // enable/disable tcy staking
152: 			TCYUnstakingHalt:                    1,                  // enable/disable tcy unstaking
153: 			TCYClaimingHalt:                     1,                  // enable/disable tcy claiming
154: 			ReserveMaxCap:                       0,                  // maximum reserve balance before EmissionCurve is overridden, 0 = disabled
155: 			MaxDepositTxIDRetries:               100,                // maximum retries for deposit txid auto-increment to avoid collisions
156: 			OverSolvencyToTreasuryBps:           0,                  // basis points (0-10000) of over-solvent liquidity to swap to RUNE and transfer to over-solvency sweep destination address
157: 			OverSolvencyCheckInterval:           600,                // interval in blocks for over-solvency checks (approximately 30 days)
158: 			MaxRetiredVaultRecoveryAttempts:     100,                // maximum retries for retired vault recovery refunds
159: 			ModifyLimitSwapMaxIterations:        100,                // maximum iterations when searching for a user's swap in a ratio-grouped index
160: 			POLReserveSystemIncomeBps:           0,                  // basis points of system income routed to POL reserve, 0 = disabled
161: 			POLReserveMaxDeployment:             10_000_000_000,     // maximum RUNE deployed per pool per block (100 RUNE in 1e8 units)
162: 			StableReserveEnabled:                0,                  // enable/disable Stable Reserve
163: 			StableReserveDepegToleranceBps:      100,                // maximum stable oracle deviation from $1 in basis points
164: 			StableReservePOLShareBps:            0,                  // share of POLReserveSystemIncomeBps routed to Stable Reserve
165: 			StableReserveWithdrawalRequestMax:   10_000,             // maximum request coin amount accepted for Stable Reserve withdrawals
166: 			StableReserveOraclePricing:          0,                  // 0 = fill stable reserve swaps 1:1, 1 = scale the fill by the oracle price ratio
167: 			L1DynamicFeeEnabled:                 0,                  // enable/disable dynamic L1 min fee
168: 			L1DynamicFeeEpochBlocks:             14400,              // number of blocks per dynamic fee epoch
169: 			L1DynamicFeeFloorBPS:                1,                  // floor basis points for dynamic L1 min fee
170: 			L1DynamicFeeCeilingBPS:              20,                 // ceiling basis points for dynamic L1 min fee
171: 			L1DynamicFeeStepBPS:                 1,                  // step basis points for dynamic L1 min fee adjustment
172: 			L1DynamicFeeDeadbandBPS:             1000,               // % change in fees_rune (in bps, 10000 = 100%) below which the dynamic L1 fee controller holds
173: 			L1DynamicFeeWindowEpochs:            3,                  // epochs averaged on each side of the last bps change when measuring the fees_rune gradient (clamped into [1, MaxDynamicFeeHistory])
174: 			VaultDeficitGasHaltMaxGasMultiplier: 30,                 // multiple of current max gas at which gas-related vault deficits halt signing and trading
175: 			MaxAbsentKeygenReporters:            1,                  // number of keygen members allowed to skip MsgTssPool reporting before a successful keygen finalizes (mainnet default)
176: 		},
```
