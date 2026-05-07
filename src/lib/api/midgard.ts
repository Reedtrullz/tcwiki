import axios from 'axios';
import { Pool, NetworkStats, Node, HistoryItem, Swap, ChainData } from '@/lib/types';

const MIDGARD_ENDPOINTS = [
  'https://gateway.liquify.com/chain/thorchain_midgard',
  'https://midgard.thorchain.network',
  'https://midgard.ninerealms.com/v2',
];

let activeEndpoint = 0;

function getClient() {
  return axios.create({
    baseURL: MIDGARD_ENDPOINTS[activeEndpoint],
    timeout: 5000,
  });
}

async function request<T>(path: string): Promise<T> {
  for (let i = 0; i < MIDGARD_ENDPOINTS.length; i++) {
    const endpoint = (activeEndpoint + i) % MIDGARD_ENDPOINTS.length;
    try {
      const client = axios.create({
        baseURL: MIDGARD_ENDPOINTS[endpoint],
        timeout: 5000,
      });
      const response = await client.get(path);
      activeEndpoint = endpoint;
      return response.data;
    } catch {
      continue;
    }
  }
  throw new Error('All Midgard endpoints unreachable');
}

export class MidgardAPI {
  static async getPools(): Promise<Pool[]> {
    try { return await request<Pool[]>('/pools?stakeable=true'); } catch { return []; }
  }

  static async getPoolDetails(pool: string): Promise<Pool> {
    return request<Pool>(`/pool/${pool}`);
  }

  static async getNetworkData(): Promise<NetworkStats> {
    return request<NetworkStats>('/network');
  }

  static async getNodes(): Promise<Node[]> {
    try { return await request<Node[]>('/nodes'); } catch { return []; }
  }

  static async getHistory(bucket = 'day', count = 30): Promise<HistoryItem[]> {
    try { return await request<HistoryItem[]>(`/history?bucket=${bucket}&count=${count}`); } catch { return []; }
  }

  static async getSwaps(params: Record<string, unknown> = {}): Promise<Swap[]> {
    try { return await request<Swap[]>('/swaps'); } catch { return []; }
  }

  static async getChains(): Promise<ChainData[]> {
    try { return await request<ChainData[]>('/chains'); } catch { return []; }
  }

  static async getActions(params: Record<string, unknown> = {}): Promise<Record<string, unknown>[]> {
    try { return await request<Record<string, unknown>[]>('/actions'); } catch { return []; }
  }

  static async getPoolStats(pool: string, from?: string, to?: string): Promise<Record<string, unknown> | null> {
    try { return await request<Record<string, unknown>>(`/pool/${pool}/stats`); } catch { return null; }
  }

  static async getMemberDetails(address: string): Promise<Record<string, unknown> | null> {
    try { return await request<Record<string, unknown>>(`/member/${address}`); } catch { return null; }
  }

  static async getAssetPrice(asset: string): Promise<{ runePrice: string; assetPrice: string }> {
    try {
      const data = await request<{ runePrice: string; assetPrice: string }>(`/price/${asset}`);
      return { runePrice: data.runePrice, assetPrice: data.assetPrice };
    } catch {
      return { runePrice: '0', assetPrice: '0' };
    }
  }

  static async getRunePriceHistory(bucket = 'day', count = 365): Promise<Record<string, unknown>[]> {
    try { return await request<Record<string, unknown>[]>(`/history/rune?bucket=${bucket}&count=${count}`); } catch { return []; }
  }
}

export default MidgardAPI;
