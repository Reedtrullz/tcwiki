import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import NetworkPageClient from './NetworkPageClient';

const entry = getContentEntry('network');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function NetworkPage() {
  return (
    <NetworkPageClient>
      <PageSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Current operational diagnostics, halt controls, node/security concepts, and source-warning posture.',
          'Separating live THORNode/Midgard evidence from dated security reports and static protocol explanations.',
        ]}
        verifyBeforeClaiming={[
          'That a paused operation, chain, signing path, LP action, TCY control, or app-layer feature is available right now.',
          'That historical incident reports prove present-day safety, solvency, signing availability, or route quality.',
        ]}
      />
    </NetworkPageClient>
  );
}
