import { describe, expect, it } from 'vitest';
import { decodeMemo } from '@/lib/memo-decoder';
import { LOCAL_MEMO_DECODER_REVIEW } from '@/lib/data/static';

function field(result: ReturnType<typeof decodeMemo>, id: string) {
  return result.fields.find((candidate) => candidate.id === id);
}

describe('bounded educational memo decoder', () => {
  it('keeps the original swap and unresolved shorthand while reading streaming fields', () => {
    const original = '=:tr:TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya:0/1/0';
    const result = decodeMemo(original);

    expect(result.status).toBe('decoded');
    expect(result.original).toBe(original);
    expect(result.status === 'decoded' && result.action).toBe('swap');
    expect(field(result, 'asset')).toMatchObject({ raw: 'tr' });
    expect(field(result, 'asset')?.interpretation).toMatch(/unresolved shorthand/i);
    expect(field(result, 'destination')?.raw).toBe('TMMcoyunsxpMad5BbbT6BodSDBMw4Pfzya');
    expect(field(result, 'streaming-interval')?.raw).toBe('1');
    expect(field(result, 'streaming-quantity')).toMatchObject({ raw: '0' });
    expect(field(result, 'streaming-quantity')?.interpretation).toMatch(/queue-context/i);
  });

  it.each(['=', 's', 'SWAP'])('recognizes the reviewed market swap alias %s without changing raw case', (alias) => {
    const memo = `${alias}:BTC.BTC:bc1QCaseSensitiveDest:123e2`;
    const result = decodeMemo(memo);

    expect(result.status).toBe('decoded');
    expect(result.status === 'decoded' && result.action).toBe('swap');
    expect(result.original).toBe(memo);
    expect(field(result, 'destination')?.raw).toBe('bc1QCaseSensitiveDest');
    expect(field(result, 'price-limit')?.raw).toBe('123e2');
    expect(field(result, 'price-limit')?.interpretation).toContain('12300');
  });

  it('keeps destination and optional refund tokens separate and preserves their case', () => {
    const result = decodeMemo('=:ETH.ETH:0xAbCd/ThorRefundCase::');

    expect(result.status).toBe('decoded');
    expect(field(result, 'destination')?.raw).toBe('0xAbCd');
    expect(field(result, 'refund-address')?.raw).toBe('ThorRefundCase');
  });

  it('shows omitted optional destination and refund slots without inventing values', () => {
    const result = decodeMemo('=:BTC.BTC');

    expect(result.status).toBe('decoded');
    expect(field(result, 'destination')).toMatchObject({ raw: '' });
    expect(field(result, 'destination')?.interpretation).toMatch(/omitted/i);
    expect(field(result, 'refund-address')).toMatchObject({ raw: '' });
    expect(field(result, 'refund-address')?.interpretation).toMatch(/supplied/i);
  });

  it('maps one raw affiliate fee to each listed affiliate without validating caps', () => {
    const result = decodeMemo('=:BTC.BTC:dest:0:Alpha/Beta:1000');

    expect(result.status).toBe('decoded');
    expect(field(result, 'affiliate-1')).toMatchObject({ raw: 'Alpha' });
    expect(field(result, 'affiliate-fee-1')?.raw).toBe('1000');
    expect(field(result, 'affiliate-2')).toMatchObject({ raw: 'Beta' });
    expect(field(result, 'affiliate-fee-2')?.raw).toBe('1000');
  });

  it('pairs count-matched raw affiliate fee lists without losing precision', () => {
    const result = decodeMemo('=:BTC.BTC:dest:0:Alpha/Beta:1000/0007');

    expect(result.status).toBe('decoded');
    expect(field(result, 'affiliate-fee-1')?.raw).toBe('1000');
    expect(field(result, 'affiliate-2')?.raw).toBe('Beta');
    expect(field(result, 'affiliate-fee-2')?.raw).toBe('0007');
  });

  it('keeps OUT and REFUND transaction identifiers exactly as entered', () => {
    const hash = 'Ab'.repeat(32);
    const outbound = decodeMemo(`OUT:${hash}`);
    const refund = decodeMemo(`rEfUnD:0x${'aB'.repeat(32)}`);

    expect(outbound).toMatchObject({ status: 'decoded', action: 'outbound', original: `OUT:${hash}` });
    expect(field(outbound, 'transaction-id')?.raw).toBe(hash);
    expect(refund).toMatchObject({ status: 'decoded', action: 'refund' });
    expect(field(refund, 'transaction-id')?.raw).toBe(`0x${'aB'.repeat(32)}`);
  });

  it('accepts the bounded indexed Cosmos and Solana transaction-id shapes', () => {
    const cosmosIndexed = `${'aB'.repeat(32)}-12`;
    const solana = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.repeat(2).slice(0, 87);

    expect(decodeMemo(`OUT:${cosmosIndexed}`).status).toBe('decoded');
    expect(field(decodeMemo(`OUT:${solana}`), 'transaction-id')?.raw).toBe(solana);
  });

  it('reads MIGRATE height as a signed int64 while preserving its original digits', () => {
    const result = decodeMemo('mIgRaTe:-9223372036854775808');

    expect(result).toMatchObject({ status: 'decoded', action: 'migrate' });
    expect(field(result, 'memo-height')).toMatchObject({ raw: '-9223372036854775808' });
  });

  it('rejects numeric values outside the source integer widths', () => {
    expect(decodeMemo('MIGRATE:9223372036854775808').status).toBe('malformed');
    expect(decodeMemo('=:BTC.BTC:dest:0/18446744073709551616/1').status).toBe('malformed');
    expect(decodeMemo(`=:BTC.BTC:dest:${'9'.repeat(78)}`).status).toBe('malformed');
  });

  it('bounds exact limit expansion and leaves unsupported fractional forms visible', () => {
    const max256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
    const maxResult = decodeMemo(`=:BTC.BTC:dest:${max256}`);
    const exponentResult = decodeMemo('=:BTC.BTC:dest:1e77');

    expect(field(maxResult, 'price-limit')?.raw).toBe(max256);
    expect(field(exponentResult, 'price-limit')?.interpretation).toContain(`1${'0'.repeat(77)}`);
    expect(decodeMemo('=:BTC.BTC:dest:1.5e3').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:1e78').status).toBe('unsupported');
  });

  it('keeps scientific and fractional streaming limit variants unsupported', () => {
    expect(decodeMemo('=:BTC.BTC:dest:1e3/2/4').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:1.5/2/4').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:1/2e3/4').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:1/2/4.5').status).toBe('unsupported');
    expect(decodeMemo('MIGRATE:1e3').status).toBe('unsupported');
    expect(decodeMemo('MIGRATE:1.5').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:0:Alpha:1e3').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:0:Alpha:1.5').status).toBe('unsupported');
  });

  it('reports mismatched affiliate fields and oversized affiliate lists', () => {
    expect(decodeMemo('=:BTC.BTC:dest:0:A/B:10/20/30').status).toBe('malformed');
    expect(decodeMemo('=:BTC.BTC:dest:0:A/B/C/D/E/F/G/H/I:10').status).toBe('unsupported');
  });

  it('does not strip documented-out suffixes, streaming aliases, or unknown actions', () => {
    expect(decodeMemo('=:BTC.BTC:dest:0::0:DEX:target').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:0/1/2/3').status).toBe('unsupported');
    expect(decodeMemo('=:BTC.BTC:dest:0|affiliate:10').status).toBe('unsupported');
    expect(decodeMemo('=<:BTC.BTC:dest:100').status).toBe('unsupported');
    expect(decodeMemo('TRADE:BTC.BTC').status).toBe('unsupported');
  });

  it('keeps malformed supported-family memos visible as their unchanged original', () => {
    const original = 'OUT:not-a-transaction-id';
    const result = decodeMemo(original);

    expect(result.status).toBe('malformed');
    expect(result.original).toBe(original);
  });

  it('enforces the 250-byte UTF-8 tool bound without slicing the input', () => {
    const exact = `MIGRATE:${'1'.repeat(242)}`;
    const over = `MIGRATE:${'1'.repeat(243)}`;
    const multiByte = `MIGRATE:${'é'.repeat(125)}`;

    expect(new TextEncoder().encode(exact).byteLength).toBe(250);
    expect(decodeMemo(exact)).toMatchObject({ status: 'malformed', byteLength: 250 });
    expect(decodeMemo(over)).toMatchObject({ status: 'too-long', byteLength: 251, original: over });
    expect(decodeMemo(multiByte)).toMatchObject({ status: 'too-long', byteLength: 251, original: multiByte });
  });

  it('returns an explicit empty state instead of guessing', () => {
    expect(decodeMemo('')).toMatchObject({ status: 'empty', original: '' });
  });

  it('keeps the decoder rules in their own dated, source-backed review cohort', () => {
    expect(LOCAL_MEMO_DECODER_REVIEW.freshness).toMatchObject({
      checkedAt: '2026-10-03',
      nextReviewDue: '2026-11-03',
      confidence: 'curated',
    });
    expect(LOCAL_MEMO_DECODER_REVIEW.sources.some((source) => source.url.includes('b08d81f79275093b0fcb753e0d68ff1c16c51cb8'))).toBe(true);
    expect(LOCAL_MEMO_DECODER_REVIEW.data.boundaries.join(' ')).toMatch(/current.*fee|fee.*cap/i);
  });
});
