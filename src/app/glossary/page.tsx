import Link from 'next/link';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Glossary | THORChain Wiki',
  description: 'Source-aware definitions for THORChain protocol, economics, operations, developer, and historical terms.',
  path: '/glossary',
});

export default function GlossaryPage() {
  const categories = Array.from(new Set(GLOSSARY_TERMS.map((term) => term.category))).sort();

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Glossary</h1>
      <p className="text-slate-400 max-w-3xl mb-8">
        Source-aware definitions for protocol, economics, operations, developer, and historical THORChain terms.
      </p>

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
                        {href}
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
