import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { getContentEntry, SOURCE_CHOICE_DECISIONS } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Source Map | THORChain Wiki',
  description: 'Source map for official THORChain docs, Midgard, THORNode, developer references, analytics, and historical protocol context.',
  path: '/docs',
});

const entry = getContentEntry('docs');

function SourceChoiceLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  if (href.startsWith('/docs#') || href.startsWith('#')) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export default function DocsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        A source map for official docs, developer references, live APIs, historical records, external analytics, and community channels. Pick sources by the kind of claim you need to make.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Choosing the right source family for protocol, API, incident, analytics, or community-context claims.',
          'Separating official docs, live API snapshots, external analytics, and social context.',
        ]}
        verifyBeforeClaiming={[
          'That any single source proves current operational state, implementation status, or production safety.',
          'That community discussion or external analytics are canonical protocol evidence.',
        ]}
      />

      <section id="source-map-chooser" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          What Are You Trying To Prove?
        </h2>
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {SOURCE_CHOICE_DECISIONS.map((decision) => (
            <article
              key={decision.id}
              className="rounded-lg border border-border bg-surface-elevated p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Claim Type</p>
                  <h3 className="mt-2 text-base font-semibold leading-snug text-slate-100">{decision.claim}</h3>
                </div>
                <SourceChoiceLink
                  href={decision.startWith.href}
                  className="shrink-0 rounded-md border border-accent/25 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  {decision.startWith.label}
                </SourceChoiceLink>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{decision.why}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {decision.nextChecks.map((check) => (
                  <SourceChoiceLink
                    key={check.href}
                    href={check.href}
                    className="rounded-md border border-border bg-surface px-3 py-2 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                  >
                    <span className="block text-sm font-semibold text-slate-200">{check.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-400">{check.description}</span>
                  </SourceChoiceLink>
                ))}
              </div>
              <p className="mt-4 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-relaxed text-amber-200">
                Do not claim: {decision.avoidClaiming}
              </p>
            </article>
          ))}
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Source Families</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SOURCE_MAP_SECTION_RECORDS.map((record) => (
            <a
              key={record.data.id}
              href={`#${record.data.id}`}
              className="block rounded-lg border border-border bg-surface-elevated p-4 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{record.data.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{record.data.decision}</p>
            </a>
          ))}
        </div>
      </section>

      <div className="mb-12 space-y-10">
        {SOURCE_MAP_SECTION_RECORDS.map((record) => (
          <section key={record.data.id} id={record.data.id} className="scroll-mt-24 border-t border-border pt-7">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{record.data.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-slate-200">{record.data.decision}</p>
              </div>
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
            <p className="mb-2 text-sm leading-relaxed text-slate-400">{record.data.use}</p>
            <p className="mb-5 text-sm leading-relaxed text-amber-300/80">{record.data.caveat}</p>
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Use For Claims</h3>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
                  {record.data.claimExamples.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">Do Not Use Alone To Claim</h3>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
                  {record.data.nonClaims.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Sources</p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {record.data.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-accent/20 group"
                >
                  <span className="text-sm text-slate-300 transition-colors group-hover:text-accent">{link.label}</span>
                  {link.notes && (
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{link.notes}</span>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
