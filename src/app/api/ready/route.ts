import { getReadinessUpstreamSnapshot } from '@/lib/readiness-snapshot';
import { getRuntimeMetadata } from '@/lib/runtime-metadata';
import { assertReadinessContract } from '../../../../scripts/lib/readiness-contract.mjs';
import { partitionReadinessWarnings } from '../../../../scripts/lib/readiness-warning-policy.mjs';
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

function wantsStrictContract(request: Request | undefined) {
  if (!request) {
    return false;
  }

  try {
    return new URL(request.url).searchParams.get('contract') === 'strict';
  } catch {
    return false;
  }
}

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

  if (
    message.includes('did not include') ||
    message.includes('do not include') ||
    message.includes('not requested') ||
    message.includes('history fetch capped') ||
    message.includes('omitted') ||
    message.includes('missing')
  ) {
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

  if (message.includes('Known operational-support Mimir key')) {
    return sourceWarningDetail({
      severity: 'review',
      category: 'mimir-support',
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

function sourceUrlMatches(
  sources: Array<{ url: string }>,
  predicate: (url: URL) => boolean
) {
  return sources.some((source) => {
    try {
      return predicate(new URL(source.url));
    } catch {
      return false;
    }
  });
}

function sourcePathEndsWith(pathname: string, suffix: string) {
  return pathname.toLowerCase().endsWith(suffix.toLowerCase());
}

function isHeightPinnedSource(url: URL, suffix: string) {
  const height = url.searchParams.get('height');
  return sourcePathEndsWith(url.pathname, suffix) && height !== null && /^\d+$/.test(height);
}

function hasExactThornodeNetworkSources(sources: Array<{ url: string }> | undefined) {
  if (!sources?.length) {
    return false;
  }

  return [
    (url: URL) => sourcePathEndsWith(url.pathname, '/base/tendermint/v1beta1/blocks/latest'),
    (url: URL) => isHeightPinnedSource(url, '/mimir'),
    (url: URL) => isHeightPinnedSource(url, '/inbound_addresses'),
    (url: URL) => isHeightPinnedSource(url, '/version'),
    (url: URL) => isHeightPinnedSource(url, '/lastblock'),
  ].every((predicate) => sourceUrlMatches(sources, predicate));
}

function hasExactDynamicFeeSources(sources: Array<{ url: string }> | undefined) {
  if (!sources?.length) {
    return false;
  }

  return [
    (url: URL) => sourcePathEndsWith(url.pathname, '/base/tendermint/v1beta1/blocks/latest'),
    (url: URL) => isHeightPinnedSource(url, '/mimir'),
    (url: URL) => isHeightPinnedSource(url, '/dynamic_l1_fees'),
    (url: URL) => isHeightPinnedSource(url, '/dynamic_l1_fees_current'),
  ].every((predicate) => sourceUrlMatches(sources, predicate));
}

function hasExactRunePoolPolSources(sources: Array<{ url: string }> | undefined) {
  if (!sources?.length) {
    return false;
  }

  return [
    (url: URL) => sourcePathEndsWith(url.pathname, '/base/tendermint/v1beta1/blocks/latest'),
    (url: URL) => isHeightPinnedSource(url, '/mimir'),
    (url: URL) => isHeightPinnedSource(url, '/runepool'),
  ].every((predicate) => sourceUrlMatches(sources, predicate));
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

function getRunePoolPolWarningDetails(warnings: string[]) {
  return uniqueSourceWarningDetails(warnings.map((warning) => classifyReadinessWarning(warning, {
    action: 'Treat RUNEPool/POL readiness as degraded until THORNode returns a complete, pinned, warning-free RUNEPool/POL snapshot.',
  })));
}

function dynamicFeeHistorySampleCount(status: DynamicL1FeeStatus | undefined) {
  return status?.histories.reduce((total, thorname) => (
    total + thorname.pairs.reduce((pairTotal, pair) => pairTotal + pair.history.length, 0)
  ), 0);
}

export async function GET(request?: Request) {
  const strictContract = wantsStrictContract(request);
  const {
    checkedAt,
    midgard,
    midgardNetwork,
    midgardPools,
    midgardEarnings,
    thornode,
    dynamicFees,
    runePoolPol,
  } = await getReadinessUpstreamSnapshot();
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
  if (
    thornode.status === 'ok' &&
    thornode.data !== undefined &&
    thornode.source &&
    runePoolPol.status === 'ok' &&
    runePoolPol.data !== undefined &&
    runePoolPol.source &&
    !sameSourceGroup(thornode.source.url, runePoolPol.source.url)
  ) {
    computedThornodeWarnings.push(`THORNode network status source ${thornode.source.label} differs from RUNEPool/POL source ${runePoolPol.source.label}.`);
  }
  if (thornode.status === 'ok' && thornode.data !== undefined && !hasExactThornodeNetworkSources(thornode.sources)) {
    computedThornodeWarnings.push('THORNode network status sources do not include exact pinned endpoint evidence.');
  }
  const dynamicFeeExactSourceWarnings = dynamicFees.status === 'ok' &&
    dynamicFees.data !== undefined &&
    !hasExactDynamicFeeSources(dynamicFees.sources)
    ? ['THORNode dynamic fee sources do not include exact pinned endpoint evidence.']
    : [];
  const runePoolPolExactSourceWarnings = runePoolPol.status === 'ok' &&
    runePoolPol.data !== undefined &&
    !hasExactRunePoolPolSources(runePoolPol.sources)
    ? ['THORNode RUNEPool/POL sources do not include exact pinned endpoint evidence.']
    : [];
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
  const thornodeWarningDisposition = partitionReadinessWarnings(
    thornodeSourceWarnings,
    thornodeSourceWarningDetails
  );
  const dynamicFeeClientWarningDetails = dynamicFees.data?.sourceWarningDetails?.length
    ? dynamicFees.data.sourceWarningDetails
    : getDynamicFeeWarningDetails(dynamicFees.data?.sourceWarnings ?? []);
  const dynamicFeeSourceWarningDetails = uniqueSourceWarningDetails([
    ...dynamicFeeClientWarningDetails,
    ...getDynamicFeeWarningDetails(dynamicFeeExactSourceWarnings),
  ]);
  const dynamicFeeSourceWarnings = uniqueStrings([
    ...(dynamicFees.data?.sourceWarnings ?? []),
    ...dynamicFeeSourceWarningDetails.map((detail) => detail.message),
    ...dynamicFeeExactSourceWarnings,
  ]);
  const runePoolPolClientWarningDetails = runePoolPol.data?.sourceWarningDetails?.length
    ? runePoolPol.data.sourceWarningDetails
    : getRunePoolPolWarningDetails(runePoolPol.data?.sourceWarnings ?? []);
  const runePoolPolSourceWarningDetails = uniqueSourceWarningDetails([
    ...runePoolPolClientWarningDetails,
    ...getRunePoolPolWarningDetails(runePoolPolExactSourceWarnings),
  ]);
  const runePoolPolSourceWarnings = uniqueStrings([
    ...(runePoolPol.data?.sourceWarnings ?? []),
    ...runePoolPolSourceWarningDetails.map((detail) => detail.message),
    ...runePoolPolExactSourceWarnings,
  ]);
  const midgardSourceWarningDetails = getMidgardSourceWarningDetails(midgardSourceWarnings);
  const midgardHealthWarnings = getMidgardHealthWarnings(midgard);
  const midgardHealthReady = midgard.status === 'ok' &&
    midgard.data !== undefined &&
    midgard.data.severity !== 'degraded' &&
    midgard.data.severity !== 'unknown';
  const midgardReady = midgardHealthReady && midgardSourceWarnings.length === 0;
  const visibleMidgardReady = dataReady(midgardNetwork) && nonEmptyDataReady(midgardPools) && nonEmptyDataReady(midgardEarnings);
  const thornodeHasUsableState = thornodeStateReady(thornode.data?.state) || (
    thornode.data?.state === 'degraded' &&
    thornodeWarningDisposition.nonBlocking.length > 0 &&
    thornodeWarningDisposition.blocking.length === 0
  );
  const thornodeReady = thornode.status === 'ok' &&
    thornode.data !== undefined &&
    thornodeHasUsableState &&
    thornodeWarningDisposition.blocking.length === 0;
  const dynamicFeesReady = dynamicFees.status === 'ok' &&
    dynamicFees.data !== undefined &&
    dynamicFeeSourceWarnings.length === 0;
  const runePoolPolReady = runePoolPol.status === 'ok' &&
    runePoolPol.data !== undefined &&
    runePoolPolSourceWarnings.length === 0;

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
  if (thornodeWarningDisposition.blocking.length) {
    reasons.push(...thornodeWarningDisposition.blocking);
  }
  if (dynamicFees.status !== 'ok' || dynamicFees.data === undefined) {
    reasons.push(degradedReason('THORNode dynamic fee status', dynamicFees));
  }
  if (dynamicFeeSourceWarnings.length) {
    reasons.push(...dynamicFeeSourceWarnings);
  }
  if (runePoolPol.status !== 'ok' || runePoolPol.data === undefined) {
    reasons.push(degradedReason('THORNode RUNEPool/POL status', runePoolPol));
  }
  if (runePoolPolSourceWarnings.length) {
    reasons.push(...runePoolPolSourceWarnings);
  }

  const metadata = runtimeMetadata();
  if (metadata.runtime.strict && !metadata.runtime.verified) {
    reasons.push(...metadata.runtime.warnings);
  }
  const runtimeReady = !metadata.runtime.strict || metadata.runtime.verified;
  const ready = midgardReady && visibleMidgardReady && thornodeReady && dynamicFeesReady && runePoolPolReady && runtimeReady;
  const body: ReadinessResponse = {
    status: ready ? 'ready' : 'degraded',
    ready,
    checkedAt,
    ...metadata,
    warnings: uniqueStrings([
      ...midgardHealthWarnings,
      ...thornodeWarningDisposition.nonBlocking,
    ]),
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
        runePoolPol: {
          status: runePoolPol.status,
          checkedAt: runePoolPol.checkedAt,
          source: runePoolPol.source,
          sources: runePoolPol.sources,
          error: runePoolPol.error,
          activePolPoolCount: runePoolPol.data?.activePolPoolCount,
          depositMaturityBlocksState: runePoolPol.data?.depositMaturityBlocks.state,
          depositMaturityBlocksValue: runePoolPol.data?.depositMaturityBlocks.value,
          maxReserveBackstopState: runePoolPol.data?.maxReserveBackstop.state,
          maxReserveBackstopValue: runePoolPol.data?.maxReserveBackstop.value,
          minRunePoolDepthState: runePoolPol.data?.minRunePoolDepth?.state,
          minRunePoolDepthValue: runePoolPol.data?.minRunePoolDepth?.value,
          thorchainHeight: runePoolPol.data?.sourceFreshness.thorchainHeight,
          snapshotPinned: runePoolPol.data?.sourceFreshness.snapshotPinned,
          thorchainBlockTime: runePoolPol.data?.sourceFreshness.thorchainBlockTime,
          thorchainBlockAgeSeconds: runePoolPol.data?.sourceFreshness.thorchainBlockAgeSeconds,
          sourceWarnings: runePoolPolSourceWarnings,
          sourceWarningDetails: runePoolPolSourceWarningDetails,
        },
        error: thornode.error,
      },
    },
    reasons,
  };

  if (strictContract) {
    try {
      assertReadinessContract(body);
    } catch (error) {
      return Response.json(
        {
          status: 'contract-failed',
          ready: false,
          checkedAt,
          ...metadata,
          error: error instanceof Error ? error.message : 'Readiness contract validation failed.',
        },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  }

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
