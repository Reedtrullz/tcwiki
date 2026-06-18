import { SourceMeta } from '@/lib/types';

export interface ContentEntry {
  id: string;
  title: string;
  href: string;
  category: 'section' | 'deep-dive' | 'resource';
  description: string;
  body: string;
  tags: string[];
  reviewedAt: string;
  sources: SourceMeta[];
  nav?: boolean;
  footer?: boolean;
  featured?: boolean;
}

const docsSource: SourceMeta = {
  label: 'THORChain Docs',
  url: 'https://docs.thorchain.org',
};

const devDocsSource: SourceMeta = {
  label: 'THORChain Dev Docs',
  url: 'https://dev.thorchain.org',
};

const exploitReportSource: SourceMeta = {
  label: 'THORChain Exploit Report #1',
  url: 'https://blog.thorchain.org/thorchain-exploit-report-1',
};

const archivedSource: SourceMeta = {
  label: 'Archived Savers and Lending docs',
  url: 'https://docs.thorchain.org/thornodes/archived',
};

export const CONTENT_ENTRIES: ContentEntry[] = [
  {
    id: 'protocol',
    title: 'Protocol',
    href: '/protocol',
    category: 'section',
    description: 'Architecture, swaps, TSS, Bifrost, Mimir, halts, app layer, and supported chains.',
    body: 'THORChain protocol architecture native cross-chain swaps Bifrost observers TSS vaults Mimir halts inbound addresses refunds streaming swaps App Layer CosmWasm.',
    tags: ['architecture', 'swaps', 'mimir', 'halts'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, devDocsSource, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'network',
    title: 'Network',
    href: '/network',
    category: 'section',
    description: 'Node lifecycle, churning, slashing, vault security, and live operational state.',
    body: 'Network security nodes churning slashing GG20 TSS DKLS signer halts Mimir operational parameters vault solvency current-only status.',
    tags: ['nodes', 'security', 'slashing', 'churning'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'economics',
    title: 'Economics',
    href: '/economics',
    category: 'section',
    description: 'RUNE settlement, CLP pricing, fees, incentive pendulum, RUNEPool, POL, and trade assets.',
    body: 'RUNE settlement asset CLP slip ratio liquidity fee affiliate fee outbound fee incentive pendulum RUNEPool protocol owned liquidity trade assets secured assets liquidity units APY.',
    tags: ['rune', 'clp', 'fees', 'runepool'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, devDocsSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'ecosystem',
    title: 'Ecosystem',
    href: '/ecosystem',
    category: 'section',
    description: 'Interfaces, wallets, explorers, developer tools, and chain support status.',
    body: 'THORChain ecosystem interfaces wallets explorers THORSwap AsgardEX RuneScan SwapKit XChainJS supported chains inbound addresses TRON SOL XRP.',
    tags: ['apps', 'interfaces', 'wallets', 'chains'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'governance',
    title: 'Governance',
    href: '/governance',
    category: 'section',
    description: 'ADRs, operational Mimir, incidents, milestones, and sourced research.',
    body: 'Governance ADR Mimir halt trading halt signing pause LP incidents exploit THORFi unwind TCY recovery source-backed history.',
    tags: ['governance', 'incidents', 'mimir', 'adr'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, exploitReportSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'stats',
    title: 'Statistics',
    href: '/stats',
    category: 'section',
    description: 'Current-only Midgard metrics and THORNode operational status.',
    body: 'Network statistics live Midgard current-only source-backed pooled RUNE bonding APY active nodes reserve earnings history degraded data source did not respond.',
    tags: ['stats', 'midgard', 'thornode', 'live'],
    reviewedAt: '2026-06-18',
    sources: [devDocsSource],
    nav: true,
    footer: true,
  },
  {
    id: 'rune',
    title: 'RUNE',
    href: '/rune',
    category: 'section',
    description: 'Native settlement, bond, and liquidity asset for THORChain.',
    body: 'RUNE token settlement asset security bond liquidity pair tokenomics TCY recovery protocol owned liquidity.',
    tags: ['rune', 'tokenomics'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
    nav: true,
  },
  {
    id: 'tcy',
    title: 'TCY',
    href: '/tcy',
    category: 'section',
    description: 'Historical THORFi unwind, deprecated Savers/Lending, and TCY recovery framing.',
    body: 'TCY THORFi unwind Savers deprecated Lending deprecated archived January 2025 historical yield liabilities recovery.',
    tags: ['tcy', 'savers', 'lending', 'historical'],
    reviewedAt: '2026-06-18',
    sources: [archivedSource, docsSource],
    nav: true,
  },
  {
    id: 'deep-dives',
    title: 'Deep Dives',
    href: '/deep-dives',
    category: 'section',
    description: 'Long-form explainers for core THORChain concepts.',
    body: 'Deep dives CLP Bifrost TSS churning slashing incentive pendulum RUNE settlement Savers historical halt Mimir swap lifecycle.',
    tags: ['deep-dives', 'education'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
    nav: true,
    footer: true,
    featured: true,
  },
  {
    id: 'docs',
    title: 'Docs',
    href: '/docs',
    category: 'resource',
    description: 'Official documentation, developer resources, and live API references.',
    body: 'Official THORChain docs developer docs Midgard API THORNode API network halts querying inbound addresses fees.',
    tags: ['docs', 'resources'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, devDocsSource],
    nav: true,
    footer: true,
  },
  {
    id: 'deep-dive-clp',
    title: 'Continuous Liquidity Pools (CLP)',
    href: '/deep-dives/clp',
    category: 'deep-dive',
    description: 'How THORChain slip-based pools enable native swaps without order books or wrapped assets.',
    body: 'Continuous Liquidity Pools CLP slip ratio x divided by X plus x liquidity fee output amount RUNE paired pools slippage liquidity providers native cross-chain swaps. Savers are historical and deprecated.',
    tags: ['clp', 'fees', 'swaps'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, devDocsSource],
    featured: true,
  },
  {
    id: 'deep-dive-incentive-pendulum',
    title: 'The Incentive Pendulum',
    href: '/deep-dives/incentive-pendulum',
    category: 'deep-dive',
    description: 'Automatic balancing between node bond security and pooled liquidity.',
    body: 'Incentive Pendulum bonded RUNE pooled RUNE rewards node operators liquidity providers security liquidity ratio self-correcting.',
    tags: ['economics', 'rewards'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
    featured: true,
  },
  {
    id: 'deep-dive-tss',
    title: 'Threshold Signatures (TSS)',
    href: '/deep-dives/tss',
    category: 'deep-dive',
    description: 'How distributed signing protects cross-chain vault keys and why GG20/DKLS wording must be source-backed.',
    body: 'Threshold Signature Scheme TSS GG20 DKLS vault key shares signing ceremony exploit May 2026 solvency checker halt signing.',
    tags: ['tss', 'security', 'vaults'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, exploitReportSource],
    featured: true,
  },
  {
    id: 'deep-dive-churning',
    title: 'Churning and Node Lifecycle',
    href: '/deep-dives/churning',
    category: 'deep-dive',
    description: 'Validator rotation, node lifecycle, standby competition, and key rotation.',
    body: 'Churning node lifecycle active standby ready whitelisted churn interval vault rotation unbonding forced churn slash points.',
    tags: ['nodes', 'churning'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-slashing',
    title: 'Slashing and Economic Security',
    href: '/deep-dives/slashing',
    category: 'deep-dive',
    description: 'Bonded RUNE, slash exposure, and why current constants should be source checked.',
    body: 'Slashing economic security bonded RUNE slash points signing observation failures constants Mimir current-only.',
    tags: ['security', 'slashing'],
    reviewedAt: '2026-06-18',
    sources: [docsSource, devDocsSource],
  },
  {
    id: 'deep-dive-bifrost',
    title: 'Bifrost Bridge and Cross-Chain Observability',
    href: '/deep-dives/bifrost',
    category: 'deep-dive',
    description: 'How active nodes observe external chains and reach consensus on events.',
    body: 'Bifrost observers external chains inbound transactions outbound confirmations chain reorgs finality two thirds observation.',
    tags: ['bifrost', 'observation'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-rune-settlement',
    title: 'RUNE as the Universal Settlement Asset',
    href: '/deep-dives/rune-settlement',
    category: 'deep-dive',
    description: 'Why every external-asset swap routes through RUNE liquidity.',
    body: 'RUNE settlement universal settlement asset BTC RUNE ETH pool pairs unified liquidity price discovery security bond liquidity pair.',
    tags: ['rune', 'settlement'],
    reviewedAt: '2026-06-18',
    sources: [docsSource],
  },
  {
    id: 'deep-dive-savers',
    title: 'Savers and Lending (Historical)',
    href: '/deep-dives/savers',
    category: 'deep-dive',
    description: 'Historical overview of deprecated Savers/Lending mechanics and TCY aftermath.',
    body: 'Savers deprecated Lending deprecated THORFi historical single-sided exposure synthetics liabilities TCY January 2025 archived docs.',
    tags: ['savers', 'lending', 'tcy', 'historical'],
    reviewedAt: '2026-06-18',
    sources: [archivedSource, docsSource],
  },
];

export const NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.nav)
  .map((entry) => ({ name: entry.title, href: entry.href }));

export const FOOTER_NAV_ITEMS = CONTENT_ENTRIES
  .filter((entry) => entry.footer)
  .map((entry) => ({ label: entry.title, href: entry.href }));

export const FEATURED_ENTRIES = CONTENT_ENTRIES.filter((entry) => entry.featured);

export const DEEP_DIVE_ENTRIES = CONTENT_ENTRIES.filter((entry) => entry.category === 'deep-dive');
