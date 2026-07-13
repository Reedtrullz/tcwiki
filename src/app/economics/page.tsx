import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { getTokenomicsRecord } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { getTokenomicsToneBadgeVariant, getTokenomicsToneLabel } from '@/lib/trust';
import { RunepoolPolPanel } from './RunepoolPolPanel';

export const metadata = createRouteMetadata({
  title: 'THORChain Economics | THORChain Wiki',
  description: 'Source-backed THORChain economics covering RUNE settlement, CLP pricing, fees, incentive pendulum, RUNEPool, and protocol-owned liquidity.',
  path: '/economics',
});

const entry = getContentEntry('economics');
const supplyRecord = getTokenomicsRecord('rune-supply-framing');

const economicsRelatedChecks: RelatedCheck[] = [
  {
    label: 'Swap Economics',
    href: '/deep-dives#deep-dive-path-swap-economics',
    badge: 'path',
    description: 'Read settlement, CLP mechanics, incentives, and slashing together.',
  },
  {
    label: 'Stats decision panel',
    href: '/stats#stats-look-here-first',
    badge: 'live state',
    description: 'Check current liquidity, reward, source-health, and earnings coverage.',
  },
  {
    label: 'RUNEPool/POL evidence',
    href: '/economics#runepool-pol-live',
    badge: 'live state',
    description: 'Check current RUNEPool accounting, availability caveats, POL scope, and source labels.',
  },
  {
    label: 'Dynamic fee tracker',
    href: '/dynamic-fees#dynamic-fees-live',
    badge: 'ADR-026',
    description: 'Separate partner-pair dynamic fee evidence from ordinary fee mechanics.',
  },
  {
    label: 'CLP deep dive',
    href: '/deep-dives/clp',
    badge: 'deep dive',
    description: 'Use the long-form article for slip-pricing and liquidity-fee mechanics.',
  },
];

const economicClaimChecks = [
  {
    title: 'Mechanism explanation',
    badge: 'static docs',
    badgeVariant: 'info' as const,
    use: 'CLP formula, slip pricing, settlement routing, incentive pendulum, fee categories.',
    verify: 'Open the relevant deep dive before turning a short summary into implementation guidance.',
    avoid: 'Do not use a static mechanism summary as proof that a route is currently available.',
    href: '/deep-dives#deep-dive-path-swap-economics',
    linkLabel: 'Read the swap economics path',
  },
  {
    title: 'Current metric claim',
    badge: 'live data',
    badgeVariant: 'warning' as const,
    use: 'Liquidity depth, APY, earnings, active nodes, bond/liquidity posture, and recent reward coverage.',
    verify: 'Use the Stats decision panel and keep source-health labels attached to the number.',
    avoid: 'Do not quote unavailable intervals, degraded sources, or stale snapshots as clean live facts.',
    href: '/stats#stats-look-here-first',
    linkLabel: 'Check live metrics',
  },
  {
    title: 'Fee or revenue claim',
    badge: 'fee evidence',
    badgeVariant: 'warning' as const,
    use: 'Ordinary fee mechanics, outbound fee framing, affiliate fees, and ADR-026 dynamic-fee evidence.',
    verify: 'Use Dynamic Fees only for per-thorname and per-pair experiment records, then separate it from ordinary CLP fees.',
    avoid: 'Do not claim durable revenue lift, route competitiveness, or attribution quality from current records alone.',
    href: '/dynamic-fees#dynamic-fees-live',
    linkLabel: 'Open dynamic fee tracker',
  },
  {
    title: 'RUNEPool or POL claim',
    badge: 'current-only',
    badgeVariant: 'warning' as const,
    use: 'RUNEPool provider value, PnL, POL-enabled pools, deposit/withdraw availability, and aggregate exposure wording.',
    verify: 'Use the live RUNEPool/POL snapshot, Network diagnostics, THORNode runepool fields, and Mimir before quoting a current state.',
    avoid: 'Do not treat provider PnL, APY, or POL scope as proof of future yield, safety, route health, or open deposits.',
    href: '/economics#runepool-pol-live',
    linkLabel: 'Open live RUNEPool/POL snapshot',
  },
  {
    title: 'Tokenomics figure',
    badge: 'dated source',
    badgeVariant: 'default' as const,
    use: 'Supply framing, emission context, burn/reduction framing, and RUNE/TCY historical token notes.',
    verify: 'Use the RUNE and TCY pages for dated source labels before quoting supply or recovery context.',
    avoid: 'Do not present dated tokenomics records as current price, fair value, or recovery guarantees.',
    href: '/rune#tokenomics-rune-supply-framing',
    linkLabel: 'Review tokenomics source',
  },
];

