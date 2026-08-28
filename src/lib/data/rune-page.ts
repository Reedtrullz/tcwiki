import type { RelatedCheck } from '@/components/features/RelatedChecks';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface RuneNumberRoute {
  title: string;
  badge: string;
  badgeVariant: BadgeVariant;
  use: string;
  start: string;
  href: string;
  avoid?: string;
}

interface RuneActionLink {
  label: string;
  href: string;
}

interface RuneActionRoute {
  title: string;
  badge: string;
  badgeVariant: BadgeVariant;
  use: string;
  avoid?: string;
  links: RuneActionLink[];
}

interface RuneClaimCheck {
  title: string;
  badge: string;
  badgeVariant: BadgeVariant;
  use: string;
  verify: string;
  avoid: string;
  href: string;
  linkLabel: string;
}

export const runeRelatedChecks: RelatedCheck[] = [
  {
    label: 'RUNE settlement deep dive',
    href: '/deep-dives/rune-settlement',
    badge: 'deep dive',
    description: 'Read the long-form settlement-asset explanation before using RUNE as a protocol model.',
  },
  {
    label: 'Swap Economics',
    href: '/deep-dives#deep-dive-path-swap-economics',
    badge: 'path',
    description: 'Connect RUNE settlement to CLP pricing, incentives, and security costs.',
  },
  {
    label: 'Stats decision panel',
    href: '/stats#stats-look-here-first',
    badge: 'live state',
    description: 'Check current pooled RUNE, reserve, node, and earnings-source health.',
  },
  {
    label: 'Official source map',
    href: '/docs#official-protocol-documentation',
    badge: 'proof',
    description: 'Use official docs for dated tokenomics framing and source boundaries.',
  },
];

export const runeActionRoutes: RuneActionRoute[] = [
  {
    title: 'Swap or acquire RUNE',
    badge: 'route + interface',
    badgeVariant: 'info' as const,
    use: 'Check whether a concrete route can quote, then inspect the interface or wallet you plan to use.',
    links: [
      { label: 'Check route availability', href: '/network#check-a-route' },
      { label: 'Review interface checklist', href: '/ecosystem#interface-use-checklist' },
    ],
  },
  {
    title: 'Stake or earn with RUNE',
    badge: 'claim split',
    badgeVariant: 'warning' as const,
    use: 'Separate RUNEPool/POL accounting, LP positions, node bonding, and TCY staking before calling anything yield.',
    links: [
      { label: 'Check RUNEPool evidence', href: '/economics#runepool-pol-live' },
      { label: 'Review liquidity actions', href: '/deep-dives/liquidity-actions#what-to-check-first' },
    ],
  },
  {
    title: 'Bond RUNE for a node',
    badge: 'node ops',
    badgeVariant: 'warning' as const,
    use: 'Use node-operator sources and live controls before relying on bond, unbond, rebond, rotation, or slash settings.',
    links: [
      { label: 'Open node guide', href: '/network#node-operator-guide' },
      { label: 'Check node controls', href: '/network#node-operator-actions' },
    ],
  },
  {
    title: 'Make a RUNE claim',
    badge: 'source boundary',
    badgeVariant: 'default' as const,
    use: 'Classify the claim as settlement role, live metric, security constant, dated tokenomics, or value claim.',
    avoid: 'Do not turn a role explanation into price, fair value, investment suitability, or future-yield proof.',
    links: [
      { label: 'Use number router', href: '/rune#rune-number-router' },
      { label: 'Open source map', href: '/docs#rune-tokenomics-and-value' },
    ],
  },
];

export function getRuneClaimChecks(supplyAnchor: string): RuneClaimCheck[] {
  return [
    {
      title: 'Settlement role',
      badge: 'mechanism',
      badgeVariant: 'info' as const,
      use: 'RUNE as the common settlement pair, liquidity-pool side, security bond, and accounting asset.',
      verify: 'Use the settlement deep dive before turning this overview into a protocol-model explanation.',
      avoid: 'Do not claim price, fair value, or investment upside from the settlement role alone.',
      href: '/deep-dives/rune-settlement',
      linkLabel: 'Read settlement deep dive',
    },
    {
      title: 'Current network number',
      badge: 'live data',
      badgeVariant: 'warning' as const,
      use: 'Pooled RUNE, reserve context, active nodes, bond/liquidity posture, earnings, and source health.',
      verify: 'Use the Stats decision panel and keep source freshness or degraded-state labels attached.',
      avoid: 'Do not quote stale, degraded, or unavailable live snapshots as clean current facts.',
      href: '/stats#stats-look-here-first',
      linkLabel: 'Check live RUNE metrics',
    },
    {
      title: 'Tokenomics figure',
      badge: 'dated source',
      badgeVariant: 'default' as const,
      use: 'Supply framing, reserve/circulating context, burn/reduction notes, and TCY recovery context.',
      verify: 'Use the source-labeled Token Economics section before quoting dated supply framing.',
      avoid: 'Do not treat dated tokenomics records as live supply, market cap, or valuation evidence.',
      href: `/rune#${supplyAnchor}`,
      linkLabel: 'Review dated tokenomics',
    },
    {
      title: 'Value or investment claim',
      badge: 'non-claim',
      badgeVariant: 'danger' as const,
      use: 'Check market analysis from independent research or exchange data before making RUNE value claims.',
      verify: 'Cite the external market-analysis source directly rather than this overview.',
      avoid: 'Do not claim fair value, price targets, investment suitability, guaranteed yield, or recovery guarantees.',
      href: '/docs#rune-tokenomics-and-value',
      linkLabel: 'Check source boundary',
    },
  ];
}

export function getRuneNumberRoutes(supplyAnchor: string): RuneNumberRoute[] {
  return [
    {
      title: 'Live network metrics',
      badge: 'current-only',
      badgeVariant: 'warning' as const,
      use: 'Pooled RUNE, reserve context, active nodes, bond/liquidity posture, earnings, APY, and source-health labels.',
      start: 'Stats decision panel',
      href: '/stats#stats-look-here-first',
    },
    {
      title: 'Security constants',
      badge: 'THORNode',
      badgeVariant: 'warning' as const,
      use: 'Minimum bond, slash settings, Mimir overrides, signing state, node set, and operational controls.',
      start: 'Network diagnostics',
      href: '/network#network-diagnostics',
    },
    {
      title: 'Supply framing',
      badge: 'dated source',
      badgeVariant: 'default' as const,
      use: 'Reduced supply framing, reserve/circulating context, burn/reduction notes, and TCY recovery context.',
      start: 'Token Economics',
      href: `/rune#${supplyAnchor}`,
      avoid: 'Do not treat dated tokenomics records as live supply, market cap, exchange float, or valuation evidence.',
    },
    {
      title: 'Price or value claim',
      badge: 'non-claim',
      badgeVariant: 'danger' as const,
      use: 'Compare live exchange prices, order-book depth, and independent valuation research before drawing a conclusion.',
      start: 'Source map',
      href: '/docs#rune-tokenomics-and-value',
      avoid: 'Do not claim fair value, price targets, investment suitability, guaranteed yield, or recovery value.',
    },
  ];
}
