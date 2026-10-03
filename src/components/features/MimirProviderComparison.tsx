'use client';

import { useEffect, useRef, useState } from 'react';
import { collectMimirProviderComparison, compareMimirProviderSamples } from '@/lib/api/mimir-provider-comparison';
import type { MimirProviderSample } from '@/lib/types';
import { THORNODE_PROVIDER_DEFAULTS } from '../../../scripts/lib/thornode-data-policy.mjs';

export function MimirProviderComparison() {
  const [height, setHeight] = useState('');
  const [samples, setSamples] = useState<MimirProviderSample[]>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!samples.length) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const resume = () => setNow(Date.now());
    window.addEventListener('pageshow', resume); document.addEventListener('visibilitychange', resume);
    return () => { window.clearInterval(timer); window.removeEventListener('pageshow', resume); document.removeEventListener('visibilitychange', resume); };
  }, [samples]);
  async function compare() {
    const parsed = height === '' ? undefined : /^\d{1,16}$/.test(height) && Number.isSafeInteger(Number(height)) ? Number(height) : NaN;
    if (parsed !== undefined && !Number.isSafeInteger(parsed)) { setNotice('Enter a nonnegative safe integer height, or leave it empty for latest samples.'); return; }
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setPending(true); setNotice(''); setSamples([]);
    try {
      const next = await collectMimirProviderComparison(parsed, abort.signal);
      if (abort.signal.aborted) return;
      setSamples(next); setNow(Date.now()); setNotice('Recorded two independent control samples. Equality is not consensus or current availability.');
    } catch { if (!abort.signal.aborted) setNotice('Comparison unavailable. Existing diagnostics remain usable.'); }
    finally { if (!abort.signal.aborted) setPending(false); }
  }
  const comparison = compareMimirProviderSamples(samples, now);
  return <details className="mt-4 min-w-0 rounded border border-border p-3">
    <summary className="cursor-pointer font-medium">Compare two control providers manually</summary>
    <section aria-label="Two-provider control comparison" className="mt-3 min-w-0 [overflow-wrap:anywhere]">
      <p className="text-sm text-slate-300">Compare six named raw Mimir controls with two fixed public providers. This action sends one read to each provider. Missing values, response-height limits and time skew stay visible. No automatic provider comparison runs.</p>
      <ul className="mt-2 text-xs text-slate-400">{THORNODE_PROVIDER_DEFAULTS.map(source => <li key={source.url}>{source.label}: {source.url}/mimir</li>)}</ul>
      <label className="mt-3 block text-sm" htmlFor="provider-comparison-height">Optional requested THORChain height</label>
      <input id="provider-comparison-height" inputMode="numeric" maxLength={16} value={height} onChange={event => setHeight(event.target.value)} className="mt-1 block w-full min-w-0 rounded border border-border bg-surface p-2 text-sm" />
      <button type="button" disabled={pending} onClick={() => void compare()} className="mt-3 text-sm text-accent underline disabled:opacity-50">{pending ? 'Comparing control providers…' : 'Compare control providers now'}</button>
      <p role="status" className="mt-2 text-sm text-slate-400">{notice}</p>
      {samples.length > 0 && <>
        <div className="mt-3 space-y-2">{samples.map((sample, index) => <div key={sample.source.url} className="min-w-0 rounded border border-border p-2 text-xs">
          <p>{sample.source.label}: {sample.status}{comparison.stale[index] ? ' · stale retained receipt (over 30s or invalid clock)' : ' · recorded receipt'}</p>
          <p>Checked {sample.checkedAt}; collected {sample.collection.startedAt} to {sample.collection.completedAt} ({sample.collection.durationMs}ms).</p>
          <p>Requested height {sample.requestedHeight ?? 'latest'}; observed response height {sample.observedHeight ?? 'not recorded'}; pinning {sample.verification}. Block age and THORNode version were not collected by this pilot.</p>
          <p>{sample.source.url}</p>{sample.error && <p>{sample.error}</p>}
        </div>)}</div>
        <div className="mt-3 max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Provider comparison table scroll area">
          <table className="w-full text-left text-xs"><caption className="mb-2 text-left">Independent raw control observations; integers have key-specific protocol units.</caption>
            <thead><tr><th scope="col">Control</th><th scope="col">First provider</th><th scope="col">Second provider</th><th scope="col">Observation relationship</th></tr></thead>
            <tbody>{comparison.rows.map(row => <tr key={row.key} className="border-t border-border"><th scope="row" className="p-2">{row.key}</th>{row.pair.map((value, index) => <td key={index} className="p-2">{value.state === 'valid' ? `${value.raw} (normalized ${value.normalized})` : value.state}</td>)}<td className="p-2">{row.relation}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-amber-200">Different samples can reflect different heights or collection times. Only matching verified requested heights qualify a field conflict here. Neither agreement nor conflict establishes consensus, live operation availability or a historical cause.</p>
      </>}
    </section>
  </details>;
}
