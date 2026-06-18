import {
  DataConfidence,
  FreshnessMeta,
  LiveDataResult,
  SourceMeta,
  SourcedRecord,
} from '@/lib/types';

const RUNE_BASE_UNITS = BigInt(100000000);

export function withFreshness<T>(
  data: T,
  sources: SourceMeta[],
  freshness: FreshnessMeta
): SourcedRecord<T> {
  return { data, sources, freshness };
}

export function unwrapRecord<T>(record: SourcedRecord<T>): T {
  return record.data;
}

export function runeBaseUnitsToNumber(baseUnits: string | number | bigint | undefined): number | null {
  if (baseUnits === undefined || baseUnits === null || baseUnits === '') {
    return null;
  }

  try {
    const value = BigInt(baseUnits);
    return Number(value) / Number(RUNE_BASE_UNITS);
  } catch {
    return null;
  }
}

export function formatRuneFromBaseUnits(baseUnits: string | number | bigint | undefined): string {
  const runeValue = runeBaseUnitsToNumber(baseUnits);
  if (runeValue === null) {
    return 'Unavailable';
  }

  return runeValue.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
}

type ApyInputScale = 'decimal' | 'percent';

export function normalizeApyToPercent(
  value: string | number | undefined,
  inputScale: ApyInputScale = 'percent'
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return inputScale === 'decimal' ? numeric * 100 : numeric;
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return 'Unavailable';
  }

  return `${value.toFixed(digits)}%`;
}

export function getConfidenceLabel(confidence: DataConfidence): string {
  switch (confidence) {
    case 'official':
      return 'Official source';
    case 'curated':
      return 'Curated';
    case 'historical':
      return 'Historical';
    case 'needs-review':
      return 'Needs review';
  }
}

export function getConfidenceTone(confidence: DataConfidence): 'success' | 'info' | 'warning' | 'danger' {
  switch (confidence) {
    case 'official':
      return 'success';
    case 'curated':
      return 'info';
    case 'historical':
      return 'warning';
    case 'needs-review':
      return 'danger';
  }
}

export function getFreshnessLabel(freshness: FreshnessMeta): string {
  return `Checked ${freshness.checkedAt}`;
}

function sourcesWithRetrievedAt(source: SourceMeta | SourceMeta[], checkedAt: string): SourceMeta[] {
  const sources = Array.isArray(source) ? source : [source];
  return sources.map((entry) => ({
    ...entry,
    retrievedAt: checkedAt,
  }));
}

export function liveOk<T>(
  data: T,
  source: SourceMeta | SourceMeta[],
  checkedAt = new Date().toISOString()
): LiveDataResult<T> {
  const sources = sourcesWithRetrievedAt(source, checkedAt);
  return {
    status: 'ok',
    data,
    source: sources[0],
    sources,
    checkedAt,
  };
}

export function liveDegraded<T>(
  error: string,
  source?: SourceMeta | SourceMeta[],
  checkedAt = new Date().toISOString()
): LiveDataResult<T> {
  const sources = source ? sourcesWithRetrievedAt(source, checkedAt) : undefined;
  return {
    status: 'degraded',
    error,
    source: sources?.[0],
    sources,
    checkedAt,
  };
}

export function getLiveDataCopy(result: LiveDataResult<unknown> | undefined): string {
  if (!result) {
    return 'Loading source-backed data.';
  }

  if (result.status === 'ok') {
    return `Current-only data from ${result.source?.label ?? 'live source'}.`;
  }

  return result.error ?? 'Source did not respond.';
}
