'use client';

import { RouteRecoveryPanel } from '@/components/features/RouteRecoveryPanel';

interface RouteErrorProps {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}

export default function RouteError({ retry, reset }: RouteErrorProps) {
  return (
    <RouteRecoveryPanel
      title="This page hit a problem"
      description="Some page content failed to load. Try the page again or continue exploring the wiki."
      retry={retry}
      reset={reset}
    />
  );
}
