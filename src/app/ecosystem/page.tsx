import Link from 'next/link';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';
import { interfaceIntentGuides, interfaceJourneySteps } from '@/lib/data/ecosystem-page';
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
