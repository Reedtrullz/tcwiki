import type { LiveDataResult } from '@/lib/types';
import { collectSourceWarningSignals } from '@/lib/source-warnings';

export function liveResultHasSourceWarnings<T>(result: LiveDataResult<T> | undefined) {
  const warnings = collectSourceWarningSignals(result?.data);
  return warnings.messages.length > 0 || warnings.details.length > 0;
}

export function liveResultIsDegraded<T>(result: LiveDataResult<T> | undefined) {
  return Boolean(result?.status === 'degraded' || liveResultHasSourceWarnings(result));
}
