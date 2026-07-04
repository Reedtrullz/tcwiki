import Link from 'next/link';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Glossary | THORChain Wiki',
  description: 'Source-aware definitions for THORChain protocol, economics, operations, developer, and historical terms.',
  path: '/glossary',
});

const entry = getContentEntry('glossary');

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
  const categories = Array.from(new Set(GLOSSARY_TERMS.map((term) => term.category))).sort();

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

      <nav aria-label="Glossary categories" className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <a key={category} href={`#${category}`} className="rounded-md border border-border px-3 py-1.5 text-xs text-slate-400 hover:border-accent/30 hover:text-slate-100">
            {category}
          </a>
        ))}
      </nav>

      {categories.map((category) => (
        <section key={category} id={category} className="scroll-mt-24 mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">{category}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {GLOSSARY_TERMS.filter((term) => term.category === category).map((term) => (
              <article key={term.id} id={`term-${term.id}`} className="scroll-mt-24 rounded-lg border border-border bg-surface-elevated p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{term.term}</h3>
                  <Badge variant="info">{term.category}</Badge>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{term.definition}</p>
                <div className="mt-3">
                  <FreshnessMeta
                    freshness={{
                      checkedAt: term.reviewedAt,
                      confidence: term.confidence,
                      nextReviewDue: term.nextReviewDue,
                    }}
                    sources={term.sources}
                    compact
                  />
                </div>
                {term.relatedHrefs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {term.relatedHrefs.map((href) => (
                      <Link key={href} href={href} className="text-[11px] text-accent hover:text-accent/80">
                        {relatedHrefLabel(href)}
                      </Link>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </PageContainer>
  );
}
