import SearchPageClient from './SearchPageClient';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'Search And Guided Answers | THORChain Wiki',
  description: 'Search source-backed THORChain wiki content or start from guided answer paths for live state, source choice, glossary terms, integrations, recovery, and protocol claims.',
  path: '/search',
});

const entry = getContentEntry('search');

export default function SearchPage() {
  return (
    <SearchPageClient
      sourcePosture={(
        <RouteSourcePosture
          entry={entry}
          className="mt-10"
          useFor={[
            'Finding wiki pages, glossary terms, source-map sections, task guides, and reader paths.',
            'Choosing where to start when the right THORChain source or proof boundary is unclear.',
          ]}
          verifyBeforeClaiming={[
            'Current protocol state, route availability, wallet safety, revenue lift, or recovery completion.',
            'That a high-ranked result proves the claim without checking the result source, review date, and live evidence.',
          ]}
        />
      )}
    />
  );
}
