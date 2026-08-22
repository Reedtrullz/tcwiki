import HomePageClient from './HomePageClient';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Wiki | Source-Backed Protocol Encyclopedia',
  description: 'Community-maintained THORChain protocol encyclopedia with curated context, source-backed history, and current-only Midgard and THORNode live status.',
  path: '/',
});

const entry = getContentEntry('home');

export default function HomePage() {
  return (
    <HomePageClient
      sourcePosture={(
        <PageSourcePosture
          entry={entry}
          className="border-accent/10"
          useFor={[
            'Choosing the right first proof path for live operations, metrics, guided answers, learning paths, ecosystem pointers, and source maps.',
            'Knowing which sources back the homepage before following current-only or dated-context links.',
          ]}
          verifyBeforeClaiming={[
            'Current swaps, route availability, signing, LP actions, TCY actions, RUNEPool availability, or data-source health.',
            'Third-party interface safety, future uptime, investment value, recovery completion, or protocol behavior after the checked snapshot.',
          ]}
        />
      )}
    />
  );
}
