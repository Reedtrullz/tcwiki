import SearchPageClient from './SearchPageClient';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'Search | THORChain Wiki',
  description: 'Search source-backed THORChain wiki sections, deep dives, glossary terms, incidents, ecosystem entries, governance records, and research.',
  path: '/search',
});

export default function SearchPage() {
  return <SearchPageClient />;
}
