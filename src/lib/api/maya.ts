import type {
  LiveDataResult,
  MayaNetworkStats,
  MayaNode,
  SourceMeta,
} from '@/lib/types';
import { liveDegraded, liveOk } from '@/lib/trust';

const MAYA_MIDGARD_ENDPOINTS: SourceMeta[] = [
  {
    label: 'Maya Midgard',
    url: 'https://midgard.mayachain.info/v2',
  },
  {
    label: 'Maya Midgard (direct)',
    url: 'https://midgard.mayachain.info/v2',
  },
];

let activeEndpoint = 0;

function sourceForPath(endpoint: SourceMeta, path: string): SourceMeta {
  return {
    ...endpoint,
    url: joinEndpointPath(endpoint.url, path),
  };
}

function joinEndpointPath(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
}

async function requestFromEndpoint<T>(endpoint: SourceMeta, path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(joinEndpointPath(endpoint.url, path), {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json() as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function request<T>(path: string): Promise<LiveDataResult<T>> {
  const errors: string[] = [];

  for (let i = 0; i < MAYA_MIDGARD_ENDPOINTS.length; i += 1) {
    const endpointIndex = (activeEndpoint + i) % MAYA_MIDGARD_ENDPOINTS.length;
    const endpoint = MAYA_MIDGARD_ENDPOINTS[endpointIndex];
    const checkedAt = new Date().toISOString();

    try {
      const data = await requestFromEndpoint<T>(endpoint, path);
      activeEndpoint = endpointIndex;
      return liveOk(data, sourceForPath(endpoint, path), checkedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Maya Midgard error';
      errors.push(`${endpoint.label}: ${message}`);
    }
  }

  return liveDegraded<T>(`Maya Midgard source did not respond (${errors.join('; ')})`);
}

function asString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asRequiredString(value: unknown, field: string): string {
  const s = asString(value);
  if (s === undefined || s === '') throw new Error(`Maya Midgard missing ${field}`);
  return s;
}

function asNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Maya Midgard invalid ${field}`);
    return value;
  }
  if (typeof value !== 'string' || !value) throw new Error(`Maya Midgard missing ${field}`);
  if (!/^\d+$/.test(value)) throw new Error(`Maya Midgard invalid ${field}`);
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error(`Maya Midgard invalid ${field}`);
  return n;
}

function normalizeMayaNode(raw: Record<string, unknown>): MayaNode {
  const nodeAddress = asRequiredString(raw.nodeAddress ?? raw.node_address ?? raw.address, 'node.nodeAddress');
  const status = asString(raw.status);

  return {
    nodeAddress,
    address: nodeAddress,
    bond: asString(raw.bond),
    status,
    version: asString(raw.version),
    slashPoints: typeof raw.slashPoints === 'number' ? raw.slashPoints
      : typeof raw.slash_points === 'number' ? raw.slash_points
      : undefined,
    isActive: status ? status.toLowerCase() === 'active' : undefined,
    ipaddress: asString(raw.ipAddress ?? raw.ip_address),
  };
}

function normalizeMayaNodes(result: LiveDataResult<Record<string, unknown>[]>): LiveDataResult<MayaNode[]> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<MayaNode[]>(result.error ?? 'Maya nodes did not load', result.sources ?? result.source, result.checkedAt);
  }
  if (!Array.isArray(result.data)) {
    return liveDegraded<MayaNode[]>('Maya nodes response was not an array', result.sources ?? result.source, result.checkedAt);
  }
  try {
    return { ...result, data: result.data.map(normalizeMayaNode) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Maya nodes could not be normalized';
    return liveDegraded<MayaNode[]>(message, result.sources ?? result.source, result.checkedAt);
  }
}

function normalizeMayaNetwork(result: LiveDataResult<Record<string, unknown>>): LiveDataResult<MayaNetworkStats> {
  if (result.status !== 'ok' || !result.data) {
    return liveDegraded<MayaNetworkStats>(result.error ?? 'Maya network did not load', result.sources ?? result.source, result.checkedAt);
  }
  try {
    return {
      ...result,
      data: {
        totalPooledRune: asRequiredString(result.data.totalPooledRune ?? result.data.total_pooled_rune, 'network.totalPooledRune'),
        totalReserve: asRequiredString(result.data.totalReserve ?? result.data.total_reserve, 'network.totalReserve'),
        activeNodeCount: asNonNegativeInteger(result.data.activeNodeCount ?? result.data.active_node_count, 'network.activeNodeCount'),
        standbyNodeCount: asNonNegativeInteger(result.data.standbyNodeCount ?? result.data.standby_node_count, 'network.standbyNodeCount'),
        bondingAPY: asRequiredString(result.data.bondingAPY ?? result.data.bonding_apy, 'network.bondingAPY'),
        liquidityAPY: asRequiredString(result.data.liquidityAPY ?? result.data.liquidity_apy, 'network.liquidityAPY'),
        nextChurnHeight: asNonNegativeInteger(result.data.nextChurnHeight ?? result.data.next_churn_height, 'network.nextChurnHeight'),
        bondMetrics: typeof result.data.bondMetrics === 'object' && result.data.bondMetrics !== null
          ? result.data.bondMetrics as Record<string, unknown>
          : {},
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Maya network could not be normalized';
    return liveDegraded<MayaNetworkStats>(message, result.sources ?? result.source, result.checkedAt);
  }
}

export class MayaAPI {
  static async getNetwork(): Promise<LiveDataResult<MayaNetworkStats>> {
    const raw = await request<Record<string, unknown>>('/network');
    return normalizeMayaNetwork(raw);
  }

  static async getNodes(): Promise<LiveDataResult<MayaNode[]>> {
    const raw = await request<Record<string, unknown>[]>('/nodes');
    return normalizeMayaNodes(raw);
  }
}

export default MayaAPI;
