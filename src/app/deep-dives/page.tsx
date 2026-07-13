import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { DEEP_DIVE_ENTRIES, DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import {
  DeepDiveLibraryExplorer,
  type DeepDiveLibraryArticle,
  type DeepDiveLibraryTopic,
} from '@/components/features/DeepDiveLibraryExplorer';
import { getDeepDiveArticleClaimBoundary, getDeepDiveArticleUseCase } from '@/lib/deep-dive-posture';

export const metadata = createRouteMetadata({
  title: 'THORChain Deep Dives | THORChain Wiki',
  description: 'Long-form source-backed explainers for live data, builder query planning, CLP, liquidity actions, RUNEPool/POL evidence, swaps and refunds, Mimir halt controls, Bifrost, TSS, churning, slashing, RUNE settlement, App Layer, and historical THORFi topics.',
  path: '/deep-dives',
});

const entry = getContentEntry('deep-dives');

const deepDiveStartingPoints = [
  {
    label: 'Learn the model',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    badge: 'start here',
    description: 'RUNE settlement, CLP, live data boundaries, Bifrost observation, and TSS vault signing.',
  },
  {
    label: 'Check live availability',
    href: '/network#network-diagnostics',
    badge: 'current state',
    description: 'Use network diagnostics before treating any article as proof that swaps, signing, LP, or app-layer actions are live.',
  },
  {
    label: 'Build or query data',
    href: '/deep-dives/build-query-data#query-plan',
    badge: 'builder',
    description: 'Endpoint choice, units, quotes, inbound addresses, source warnings, and failover posture.',
  },
  {
    label: 'Debug swaps or refunds',
    href: '/deep-dives/streaming-swaps-refunds#what-to-check-first',
    badge: 'triage',
    description: 'Fresh quote checks, memos, limits, fees, halt state, transaction evidence, and refund boundaries.',
  },
];

const deepDiveLibraryTopics: DeepDiveLibraryTopic[] = [
  {
    id: 'data-builder',
    label: 'Data & builders',
    description: 'Source-family choices, endpoint sequencing, live-data evidence boundaries, and integration query plans.',
    entryIds: ['deep-dive-midgard-thornode-data', 'deep-dive-build-query-data'],
  },
  {
    id: 'swaps-liquidity',
    label: 'Swaps & liquidity',
    description: 'Settlement, CLP, LP actions, RUNEPool/POL accounting, refunds, incentives, and fee/economic boundaries.',
    entryIds: [
      'deep-dive-rune-settlement',
      'deep-dive-clp',
      'deep-dive-liquidity-actions',
      'deep-dive-runepool-pol',
      'deep-dive-streaming-swaps-refunds',
      'deep-dive-incentive-pendulum',
    ],
  },
  {
    id: 'security-operations',
    label: 'Security & ops',
    description: 'Mimir halt controls, TSS, Bifrost observation, churning, slashing, and current-state safety boundaries.',
    entryIds: [
      'deep-dive-mimir-halt-controls',
      'deep-dive-tss',
      'deep-dive-bifrost',
      'deep-dive-churning',
      'deep-dive-slashing',
    ],
  },
  {
    id: 'apps-recovery',
    label: 'Apps & recovery',
    description: 'App Layer, secured assets, trade accounts, deprecated THORFi context, and TCY/recovery history.',
    entryIds: ['deep-dive-app-layer', 'deep-dive-tcy-recovery-timeline', 'deep-dive-savers'],
  },
];

export default function DeepDivesIndex() {
  const deepDiveArticles: DeepDiveLibraryArticle[] = DEEP_DIVE_ENTRIES.map((dive) => {
    const readerPaths = DEEP_DIVE_READER_PATHS.filter((path) => path.entryIds.includes(dive.id));

    return {
      id: dive.id,
      title: dive.title,
      href: dive.href,
      description: dive.description,
      searchText: dive.body,
      tags: dive.tags,
      confidence: dive.confidence,
      reviewedAt: dive.reviewedAt,
      nextReviewDue: dive.nextReviewDue,
      sources: dive.sources,
      useCase: getDeepDiveArticleUseCase(dive.id, dive.title, dive.confidence),
      claimBoundary: getDeepDiveArticleClaimBoundary(dive.id, dive.confidence, readerPaths),
      readerPaths: readerPaths.map((path) => ({
        title: path.title,
        href: `/deep-dives#deep-dive-path-${path.id}`,
      })),
    };
  });

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Deep Dives</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        In-depth explanations of core THORChain concepts and mechanisms.
      </p>

      <section id="deep-dive-start-here" className="mb-8 scroll-mt-24">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Look Here First</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-400">
              Pick the job before picking the article. Long-form explanations stay separate from current live evidence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <Link href="/search#search-guided-answers" className="text-slate-400 transition-colors hover:text-slate-300">
              Browse guided answers
            </Link>
            <a href="#deep-dive-library" className="text-accent transition-colors hover:text-accent/80">
              Browse article library
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {deepDiveStartingPoints.map((startingPoint) => (
            <Link
              key={startingPoint.href}
              href={startingPoint.href}
              className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant={startingPoint.badge === 'current state' ? 'warning' : 'info'}>{startingPoint.badge}</Badge>
                <span className="text-sm font-semibold text-slate-100">{startingPoint.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{startingPoint.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <RouteSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Finding long-form explainers for live-data evidence, builder query planning, CLP, liquidity actions, RUNEPool/POL evidence, swap/refund triage, Mimir halt controls, Bifrost, TSS, churning, slashing, RUNE settlement, App Layer, and historical THORFi topics.',
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

      <DeepDiveLibraryExplorer articles={deepDiveArticles} topics={deepDiveLibraryTopics} />
    </PageContainer>
  );
}
