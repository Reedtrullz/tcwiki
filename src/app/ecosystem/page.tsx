import { CHAINS, CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS } from '@/lib/data/static';
import { PageContainer } from '@/components/layout/PageContainer';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { Badge } from '@/components/ui/Badge';

const categories = [...new Set(ECOSYSTEM_PROJECT_RECORDS.map((record) => record.data.category))];

export default function EcosystemPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ecosystem</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        Selected applications, wallets, interfaces, explorers, and developer tools. This is a curated index, not an exhaustive directory. Chain support is curated from live inbound sources, but current availability remains live/current-only.
      </p>

      {categories.map((category) => {
        const projects = ECOSYSTEM_PROJECT_RECORDS.filter((record) => record.data.category === category);
        return (
          <section key={category} className="mb-10">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projects.map((record) => {
                const project = record.data;
                return (
                  <div
                    key={project.id}
                    className="p-4 rounded-lg bg-surface-elevated border border-border transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium">{project.name}</h3>
                      <Badge variant="success">{project.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.chains.slice(0, 6).map((chain) => (
                        <span key={chain} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{chain}</span>
                      ))}
                      {project.chains.length > 6 && <span className="text-[10px] text-slate-600">+{project.chains.length - 6}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:text-accent/80 transition-colors"
                      >
                        Open project
                      </a>
                      <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-12">Curated Chain List ({CHAINS.length})</h2>
      <p className="text-sm text-slate-500 mb-4">Use this list as a source-backed index, not as proof that swaps or LP actions are currently open.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {CHAIN_RECORDS.map((record) => {
          const chain = record.data;
          return (
            <div key={chain.chain} className="p-3 rounded-lg bg-surface-elevated border border-border text-center">
              <p className="text-sm font-medium">{chain.name}</p>
              <p className="text-[11px] text-slate-500 font-mono">{chain.chain}</p>
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
