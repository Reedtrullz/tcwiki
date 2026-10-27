import Link from 'next/link';
import { SWAP_EVIDENCE_MAP_RECORD } from '@/lib/data/static';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';

export function SwapEvidenceMap() {
  const record = SWAP_EVIDENCE_MAP_RECORD;
  return <figure aria-label="Swap execution and evidence map" className="not-prose my-6 rounded-lg border border-border bg-surface-elevated p-4">
    <figcaption className="text-sm text-slate-300">{record.data.limitation}</figcaption>
    <ol className="mt-4 space-y-3" aria-label="Evidence stages in reading order">
      {record.data.stages.map((stage, index) => <li key={stage.id} className="min-w-0">
        {index > 0 && <p aria-hidden="true" className="mb-2 text-center text-accent">↓ check the next evidence boundary</p>}
        <div className="rounded border border-border bg-surface p-3 text-sm">
          <p className="font-semibold text-slate-100">{stage.label}</p>
          <p className="mt-1 text-slate-300">{stage.evidence}</p>
          <p className="mt-1 text-amber-200">{stage.boundary}</p>
          <Link href={stage.href} className="mt-2 inline-block text-accent underline">Read the stage explanation</Link>
        </div>
      </li>)}
    </ol>
    <div className="mt-4"><FreshnessMeta freshness={record.freshness} sources={record.sources} /></div>
  </figure>;
}
