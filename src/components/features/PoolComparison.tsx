'use client';

import { useState, useSyncExternalStore } from 'react';
import { derivePoolComparison, normalizePoolComparison, type StatsPoolRow } from '@/lib/stats-dashboard';
import { EXPLORER_QUERY_EVENT, replaceExplorerUrl } from '@/lib/explorer-url';
import type { LiveDataResult, MidgardHealth, MidgardPoolPeriod, Pool } from '@/lib/types';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

function subscribeComparison(onChange: () => void) {
  window.addEventListener('popstate', onChange);
  window.addEventListener('pageshow', onChange);
  window.addEventListener(EXPLORER_QUERY_EVENT, onChange);
  return () => { window.removeEventListener('popstate', onChange); window.removeEventListener('pageshow', onChange); window.removeEventListener(EXPLORER_QUERY_EVENT, onChange); };
}

export function PoolComparison({ rows, period, result, health }: {
  rows: StatsPoolRow[];
  period: MidgardPoolPeriod;
  result?: LiveDataResult<Pool[]>;
  health?: LiveDataResult<MidgardHealth>;
}) {
  const search = useSyncExternalStore(subscribeComparison, () => window.location.search, () => '');
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const selected = normalizePoolComparison(new URLSearchParams(search));
  const compared = derivePoolComparison(rows, selected);
  const assets = [...new Set(rows.map(row => row.asset))].sort();
  const [candidate, setCandidate] = useState('');
  function update(next: string[]) {
    const params = new URLSearchParams(window.location.search);
    params.delete('compare_pool');
    for (const asset of next) params.append('compare_pool', asset);
    replaceExplorerUrl(`/stats?${params}#available-pools`, ['compare_pool']);
  }
  const canAdd = hydrated && selected.length < 3 && assets.includes(candidate) && !selected.includes(candidate);
  return <section aria-label="Compare loaded pools" className="mt-6 min-w-0 rounded border border-border p-4">
    <h3 className="text-lg font-semibold">Compare loaded pools</h3>
    <p className="mt-2 text-sm text-slate-300">Select up to three of the {rows.length} loaded Midgard available-pool rows ({assets.length} distinct assets). Comparison uses this same snapshot; it adds no pool-detail request. Missing or duplicate rows remain unavailable.</p>
    <p className="mt-2 text-sm text-slate-400">Requested rate window: {period}. annualPercentageRate and poolAPY retain their separate provider fields; neither is a future return or inferred compounding rate. Depth and liquidity are snapshot values; volume24h is the provider&apos;s 24h RUNE volume field, separate from that requested rate window and the completed UTC-day leaderboard.</p>
    <div className="mt-3 flex min-w-0 flex-wrap items-end gap-2">
      <div className="min-w-0 max-w-full text-sm">
        <label htmlFor="comparison-pool-choice">Add a loaded pool</label>
        <select id="comparison-pool-choice" value={candidate} onChange={event => setCandidate(event.target.value)} disabled={!hydrated || selected.length === 3} className="mt-1 block w-full min-w-0 max-w-full rounded border border-border bg-surface p-2">
          <option value="">Choose a pool</option>
          {assets.filter(asset => !selected.includes(asset)).map(asset => <option key={asset} value={asset}>{asset}</option>)}
        </select>
      </div>
      <button type="button" disabled={!canAdd} onClick={() => { update([...selected, candidate]); setCandidate(''); }} className="rounded border border-border px-3 py-2 text-sm text-accent disabled:opacity-50">Add to comparison</button>
    </div>
    <ul className="mt-3 space-y-2" aria-label="Selected comparison pools">
      {selected.map(asset => <li key={asset} className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="break-all">{asset}</span>
        <button type="button" disabled={!hydrated} onClick={() => update(selected.filter(item => item !== asset))} className="text-accent underline disabled:opacity-50" aria-label={`Remove ${asset} from comparison`}>Remove</button>
      </li>)}
    </ul>
    {compared.length ? <div className="mt-4 max-w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Pool comparison table scroll area">
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left text-slate-300">Same-snapshot pool comparison · rate window {period} · source-qualified values</caption>
        <thead><tr><th scope="col" className="p-2">Metric and basis</th>{compared.map(item => <th key={item.asset} scope="col" className="min-w-24 break-all p-2">{item.asset}</th>)}</tr></thead>
        <tbody>
          <tr><th scope="row" className="p-2">Loaded row</th>{compared.map(item => <td key={item.asset} className="p-2">{item.row?.status ?? item.reason}</td>)}</tr>
          {([
            ['RUNE depth (snapshot)', 'runeDepthLabel'],
            ['Liquidity USD (snapshot)', 'liquidityUsdLabel'],
            ['Provider volume24h (RUNE)', 'volume24hRuneLabel'],
            [`annualPercentageRate (${period} window)`, 'annualPercentageRateLabel'],
            [`poolAPY (${period} window)`, 'poolAPYLabel'],
          ] as const).map(([label, key]) => <tr key={key} className="border-t border-border"><th scope="row" className="p-2">{label}</th>{compared.map(item => <td key={item.asset} className="p-2">{item.row ? item.row[key] : 'Unavailable'}</td>)}</tr>)}
        </tbody>
      </table>
    </div> : <p className="mt-3 text-sm text-slate-400">No pools selected. Choose from the loaded snapshot; no metric is filled from another provider.</p>}
    <p className="mt-3 text-sm text-amber-200">Loaded pool status and rates do not prove route availability, future yield or settlement.</p>
    <div className="mt-3"><LiveSourceMeta result={result} healthResult={health} /></div>
  </section>;
}
