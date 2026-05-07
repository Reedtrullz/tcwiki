import React from 'react';
import { ECOSYSTEM_PROJECTS, CHAINS } from '@/lib/data/static';

const categories = [...new Set(ECOSYSTEM_PROJECTS.map((p) => p.category))];

export default function EcosystemPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Ecosystem</h1>
      <p className="text-slate-400 max-w-3xl mb-12">Applications, wallets, interfaces, explorers, and developer tools built on THORChain.</p>

      {categories.map((cat) => {
        const projects = ECOSYSTEM_PROJECTS.filter((p) => p.category === cat);
        return (
          <section key={cat} className="mb-10">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projects.map((p) => (
                <a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium group-hover:text-accent transition-colors">{p.name}</h3>
                    <span className="text-[11px] text-accent">{p.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.chains.slice(0, 4).map((c) => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">{c}</span>
                    ))}
                    {p.chains.length > 4 && <span className="text-[10px] text-slate-600">+{p.chains.length - 4}</span>}
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 mt-12">Supported Chains ({CHAINS.length})</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {CHAINS.map((c) => (
          <div key={c.chain} className="p-3 rounded-lg bg-surface-elevated border border-border text-center">
            <p className="text-sm font-medium">{c.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{c.chain}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
