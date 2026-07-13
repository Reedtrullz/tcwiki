import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { DEEP_DIVE_ENTRIES, DEEP_DIVE_READER_PATHS, DEEP_DIVE_TOC, getContentEntry } from '@/lib/content/registry';
import { getConfidenceLabel, getConfidenceTone } from '@/lib/trust';
import { getDeepDiveArticleClaimBoundary, getDeepDiveArticleUseCase } from '@/lib/deep-dive-posture';

interface DeepDiveShellProps {
  entryId: string;
  editPath: string;
  children: ReactNode;
}

const repoUrl = 'https://github.com/Reedtrullz/tcwiki';
const defaultVerifyNowLink = {
  label: 'Current source map',
  href: '/docs#source-map-chooser',
  description: 'Pick the right source family before making live, historical, or implementation claims.',
};

export function DeepDiveShell({ entryId, editPath, children }: DeepDiveShellProps) {
  const entry = getContentEntry(entryId);

  const editUrl = `${repoUrl}/edit/main/${editPath}`;
  const toc = DEEP_DIVE_TOC[entryId] ?? [];
  const currentIndex = DEEP_DIVE_ENTRIES.findIndex((candidate) => candidate.id === entryId);
  const previous = currentIndex > 0 ? DEEP_DIVE_ENTRIES[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < DEEP_DIVE_ENTRIES.length - 1 ? DEEP_DIVE_ENTRIES[currentIndex + 1] : undefined;
  const readerPaths = DEEP_DIVE_READER_PATHS.filter((path) => path.entryIds.includes(entryId));
  const articleReaderPaths = readerPaths.map((path) => {
    const pathIndex = path.entryIds.indexOf(entryId);
    const previousPathEntryId = pathIndex > 0 ? path.entryIds[pathIndex - 1] : undefined;
    const nextPathEntryId = pathIndex >= 0 && pathIndex < path.entryIds.length - 1 ? path.entryIds[pathIndex + 1] : undefined;

    return {
      path,
      stepNumber: pathIndex + 1,
      totalSteps: path.entryIds.length,
      previousPathEntry: previousPathEntryId ? getContentEntry(previousPathEntryId) : undefined,
      nextPathEntry: nextPathEntryId ? getContentEntry(nextPathEntryId) : undefined,
    };
  });
  const articleUseCase = getDeepDiveArticleUseCase(entryId, entry.title, entry.confidence);
  const articleClaimBoundary = getDeepDiveArticleClaimBoundary(entryId, entry.confidence, readerPaths);
  const verifyNowLinkMap = new Map<string, typeof defaultVerifyNowLink>();
  for (const link of [...readerPaths.flatMap((path) => path.followUpLinks), defaultVerifyNowLink]) {
    if (!verifyNowLinkMap.has(link.label)) {
      verifyNowLinkMap.set(link.label, link);
    }
  }
  const verifyNowLinks = Array.from(verifyNowLinkMap.values()).slice(0, 4);
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

      <header className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="info">Deep Dive</Badge>
          <Badge variant={getConfidenceTone(entry.confidence)}>{getConfidenceLabel(entry.confidence)}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">{entry.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-400">{entry.description}</p>
      </header>

      <div className="mb-6 rounded-lg border border-border bg-surface-elevated/60 p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
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
        <div className="mt-3 grid gap-2 border-t border-border pt-3 text-xs leading-relaxed text-slate-300 md:grid-cols-2">
          <p>
            <span className="font-semibold text-emerald-300">Use This Article For: </span>
            {articleUseCase}
          </p>
          <p>
            <span className="font-semibold text-amber-300">Verify Elsewhere Before Claiming: </span>
            {articleClaimBoundary}
          </p>
        </div>
      </div>

      {verifyNowLinks.length > 0 && (
        <section aria-labelledby="deep-dive-verify-now" className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <h2 id="deep-dive-verify-now" className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                Verify Now
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-400">
                Use these current-state checks before turning this explainer into a live protocol, wallet, or availability claim.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {verifyNowLinks.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="rounded-md border border-amber-500/20 bg-surface/70 px-2.5 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:border-amber-300/40 hover:bg-amber-500/10"
                  title={link.description}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/deep-dives#deep-dive-reader-paths"
                className="rounded-md border border-border bg-surface/70 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent/30 hover:text-slate-100"
              >
                Why these checks
              </Link>
            </div>
          </div>
        </section>
      )}

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

      <article className="prose prose-invert prose-slate max-w-none prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-p:text-slate-300 prose-li:text-slate-300 [&>h1:first-child]:hidden">
        {children}
      </article>

      <div className="mt-12 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/glossary#glossary-definition-map" className="rounded border border-border px-2 py-1 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100">
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
              {articleReaderPaths.map(({ path, stepNumber, totalSteps, previousPathEntry, nextPathEntry }) => (
                <div key={path.id} id={`article-reader-path-${path.id}`} className="scroll-mt-24 rounded-md border border-border bg-surface p-3">
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
                      <span className="rounded border border-border bg-surface-elevated px-2 py-1 text-[11px] font-medium text-slate-400">
                        Step {stepNumber} of {totalSteps}
                      </span>
                      <Badge variant={getConfidenceTone(path.confidence)}>{getConfidenceLabel(path.confidence)}</Badge>
                      <span className="text-[11px] text-slate-500">Wiki reviewed {path.reviewedAt}</span>
                      <span className="text-[11px] text-slate-500">Review due {path.nextReviewDue}</span>
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
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        {nextPathEntry ? 'Then Check' : 'Path Follow-Ups'}
                      </p>
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

                  <div className="mt-3 rounded-md border border-border bg-surface-elevated/70 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Continue This Path</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                          {nextPathEntry
                            ? `Continue with ${nextPathEntry.title} before treating this path as complete.`
                            : 'This is the final article in this path; use the follow-up checks before making live or current-state claims.'}
                        </p>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {path.title} step {stepNumber}/{totalSteps}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {previousPathEntry ? (
                        <Link href={previousPathEntry.href} className="rounded-md border border-border bg-surface px-3 py-2 text-xs hover:border-accent/30">
                          <span className="block uppercase tracking-wider text-slate-500">Previous in path</span>
                          <span className="mt-1 block font-semibold text-slate-300">{previousPathEntry.title}</span>
                        </Link>
                      ) : (
                        <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-slate-500">
                          <span className="block uppercase tracking-wider">Path start</span>
                          <span className="mt-1 block">This article opens the path.</span>
                        </div>
                      )}
                      {nextPathEntry ? (
                        <Link href={nextPathEntry.href} className="rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-xs hover:border-accent/50 sm:text-right">
                          <span className="block uppercase tracking-wider text-accent">Next in path</span>
                          <span className="mt-1 block font-semibold text-slate-100">{nextPathEntry.title}</span>
                        </Link>
                      ) : (
                        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200 sm:text-right">
                          <span className="block uppercase tracking-wider">Path complete</span>
                          <span className="mt-1 block">Move to the follow-up checks above.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {(previous || next) && (
          <section aria-labelledby="all-deep-dives-navigation" className="mt-6">
            <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <p id="all-deep-dives-navigation" className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Browse All Deep Dives
              </p>
              <p className="text-xs text-slate-500">Article library order, separate from reader-path order.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {previous ? (
              <Link href={previous.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">Previous in library</span>
                <span className="mt-1 block font-semibold text-slate-300">{previous.title}</span>
              </Link>
            ) : <div />}
            {next && (
              <Link href={next.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30 sm:text-right">
                <span className="block text-[11px] uppercase tracking-wider text-slate-400">Next in library</span>
                <span className="mt-1 block font-semibold text-slate-300">{next.title}</span>
              </Link>
            )}
            </div>
          </section>
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
