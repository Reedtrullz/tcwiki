import Link from 'next/link';
import { GLOSSARY_DEFINITION_PATHS, GLOSSARY_TERMS } from '@/lib/content/glossary';
import { PageContainer } from '@/components/layout/PageContainer';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { GlossaryExplorer, type GlossaryExplorerTerm } from '@/components/features/GlossaryExplorer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Glossary | THORChain Wiki',
  description: 'Source-aware definitions for THORChain protocol, economics, operations, developer, and historical terms.',
  path: '/glossary',
});

const entry = getContentEntry('glossary');

const glossaryTermsById = new Map(GLOSSARY_TERMS.map((term) => [term.id, term]));

function glossaryTermForDefinitionPath(id: string) {
  const term = glossaryTermsById.get(id);
  if (!term) {
    throw new Error(`Glossary definition map references unknown term id: ${id}`);
  }
  return term;
}

function titleFromAnchor(anchor: string) {
  return anchor
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function relatedHrefLabel(href: string) {
  const [path, anchor] = href.split('#');
  const routeEntry = CONTENT_ENTRIES.find((candidate) => candidate.href === path);

  if (path === '/deep-dives' && anchor?.startsWith('deep-dive-path-')) {
    const pathId = anchor.replace('deep-dive-path-', '');
    const readerPath = DEEP_DIVE_READER_PATHS.find((candidate) => candidate.id === pathId);
    if (readerPath) {
      return `${readerPath.title} path`;
    }
  }

  if (path === '/docs' && anchor) {
    const sourceMapSection = SOURCE_MAP_SECTION_RECORDS.find((record) => record.data.id === anchor);
    if (sourceMapSection) {
      return sourceMapSection.data.title;
    }
  }

  if (anchor === 'network-diagnostics') {
    return 'Network diagnostics';
  }
  if (anchor === 'stats-look-here-first') {
    return 'Stats decision panel';
  }
  if (anchor === 'dynamic-fees-live') {
    return 'Dynamic-fee live tracker';
  }
  if (anchor === 'runepool-pol-live') {
    return 'RUNEPool/POL live snapshot';
  }
  if (anchor === 'current-recovery') {
    return 'Recovery tracker';
  }

  if (routeEntry && anchor) {
    return `${routeEntry.title}: ${titleFromAnchor(anchor)}`;
  }
  if (routeEntry) {
    return routeEntry.title;
  }

  return href;
}

export default function GlossaryPage() {
  const terms: GlossaryExplorerTerm[] = GLOSSARY_TERMS.map((term) => ({
    ...term,
    relatedLinks: term.relatedHrefs.map((href) => ({
      href,
      label: relatedHrefLabel(href),
    })),
  }));

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Glossary</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        Source-aware definitions for protocol, economics, operations, developer, and historical THORChain terms.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-8"
        useFor={[
          'Quick definitions for protocol, economics, operations, developer, and historical terms.',
          'Jumping from terms to source-backed pages, deep dives, and live diagnostics.',
        ]}
        verifyBeforeClaiming={[
          'Current values, live operational state, implementation details, or official governance status.',
          'That a compact definition is enough evidence for a protocol or safety claim.',
        ]}
      />

      <section id="glossary-definition-map" className="mb-10 scroll-mt-24">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <SectionHeader className="mb-3">Definition Map</SectionHeader>
            <p className="text-sm leading-relaxed text-slate-400">
              Start with a term, then move to the page that can actually prove the claim. Definitions explain vocabulary; live state, fee outcomes, app-layer availability, and recovery status need stronger evidence.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Each term card carries its own review date and source row; the page posture above covers the map and navigation.
            </p>
          </div>
          <Link
            href="#glossary-explorer"
            className="shrink-0 self-start rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent/50 hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:self-auto"
          >
            Find a term
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {GLOSSARY_DEFINITION_PATHS.map((path) => (
            <Card key={path.title} padding="md">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="info">{path.badge}</Badge>
                <h3 className="text-base font-semibold text-slate-100">{path.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">{path.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {path.termIds.map((termId) => {
                  const term = glossaryTermForDefinitionPath(termId);

                  return (
                    <Link
                      key={term.id}
                      href={`/glossary#term-${term.id}`}
                      className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-accent/30 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      {term.term}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-3 text-xs leading-relaxed text-slate-400 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <p>
                  <span className="font-semibold text-amber-300">Do not claim: </span>
                  {path.boundary}
                </p>
                <Link href={path.verifyHref} className="font-semibold text-accent underline-offset-4 hover:underline">
                  {path.verifyLabel}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
      <GlossaryExplorer terms={terms} />
    </PageContainer>
  );
}
