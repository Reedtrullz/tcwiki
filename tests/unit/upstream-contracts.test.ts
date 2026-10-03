import { afterEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import MayaAPI from '@/lib/api/maya';
import MidgardAPI, { resetMidgardEndpointForTests } from '@/lib/api/midgard';
import { deriveNetworkStatus, deriveRunePoolPolStatus } from '@/lib/api/thornode';
import { parseLatestBlockInfo, validateInboundAddresses } from '../../scripts/lib/live-chain-snapshot.mjs';
import { CONTRACT_SOURCES, captureContracts, compareContracts, sanitizeContract } from '../../scripts/lib/upstream-contracts.mjs';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/upstream/v1.json', import.meta.url), 'utf8'));
const payload = (id: string) => fixture.contracts.find((item: { id: string }) => item.id === id)?.payload;
afterEach(() => vi.unstubAllGlobals());

it('keeps a changed numeric field visible in the shape diff and provider failure separate', () => {
  const baseline = { contracts: [{ id: 'network', status: 'captured', payload: { activeNodeCount: '0' } }] };
  const capture = { contracts: [{ id: 'network', status: 'captured', payload: { activeNodeCount: null } }, { id: 'offline', status: 'provider-unavailable' }] };
  expect(compareContracts(baseline, capture)).toEqual([
    { id: 'network', status: 'shape-changed', removed: ['$.activeNodeCount: string'], added: ['$.activeNodeCount: null'] },
    { id: 'offline', status: 'provider-unavailable' },
  ]);
});

it('bounds samples and strips identities and unknown private fields before persistence', async () => {
  const raw = Array.from({ length: 100 }, () => ({ node_address: 'maya1private', bond: '0', ip_address: 'private', wallet: 'secret' }));
  expect(sanitizeContract(raw, ['node_address', 'bond'])).toEqual(Array.from({ length: 3 }, () => ({ node_address: 'redacted-node', bond: '0' })));
  const capture = await captureContracts({ fetchImpl: async () => { throw new Error('secret provider error'); } });
  expect(capture.contracts.every((item: { status: string }) => item.status === 'provider-unavailable')).toBe(true);
  expect(capture.height).toBeNull();
  expect(JSON.stringify(capture)).not.toContain('secret');
});

it('replays the sanitized versioned provider capture through existing offline parsers', async () => {
  expect(fixture.schemaVersion).toBe(1);
  expect(fixture.contracts.map((item: { id: string }) => item.id)).toEqual(CONTRACT_SOURCES.map((item: { id: string }) => item.id));
  expect(parseLatestBlockInfo(payload('thor-block')).height).toBe(fixture.height);
  expect(validateInboundAddresses(payload('thor-inbound')).size).toBeGreaterThan(0);
  expect(deriveNetworkStatus(payload('thor-mimir'), payload('thor-inbound'), fixture.protocolVersion, fixture.height).sourceWarningDetails).toBeDefined();
  const pol = deriveRunePoolPolStatus(payload('thor-mimir'), payload('thor-runepool'), { thorchainHeight: fixture.height, thorchainBlockTime: payload('thor-block').block.header.time, snapshotPinned: false });
  expect(pol.pol.valueRuneBaseUnits).toMatch(/^\d+$/);
  resetMidgardEndpointForTests();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => new Response(JSON.stringify(
    url.includes('mayachain/nodes') ? payload('maya-nodes') : url.includes('mayachain') ? payload('maya-network') : url.includes('/pools') ? payload('midgard-pools') : url.includes('/history/earnings') ? payload('midgard-earnings') : payload('midgard-network')
  ), { headers: { 'Content-Type': 'application/json' } })));
  expect((await MayaAPI.getNetwork()).status).toBe('ok');
  expect((await MayaAPI.getNodes()).status).toBe('ok');
  expect((await MidgardAPI.getNetworkData()).status).toBe('ok');
  expect((await MidgardAPI.getPools()).status).toBe('ok');
  expect((await MidgardAPI.getHistory()).status).toBe('ok');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...payload('maya-network'), activeNodeCount: null }))));
  const malformed = await MayaAPI.getNetwork();
  expect(malformed.status).toBe('degraded');
  expect(malformed.data).toBeUndefined();
});

it('withholds malformed captured fields and enforces the response-size ceiling', async () => {
  const inbound = structuredClone(payload('thor-inbound'));
  inbound[0].halted = null;
  expect(() => validateInboundAddresses(inbound)).toThrow(/operation fields/);
  const pol = deriveRunePoolPolStatus(payload('thor-mimir'), { ...payload('thor-runepool'), pol: { ...payload('thor-runepool').pol, value: null } }, { thorchainHeight: fixture.height, thorchainBlockTime: payload('thor-block').block.header.time, snapshotPinned: false });
  expect(pol.pol.valueRuneBaseUnits).toBeNull();
  expect(pol.sourceWarningDetails.some((detail) => detail.category === 'source-shape')).toBe(true);
  resetMidgardEndpointForTests();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ...payload('midgard-network'), activeNodeCount: null }))));
  const invalid = await MidgardAPI.getNetworkData();
  expect(invalid.status).toBe('degraded');
  expect(invalid.data).toBeUndefined();
  const oversized = await captureContracts({ fetchImpl: async () => new Response(' '.repeat(524289)) });
  expect(oversized.contracts.every((item: { status: string }) => item.status === 'provider-unavailable')).toBe(true);
});
