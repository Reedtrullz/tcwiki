import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { RelatedChecks } from '@/components/features/RelatedChecks';
import { runeRelatedChecks, runeActionRoutes, getRuneNumberRoutes, getRuneClaimChecks } from '@/lib/data/rune-page';
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

const runeToc: TocItem[] = [
  { id: 'rune-overview', label: 'What is RUNE?' },
  { id: 'rune-action-router', label: 'Action router' },
  { id: 'rune-number-router', label: 'Number router' },
  { id: 'rune-claim-checks', label: 'Claim checks' },
  { id: 'rune-continue-from-here', label: 'Continue from here' },
  { id: 'rune-token-economics', label: 'Token economics' },
];
const supplyRecord = getTokenomicsRecord('rune-supply-framing');
const supplyAnchor = recordAnchor('tokenomics', supplyRecord.data.id);

const runeNumberRoutes = getRuneNumberRoutes(supplyAnchor);
const runeClaimChecks = getRuneClaimChecks(supplyAnchor);

export default function RunePage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">RUNE Token</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        RUNE is the native asset used for settlement, liquidity pairing, economic security, and protocol accounting.
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      <PageSourcePosture
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
        <SectionHeader id="rune-overview-heading" level="primary" className="mb-5">What is RUNE?</SectionHeader>
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
          <SectionHeader className="mb-3" level="primary">What Do You Want To Do With RUNE?</SectionHeader>
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
          <SectionHeader className="mb-3" level="primary">Which RUNE Number Do You Need?</SectionHeader>
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
          <SectionHeader className="mb-3" level="primary">RUNE Claim Checks</SectionHeader>
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

      <div id={supplyAnchor} className="scroll-mt-24" />
      <SectionHeader id="rune-token-economics" level="primary" className="scroll-mt-24">Token Economics</SectionHeader>
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

      <p className="mb-12 max-w-3xl text-xs leading-relaxed text-slate-500">
        For how RUNE flows through swaps, liquidity, and security, see the <Link href="/deep-dives/rune-settlement" className="text-accent hover:underline">RUNE Settlement</Link> deep dive and the <Link href="/protocol" className="text-accent hover:underline">Protocol Overview</Link>.
      </p>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={runeToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
