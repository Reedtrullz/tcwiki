import type { SourceMeta } from '@/lib/types';

export const thorchainDocsSource: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
  retrievedAt: '2026-07-02',
  notes: 'Official documentation root used for curated protocol background; it still describes GG20 at review time, but current safety and migration state require dated incident and release sources.',
};

export const thorchainDevDocsSource: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
  retrievedAt: '2026-07-02',
  notes: 'Official developer documentation root used for API and integration concepts; pair with live endpoints for current state.',
};

export const thorchainFaqSource: SourceMeta = {
  label: 'THORChain FAQ',
  url: 'https://docs.thorchain.org/thornodes/frequently-asked-questions',
  retrievedAt: '2026-07-13',
  notes: 'Official FAQ source for the 2018 founding year; it does not provide a more precise founding date.',
};

export const multichainChaosnetLaunchSource: SourceMeta = {
  label: 'THORChain Multichain Chaosnet launch',
  url: 'https://medium.com/thorchain/thorchain-launch-multichain-chaosnet-bb9f60008a03',
  retrievedAt: '2026-07-13',
  notes: 'Contemporaneous THORChain launch announcement for Multichain Chaosnet on 2021-04-13; the article explicitly describes safeguards and a future path to mainnet.',
};

export const thornodeV300TagSource: SourceMeta = {
  label: 'THORNode v3.0.0 tag',
  url: 'https://gitlab.com/thorchain/thornode/-/tags/v3.0.0',
  retrievedAt: '2026-07-13',
  notes: 'Official THORNode release tag created on 2024-12-11 with the v3.0.0 change list.',
};

export const thorchain2024YearEndSource: SourceMeta = {
  label: 'THORChain 2024 year-end report',
  url: 'https://blog.thorchain.org/thorchain-2024-year-end-report-q4-report/',
  retrievedAt: '2026-07-13',
  notes: 'Official Q4 report describing the Cosmos SDK v0.50 upgrade as groundwork for future CosmWasm App Layer functionality.',
};

export const swapkitDocsSource: SourceMeta = {
  label: 'SwapKit SDK documentation',
  url: 'https://swapkit.github.io/SwapKit/',
  retrievedAt: '2026-07-13',
  notes: 'Project-maintained SDK documentation for cross-chain integrations, supported chains, wallets, and THORChain integration; current package behavior still needs direct testing.',
};

export const xchainJsSource: SourceMeta = {
  label: 'XChainJS',
  url: 'https://xchainjs.org/',
  retrievedAt: '2026-07-13',
  notes: 'Project-maintained source for the cross-chain TypeScript toolkit and its supported-chain framing; confirm package-specific releases before integration.',
};

export const liquidityProvidersSource: SourceMeta = {
  label: 'Liquidity Providers',
  url: 'https://docs.thorchain.org/technical-documentation/understanding-thorchain/roles/liquidity-providers',
  retrievedAt: '2026-07-14',
  notes: 'Official LP role, symmetric/asymmetric deposit framing, withdrawal model, fee income, and impermanent-loss risk; current LP controls and APY still need live evidence.',
};

export const continuousLiquidityPoolsSource: SourceMeta = {
  label: 'Continuous Liquidity Pools',
  url: 'https://docs.thorchain.org/technical-documentation/thorchain-finance/continuous-liquidity-pools',
  retrievedAt: '2026-07-14',
  notes: 'Official CLP mechanism and historical IL-protection reference; it explicitly says IL protection was removed, while current route, depth, and yield claims still need live evidence.',
};

export const runeDocsSource: SourceMeta = {
  label: 'THORChain RUNE docs',
  url: 'https://docs.thorchain.org/technical-documentation/understanding-thorchain/rune',
  retrievedAt: '2026-07-14',
  notes: 'Official RUNE settlement, liquidity, security, governance, and incentive framing; broad value/security statements remain design claims rather than current market or safety proof.',
};

