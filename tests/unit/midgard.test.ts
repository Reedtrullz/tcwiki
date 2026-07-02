import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MidgardAPI, { resetMidgardEndpointForTests } from '@/lib/api/midgard';

const makeResponse = (ok: boolean, data: unknown, status = 200, statusText = 'OK') => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(data),
});

describe('MidgardAPI', () => {
  beforeEach(() => {
    resetMidgardEndpointForTests();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back from Liquify to public Midgard and normalizes pool APY', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(false, {}, 500, 'Server Error'))
      .mockResolvedValueOnce(makeResponse(true, [{ asset: 'BTC.BTC', poolAPY: '0.12', synthUnits: '0', synthSupply: '0', units: '1', assetDepth: '1', runeDepth: '1', price: '1', status: 'available', assetPriceUSD: '1', runePriceUSD: '1', liquidityUSD: '1', volume24h: '1', volume24hUSD: '1', pool: 'BTC.BTC', earnings: '0', rewards: '0' }]));

    vi.stubGlobal('fetch', fetchMock);
    const result = await MidgardAPI.getPools();

    expect(result.status).toBe('ok');
    expect(fetchMock.mock.calls[0][0]).toContain('gateway.liquify.com');
    expect(fetchMock.mock.calls[0][0]).toContain('/pools?status=available');
    expect(fetchMock.mock.calls[1][0]).toContain('midgard.thorchain.network');
    expect(result.data?.[0].apyPercent).toBe(12);
  });

  it('returns degraded when all endpoints fail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const result = await MidgardAPI.getNetworkData();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('Midgard source did not respond');
    expect(result.data).toBeUndefined();
  });

  it('unwraps history intervals without fake zero fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, { intervals: [{ startTime: '1', earnings: '100000000' }] }))
    );

    const result = await MidgardAPI.getHistory();

    expect(result.status).toBe('ok');
    expect(result.data).toEqual([{ startTime: '1', earnings: '100000000' }]);
  });

  it('normalizes Midgard health with explicit lag severity', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, {
        database: true,
        inSync: true,
        lastAggregated: { height: 10, timestamp: 1000 },
        lastCommitted: { height: 15, timestamp: 1360 },
        lastFetched: { height: 15, timestamp: 1360 },
        lastThorNode: { height: 15, timestamp: 1360 },
        scannerHeight: '16',
      }))
    );

    const result = await MidgardAPI.getHealth();

    expect(result.status).toBe('ok');
    expect(result.data?.severity).toBe('warning');
    expect(result.data?.latestHeight).toBe(16);
    expect(result.data?.aggregatedHeight).toBe(10);
    expect(result.data?.lagBlocks).toBe(6);
    expect(result.data?.lagSeconds).toBe(360);
    expect(result.data?.reasons).toContain('Midgard lag is 6 blocks.');
    expect(result.data?.reasons).toContain('Midgard lag is 6 minutes.');
  });

  it('normalizes Midgard nodes without requiring absent legacy fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, [{
        nodeAddress: 'thor1node',
        ed25519: 'thorpub1ed',
        secp256k1: 'thorpub1sec',
      }]))
    );

    const result = await MidgardAPI.getNodes();

    expect(result.status).toBe('ok');
    expect(result.data?.[0]).toEqual({
      nodeAddress: 'thor1node',
      address: 'thor1node',
      bond: undefined,
      status: undefined,
      version: undefined,
      slashPoints: undefined,
      isActive: undefined,
      bondUSD: undefined,
      pubkeys: {
        ed25519: 'thorpub1ed',
        secp256k1: 'thorpub1sec',
      },
    });
  });

  it('normalizes chain and asset price responses when endpoints provide the expected shape', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeResponse(true, [{
        chain: 'BTC',
        height: '123',
        thorchain_height: '456',
        inbound_paused: false,
        outbound_paused: 'true',
        halted: false,
        gas_rate: '10',
      }]))
      .mockResolvedValueOnce(makeResponse(true, {
        runePrice: '1.2',
        assetPrice: '100000',
      }));
    vi.stubGlobal('fetch', fetchMock);

    const chains = await MidgardAPI.getChains();
    const price = await MidgardAPI.getAssetPrice('BTC.BTC');

    expect(chains.status).toBe('ok');
    expect(chains.data?.[0]).toEqual({
      chain: 'BTC',
      height: '123',
      thorchainHeight: 456,
      inboundPaused: false,
      outboundPaused: true,
      halted: false,
      gasRate: '10',
    });
    expect(price.status).toBe('ok');
    expect(price.data).toEqual({
      runePrice: '1.2',
      assetPrice: '100000',
    });
  });

  it('returns degraded when history intervals are missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, { total: 'bad-shape' })));

    const result = await MidgardAPI.getHistory();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('intervals');
    expect(result.data).toBeUndefined();
  });

  it('returns degraded when RUNE price history intervals are missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, { total: 'bad-shape' })));

    const result = await MidgardAPI.getRunePriceHistory();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('RUNE price history');
    expect(result.data).toBeUndefined();
  });

  it('normalizes string-shaped network numbers from Midgard', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, {
        totalPooledRune: '100000000',
        totalReserve: '200000000',
        activeNodeCount: '101',
        standbyNodeCount: '23',
        bondingAPY: '0.12',
        liquidityAPY: '4.5',
        nextChurnHeight: '123456',
        poolActivationCountdown: '9',
        poolShareFactor: '1',
        blockRewards: { blockReward: '100' },
        bondMetrics: { average: '1' },
      }))
    );

    const result = await MidgardAPI.getNetworkData();

    expect(result.status).toBe('ok');
    expect(result.data?.activeNodeCount).toBe(101);
    expect(result.data?.standbyNodeCount).toBe(23);
    expect(result.data?.nextChurnHeight).toBe(123456);
    expect(result.data?.poolActivationCountdown).toBe(9);
    expect(result.data?.blockRewards).toEqual({ blockReward: '100' });
  });

  it('treats valid numeric zero as data, not degradation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, {
        totalPooledRune: '0',
        totalReserve: '0',
        activeNodeCount: 0,
        standbyNodeCount: '0',
        bondingAPY: '0',
        liquidityAPY: '0',
        nextChurnHeight: '0',
        poolActivationCountdown: '0',
        bondMetrics: {},
      }))
    );

    const result = await MidgardAPI.getNetworkData();

    expect(result.status).toBe('ok');
    expect(result.data?.activeNodeCount).toBe(0);
    expect(result.data?.standbyNodeCount).toBe(0);
    expect(result.data?.nextChurnHeight).toBe(0);
    expect(result.data?.poolActivationCountdown).toBe(0);
  });

  it('returns degraded instead of coercing missing numeric fields to zero', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, {
        totalPooledRune: '100000000',
        totalReserve: '200000000',
        activeNodeCount: null,
        standbyNodeCount: '',
        bondingAPY: '0.12',
        liquidityAPY: '4.5',
        nextChurnHeight: '123456',
        bondMetrics: {},
      }))
    );

    const result = await MidgardAPI.getNetworkData();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('network.activeNodeCount');
    expect(result.data).toBeUndefined();
  });

  it.each([
    ['alpha suffix', '123abc'],
    ['hex-shaped string', '0x10'],
    ['blank string', '   '],
    ['trimmed-looking string', ' 23'],
    ['exponent string', '1e2'],
    ['decimal count', '23.5'],
    ['negative count', '-1'],
  ])('returns degraded instead of accepting malformed numeric field: %s', async (_label, activeNodeCount) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeResponse(true, {
        totalPooledRune: '100000000',
        totalReserve: '200000000',
        activeNodeCount,
        standbyNodeCount: '23',
        bondingAPY: '0.12',
        liquidityAPY: '4.5',
        nextChurnHeight: '123456',
        bondMetrics: {},
      }))
    );

    const result = await MidgardAPI.getNetworkData();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('network.activeNodeCount');
    expect(result.data).toBeUndefined();
  });
});
