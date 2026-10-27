import { RouteRecoveryPanel } from '@/components/features/RouteRecoveryPanel';

export default function NotFound() {
  return (
    <RouteRecoveryPanel
      title="That page could not be found"
      description="The address may be outdated or mistyped. Use the wiki home, source map, or search to continue."
    />
  );
}
