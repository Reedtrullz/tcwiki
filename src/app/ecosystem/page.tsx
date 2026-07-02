import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';
import { PageContainer } from '@/components/layout/PageContainer';
import { EcosystemFilterList } from '@/components/features/EcosystemFilterList';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Ecosystem | THORChain Wiki',
  description: 'Curated THORChain ecosystem references with source confidence, chain filters, and explicit non-endorsement posture.',
  path: '/ecosystem',
});

export default function EcosystemPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ecosystem</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        Selected applications, wallets, interfaces, explorers, and developer tools. This is a curated reference index, not an endorsement list, safety review, or proof of current availability.
      </p>

      <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS} chainRecords={CHAIN_RECORDS} />
    </PageContainer>
  );
}
