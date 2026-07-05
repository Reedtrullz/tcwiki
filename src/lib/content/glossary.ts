import type { DataConfidence, SourceMeta } from '@/lib/types';
import { slugifyFragment } from '@/lib/utils';

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'protocol' | 'economics' | 'operations' | 'history' | 'developer';
  confidence: DataConfidence;
  reviewedAt: string;
  nextReviewDue: string;
  sources: SourceMeta[];
  relatedHrefs: string[];
}

const docsSource: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
};

const devDocsSource: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
};

const networkHaltsSource: SourceMeta = {
  label: 'THORChain Network Halts',
  url: 'https://dev.thorchain.org/concepts/network-halts.html',
};

const queryingThorchainSource: SourceMeta = {
  label: 'Querying THORChain',
  url: 'https://dev.thorchain.org/concepts/querying-thorchain.html',
};

const feesSource: SourceMeta = {
  label: 'Fees',
  url: 'https://dev.thorchain.org/concepts/fees.html',
};

const liquidityProvidersSource: SourceMeta = {
  label: 'Liquidity Providers',
  url: 'https://docs.thorchain.org/technical-documentation/understanding-thorchain/roles/liquidity-providers',
};

const clpSource: SourceMeta = {
  label: 'Continuous Liquidity Pools',
  url: 'https://docs.thorchain.org/technical-documentation/thorchain-finance/continuous-liquidity-pools',
};

const adr026DynamicFeesSource: SourceMeta = {
  label: 'ADR-026 dynamic L1 fee model',
  url: 'https://gitlab.com/thorchain/thornode/-/raw/develop/docs/architecture/adr-026-dynamic-l1-min-fee-per-thorname.md',
  notes: 'Architecture decision text; compare with live THORNode state before making current claims.',
};

const assetNotationSource: SourceMeta = {
  label: 'Asset Notation',
  url: 'https://dev.thorchain.org/concepts/asset-notation.html',
};

const cosmwasmSource: SourceMeta = {
  label: 'CosmWasm',
  url: 'https://docs.thorchain.org/technical-documentation/technology/cosmwasm',
};

const exploitReport2Source: SourceMeta = {
  label: 'THORChain Exploit Report 2',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-2',
  retrievedAt: '2026-07-04',
};

const archivedSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
};

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: slugifyFragment('Asgard vault'),
    term: 'Asgard vault',
    definition: 'A THORChain vault controlled by the active validator set through threshold signing. Vault membership changes during churns.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/tss', '/deep-dives/churning'],
  },
  {
    id: slugifyFragment('Bifrost'),
    term: 'Bifrost',
    definition: 'The chain-client layer active nodes use to observe external-chain transactions and submit observations into THORChain.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/bifrost'],
  },
  {
    id: slugifyFragment('CLP'),
    term: 'CLP',
    definition: 'Continuous Liquidity Pool. THORChain pools price swaps from pool depth and slip, with RUNE paired against external assets.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource, devDocsSource],
    relatedHrefs: ['/deep-dives/clp', '/economics'],
  },
  {
    id: slugifyFragment('Impermanent loss'),
    term: 'Impermanent loss',
    definition: 'Liquidity-provider purchasing-power risk when relative pool asset prices move. THORChain docs frame slip-based fees as reducing this risk, not removing it; current LP return claims still need live pool and earnings evidence.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [liquidityProvidersSource, clpSource],
    relatedHrefs: ['/deep-dives/clp', '/stats#stats-look-here-first'],
  },
  {
    id: slugifyFragment('Impermanent loss protection'),
    term: 'Impermanent loss protection',
    definition: 'A historical reserve-subsidy mechanism for LP withdrawals. Official THORChain docs now say IL protection has been removed or ended, so do not describe it as currently available for ordinary liquidity providers.',
    category: 'history',
    confidence: 'official',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [clpSource, liquidityProvidersSource],
    relatedHrefs: ['/deep-dives/clp', '/docs#historical-features-and-recovery'],
  },
  {
    id: slugifyFragment('Liquidity provider'),
    term: 'Liquidity provider',
    definition: 'A participant who supplies assets to a THORChain pool and receives pool-share accounting. Current deposit or withdrawal availability depends on live LP controls and chain state.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/clp', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('Liquidity units'),
    term: 'Liquidity units',
    definition: 'Accounting units used to track a provider share of a THORChain pool. They explain pool ownership share, not whether LP deposits or withdrawals are currently open.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [docsSource, devDocsSource],
    relatedHrefs: ['/deep-dives/clp', '/stats#stats-look-here-first'],
  },
  {
    id: slugifyFragment('Asymmetric withdrawal'),
    term: 'Asymmetric withdrawal',
    definition: 'A liquidity withdrawal that takes one side of a pool rather than both sides proportionally. Availability can be controlled separately by live Mimir pause keys.',
    category: 'operations',
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [devDocsSource, networkHaltsSource],
    relatedHrefs: ['/network#network-diagnostics', '/deep-dives/clp'],
  },
  {
    id: slugifyFragment('Current-only'),
    term: 'Current-only',
    definition: 'A trust label for live Midgard or THORNode data that should be treated as a fresh snapshot, not durable historical truth.',
    category: 'operations',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [devDocsSource],
    relatedHrefs: ['/stats', '/network'],
  },
  {
    id: slugifyFragment('Mimir'),
    term: 'Mimir',
    definition: 'Operational parameter storage used by THORChain nodes. Halt, pause, enablement, and feature-control keys must be read from live THORNode state.',
    category: 'operations',
    confidence: 'official',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [networkHaltsSource],
    relatedHrefs: ['/network', '/governance'],
  },
  {
    id: slugifyFragment('Mimir override'),
    term: 'Mimir override',
    definition: 'A live operational value that can override a protocol default or constant. Current behavior should be checked against both constants and Mimir.',
    category: 'operations',
    confidence: 'official',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [networkHaltsSource, queryingThorchainSource],
    relatedHrefs: ['/protocol', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('Inbound address'),
    term: 'Inbound address',
    definition: 'A current THORNode-provided address, router, gas-rate, and pause-state record for a supported external chain. Treat it as live availability evidence only.',
    category: 'operations',
    confidence: 'official',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [queryingThorchainSource, devDocsSource],
    relatedHrefs: ['/protocol', '/docs#current-protocol-state'],
  },
  {
    id: slugifyFragment('Memo'),
    term: 'Memo',
    definition: 'The transaction instruction string used by THORChain actions such as swaps, LP operations, refunds, affiliates, and other protocol messages.',
    category: 'developer',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [devDocsSource, queryingThorchainSource],
    relatedHrefs: ['/protocol', '/docs#developer-integration'],
  },
  {
    id: slugifyFragment('Outbound fee'),
    term: 'Outbound fee',
    definition: 'A fee component associated with the outbound transaction and chain gas. Exact values are live protocol data, not static wiki constants.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [feesSource],
    relatedHrefs: ['/economics', '/stats#stats-look-here-first'],
  },
  {
    id: slugifyFragment('Affiliate fee'),
    term: 'Affiliate fee',
    definition: 'An optional memo-defined interface or affiliate fee, usually expressed in basis points. It is distinct from protocol liquidity and gas-related fees.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [feesSource],
    relatedHrefs: ['/economics', '/dynamic-fees#dynamic-fees-live'],
  },
  {
    id: slugifyFragment('Dynamic L1 fee'),
    term: 'Dynamic L1 fee',
    definition: 'ADR-026 experiment terminology for per-thorname, per-pair L1 minimum slip floors adjusted by TOR-denominated fee evidence. Live state is current-only THORNode evidence.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [adr026DynamicFeesSource],
    relatedHrefs: ['/dynamic-fees#dynamic-fees-live', '/docs#dynamic-fee-experiment'],
  },
  {
    id: slugifyFragment('Protocol-owned liquidity'),
    term: 'Protocol-owned liquidity',
    definition: 'Liquidity controlled by the protocol rather than ordinary external LPs. Balances, exposure, and enabled state should be described with current source labels.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [docsSource],
    relatedHrefs: ['/economics', '/stats#stats-look-here-first'],
  },
  {
    id: slugifyFragment('RUNEPool'),
    term: 'RUNEPool',
    definition: 'A RUNE-only participation mechanism whose availability depends on current protocol controls and should not be assumed from static text.',
    category: 'economics',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource, networkHaltsSource],
    relatedHrefs: ['/rune', '/network'],
  },
  {
    id: slugifyFragment('Secured asset'),
    term: 'Secured asset',
    definition: 'A THORChain asset/accounting concept whose deposits, withdrawals, and enablement can depend on specific Mimir controls. Do not infer availability from static descriptions.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [assetNotationSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/app-layer', '/economics', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('Trade asset'),
    term: 'Trade asset',
    definition: 'A protocol accounting asset used for trade-account flows. Enablement and deposit availability are live controls, not durable glossary facts.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [assetNotationSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/app-layer', '/economics', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('Synthetic asset'),
    term: 'Synthetic asset',
    definition: 'A THORChain asset-notation type, often shortened to synth, denoted with `CHAIN/ASSET`. Synthetics were part of historical Savers mechanics; notation may still appear in developer contexts, but current availability or halt state must be checked from live controls and archived-product boundaries.',
    category: 'history',
    confidence: 'curated',
    reviewedAt: '2026-07-05',
    nextReviewDue: '2026-08-05',
    sources: [assetNotationSource, archivedSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/savers', '/docs#developer-integration', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('App Layer'),
    term: 'App Layer',
    definition: 'THORChain application-layer functionality built around permissioned CosmWasm contracts and related Mimir-controlled deployer, checksum, and contract controls.',
    category: 'developer',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [cosmwasmSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/app-layer', '/protocol', '/network#network-diagnostics'],
  },
  {
    id: slugifyFragment('CosmWasm'),
    term: 'CosmWasm',
    definition: 'Smart-contract technology used for THORChain app-layer functionality. Current deployer, checksum, contract, or global halt state must be read from live controls.',
    category: 'developer',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [cosmwasmSource, networkHaltsSource],
    relatedHrefs: ['/deep-dives/app-layer', '/protocol', '/docs#official-protocol-documentation'],
  },
  {
    id: slugifyFragment('Savers'),
    term: 'Savers',
    definition: 'A deprecated historical THORFi feature. Current wiki copy should frame Savers as archived, not presently available yield.',
    category: 'history',
    confidence: 'official',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [archivedSource],
    relatedHrefs: ['/tcy', '/deep-dives/savers'],
  },
  {
    id: slugifyFragment('TCY'),
    term: 'TCY',
    definition: 'A recovery-token framing associated with the THORFi unwind and later recovery context. Current status needs source-specific review.',
    category: 'history',
    confidence: 'needs-review',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-07-16',
    sources: [docsSource, archivedSource],
    relatedHrefs: ['/tcy', '/governance'],
  },
  {
    id: slugifyFragment('GG20'),
    term: 'GG20',
    definition: 'A threshold-signature implementation family referenced in THORChain security history. Dated exploit and upgrade sources should not be treated as present-day safety proof by themselves.',
    category: 'history',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [exploitReport2Source],
    relatedHrefs: ['/deep-dives/tss', '/governance#current-recovery'],
  },
  {
    id: slugifyFragment('KeyVerify'),
    term: 'KeyVerify',
    definition: 'A TSS-related verification concept discussed in THORChain security material. Use dated incident and protocol-upgrade sources before making current security claims.',
    category: 'history',
    confidence: 'curated',
    reviewedAt: '2026-07-04',
    nextReviewDue: '2026-08-04',
    sources: [exploitReport2Source],
    relatedHrefs: ['/deep-dives/tss', '/governance#current-recovery'],
  },
  {
    id: slugifyFragment('TSS'),
    term: 'TSS',
    definition: 'Threshold Signature Scheme. Validators jointly sign vault transactions without a single node holding the complete private key.',
    category: 'protocol',
    confidence: 'curated',
    reviewedAt: '2026-07-02',
    nextReviewDue: '2026-08-02',
    sources: [docsSource],
    relatedHrefs: ['/deep-dives/tss'],
  },
];
