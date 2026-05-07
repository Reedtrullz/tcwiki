import React from 'react';
import { Globe, Code, Wallet, Database } from 'lucide-react';
import { ECOSYSTEM_PROJECTS, CHAINS } from '@/lib/data/static';

const categories = ['Interface', 'Wallet', 'Explorer', 'Developer Tools'] as const;
const catIcons: Record<string, React.ReactNode> = { Interface: <Globe className="h-5 w-5" />, Wallet: <Wallet className="h-5 w-5" />, Explorer: <Database className="h-5 w-5" />, 'Developer Tools': <Code className="h-5 w-5" /> };

export default function EcosystemPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Ecosystem</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Applications, wallets, interfaces, explorers, and developer tools built on THORChain.</p>
        </div>

        {categories.map(cat => {
          const projects = ECOSYSTEM_PROJECTS.filter(p => p.category === cat);
          return (
            <section key={cat} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-orange-600 dark:text-orange-400">{catIcons[cat]}</span>{cat}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map(p => (
                  <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{p.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">{p.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{p.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {p.chains.slice(0, 5).map(c => (<span key={c} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{c}</span>))}
                      {p.chains.length > 5 && <span className="text-xs text-gray-400">+{p.chains.length - 5}</span>}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          );
        })}

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Supported Chains</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{CHAINS.length} chains currently supported by THORChain:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {CHAINS.map(c => (
              <div key={c.chain} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <p className="font-semibold text-gray-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-gray-500 font-mono">{c.chain}</p>
                <p className="text-xs text-gray-400 mt-1">{c.addressFormats[0]}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
