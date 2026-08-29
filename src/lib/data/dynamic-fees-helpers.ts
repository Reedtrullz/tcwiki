import type {
  DynamicL1FeeCurrentAccumulator,
  DynamicL1FeeMimirFlag,
  DynamicL1FeeRecord,
  DynamicL1FeeStatus,
  DynamicL1FeeWhitelistState,
  NetworkStatusSourceWarning,
} from '@/lib/types';

// --- Constants ---

export const TOR_BASE_UNIT_SCALE = BigInt(100000000);
export const MAX_SAFE_INTEGER_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
export const ZERO_BIGINT = BigInt(0);
export const TOR_BASE_UNIT_MAX_DIGITS = 80;
export const TOR_BASE_UNIT_PATTERN = /^\d+$/;
export const EMPTY_DYNAMIC_FEE_RECORDS: DynamicL1FeeRecord[] = [];

// --- Core formatting helpers ---

export function recordKey(thorname: string, pair: string) {
  return `${thorname.toLowerCase()}|${pair}`;
}

export function formatBps(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unavailable' : `${value} bps`;
}

export function formatEpoch(value: number | null | undefined) {
  return value === null || value === undefined ? 'Unavailable' : value.toLocaleString();
}

export function configSuffix(flag: DynamicL1FeeMimirFlag | undefined) {
  return flag?.value === null && flag.effectiveValue !== null && flag.effectiveValue !== undefined
    ? ' default'
    : '';
}

export function formatConfigInteger(flag: DynamicL1FeeMimirFlag | undefined, unit: string) {
  const value = flag?.effectiveValue ?? flag?.value;
  return value === null || value === undefined
    ? 'Unavailable'
    : `${value.toLocaleString()} ${unit}${configSuffix(flag)}`;
}

export function formatConfigDeadband(flag: DynamicL1FeeMimirFlag | undefined) {
  const value = flag?.effectiveValue ?? flag?.value;
  if (value === null || value === undefined) {
    return 'Unavailable';
  }
  const percent = value / 100;
  const percentText = Number.isInteger(percent) ? percent.toLocaleString() : percent.toFixed(2);
  return `${percentText}%${configSuffix(flag)}`;
}

export function formatBlockAge(seconds: number | undefined) {
  if (seconds === undefined) {
    return 'Age unavailable';
  }
  const absolute = Math.abs(seconds);
  if (absolute < 60) {
    return `${absolute}s ${seconds < 0 ? 'future' : 'old'}`;
  }
  return `${Math.round(absolute / 60)}m ${seconds < 0 ? 'future' : 'old'}`;
}

export function torBaseUnitsToBigInt(baseUnits: string | null | undefined) {
  if (!baseUnits || baseUnits.length > TOR_BASE_UNIT_MAX_DIGITS || !TOR_BASE_UNIT_PATTERN.test(baseUnits)) {
    return null;
  }

  return BigInt(baseUnits);
}

export function torBaseUnitsToNumber(units: bigint | null) {
  if (units === null) {
    return null;
  }

  const whole = units / TOR_BASE_UNIT_SCALE;
  if (whole > MAX_SAFE_INTEGER_BIGINT) {
    return null;
  }

  const fractional = units % TOR_BASE_UNIT_SCALE;
  return Number(whole) + Number(fractional) / Number(TOR_BASE_UNIT_SCALE);
}

export function formatTorFromBaseUnits(units: bigint | null) {
  if (units === null) {
    return 'Insufficient samples';
  }

  const whole = units / TOR_BASE_UNIT_SCALE;
  const fractional = units % TOR_BASE_UNIT_SCALE;
  const wholeText = whole <= MAX_SAFE_INTEGER_BIGINT
    ? Number(whole).toLocaleString('en-US')
    : whole.toLocaleString('en-US');
  const fractionalText = fractional.toString().padStart(8, '0').replace(/0+$/, '');

  return `${wholeText}${fractionalText ? `.${fractionalText}` : ''} TOR`;
}

