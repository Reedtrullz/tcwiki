# PR-67 transaction source research

Observation date: 2026-10-03 (UTC). Bounded public-source review for issue [#202](https://github.com/Reedtrullz/tcwiki/issues/202). Midgard and THORNode requests used Liquify gateway; Bitcoin transaction corroboration used mempool.space. Each request had a 15 s timeout and a 512 KiB decoded-body ceiling. Midgard fallback DNS was unavailable as previously observed. This is selection research, not application implementation or a claim that provider indexing is a protocol proof.

## Primary syntax source

Pinned THORNode `v3.20.3`, commit [`b08d81f79275093b0fcb753e0d68ff1c16c51cb8`](https://gitlab.com/thorchain/thornode/-/blob/b08d81f79275093b0fcb753e0d68ff1c16c51cb8/x/thorchain/memo/memo.go), `stringToTxTypeMap` (lines 59–90): `=` and `s` map to swap; `out` maps to outbound; `refund` maps to refund; `migrate` maps to migrate. THORNode lowercases the memo token before lookup. The exact original memo remains the source string; parsed fields below are a separate interpretation.

## Candidate: successful BTC → TRON swap

- Exact observed memo: `=:tr:TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya:0/1/0`
- Parsed by pinned syntax: `=` = swap; `tr` is the asset shorthand in this memo; destination `TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya`; limit/streaming tuple `0/1/0` retained verbatim. No wider semantic claim is made for the tuple here.
- Bitcoin inbound: tx [`d9e6621125467b58b6ebe424cd83a179d78f4c6e5fac16e17f39c1516cb0322f`](https://mempool.space/tx/d9e6621125467b58b6ebe424cd83a179d78f4c6e5fac16e17f39c1516cb0322f), block 969681, hash `0000000000000000000117ce66fe52ea9dcd22d47f2b7ff905b21f79a567ab56`, time `2026-10-03T05:38:13Z`. Independent Bitcoin API response SHA-256 `d6156db728543c4eb7292dbc3afa40143db10a6a9f769dc5bcdb1294e524448d`.
- Midgard action: [lookup](https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=D9E6621125467B58B6EBE424CD83A179D78F4C6E5FAC16E17F39C1516CB0322F), observed height `28081155`, time `2026-10-03T05:39:15Z`; status `success`; output height `28081160`, output tx `C9B90A7C09BAA06E3CED8F17EE39A19A4D1F97399811D6908AA3956C7C65444A` (chain ref: [RuneScan](https://runescan.io/tx/C9B90A7C09BAA06E3CED8F17EE39A19A4D1F97399811D6908AA3956C7C65444A)). It reports `10180 BTC.BTC` in and `2422777500 TRON.TRX` out in base units. Provider status and record do not establish recipient control or user receipt.
- Captured response SHA-256 `0cfd9b659cb450d7915af928743a8450eda4c1298d1994c5d96148d0ffdc57fb`.

## Candidate: refund action, settlement unresolved

- Midgard [refund action](https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=C573218772AAA37B72F45C220B874BDDED6ED755250596307C28C08E80D10F91), observed at THORChain height `28081517`, time `2026-10-03T06:16:38Z`, input tx ID `C573218772AAA37B72F45C220B874BDDED6ED755250596307C28C08E80D10F91`; response type `refund`, status `pending`, no outbound entries. Midgard records input asset `ETH~USDC-0XA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48`, amount `4571427086` base units.
- Exact memo preserved by the refund metadata: `=:TRON~USDT-TR7NHQJEKQXGTCI8Q8ZY4PL8OTSZGJLJ6T:thor17hwqt302e5f2xm4h95ma8wuggqkvfzgvsnh5z9:4575592086/1/1`. It is the swap memo associated with the failed price-limit attempt; the provider reason is `emit asset 4573885300 less than price limit 4575592086`.
- The response identifies no source-chain block or refund outbound tx. Thus refund handling is observed, but refund settlement, destination-chain inclusion, and completion remain **unknown**. Do not describe this as a completed refund.
- Captured response SHA-256 `79e36f9bd8be79647cbc72270506288f71bc57fa5311023b5fc4780d4d3ff06a`.

## Candidate: Bitcoin outbound bytes and Midgard trade action are complementary layers

- Exact payload text in the captured Bitcoin transaction: `OUT:00000650D568062B71D1BF4F0F4EEFED44C3F6FB7ED3F6DBB08E962F492107C6` (68-byte OP_RETURN payload). Pinned syntax maps `OUT` case-insensitively to outbound; remainder is retained as the referenced hash.
- Bitcoin tx [`7062ec072b05066dd1c6b2cf259b1275ec40e4c188ff55a4ceef94100b70de3c`](https://mempool.space/tx/7062ec072b05066dd1c6b2cf259b1275ec40e4c188ff55a4ceef94100b70de3c), included in block 969681, hash `0000000000000000000117ce66fe52ea9dcd22d47f2b7ff905b21f79a567ab56`, time `2026-10-03T05:38:13Z`. The OP_RETURN does not prove what the referenced hash represents.
- Midgard [lookup by Bitcoin txid](https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=7062EC072B05066DD1C6B2CF259B1275EC40E4C188FF55A4CEEF94100B70DE3C) links it as an output (`out[].txID`) in a `trade` action, status `success`, at THORChain height `28081053`; output height `28081065`, amount `35663524 BTC.BTC` to `13i9ZaXBYJ74qPuK7JrJ6Znws5uTa37vQt`. These labels describe complementary layers: `OUT` is the Bitcoin transaction role, while `trade` is Midgard's encompassing action category. Preserve both without treating them as a disagreement.
- Midgard response SHA-256 `aa1707b1383ff13b33402f02403af1041ed66c76fe871de4978fd14968d41722`. Independent mempool.space response SHA-256 `f7e3e8216e3df03991861b0438fbf166de442c935998ef05e74e02546b36710d`.

## Official migration example rejected; separate Ethereum source-chain record

The official [THORChain developer memo documentation](https://dev.thorchain.org/concepts/memos.html) includes a migration example and links RuneScan tx [`8330CAC064370F86352D247DE3046C9AA8C3E53C78760E5D35CFC7CAA3068DC6`](https://runescan.io/tx/8330CAC064370F86352D247DE3046C9AA8C3E53C78760E5D35CFC7CAA3068DC6). Midgard [lookup](https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=8330CAC064370F86352D247DE3046C9AA8C3E53C78760E5D35CFC7CAA3068DC6) resolves that ID to a successful ETH→BTC `swap` at height `14750961`, memo `=:BTC.BTC:bc1qwlnvnq68dn0wllzjhxzm0sl2f6cnwvwlmdd33h:0/1/0:td:70`, with outbound at height `14750965`; it is not a vault migration and is excluded as a migration fixture.

## Captures and research boundary

Ignored raw-response captures are under `.superpowers/sdd/2026-10-02-entire-workplan/` with `pr67-` prefixes. The previously captured developer memo HTML SHA-256 is `cf695b347c1a1ec182b85a825b6750c8c09d75d697c94c8929c6ca092e0dcd0d`; the Bitcoin outbound capture hash is listed above. No private Discord material was consulted. At this initial research stage, no application/content files had been changed; the bounded follow-up below supplies the separate migration-memo candidate while leaving its THORChain lifecycle unknown.

## Bounded migration-source follow-up (2026-10-03)

The Ethereum transaction [`0x5d8d1807308d7018e49eefb07dcd4613b6b6a174daa7c5906e22f7479d505586`](https://eth.blockscout.com/tx/0x5d8d1807308d7018e49eefb07dcd4613b6b6a174daa7c5906e22f7479d505586) was captured from the Blockscout API (`pr67-migrate-blockscout.json`; SHA-256 `07a3b59c0c7192558bf51f45199c7fe0e90c6ba5edd8a4697502619590d9a5a5`). The response reports timestamp `2024-09-27T19:59:59Z`, status `ok`, EVM result `success`, and `block_number=20844210` (its separate `block` field is null). Decoded `transferAllowance` calldata carries `MIGRATE:17894403`; `17894403` is the THORChain memo-height parameter, distinct from Ethereum block `20844210`. The decoded amount `544915588553` is the raw Ethereum USDC token `uint256`, not THORChain 1e8 units. This establishes captured source-chain/provider evidence only.

The exact EVM transaction hash lookup against [Midgard actions](https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=0x5d8d1807308d7018e49eefb07dcd4613b6b6a174daa7c5906e22f7479d505586) returned zero actions (94-byte body; SHA-256 `1f5cc360dd9cc583655e8667412170fefce44e7780a5ae5c8ccda3aa88e48d83`). A matched THORChain migration lifecycle, vault move, and completion therefore remain unknown. Do not infer destination settlement or ownership from this provider record.

The four curated examples use these separate evidence scopes: Bitcoin inbound plus Midgard swap action; pending Midgard refund without outbound; Bitcoin `OUT` role alongside Midgard `trade` action; and this Ethereum migration-memo transaction alongside a zero-action Midgard lookup. They preserve raw strings and provider response hashes and do not claim destination receipt or a completed migration.
