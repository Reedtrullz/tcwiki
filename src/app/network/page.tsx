import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import NetworkPageClient from './NetworkPageClient';

const entry = getContentEntry('network');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default function NetworkPage() {
  return <NetworkPageClient />;
}
