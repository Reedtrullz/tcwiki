import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CHAIN_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
} from '@/lib/data/static';
import {
  DEEP_DIVE_READER_PATHS,
  TASK_INTENT_GUIDES,
  getContentEntry,
} from '@/lib/content/registry';
import { chainClientsSource } from '@/lib/sources';

const REVIEWED_AT = '2026-07-14';
const NEXT_REVIEW_DUE = '2026-08-14';
const LIVE_INBOUND_URL = 'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses';

describe('chain and developer-data content review', () => {
  it('keeps the supported-chain catalog tied to the reviewed live chain set', () => {
    expect(CHAIN_RECORDS.map((record) => record.data.chain)).toEqual([
      'BTC',
      'ETH',
      'BSC',
      'AVAX',
      'GAIA',
      'DOGE',
      'LTC',
      'BCH',
      'TRON',
      'BASE',
      'SOL',
      'XRP',
    ]);

    for (const record of CHAIN_RECORDS) {
      expect(record.data.supported, record.data.chain).toBe(true);
      expect(record.data.dustThreshold, record.data.chain).toBeUndefined();
      expect(record.freshness.checkedAt, record.data.chain).toBe(REVIEWED_AT);
      expect(record.freshness.nextReviewDue, record.data.chain).toBe(NEXT_REVIEW_DUE);
      expect(record.sources.map((source) => source.url), record.data.chain).toContain(LIVE_INBOUND_URL);
    }
  });

  it('uses current official address-format wording without inventing static dust values', () => {
    const recordsByChain = new Map(CHAIN_RECORDS.map((record) => [record.data.chain, record]));

    expect(recordsByChain.get('BCH')?.data.addressFormats).toEqual(['CashAddr', 'P2PKH']);
    expect(recordsByChain.get('BCH')?.data.statusNote).toContain('not BIP-173 Bech32');
    expect(recordsByChain.get('GAIA')?.data.addressFormats).toEqual(['Bech32 (Secp256k1 or Ed25519)']);
    expect(recordsByChain.get('XRP')?.data.addressFormats).toEqual(['Classic Base58']);
    expect(recordsByChain.get('XRP')?.data.statusNote).toContain('does not list X-address');
    expect(recordsByChain.get('SOL')?.sources).toContainEqual(chainClientsSource);
  });

  it('refreshes the bounded source-map and developer-guide cohort together', () => {
    const sourceMapIds = [
      'community-channels',
      'developer-integration',
      'external-analytics-and-explorers',
      'official-protocol-documentation',
    ];

    for (const id of sourceMapIds) {
      const record = SOURCE_MAP_SECTION_RECORDS.find((candidate) => candidate.data.id === id);
      expect(record, id).toBeDefined();
      expect(record?.freshness.checkedAt, id).toBe(REVIEWED_AT);
      expect(record?.freshness.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    const developerMap = SOURCE_MAP_SECTION_RECORDS.find((record) => record.data.id === 'developer-integration');
    expect(developerMap?.sources.map((source) => source.url)).toEqual(expect.arrayContaining([
      'https://dev.thorchain.org/concepts/connecting-to-thorchain.html',
      'https://dev.thorchain.org/concepts/querying-thorchain.html',
      'https://dev.thorchain.org/swap-guide/quickstart-guide.html',
      LIVE_INBOUND_URL,
    ]));

    for (const entryId of ['deep-dive-build-query-data', 'deep-dive-midgard-thornode-data']) {
      const entry = getContentEntry(entryId);
      expect(entry.reviewedAt, entryId).toBe(REVIEWED_AT);
      expect(entry.nextReviewDue, entryId).toBe(NEXT_REVIEW_DUE);
    }

    const readerPath = DEEP_DIVE_READER_PATHS.find((path) => path.id === 'developer-data-integration');
    expect(readerPath?.reviewedAt).toBe(REVIEWED_AT);
    expect(readerPath?.nextReviewDue).toBe(NEXT_REVIEW_DUE);

    const taskGuide = TASK_INTENT_GUIDES.find((guide) => guide.id === 'build-query');
    expect(taskGuide?.reviewedAt).toBe(REVIEWED_AT);
    expect(taskGuide?.nextReviewDue).toBe(NEXT_REVIEW_DUE);
  });

  it('documents live-only transaction inputs and historical endpoint routing', () => {
    const buildQuery = readFileSync('content/deep-dives/build-query-data.mdx', 'utf8');
    const sourceGuide = readFileSync('content/deep-dives/midgard-thornode-data.mdx', 'utf8');

    expect(buildQuery).toContain('50,000 requests per day per IP');
    expect(buildQuery).toContain('blocks at or below `4,786,559`');
    expect(buildQuery).toContain('Dust thresholds are live transaction inputs');
    expect(buildQuery).toContain('gRPC uses protocol buffers over HTTP/2');
    expect(sourceGuide).toContain('same provider and the same checked height');
    expect(sourceGuide).toContain('A static supported-chain list does not own current dust thresholds');
  });
});
