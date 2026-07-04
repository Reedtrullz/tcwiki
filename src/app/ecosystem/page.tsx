import Link from 'next/link';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';
import { PageContainer } from '@/components/layout/PageContainer';
import { EcosystemFilterList } from '@/components/features/EcosystemFilterList';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Ecosystem | THORChain Wiki',
  description: 'Curated THORChain ecosystem references with source confidence, chain filters, and explicit non-endorsement posture.',
  path: '/ecosystem',
});

const entry = getContentEntry('ecosystem');

export default function EcosystemPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ecosystem</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        Selected applications, wallets, interfaces, explorers, and developer tools. This is a curated reference index, not an endorsement list, safety review, or proof of current availability.
      </p>
      <RouteSourcePosture
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Before Using An Interface</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <p className="text-sm font-semibold text-slate-200">Check live protocol state</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Trading, signing, observation, LP actions, and chain-specific controls can change independently of app uptime.
            </p>
            <Link href="/network#network-diagnostics" className="mt-3 inline-block text-xs text-accent transition-colors hover:text-accent/80">
              Open network diagnostics
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <p className="text-sm font-semibold text-slate-200">Read the source posture</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Directory entries show what the wiki source backs, but not current uptime, terms, quotes, or wallet safety.
            </p>
            <Link href="/docs#third-party-interfaces-wallets" className="mt-3 inline-block text-xs text-accent transition-colors hover:text-accent/80">
              Open source map
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface-elevated p-4">
            <p className="text-sm font-semibold text-slate-200">Verify third-party risk</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Confirm release source, permissions, routed quote, recipient, slippage, and product availability before signing.
            </p>
            <a href="#ecosystem-directory" className="mt-3 inline-block text-xs text-accent transition-colors hover:text-accent/80">
              Review directory checks
            </a>
          </div>
        </div>
      </section>

      <section id="ecosystem-directory" className="scroll-mt-24">
        <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS} chainRecords={CHAIN_RECORDS} />
      </section>
    </PageContainer>
  );
}
