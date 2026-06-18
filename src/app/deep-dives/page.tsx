import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { DEEP_DIVE_ENTRIES } from '@/lib/content/registry';

export default function DeepDivesIndex() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Dives</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        In-depth explanations of core THORChain concepts and mechanisms.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEEP_DIVE_ENTRIES.map((dive) => (
          <Link
            key={dive.id}
            href={dive.href}
            className="block p-6 rounded-lg bg-surface-elevated border border-border hover:border-accent/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{dive.title}</h3>
              <span className="text-[11px] text-slate-500">{dive.reviewedAt}</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{dive.description}</p>
            <p className="mt-3 text-[11px] text-slate-600">Sources: {dive.sources.map((source) => source.label).join(', ')}</p>
            <div className="mt-4 text-xs text-accent group-hover:underline">Read deep dive →</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-sm text-slate-500">
        More deep dives coming soon. Interested in contributing? See the <Link href="https://github.com/Reedtrullz/tcwiki" className="underline hover:text-accent">GitHub repo</Link>.
      </div>
    </PageContainer>
  );
}
