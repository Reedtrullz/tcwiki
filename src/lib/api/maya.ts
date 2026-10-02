import type {
  LiveDataResult,
  MayaNetworkStats,
  MayaNode,
  SourceMeta,
} from '@/lib/types';
import { liveDegraded, liveOk, normalizeApyToPercent } from '@/lib/trust';

const MAYA_MIDGARD_ENDPOINT: SourceMeta = {
  label: 'Maya Midgard',
  url: 'https://midgard.mayachain.info/v2',
};

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

async function request<T>(path: string, normalize: (raw: unknown) => T): Promise<LiveDataResult<T>> {
  const checkedAt = new Date().toISOString();
  const source = sourceForPath(MAYA_MIDGARD_ENDPOINT, path);

  try {
    const raw = await requestFromEndpoint<unknown>(MAYA_MIDGARD_ENDPOINT, path);
    const data = normalize(raw);
    return liveOk(data, source, checkedAt);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Maya Midgard error';
    return liveDegraded<T>(`Maya Midgard source did not provide usable data (${message})`, source, checkedAt);
  }
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

function asRequiredNodeAddress(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Maya Midgard invalid node.nodeAddress');
  }
  return value;
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Maya Midgard response was not an object (${field})`);
  }
  return value as Record<string, unknown>;
}

function asRequiredBaseUnitString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new Error(`Maya Midgard invalid ${field}`);
  }
  return value;
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

function asApy(value: unknown, field: string): string {
  const apy = asRequiredString(value, field);
  const percent = normalizeApyToPercent(apy, 'decimal');
  if (percent === null || percent < 0) throw new Error(`Maya Midgard invalid ${field}`);
  return apy;
}

function normalizeMayaNode(raw: Record<string, unknown>): MayaNode {
  const nodeAddress = asRequiredNodeAddress(raw.nodeAddress ?? raw.node_address ?? raw.address);
  const status = asString(raw.status);
  const rawSlashPoints = raw.slashPoints ?? raw.slash_points;

  return {
    nodeAddress,
    address: nodeAddress,
    bond: raw.bond === undefined || raw.bond === null
      ? undefined
      : asRequiredBaseUnitString(raw.bond, 'node.bond'),
    status,
    version: asString(raw.version),
    slashPoints: rawSlashPoints === undefined || rawSlashPoints === null
      ? undefined
      : asNonNegativeInteger(rawSlashPoints, 'node.slashPoints'),
    isActive: status ? status.toLowerCase() === 'active' : undefined,
    ipaddress: asString(raw.ipAddress ?? raw.ip_address),
  };
}

function normalizeMayaNodes(raw: unknown): MayaNode[] {
  if (!Array.isArray(raw)) throw new Error('Maya nodes response was not an array');
  return raw.map((node) => normalizeMayaNode(asRecord(node, 'node')));
}

function normalizeMayaNetwork(raw: unknown): MayaNetworkStats {
  const data = asRecord(raw, 'network');
  return {
    totalPooledRune: asRequiredBaseUnitString(data.totalPooledRune ?? data.total_pooled_rune, 'network.totalPooledRune'),
    totalReserve: asRequiredBaseUnitString(data.totalReserve ?? data.total_reserve, 'network.totalReserve'),
    activeNodeCount: asNonNegativeInteger(data.activeNodeCount ?? data.active_node_count, 'network.activeNodeCount'),
    standbyNodeCount: asNonNegativeInteger(data.standbyNodeCount ?? data.standby_node_count, 'network.standbyNodeCount'),
    bondingAPY: asApy(data.bondingAPY ?? data.bonding_apy, 'network.bondingAPY'),
    liquidityAPY: asApy(data.liquidityAPY ?? data.liquidity_apy, 'network.liquidityAPY'),
    nextChurnHeight: asNonNegativeInteger(data.nextChurnHeight ?? data.next_churn_height, 'network.nextChurnHeight'),
    bondMetrics: typeof data.bondMetrics === 'object' && data.bondMetrics !== null && !Array.isArray(data.bondMetrics)
      ? data.bondMetrics as Record<string, unknown>
      : {},
  };
}

export class MayaAPI {
  static async getNetwork(): Promise<LiveDataResult<MayaNetworkStats>> {
    return request('/network', normalizeMayaNetwork);
  }

  static async getNodes(): Promise<LiveDataResult<MayaNode[]>> {
    return request('/mayachain/nodes', normalizeMayaNodes);
  }
}

export default MayaAPI;
