import type { TransactionEvidence, TransactionEvidenceAction, TransactionEvidenceCoin, TransactionEvidenceTransfer } from '@/lib/types';
const HASH = /^(?:0x)?[0-9a-fA-F]{64}$/;
export function transactionHash(input: string): string | null { return input.length <= 66 && HASH.test(input) ? input : null; }
function record(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function text(value: unknown, max = 256): string | null { return typeof value === 'string' && value.length > 0 && value.length <= max ? value : null; }
function unsigned(value: unknown, max = 80): string | null { return typeof value === 'string' && value.length <= max && /^\d+$/.test(value) ? value : null; }
function sameHash(value: unknown, hash: string): boolean { return typeof value === 'string' && transactionHash(value) !== null && value.replace(/^0x/, '').toLowerCase() === hash.replace(/^0x/, '').toLowerCase(); }
function time(raw: string | null): string | null {
  if (!raw || raw.length > 22 || !/^\d+$/.test(raw)) return null;
  const ms = BigInt(raw) / BigInt(1000000);
  if (ms > BigInt(8640000000000000)) return null;
  return new Date(Number(ms)).toISOString();
}
export function normalizeTransactionEvidence(raw: unknown, hash: string): TransactionEvidence {
  if (!transactionHash(hash)) throw new Error('Unsupported transaction hash.');
  const body = record(raw);
  if (!body || !Array.isArray(body.actions)) throw new Error('Indexer response has no actions array.');
  const warnings: string[] = [];
  if (body.actions.length > 5) warnings.push('Additional indexed actions were omitted by the five-action pilot limit.');
  const actions = body.actions.slice(0, 5).map((value): TransactionEvidenceAction => {
    const item = record(value);
    if (!item) throw new Error('Indexer action is malformed.');
    const matches = [item.in, item.out].some(list => Array.isArray(list) && list.some(transfer => sameHash(record(transfer)?.txID, hash)));
    if (!matches) throw new Error('Indexer returned an action unrelated to the requested hash.');
    const partial: string[] = [];
    function coins(value: unknown): TransactionEvidenceCoin[] | null {
      if (!Array.isArray(value)) { partial.push('Coin or network-fee list was not supplied.'); return null; }
      if (value.length > 8) partial.push('Additional coins or fees were omitted by the eight-entry limit.');
      return value.slice(0, 8).map(coin => {
        const row = record(coin); const asset = text(row?.asset); const amount = unsigned(row?.amount);
        if (asset === null || amount === null) partial.push('A coin asset or exact base-unit amount is unavailable.');
        return { asset, amount };
      });
    }
    function transfers(value: unknown): TransactionEvidenceTransfer[] | null {
      if (!Array.isArray(value)) { partial.push('An inbound or outbound list was not supplied.'); return null; }
      if (value.length > 8) partial.push('Additional transfers were omitted by the eight-entry limit.');
      return value.slice(0, 8).map(transfer => { const row = record(transfer); return { txID: text(row?.txID, 128), height: unsigned(row?.height, 20), coins: coins(row?.coins) }; });
    }
    const type = text(item.type, 32); const status = text(item.status, 32);
    const rawDate = text(item.date, 32); const observedAt = time(rawDate); const height = unsigned(item.height, 20);
    if (!type || !status || !height || !observedAt) partial.push('Type, status, THORChain index height or indexer nanosecond date is unavailable.');
    const metadata = record(item.metadata); const detail = type ? record(metadata?.[type]) : null;
    const memo = text(detail?.memo, 1024); const reason = text(detail?.reason, 512);
    const inputs = transfers(item.in); const outputs = transfers(item.out);
    const fees = detail?.networkFees === undefined ? null : coins(detail.networkFees);
    return { type, status, rawDate, observedAt, height, memo, reason, inputs, outputs, fees, warnings: [...new Set(partial)] };
  });
  return { hash, actions, count: unsigned(body.count, 20), warnings };
}
