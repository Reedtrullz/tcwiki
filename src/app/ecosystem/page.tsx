import Link from 'next/link';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EcosystemFilterList } from '@/components/features/EcosystemFilterList';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Ecosystem | THORChain Wiki',
  description: 'Curated THORChain ecosystem references with source confidence, chain filters, and explicit non-endorsement posture.',
  path: '/ecosystem',
});

const entry = getContentEntry('ecosystem');

const ecosystemToc: TocItem[] = [
  { id: 'interface-use-checklist', label: 'Before using an interface' },
  { id: 'ecosystem-directory', label: 'Ecosystem directory' },
];

const interfaceIntentGuides = [
  {
    id: 'swap',
    intent: 'Swap or quote',
    startWith: 'Live route status and a fresh quote check.',
    verify: 'Trading, signing, chain state, quote amount, recipient, slippage, fees, and expiry.',
    nonClaim: 'Do not infer current route settlement from catalog presence.',
    actionLabel: 'Check a route',
    href: '/network#check-a-route',
  },
  {
    id: 'wallet',
    intent: 'Wallet or app',
    startWith: 'The project card, source map, and upstream release path.',
    verify: 'Download source, wallet permissions, connected accounts, signing prompts, and current support.',
    nonClaim: 'Do not infer wallet safety or custody quality.',
    actionLabel: 'Read interface source map',
    href: '/docs#third-party-interfaces-wallets',
  },
  {
    id: 'explorer',
    intent: 'Transaction or refund evidence',
    startWith: 'Explorer records plus the refund evidence ladder.',
    verify: 'Inbound transaction hash, observed memo, source chain, destination chain, outbound, and refund transaction.',
    nonClaim: 'Explorer display alone does not establish a refund cause.',
    actionLabel: 'Open refund triage',
    href: '/deep-dives/streaming-swaps-refunds#evidence-ladder',
  },
  {
    id: 'builder',
    intent: 'Build an integration',
    startWith: 'Developer docs, SDK records, and live quote behavior.',
    verify: 'Package version, API compatibility, memo handling, affiliate settings, quote errors, and production readiness.',
    nonClaim: 'A listed SDK is not production-safe by inclusion.',
    actionLabel: 'Open build/query guide',
    href: '/deep-dives/build-query-data#query-plan',
  },
];

const interfaceJourneySteps = [
  {
    step: '1',
    title: 'Choose the surface',
    body: 'Decide whether you need a swap interface, wallet workflow, explorer evidence, or developer tooling. Directory filters narrow sourced pointers; they do not rank safety.',
    actionLabel: 'Review directory checks',
    href: '#ecosystem-directory',
  },
  {
    step: '2',
    title: 'Check live protocol state',
    body: 'Trading, signing, observation, LP actions, and chain-specific controls can change independently of catalog presence or directory posture; neither reports app uptime.',
    actionLabel: 'Open network diagnostics',
    href: '/network#network-diagnostics',
  },
  {
    step: '3',
    title: 'Read source posture',
    body: 'Source labels explain what the wiki backs. They do not prove uptime, route quality, wallet safety, current terms, or official endorsement.',
    actionLabel: 'Open source map',
    href: '/docs#third-party-interfaces-wallets',
  },
  {
    step: '4',
    title: 'Inspect signing risk',
    body: 'Before opening a third-party path, verify release source, wallet permissions, quoted route, recipient, slippage, fees, and product availability.',
    actionLabel: 'Find ecosystem entries',
    href: '#ecosystem-directory',
  },
];

export default function EcosystemPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ecosystem</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        Selected applications, wallets, interfaces, explorers, and developer tools. This is a curated reference index, not an endorsement list, safety review, or proof of current availability.
      </p>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      <PageSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Finding known interfaces, wallets, explorers, developer tools, and source-linked ecosystem references.',
          'Understanding category, chain, and source labels for curated project records.',
        ]}
        verifyBeforeClaiming={[
          'Current service uptime, wallet safety, integration security, pricing, or official endorsement.',
          'Whether a third-party interface is currently safe or suitable for a transaction.',
        ]}
      />

      <section id="interface-use-checklist" className="mb-10 scroll-mt-24">
        <div className="mb-3">
          <div>
            <SectionHeader level="primary">Before Using An Interface</SectionHeader>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              Use this as an interface trust journey: choose by intent, check live protocol state, read what the sources actually prove, then inspect the transaction or download path before signing.
            </p>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Choose ecosystem surface by intent">
          {interfaceIntentGuides.map((item) => {
            const linkClassName = 'mt-3 inline-block text-xs font-semibold text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
            const link = item.href.startsWith('/') ? (
              <Link href={item.href} className={linkClassName}>
                {item.actionLabel}
              </Link>
            ) : (
              <a href={item.href} className={linkClassName}>
                {item.actionLabel}
              </a>
            );

            return (
              <div key={item.id} className="rounded-lg border border-border bg-surface-elevated p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Intent</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{item.intent}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  <span className="font-medium text-slate-300">Start with: </span>
                  {item.startWith}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  <span className="font-medium text-slate-300">Verify: </span>
                  {item.verify}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
                  {item.nonClaim}
                </p>
                {link}
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {interfaceJourneySteps.map((item) => {
            const linkClassName = 'mt-3 inline-block text-xs text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60';
            const link = item.href.startsWith('/') ? (
              <Link href={item.href} className={linkClassName}>
                {item.actionLabel}
              </Link>
            ) : (
              <a href={item.href} className={linkClassName}>
                {item.actionLabel}
              </a>
            );

            return (
              <div key={item.step} className="rounded-lg border border-border bg-surface-elevated p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Step {item.step}</p>
                <p className="mt-2 text-sm font-semibold text-slate-200">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.body}</p>
                {link}
              </div>
            );
          })}
        </div>
      </section>

      <section id="ecosystem-directory" className="scroll-mt-24">
        <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS} chainRecords={CHAIN_RECORDS} />
      </section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={ecosystemToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