export const nativeSwapsSource: SourceMeta = {
  label: 'Native cross-chain swaps',
  url: 'https://docs.thorchain.org/native-cross-chain-swaps',
  retrievedAt: '2026-07-14',
  notes: 'Official user-facing explanation of native cross-chain swaps routing internally through RUNE-paired pools; current execution still needs quote and operational evidence.',
};

export const liquidityProviderFaqSource: SourceMeta = {
  label: 'Liquidity Providers FAQ',
  url: 'https://docs.thorchain.org/thornodes/frequently-asked-questions/liquidity-providers',
  retrievedAt: '2026-07-14',
  notes: 'Official FAQ for asymmetric deposit and withdrawal rules, fees, liquidity-unit ownership, and position caveats; live controls own current action availability.',
};

export const cosmWasmSource: SourceMeta = {
  label: 'CosmWasm',
  url: 'https://docs.thorchain.org/technical-documentation/technology/cosmwasm',
  retrievedAt: '2026-07-04',
  notes: 'Official app-layer technology reference; current contract availability depends on live controls.',
};

export const queryingThorchainSource: SourceMeta = {
  label: 'Querying THORChain',
  url: 'https://dev.thorchain.org/concepts/querying-thorchain.html',
  retrievedAt: '2026-07-05',
  notes: 'Developer docs reference for THORNode and Midgard endpoint usage.',
};

export const connectingThorchainSource: SourceMeta = {
  label: 'Connecting to THORChain',
  url: 'https://dev.thorchain.org/concepts/connecting-to-thorchain.html',
  retrievedAt: '2026-07-06',
  notes: 'Official source-family guide for Midgard, THORNode, Cosmos RPC, Tendermint RPC, gRPC, rate limits, x-client-id, and production node guidance.',
};

export const chainClientsSource: SourceMeta = {
  label: 'THORChain Chain Clients',
  url: 'https://dev.thorchain.org/chain-clients/',
  retrievedAt: '2026-07-14',
  notes: 'Official Bifrost chain-client reference showing the current client families, including the Solana client and its EdDSA Base58 address derivation.',
};

export const supportedBlockchainsSource: SourceMeta = {
  label: 'THORChain supported blockchains overview',
  url: 'https://docs.thorchain.org/what-is-thorchain-and-rune#supported-blockchains',
  retrievedAt: '2026-07-14',
  notes: 'Official high-level list contained eleven chains and omitted Solana at review time; use live inbound-address evidence and the chain-client reference for the current catalog boundary.',
};

export const swapGuideSource: SourceMeta = {
  label: 'THORChain Swap Guide',
  url: 'https://dev.thorchain.org/swap-guide/quickstart-guide.html',
  retrievedAt: '2026-07-06',
  notes: 'Official quote, expiry, streaming swap, refund-address, recommended minimum input, and swap error-handling guidance.',
};

export const memosSource: SourceMeta = {
  label: 'THORChain transaction memos',
  url: 'https://dev.thorchain.org/concepts/memos.html',
  retrievedAt: '2026-07-06',
  notes: 'Official memo format, memo-size, dust-threshold, function, refund-address, affiliate, and transaction-intent guidance.',
};

export const constantsMimirSource: SourceMeta = {
  label: 'THORChain constants and Mimirs',
  url: 'https://dev.thorchain.org/mimir.html',
  retrievedAt: '2026-07-05',
  notes: 'Official constants and Mimir reference; live Mimir reads still own current override state.',
};

export const networkHaltsSource: SourceMeta = {
  label: 'THORChain Network Halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
  retrievedAt: '2026-07-02',
  notes: 'Official halt-control reference; live Mimir and inbound-address reads still own current availability.',
};

export const feesSource: SourceMeta = {
  label: 'THORChain fees developer docs',
  url: 'https://dev.thorchain.org/concepts/fees.html',
  retrievedAt: '2026-07-04',
  notes: 'Official fee reference for fee categories and quote fields; exact values remain live/current-only.',
};

