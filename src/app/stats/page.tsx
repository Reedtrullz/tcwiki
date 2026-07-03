import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import StatsPageClient from './StatsPageClient';

const entry = getContentEntry('stats');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function StatsPage() {
  return <StatsPageClient />;
}
