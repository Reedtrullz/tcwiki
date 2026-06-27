import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { CONTENT_ENTRIES } from '@/lib/content/registry';

interface DeepDiveShellProps {
  entryId: string;
  editPath: string;
  children: ReactNode;
}

const repoUrl = 'https://github.com/Reedtrullz/tcwiki';

export function DeepDiveShell({ entryId, editPath, children }: DeepDiveShellProps) {
  const entry = CONTENT_ENTRIES.find((candidate) => candidate.id === entryId);
  if (!entry) {
    throw new Error(`Missing content registry entry for ${entryId}`);
  }

  const editUrl = `${repoUrl}/edit/main/${editPath}`;

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

      <article className="prose prose-invert prose-slate max-w-none prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-p:text-slate-300 prose-li:text-slate-300">
        {children}
      </article>
    </PageContainer>
  );
}
