'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ResponsiveVisibility } from '@/components/ui/ResponsiveVisibility';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  type DynamicL1FeeCurrentAccumulator,
  type DynamicL1FeeRecord,
  type DynamicL1FeeStatus,
} from '@/lib/types';
import {
  type DynamicFeeBpsFilter,
  type DynamicFeeCurrentFilter,
  type DynamicFeeRecordFilterState,
  type DynamicFeeWhitelistFilter,
  EMPTY_DYNAMIC_FEE_RECORDS,
  activeRecordFilterLabels,
  defaultRecordFilters,
  filterDynamicFeeRecords,
  formatBps,
  formatEpoch,
  formatTor,
  recordKey,
  whitelistBadge,
} from '@/lib/data/dynamic-fees-helpers';

function DynamicFeeRow({
  record,
  current,
}: {
  record: DynamicL1FeeRecord;
  current?: DynamicL1FeeCurrentAccumulator;
}) {
  const badge = whitelistBadge(record.whitelistState);

  return (
    <tr className="border-t border-border">
      <td className="py-3 pr-4 font-mono text-xs text-accent">{record.thorname}</td>
      <td className="py-3 pr-4 text-xs text-slate-300">{record.pair}</td>
      <td className="py-3 pr-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
      <td className="py-3 pr-4 text-sm font-semibold">{formatBps(record.dynamicBps)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatEpoch(record.lastActiveEpoch)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTor(record.latestFeesTorBaseUnits)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTor(current?.feesTorBaseUnits)}</td>
      <td className="py-3 pr-4 text-xs text-slate-400">{formatTor(current?.volumeTorBaseUnits)}</td>
    </tr>
  );
}

