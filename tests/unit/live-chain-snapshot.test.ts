import { describe, expect, it, vi } from 'vitest';

const {
  checkLiveChainSnapshot,
  getConservativeSnapshotHeight,
  validateInboundAddresses,
} = await import('../../scripts/lib/live-chain-snapshot.mjs') as {
  checkLiveChainSnapshot: (input: {
    chainRecords: Array<{ data?: { chain?: string; supported?: boolean } }>;
    sources: Array<{ label: string; url: string; cosmosUrl: string }>;
    fetchImpl: typeof fetch;
    nowMs: number;
  }) => Promise<{
    source: { label: string };
    snapshotHeight: number;
    latestHeight: number;
    blockAgeSeconds: number;
    curatedChains: Set<string>;
    providerErrors: string[];
    warnings: string[];
  }>;
  getConservativeSnapshotHeight: (latestHeight: number) => number;
  validateInboundAddresses: (value: unknown) => Set<string>;
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

    expect(result.source.label).toBe('A THORNode');
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

    expect(result.source.label).toBe('B THORNode');
    expect(result.providerErrors).toEqual([
      'A THORNode: latest block timestamp is stale by 65 seconds.',
    ]);
  });

  it('uses latest height zero as a pinned genesis snapshot', () => {
    expect(getConservativeSnapshotHeight(0)).toBe(0);
  });
});
