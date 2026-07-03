import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import type { LiveDataResult, MidgardHealth, ReadinessResponse, ReadinessSourceCheck } from '@/lib/types';

export const dynamic = 'force-dynamic';

function runtimeMetadata() {
  return {
    version: process.env.APP_VERSION ?? process.env.VERSION ?? 'development',
    commit: process.env.COMMIT_SHA ?? 'unknown',
    image: process.env.IMAGE_REF ?? 'unknown',
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

export async function GET() {
  const checkedAt = new Date().toISOString();
  const [midgard, midgardNetwork, midgardPools, midgardEarnings, thornode] = await Promise.all([
    safeLiveCheck('Midgard health', checkedAt, () => MidgardAPI.getHealth()),
    safeLiveCheck('Midgard network data', checkedAt, () => MidgardAPI.getNetworkData()),
    safeLiveCheck('Midgard pools data', checkedAt, () => MidgardAPI.getPools('available')),
    safeLiveCheck('Midgard earnings history', checkedAt, () => MidgardAPI.getHistory('day', 1)),
    safeLiveCheck('THORNode network status', checkedAt, () => ThornodeAPI.getNetworkStatus()),
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
  const thornodeSourceWarnings = [...(thornode.data?.sourceWarnings ?? []), ...computedThornodeWarnings];
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

  const ready = midgardReady && visibleMidgardReady && thornodeReady;
  const metadata = runtimeMetadata();
  const body: ReadinessResponse = {
    status: ready ? 'ready' : 'degraded',
    ready,
    checkedAt,
    ...metadata,
    sources: {
      midgard: {
        status: midgard.status,
        source: midgard.source,
        health: midgard.data,
        heightLagBlocks: midgardHeightLagBlocks,
        visibleData: {
          network: sourceCheck(midgardNetwork),
          pools: sourceCheckWithError(midgardPools, poolsError),
          earnings: sourceCheckWithError(midgardEarnings, earningsError),
        },
        sourceWarnings: midgardSourceWarnings,
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