export const runePoolDocsSource: SourceMeta = {
  label: 'THORChain RUNEPool docs',
  url: 'https://docs.thorchain.org/technical-documentation/thorchain-finance/runepool',
  retrievedAt: '2026-07-14',
  notes: 'Official RUNEPool overview for aggregate POL participation, units, deposits, withdrawals, and PnL fields; its fixed pool-count prose is not current POL-scope proof.',
};

export const runePoolDevSource: SourceMeta = {
  label: 'RUNEPool developer docs',
  url: 'https://dev.thorchain.org/concepts/rune-pool.html',
  retrievedAt: '2026-07-14',
  notes: 'Developer source for RUNEPool mechanics, POL-enabled pools, provider endpoints, potentially negative current_deposit/PnL fields, and aggregate impermanent-loss exposure.',
};

export const runePoolEndpointSource: SourceMeta = {
  label: 'Liquify THORNode runepool endpoint',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/runepool',
  retrievedAt: '2026-07-14',
  notes: 'Current-only RUNEPool accounting endpoint; production evidence pins it to the same Liquify provider and THORChain height as Mimir before interpreting global, provider, reserve, value, PnL, or deposit fields.',
};

export const adr026DynamicFeesSource: SourceMeta = {
  label: 'ADR-026 dynamic L1 fee model',
  url: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
  retrievedAt: '2026-07-04',
  notes: 'Architecture decision text currently labeled proposed; compare with live THORNode state before making current claims.',
};

export const assetNotationSource: SourceMeta = {
  label: 'Asset Notation',
  url: 'https://dev.thorchain.org/concepts/asset-notation.html',
  retrievedAt: '2026-07-04',
  notes: 'Official asset-notation reference for chain and asset identifiers used in docs, quotes, pools, and memos.',
};

export const thornameGuideSource: SourceMeta = {
  label: 'THORName affiliate guide',
  url: 'https://dev.thorchain.org/affiliate-guide/thorname-guide.html',
  retrievedAt: '2026-07-04',
  notes: 'Official THORName affiliate reference; current dynamic-fee attribution still needs live THORNode evidence.',
};

export const liveInboundSource: SourceMeta = {
  label: 'THORNode inbound_addresses',
  url: 'https://thornode.thorchain.network/thorchain/inbound_addresses',
  retrievedAt: '2026-07-04',
  notes: 'Current-only chain availability, router, halt, and inbound-address snapshot; not durable uptime proof.',
};

export const thornodeMimirSource: SourceMeta = {
  label: 'THORNode Mimir endpoint',
  url: 'https://thornode.thorchain.network/thorchain/mimir',
  retrievedAt: '2026-07-04',
  notes: 'Current-only operational controls; malformed values must not be treated as inactive.',
};

export const midgardHealthSource: SourceMeta = {
  label: 'Midgard v2 Health',
  url: 'https://midgard.thorchain.network/v2/health',
  retrievedAt: '2026-07-04',
  notes: 'Current-only Midgard provider health, sync state, and lag for rendered live metrics.',
};

export const midgardNetworkSource: SourceMeta = {
  label: 'Midgard v2 Network',
  url: 'https://midgard.thorchain.network/v2/network',
  retrievedAt: '2026-07-05',
  notes: 'Current-only network totals; pair with visible source freshness before treating values as live.',
};

export const midgardPoolsSource: SourceMeta = {
  label: 'Midgard v2 Pools',
  url: 'https://midgard.thorchain.network/v2/pools?status=available',
  retrievedAt: '2026-07-05',
  notes: 'Current-only available-pool snapshot; not durable pool uptime proof.',
};

export const midgardEarningsSource: SourceMeta = {
  label: 'Midgard v2 Earnings',
  url: 'https://midgard.thorchain.network/v2/history/earnings?interval=day&count=30',
  retrievedAt: '2026-07-05',
  notes: 'Current-only earnings intervals as returned by Midgard, not protocol revenue attribution proof.',
};

