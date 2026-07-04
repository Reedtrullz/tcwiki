import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { PageContainer } from '@/components/layout/PageContainer';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import StatsPageClient from './StatsPageClient';

const entry = getContentEntry('stats');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function StatsPage() {
  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Network Statistics</h1>
        <p className="text-slate-400 max-w-3xl">
          Current-only THORChain metrics from Midgard and THORNode. Unavailable upstream data is shown as degraded, not zero.
        </p>
      </div>
      <RouteSourcePosture
        entry={entry}
        className="mb-8"
        useFor={[
          'Current-only Midgard and THORNode metric readbacks with visible source freshness.',
          'Deciding which live numbers need attention before interpreting liquidity, rewards, node, reserve, or earnings trends.',
        ]}
        verifyBeforeClaiming={[
          'Durable historical revenue, route competitiveness, solvency, or attribution quality from a rendered metric alone.',
          'That swaps, signing, LP actions, or a specific chain are currently available without checking network diagnostics.',
        ]}
      />
      <StatsPageClient />
    </PageContainer>
  );
}
