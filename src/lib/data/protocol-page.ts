import type { RelatedCheck } from '@/components/features/RelatedChecks';

// --- Exported card types ---

export interface LinkCard {
  title: string;
  desc: string;
  href: string;
  linkLabel: string;
}

export interface BoundaryCard {
  title: string;
  badge: string;
  href: string;
  linkLabel: string;
  summary: string;
}

export interface ClaimCheck {
  title: string;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  use: string;
  summary: string;
  verify: string;
  avoid: string;
  href: string;
  linkLabel: string;
}

// --- Data arrays ---

export const protocolRelatedChecks: RelatedCheck[] = [
  {
    label: 'New to THORChain',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    badge: 'path',
    description: 'Read settlement, pools, Bifrost, and TSS in the recommended order.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'live state',
    description: 'Check current halts, signing, LP controls, and source warnings.',
  },
  {
    label: 'Current source map',
    href: '/docs#current-protocol-state',
    badge: 'proof',
    description: 'Use THORNode/Midgard evidence for current operational claims.',
  },
  {
    label: 'Build/query path',
    href: '/deep-dives/build-query-data#query-plan',
    badge: 'task',
    description: 'Open API and endpoint guidance for developer or data-query work.',
  },
];

export const protocolClaimChecks: ClaimCheck[] = [
  {
    title: 'Architecture explanation',
    use: 'Concept context for Cosmos app-chain, Bifrost, vaults, pools, Mimir, and the swap lifecycle.',
    summary: 'Concept context for Cosmos app-chain, Bifrost, vaults, pools, Mimir, and the swap lifecycle.',
    verify: 'Use the New to THORChain path or the relevant deep dive before turning this into implementation detail.',
    avoid: 'Do not treat architecture cards as proof that a chain, route, or action is currently available.',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    linkLabel: 'Read the beginner path',
  },
  {
    title: 'Current availability claim',
    use: 'Whether swaps, signing, inbound addresses, LP actions, secured assets, or app-layer controls are open now.',
    summary: 'Whether swaps, signing, inbound addresses, LP actions, secured assets, or app-layer controls are open now.',
    verify: 'Use Network diagnostics and current source-map guidance before presenting availability as live.',
    avoid: 'Do not infer live state from a catalog listing alone.',
    href: '/network#network-diagnostics',
    linkLabel: 'Check live diagnostics',
  },
  {
    title: 'Security or vault claim',
    use: 'TSS, vault signing, churn, Bifrost observation, slash exposure, and post-exploit migration language.',
    summary: 'TSS, vault signing, churn, Bifrost observation, slash exposure, and post-exploit migration language.',
    verify: 'Use the Network Security path plus dated incident or upgrade reports before describing current safety.',
    avoid: 'Do not convert a dated exploit report or migration discussion into present-day safety proof.',
    href: '/deep-dives#deep-dive-path-network-security',
    linkLabel: 'Read security path',
  },
  {
    title: 'Developer integration claim',
    use: 'Memos, asset notation, constants, Mimir keys, inbound-address fields, quote behavior, and API usage.',
    summary: 'Memos, asset notation, constants, Mimir keys, inbound-address fields, quote behavior, and API usage.',
    verify: 'Use official developer docs and live endpoint evidence before giving transaction or implementation guidance.',
    avoid: 'Do not use wiki summaries as send instructions, wallet guidance, or complete API contracts.',
    href: '/deep-dives/build-query-data#query-plan',
    linkLabel: 'Open build/query guide',
  },
];

export const chainCatalogBoundary: BoundaryCard[] = [
  {
    title: 'Catalog Listed',
    badge: 'static boundary',
    href: '/docs#current-protocol-state',
    linkLabel: 'Check source boundary',
    summary: 'A listing confirms catalog presence only; swaps, LP actions, signing, and quoteability need current checks.',
  },
  {
    title: 'Operational Now',
    badge: 'live state',
    href: '/network#network-diagnostics',
    linkLabel: 'Open diagnostics',
    summary: 'Diagnostics show status at the checked block, not future uptime or coverage for every asset pair.',
  },
  {
    title: 'Specific Route',
    badge: 'quote check',
    href: '/network#check-a-route',
    linkLabel: 'Check a route',
    summary: 'A quote covers the selected assets and amount only; wallet support and execution still need verification.',
  },
  {
    title: 'Implementation Use',
    badge: 'builder path',
    href: '/deep-dives/build-query-data#query-plan',
    linkLabel: 'Open query plan',
    summary: 'The guide points to an endpoint family, not a complete production integration contract.',
  },
];

