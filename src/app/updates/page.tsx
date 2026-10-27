import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { UPDATES_PAGE_ENTRY } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { WIKI_CHANGE_RECORDS } from '@/lib/data/static';
import { routeUrl } from '@/lib/site';

const baseMetadata = createRouteMetadata({ title: 'Wiki updates | THORChain Wiki', description: UPDATES_PAGE_ENTRY.description, path: UPDATES_PAGE_ENTRY.href });
export const metadata: Metadata = { ...baseMetadata, alternates: { ...baseMetadata.alternates, types: { 'application/rss+xml': routeUrl('/updates/feed.xml') } } };

export default function UpdatesPage() {
  const records = [...WIKI_CHANGE_RECORDS].sort((a, b) => b.data.reviewedAt.localeCompare(a.data.reviewedAt));

  return (
    <PageContainer maxWidth="narrow">
      <header className="mb-8">
        <p className="text-sm font-medium text-accent">Editorial record</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Wiki updates</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
          Source-backed changes to wiki content. Dates below identify source observations and wiki reviews;
          they do not turn historical protocol events into current news.
        </p>
        <a className="mt-4 inline-flex text-sm text-accent underline underline-offset-4" href="/updates/feed.xml">
          Subscribe with RSS
        </a>
      </header>

      <PageSourcePosture
        entry={UPDATES_PAGE_ENTRY}
        className="mb-8"
        useFor={['Tracking reviewed changes to wiki explanations and evidence boundaries.']}
        verifyBeforeClaiming={['Current protocol availability, operational state, or an incident occurring now.']}
      />

      <ol className="space-y-5" aria-label="Curated wiki updates">
        {records.map(({ data, sources }) => (
          <li key={data.id} className="rounded-lg border border-border bg-surface-elevated p-5">
            <article>
              <h2 className="text-xl font-semibold">{data.title}</h2>
              <p className="mt-2 leading-relaxed text-slate-300">{data.summary}</p>
              <p className="mt-4 text-sm text-slate-400">
                Source observation: <time dateTime={data.sourceDate}>{data.sourceDate}</time>
                {' · '}Wiki review: <time dateTime={data.reviewedAt}>{data.reviewedAt}</time>
              </p>
              <p className="mt-2 text-sm">
                <a className="text-accent underline underline-offset-4" href={data.href}>Read the affected wiki content</a>
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {sources.map((source) => (
                  <li key={source.url}>
                    <a className="text-slate-400 underline underline-offset-4 hover:text-slate-200" href={source.url}>
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ol>
    </PageContainer>
  );
}
