'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { useThorchainNodeCoverage } from '@/lib/hooks/useMidgard';
import { REVIEWED_OPERATIONAL_CONTROL_SOURCE } from '@/lib/operational-controls';
import type { LiveDataResult, NetworkStats, ThorchainNodeCoverageRow } from '@/lib/types';

interface ThorNodePanelProps {
  midgardNetwork?: NetworkStats;
  midgardResult?: LiveDataResult<NetworkStats>;
}

interface ThorNodeCoverageViewProps extends ThorNodePanelProps {
  rows?: ThorchainNodeCoverageRow[];
  result?: LiveDataResult<ThorchainNodeCoverageRow[]>;
  isLoading: boolean;
  refresh: () => unknown;
}

type DistributionRow = { key: string; label: string; count: number };

const KNOWN_STATUS_LABELS = new Map([
  ['active', 'Active'],
  ['standby', 'Standby'],
  ['ready', 'Ready'],
  ['disabled', 'Disabled'],
  ['whitelisted', 'Whitelisted'],
]);

function fieldDistribution(
  rows: ThorchainNodeCoverageRow[],
  field: 'status' | 'version'
): DistributionRow[] {
  const counts = new Map<string, DistributionRow>();
  for (const row of rows) {
    const raw = row[field];
    const knownLabel = raw === undefined || field !== 'status'
      ? undefined
      : KNOWN_STATUS_LABELS.get(raw.toLowerCase());
    const label = raw === undefined ? `Missing ${field}` : knownLabel ?? raw;
    const key = raw === undefined ? 'missing' : knownLabel ? `known:${raw.toLowerCase()}` : `raw:${raw}`;
    const current = counts.get(key);
    counts.set(key, { key, label, count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()]
    .sort((left, right) => left.label.localeCompare(right.label));
}

function countStatus(rows: ThorchainNodeCoverageRow[], status: string) {
  return rows.filter((row) => row.status?.toLowerCase() === status).length;
}

function Distribution({ label, rows }: { label: string; rows: DistributionRow[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-200">{label}</h3>
      <ul className="space-y-1" aria-label={`${label} counts`}>
        {rows.map((row) => (
          <li key={row.key} className="flex items-center justify-between gap-4 text-xs">
            <span className="break-all text-slate-400">{row.label}</span>
            <span className="shrink-0 tabular-nums text-slate-200">{row.count.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThorNodeCoverageView({
  rows,
  result,
  isLoading,
  refresh,
  midgardNetwork,
  midgardResult,
}: ThorNodeCoverageViewProps) {
  const [search, setSearch] = useState('');
  const [rowLimit, setRowLimit] = useState(20);
  const statusDistribution = useMemo(() => fieldDistribution(rows ?? [], 'status'), [rows]);
  const versionDistribution = useMemo(() => fieldDistribution(rows ?? [], 'version'), [rows]);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return rows ?? [];
    return (rows ?? []).filter((row) => (
      row.nodeAddress?.toLocaleLowerCase().includes(query) ||
      row.status?.toLocaleLowerCase().includes(query) ||
      row.version?.toLocaleLowerCase().includes(query)
    ));
  }, [rows, search]);
  const visibleRows = filteredRows.slice(0, rowLimit);
  const observedVersionCount = (rows ?? []).filter((row) => row.version !== undefined).length;

  return (
    <section id="thorchain-node-coverage" className="mb-12 scroll-mt-24" aria-labelledby="thorchain-node-coverage-heading">
      <SectionHeader id="thorchain-node-coverage-heading" level="primary">THORChain node coverage</SectionHeader>
      <p className="mb-4 max-w-4xl text-sm leading-relaxed text-slate-400">
        This unpinned THORNode <code>/nodes</code> response is one retrieved sample of bonded validator node accounts returned by that endpoint, including statuses beyond Active. That account set differs from Midgard&apos;s <code>/v2/nodes</code> public-key rows and neither covers every chain account. Only node address, raw status, and raw version are shown; these fields do not establish real-world operator identity, node health, or network security.
      </p>
      <LiveSourceMeta result={result} onRefresh={refresh} />

      {isLoading && !rows && <p role="status" className="mt-3 text-sm text-slate-400">Loading THORNode node coverage…</p>}
      {!isLoading && !rows && (
        <p role="status" className="mt-3 text-sm text-amber-300">
          {result?.error ?? 'THORNode did not provide a usable node-set sample.'}
        </p>
      )}

      {rows && (
        <Card padding="sm" className="mt-4 space-y-5">
          <p className="text-sm text-slate-200">
            Rows in loaded THORNode <code>/nodes</code> response: <strong className="tabular-nums">{rows.length.toLocaleString()}</strong>. Counts below describe this response only.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Distribution label="Observed status" rows={statusDistribution} />
            <Distribution label="Observed version" rows={versionDistribution} />
            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-200">Separate Midgard summary</h3>
              {midgardNetwork ? (
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Active nodes</dt><dd className="tabular-nums text-slate-200">{midgardNetwork.activeNodeCount.toLocaleString()}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Standby nodes</dt><dd className="tabular-nums text-slate-200">{midgardNetwork.standbyNodeCount.toLocaleString()}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">Rows with observed versions</dt><dd className="tabular-nums text-slate-200">{observedVersionCount.toLocaleString()} / {rows.length.toLocaleString()}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">THORNode active rows</dt><dd className="tabular-nums text-slate-200">{countStatus(rows, 'active').toLocaleString()}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-400">THORNode standby rows</dt><dd className="tabular-nums text-slate-200">{countStatus(rows, 'standby').toLocaleString()}</dd></div>
                </dl>
              ) : (
                <p className="text-xs text-slate-400">Midgard summary counts are unavailable in this view.</p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                Midgard&apos;s <code>/v2/network</code> counts and the THORNode roster are independent samples with separate retrieval times. A difference alone does not indicate an outage.
              </p>
              <div className="mt-2"><LiveSourceMeta result={midgardResult} /></div>
            </div>
          </div>

          <p className="border-t border-border/70 pt-4 text-xs leading-relaxed text-slate-400">
            Version strings are raw observations, not proof of a node&apos;s complete build or control applicability. Existing operational-control semantics remain reviewed for THORNode {REVIEWED_OPERATIONAL_CONTROL_SOURCE.versionRange} at the linked source revision.
          </p>
          <a
            className="text-xs font-semibold text-accent underline-offset-4 hover:underline"
            href={REVIEWED_OPERATIONAL_CONTROL_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reviewed THORNode {REVIEWED_OPERATIONAL_CONTROL_SOURCE.versionRange} source
          </a>

          <details className="border-t border-border/70 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
              Browse loaded THORNode rows
            </summary>
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <label htmlFor="thorchain-node-search" className="mb-1 block text-xs font-medium text-slate-300">Search address, status, or version</label>
                  <input
                    id="thorchain-node-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  />
                </div>
                <div>
                  <label htmlFor="thorchain-node-limit" className="mb-1 block text-xs font-medium text-slate-300">Rows shown</label>
                  <select
                    id="thorchain-node-limit"
                    value={rowLimit}
                    onChange={(event) => setRowLimit(Number(event.currentTarget.value))}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
              <p aria-live="polite" className="text-xs text-slate-400">
                Showing {visibleRows.length.toLocaleString()} of {filteredRows.length.toLocaleString()} matching rows ({rows.length.toLocaleString()} loaded).
              </p>
              {visibleRows.length > 0 ? (
                <div
                  className="overflow-x-auto"
                  tabIndex={0}
                  role="region"
                  aria-label="Scrollable THORNode node rows"
                >
                  <table className="w-full min-w-[36rem] text-left text-xs">
                    <caption className="sr-only">THORNode address, status, and version rows from the loaded sample</caption>
                    <thead className="border-b border-border text-slate-300">
                      <tr><th scope="col" className="px-2 py-2">Node address</th><th scope="col" className="px-2 py-2">Status</th><th scope="col" className="px-2 py-2">Version</th></tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((row, index) => (
                        <tr key={row.nodeAddress ?? `missing-address-${index}`} className="border-b border-border/50 last:border-0">
                          <th scope="row" className="break-all px-2 py-2 font-mono font-normal text-slate-300">{row.nodeAddress ?? 'Missing address'}</th>
                          <td className="break-all px-2 py-2 text-slate-300">{row.status ?? 'Missing status'}</td>
                          <td className="break-all px-2 py-2 text-slate-300">{row.version ?? 'Missing version'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No loaded rows match this search.</p>
              )}
            </div>
          </details>
        </Card>
      )}
    </section>
  );
}

export function ThorNodePanel(props: ThorNodePanelProps) {
  const live = useThorchainNodeCoverage();
  return (
    <ThorNodeCoverageView
      {...props}
      rows={live.data}
      result={live.result}
      isLoading={live.isLoading}
      refresh={live.refresh}
    />
  );
}
