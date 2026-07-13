import type { NetworkStatus } from '@/lib/types';

interface NetworkCurrentOnlyStateOptions {
  paused: boolean | null | undefined;
  statusLoading: boolean;
  sourceUnavailable: boolean;
  networkStatus?: NetworkStatus;
  controlKeys?: string[];
  invalidKeyPatterns?: RegExp[];
  clearLabel?: string;
}

function hasUnparseableControl(networkStatus: NetworkStatus | undefined, controlKeys: string[]) {
  if (!networkStatus || controlKeys.length === 0) {
    return false;
  }

  return networkStatus.monitoredControls.some((control) => (
    control.state === 'unparseable' && controlKeys.includes(control.key)
  ));
}

function hasMatchingInvalidKey(networkStatus: NetworkStatus | undefined, patterns: RegExp[]) {
  if (!networkStatus || patterns.length === 0) {
    return false;
  }

  return networkStatus.invalidMimirKeys.some((key) => {
    const upperKey = key.toUpperCase();
    return patterns.some((pattern) => pattern.test(upperKey));
  });
}

export function getNetworkCurrentOnlyStateLabel({
  paused,
  statusLoading,
  sourceUnavailable,
  networkStatus,
  controlKeys = [],
  invalidKeyPatterns = [],
  clearLabel = 'No active halt',
}: NetworkCurrentOnlyStateOptions) {
  if (statusLoading) {
    return 'Checking';
  }
  if (sourceUnavailable) {
    return 'Unavailable';
  }
  if (
    hasUnparseableControl(networkStatus, controlKeys) ||
    hasMatchingInvalidKey(networkStatus, invalidKeyPatterns)
  ) {
    return 'Mimir warning';
  }
  if (paused === null) {
    return 'Not monitored';
  }
  if (paused === undefined) {
    return 'Unknown';
  }
  if (paused) {
    return 'Paused';
  }
  if (networkStatus?.state === 'unknown') {
    return 'Unknown';
  }
  if (networkStatus?.state === 'degraded' || (networkStatus?.sourceWarnings.length ?? 0) > 0) {
    return 'Source warning';
  }
  return clearLabel;
}

export function getSecuredAssetsSummaryPaused(networkStatus: NetworkStatus | undefined) {
  if (!networkStatus) {
    return undefined;
  }

  if (
    (networkStatus.securedAssetDepositPauseKeys?.length ?? 0) > 0 ||
    (networkStatus.securedAssetWithdrawPauseKeys?.length ?? 0) > 0
  ) {
    return true;
  }

  return networkStatus.securedAssetsPaused;
}
