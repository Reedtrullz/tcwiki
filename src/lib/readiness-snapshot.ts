import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI, { THORNODE_BLOCK_STALE_WARNING_SECONDS } from '@/lib/api/thornode';
import type {
  DynamicL1FeeStatus,
  HistoryItem,
  LiveDataResult,
  MidgardHealth,
  NetworkStats,
  NetworkStatus,
  Pool,
  RunePoolPolStatus,
} from '@/lib/types';

export const READINESS_SNAPSHOT_TTL_MS = 10_000;

export interface ReadinessUpstreamSnapshot {
  checkedAt: string;
  midgard: LiveDataResult<MidgardHealth>;
  midgardNetwork: LiveDataResult<NetworkStats>;
  midgardPools: LiveDataResult<Pool[]>;
  midgardEarnings: LiveDataResult<HistoryItem[]>;
  thornode: LiveDataResult<NetworkStatus>;
  dynamicFees: LiveDataResult<DynamicL1FeeStatus>;
  runePoolPol: LiveDataResult<RunePoolPolStatus>;
}

interface CachedReadinessSnapshot {
  expiresAt: number;
  snapshot: ReadinessUpstreamSnapshot;
}

let cachedSnapshot: CachedReadinessSnapshot | undefined;
let inFlightSnapshot: Promise<ReadinessUpstreamSnapshot> | undefined;

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

async function computeReadinessUpstreamSnapshot(): Promise<ReadinessUpstreamSnapshot> {
  const checkedAt = new Date().toISOString();
  const [midgard, midgardNetwork, midgardPools, midgardEarnings, thornode, dynamicFees, runePoolPol] = await Promise.all([
    safeLiveCheck('Midgard health', checkedAt, () => MidgardAPI.getHealth()),
    safeLiveCheck('Midgard network data', checkedAt, () => MidgardAPI.getNetworkData()),
    safeLiveCheck('Midgard pools data', checkedAt, () => MidgardAPI.getPools('available')),
    safeLiveCheck('Midgard earnings history', checkedAt, () => MidgardAPI.getHistory('day', 1)),
    safeLiveCheck('THORNode network status', checkedAt, () => ThornodeAPI.getNetworkStatus()),
    safeLiveCheck('THORNode dynamic fee status', checkedAt, () => ThornodeAPI.getDynamicL1FeeStatus()),
    safeLiveCheck('THORNode RUNEPool/POL status', checkedAt, () => ThornodeAPI.getRunePoolPolStatus()),
  ]);

  return {
    checkedAt,
    midgard,
    midgardNetwork,
    midgardPools,
    midgardEarnings,
    thornode,
    dynamicFees,
    runePoolPol,
  };
}

export function getReadinessUpstreamSnapshot(): Promise<ReadinessUpstreamSnapshot> {
  const now = Date.now();
  if (cachedSnapshot && now < cachedSnapshot.expiresAt) {
    return Promise.resolve(cachedSnapshot.snapshot);
  }
  if (inFlightSnapshot) {
    return inFlightSnapshot;
  }

  const snapshotPromise = computeReadinessUpstreamSnapshot()
    .then((snapshot) => {
      cachedSnapshot = {
        snapshot,
        expiresAt: Math.min(
          Date.parse(snapshot.checkedAt) + READINESS_SNAPSHOT_TTL_MS,
          ...[
            snapshot.thornode.data?.thorchainBlockTime,
            snapshot.dynamicFees.data?.sourceFreshness.thorchainBlockTime,
            snapshot.runePoolPol.data?.sourceFreshness.thorchainBlockTime,
          ].flatMap((time) => {
            const freshUntil = Date.parse(time ?? '') + THORNODE_BLOCK_STALE_WARNING_SECONDS * 1000;
            // Already-degraded evidence keeps the bounded failure cache; fresh evidence expires before it ages out.
            return freshUntil > Date.now() ? [freshUntil] : [];
          })
        ),
      };
      return snapshot;
    })
    .finally(() => {
      if (inFlightSnapshot === snapshotPromise) {
        inFlightSnapshot = undefined;
      }
    });
  inFlightSnapshot = snapshotPromise;
  return snapshotPromise;
}

export function resetReadinessSnapshotCacheForTests() {
  cachedSnapshot = undefined;
  inFlightSnapshot = undefined;
}
