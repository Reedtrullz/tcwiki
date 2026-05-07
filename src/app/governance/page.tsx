import { GOVERNANCE_PROPOSALS, PROTOCOL_MILESTONES, SECURITY_INCIDENTS, RESEARCH_REPORTS } from '@/lib/data/static';
import { Vote, AlertTriangle, FileText, Calendar } from 'lucide-react';

export default function GovernancePage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Governance & History</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">THORChain governance, proposals, protocol milestones, security incidents, and research reports.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Vote className="h-6 w-6 text-purple-600" />Governance Proposals</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">THORChain uses Architecture Decision Records (ADRs) for governance. Proposals cover parameter changes, chain integrations, and protocol upgrades. Voting requires 67% threshold to pass.</p>
          <div className="space-y-3">
            {GOVERNANCE_PROPOSALS.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div><span className="text-xs font-mono text-purple-600 dark:text-purple-400">ADR-{String(p.id).padStart(3,'0')}</span><h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.title}</h3></div>
                  <span className={`text-xs px-2 py-0.5 rounded ${p.status === 'Passed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>{p.status}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{p.description}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-500"><span>Votes For: <span className="text-green-600 font-semibold">{p.votesFor}%</span></span><span>Votes Against: <span className="text-red-600">{p.votesAgainst}%</span></span><span>Threshold: {p.threshold}%</span><span>Type: {p.type}</span></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Calendar className="h-6 w-6 text-blue-600" />Protocol Milestones</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-6">
              {PROTOCOL_MILESTONES.map((m, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-400 border-2 border-white dark:border-gray-900" />
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 font-mono">{m.date}</p>
                    <h3 className="font-bold text-gray-900 dark:text-white">{m.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-red-600" />Security Incidents</h2>
          <div className="space-y-3">
            {SECURITY_INCIDENTS.map(inc => (
              <div key={inc.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white">{inc.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${inc.resolved ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{inc.resolved ? 'Resolved' : 'Ongoing'}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{inc.description}</p>
                <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">{inc.impact}</p>
                <div className="flex flex-wrap gap-2">
                  {inc.lessons.map((l, i) => (<span key={i} className="text-xs px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">{l}</span>))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><FileText className="h-6 w-6 text-green-600" />Research Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESEARCH_REPORTS.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors">
                <p className="text-xs text-gray-500">{r.date} · {r.source}</p>
                <h3 className="font-bold text-gray-900 dark:text-white mt-1 mb-2">{r.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{r.summary}</p>
                {r.keyInsights.length > 0 && (
                  <ul className="space-y-1">
                    {r.keyInsights.map((ki, i) => (<li key={i} className="text-xs text-gray-500 flex gap-1"><span className="text-green-600">•</span>{ki}</li>))}
                  </ul>
                )}
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