export const dynamicL1FeesSource: SourceMeta = {
  label: 'THORNode dynamic_l1_fees',
  url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees',
  retrievedAt: '2026-07-04',
  notes: 'Current-only sealed dynamic L1 fee records.',
};

export const dynamicL1FeesCurrentSource: SourceMeta = {
  label: 'THORNode dynamic_l1_fees_current',
  url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees_current',
  retrievedAt: '2026-07-04',
  notes: 'Current-only in-progress epoch accumulators.',
};

export const liquifyLiveInboundSource: SourceMeta = {
  label: 'Liquify THORNode inbound_addresses',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify chain availability, router, halt, and inbound-address snapshot; not durable uptime or cross-region freshness proof.',
};

export const liquifyThornodeMimirSource: SourceMeta = {
  label: 'Liquify THORNode Mimir endpoint',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify operational controls; malformed or regionally stale values must not be treated as inactive.',
};

export const liquifyMidgardHealthSource: SourceMeta = {
  label: 'Liquify Midgard v2 Health',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/health',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify Midgard provider health, sync state, and lag for rendered live metrics; regional provider freshness still needs checking.',
};

export const liquifyMidgardNetworkSource: SourceMeta = {
  label: 'Liquify Midgard v2 Network',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify network totals; pair with visible source freshness before treating values as live.',
};

export const liquifyMidgardPoolsSource: SourceMeta = {
  label: 'Liquify Midgard v2 Pools',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/pools?status=available',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify available-pool snapshot; not durable pool uptime or cross-region freshness proof.',
};

export const liquifyMidgardEarningsSource: SourceMeta = {
  label: 'Liquify Midgard v2 Earnings',
  url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/history/earnings?interval=day&count=30',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify earnings intervals as returned by Midgard; not protocol revenue attribution or cross-region freshness proof.',
};

export const liquifyDynamicL1FeesSource: SourceMeta = {
  label: 'Liquify THORNode dynamic_l1_fees',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify sealed dynamic L1 fee records; verify provider freshness before interpreting them.',
};

export const liquifyDynamicL1FeesCurrentSource: SourceMeta = {
  label: 'Liquify THORNode dynamic_l1_fees_current',
  url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees_current',
  retrievedAt: '2026-07-13',
  notes: 'Current-only Liquify in-progress epoch accumulators; verify provider freshness before interpreting them.',
};

export const thorchainEcosystemSource: SourceMeta = {
  label: 'THORChain Ecosystem',
  url: 'https://docs.thorchain.org/ecosystem',
  retrievedAt: '2026-06-18',
  notes: 'Official ecosystem directory reference; listings are not wallet-security audits, route guarantees, or current app-availability proof.',
};

export const tokenomicsSource: SourceMeta = {
  label: 'RUNE and TCY tokenomics',
  url: 'https://docs.thorchain.org/tokenomics-rune-tcy',
  retrievedAt: '2026-07-05',
  notes: 'Official RUNE and TCY tokenomics overview, including TCY supply, revenue share, and no-governance-rights caveat; current amounts and distributions still require live evidence.',
};

export const tcyGuideSource: SourceMeta = {
  label: 'TCY Developer Guide',
  url: 'https://dev.thorchain.org/concepts/tcy.html',
  retrievedAt: '2026-07-05',
  notes: 'Developer-facing TCY mechanics, claim, staking, and recovery caveats, including the explicit warning that full debt recovery is market dependent and not guaranteed.',
};

export const appLayerSource: SourceMeta = {
  label: 'THORChain Application Layer docs',
  url: 'https://docs.thorchain.org/application-layer',
  retrievedAt: '2026-07-05',
  notes: 'Official app-layer overview; current app-layer, WASM, secured-asset, and trade-account availability still needs live controls.',
};

