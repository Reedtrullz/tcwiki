import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { PageContainer } from '@/components/layout/PageContainer';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { GlossaryExplorer, type GlossaryExplorerTerm } from '@/components/features/GlossaryExplorer';
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
      <GlossaryExplorer terms={terms} />
    </PageContainer>
  );
}