function DynamicFeeMobileCard({
  record,
  current,
}: {
  record: DynamicL1FeeRecord;
  current?: DynamicL1FeeCurrentAccumulator;
}) {
  const badge = whitelistBadge(record.whitelistState);

  return (
    <Card className="min-w-0" padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-accent">{record.thorname}</p>
          <p className="mt-1 break-words text-xs text-slate-300">{record.pair}</p>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">Dynamic floor</dt>
          <dd className="font-semibold">{formatBps(record.dynamicBps)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Last epoch</dt>
          <dd>{formatEpoch(record.lastActiveEpoch)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Sealed fees</dt>
          <dd>{formatTor(record.latestFeesTorBaseUnits)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current fees</dt>
          <dd>{formatTor(current?.feesTorBaseUnits)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Current volume</dt>
          <dd>{formatTor(current?.volumeTorBaseUnits)}</dd>
        </div>
      </dl>
    </Card>
  );
}

export function DynamicFeeRecordsExplorer({
  status,
  isLoading,
  currentEntries,
  floorBps,
  ceilingBps,
}: {
  status?: DynamicL1FeeStatus;
  isLoading: boolean;
  currentEntries: Map<string, DynamicL1FeeCurrentAccumulator>;
  floorBps?: number | null;
  ceilingBps?: number | null;
}) {
  const [filters, setFilters] = useState<DynamicFeeRecordFilterState>(defaultRecordFilters);
  const records = status?.records ?? EMPTY_DYNAMIC_FEE_RECORDS;
  const filteredRecords = useMemo(
    () => filterDynamicFeeRecords(records, currentEntries, filters, floorBps, ceilingBps),
    [records, currentEntries, filters, floorBps, ceilingBps]
  );
  const activeFilters = activeRecordFilterLabels(filters);
  const hasActiveFilters = activeFilters.length > 0;
  const resetFilters = () => setFilters(defaultRecordFilters);

  return (
    <section id="dynamic-fee-records-explorer" className="mb-10 scroll-mt-24" aria-labelledby="dynamic-fee-records-heading">
      <SectionHeader id="dynamic-fee-records-heading" level="primary">Tracked Records</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm text-slate-400">
        Raw sealed records show the maintained dynamic floor for each tracked thorname and pair. Active whitelist records may apply that floor at swap time; monitor records are computed but still use the base L1 floor.
      </p>
      {isLoading && !status ? (
        <Card>
          <p className="text-sm text-slate-400">Loading dynamic fee records from THORNode...</p>
        </Card>
      ) : status && records.length > 0 ? (
        <>
          <div className="mb-4 rounded-md border border-border bg-surface-elevated p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,0.75fr))]">
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Search tracked records
                <input
                  value={filters.query}
                  onChange={(event) => {
                    const query = event.currentTarget.value;
                    setFilters((current) => ({ ...current, query }));
                  }}
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none transition focus:border-accent"
                  placeholder="thorname, pair, bps, epoch"
                  type="search"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Whitelist
                <select
                  value={filters.whitelist}
                  onChange={(event) => {
                    const whitelist = event.currentTarget.value as DynamicFeeWhitelistFilter;
                    setFilters((current) => ({ ...current, whitelist }));
                  }}
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none transition focus:border-accent"
                >
                  <option value="all">All states</option>
                  <option value="active">Active</option>
                  <option value="monitor">Monitor</option>
                  <option value="inactive">Inactive</option>
                  <option value="unparseable">Unparseable</option>
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Bps position
                <select
                  value={filters.bps}
                  onChange={(event) => {
                    const bps = event.currentTarget.value as DynamicFeeBpsFilter;
                    setFilters((current) => ({ ...current, bps }));
                  }}
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none transition focus:border-accent"
                >
                  <option value="all">All positions</option>
                  <option value="floor">At floor</option>
                  <option value="ceiling">At ceiling</option>
                  <option value="inside">Inside bounds</option>
                  <option value="unknown">Bounds unknown</option>
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Current epoch
                <select
                  value={filters.current}
                  onChange={(event) => {
                    const currentFilter = event.currentTarget.value as DynamicFeeCurrentFilter;
                    setFilters((current) => ({ ...current, current: currentFilter }));
                  }}
                  className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm normal-case tracking-normal text-slate-100 outline-none transition focus:border-accent"
                >
                  <option value="all">All records</option>
                  <option value="with-current">Has accumulator</option>
                  <option value="without-current">No current row</option>
                </select>
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={filteredRecords.length > 0 ? 'info' : 'warning'}>
                  Showing {filteredRecords.length.toLocaleString()} of {records.length.toLocaleString()}
                </Badge>
                {activeFilters.map((label) => (
                  <Badge key={label} variant="default">{label}</Badge>
                ))}
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="self-start rounded-md border border-border px-3 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10 md:self-auto"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          {filteredRecords.length > 0 ? (
            <>
              <ResponsiveVisibility mobile className="grid gap-3">
                {filteredRecords.map((record) => (
                  <DynamicFeeMobileCard
                    key={recordKey(record.thorname, record.pair)}
                    record={record}
                    current={currentEntries.get(recordKey(record.thorname, record.pair))}
                  />
                ))}
              </ResponsiveVisibility>
              <ResponsiveVisibility desktop className="overflow-x-auto rounded-lg border border-border bg-surface-elevated">
                <table className="w-full min-w-[860px] text-left">
                  <caption className="sr-only">Current dynamic L1 fee records from THORNode</caption>
                  <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th scope="col" className="py-3 pl-4 pr-4">Thorname</th>
                      <th scope="col" className="py-3 pr-4">Pair</th>
                      <th scope="col" className="py-3 pr-4">Whitelist</th>
                      <th scope="col" className="py-3 pr-4">Dynamic bps</th>
                      <th scope="col" className="py-3 pr-4">Last epoch</th>
                      <th scope="col" className="py-3 pr-4">Sealed fees</th>
                      <th scope="col" className="py-3 pr-4">Current fees</th>
                      <th scope="col" className="py-3 pr-4">Current volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record) => (
                      <DynamicFeeRow
                        key={recordKey(record.thorname, record.pair)}
                        record={record}
                        current={currentEntries.get(recordKey(record.thorname, record.pair))}
                      />
                    ))}
                  </tbody>
                </table>
              </ResponsiveVisibility>
            </>
          ) : (
            <Card>
              <p className="text-sm text-slate-400">
                No tracked records match these filters. Clear the filters before treating this as no dynamic-fee activity.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 rounded-md border border-border px-3 py-2 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent/10"
              >
                Reset filters
              </button>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-400">No sealed dynamic-fee records are available. Treat this as no live evidence, not as zero activity.</p>
        </Card>
      )}
    </section>
  );
}
