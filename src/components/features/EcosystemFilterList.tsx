'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Chain, EcosystemProject, SourcedRecord } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import { recordAnchor } from '@/lib/utils';

interface EcosystemFilterListProps {
  projectRecords: SourcedRecord<EcosystemProject>[];
  chainRecords: SourcedRecord<Chain>[];
}

const ALL = 'all';

function uniqueSorted<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function EcosystemFilterList({ projectRecords, chainRecords }: EcosystemFilterListProps) {
  const [category, setCategory] = useState(ALL);
  const [chain, setChain] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [confidence, setConfidence] = useState(ALL);

  const categories = useMemo(() => uniqueSorted(projectRecords.map((record) => record.data.category)), [projectRecords]);
  const chains = useMemo(() => uniqueSorted(projectRecords.flatMap((record) => record.data.chains)), [projectRecords]);
  const statuses = useMemo(() => uniqueSorted(projectRecords.map((record) => record.data.status)), [projectRecords]);
  const confidences = useMemo(() => uniqueSorted(projectRecords.map((record) => record.freshness.confidence)), [projectRecords]);

  const filteredProjects = projectRecords.filter((record) => {
    const project = record.data;
    return (category === ALL || project.category === category) &&
      (chain === ALL || project.chains.includes(chain)) &&
      (status === ALL || project.status === status) &&
      (confidence === ALL || record.freshness.confidence === confidence);
  });

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-border bg-surface-elevated p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-400">
          Category
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200">
            <option value={ALL}>All categories</option>
            {categories.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Chain
          <select value={chain} onChange={(event) => setChain(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200">
            <option value={ALL}>All chains</option>
            {chains.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200">
            <option value={ALL}>All statuses</option>
            {statuses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="text-xs text-slate-400">
          Confidence
          <select value={confidence} onChange={(event) => setConfidence(event.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-2 text-sm text-slate-200">
            <option value={ALL}>All confidence levels</option>
            {confidences.map((option) => <option key={option} value={option}>{getConfidenceLabel(option)}</option>)}
          </select>
        </label>
      </div>

      <p aria-live="polite" className="mb-4 text-sm text-slate-400">
        Showing {filteredProjects.length} of {projectRecords.length} curated ecosystem entries. Listings are references, not endorsements or availability guarantees.
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {filteredProjects.map((record) => {
          const project = record.data;
          return (
            <div
              key={project.id}
              id={recordAnchor('ecosystem', project.id)}
              className="scroll-mt-24 p-4 rounded-lg bg-surface-elevated border border-border transition-colors"
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <h3 className="text-sm font-medium">{project.name}</h3>
                <div className="flex flex-wrap justify-end gap-1">
                  <Badge variant="info">Listed {project.status}</Badge>
                  <Badge variant={getConfidenceTone(record.freshness.confidence)}>{getConfidenceLabel(record.freshness.confidence)}</Badge>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{project.description}</p>
              <div className="mb-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Use for</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-400">
                    {project.useFor.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Check before use</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-400">
                    {project.verifyBeforeUse.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {project.chains.slice(0, 8).map((chainCode) => (
                  <span key={chainCode} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{chainCode}</span>
                ))}
                {project.chains.length > 8 && <span className="text-[10px] text-slate-400">+{project.chains.length - 8}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:text-accent/80 transition-colors"
                >
                  Open project
                </a>
                <Link href="/network#network-diagnostics" className="text-xs text-slate-400 transition-colors hover:text-slate-200">
                  Live status
                </Link>
                <Link href="/docs#third-party-interfaces-wallets" className="text-xs text-slate-400 transition-colors hover:text-slate-200">
                  Source map
                </Link>
                <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-12">Curated Chain List ({chainRecords.length})</h2>
      <p className="text-sm text-slate-400 mb-4">
        Use this list as a source-backed index, not as proof that swaps or LP actions are currently open.
        {' '}
        <Link href="/network#network-diagnostics" className="text-accent transition-colors hover:text-accent/80">
          Check live diagnostics
        </Link>
        {' '}for current availability.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {chainRecords.map((record) => {
          const chainData = record.data;
          return (
            <div key={chainData.chain} className="p-3 rounded-lg bg-surface-elevated border border-border text-center">
              <p className="text-sm font-medium">{chainData.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{chainData.chain}</p>
              {chainData.statusNote && (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{chainData.statusNote}</p>
              )}
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
          );
        })}
      </div>
    </div>
  );
}
