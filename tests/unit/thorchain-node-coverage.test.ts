import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThornodeAPI, { resetThornodeEndpointForTests } from '@/lib/api/thornode';
import { assessLivePresentation } from '@/lib/live-presentation';
import { liveOk } from '@/lib/trust';

const makeResponse = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json' },
});

const validNode = (nodeAddress: string, overrides: Record<string, unknown> = {}) => ({
  node_address: nodeAddress,
  status: 'Active',
  version: '3.20.3',
  total_bond: '9007199254740993123456789',
  slash_points: '9007199254740993123456789',
  ip_address: '198.51.100.7',
  operator_contact: 'operator@example.invalid',
  ...overrides,
});

describe('THORNode node-set coverage', () => {
  beforeEach(() => resetThornodeEndpointForTests());
  afterEach(() => {
    vi.unstubAllGlobals();
    resetThornodeEndpointForTests();
  });

  it('uses one bounded /nodes request and retains only the public coverage fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse([validNode('thor1alpha')]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getNodeCoverage();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://gateway.liquify.com/chain/thorchain_api/thorchain/nodes');
    expect(result.status).toBe('ok');
    expect(result.data).toEqual([{ nodeAddress: 'thor1alpha', status: 'Active', version: '3.20.3' }]);
    expect(result.source).toMatchObject({
      label: 'Liquify THORNode node set',
      url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/nodes',
      retrievedAt: result.checkedAt,
    });
  });

  it('keeps missing and unfamiliar status and version values visible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse([
      validNode('thor1missing', { status: null, version: '' }),
      validNode('thor1unknown', { status: 'Observer', version: 'release-candidate-x' }),
    ])));

    const result = await ThornodeAPI.getNodeCoverage();

    expect(result.status).toBe('ok');
    expect(result.data).toEqual([
      { nodeAddress: 'thor1missing', status: undefined, version: undefined },
      { nodeAddress: 'thor1unknown', status: 'Observer', version: 'release-candidate-x' },
    ]);
  });

  it('retains THORNode source rows that intentionally omit a leaving node address', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse([
      validNode('thor1omitted', { node_address: undefined, status: 'Unknown', version: '0.0.0' }),
    ])));

    const result = await ThornodeAPI.getNodeCoverage();

    expect(result.status).toBe('ok');
    expect(result.data).toEqual([{ status: 'Unknown', version: '0.0.0' }]);
  });

  it.each([
    ['numeric node address', [validNode('thor1good'), validNode('thor1bad', { node_address: 42 })]],
    ['numeric status', [validNode('thor1good'), validNode('thor1bad', { status: 3 })]],
    ['duplicate address', [validNode('thor1same'), validNode('thor1same', { version: '3.21.0' })]],
    ['empty node set', []],
    ['too many rows', Array.from({ length: 301 }, (_, index) => validNode(`thor1${index}`))],
  ])('rejects an eligible provider with %s before accepting it', async (_case, invalidRows) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse(invalidRows))
      .mockResolvedValueOnce(makeResponse([validNode('thor1fallback', { status: 'Standby' })]));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getNodeCoverage();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://thornode.thorchain.network/thorchain/nodes');
    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode node set');
    expect(result.data).toEqual([{ nodeAddress: 'thor1fallback', status: 'Standby', version: '3.20.3' }]);
  });

  it('accepts the documented row bound and degrades when every source fails validation', async () => {
    const maximum = Array.from({ length: 300 }, (_, index) => validNode(`thor1${index}`));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(makeResponse(maximum))
      .mockResolvedValueOnce(makeResponse({ nodes: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const bounded = await ThornodeAPI.getNodeCoverage();
    expect(bounded.status).toBe('ok');
    expect(bounded.data).toHaveLength(300);

    resetThornodeEndpointForTests();
    const failureMock = vi.fn().mockResolvedValue(makeResponse({ nodes: [] }));
    vi.stubGlobal('fetch', failureMock);
    const failed = await ThornodeAPI.getNodeCoverage();
    expect(failureMock).toHaveBeenCalledTimes(2);
    expect(failed.status).toBe('degraded');
    expect(failed.data).toBeUndefined();
    expect(failed.error).toMatch(/did not provide a usable node-set response/i);
  });

  it('keeps the node sample visible as stale last-good data after a failed refresh', () => {
    const checkedAt = '2026-10-03T00:00:00.000Z';
    const rows = [{ nodeAddress: 'thor1lastgood', status: 'Standby', version: '3.20.3' }];
    const result = liveOk(rows, {
      label: 'THORChain THORNode node set',
      url: 'https://thornode.thorchain.network/thorchain/nodes',
    }, checkedAt);

    const assessed = assessLivePresentation(result, 'provider refresh failed', false, { kind: 'aggregate' }, Date.parse(checkedAt) + 121_000);

    expect(assessed).toMatchObject({
      status: 'degraded',
      data: rows,
      source: result.source,
      checkedAt,
      presentation: { state: 'stale' },
    });
  });
});