export const securedAssetsSource: SourceMeta = {
  label: 'THORChain Secured Assets docs',
  url: 'https://docs.thorchain.org/technical-documentation/thorchain-finance/secured-assets',
  retrievedAt: '2026-07-05',
  notes: 'Official secured-asset overview; current secured-asset operations still depend on live protocol controls.',
};

export const securedAssetsDevSource: SourceMeta = {
  label: 'THORChain secured assets developer docs',
  url: 'https://dev.thorchain.org/concepts/secured-assets.html',
  retrievedAt: '2026-07-05',
  notes: 'Developer reference for secured-asset mechanics and integration boundaries.',
};

export const tradeAssetsSource: SourceMeta = {
  label: 'THORChain Trade Assets docs',
  url: 'https://docs.thorchain.org/technical-documentation/thorchain-finance/trade-assets',
  retrievedAt: '2026-07-13',
  notes: 'Official trade-asset design reference; current enablement and route availability still require live controls.',
};

export const archivedSaversLendingSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
  retrievedAt: '2026-07-05',
  notes: 'Official archived feature index marking Savers and Lending as deprecated, no longer available, and preserved only for historical reference.',
};

export const thorfiUnwindSource: SourceMeta = {
  label: 'THORFi Unwind Announcement',
  url: 'https://medium.com/thorchain/thorfi-unwind-96b46dff72c0',
  retrievedAt: '2026-07-05',
  notes: 'Dated THORFi unwind postmortem with January-February 2025 liability, pause, and Proposal 6 milestones; its implementation-status section is historical, not current TCY availability proof.',
};

export const exploitReport1Source: SourceMeta = {
  label: 'THORChain Exploit Report #1',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-1',
  retrievedAt: '2026-07-05',
  notes: 'Official initial May 2026 exploit timeline and then-pending ADR-028 recovery framing; use Report #2 and the accepted ADR for later root-cause and conciliation status.',
};

export const exploitReport2Source: SourceMeta = {
  label: 'THORChain Exploit Report #2',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-2',
  retrievedAt: '2026-07-04',
  notes: 'Official root-cause report for the May 2026 GG20/TSS vault exploit, patched v3.19.1 recovery, and still-planned migration away from GG20.',
};

export const protocolUpgradeV319Source: SourceMeta = {
  label: 'Protocol Upgrade v3.19.0',
  url: 'https://blog.thorchain.org/protocol-upgrade-v3-19-0',
  retrievedAt: '2026-07-04',
  notes: 'Official v3.19.0 release summary for post-exploit restart controls, including TSS patches, compromised-vault exclusion, temporary KeyVerify, and pause safety.',
};

export const adr028ExploitConciliationSource: SourceMeta = {
  label: 'ADR-028 Exploit Conciliation (v3.19.0)',
  url: 'https://gitlab.com/thorchain/thornode/-/blob/v3.19.0/docs/architecture/adr-028-exploit-conciliation.md',
  retrievedAt: '2026-07-13',
  notes: 'Immutable v3.19.0 source marking ADR-028 Accepted and specifying the one-time Migrate15to16 conciliation waterfall; not proof that every affected user recovered every loss.',
};

export const postRestartSecuritySource: SourceMeta = {
  label: 'THORChain Is Back: Security Update',
  url: 'https://blog.thorchain.org/thorchain-is-back-monero-nears-mainnet-and-pol-takes-center-stage',
  retrievedAt: '2026-07-13',
  notes: 'Official 2026-06-25 post-restart update confirming trading resumed while DKLS/FROST migration and TSS-library publication remained future work.',
};

export const asgardTssChurnSource: SourceMeta = {
  label: 'Under the Hood: Asgard Vaults, TSS and Node Churns',
  url: 'https://blog.thorchain.org/under-the-hood-asgard-vaults-tss-and-node-churns',
  retrievedAt: '2026-07-04',
  notes: 'Historical 2022 educational explainer for Asgard vault, TSS, and churn mechanics; fixed node-count and cadence examples are not current configuration proof.',
};

