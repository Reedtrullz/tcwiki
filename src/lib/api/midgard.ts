import axios from 'axios';
import { Pool, NetworkStats, Node, HistoryItem, Swap, ChainData } from '@/lib/types';

const MIDGARD_API_BASE = 'https://midgard.ninerealms.com/v2';

export class MidgardAPI {
  private static instance = axios.create({
    baseURL: MIDGARD_API_BASE,
    timeout: 30000,
  });

  static async getPools(): Promise<Pool[]> {
    try {
      const response = await this.instance.get('/pools?stakeable=true');
      return response.data;
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  static async getPoolDetails(pool: string): Promise<Pool> {
    try {
      const response = await this.instance.get(`/pool/${pool}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pool details:', error);
      throw error;
    }
  }

  static async getNetworkData(): Promise<NetworkStats> {
    try {
      const response = await this.instance.get('/network');
      return response.data;
    } catch (error) {
      console.error('Error fetching network data:', error);
      throw error;
    }
  }

  static async getNodes(): Promise<Node[]> {
    try {
      const response = await this.instance.get('/nodes');
      return response.data;
    } catch (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }
  }

  static async getHistory(bucket: string = 'day', count: number = 30): Promise<HistoryItem[]> {
    try {
      const response = await this.instance.get(`/history?bucket=${bucket}&count=${count}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  static async getSwaps(params: {
    limit?: number;
    offset?: number;
    pool?: string;
    from?: string;
    to?: string;
  } = {}): Promise<Swap[]> {
    try {
      const response = await this.instance.get('/swaps', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching swaps:', error);
      return [];
    }
  }

  static async getChains(): Promise<ChainData[]> {
    try {
      const response = await this.instance.get('/chains');
      return response.data;
    } catch (error) {
      console.error('Error fetching chains:', error);
      return [];
    }
  }

  static async getActions(params: {
    limit?: number;
    offset?: number;
    type?: string;
    address?: string;
    pool?: string;
  } = {}): Promise<any[]> {
    try {
      const response = await this.instance.get('/actions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching actions:', error);
      return [];
    }
  }

  static async getPoolStats(pool: string, from?: string, to?: string): Promise<any> {
    try {
      const response = await this.instance.get(`/pool/${pool}/stats`, {
        params: { from, to }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return null;
    }
  }

  static async getMemberDetails(address: string): Promise<any> {
    try {
      const response = await this.instance.get(`/member/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member details:', error);
      return null;
    }
  }

  static async getAssetPrice(asset: string): Promise<{ runePrice: string; assetPrice: string }> {
    try {
      const response = await this.instance.get(`/price/${asset}`);
      return {
        runePrice: response.data.runePrice,
        assetPrice: response.data.assetPrice,
      };
    } catch (error) {
      console.error('Error fetching asset price:', error);
      return { runePrice: '0', assetPrice: '0' };
    }
  }

  static async getRunePriceHistory(bucket: string = 'day', count: number = 365): Promise<any[]> {
    try {
      const response = await this.instance.get(`/history/rune?bucket=${bucket}&count=${count}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching rune price history:', error);
      return [];
    }
  }
}

export default MidgardAPI;