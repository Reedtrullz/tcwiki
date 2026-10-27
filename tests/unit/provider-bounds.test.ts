import { afterEach, expect, it, vi } from 'vitest';
import ThornodeAPI, { resetThornodeEndpointForTests } from '@/lib/api/thornode';
import MidgardAPI, { resetMidgardEndpointForTests } from '@/lib/api/midgard';
import MayaAPI from '@/lib/api/maya';

afterEach(() => { vi.unstubAllGlobals(); resetThornodeEndpointForTests(); resetMidgardEndpointForTests(); });

it.each([
  ['THORNode', () => ThornodeAPI.getMimir()],
  ['Midgard', () => MidgardAPI.getActions()],
  ['Maya', () => MayaAPI.getNodes()],
] as const)('%s rejects excessive rows instead of passing or truncating them', async (_label, collect) => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(Array.from({ length: 4097 }, () => ({ node_address: 'maya1node', bond: '1' }))))));
  const result = await collect();
  expect(result.status).toBe('degraded');
  expect(result.data).toBeUndefined();
  expect(result.error).toMatch(/array.*4096/i);
});

it('rejects excessive quote input before issuing a provider request', async () => {
  const fetchMock = vi.fn(async () => new Response('{}'));
  vi.stubGlobal('fetch', fetchMock);
  const result = await ThornodeAPI.getSwapQuoteProbe({ fromAsset: 'BTC.BTC', toAsset: 'ETH.ETH', amountBaseUnits: '1'.repeat(81) });
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.error).toMatch(/80 digits/);
});

it('bounds decoded streamed bytes, mismatched lengths, numeric strings and nesting', async () => {
  const { readProviderJson, PROVIDER_MAX_BYTES } = await import('@/lib/api/bounded-json');
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(new Uint8Array(PROVIDER_MAX_BYTES + 1)); },
    cancel() { cancelled = true; },
  });
  await expect(readProviderJson(new Response(stream, { headers: { 'Content-Length': '1' } }))).rejects.toThrow(/body exceeds/);
  expect(cancelled).toBe(true);
  await expect(readProviderJson(new Response('{}', { headers: { 'Content-Length': '1' } }))).rejects.toThrow(/does not match/);
  await expect(readProviderJson(new Response('{}', { headers: { 'Content-Length': String(PROVIDER_MAX_BYTES + 1) } }))).rejects.toThrow(/advertised/);
  await expect(readProviderJson(new Response(JSON.stringify({ amount: '1'.repeat(81) })))).rejects.toThrow(/numeric string/);
  await expect(readProviderJson(new Response('['.repeat(66) + '0' + ']'.repeat(66)))).rejects.toThrow(/nesting/);
  await expect(readProviderJson(new Response('{}', { headers: { 'Content-Length': '1', 'Content-Encoding': 'gzip' } }))).resolves.toEqual({});
  await expect(readProviderJson(new Response(JSON.stringify({ amount: '0', largest: '1'.repeat(80) })))).resolves.toEqual({ amount: '0', largest: '1'.repeat(80) });
});

it('cancels a stalled body read on the owning deadline', async () => {
  const { readProviderJson } = await import('@/lib/api/bounded-json');
  let cancelled = false;
  const controller = new AbortController();
  const reading = readProviderJson(new Response(new ReadableStream({ cancel() { cancelled = true; } })), controller.signal);
  const assertion = expect(reading).rejects.toThrow(/deadline/);
  controller.abort(new Error('Provider deadline exceeded.'));
  await assertion;
  expect(cancelled).toBe(true);
});

it('accepts decoded CORS bodies when the browser hides Content-Encoding', async () => {
  const { readProviderJson } = await import('@/lib/api/bounded-json');
  const response = new Response('{"pools":["BTC.BTC"]}', { headers: { 'Content-Length': '8' } });
  Object.defineProperty(response, 'type', { value: 'cors' });
  await expect(readProviderJson(response)).resolves.toEqual({ pools: ['BTC.BTC'] });
});

it('retains byte and JSON limits for CORS bodies with hidden encoding', async () => {
  const { readProviderJson, PROVIDER_MAX_BYTES } = await import('@/lib/api/bounded-json');
  for (const [body, error] of [
    ['x'.repeat(PROVIDER_MAX_BYTES + 1), /body exceeds/],
    ['{"unfinished":', /JSON/],
  ] as const) {
    const response = new Response(body, { headers: { 'Content-Length': '1' } });
    Object.defineProperty(response, 'type', { value: 'cors' });
    await expect(readProviderJson(response)).rejects.toThrow(error);
  }
  const identity = new Response('{}', { headers: { 'Content-Length': '1', 'Content-Encoding': 'identity' } });
  Object.defineProperty(identity, 'type', { value: 'cors' });
  await expect(readProviderJson(identity)).rejects.toThrow(/does not match/);
});