export const bifrostTssVaultsSource: SourceMeta = {
  label: 'Bifrost, TSS and Vaults',
  url: 'https://docs.thorchain.org/technical-documentation/technology/bifrost-tss-and-vaults',
  retrievedAt: '2026-07-05',
  notes: 'Official technology docs for Bifrost, TSS, Asgard vaults, vault migration, and churn-related mechanics; pair with dated security sources for the current signing scheme and incident posture.',
};

export const thornodeStackSource: SourceMeta = {
  label: 'THORNode Stack',
  url: 'https://docs.thorchain.org/thornodes/overview/thornode-stack',
  retrievedAt: '2026-07-05',
  notes: 'Official node-stack overview describing Bifrost as the chain-client daemon for observation, signing, and broadcasting.',
};

export const nodeRisksRewardsSource: SourceMeta = {
  label: 'THORNode risks, costs and rewards',
  url: 'https://docs.thorchain.org/thornodes/overview/risks-costs-and-rewards',
  retrievedAt: '2026-07-05',
  notes: 'Official node-operator source for slash points, bond rewards, operator fees, and node reward mechanics.',
};

export const nodeManagingSource: SourceMeta = {
  label: 'Managing THORNodes',
  url: 'https://docs.thorchain.org/thornodes/managing',
  retrievedAt: '2026-07-05',
  notes: 'Official node operations guidance for slash troubleshooting, sync checks, and operational risk.',
};

export const nodeOperationsSource: SourceMeta = {
  label: 'THORNode node operations',
  url: 'https://docs.thorchain.org/thornodes/overview/node-operations',
  retrievedAt: '2026-07-14',
  notes: 'Official node lifecycle and churn reference for Whitelisted, Standby, Ready, Active, and Disabled status, churn-out criteria, and the Standby-only unbond boundary.',
};

export const nodeLeavingSource: SourceMeta = {
  label: 'Leaving THORChain as a node operator',
  url: 'https://docs.thorchain.org/thornodes/leaving',
  retrievedAt: '2026-07-14',
  notes: 'Official LEAVE and UNBOND procedure reference; a node must be Standby and outside vault migration before unbonding, and the original operator address controls the action.',
};

export const thornodeBifrostHowItWorksSource: SourceMeta = {
  label: 'THORNode Bifrost transaction flow',
  url: 'https://gitlab.com/thorchain/thornode/-/blob/e76a394b451f143d91e12666e42eea3948962278/docs/bifrost/how-bifrost-works.md',
  retrievedAt: '2026-07-14',
  notes: 'Pinned official THORNode source-tree snapshot for observer/signer roles, Active and Retiring vault observations, 67% consensus, finality, re-orgs, and outbound evidence.',
};

export const thornodeVaultBehaviorsSource: SourceMeta = {
  label: 'THORNode vault behaviors',
  url: 'https://gitlab.com/thorchain/thornode/-/blob/e76a394b451f143d91e12666e42eea3948962278/docs/bifrost/vault-behaviors.md',
  retrievedAt: '2026-07-14',
  notes: 'Pinned official THORNode source-tree snapshot for physical-vault lifecycle, inbound-vault selection, migration, and the distinction between slash points and bond-principal slashing.',
};

export const economicModelSource: SourceMeta = {
  label: 'THORChain economic model',
  url: 'https://docs.thorchain.org/technical-documentation/technical-deep-dive/economic-model',
  retrievedAt: '2026-07-14',
  notes: 'Official Incentive Pendulum, emission, and reserve-flow design; its original 500M maximum-supply framing must not be presented as the newer tokenomics page\'s current approximate supply.',
};

export const networkSecurityGovernanceSource: SourceMeta = {
  label: 'Network security and governance',
  url: 'https://docs.thorchain.org/network-security-governance',
  retrievedAt: '2026-07-14',
  notes: 'Official security/governance overview for the Incentive Pendulum and approximate 2:1 bonded-security-to-liquidity target; live ratios and reward splits need current evidence.',
};
