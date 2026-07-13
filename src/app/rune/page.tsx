import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { getTokenomicsRecord } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { getTokenomicsToneBadgeVariant, getTokenomicsToneLabel } from '@/lib/trust';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'RUNE | THORChain Wiki',
  description: 'Source-backed overview of RUNE as THORChain settlement, bond, liquidity, and tokenomics asset.',
  path: '/rune',
});

const entry = getContentEntry('rune');
const supplyRecord = getTokenomicsRecord('rune-supply-framing');
const supplyAnchor = recordAnchor('tokenomics', supplyRecord.data.id);

const runeRelatedChecks: RelatedCheck[] = [
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

const runeClaimChecks = [
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
    use: 'Use this page to define what the wiki does not prove about RUNE value or suitability.',
    verify: 'Use sources outside this overview for market analysis, then keep the wiki citation boundary explicit.',
    avoid: 'Do not claim fair value, price targets, investment suitability, guaranteed yield, or recovery guarantees.',
    href: '/docs#rune-tokenomics-and-value',
    linkLabel: 'Check source boundary',
  },
];

const runeNumberRoutes = [
  {
    title: 'Live network metrics',
    badge: 'current-only',
    badgeVariant: 'warning' as const,
    use: 'Pooled RUNE, reserve context, active nodes, bond/liquidity posture, earnings, APY, and source-health labels.',
    start: 'Stats decision panel',
    href: '/stats#stats-look-here-first',
    avoid: 'Do not use live metrics as price, fair value, circulating-supply, or future-yield proof.',
  },
  {
    title: 'Security constants',
    badge: 'THORNode',
    badgeVariant: 'warning' as const,
    use: 'Minimum bond, slash settings, Mimir overrides, signing state, node set, and operational controls.',
    start: 'Network diagnostics',
    href: '/network#network-diagnostics',
    avoid: 'Do not infer current bond or safety posture from the RUNE role summary or old docs.',
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
    use: 'Use the wiki to say which source family would be needed and what this page does not prove.',
    start: 'Source map',
    href: '/docs#rune-tokenomics-and-value',
    avoid: 'Do not claim fair value, price targets, investment suitability, guaranteed yield, or recovery value.',
  },
];

