import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import { getRuntimeMetadata } from '@/lib/runtime-metadata';
import type {
  DynamicL1FeeStatus,
  LiveDataResult,
  MidgardHealth,
  NetworkStatusSourceWarning,
  NetworkStatusWarningCategory,
  NetworkStatusWarningSeverity,
  ReadinessResponse,
  ReadinessSourceCheck,
} from '@/lib/types';

export const dynamic = 'force-dynamic';

function runtimeMetadata() {
  const runtime = getRuntimeMetadata();

  return {
    version: runtime.version,
    commit: runtime.commit,
    image: runtime.image,
    runtime,
  };
}

function sourceCheck<T>(result: LiveDataResult<T>): ReadinessSourceCheck {
  return {
    status: result.status,
    checkedAt: result.checkedAt,
    source: result.source,
    sources: result.sources,
    error: result.error,
  };
}

function dataReady<T>(result: LiveDataResult<T>) {
  return result.status === 'ok' && result.data !== undefined;
}

function nonEmptyDataReady<T>(result: LiveDataResult<T[]>) {
  return dataReady(result) && Array.isArray(result.data) && result.data.length > 0;
}

function sourceCheckWithError<T>(result: LiveDataResult<T>, error?: string): ReadinessSourceCheck {
  return {
    ...sourceCheck(result),
    error: error ?? result.error,
  };
}

async function safeLiveCheck<T>(
  label: string,
  checkedAt: string,
  operation: () => Promise<LiveDataResult<T>>
): Promise<LiveDataResult<T>> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown readiness check failure';
    return {
      status: 'degraded',
      checkedAt,
      error: `${label} readiness check failed: ${message}`,
    };
  }
}

function degradedReason(label: string, result: LiveDataResult<unknown>) {
  return result.error ?? `${label} did not provide usable data.`;
}

function sourceWarningDetail({
  severity,
  category,
  message,
  action,
  keys,
  scopes,
}: NetworkStatusSourceWarning): NetworkStatusSourceWarning {
  return {
    severity,
    category,
    message,
    action,
    ...(keys?.length ? { keys } : {}),
    ...(scopes?.length ? { scopes } : {}),
  };
}

