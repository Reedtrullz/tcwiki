import { describe, expect, it } from 'vitest';
import { normalizeTransactionEvidence, transactionHash } from '@/lib/transaction-evidence';
const hash = 'A'.repeat(64);
const action = (extra = {}) => ({ date: '1791008198434550653', height: '28081517', type: 'swap', status: 'success', in: [{ txID: hash, coins: [{ asset: 'BTC.BTC', amount: '0' }] }], out: [{ txID: 'B'.repeat(64), coins: [{ asset: 'ETH.ETH', amount: '9007199254740993123' }] }], metadata: { swap: { memo: '=:ETH.ETH:destination:0', networkFees: [{ asset: 'ETH.ETH', amount: '123' }] } }, ...extra });
describe('transaction evidence boundaries', () => {
  it('accepts only one bounded 32-byte hex hash without rewriting the submitted value', () => {
    expect(transactionHash(hash)).toBe(hash);
    expect(transactionHash('0x' + hash)).toBe('0x' + hash);
    for (const bad of ['', 'https://example.com', hash + '&limit=5000', 'z'.repeat(64), ' '.repeat(1000) + hash]) expect(transactionHash(bad)).toBeNull();
  });
  it('preserves exact zero and large amounts, raw memo, fees and provider chronology', () => {
    const result = normalizeTransactionEvidence({ actions: [action()], count: '1' }, hash);
    expect(result.actions[0].inputs?.[0].coins?.[0]).toEqual({ asset: 'BTC.BTC', amount: '0' });
    expect(result.actions[0].outputs?.[0].coins?.[0].amount).toBe('9007199254740993123');
    expect(result.actions[0].observedAt).toBe('2026-10-03T06:16:38.434Z');
    expect(result.actions[0].rawDate).toBe('1791008198434550653');
    expect(result.actions[0].memo).toBe('=:ETH.ETH:destination:0');
    expect(result.actions[0].fees).toEqual([{ asset: 'ETH.ETH', amount: '123' }]);
  });
  it('keeps pending refunds, missing fields and multiple outbound observations distinct', () => {
    const result = normalizeTransactionEvidence({ actions: [action({ type: 'refund', status: 'pending', out: [], metadata: { refund: { memo: 'REFUND:' + hash, reason: 'provider reason' } } }), action({ out: [{ txID: 'B'.repeat(64), coins: [] }, { txID: 'C'.repeat(64), coins: [] }], height: undefined, date: '999999999999999999999999999' })] }, hash);
    expect(result.actions[0].status).toBe('pending');
    expect(result.actions[0].outputs).toEqual([]);
    expect(result.actions[1].outputs).toHaveLength(2);
    expect(result.actions[1].height).toBeNull();
    expect(result.actions[1].observedAt).toBeNull();
    expect(result.actions[1].warnings.length).toBeGreaterThan(0);
  });
  it('distinguishes empty indexed evidence from malformed or unrelated results', () => {
    expect(normalizeTransactionEvidence({ actions: [], count: '0' }, hash).actions).toEqual([]);
    expect(() => normalizeTransactionEvidence([], hash)).toThrow();
    expect(() => normalizeTransactionEvidence({ actions: [action({ in: [{ txID: 'B'.repeat(64) }], out: [] })] }, hash)).toThrow();
  });
  it('bounds provider lists and rejects unsafe numeric amounts without inventing zero', () => {
    const result = normalizeTransactionEvidence({ actions: Array.from({ length: 8 }, () => action({ in: [{ txID: hash, coins: [{ asset: 'BTC.BTC', amount: 9007199254740993 }, { asset: 'ETH.ETH' }] }] })) }, hash);
    expect(result.actions).toHaveLength(5);
    expect(result.warnings).toContain('Additional indexed actions were omitted by the five-action pilot limit.');
    expect(result.actions[0].inputs?.[0].coins?.map(coin => coin.amount)).toEqual([null, null]);
  });
});

it('rejects out-of-contract Int64 interpretations and warns on omitted bounded fields', () => {
  const result = normalizeTransactionEvidence({ actions: [action({ date: '10000000000000000000', height: '99999999999999999999', out: [{ txID: 'B'.repeat(64), height: '99999999999999999999', coins: [] }], metadata: { swap: { memo: 'x'.repeat(1025), reason: 'x'.repeat(513) } } })] }, hash);
  expect(result.actions[0].observedAt).toBeNull();
  expect(result.actions[0].height).toBeNull();
  expect(result.actions[0].outputs?.[0].height).toBeNull();
  expect(result.actions[0].memo).toBeNull();
  expect(result.actions[0].warnings.join(' ')).toContain('Memo');
  expect(result.actions[0].warnings.join(' ')).toContain('reason');
});
