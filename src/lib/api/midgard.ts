import axios from 'axios';
import { Pool, NetworkStats, Node, HistoryItem, Swap, ChainData } from '@/lib/types';

const MIDGARD_ENDPOINTS = [
  'https://gateway.liquify.com/chain/thorchain_midgard/v2',
  'https://midgard.thorchain.network/v2',
];

let activeEndpoint = 0;

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
    try {
      return await request<Pool[]>('/pools');
    } catch {
      return [];
    }
  }

  static async getPoolDetails(pool: string): Promise<Pool> {
    return request<Pool>(`/pool/${pool}`);
  }

  static async getNetworkData(): Promise<NetworkStats> {
    return request<NetworkStats>('/network');
  }

  static async getNodes(): Promise<Node[]> {
    try {
      return await request<Node[]>('/nodes');
    } catch {
      return [];
    }
  }

  static async getHistory(interval = 'day', count = 30): Promise<HistoryItem[]> {
    try {
      const data = await request<{ intervals: HistoryItem[] }>(
        `/history/earnings?interval=${interval}&count=${count}`
      );
      return data.intervals || [];
    } catch {
      return [];
    }
  }

  static async getSwaps(): Promise<Swap[]> {
    try {
      return await request<Swap[]>('/swaps');
    } catch {
      return [];
    }
  }

  static async getChains(): Promise<ChainData[]> {
    try {
      return await request<ChainData[]>('/chains');
    } catch {
      return [];
    }
  }

  static async getActions(): Promise<Record<string, unknown>[]> {
    try {
      return await request<Record<string, unknown>[]>('/actions');
    } catch {
      return [];
    }
  }

  static async getPoolStats(pool: string): Promise<Record<string, unknown> | null> {
    try {
      return await request<Record<string, unknown>>(`/pool/${pool}/stats`);
    } catch {
      return null;
    }
  }

  static async getMemberDetails(address: string): Promise<Record<string, unknown> | null> {
    try {
      return await request<Record<string, unknown>>(`/member/${address}`);
    } catch {
      return null;
    }
  }

  static async getAssetPrice(asset: string): Promise<{ runePrice: string; assetPrice: string }> {
    try {
      const data = await request<{ runePrice: string; assetPrice: string }>(`/price/${asset}`);
      return { runePrice: data.runePrice, assetPrice: data.assetPrice };
    } catch {
      return { runePrice: '0', assetPrice: '0' };
    }
  }

  static async getRunePriceHistory(interval = 'day', count = 365): Promise<Record<string, unknown>[]> {
    try {
      const data = await request<{ intervals: Record<string, unknown>[] }>(
        `/history/rune?interval=${interval}&count=${count}`
      );
      return data.intervals || [];
    } catch {
      return [];
    }
  }
}

export default MidgardAPI;