export function formatTor(baseUnits: string | null | undefined) {
  return formatTorFromBaseUnits(torBaseUnitsToBigInt(baseUnits));
}

export function formatTorCompact(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'Insufficient samples';
  }
  if (value > 0 && value < 0.01) {
    return '<0.01 TOR';
  }

  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B TOR`;
  }
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M TOR`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K TOR`;
  }

  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 100 ? 2 : 0,
  })} TOR`;
}

export function sumTorBaseUnits(values: Array<string | null | undefined>) {
  let totalBaseUnits = ZERO_BIGINT;
  let hasValue = false;

  for (const value of values) {
    const units = torBaseUnitsToBigInt(value);
    if (units !== null) {
      totalBaseUnits += units;
      hasValue = true;
    }
  }

  return hasValue ? totalBaseUnits : null;
}

export function formatTorCompactFromBaseUnits(units: bigint | null | undefined) {
  if (units === null || units === undefined) {
    return 'Insufficient samples';
  }

  const value = torBaseUnitsToNumber(units);
  if (value === null || value >= 1_000_000_000) {
    return formatTorFromBaseUnits(units);
  }

  return formatTorCompact(value);
}

// --- History helpers ---

export type HistoryEpochRow = {
  epoch: number;
  feesTorBaseUnits: bigint | null;
  feesTor: number | null;
  volumeTorBaseUnits: bigint | null;
  volumeTor: number | null;
  averageBps: number | null;
  samples: number;
};

export function historySampleCount(status: DynamicL1FeeStatus | undefined) {
  return (status?.histories ?? []).reduce(
    (total, thornameHistory) => total + thornameHistory.pairs.reduce(
      (pairTotal, pair) => pairTotal + pair.history.length,
      0
    ),
    0
  );
}

export function historyPairCount(status: DynamicL1FeeStatus | undefined) {
  return (status?.histories ?? []).reduce((total, item) => total + item.pairs.length, 0);
}

export function historyEpochRows(status: DynamicL1FeeStatus | undefined): HistoryEpochRow[] {
  const byEpoch = new Map<number, {
    feesTorBaseUnits: bigint;
    hasFees: boolean;
    volumeTorBaseUnits: bigint;
    hasVolume: boolean;
    bpsTotal: number;
    samples: number;
  }>();

  for (const thornameHistory of status?.histories ?? []) {
    for (const pairHistory of thornameHistory.pairs) {
      for (const entry of pairHistory.history) {
        const row = byEpoch.get(entry.epoch) ?? {
          feesTorBaseUnits: ZERO_BIGINT,
          hasFees: false,
          volumeTorBaseUnits: ZERO_BIGINT,
          hasVolume: false,
          bpsTotal: 0,
          samples: 0,
        };
        const feeUnits = torBaseUnitsToBigInt(entry.feesTorBaseUnits);
        const volumeUnits = torBaseUnitsToBigInt(entry.volumeTorBaseUnits);
        if (feeUnits !== null) {
          row.feesTorBaseUnits += feeUnits;
          row.hasFees = true;
        }
        if (volumeUnits !== null) {
          row.volumeTorBaseUnits += volumeUnits;
          row.hasVolume = true;
        }
        row.bpsTotal += entry.bpsAtClose;
        row.samples += 1;
        byEpoch.set(entry.epoch, row);
      }
    }
  }

  return [...byEpoch.entries()]
    .map(([epoch, row]) => ({
      epoch,
      feesTorBaseUnits: row.hasFees ? row.feesTorBaseUnits : null,
      feesTor: row.hasFees ? torBaseUnitsToNumber(row.feesTorBaseUnits) : null,
      volumeTorBaseUnits: row.hasVolume ? row.volumeTorBaseUnits : null,
      volumeTor: row.hasVolume ? torBaseUnitsToNumber(row.volumeTorBaseUnits) : null,
      averageBps: row.samples > 0 ? row.bpsTotal / row.samples : null,
      samples: row.samples,
    }))
    .sort((left, right) => left.epoch - right.epoch);
}

