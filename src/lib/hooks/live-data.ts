import type { LiveDataResult } from '@/lib/types';
import { liveDegraded } from '@/lib/trust';
import { liveResultIsDegraded } from '@/lib/live-result';

export const SWR_OPTIONS = {
  refreshInterval: 60000,
  revalidateOnFocus: false,
};

export function unwrapLiveResult<T>(result: LiveDataResult<T> | undefined, error: unknown, isLoading: boolean) {
  const errorMessage = error instanceof Error ? error.message : undefined;
  const resolvedResult = result ?? (errorMessage ? liveDegraded<T>(errorMessage) : undefined);
  return {
    result: resolvedResult,
    data: resolvedResult?.data,
    status: resolvedResult?.status,
    error: errorMessage ?? resolvedResult?.error,
    source: resolvedResult?.source,
    sources: resolvedResult?.sources,
    checkedAt: resolvedResult?.checkedAt,
    isLoading,
    isDegraded: liveResultIsDegraded(resolvedResult),
  };
}
