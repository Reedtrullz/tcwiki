import DynamicFeesPageClient from '@/app/dynamic-fees/DynamicFeesPageClient';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'Dynamic L1 Fees | THORChain Wiki',
  description: 'Current-only tracker and source-backed explainer for THORChain ADR-026 dynamic L1 minimum fee floors by thorname and pair.',
  path: '/dynamic-fees',
});

const entry = getContentEntry('dynamic-fees');

export default function DynamicFeesPage() {
  return (
    <DynamicFeesPageClient>
      <RouteSourcePosture
        entry={entry}
        className="mb-8"
        useFor={[
          'ADR-026 design context, dynamic L1 fee controls, whitelist state, pair scope, and live THORNode endpoint evidence.',
          'Current-only sealed records and current-epoch accumulators with explicit source warnings and insufficient-sample states.',
        ]}
        verifyBeforeClaiming={[
          'Durable revenue lift, route competitiveness, partner attribution quality, or final governance history.',
          'Current trading, signing, chain, app-layer, secured-asset, or broader network availability outside the dynamic-fee endpoint snapshot.',
        ]}
      />
    </DynamicFeesPageClient>
  );
}
