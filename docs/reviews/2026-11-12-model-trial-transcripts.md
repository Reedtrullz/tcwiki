# Model trial transcripts - 2026-11-12

Raw answers captured for the model trials. Inputs:

- Commit: `2024ad2c04f40551422f8f673ecfbec827f9f08d`
- Captured: 2026-11-12T03:08:25.329Z
- CLP text: 9142 chars, SHA-256 `6f9b11132758193a8cb98ecfa8c72123f0d57417009bc03405ffa636d76c133a`
- Home text: 6284 chars, SHA-256 `bda245e27501d5e8bb3c6530abde55daba7bc46968eebde33bbd0a84490f5efd`
- Stats text: 15538 chars, SHA-256 `4732a01e52e126115be792ffb4afc1437736bcce93ee4bcc4aef1f7581e122e2`

Prompts and scoring are in `2026-11-12-model-trial-protocol.md`.

## openai/gpt-6-luna - clp

Status 200, 7629 ms, finish stop.

```text
1. With input 200 and both depths at 1,000, the lab shows **slip: 16.66666667%**, **liquidity fee: 27.77777777 output-side units**, and **output: 138.88888888 output-side units**.
2. The lab is a fixed-depth algebraic model, so it does not tell you whether a real swap can execute or what its exact result will be.
3. Check a **fresh THORNode quote** for the specific route and **Network diagnostics** for current availability.
```

## openai/gpt-6-luna - reader

Status 200, 11719 ms, finish stop.

```text
1. **Learning sequence and checking current availability**
   - Start with the **New to THORChain** learning path: RUNE settlement, pool mechanics, live-data source boundaries, chain observation, and vault signing. Its first link is **“Start with RUNE as the Universal Settlement Asset.”**
   - Before claiming something is available, use **Network diagnostics** for current THORNode evidence. The page says to review control applicability and the exact THORNode source revision; raw Mimir observations alone do not prove swap availability. For an interface-specific action, also use the **Interface checklist**.

2. **An available pool row does not mean a swap route will execute.**
   - On `/stats`, the rows come from Midgard’s `/pools?status=available` data. They show liquidity context, not proof that a specific route will quote or settle.
   - Likewise, healthy-looking Midgard sync or loaded metrics do not override a THORNode pause or source warning. Check a **THORNode quote**, source freshness, and **Network diagnostics** separately; verify route quality and applicable operational controls too.

3. **Builder evidence path: current controls versus indexed metrics**
   - For **current controls**, use **Network diagnostics** and THORNode/Mimir evidence, reviewing applicability and source revision. The diagnostics shown on `/stats` were checked **2026-11-12** and are marked degraded, with controls needing review.
   - For **indexed metrics and historical intervals**, use Midgard. For example, the `/stats` earnings history is a Midgard snapshot checked **2026-11-12**, with daily intervals shown for **2026-10-14 through 2026-11-12**; one interval is unavailable.
   - A current halt describes present operational evidence; it does not establish why a past metric or event occurred. The historical intervals and current THORNode controls are separate evidence, and the page cautions against over-reading the earnings chart.
```

## deepseek/deepseek-v4-pro - clp

Status 200, 21189 ms, finish stop.

```text
1. With input 200, input-side depth 1000, output-side depth 1000:
   - Slip: **16.66666667%**
   - Liquidity fee: **27.77777778** output-side units
   - Output after liquidity fee: **138.88888889** output-side units

2. This lab does not tell you whether a real swap can actually execute or what live streaming, queue ordering, two-pool routing, fee floors, outbound fees, rounding rules, and halt state would apply.

3. Check **Network diagnostics** on the site for live operational state, and/or a fresh **THORNode quote** for the specific route.
```

## deepseek/deepseek-v4-pro - reader

Status 200, 60842 ms, finish stop.

