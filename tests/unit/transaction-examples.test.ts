import { describe, expect, it } from 'vitest';
import * as staticData from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import type { SourcedRecord, TransactionExample } from '@/lib/types';

const exportedRecords = Reflect.get(staticData, 'TRANSACTION_EXAMPLE_RECORDS');
const records = (Array.isArray(exportedRecords) ? exportedRecords : []) as SourcedRecord<TransactionExample>[];
const examples = new Map(records.map(({ data }) => [data.id, data]));

describe('dated transaction examples', () => {
  it('keeps one centralized record for each reviewed example', () => {
    expect(records).toHaveLength(4);
    expect(examples.size).toBe(4);
    expect(records.every(({ freshness }) => freshness.checkedAt === '2026-10-03')).toBe(true);
    expect(records.every(({ freshness }) => freshness.nextReviewDue === '2026-11-03')).toBe(true);
  });

  it('preserves the Bitcoin swap memo, chain observation and raw Midgard base units', () => {
    const swap = examples.get('btc-tron-swap');
    expect(swap?.memo.value).toBe('=:tr:TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya:0/1/0');
    expect(swap?.reports[0]).toEqual(expect.objectContaining({
      layer: 'source-chain',
      status: 'confirmed',
      observedAt: '2026-10-03T05:38:13Z',
      blockHeight: '969681',
      blockHash: '0000000000000000000117ce66fe52ea9dcd22d47f2b7ff905b21f79a567ab56',
    }));
    expect(swap?.reports[1]).toEqual(expect.objectContaining({
      layer: 'thorchain-indexer',
      actionType: 'swap',
      status: 'success',
      observedAt: '2026-10-03T05:39:15Z',
      height: '28081155',
      inputs: [{ amount: '10180', asset: 'BTC.BTC', unit: 'raw THORChain base units (1e8)' }],
      outputs: [{ amount: '2422777500', asset: 'TRON.TRX', unit: 'raw THORChain base units (1e8)' }],
    }));
    expect(swap?.unknowns.join(' ')).toMatch(/recipient ownership|destination.*verified|settlement/i);
    expect(records.find(({ data }) => data.id === 'btc-tron-swap')?.sources
      .some(({ notes }) => notes?.includes('0cfd9b659cb450d7915af928743a8450eda4c1298d1994c5d96148d0ffdc57fb'))).toBe(true);
  });

  it('keeps a pending refund distinct from a completed source-chain refund', () => {
    const refund = examples.get('pending-usdc-refund');
    expect(refund?.memo.value).toBe('=:TRON~USDT-TR7NHQJEKQXGTCI8Q8ZY4PL8OTSZGJLJ6T:thor17hwqt302e5f2xm4h95ma8wuggqkvfzgvsnh5z9:4575592086/1/1');
    expect(refund?.reports).toHaveLength(1);
    expect(refund?.reports[0]).toEqual(expect.objectContaining({
      layer: 'thorchain-indexer',
      actionType: 'refund',
      status: 'pending',
      observedAt: '2026-10-03T06:16:38Z',
      height: '28081517',
      outputs: [],
      inputs: [expect.objectContaining({ kind: 'trade asset', asset: expect.stringContaining('ETH~USDC') })],
    }));
    expect(refund?.memo.interpretation).toMatch(/Trade-asset notation/i);
    expect(refund?.unknowns.join(' ')).toMatch(/source-chain block/i);
    expect(refund?.unknowns.join(' ')).toMatch(/refund outbound|refund settlement/i);
  });

  it('keeps Bitcoin OUT role separate from Midgard trade action type', () => {
    const outbound = examples.get('bitcoin-outbound');
    expect(outbound?.memo.value).toBe('OUT:00000650D568062B71D1BF4F0F4EEFED44C3F6FB7ED3F6DBB08E962F492107C6');
    expect(outbound?.memo.interpretation).toMatch(/complementary layers/i);
    expect(outbound?.reports.map(({ actionType }) => actionType)).toEqual(['outbound', 'trade']);
    expect(outbound?.reports[1]).toEqual(expect.objectContaining({
      status: 'success',
      height: '28081053',
      outputs: [{ amount: '35663524', asset: 'BTC.BTC', unit: 'raw THORChain base units (1e8)' }],
    }));
  });

  it('keeps the historical Ethereum block, migration memo height and token units separate', () => {
    const migration = examples.get('ethereum-vault-migration');
    expect(migration?.memo.value).toBe('MIGRATE:17894403');
    expect(migration?.memo.parameters).toContainEqual({ label: 'THORChain memo height', value: '17894403' });
    expect(migration?.reports[0]).toEqual(expect.objectContaining({
      layer: 'source-chain',
      blockHeight: '20844210',
      observedAt: '2024-09-27T19:59:59Z',
      facts: expect.arrayContaining([{
        label: 'Decoded amount parameter',
        value: '544915588553 USDC raw Ethereum token uint256; not THORChain 1e8 units',
      }]),
    }));
    expect(migration?.reports[1]).toEqual(expect.objectContaining({
      layer: 'thorchain-indexer',
      status: '0 actions returned for exact transaction lookup',
    }));
    expect(migration?.unknowns.join(' ')).toMatch(/matched THORChain migration lifecycle/i);
    expect(migration?.unknowns.join(' ')).toMatch(/matched|unmatched/i);
  });

  it('does not repin the parent guide review dates for the new example cohort', () => {
    expect(getContentEntry('deep-dive-streaming-swaps-refunds').reviewedAt).toBe('2026-07-14');
    expect(getContentEntry('deep-dive-build-query-data').reviewedAt).toBe('2026-07-14');
    expect(getContentEntry('deep-dive-churning').reviewedAt).toBe('2026-07-14');
  });
});
