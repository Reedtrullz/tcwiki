import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const {
  buildLiveChainSnapshotEvidence,
  checkLiveChainSnapshot,
  getConservativeSnapshotHeight,
  getBlockAgeWarnings,
  validateInboundAddresses,
  writeLiveChainSnapshotEvidence,
} = await import('../../scripts/lib/live-chain-snapshot.mjs') as unknown as {
  buildLiveChainSnapshotEvidence: (input: {
    chainRecords: Array<{ data?: { chain?: string; supported?: boolean } }>;
    sources: Array<{ label: string; url: string; cosmosUrl: string }>;
    fetchImpl: typeof fetch;
    nowMs: number;
  }) => Promise<{
    schemaVersion: number;
    check: string;
    checkedAt: string;
    status: 'pass' | 'fail';
    failureReason: string;
    failureMessage: string | null;
    sourcePolicy: {
      pinnedSnapshot: string;
      providerAgreement: string;
      failureSemantics: string;
    };
    selectedSource: { label: string; url: string; cosmosUrl: string } | null;
    latestHeight: number | null;
    snapshotHeight: number | null;
    blockTime: string | null;
    blockAgeSeconds: number | null;
    curatedChains: string[];
    liveChains: string[];
    drift: {
      missingFromLive: string[];
      missingFromCurated: string[];
    };
    warnings: string[];
    providerErrors: string[];
    providers: Array<{
      source: { label: string; url: string; cosmosUrl: string };
      status: string;
      latestHeight?: number;
      snapshotHeight?: number;
      blockTime?: string;
      blockAgeSeconds?: number;
      liveChains?: string[];
      chainSignature?: string;
      warnings?: string[];
      error?: string;
    }>;
  }>;
  checkLiveChainSnapshot: (input: {
    chainRecords: Array<{ data?: { chain?: string; supported?: boolean } }>;
    sources: Array<{ label: string; url: string; cosmosUrl: string }>;
    fetchImpl: typeof fetch;
    nowMs: number;
  }) => Promise<{
    source: { label: string } | null;
    snapshotHeight: number | null;
    latestHeight: number | null;
    blockAgeSeconds: number | null;
    curatedChains: Set<string>;
    providerErrors: string[];
    warnings: string[];
    evidence: {
      status: 'pass' | 'fail';
      failureReason: string;
    };
  }>;
  getConservativeSnapshotHeight: (latestHeight: number) => number;
  getBlockAgeWarnings: (blockTime: string, nowMs?: number) => { ageSeconds: number; warnings: string[] };
  validateInboundAddresses: (value: unknown) => Set<string>;
  writeLiveChainSnapshotEvidence: (evidence: unknown, outputPath: string) => Promise<void>;
};

const sources = [
  { label: 'A THORNode', url: 'https://a.example/thorchain', cosmosUrl: 'https://a.example/cosmos' },
  { label: 'B THORNode', url: 'https://b.example/thorchain', cosmosUrl: 'https://b.example/cosmos' },
];

const nowMs = Date.parse('2026-07-05T00:00:05.000Z');

function chainRecord(chain: string, supported = true) {
  return { data: { chain, supported } };
}

function latestBlock(height: number, time = '2026-07-05T00:00:00.000Z') {
  return { block: { header: { height: String(height), time } } };
}

function inboundRow(chain: string, overrides: Record<string, unknown> = {}) {
  return {
    chain,
    halted: false,
    global_trading_paused: false,
    chain_trading_paused: false,
    chain_lp_actions_paused: false,
    ...overrides,
  };
}

function response(data: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue(data),
  };
}

function failingResponse(status = 503, statusText = 'Unavailable') {
  return {
    ok: false,
    status,
    statusText,
    json: vi.fn().mockResolvedValue({}),
  };
}

function fetchFor(responses: Record<string, unknown>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const value = responses[url];
    if (value === undefined) {
      return failingResponse(404, 'Not Found') as unknown as Response;
    }
    return response(value) as unknown as Response;
  });
}

