'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import MidgardAPI, { MIDGARD_ENDPOINTS } from '@/lib/api/midgard';
import { decodeMemo } from '@/lib/memo-decoder';
import { transactionHash } from '@/lib/transaction-evidence';
import type { LiveDataResult, NetworkStatus, TransactionEvidence, TransactionEvidenceTransfer, TransactionEvidenceCoin } from '@/lib/types';
import { SourceMetaLink, SourceMetaDetails } from '@/components/ui/SourceMetaDisclosure';

function Coins({ rows }: { rows: TransactionEvidenceCoin[] | null }) {
  if (!rows) return <p>Amounts unavailable.</p>;
  if (!rows.length) return <p>No coins reported in this list.</p>;
  return <ul className="list-disc pl-5">{rows.map((coin, i) => <li key={i}>{coin.amount ?? 'Unavailable'} {coin.asset ?? 'asset unavailable'} — raw Midgard base units (1e8 per asset unit)</li>)}</ul>;
}
function Transfers({ rows }: { rows: TransactionEvidenceTransfer[] | null }) {
  if (!rows) return <p>Transfer list unavailable.</p>;
  if (!rows.length) return <p>No transfers reported in this response.</p>;
  return <ol className="list-decimal space-y-2 pl-5">{rows.map((row, i) => <li key={i}><p>Indexed transaction ID: <code>{row.txID ?? 'Unavailable'}</code></p><p>THORChain outbound index height: {row.height ?? 'Not supplied'}. This is not a destination-chain block confirmation.</p><Coins rows={row.coins} /></li>)}</ol>;
}
function MemoInterpretation({ memo }: { memo: string | null }) {
  if (memo === null) return <p>Parsed interpretation unavailable because this action did not supply a memo.</p>;
  const decoded = decodeMemo(memo);
  return <details className="mt-2 rounded border border-border p-2"><summary className="cursor-pointer">Parsed memo interpretation ({decoded.status})</summary><p>{decoded.message}</p><dl>{decoded.fields.map(field => <div key={field.id} className="mt-2"><dt className="font-semibold">{field.label}</dt><dd><code>{field.raw || '(omitted)'}</code> — {field.interpretation}</dd></div>)}</dl><p>Rules reviewed against THORNode v3.20.3. No current or historical keeper state, name resolution or dynamic-fee validation is performed.</p></details>;
}
export function TransactionEvidenceTriage({ current }: { current?: LiveDataResult<NetworkStatus> }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<LiveDataResult<TransactionEvidence>>();
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  useEffect(() => () => request.current?.abort(), []);
  function clear() { request.current?.abort(); request.current = null; setResult(undefined); setBusy(false); setNotice(''); }
  async function lookup() {
    const hash = transactionHash(input);
    if (!hash) { setNotice('Enter one 32-byte hexadecimal transaction hash, optionally prefixed with 0x. URLs and other hash formats are not supported by this pilot.'); return; }
    clear(); const controller = new AbortController(); request.current = controller; setBusy(true); setNotice('Reading indexer evidence…');
    const next = await MidgardAPI.getTransactionEvidence(hash, controller.signal);
    if (request.current !== controller || controller.signal.aborted) return;
    setResult(next); setBusy(false); setNotice(next.status === 'ok' ? 'Indexer response loaded. Settlement remains unverified.' : 'Indexer evidence unavailable; transaction state remains unknown.');
  }
  return <details id="transaction-evidence" className="mb-8 min-w-0 scroll-mt-24 rounded border border-border bg-surface-elevated p-4 [overflow-wrap:anywhere]">
    <summary className="cursor-pointer font-semibold">Investigate one transaction</summary>
    <p className="mt-3 text-sm text-slate-300">This read-only pilot sends the public hash you submit to Liquify Midgard, then THORChain Midgard if the first read fails. Those providers receive the hash and your network request. Nothing is submitted before you choose Look up transaction. The wiki does not store the hash in the URL or local storage.</p>
    <ul className="mt-2 text-sm">{MIDGARD_ENDPOINTS.map(source => <li key={source.url}>{source.label}: <a href={source.url + '/actions'} target="_blank" rel="noopener noreferrer" className="text-accent underline">{source.url}/actions</a> (txid filter, limit 5)</li>)}</ul>
    <form className="mt-3 flex min-w-0 flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); void lookup(); }}>
      <label className="min-w-0 flex-1">Public transaction hash<input value={input} onChange={event => { clear(); setInput(event.target.value); }} maxLength={66} disabled={!hydrated} autoComplete="off" spellCheck={false} className="mt-1 block w-full min-w-0 rounded border border-border bg-surface p-2" /></label>
      <button type="submit" disabled={!hydrated || busy} className="rounded border border-border px-3 py-2 text-accent disabled:opacity-50">Look up transaction</button>
      <button type="button" onClick={() => { clear(); setInput(''); }} disabled={!hydrated} className="px-3 py-2 text-accent underline">Clear lookup</button>
    </form>
    <p role="status" className="mt-2 text-sm">{notice}</p>
    {result && <div className="mt-4 space-y-3 text-sm">
      <p className="text-slate-300">Recorded indexer check time: {result.checkedAt ?? 'Unavailable'}. Source status: {result.status === 'ok' ? 'Response received; indexed evidence only' : 'Unavailable'}.</p>
      <ul>{(result.sources ?? (result.source ? [result.source] : [])).map(source => <li key={source.url}><SourceMetaLink source={source}>{source.label}</SourceMetaLink> <SourceMetaDetails source={source} /></li>)}</ul>
      <p>This is a retained indexer response, not an automatically refreshed transaction state. Look up again for a new read.</p>
      {result.data && <>
        <p>Lookup hash: <code>{result.data.hash}</code>. Up to five related indexed actions; this is not a complete history.</p>
        {!result.data.actions.length && <p>No indexed actions in this response. This does not prove that the transaction never existed or that processing failed.</p>}
        {result.data.warnings.map(warning => <p key={warning} className="text-amber-300">{warning}</p>)}
        <ol className="space-y-5">{result.data.actions.map((action, i) => <li key={i} className="min-w-0 rounded border border-border p-3">
          <h3 className="font-semibold">Indexed action {i + 1}: {action.type ?? 'type unavailable'} — {action.status ?? 'status unavailable'}</h3>
          <p>Indexer event: {action.observedAt ?? 'Time unavailable'}; raw date {action.rawDate ?? 'unavailable'} nanoseconds since Unix epoch. Sub-millisecond precision remains in the raw field.</p>
          <p>THORChain index height: {action.height ?? 'Unavailable'}.</p>
          <h4 className="mt-2 font-semibold">Source-chain confirmation: unknown</h4><p>No independent source-chain receipt is fetched by this pilot.</p>
          <h4 className="mt-2 font-semibold">THORChain processing: provider report</h4><p>Midgard reports {action.status ?? 'unknown'} for this indexed action. It is not an independent consensus or settlement check.</p>
          <h4 className="mt-2 font-semibold">Indexed inbound observations</h4><Transfers rows={action.inputs} />
          <h4 className="mt-2 font-semibold">Indexed outbound observations</h4><Transfers rows={action.outputs} />
          <h4 className="mt-2 font-semibold">Destination settlement: unknown</h4><p>An indexed outbound ID, success status or zero-value native/internal ID does not independently establish destination-chain inclusion or recipient receipt.</p>
          <h4 className="mt-2 font-semibold">Raw memo</h4><p><code>{action.memo ?? 'Memo unavailable in this action metadata.'}</code></p>
          <p>Parsed interpretation is separate from the provider record; a memo does not establish execution.</p><MemoInterpretation memo={action.memo} />
          {action.reason && <p>Provider reason: {action.reason}. This is the recorded reason, not a diagnosis from today’s halt flags.</p>}
          <h4 className="mt-2 font-semibold">Reported network fees</h4><Coins rows={action.fees} />
          <p>Other fee fields are not normalized by this pilot; their units and completeness are not inferred.</p>
          {action.warnings.map(warning => <p key={warning} className="text-amber-300">Partial evidence: {warning}</p>)}
        </li>)}</ol>
      </>}
    </div>}
    <p className="mt-3 text-sm text-slate-300">Current operation context was checked at {current?.checkedAt ?? 'an unavailable time'}. These present controls cannot explain an earlier indexed transaction. No automatic cause, recovery promise or send instruction is inferred.</p>
    <p className="mt-2 text-sm"><a href="/deep-dives/streaming-swaps-refunds" className="text-accent underline">Read the swap and refund evidence guide</a> · <a href="https://gitlab.com/thorchain/midgard/-/blob/fa490034b043b17df8bb8d4d2e30a16b9abe5ab4/openapi/openapi.yaml" target="_blank" rel="noopener noreferrer" className="text-accent underline">Reviewed Midgard action contract</a></p>
  </details>;
}
