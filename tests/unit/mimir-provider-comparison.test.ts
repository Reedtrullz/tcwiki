import { afterEach, describe, expect, it, vi } from 'vitest';
import ThornodeAPI, { resetThornodeEndpointForTests } from '@/lib/api/thornode';
import { collectMimirProviderComparison, compareMimirProviderSamples } from '@/lib/api/mimir-provider-comparison';

afterEach(() => { vi.unstubAllGlobals(); resetThornodeEndpointForTests(); });
function response(value: unknown, height?: string) {
  return new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json', ...(height ? { 'grpc-metadata-x-cosmos-block-height': height } : {}) } });
}
describe('explicit two-provider control observation', () => {
  it('makes exactly two fixed reads and normalizes zero without claiming pinned consensus', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(response({ HaltTrading: '0' })).mockResolvedValueOnce(response({ HALTTRADING: 0 }));
    vi.stubGlobal('fetch', fetcher);
    const samples = await collectMimirProviderComparison();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual(['https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir', 'https://thornode.thorchain.network/thorchain/mimir']);
    expect(compareMimirProviderSamples(samples, Date.now()).rows.find(row => row.key === 'HALTTRADING')?.relation).toBe('equal-observations');
    expect(samples.every(sample => sample.verification === 'unverified')).toBe(true);
    expect(samples[0].values.HALTTRADING.raw).toBe('0');
  });
  it('separates verified same-height conflict, time/height skew and unsupported pinning', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ HALTTRADING: 0 }, '100')).mockResolvedValueOnce(response({ HALTTRADING: 1 }, '100')));
    const samples = await collectMimirProviderComparison(100);
    expect(compareMimirProviderSamples(samples, Date.now()).rows[0].relation).toBe('conflict-at-verified-height');
    const unsupported = samples.map(sample => ({ ...sample, verification: 'unverified' as const, observedHeight: null }));
    expect(compareMimirProviderSamples(unsupported, Date.now()).rows[0].relation).toBe('different-samples');
    const skewed = samples.map((sample, index) => ({ ...sample, verification: 'unverified' as const, observedHeight: 100 + index }));
    expect(compareMimirProviderSamples(skewed, Date.now()).rows[0].relation).toBe('different-samples');
  });
  it('preserves unavailable, alias ambiguity, mismatch and stale samples as distinct limits', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response({ HaltTrading: 0, HALTTRADING: 0 }, '99')).mockResolvedValueOnce(new Response('Unavailable', { status: 503 })));
    const samples = await collectMimirProviderComparison(100);
    expect(samples[0].verification).toBe('mismatch');
    expect(samples[0].values.HALTTRADING.state).toBe('alias-conflict');
    expect(samples[1].status).toBe('unavailable');
    const later = Math.max(...samples.map(sample => Date.parse(sample.checkedAt))) + 30001;
    expect(compareMimirProviderSamples(samples, later).stale).toEqual([true, true]);
    expect(compareMimirProviderSamples(samples, later).rows[0].relation).toBe('unavailable');
  });
  it('rejects invalid height without requests and bounds unsupported values', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    await expect(collectMimirProviderComparison(-1)).rejects.toThrow('height');
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValue(response({ HALTTRADING: '9'.repeat(100) }));
    const samples = await collectMimirProviderComparison();
    expect(samples[0].status).toBe('unavailable');
  });
});

it('shares provider Retry-After cooldown with later routine diagnostics', async () => {
  resetThornodeEndpointForTests();
  const fetcher = vi.fn().mockImplementation((url: string) => url.includes('gateway.liquify.com')
    ? new Response('{}', { status: 429, headers: { 'Retry-After': '60' } })
    : response({ HALTTRADING: 0 }));
  vi.stubGlobal('fetch', fetcher);
  const compared = await collectMimirProviderComparison();
  expect(compared[0].status).toBe('unavailable');
  expect(compared[1].status).toBe('observed');
  expect(fetcher).toHaveBeenCalledTimes(2);
  const ordinary = await ThornodeAPI.getMimir();
  expect(fetcher).toHaveBeenCalledTimes(3);
  expect(fetcher.mock.calls[2][0]).toBe('https://thornode.thorchain.network/thorchain/mimir');
  expect(ordinary.source?.label).toBe('THORChain THORNode');
  // The subsequent routine read honors the sticky fallback selected by that read.
  await ThornodeAPI.getMimir();
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(fetcher.mock.calls[3][0]).toBe('https://thornode.thorchain.network/thorchain/mimir');
});
