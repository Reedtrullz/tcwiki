export default function TCYPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">THORChain Yield &amp; Savers</h1>
      <p className="text-slate-400 max-w-3xl mb-12">Savers Vaults, lending programs, and yield products on THORChain — including the THORFi era and its aftermath.</p>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Savers Vaults</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { title: 'Single-Sided Deposits', desc: 'Deposit a single asset (e.g., BTC or ETH) without needing RUNE. Earn yield from swap fees and block rewards proportional to your share of the pool.' },
          { title: 'Yield Source', desc: 'Earnings come from swap fees and block rewards. Savers receive a share proportional to their deposit relative to the total pool depth.' },
          { title: 'No Lock-Up', desc: 'Withdraw at any time. No minimum deposit period required.' },
          { title: 'Auto-Compounding', desc: 'Earnings are automatically reinvested into the vault, compounding your position over time without manual intervention.' },
        ].map((c) => (
          <div key={c.title} className="p-5 rounded-lg bg-surface-elevated border border-border">
            <h3 className="text-sm font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">THORFi History</h2>
      <div className="p-5 rounded-lg bg-surface-elevated border border-amber-500/20 mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">Paused</span>
          <h3 className="text-sm font-semibold">THORFi Lending Program</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">In early 2025, THORChain introduced experimental lending and synthetic asset programs under the &ldquo;THORFi&rdquo; umbrella. The protocol allowed users to borrow against their LP positions and mint synthetic assets (TOR, a USD-pegged stablecoin). Due to accumulated protocol liabilities of approximately $200M, the programs were paused in February 2025 via emergency governance (ADR-006).</p>
        <div className="flex flex-wrap gap-2">
          {['$200M protocol liabilities', 'ADR-006 emergency pause', 'TOR stablecoin depegged', 'Savers program unaffected', 'Lending program paused'].map((l) => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{l}</span>
          ))}
        </div>
      </div>


      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Savers vs Liquidity Provision</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-lg bg-surface-elevated border border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">Savers</h3>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Deposit single asset (no RUNE needed)</li>
            <li>• Lower risk — single asset exposure</li>
            <li>• Lower yield than LP</li>
            <li>• Auto-compounding returns</li>
            <li>• No need to manage two positions</li>
          </ul>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-rune/20">
          <h3 className="text-sm font-semibold text-rune mb-2">Liquidity Provision</h3>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Deposit RUNE + asset (two tokens)</li>
            <li>• Exposed to price divergence between paired assets</li>
            <li>• Higher yield than Savers</li>
            <li>• Earns both swap fees and block rewards</li>
            <li>• Active position management may be needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
