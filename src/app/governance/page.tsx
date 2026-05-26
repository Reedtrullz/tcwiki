import { GOVERNANCE_PROPOSALS, PROTOCOL_MILESTONES, SECURITY_INCIDENTS, RESEARCH_REPORTS } from '@/lib/data/static';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';

export default function GovernancePage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Governance & History</h1>
      <p className="text-slate-400 max-w-3xl mb-12">ADRs, protocol milestones, security incidents, and third-party research reports.</p>

      <SectionHeader>Proposals (ADRs)</SectionHeader>
      <div className="space-y-2 mb-12">
        {GOVERNANCE_PROPOSALS.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono text-accent">ADR-{String(p.id).padStart(3, '0')}</span>
                  <h3 className="text-sm font-semibold truncate">{p.title}</h3>
                </div>
                <p className="text-xs text-slate-500">{p.description}</p>
              </div>
              <Badge variant={p.status === 'Passed' ? 'success' : 'warning'} className="shrink-0">{p.status}</Badge>
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-slate-600">
              <span>For: {p.votesFor}%</span>
              <span>Against: {p.votesAgainst}%</span>
              <span>Threshold: {p.threshold}%</span>
              <span className="capitalize">{p.type}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Milestones</h2>
          <div className="space-y-0">
            {PROTOCOL_MILESTONES.map((m, i) => (
              <div key={i} className="flex gap-3 py-2.5 border-b border-border last:border-0">
                <span className="text-[11px] text-slate-600 font-mono shrink-0 w-20">{m.date}</span>
                <div>
                  <p className="text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-slate-500">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Security Incidents</h2>
          <div className="space-y-2">
            {SECURITY_INCIDENTS.map((inc) => (
              <Card key={inc.id}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">{inc.title}</h3>
                  <Badge variant={inc.resolved ? 'success' : 'danger'}>{inc.resolved ? 'Resolved' : 'Ongoing'}</Badge>
                </div>
                <p className="text-xs text-slate-500 mb-1">{inc.description} — <span className="text-red-400">{inc.impact}</span></p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {inc.lessons.map((l, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{l}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Research</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {RESEARCH_REPORTS.map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-5 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors">
            <p className="text-[11px] text-slate-500 mb-1">{r.date} · {r.source} · {r.author}</p>
            <h3 className="text-sm font-semibold mb-2">{r.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{r.summary}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
