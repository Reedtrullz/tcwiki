import { PageContainer } from '@/components/layout/PageContainer';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Source Map | THORChain Wiki',
  description: 'Source map for official THORChain docs, Midgard, THORNode, developer references, analytics, and historical protocol context.',
  path: '/docs',
});

export default function DocsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        A source map for official docs, developer references, live APIs, historical records, external analytics, and community channels. Pick sources by the kind of claim you need to make.
      </p>

      <div className="grid grid-cols-1 gap-6 mb-12 md:grid-cols-2">
        {SOURCE_MAP_SECTION_RECORDS.map((record) => (
          <section key={record.data.id} id={record.data.id} className="scroll-mt-24">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{record.data.title}</h2>
            <p className="mb-2 text-xs leading-relaxed text-slate-400">{record.data.use}</p>
            <p className="mb-3 text-xs leading-relaxed text-amber-300/80">{record.data.caveat}</p>
            <div className="mb-3">
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
            <div className="space-y-1">
              {record.data.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border bg-surface-elevated px-4 py-2.5 transition-colors hover:border-accent/20 group"
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