describe('live chain snapshot helper', () => {
  it('pins inbound-address snapshots to latest minus one for each provider', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC'), inboundRow('ETH')],
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://b.example/thorchain/inbound_addresses?height=10': [inboundRow('ETH'), inboundRow('BTC')],
    });

    const result = await checkLiveChainSnapshot({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources,
      fetchImpl,
      nowMs,
    });

    expect(result.source?.label).toBe('A THORNode');
    expect(result.evidence.status).toBe('pass');
    expect(result.latestHeight).toBe(11);
    expect(result.snapshotHeight).toBe(10);
    expect(result.blockAgeSeconds).toBe(5);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://a.example/thorchain/inbound_addresses?height=10',
      expect.objectContaining({ cache: 'no-store' })
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://b.example/thorchain/inbound_addresses?height=10',
      expect.objectContaining({ cache: 'no-store' })
    );
  });

  it('builds durable pass evidence without raw inbound row fields', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('ETH'), inboundRow('BTC')],
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://b.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC'), inboundRow('ETH')],
    });

    const evidence = await buildLiveChainSnapshotEvidence({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources,
      fetchImpl,
      nowMs,
    });

    expect(evidence).toMatchObject({
      schemaVersion: 1,
      check: 'live-chain-snapshot',
      checkedAt: '2026-07-05T00:00:05.000Z',
      status: 'pass',
      failureReason: 'none',
      selectedSource: sources[0],
      latestHeight: 11,
      snapshotHeight: 10,
      blockAgeSeconds: 5,
      curatedChains: ['BTC', 'ETH'],
      liveChains: ['BTC', 'ETH'],
      drift: {
        missingFromLive: [],
        missingFromCurated: [],
      },
      providerErrors: [],
      warnings: [],
    });
    expect(evidence.sourcePolicy.pinnedSnapshot).toBe('latest_height_minus_1');
    expect(evidence.sourcePolicy.providerAgreement).toContain('all usable providers');
    expect(evidence.providers).toHaveLength(2);
    expect(evidence.providers.map((provider) => provider.status)).toEqual(['usable', 'usable']);
    expect(JSON.stringify(evidence)).not.toContain('"global_trading_paused":false');
  });

  it('rejects duplicate live chain rows instead of hiding source corruption', () => {
    expect(() => validateInboundAddresses([
      inboundRow('BTC'),
      inboundRow('btc'),
    ])).toThrow(/duplicate chain rows: BTC/);
  });

  it('rejects inbound rows that omit operation fields', () => {
    expect(() => validateInboundAddresses([
      inboundRow('BTC', { halted: undefined }),
    ])).toThrow(/omitted operation fields: BTC: halted/);
  });

  it('fails when usable providers disagree on the live chain set', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC'), inboundRow('ETH')],
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://b.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC')],
    });

    await expect(checkLiveChainSnapshot({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources,
      fetchImpl,
      nowMs,
    })).rejects.toThrow(/sources disagree on live chain set/);
  });

  it('keeps provider chain signatures in disagreement evidence', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC'), inboundRow('ETH')],
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://b.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC')],
    });

    const evidence = await buildLiveChainSnapshotEvidence({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources,
      fetchImpl,
      nowMs,
    });

    expect(evidence).toMatchObject({
      status: 'fail',
      failureReason: 'provider-disagreement',
      failureMessage: expect.stringContaining('sources disagree'),
    });
    expect(evidence.providers.map((provider) => ({
      label: provider.source.label,
      status: provider.status,
      chainSignature: provider.chainSignature,
    }))).toEqual([
      { label: 'A THORNode', status: 'usable', chainSignature: 'BTC,ETH' },
      { label: 'B THORNode', status: 'disagreeing', chainSignature: 'BTC' },
    ]);
  });

  it('keeps provider errors in source-unavailable evidence', async () => {
    const fetchImpl = fetchFor({});

    const evidence = await buildLiveChainSnapshotEvidence({
      chainRecords: [chainRecord('BTC')],
      sources,
      fetchImpl,
      nowMs,
    });

    expect(evidence).toMatchObject({
      status: 'fail',
      failureReason: 'no-usable-provider',
      selectedSource: null,
      liveChains: [],
    });
    expect(evidence.providerErrors).toEqual([
      'A THORNode: 404 Not Found',
      'B THORNode: 404 Not Found',
    ]);
    expect(evidence.providers.map((provider) => ({
      label: provider.source.label,
      status: provider.status,
      error: provider.error,
    }))).toEqual([
      { label: 'A THORNode', status: 'error', error: '404 Not Found' },
      { label: 'B THORNode', status: 'error', error: '404 Not Found' },
    ]);
  });

  it('fails when the curated supported chain set drifts from live THORNode', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC')],
    });

    await expect(checkLiveChainSnapshot({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources: [sources[0]],
      fetchImpl,
      nowMs,
    })).rejects.toThrow(/Curated but missing live: ETH/);
  });

  it('returns structured failure evidence when curated and live chains drift', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11),
      'https://a.example/thorchain/inbound_addresses?height=10': [inboundRow('BTC')],
    });

    const evidence = await buildLiveChainSnapshotEvidence({
      chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
      sources: [sources[0]],
      fetchImpl,
      nowMs,
    });

    expect(evidence).toMatchObject({
      status: 'fail',
      failureReason: 'chain-drift',
      failureMessage: expect.stringContaining('Curated but missing live: ETH'),
      selectedSource: sources[0],
      curatedChains: ['BTC', 'ETH'],
      liveChains: ['BTC'],
      drift: {
        missingFromLive: ['ETH'],
        missingFromCurated: [],
      },
    });

    try {
      await checkLiveChainSnapshot({
        chainRecords: [chainRecord('BTC'), chainRecord('ETH')],
        sources: [sources[0]],
        fetchImpl,
        nowMs,
      });
      throw new Error('Expected checkLiveChainSnapshot to fail.');
    } catch (error) {
      expect(error).toMatchObject({
        evidence: {
          status: 'fail',
          failureReason: 'chain-drift',
        },
      });
    }
  });

  it('writes live chain snapshot evidence as stable JSON', async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), 'tcwiki-live-chain-'));
    const outputPath = join(outputRoot, 'nested', 'evidence.json');
    try {
      await writeLiveChainSnapshotEvidence({
        schemaVersion: 1,
        check: 'live-chain-snapshot',
        status: 'pass',
      }, outputPath);

      const parsed = JSON.parse(await readFile(outputPath, 'utf8')) as {
        schemaVersion: number;
        check: string;
        status: string;
      };
      expect(parsed).toEqual({
        schemaVersion: 1,
        check: 'live-chain-snapshot',
        status: 'pass',
      });
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });

  it('falls back to a later provider when the first provider has stale block evidence', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11, '2026-07-05T00:00:00.000Z'),
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(12, '2026-07-05T00:01:00.000Z'),
      'https://b.example/thorchain/inbound_addresses?height=11': [inboundRow('BTC')],
    });

    const result = await checkLiveChainSnapshot({
      chainRecords: [chainRecord('BTC')],
      sources,
      fetchImpl,
      nowMs: Date.parse('2026-07-05T00:01:05.000Z'),
    });

    expect(result.source?.label).toBe('B THORNode');
    expect(result.providerErrors).toEqual([
      'A THORNode: latest block timestamp is stale by 65 seconds.',
    ]);
  });

  it('falls back to a later provider when the first provider has far-future block evidence', async () => {
    const fetchImpl = fetchFor({
      'https://a.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(11, '2026-07-05T00:02:00.000Z'),
      'https://b.example/cosmos/base/tendermint/v1beta1/blocks/latest': latestBlock(12, '2026-07-05T00:01:00.000Z'),
      'https://b.example/thorchain/inbound_addresses?height=11': [inboundRow('BTC')],
    });

    const result = await checkLiveChainSnapshot({
      chainRecords: [chainRecord('BTC')],
      sources,
      fetchImpl,
      nowMs: Date.parse('2026-07-05T00:01:05.000Z'),
    });

    expect(result.source?.label).toBe('B THORNode');
    expect(result.providerErrors).toEqual([
      'A THORNode: latest block timestamp is 55 seconds in the future.',
    ]);
  });

  it('keeps warning-band stale and future block timestamps usable with warnings', () => {
    expect(getBlockAgeWarnings('2026-07-05T00:00:00.000Z', Date.parse('2026-07-05T00:00:20.000Z'))).toEqual({
      ageSeconds: 20,
      warnings: ['latest block timestamp is 20 seconds old.'],
    });
    expect(getBlockAgeWarnings('2026-07-05T00:00:20.000Z', Date.parse('2026-07-05T00:00:00.000Z'))).toEqual({
      ageSeconds: -20,
      warnings: ['latest block timestamp is 20 seconds in the future.'],
    });
  });

  it('uses latest height zero as a pinned genesis snapshot', () => {
    expect(getConservativeSnapshotHeight(0)).toBe(0);
  });
});
