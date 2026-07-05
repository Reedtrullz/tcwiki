import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { DEEP_DIVE_ENTRIES, DEEP_DIVE_READER_PATHS, DEEP_DIVE_TOC, getContentEntry } from '@/lib/content/registry';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';

interface DeepDiveShellProps {
  entryId: string;
  editPath: string;
  children: ReactNode;
}

const repoUrl = 'https://github.com/Reedtrullz/tcwiki';
const defaultCurrentStateBoundary = 'Current protocol constants, live Mimir state, chain availability, quote execution, or product status.';

function uniqueItems(items: string[], limit: number) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      unique.push(item);
    }
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}

function getArticleUseCases(
  title: string,
  confidence: string,
  readerPaths: typeof DEEP_DIVE_READER_PATHS,
) {
  const baseUseCase = confidence === 'historical'
    ? `Historical context for ${title}; not current product instructions.`
    : `Curated explanation of ${title} mechanics and terminology.`;
  const pathUseCase = readerPaths.length > 0
    ? `Following the ${readerPaths.map((path) => path.title).join(' or ')} reader path.`
    : 'Preparing questions before checking live diagnostics or official docs.';

  return [baseUseCase, pathUseCase];
}

function getArticleClaimBoundaries(
  confidence: string,
  readerPaths: typeof DEEP_DIVE_READER_PATHS,
) {
  const historicalBoundary = confidence === 'historical'
    ? ['Current product availability, user-action instructions, or recovery completion claims.']
    : [];
  const readerPathBoundaries = readerPaths.flatMap((path) => path.verifyBeforeClaiming);

  return uniqueItems([
    ...historicalBoundary,
    ...readerPathBoundaries,
    defaultCurrentStateBoundary,
  ], 4);
}

export function DeepDiveShell({ entryId, editPath, children }: DeepDiveShellProps) {
  const entry = getContentEntry(entryId);

  const editUrl = `${repoUrl}/edit/main/${editPath}`;
  const toc = DEEP_DIVE_TOC[entryId] ?? [];
  const currentIndex = DEEP_DIVE_ENTRIES.findIndex((candidate) => candidate.id === entryId);
  const previous = currentIndex > 0 ? DEEP_DIVE_ENTRIES[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < DEEP_DIVE_ENTRIES.length - 1 ? DEEP_DIVE_ENTRIES[currentIndex + 1] : undefined;
  const readerPaths = DEEP_DIVE_READER_PATHS.filter((path) => path.entryIds.includes(entryId));
  const articleUseCases = getArticleUseCases(entry.title, entry.confidence, readerPaths);
  const articleClaimBoundaries = getArticleClaimBoundaries(entry.confidence, readerPaths);
  const related = DEEP_DIVE_ENTRIES
    .filter((candidate) => candidate.id !== entryId)
    .map((candidate) => ({
      entry: candidate,
      score: candidate.tags.filter((tag) => entry.tags.includes(tag)).length,
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 3);

  return (
    <PageContainer maxWidth="narrow">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/deep-dives" className="text-sm text-slate-400 hover:text-accent transition-colors">
          ← All Deep Dives
        </Link>
        <a
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-accent transition-colors"
        >
          Edit this page on GitHub →
        </a>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-surface-elevated/60 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
          <Badge variant="info">Deep Dive</Badge>
          <FreshnessMeta
            freshness={{
              checkedAt: entry.reviewedAt,
              confidence: entry.confidence,
              nextReviewDue: entry.nextReviewDue,
            }}
            sources={entry.sources}
            compact
          />
        </div>
        <p className="mt-2 text-sm text-slate-400">{entry.description}</p>
        <div className="mt-3 grid gap-2 border-t border-border pt-3 text-xs leading-relaxed text-slate-300 md:grid-cols-2">
          <p>
            <span className="font-semibold text-emerald-300">Use This Article For: </span>
            {articleUseCases[0]}
          </p>
          <p>
            <span className="font-semibold text-amber-300">Verify Elsewhere Before Claiming: </span>
            {articleClaimBoundaries[0]}
          </p>
        </div>
      </div>

      {toc.length > 0 && (
        <nav aria-label="Table of contents" className="mb-6 rounded-lg border border-border bg-surface-elevated/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Table of Contents</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {toc.map((item) => (
              <a key={item.href} href={item.href} className="rounded border border-border px-2 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100">
                {item.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      <article className="prose prose-invert prose-slate max-w-none prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-p:text-slate-300 prose-li:text-slate-300">
        {children}
      </article>

      <div className="mt-12 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/glossary" className="rounded border border-border px-2 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100">
            Glossary
          </Link>
          {entry.tags.map((tag) => (
            <span key={tag} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-400">
              {tag}
            </span>
          ))}
        </div>

        {readerPaths.length > 0 && (
          <section aria-labelledby="article-reader-paths" className="mt-6 rounded-lg border border-border bg-surface-elevated/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="article-reader-paths" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Reader Paths For This Article
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Use these paths to connect this explainer with the current-state checks needed before making live protocol claims.
                </p>
              </div>
              <Link href="/deep-dives#deep-dive-reader-paths" className="text-xs font-semibold text-accent underline-offset-4 hover:underline">
                View all paths
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {readerPaths.map((path) => (
                <div key={path.id} className="rounded-md border border-border bg-surface p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link
                        href={`/deep-dives#deep-dive-path-${path.id}`}
                        className="font-semibold text-slate-200 underline-offset-4 hover:text-accent hover:underline"
                      >
                        {path.title}
                      </Link>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{path.audience}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getConfidenceTone(path.confidence)}>{getConfidenceLabel(path.confidence)}</Badge>
                      <span className="text-[11px] text-slate-500">Reviewed {path.reviewedAt}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.85fr)]">
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Verify Before Claiming</p>
                      <ul className="space-y-1 text-xs leading-relaxed text-slate-400">
                        {path.verifyBeforeClaiming.map((claim) => (
                          <li key={claim}>{claim}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Then Check</p>
                      <div className="flex flex-wrap gap-2">
                        {path.followUpLinks.map((followUp) => (
                          <Link
                            key={followUp.href}
                            href={followUp.href}
                            className="rounded border border-border px-2 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100"
                          >
                            {followUp.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(previous || next) && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {previous ? (
              <Link href={previous.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">Previous</span>
                <span className="mt-1 block font-semibold text-slate-300">{previous.title}</span>
              </Link>
            ) : <div />}
            {next && (
              <Link href={next.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30 sm:text-right">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">Next</span>
                <span className="mt-1 block font-semibold text-slate-300">{next.title}</span>
              </Link>
            )}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Related Reading</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {related.map(({ entry: relatedEntry }) => (
                <Link key={relatedEntry.id} href={relatedEntry.href} className="rounded-lg border border-border bg-surface-elevated p-3 text-sm hover:border-accent/30">
                  <span className="font-semibold text-slate-300">{relatedEntry.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-400">{relatedEntry.description}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
