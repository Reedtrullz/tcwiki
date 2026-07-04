import type { LiveDataResult } from '@/lib/types';

function nonEmptyArray(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function dataHasSourceWarnings(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(dataHasSourceWarnings);
  }

  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as {
    sourceWarnings?: unknown;
    sourceWarningDetails?: unknown;
  };

  return nonEmptyArray(candidate.sourceWarnings) || nonEmptyArray(candidate.sourceWarningDetails);
}

export function liveResultHasSourceWarnings<T>(result: LiveDataResult<T> | undefined) {
  return dataHasSourceWarnings(result?.data);
}

export function liveResultIsDegraded<T>(result: LiveDataResult<T> | undefined) {
  return Boolean(result?.status === 'degraded' || liveResultHasSourceWarnings(result));
}