// --- Bps helpers ---

export function bpsRange(records: DynamicL1FeeRecord[]) {
  if (records.length === 0) {
    return 'Unavailable';
  }
  const values = records.map((record) => record.dynamicBps);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? formatBps(min) : `${min}-${max} bps`;
}

export function whitelistBadge(state: DynamicL1FeeWhitelistState) {
  switch (state) {
    case 'active':
      return { label: 'Active', variant: 'success' as const };
    case 'monitor':
      return { label: 'Monitor', variant: 'info' as const };
    case 'inactive':
      return { label: 'Inactive', variant: 'default' as const };
    case 'unparseable':
      return { label: 'Unparseable', variant: 'danger' as const };
  }
}

// --- Filter types and helpers ---

export type DynamicFeeWhitelistFilter = 'all' | DynamicL1FeeWhitelistState;
export type DynamicFeeBpsFilter = 'all' | 'floor' | 'ceiling' | 'inside' | 'unknown';
export type DynamicFeeCurrentFilter = 'all' | 'with-current' | 'without-current';

export type DynamicFeeRecordFilterState = {
  query: string;
  whitelist: DynamicFeeWhitelistFilter;
  bps: DynamicFeeBpsFilter;
  current: DynamicFeeCurrentFilter;
};

export const defaultRecordFilters: DynamicFeeRecordFilterState = {
  query: '',
  whitelist: 'all',
  bps: 'all',
  current: 'all',
};

export type PairMovementRow = {
  thorname: string;
  pair: string;
  dynamicBps: number;
  samples: number;
  firstBps: number | null;
  latestBps: number | null;
  bpsDelta: number | null;
  latestEpoch: number | null;
  latestFeesTorBaseUnits: bigint | null;
  latestVolumeTorBaseUnits: bigint | null;
  current?: DynamicL1FeeCurrentAccumulator;
  boundsPosition: Exclude<DynamicFeeBpsFilter, 'all'>;
};

// --- Record filtering ---

export function currentByRecord(status: DynamicL1FeeStatus | undefined) {
  const entries = new Map<string, DynamicL1FeeCurrentAccumulator>();
  for (const entry of status?.currentEntries ?? []) {
    entries.set(recordKey(entry.thorname, entry.pair), entry);
  }
  return entries;
}

export function currentWithoutSealedRecords(status: DynamicL1FeeStatus | undefined) {
  const sealedKeys = new Set((status?.records ?? []).map((record) => recordKey(record.thorname, record.pair)));
  return (status?.currentEntries ?? []).filter((entry) => !sealedKeys.has(recordKey(entry.thorname, entry.pair)));
}

function bpsPositionForValue(
  dynamicBps: number,
  floorBps: number | null | undefined,
  ceilingBps: number | null | undefined
): Exclude<DynamicFeeBpsFilter, 'all'> {
  if (typeof floorBps !== 'number' || typeof ceilingBps !== 'number') {
    return 'unknown';
  }
  if (dynamicBps === floorBps) {
    return 'floor';
  }
  if (dynamicBps === ceilingBps) {
    return 'ceiling';
  }
  return 'inside';
}

function dynamicFeeBpsPosition(
  record: DynamicL1FeeRecord,
  floorBps: number | null | undefined,
  ceilingBps: number | null | undefined
): Exclude<DynamicFeeBpsFilter, 'all'> {
  return bpsPositionForValue(record.dynamicBps, floorBps, ceilingBps);
}

export function bpsPositionLabel(position: Exclude<DynamicFeeBpsFilter, 'all'>) {
  switch (position) {
    case 'floor':
      return 'At floor';
    case 'ceiling':
      return 'At ceiling';
    case 'inside':
      return 'Inside bounds';
    case 'unknown':
      return 'Bounds unknown';
  }
}