```text
1. **Newcomer starting point and live availability check**

   - **Start in sequence:** on the main page, use **“Learn in Sequence” → “New to THORChain”**. The page says to begin with **“Start with RUNE as the Universal Settlement Asset”**, then use **“Verify before claiming: Current supported chains, halts, or inbound-address availability.”**
   - **Check what is available right now:** use the main page **“Live Operations Snapshot”** / **“Check live operations”**, especially the **“LOOK HERE FIRST / ORDINARY SWAPS / Review applicability”** area and **“Open diagnostics.”** Also use **“VERIFY FIRST → Network diagnostics”** to check live operational state.

2. **Practical user on `/stats`**

   - **No.** An available-pool row or a healthy-looking metric does **not** mean a chosen swap route will execute.
   - **Source/caveat:** pool rows are Midgard `/pools?status=available` rows. The page explicitly says: **“Pool rows show liquidity context. A current route still needs a THORNode quote, source freshness, and network diagnostics.”** It also says: **“A healthy-looking Midgard number does not override a current THORNode pause or source warning.”**
   - **Separate checks:** you still need a **current THORNode quote**, **operational availability** / **network diagnostics**, **source freshness**, and route-specific quote/settlement evidence.

3. **Builder evidence path and current halt vs historical cause**

   - The relevant builder path is **“Build And Query THORChain Data”** under **“Learn in Sequence → Build And Query.”** It says to connect **source-family boundaries, halt controls, quote/refund behavior, and interface checks** before shipping a data/transaction workflow.
   - For security/availability claims involving halt controls, also use **“Network Security → Mimir And Halt Controls.”**

   - **From `/stats`:**
     - Current controls source/date: **THORNode via Liquify, checked `2026-11-12T03:08:21.777Z`**, showing **“Pool deposits: paused; Churning: halted; Bonding: paused; WASM/app layer: halted”** and **2 source warnings**.
     - Indexed historical metrics source/date: **Midgard via Liquify, checked `2026-11-12T03:08:21.228Z`**, under **“Earnings History”** / **“Historical intervals”**, with loaded daily intervals from **2026-10-14** through **2026-11-12**.

   - **Why a current halt does not prove a historical cause:** the current THORNode snapshot only establishes **present** operational controls. It does not establish why or whether past Midgard intervals were affected. Historical causation would require separate historical/curated incident context, not a current Mimir/THORNode observation. The page also labels the data as **“current-only from Midgard/THORNode sources.”**
```

## xai/grok-4.7 - clp

Status 200, 18256 ms, finish stop.

```text
1. Slip **16.66666666%**, liquidity fee **27.77777777**, output **138.88888888** (eight model decimals, rounded down). With \(x=200\), \(X=1000\), \(Y=1000\): slip \(=200/1200\); fee \(=(200^2\cdot1000)/1200^2=250/9\); output \(=(200\cdot1000\cdot1000)/1200^2=1250/9\).

2. It is only one fixed-depth algebraic leg, not a quote or proof a route can execute, and it omits live balances, streaming, queue ordering, two-pool routing, live fee floors, outbound fees, rounding rules, and halt state.

3. A fresh THORNode quote for that route, plus Network diagnostics (live inbound-address and pool status); Midgard/THORNode are the live sources, and Streaming Swaps And Refunds covers refund and failed-swap checks.
```

## xai/grok-4.7 - reader

Status 200, 26507 ms, finish stop.

```text
**1. Newcomer path and “right now” checks**

Start under **Learn in Sequence** on `/`, in the **New to THORChain** path: “Start with RUNE as the Universal Settlement Asset,” then pool mechanics, live-data source boundaries, chain observation, and vault signing—before using dashboard numbers. “Verify before claiming” lists current supported chains, halts, and inbound-address availability.

For whether something is available now, use **Check live operations** / **Live Operations Snapshot** (and **Open diagnostics** / **Network diagnostics**). That snapshot is current-only THORNode evidence and is meant to come before present-tense claims about swaps, LP actions, signing, TCY, or routes. The compact view only says ordinary swaps, limited chains, and other operations **need applicability review**; raw Mimir keys stay in diagnostics.

**2. Available-pool row or healthy metric ≠ a swap will execute**

No. On `/stats`, the **36 Midgard available-pool rows** (14 chains; e.g. deepest **BTC.BTC**) are liquidity context from **Liquify Midgard**, checked **2026-11-12T03:08:21.228Z** (Midgard ok, 1 block lag). The page says these rows are **not route-quote proof**, and loaded status/rates do **not** prove route availability, settlement, or future yield. A healthy Midgard number also does **not** override a current THORNode pause or source warning.

Still separate: a **THORNode quote**, **source freshness**, and **network diagnostics**. At the same check window, operations are **Degraded** (THORNode **3.21.3**, height **28634761**, checked **2026-11-12T03:08:21.777Z**): ordinary swaps need source review, pool deposits paused, churning halted, bonding paused, WASM/app layer halted, with source warnings.

**3. Builder evidence: current controls vs indexed history**

Use **Build And Query** on `/` (“Build And Query THORChain Data”) and, from `/stats` **Related Checks**, the **Build/query path** plus the **live data guide** (Midgard dashboard metrics vs THORNode raw state) and **Network diagnostics**.

- **Current controls:** THORNode / Mimir (halt, pause, signing, trading). Example: the degraded operational snapshot above, **2026-11-12T03:08:21.777Z**.
- **Indexed historical metrics:** Midgard intervals and aggregates. Example: earnings history via Liquify Midgard, same **2026-11-12T03:08:21.228Z** check—**29/30** usable daily totals (latest valid-window total **2,844,531 RUNE**); **2026-11-12 UTC** is an incomplete interval marked unavailable. Daily volume is the last **completed** UTC day (**2026-11-11**, network **$180.2M**).

A current halt does not prove a historical cause because the pages treat those as different proof paths: the halt is a **current-only** THORNode classification at that timestamp, while earnings and volume are **past Midgard intervals**. The wiki says to match source to claim and not to read one signal as the other (a Midgard number does not override a pause; pool rows and APY do not prove routes, causes, or recovery).
```
