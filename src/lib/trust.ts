import {
  DataConfidence,
  DATA_CONFIDENCES,
  FreshnessMeta,
  LiveDataResult,
  SourceMeta,
  SourcedRecord,
  TokenomicsSnapshot,
} from '@/lib/types';

const RUNE_BASE_UNITS = BigInt(100000000);
const ZERO_BIGINT = BigInt(0);
const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const BASE_UNIT_DECIMAL_PATTERN = /^\d+$/;
const DECIMAL_NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

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

export function isDataConfidence(value: unknown): value is DataConfidence {
  return typeof value === 'string' && DATA_CONFIDENCES.includes(value as DataConfidence);
}

function strictDecimalNumber(value: string): number | null {
  if (!DECIMAL_NUMBER_PATTERN.test(value)) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function runeBaseUnitsToBigInt(baseUnits: string | number | bigint | undefined): bigint | null {
  if (baseUnits === undefined || baseUnits === null || baseUnits === '') {
    return null;
  }

  if (typeof baseUnits === 'string') {
    if (!BASE_UNIT_DECIMAL_PATTERN.test(baseUnits)) {
      return null;
    }
    return BigInt(baseUnits);
  }

  if (typeof baseUnits === 'number') {
    if (!Number.isSafeInteger(baseUnits) || baseUnits < 0) {
      return null;
    }
    return BigInt(baseUnits);
  }

  if (baseUnits < ZERO_BIGINT) {
    return null;
  }

  return baseUnits;
}

export function runeBaseUnitsToNumber(baseUnits: string | number | bigint | undefined): number | null {
  const units = runeBaseUnitsToBigInt(baseUnits);
  if (units === null) {
    return null;
  }

  const whole = units / RUNE_BASE_UNITS;
  if (whole > MAX_SAFE_INTEGER_BIGINT) {
    return null;
  }

  const fractional = units % RUNE_BASE_UNITS;
  return Number(whole) + Number(fractional) / Number(RUNE_BASE_UNITS);
}

export function formatRuneFromBaseUnits(baseUnits: string | number | bigint | undefined): string {
  const units = runeBaseUnitsToBigInt(baseUnits);
  if (units === null) {
    return 'Unavailable';
  }

  const roundedRune = (units + (RUNE_BASE_UNITS / BigInt(2))) / RUNE_BASE_UNITS;
  return roundedRune.toLocaleString();
}

type ApyInputScale = 'decimal' | 'percent';

export function normalizeApyToPercent(
  value: string | number | undefined,
  inputScale: ApyInputScale = 'percent'
): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : strictDecimalNumber(value);
  if (numeric === null || !Number.isFinite(numeric)) {
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

type TokenomicsFigureTone = TokenomicsSnapshot['figures'][number]['tone'];
type BadgeTone = 'success' | 'info' | 'warning' | 'danger';

export function getTokenomicsToneLabel(tone: TokenomicsFigureTone): string {
  switch (tone) {
    case 'historical':
      return 'Historical';
    case 'source-backed':
      return 'Source-backed';
    case 'dynamic':
      return 'Dynamic';
    case 'current-only':
      return 'Current-only';
  }
}

export function getTokenomicsToneBadgeVariant(tone: TokenomicsFigureTone): BadgeTone {
  switch (tone) {
    case 'source-backed':
      return 'success';
    case 'historical':
      return 'info';
    case 'dynamic':
      return 'warning';
    case 'current-only':
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