export function bpsMovementLabel(delta: number | null) {
  if (delta === null) {
    return 'One sealed sample';
  }
  if (delta === 0) {
    return 'No bps change';
  }
  return delta < 0 ? `Moved down ${Math.abs(delta)} bps` : `Moved up ${delta} bps`;
}

export function bpsMovementVariant(delta: number | null) {
  if (delta === null) {
    return 'info' as const;
  }
  return delta === 0 ? 'default' as const : 'success' as const;
}

function compareNullableBigIntDesc(left: bigint | null, right: bigint | null) {
  if (left === null && right === null) {
    return 0;
  }
  if (left === null) {
    return 1;
  }
  if (right === null) {
    return -1;
  }
  if (left === right) {
    return 0;
  }
  return left > right ? -1 : 1;
}

export function pairMovementRows(status: DynamicL1FeeStatus | undefined): PairMovementRow[] {
  const currentEntries = currentByRecord(status);
  const floorBps = status?.mimir.floorBps.effectiveValue ?? status?.mimir.floorBps.value;
  const ceilingBps = status?.mimir.ceilingBps.effectiveValue ?? status?.mimir.ceilingBps.value;

  return (status?.histories ?? []).flatMap((thornameHistory) => (
    thornameHistory.pairs.map((pair) => {
      const first = pair.history[0];
      const latest = pair.history.at(-1);
      const bpsDelta = first && latest && pair.history.length > 1
        ? latest.bpsAtClose - first.bpsAtClose
        : null;

      return {
        thorname: pair.thorname,
        pair: pair.pair,
        dynamicBps: pair.dynamicBps,
        samples: pair.history.length,
        firstBps: first?.bpsAtClose ?? null,
        latestBps: latest?.bpsAtClose ?? null,
        bpsDelta,
        latestEpoch: latest?.epoch ?? null,
        latestFeesTorBaseUnits: torBaseUnitsToBigInt(latest?.feesTorBaseUnits),
        latestVolumeTorBaseUnits: torBaseUnitsToBigInt(latest?.volumeTorBaseUnits),
        current: currentEntries.get(recordKey(pair.thorname, pair.pair)),
        boundsPosition: bpsPositionForValue(pair.dynamicBps, floorBps, ceilingBps),
      };
    })
  )).sort((left, right) => (
    Number(Boolean(right.current)) - Number(Boolean(left.current)) ||
    Math.abs(right.bpsDelta ?? 0) - Math.abs(left.bpsDelta ?? 0) ||
    compareNullableBigIntDesc(left.latestFeesTorBaseUnits, right.latestFeesTorBaseUnits) ||
    left.thorname.localeCompare(right.thorname) ||
    left.pair.localeCompare(right.pair)
  ));
}

function dynamicFeeRecordSearchText(record: DynamicL1FeeRecord, current?: DynamicL1FeeCurrentAccumulator) {
  return [
    record.thorname,
    record.pair,
    record.whitelistState,
    record.dynamicBps.toString(),
    record.lastActiveEpoch.toString(),
    current?.epoch.toString() ?? '',
  ].join(' ').toLowerCase();
}

export function filterDynamicFeeRecords(
  records: DynamicL1FeeRecord[],
  currentEntries: Map<string, DynamicL1FeeCurrentAccumulator>,
  filters: DynamicFeeRecordFilterState,
  floorBps: number | null | undefined,
  ceilingBps: number | null | undefined
) {
  const query = filters.query.trim().toLowerCase();

  return records.filter((record) => {
    const key = recordKey(record.thorname, record.pair);
    const current = currentEntries.get(key);
    if (query && !dynamicFeeRecordSearchText(record, current).includes(query)) {
      return false;
    }
    if (filters.whitelist !== 'all' && record.whitelistState !== filters.whitelist) {
      return false;
    }
    if (filters.bps !== 'all' && dynamicFeeBpsPosition(record, floorBps, ceilingBps) !== filters.bps) {
      return false;
    }
    if (filters.current === 'with-current' && !current) {
      return false;
    }
    if (filters.current === 'without-current' && current) {
      return false;
    }
    return true;
  });
}