export default function EconomicsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Economics & Tokenomics</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        RUNE settlement, CLP pricing, fees, incentive design, RUNEPool/POL, trade assets, and current-only protocol parameters.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'Economic mechanisms, fee categories, RUNE settlement, CLP pricing, and incentive-design explanations.',
          'Dated tokenomics framing and links into source-backed supply context.',
        ]}
        verifyBeforeClaiming={[
          'Current APY, pool depth, protocol-owned liquidity balances, or RUNEPool state.',
          'Exact current fee settings, Mimir overrides, outbound fees, or live route competitiveness.',
        ]}
      />
      <RelatedChecks
        checks={economicsRelatedChecks}
        className="mb-12"
        title="Continue From Here"
        description="Use the economics page for mechanisms, then jump to the live dashboard or deeper path before quoting current liquidity, rewards, or fee conclusions."
        badgeLabel="claim path"
      />

      <section id="economic-claim-checks" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Economic Claim Checks</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Start by deciding what kind of economic statement you are making. This page explains mechanisms; live numbers, fee-experiment records, and dated tokenomics claims need their own source path.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {economicClaimChecks.map((check) => (
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
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Do Not Claim</dt>
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

      <RunepoolPolPanel />

      <SectionHeader>RUNE Token</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Settlement Asset', desc: 'External-asset swaps route through RUNE-paired liquidity, which keeps the liquidity graph simple and shared.' },
          { title: 'Security Bond', desc: 'Node operators bond RUNE to participate. Bond size, minimum bond, and slash parameters should be checked from live constants and Mimir.' },
          { title: 'Protocol Governance Context', desc: 'THORChain governance is intentionally minimal. Node operators and Mimir govern operational parameters; ADRs/TIPs document changes.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Supply & Emission</SectionHeader>
      <p className="mb-4 text-sm text-slate-400">
        {supplyRecord.data.summary} Treat these as dated/source-backed figures, not hard-coded live balances.
      </p>
      <div className="mb-4">
        <FreshnessMeta freshness={supplyRecord.freshness} sources={supplyRecord.sources} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {supplyRecord.data.figures.slice(0, 5).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-right">{row.value}</span>
            <Badge variant={getTokenomicsToneBadgeVariant(row.tone)}>{getTokenomicsToneLabel(row.tone)}</Badge>
          </div>
        ))}
      </div>

      <SectionHeader>Fee Structure</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { fee: 'Inbound Gas', rate: 'Chain-specific', desc: 'External-chain gas paid by the user when sending inbound transactions.' },
          { fee: 'Liquidity / Slip Fee', rate: 'Dynamic', desc: 'Scaled by trade size relative to pool depth; protects liquidity providers.' },
          { fee: 'Affiliate Fee', rate: 'Optional', desc: 'Interface- or affiliate-defined fee when a memo includes an affiliate basis-point setting.' },
          { fee: 'Outbound Fee', rate: 'Dynamic', desc: 'Covers outbound gas and protocol fee logic. Gas rate and minimums are live values.' },
        ].map((fee) => (
          <Card key={fee.fee}>
            <h3 className="text-sm font-semibold mb-2">{fee.fee}</h3>
            <p className="text-xl font-bold text-accent mb-1">{fee.rate}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{fee.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Incentive Pendulum</SectionHeader>
      <p className="mb-4 text-sm text-slate-400">
        The pendulum allocates the node/LP share of network revenue based on the network&apos;s bond-to-liquidity posture.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card className="border-rune/20">
          <h3 className="text-sm font-semibold text-rune mb-2">Low bond security</h3>
          <p className="text-xs text-slate-400">When the network needs more security relative to liquidity, rewards shift toward node operators.</p>
        </Card>
        <Card className="border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">Low pooled liquidity</h3>
          <p className="text-xs text-slate-400">When the network needs more depth, rewards shift toward liquidity providers.</p>
        </Card>
      </div>

      <SectionHeader>RUNEPool, POL, Trade Accounts, and Secured Assets</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
        {[
          {
            title: 'RUNEPool',
            desc: 'RUNEPool lets RUNE providers participate in protocol-owned liquidity. The enablement flag, aggregate provider value, and PnL are current-only THORNode fields, not wallet-flow proof.',
            href: '/deep-dives/runepool-pol#runepool-versus-lp-positions',
            linkLabel: 'Read RUNEPool evidence',
          },
          {
            title: 'Protocol-Owned Liquidity',
            desc: 'POL changes protocol exposure and should be described with current-only balances, POL-enabled pool scope, and source labels.',
            href: '/deep-dives/runepool-pol#accounting-checks',
            linkLabel: 'Check POL boundaries',
          },
          {
            title: 'Trade And Secured Assets',
            desc: 'Trade-account flows and secured assets are separate concepts. Check live trade-account, secured-asset, chain, and app-layer controls before current-use claims.',
            href: '/deep-dives/app-layer#app-layer-claim-checks',
            linkLabel: 'Read App Layer boundaries',
          },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
            <Link href={card.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
              {card.linkLabel}
            </Link>
          </Card>
        ))}
      </div>

      <SectionHeader>CLP Formula</SectionHeader>
      <Card className="font-mono text-xs text-slate-400 space-y-1">
        <p><span className="text-accent">Slip Ratio:</span> slip = x / (X + x), where x is input and X is input-side pool depth</p>
        <p><span className="text-accent">Liquidity Fee:</span> fee = (x^2 * Y) / (x + X)^2, denominated in the output asset</p>
        <p><span className="text-accent">Output Amount:</span> y = (x * X * Y) / (x + X)^2, where Y is output-side pool depth</p>
      </Card>
    </PageContainer>
  );
}
