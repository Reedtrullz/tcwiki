import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { DEEP_DIVE_ENTRIES, DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';

export const metadata = createRouteMetadata({
  title: 'THORChain Deep Dives | THORChain Wiki',
  description: 'Long-form source-backed explainers for CLP, Bifrost, TSS, churning, slashing, RUNE settlement, and historical Savers/Lending.',
  path: '/deep-dives',
});

const entry = getContentEntry('deep-dives');

export default function DeepDivesIndex() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Dives</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        In-depth explanations of core THORChain concepts and mechanisms.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Finding long-form explainers for CLP, Bifrost, TSS, churning, slashing, RUNE settlement, and historical THORFi topics.',
          'Comparing confidence and review dates before reading a deeper article.',
        ]}
        verifyBeforeClaiming={[
          'Current protocol constants, live Mimir state, active incident status, or current product availability.',
          'That older explanatory articles reflect every current implementation detail.',
        ]}
      />

      <section id="deep-dive-reader-paths" className="mb-12 scroll-mt-24">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">Reader Paths</h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-400">
          Pick a path by the claim or question you are trying to understand. Each path keeps current-state checks separate from explanatory articles.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {DEEP_DIVE_READER_PATHS.map((path) => {
            const pathEntries = path.entryIds.map((entryId) => getContentEntry(entryId));

            return (
              <article
                key={path.id}
                id={`deep-dive-path-${path.id}`}
                className="scroll-mt-24 rounded-lg border border-border bg-surface-elevated p-5"
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant={getConfidenceTone(path.confidence)}>{getConfidenceLabel(path.confidence)}</Badge>
                      <Badge variant="info">Reader path</Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-100">{path.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{path.audience}</p>
                  </div>
                  <FreshnessMeta
                    freshness={{
                      checkedAt: path.reviewedAt,
                      confidence: path.confidence,
                      nextReviewDue: path.nextReviewDue,
                    }}
                    sources={path.sources}
                    compact
                  />
                </div>
                <p className="mb-4 text-sm leading-relaxed text-slate-300">{path.description}</p>
                <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Read In Order</p>
                    <ol className="space-y-2 text-sm">
                      {pathEntries.map((pathEntry, index) => (
                        <li key={pathEntry.id} className="flex gap-2">
                          <span className="mt-0.5 text-xs tabular-nums text-slate-500">{index + 1}.</span>
                          <Link href={pathEntry.href} className="text-slate-300 underline-offset-4 hover:text-accent hover:underline">
                            {pathEntry.title}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verify Before Claiming</p>
                    <ul className="space-y-2 text-xs leading-relaxed text-slate-400">
                      {path.verifyBeforeClaiming.map((claim) => (
                        <li key={claim}>{claim}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Then Check</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {path.followUpLinks.map((followUp) => (
                      <Link
                        key={followUp.href}
                        href={followUp.href}
                        className="rounded-md border border-border bg-surface px-3 py-2 text-xs transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      >
                        <span className="font-semibold text-slate-200">{followUp.label}</span>
                        <span className="mt-1 block leading-relaxed text-slate-400">{followUp.description}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">All Deep Dives</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEEP_DIVE_ENTRIES.map((dive) => (
          <Link
            key={dive.id}
            href={dive.href}
            className="block p-6 rounded-lg bg-surface-elevated border border-border hover:border-accent/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold group-hover:text-accent transition-colors">{dive.title}</h3>
              <Badge variant={getConfidenceTone(dive.confidence)}>
                {getConfidenceLabel(dive.confidence)}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">{dive.description}</p>
            <p className="mt-3 text-[11px] text-slate-400">Reviewed {dive.reviewedAt} · Review due {dive.nextReviewDue} · Sources: {dive.sources.map((source) => source.label).join(', ')}</p>
            <div className="mt-4 text-xs text-accent group-hover:underline">Read deep dive →</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-sm text-slate-400">
        More deep dives coming soon. Interested in contributing? See the <Link href="https://github.com/Reedtrullz/tcwiki" className="underline hover:text-accent">GitHub repo</Link>.
      </div>
    </PageContainer>
  );
}