export function activeRecordFilterLabels(filters: DynamicFeeRecordFilterState) {
  return [
    filters.query.trim() ? `Search: ${filters.query.trim()}` : null,
    filters.whitelist !== 'all' ? `Whitelist: ${whitelistBadge(filters.whitelist).label}` : null,
    filters.bps !== 'all' ? `Bps: ${bpsPositionLabel(filters.bps)}` : null,
    filters.current === 'with-current'
      ? 'Current epoch: yes'
      : filters.current === 'without-current'
        ? 'Current epoch: no'
        : null,
  ].filter((label): label is string => label !== null);
}

// --- Source warning helpers ---

export function sourceWarningBadgeVariant(detail: NetworkStatusSourceWarning) {
  if (detail.severity === 'critical') {
    return 'danger' as const;
  }
  if (detail.severity === 'review') {
    return 'info' as const;
  }
  return 'warning' as const;
}

// --- Live view state helpers ---

export type DynamicFeeLiveViewState = 'loading' | 'available' | 'unavailable';

export function dynamicFeeLiveViewState(status: DynamicL1FeeStatus | undefined, isLoading: boolean): DynamicFeeLiveViewState {
  if (status) {
    return 'available';
  }

  return isLoading ? 'loading' : 'unavailable';
}

export function missingLiveValue(state: DynamicFeeLiveViewState) {
  return state === 'loading' ? 'Loading' : 'Unavailable';
}

export function enabledState(status: DynamicL1FeeStatus | undefined, state: DynamicFeeLiveViewState) {
  if (!status) {
    return state === 'loading'
      ? { value: 'Loading', variant: 'default' as const }
      : { value: 'Unavailable', variant: 'danger' as const };
  }
  const enabled = status.mimir.enabled;
  if (enabled.state === 'active') {
    return { value: 'Enabled', variant: 'success' as const };
  }
  if (enabled.state === 'inactive') {
    return { value: 'Disabled', variant: 'warning' as const };
  }
  if (enabled.state === 'absent') {
    return { value: 'Disabled by default', variant: 'warning' as const };
  }
  return { value: 'Unknown', variant: 'danger' as const };
}

export function formatEnabledMimirValue(enabled: DynamicL1FeeStatus['mimir']['enabled'] | undefined) {
  if (!enabled) {
    return 'Unavailable';
  }
  if (enabled.state === 'absent') {
    return `absent (default ${enabled.defaultValue ?? enabled.effectiveValue ?? 'Unavailable'})`;
  }
  if (enabled.value === null) {
    return enabled.effectiveValue === undefined ? 'Unavailable' : `default ${enabled.effectiveValue}`;
  }
  return enabled.value;
}

// --- Utility helpers ---

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

// --- Coverage stats ---

export function coverageStats(status: DynamicL1FeeStatus | undefined) {
  if (!status) {
    return undefined;
  }

  const orphanCurrentEntries = currentWithoutSealedRecords(status);
  const sealedSamples = historySampleCount(status);
  const sealedEpochs = historyEpochRows(status).length;

  return {
    currentAccumulatorCount: status.currentEntries.length,
    matchedCurrentAccumulatorCount: Math.max(0, status.currentEntries.length - orphanCurrentEntries.length),
    orphanCurrentAccumulatorCount: orphanCurrentEntries.length,
    sealedRecordCount: status.records.length,
    activeRecordCount: status.records.filter((record) => record.whitelistState === 'active').length,
    monitorRecordCount: status.records.filter((record) => record.whitelistState === 'monitor').length,
    historyPairCount: historyPairCount(status),
    sealedSamples,
    sealedEpochs,
    sourceWarningCount: status.sourceWarnings.length,
  };
}
