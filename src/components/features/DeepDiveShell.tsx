import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { DEEP_DIVE_ENTRIES, DEEP_DIVE_TOC, getContentEntry } from '@/lib/content/registry';

interface DeepDiveShellProps {
  entryId: string;
  editPath: string;
  children: ReactNode;
}

const repoUrl = 'https://github.com/Reedtrullz/tcwiki';

export function DeepDiveShell({ entryId, editPath, children }: DeepDiveShellProps) {
  const entry = getContentEntry(entryId);

  const editUrl = `${repoUrl}/edit/main/${editPath}`;
  const toc = DEEP_DIVE_TOC[entryId] ?? [];
  const currentIndex = DEEP_DIVE_ENTRIES.findIndex((candidate) => candidate.id === entryId);
  const previous = currentIndex > 0 ? DEEP_DIVE_ENTRIES[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < DEEP_DIVE_ENTRIES.length - 1 ? DEEP_DIVE_ENTRIES[currentIndex + 1] : undefined;
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
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <Badge variant="info">Deep Dive</Badge>
          <span>Reviewed {entry.reviewedAt}</span>
          <span role="list" aria-label="Article sources" className="contents">
            {entry.sources.map((source) => (
              <span key={`${source.label}-${source.url}`} role="listitem" className="inline-flex">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {source.label}
                </a>
              </span>
            ))}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-400">{entry.description}</p>
      </div>

      {toc.length > 0 && (
        <nav aria-label="Table of contents" className="mb-6 rounded-lg border border-border bg-surface-elevated/60 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Table of Contents</p>
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
            <span key={tag} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-500">
              {tag}
            </span>
          ))}
        </div>

        {(previous || next) && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {previous ? (
              <Link href={previous.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30">
                <span className="block text-[11px] uppercase tracking-wider text-slate-600">Previous</span>
                <span className="mt-1 block font-semibold text-slate-300">{previous.title}</span>
              </Link>
            ) : <div />}
            {next && (
              <Link href={next.href} className="rounded-lg border border-border bg-surface-elevated p-4 text-sm hover:border-accent/30 sm:text-right">
                <span className="block text-[11px] uppercase tracking-wider text-slate-600">Next</span>
                <span className="mt-1 block font-semibold text-slate-300">{next.title}</span>
              </Link>
            )}
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Related Reading</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {related.map(({ entry: relatedEntry }) => (
                <Link key={relatedEntry.id} href={relatedEntry.href} className="rounded-lg border border-border bg-surface-elevated p-3 text-sm hover:border-accent/30">
                  <span className="font-semibold text-slate-300">{relatedEntry.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{relatedEntry.description}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
