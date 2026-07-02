import HomePageClient from './HomePageClient';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Wiki | Source-Backed Protocol Encyclopedia',
  description: 'Community-maintained THORChain protocol encyclopedia with curated context, source-backed history, and current-only Midgard and THORNode live status.',
  path: '/',
});

export default function HomePage() {
  return <HomePageClient />;
}