const runeActionRoutes = [
  {
    title: 'Swap or acquire RUNE',
    badge: 'route + interface',
    badgeVariant: 'info' as const,
    use: 'Check whether a concrete route can quote, then inspect the interface or wallet you plan to use.',
    avoid: 'Do not treat this page as exchange availability, route safety, wallet safety, or execution instructions.',
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
    avoid: 'Do not describe RUNEPool, LP APY, or node rewards as guaranteed staking yield.',
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
    avoid: 'Do not infer current node-operation availability from tokenomics or historical node docs.',
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

export default function RunePage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">RUNE Token</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        RUNE is the native asset used for settlement, liquidity pairing, economic security, and protocol accounting.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'RUNE roles in settlement, liquidity pairing, node bonding, and protocol accounting.',
          'Source-backed tokenomics framing that should remain dated when figures are quoted.',
        ]}
        verifyBeforeClaiming={[
          'Current price, circulating balances, reserve balances, emissions, or market conclusions.',
          'Current minimum bond, slash parameters, Mimir overrides, or investment suitability.',
        ]}
      />

      <section id="rune-overview" className="mb-12 scroll-mt-24" aria-labelledby="rune-overview-heading">
        <SectionHeader id="rune-overview-heading" className="mb-5">What is RUNE?</SectionHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Settlement Asset', desc: 'Every external-asset swap routes through RUNE liquidity, for example BTC to RUNE to ETH.' },
            { title: 'Security Bond', desc: 'Node operators bond RUNE to secure vaults and participate in signing. Minimums and slash settings are current-only constants/Mimir facts.' },
            { title: 'Liquidity Pair', desc: 'Pools pair RUNE with external assets, creating a unified liquidity layer rather than isolated asset pairs.' },
            { title: 'Governance Context', desc: 'Operational governance is primarily node/Mimir driven. ADRs and TIPs document protocol changes; avoid treating all RUNE holders as direct voters.' },
          ].map((card) => (
            <Card key={card.title}>
              <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="rune-action-router" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">What Do You Want To Do With RUNE?</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Route action questions before reading tokenomics. RUNE can appear in swaps, liquidity, RUNEPool, and node bonding, but each path has a different current-state check.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {runeActionRoutes.map((route) => (
            <Card key={route.title} padding="sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={route.badgeVariant}>{route.badge}</Badge>
                <h3 className="text-sm font-semibold text-slate-100">{route.title}</h3>
              </div>
              <dl className="space-y-2 text-xs leading-relaxed text-slate-400">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
                  <dd>{route.use}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Use For</dt>
                  <dd>{route.avoid}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                {route.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-xs font-semibold text-accent underline-offset-4 hover:underline">
                    {link.label}
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-slate-500">
          Do not treat this page as exchange, wallet, staking, yield, or node-operation instructions. It is a source router for deciding which live or dated evidence to inspect next.
        </p>
      </section>

      <section id="rune-number-router" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Which RUNE Number Do You Need?</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Pick the number by the claim you are making. RUNE appears in settlement, security, liquidity, and tokenomics, but each number needs a different evidence path.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {runeNumberRoutes.map((route) => (
            <Card key={route.title} padding="sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={route.badgeVariant}>{route.badge}</Badge>
                <h3 className="text-sm font-semibold text-slate-100">{route.title}</h3>
              </div>
              <dl className="space-y-2 text-xs leading-relaxed text-slate-400">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
                  <dd>{route.use}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Use For</dt>
                  <dd>{route.avoid}</dd>
                </div>
              </dl>
              <Link href={route.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                Start with {route.start}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section id="rune-claim-checks" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">RUNE Claim Checks</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Start by classifying the claim. This page supports protocol-role explanations; live balances, current economics, tokenomics figures, and value claims need different source paths.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {runeClaimChecks.map((check) => (
            <Card key={check.title} padding="md">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={check.badgeVariant}>{check.badge}</Badge>
                <h3 className="text-base font-semibold text-slate-100">{check.title}</h3>
              </div>
              <dl className="grid gap-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-3">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Use For</dt>
                  <dd className="mt-1">{check.use}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Verify</dt>
                  <dd className="mt-1">{check.verify}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Do Not Claim</dt>
                  <dd className="mt-1">{check.avoid}</dd>
                </div>
              </dl>
              <Link href={check.href} className="mt-4 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                {check.linkLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <RelatedChecks
        id="rune-continue-from-here"
        checks={runeRelatedChecks}
        className="mb-12 scroll-mt-24"
        title="Continue From Here"
        description="Move from the source-boundary router into settlement mechanics, live network numbers, or official source maps before making current RUNE claims."
        badgeLabel="claim path"
      />

      <h2 id={supplyAnchor} className="scroll-mt-24 text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Token Economics</h2>
      <p className="mb-4 text-sm text-slate-400">
        {supplyRecord.data.summary} Recheck live/source data before quoting exact balances.
      </p>
      <div className="mb-4">
        <FreshnessMeta freshness={supplyRecord.freshness} sources={supplyRecord.sources} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {supplyRecord.data.figures.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-right">{row.value}</span>
            <Badge variant={getTokenomicsToneBadgeVariant(row.tone)}>{getTokenomicsToneLabel(row.tone)}</Badge>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">How RUNE Flows</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">1. Swaps</h3>
          <p className="text-xs text-slate-400">A swap routes through RUNE-paired pools. RUNE acts as the common settlement layer between native assets.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">2. Liquidity</h3>
          <p className="text-xs text-slate-400">Liquidity providers supply pool depth and earn source-dependent fees and rewards according to current protocol rules.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">3. Security</h3>
          <p className="text-xs text-slate-400">Node operators bond RUNE. Misbehavior can put that bond at risk through slash mechanisms and churn rules.</p>
        </Card>
      </div>
    </PageContainer>
  );
}
