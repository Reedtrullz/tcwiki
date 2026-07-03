import DynamicFeesPageClient from '@/app/dynamic-fees/DynamicFeesPageClient';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'Dynamic L1 Fees | THORChain Wiki',
  description: 'Current-only tracker and source-backed explainer for THORChain ADR-026 dynamic L1 minimum fee floors by thorname and pair.',
  path: '/dynamic-fees',
});

export default function DynamicFeesPage() {
  return <DynamicFeesPageClient />;
}