export const architectureCards: LinkCard[] = [
  {
    title: 'Cosmos SDK',
    desc: 'THORChain runs its own app-chain with Tendermint-style consensus and protocol modules for swaps, pools, vaults, and Mimir.',
    href: '/deep-dives/build-query-data#source-families',
    linkLabel: 'Map source families',
  },
  {
    title: 'TSS Vaults',
    desc: 'Threshold Signature Schemes distribute vault control across node operators. Current cryptography details should be tied to dated protocol sources.',
    href: '/deep-dives/tss',
    linkLabel: 'Read TSS details',
  },
  {
    title: 'Bifrost',
    desc: 'Nodes observe external-chain transactions and report them into the THORChain state machine.',
    href: '/deep-dives/bifrost',
    linkLabel: 'Read Bifrost details',
  },
  {
    title: 'Midgard + THORNode',
    desc: 'Midgard serves analytics and history. THORNode is the source for live operational state such as Mimir, constants, and inbound addresses.',
    href: '/deep-dives/midgard-thornode-data#source-roles',
    linkLabel: 'Choose the right API',
  },
];

export const currentStateControlCards: LinkCard[] = [
  {
    title: 'Mimir',
    desc: 'Mimir parameters can pause trading, signing, LP actions, churning, TCY claims, RUNEPool, and other protocol behavior. Display these as current-only live data.',
    href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
    linkLabel: 'Interpret Mimir controls',
  },
  {
    title: 'Network Halts',
    desc: 'Halts can be chain-specific or global. Interfaces should monitor halt flags before presenting swaps, LP actions, or signing state as available.',
    href: '/network#network-diagnostics',
    linkLabel: 'Check live halts',
  },
  {
    title: 'Inbound Addresses',
    desc: 'Routers, gas rates, chain pause flags, and inbound availability are live THORNode facts, not static wiki facts.',
    href: '/deep-dives/build-query-data#quotes-inbound-addresses-and-caching',
    linkLabel: 'Review inbound usage',
  },
  {
    title: 'Constants vs Overrides',
    desc: 'Constants describe defaults; Mimir can override them. Current minimum bond or slash settings require reading both sources.',
    href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
    linkLabel: 'Verify override posture',
  },
];

export const swapLifecycleCards: LinkCard[] = [
  {
    title: 'Inbound',
    desc: 'Request a fresh quote immediately before submission, then use its inbound address, memo, expiry, dust threshold, and recommended minimum rather than cached transaction inputs.',
    href: '/deep-dives/build-query-data#quotes-inbound-addresses-and-caching',
    linkLabel: 'Check quote timing',
  },
  {
    title: 'Execution',
    desc: 'The state machine prices the swap through RUNE-paired pools. Under the advanced queue, market swaps can auto-stream; the quote and memo own limits, interval, and quantity while live controls own availability.',
    href: '/network#check-a-route',
    linkLabel: 'Check a live route',
  },
  {
    title: 'Outbound or Refund',
    desc: 'Nodes sign the outbound transaction when signing is available; invalid or impossible transactions can refund according to protocol rules.',
    href: '/deep-dives/streaming-swaps-refunds#why-refunds-happen',
    linkLabel: 'Read refund conditions',
  },
];

export const keyConceptCards: LinkCard[] = [
  {
    title: 'RUNE Settlement',
    desc: 'Every external-asset swap routes through RUNE liquidity, making RUNE the common settlement and bond asset.',
    href: '/deep-dives/rune-settlement',
    linkLabel: 'Read settlement details',
  },
  {
    title: 'Continuous Liquidity Pools',
    desc: 'Slip-based pricing makes larger trades pay proportionally more, protecting liquidity providers from depth-consuming trades.',
    href: '/deep-dives/clp',
    linkLabel: 'Read CLP mechanics',
  },
  {
    title: 'App Layer and CosmWasm',
    desc: 'Permissioned CosmWasm contracts add application behavior; secured assets and trade accounts are separate protocol concepts that need their own live checks.',
    href: '/deep-dives/app-layer',
    linkLabel: 'Read app-layer scope',
  },
  {
    title: 'Minimal Governance',
    desc: 'Node operators and Mimir handle operational parameters; ADRs/TIPs document changes. Avoid saying ordinary RUNE holders directly govern every protocol decision.',
    href: '/governance',
    linkLabel: 'Check governance framing',
  },
];