function uniqueSourceWarningDetails(details: NetworkStatusSourceWarning[]) {
  const seen = new Set<string>();
  return details.filter((detail) => {
    const signature = [
      detail.severity,
      detail.category,
      detail.message,
      detail.action,
      detail.keys?.join(',') ?? '',
      detail.scopes?.join(',') ?? '',
    ].join('|');
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function classifyReadinessWarning(
  message: string,
  fallback: {
    action: string;
    category?: NetworkStatusWarningCategory;
    severity?: NetworkStatusWarningSeverity;
  }
): NetworkStatusSourceWarning {
  if (message.includes('latest block timestamp')) {
    return sourceWarningDetail({
      severity: message.includes(' is stale.') ? 'critical' : 'warning',
      category: 'freshness',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('snapshot was not pinned')) {
    return sourceWarningDetail({
      severity: 'warning',
      category: 'pinning',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('height') || message.includes('blocks behind') || message.includes('lastblock')) {
    return sourceWarningDetail({
      severity: 'warning',
      category: 'height-divergence',
      message,
      action: fallback.action,
    });
  }

  if (message.includes(' source ') && message.includes(' differs from ')) {
    return sourceWarningDetail({
      severity: 'warning',
      category: 'source-shape',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('did not include') || message.includes('omitted') || message.includes('missing')) {
    return sourceWarningDetail({
      severity: 'warning',
      category: 'source-shape',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('could not be parsed')) {
    return sourceWarningDetail({
      severity: 'warning',
      category: 'mimir-parse',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('Unknown chain-scoped Mimir key')) {
    return sourceWarningDetail({
      severity: 'review',
      category: 'unknown-chain',
      message,
      action: fallback.action,
    });
  }

  if (message.includes('Unknown operation-like Mimir key')) {
    return sourceWarningDetail({
      severity: 'review',
      category: 'unknown-operation',
      message,
      action: fallback.action,
    });
  }

  return sourceWarningDetail({
    severity: fallback.severity ?? 'warning',
    category: fallback.category ?? 'other',
    message,
    action: fallback.action,
  });
}

function thornodeStateReady(state: string | undefined) {
  return state === 'operational' || state === 'paused';
}

function sameSourceGroup(leftUrl: string, rightUrl: string) {
  try {
    return new URL(leftUrl).origin === new URL(rightUrl).origin;
  } catch {
    return leftUrl === rightUrl;
  }
}

function getMidgardSourceWarnings(
  health: LiveDataResult<MidgardHealth>,
  visibleSources: Array<[string, LiveDataResult<unknown>]>
) {
  if (!health.source || health.status !== 'ok' || health.data === undefined) {
    return [];
  }

  return [
    ...(health.data.database === undefined ? ['Midgard health did not include database status.'] : []),
    ...(health.data.inSync === undefined ? ['Midgard health did not include sync status.'] : []),
    ...visibleSources
    .filter(([, result]) => result.status === 'ok' && result.data !== undefined && result.source)
    .filter(([, result]) => result.source && !sameSourceGroup(health.source!.url, result.source.url))
    .map(([label, result]) => (
      `Midgard health source ${health.source!.label} differs from ${label} source ${result.source!.label}.`
    )),
  ];
}

function getMidgardSourceWarningDetails(warnings: string[]) {
  return uniqueSourceWarningDetails(warnings.map((warning) => classifyReadinessWarning(warning, {
    action: 'Treat Midgard readiness as degraded until the health and visible data sources are complete and consistent.',
  })));
}

function getMidgardHealthWarnings(health: LiveDataResult<MidgardHealth>) {
  return health.status === 'ok' && health.data?.severity === 'warning'
    ? uniqueStrings(health.data.reasons)
    : [];
}

function getComputedThornodeWarningDetails(warnings: string[]) {
  return uniqueSourceWarningDetails(warnings.map((warning) => classifyReadinessWarning(warning, {
    action: 'Treat THORNode readiness as degraded until the live operation snapshot is complete and height-consistent.',
  })));
}

function getDynamicFeeWarningDetails(warnings: string[]) {
  return uniqueSourceWarningDetails(warnings.map((warning) => classifyReadinessWarning(warning, {
    action: 'Treat dynamic-fee readiness as degraded until THORNode returns a complete, pinned, warning-free dynamic-fee snapshot.',
  })));
}

function dynamicFeeHistorySampleCount(status: DynamicL1FeeStatus | undefined) {
  return status?.histories.reduce((total, thorname) => (
    total + thorname.pairs.reduce((pairTotal, pair) => pairTotal + pair.history.length, 0)
  ), 0);
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [midgard, midgardNetwork, midgardPools, midgardEarnings, thornode, dynamicFees] = await Promise.all([
    safeLiveCheck('Midgard health', checkedAt, () => MidgardAPI.getHealth()),
    safeLiveCheck('Midgard network data', checkedAt, () => MidgardAPI.getNetworkData()),
    safeLiveCheck('Midgard pools data', checkedAt, () => MidgardAPI.getPools('available')),
    safeLiveCheck('Midgard earnings history', checkedAt, () => MidgardAPI.getHistory('day', 1)),
    safeLiveCheck('THORNode network status', checkedAt, () => ThornodeAPI.getNetworkStatus()),
    safeLiveCheck('THORNode dynamic fee status', checkedAt, () => ThornodeAPI.getDynamicL1FeeStatus()),
  ]);
  const reasons: string[] = [];
  const computedThornodeWarnings: string[] = [];
  const poolsError = dataReady(midgardPools) && !nonEmptyDataReady(midgardPools)
    ? 'Midgard pools data did not include any available pools.'
    : undefined;
  const earningsError = dataReady(midgardEarnings) && !nonEmptyDataReady(midgardEarnings)
    ? 'Midgard earnings history did not include any intervals.'
    : undefined;
  const thornodeHeightLagBlocks = midgard.data?.latestHeight !== undefined && thornode.data?.thorchainHeight !== undefined
    ? Math.max(0, midgard.data.latestHeight - thornode.data.thorchainHeight)
    : undefined;
  const midgardHeightLagBlocks = midgard.data?.latestHeight !== undefined && thornode.data?.thorchainHeight !== undefined
    ? Math.max(0, thornode.data.thorchainHeight - midgard.data.latestHeight)
    : undefined;
  if (thornodeHeightLagBlocks !== undefined && thornodeHeightLagBlocks > 20) {
    computedThornodeWarnings.push(`THORNode lastblock is ${thornodeHeightLagBlocks} blocks behind Midgard latest height.`);
  }
  if (thornode.status === 'ok' && thornode.data !== undefined && thornode.data.chainStatuses.length === 0) {
    computedThornodeWarnings.push('THORNode inbound_addresses did not include any chain operation evidence.');
  }
  if (
    thornode.status === 'ok' &&
    thornode.data !== undefined &&
    thornode.source &&
    dynamicFees.status === 'ok' &&
    dynamicFees.data !== undefined &&
    dynamicFees.source &&
    !sameSourceGroup(thornode.source.url, dynamicFees.source.url)
  ) {
    computedThornodeWarnings.push(`THORNode network status source ${thornode.source.label} differs from dynamic fee source ${dynamicFees.source.label}.`);
  }
  const midgardSourceWarnings = [
    ...(midgardHeightLagBlocks !== undefined && midgardHeightLagBlocks > 20
      ? [`Midgard latest height is ${midgardHeightLagBlocks} blocks behind THORNode lastblock.`]
      : []),
    ...getMidgardSourceWarnings(midgard, [
      ['network data', midgardNetwork],
      ['pools data', midgardPools],
      ['earnings history', midgardEarnings],
    ]),
  ];
  const computedThornodeWarningDetails = getComputedThornodeWarningDetails(computedThornodeWarnings);
  const thornodeClientWarningDetails = thornode.data?.sourceWarningDetails?.length
    ? thornode.data.sourceWarningDetails
    : (thornode.data?.sourceWarnings ?? []).map((warning) => classifyReadinessWarning(warning, {
        action: 'Review this THORNode source warning before treating the live status as clean.',
      }));
  const thornodeSourceWarningDetails = uniqueSourceWarningDetails([
    ...thornodeClientWarningDetails,
    ...computedThornodeWarningDetails,
  ]);
  const thornodeSourceWarnings = uniqueStrings([
    ...(thornode.data?.sourceWarnings ?? []),
    ...thornodeSourceWarningDetails.map((detail) => detail.message),
  ]);
  const dynamicFeeClientWarningDetails = dynamicFees.data?.sourceWarningDetails?.length
    ? dynamicFees.data.sourceWarningDetails
    : getDynamicFeeWarningDetails(dynamicFees.data?.sourceWarnings ?? []);
  const dynamicFeeSourceWarningDetails = uniqueSourceWarningDetails(dynamicFeeClientWarningDetails);
  const dynamicFeeSourceWarnings = uniqueStrings([
    ...(dynamicFees.data?.sourceWarnings ?? []),
    ...dynamicFeeSourceWarningDetails.map((detail) => detail.message),
  ]);
  const midgardSourceWarningDetails = getMidgardSourceWarningDetails(midgardSourceWarnings);
  const midgardHealthWarnings = getMidgardHealthWarnings(midgard);
  const midgardHealthReady = midgard.status === 'ok' &&
    midgard.data !== undefined &&
    midgard.data.severity !== 'degraded' &&
    midgard.data.severity !== 'unknown';
  const midgardReady = midgardHealthReady && midgardSourceWarnings.length === 0;
  const visibleMidgardReady = dataReady(midgardNetwork) && nonEmptyDataReady(midgardPools) && nonEmptyDataReady(midgardEarnings);
  const thornodeHasUsableState = thornodeStateReady(thornode.data?.state);
  const thornodeReady = thornode.status === 'ok' &&
    thornode.data !== undefined &&
    thornodeHasUsableState &&
    thornodeSourceWarnings.length === 0;
  const dynamicFeesReady = dynamicFees.status === 'ok' &&
    dynamicFees.data !== undefined &&
    dynamicFeeSourceWarnings.length === 0;

  if (!midgardHealthReady) {
    reasons.push(midgard.error ?? midgard.data?.reasons.join(' ') ?? 'Midgard readiness degraded.');
  }
  if (!dataReady(midgardNetwork)) {
    reasons.push(degradedReason('Midgard network data', midgardNetwork));
  }
  if (!nonEmptyDataReady(midgardPools)) {
    reasons.push(poolsError ?? degradedReason('Midgard pools data', midgardPools));
  }
  if (!nonEmptyDataReady(midgardEarnings)) {
    reasons.push(earningsError ?? degradedReason('Midgard earnings history', midgardEarnings));
  }
  if (midgardSourceWarnings.length) {
    reasons.push(...midgardSourceWarnings);
  }
  if (thornode.status !== 'ok' || thornode.data === undefined) {
    reasons.push(thornode.error ?? 'THORNode readiness degraded.');
  }
  if (thornode.status === 'ok' && thornode.data !== undefined && !thornodeHasUsableState) {
    reasons.push(`THORNode network status is ${thornode.data.state}.`);
  }
  if (thornodeSourceWarnings.length) {
    reasons.push(...thornodeSourceWarnings);
  }
  if (dynamicFees.status !== 'ok' || dynamicFees.data === undefined) {
    reasons.push(degradedReason('THORNode dynamic fee status', dynamicFees));
  }
  if (dynamicFeeSourceWarnings.length) {
    reasons.push(...dynamicFeeSourceWarnings);
  }

  const metadata = runtimeMetadata();
  if (metadata.runtime.strict && !metadata.runtime.verified) {
    reasons.push(...metadata.runtime.warnings);
  }
  const runtimeReady = !metadata.runtime.strict || metadata.runtime.verified;
  const ready = midgardReady && visibleMidgardReady && thornodeReady && dynamicFeesReady && runtimeReady;
  const body: ReadinessResponse = {
    status: ready ? 'ready' : 'degraded',
    ready,
    checkedAt,
    ...metadata,
    warnings: midgardHealthWarnings,
    sources: {
      midgard: {
        status: midgard.status,
        source: midgard.source,
        health: midgard.data,
        heightLagBlocks: midgardHeightLagBlocks,
        healthWarnings: midgardHealthWarnings,
        visibleData: {
          network: sourceCheck(midgardNetwork),
          pools: sourceCheckWithError(midgardPools, poolsError),
          earnings: sourceCheckWithError(midgardEarnings, earningsError),
        },
        sourceWarnings: midgardSourceWarnings,
        sourceWarningDetails: midgardSourceWarningDetails,
        error: midgard.error,
      },
      thornode: {
        status: thornode.status,
        checkedAt: thornode.checkedAt,
        source: thornode.source,
        sources: thornode.sources,
        sourceCount: thornode.sources?.length ?? (thornode.source ? 1 : 0),
        state: thornode.data?.state,
        summary: thornode.data?.summary,
        version: thornode.data?.thorNodeVersion,
        thorchainHeight: thornode.data?.thorchainHeight,
        thorchainSnapshotPinned: thornode.data?.thorchainSnapshotPinned,
        thorchainLastblockMinHeight: thornode.data?.thorchainLastblockMinHeight,
        thorchainLastblockMaxHeight: thornode.data?.thorchainLastblockMaxHeight,
        thorchainLastblockSpread: thornode.data?.thorchainLastblockSpread,
        thorchainBlockTime: thornode.data?.thorchainBlockTime,
        thorchainBlockAgeSeconds: thornode.data?.thorchainBlockAgeSeconds,
        heightLagBlocks: thornodeHeightLagBlocks,
        activeControlKeys: thornode.data?.activeControlKeys ?? [],
        activeChainKeys: thornode.data?.activeChainKeys ?? [],
        activeEvidenceKeys: thornode.data?.activeEvidenceKeys ?? [],
        scheduledMimirKeys: thornode.data?.scheduledMimirKeys ?? [],
        chainStatuses: thornode.data?.chainStatuses ?? [],
        monitoredControls: thornode.data?.monitoredControls ?? [],
        invalidMimirKeys: thornode.data?.invalidMimirKeys ?? [],
        sourceWarnings: thornodeSourceWarnings,
        sourceWarningDetails: thornodeSourceWarningDetails,
        dynamicFees: {
          status: dynamicFees.status,
          checkedAt: dynamicFees.checkedAt,
          source: dynamicFees.source,
          sources: dynamicFees.sources,
          error: dynamicFees.error,
          enabledState: dynamicFees.data?.mimir.enabled.state,
          enabledValue: dynamicFees.data?.mimir.enabled.effectiveValue,
          currentEpoch: dynamicFees.data?.currentEpoch,
          trackedRecordCount: dynamicFees.data?.records.length,
          currentEntryCount: dynamicFees.data?.currentEntries.length,
          whitelistedThornameCount: dynamicFees.data?.mimir.whitelistedPartners.filter((partner) => partner.whitelisted === true).length,
          historyThornameCount: dynamicFees.data?.histories.length,
          historySampleCount: dynamicFeeHistorySampleCount(dynamicFees.data),
          thorchainHeight: dynamicFees.data?.sourceFreshness.thorchainHeight,
          snapshotPinned: dynamicFees.data?.sourceFreshness.snapshotPinned,
          thorchainBlockTime: dynamicFees.data?.sourceFreshness.thorchainBlockTime,
          thorchainBlockAgeSeconds: dynamicFees.data?.sourceFreshness.thorchainBlockAgeSeconds,
          sourceWarnings: dynamicFeeSourceWarnings,
          sourceWarningDetails: dynamicFeeSourceWarningDetails,
        },
        error: thornode.error,
      },
    },
    reasons,
  };

  return Response.json(
    body,
    {
      status: ready ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
