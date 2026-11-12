import { afterEach, describe, expect, it, vi } from 'vitest';
import MidgardAPI, { resetMidgardEndpointForTests } from '@/lib/api/midgard';
const hash = 'A'.repeat(64);
afterEach(() => { vi.unstubAllGlobals(); resetMidgardEndpointForTests(); });
describe('manual transaction lookup transport', () => {
  it('rejects URLs and malformed hashes before contacting a provider', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect((await MidgardAPI.getTransactionEvidence('https://example.com')).status).toBe('degraded');
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses a fixed bounded query and preserves the exact returned source', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ actions: [], count: '0' })));
    vi.stubGlobal('fetch', fetcher);
    const result = await MidgardAPI.getTransactionEvidence(hash);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=' + hash + '&limit=5');
    expect(result.status).toBe('ok'); expect(result.data?.actions).toEqual([]);
    expect(result.source?.url).toBe('https://gateway.liquify.com/chain/thorchain_midgard/v2/actions?txid=' + hash + '&limit=5');
  });
  it('reports unknown when the live provider fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    const result = await MidgardAPI.getTransactionEvidence(hash);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
  });
  it('keeps failure unknown and stops a cancelled lookup from contacting a provider', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockImplementation((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')))));
    vi.stubGlobal('fetch', fetcher);
    const pending = MidgardAPI.getTransactionEvidence(hash, controller.signal); controller.abort();
    expect((await pending).status).toBe('degraded'); expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await MidgardAPI.getTransactionEvidence(hash, controller.signal)).status).toBe('degraded'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
