import Link from 'next/link';
import { CHAIN_RECORDS } from '@/lib/data/static';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { ProtocolChainFinder } from '@/components/features/ProtocolChainFinder';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Protocol Overview | THORChain Wiki',
  description: 'Source-backed overview of THORChain architecture, native swaps, Bifrost, TSS vaults, Mimir, and supported-chain context.',
  path: '/protocol',
});

const entry = getContentEntry('protocol');
const chainCatalogReviewedAt = CHAIN_RECORDS.reduce((latest, record) => (
  record.freshness.checkedAt > latest ? record.freshness.checkedAt : latest
), CHAIN_RECORDS[0]?.freshness.checkedAt ?? 'unknown');

const protocolRelatedChecks: RelatedCheck[] = [
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

const protocolClaimChecks = [
  {
    title: 'Architecture explanation',
    badge: 'concept',
    use: 'Cosmos app-chain, Bifrost observation, vaults, pools, Mimir, and swap lifecycle structure.',
    verify: 'Use the New to THORChain path or the relevant deep dive before turning this into implementation detail.',
    avoid: 'Do not treat architecture cards as proof that a chain, route, or action is currently available.',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    linkLabel: 'Read the beginner path',
  },
  {
    title: 'Current availability claim',
    badge: 'live state',
    use: 'Whether swaps, signing, inbound addresses, LP actions, secured assets, or app-layer controls are open now.',
    verify: 'Use Network diagnostics and current source-map guidance before presenting availability as live.',
    avoid: 'Do not infer live state from supported-chain listings, old docs, or a missing halt mention.',
    href: '/network#network-diagnostics',
    linkLabel: 'Check live diagnostics',
  },
  {
    title: 'Security or vault claim',
    badge: 'security',
    use: 'TSS, vault signing, churn, Bifrost observation, slash exposure, and post-exploit migration language.',
    verify: 'Use the Network Security path plus dated incident or upgrade reports before describing current safety.',
    avoid: 'Do not convert a dated exploit report or migration discussion into present-day safety proof.',
    href: '/deep-dives#deep-dive-path-network-security',
    linkLabel: 'Read security path',
  },
  {
    title: 'Developer integration claim',
    badge: 'developer',
    use: 'Memos, asset notation, constants, Mimir keys, inbound-address fields, quote behavior, and API usage.',
    verify: 'Use official developer docs and live endpoint evidence before giving transaction or implementation guidance.',
    avoid: 'Do not use wiki summaries as send instructions, wallet guidance, or complete API contracts.',
    href: '/deep-dives/build-query-data#query-plan',
    linkLabel: 'Open build/query guide',
  },
];

const chainCatalogBoundary = [
  {
    title: 'Catalog Listed',
    badge: 'static boundary',
    href: '/docs#current-protocol-state',
    linkLabel: 'Check source boundary',
    proves: 'The chain appears in the curated supported-chain catalog refreshed from inbound-address evidence.',
    doesNotProve: 'Swaps, LP actions, signing, gas, outbound availability, or route quoteability right now.',
  },
  {
    title: 'Operational Now',
    badge: 'live state',
    href: '/network#network-diagnostics',
    linkLabel: 'Open diagnostics',
    proves: 'Current chain, trading, signing, LP, pool-deposit, and source-warning status at the checked block.',
    doesNotProve: 'Future uptime or that every asset pair on the chain can route.',
  },
  {
    title: 'Specific Route',
    badge: 'quote check',
    href: '/network#check-a-route',
    linkLabel: 'Check a route',
    proves: 'Whether THORNode can currently quote the selected from/to asset and amount.',
    doesNotProve: 'Wallet support, final execution after quote expiry, or safe recipient/memo handling.',
  },
  {
    title: 'Implementation Use',
    badge: 'builder path',
    href: '/deep-dives/build-query-data#query-plan',
    linkLabel: 'Open query plan',
    proves: 'Which endpoint family and source posture should be used for product or dashboard code.',
    doesNotProve: 'A complete transaction builder, wallet UX, or production integration contract by itself.',
  },
];

const architectureCards = [
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

const currentStateControlCards = [
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
    href: '/deep-dives/mimir-halt-controls#what-to-verify-before-claiming',
    linkLabel: 'Verify override posture',
  },
];

const swapLifecycleCards = [
  {
    title: 'Inbound',
    desc: 'A user sends a native asset to the current inbound address with a memo describing the intended action.',
    href: '/deep-dives/build-query-data#quotes-inbound-addresses-and-caching',
    linkLabel: 'Check quote timing',
  },
  {
    title: 'Execution',
    desc: 'The state machine prices the swap through RUNE-paired pools, applying slip/liquidity fees and current protocol rules.',
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

const keyConceptCards = [
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

function ConceptLinkCard({ card }: { card: { title: string; desc: string; href: string; linkLabel: string } }) {
  return (
    <Card>
      <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
      <Link href={card.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
        {card.linkLabel}
      </Link>
    </Card>
  );
}

export default function ProtocolPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Protocol Overview</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        THORChain is a decentralized cross-chain liquidity protocol for native asset swaps without wrapped assets or centralized custody.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'Architecture concepts, swap lifecycle, Bifrost, TSS, Mimir, and supported-chain context.',
          'Dated educational framing for how THORChain components fit together.',
        ]}
        verifyBeforeClaiming={[
          'Current halt, signing, inbound-address, gas-rate, or Mimir state.',
          'Exact live constants, minimum bond, slash settings, or current chain availability.',
        ]}
      />
      <RelatedChecks
        checks={protocolRelatedChecks}
        className="mb-12"
        title="Continue From Here"
        description="Move from the protocol overview into the right deeper read or live-source check before making an availability, implementation, or developer claim."
        badgeLabel="claim path"
      />

      <section id="protocol-claim-checks" className="mb-12 scroll-mt-24">
        <div className="mb-4 max-w-3xl">
          <SectionHeader className="mb-3">Protocol Claim Checks</SectionHeader>
          <p className="text-sm leading-relaxed text-slate-400">
            Start with the claim type. The overview explains how the system fits together; current availability, vault safety, and developer behavior need stronger source paths.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {protocolClaimChecks.map((check) => (
            <Card key={check.title} padding="md">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="info">{check.badge}</Badge>
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

      <SectionHeader>Architecture</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {architectureCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
      </div>

      <SectionHeader>Current-State Controls</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {currentStateControlCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
      </div>

      <SectionHeader>Swap Lifecycle</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
        {swapLifecycleCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
      </div>

      <SectionHeader>Key Concepts</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {keyConceptCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
      </div>

      <SectionHeader>Supported Chains</SectionHeader>
      <p className="text-sm text-slate-400 mb-4">
        This curated list mirrors chains observed in live inbound-address sources at the {chainCatalogReviewedAt} chain-catalog review. Availability, routing, signing, LP actions, and pause state remain live/current-only.
      </p>

      <section id="chain-catalog-boundary" className="mb-5 scroll-mt-24">
        <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Before Reading The Chain Grid</p>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
              Treat this as a catalog boundary, not a current availability dashboard. Move to the matching live check before telling a user a chain, action, or route is usable now.
            </p>
          </div>
          <Badge variant="warning">catalog is not availability</Badge>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {chainCatalogBoundary.map((item) => (
            <Card key={item.title} padding="sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="info">{item.badge}</Badge>
                <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
              </div>
              <dl className="space-y-2 text-xs leading-relaxed text-slate-400">
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-slate-500">Can Prove</dt>
                  <dd>{item.proves}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wider text-amber-300">Does Not Prove</dt>
                  <dd>{item.doesNotProve}</dd>
                </div>
              </dl>
              <Link href={item.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                {item.linkLabel}
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <div id="supported-chain-finder" className="scroll-mt-24">
        <ProtocolChainFinder chainRecords={CHAIN_RECORDS} catalogReviewedAt={chainCatalogReviewedAt} />
      </div>
    </PageContainer>
  );
}
