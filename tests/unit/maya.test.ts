import { afterEach, describe, expect, it, vi } from 'vitest';
import MayaAPI from '@/lib/api/maya';

const makeResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: vi.fn().mockResolvedValue(data),
});

describe('MayaAPI validation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves valid zero values in network and node data', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse({
        totalPooledRune: '0',
        totalReserve: '0',
        activeNodeCount: '0',
        standbyNodeCount: '0',
        bondingAPY: '0',
        liquidityAPY: '0',
        nextChurnHeight: '0',
      }))
      .mockResolvedValueOnce(makeResponse([{ node_address: 'maya1node', bond: '0', slash_points: '0' }]));
    vi.stubGlobal('fetch', fetchMock);

    const network = await MayaAPI.getNetwork();
    const nodes = await MayaAPI.getNodes();

    expect(network.status).toBe('ok');
    expect(network.data).toEqual(expect.objectContaining({
      totalPooledRune: '0',
      totalReserve: '0',
      activeNodeCount: 0,
      standbyNodeCount: 0,
      bondingAPY: '0',
      liquidityAPY: '0',
      nextChurnHeight: 0,
    }));
    expect(nodes.status).toBe('ok');
    expect(nodes.data?.[0]).toEqual(expect.objectContaining({ bond: '0', slashPoints: 0 }));
    expect(fetchMock.mock.calls[1][0]).toBe('https://midgard.mayachain.info/v2/mayachain/nodes');
  });

  it('degrades a successful response with invalid decimal APY without retrying an alias', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse({
      totalPooledRune: '1',
      totalReserve: '1',
      activeNodeCount: '1',
      standbyNodeCount: '0',
      bondingAPY: 'not-a-rate',
      liquidityAPY: '0.1',
      nextChurnHeight: '1',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await MayaAPI.getNetwork();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('degrades malformed bond fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse([
      { node_address: 'maya1node', bond: '-1', slash_points: 1 },
    ]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await MayaAPI.getNodes();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('degrades malformed slash points independently of valid bond data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse([
      { node_address: 'maya1node', bond: '100000000', slash_points: '-1' },
    ])));

    const result = await MayaAPI.getNodes();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
  });

  it('preserves absent optional bond and slash-point values as unknown', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse([
      { node_address: 'maya1node' },
    ])));

    const result = await MayaAPI.getNodes();

    expect(result.status).toBe('ok');
    expect(result.data?.[0]).toEqual(expect.objectContaining({ bond: undefined, slashPoints: undefined }));
  });

  it('degrades malformed top-level node response shapes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse({ nodes: [] })));

    const result = await MayaAPI.getNodes();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
  });

  it('rejects numeric and blank node addresses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse([{ node_address: 123, bond: '0', slash_points: '0' }]))
      .mockResolvedValueOnce(makeResponse([{ node_address: '', bond: '0', slash_points: '0' }]));
    vi.stubGlobal('fetch', fetchMock);

    expect((await MayaAPI.getNodes()).status).toBe('degraded');
    expect((await MayaAPI.getNodes()).status).toBe('degraded');
  });
});
