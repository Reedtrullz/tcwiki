import Link from 'next/link';
import { CHAIN_RECORDS } from '@/lib/data/static';
import {
  chainCatalogBoundary,
  architectureCards,
  currentStateControlCards,
  swapLifecycleCards,
  keyConceptCards,
  protocolRelatedChecks,
  protocolClaimChecks,
} from '@/lib/data/protocol-page';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { RelatedChecks } from '@/components/features/RelatedChecks';
import { ProtocolChainFinder } from '@/components/features/ProtocolChainFinder';
import { ClaimCheckCard } from '@/components/features/ClaimCheckCard';
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

const protocolToc: TocItem[] = [
  { id: 'protocol-claim-checks', label: 'Claim checks' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'current-state-controls', label: 'Current-state controls' },
  { id: 'swap-lifecycle', label: 'Swap lifecycle' },
  { id: 'key-concepts', label: 'Key concepts' },
  { id: 'supported-chains', label: 'Supported chains' },
];

export default function ProtocolPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Protocol Overview</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        THORChain is a decentralized cross-chain liquidity protocol for native asset swaps without wrapped assets or centralized custody.
      </p>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
          <PageSourcePosture
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

          <div id="protocol-claim-checks" className="scroll-mt-24 mb-6">
            <details className="mb-3 rounded-lg border border-border bg-surface-elevated px-4 py-3">
              <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                Claim checks by type
              </summary>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
                Start with the claim type. The overview explains how the system fits together; current availability, vault safety, and developer behavior need stronger source paths.
              </p>
            </details>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {protocolClaimChecks.map((check) => (
                <ClaimCheckCard
                  key={check.title}
                  title={check.title}
                  use={check.use}
                  verify={check.verify}
                  avoid={check.avoid}
                  href={check.href}
                  linkLabel={check.linkLabel}
                />
              ))}
            </div>
          </div>

          <RelatedChecks
            checks={protocolRelatedChecks}
            className="mb-12"
            title="Continue From Here"
            description="Move from the protocol overview into the right deeper read or live-source check before making an availability, implementation, or developer claim."
            badgeLabel="claim path"
          />

          <SectionHeader level="primary">Architecture</SectionHeader>
          <div id="architecture" className="grid grid-cols-1 scroll-mt-24 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
            {architectureCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
          </div>

          <SectionHeader level="primary">Current-State Controls</SectionHeader>
          <div id="current-state-controls" className="grid grid-cols-1 scroll-mt-24 md:grid-cols-2 gap-3 mb-12">
            {currentStateControlCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
          </div>

          <SectionHeader level="primary">Swap Lifecycle</SectionHeader>
          <div id="swap-lifecycle" className="grid grid-cols-1 scroll-mt-24 md:grid-cols-3 gap-3 mb-12">
            {swapLifecycleCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
          </div>

          <SectionHeader level="primary">Key Concepts</SectionHeader>
          <div id="key-concepts" className="grid grid-cols-1 scroll-mt-24 md:grid-cols-2 gap-3 mb-12">
            {keyConceptCards.map((card) => <ConceptLinkCard key={card.title} card={card} />)}
          </div>

          <div id="supported-chains" className="scroll-mt-24">
            <SectionHeader level="primary">Supported Chains</SectionHeader>
            <p className="text-sm text-slate-400 mb-4">
              This curated list mirrors chains observed in live inbound-address sources at the {chainCatalogReviewedAt} chain-catalog review. Availability, routing, signing, LP actions, and pause state remain live/current-only.
            </p>

            <section id="chain-catalog-boundary" className="mb-5 scroll-mt-24">
              <details className="group" open={true}>
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                  Catalog boundary guidance
                  <Badge variant="warning">not availability proof</Badge>
                  <span className="transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {chainCatalogBoundary.map((item) => (
                    <Card key={item.title} padding="sm">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="info">{item.badge}</Badge>
                        <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-400">{item.summary}</p>
                      <Link href={item.href} className="mt-3 inline-flex text-xs font-semibold text-accent underline-offset-4 hover:underline">
                        {item.linkLabel}
                      </Link>
                    </Card>
                  ))}
                </div>
              </details>
            </section>

            <div id="supported-chain-finder" className="scroll-mt-24">
              <ProtocolChainFinder chainRecords={CHAIN_RECORDS} catalogReviewedAt={chainCatalogReviewedAt} />
            </div>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={protocolToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
