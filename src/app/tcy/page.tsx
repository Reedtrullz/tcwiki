export default function TCYPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">THORChain Yield &amp; Savers</h1>
      <p className="text-slate-400 max-w-3xl mb-12">Savers Vaults, lending programs, and yield products on THORChain — including the THORFi era and its aftermath.</p>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Savers Vaults</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { title: 'Single-Sided Deposits', desc: 'Deposit a single asset (e.g., BTC or ETH) without needing RUNE. No exposure to impermanent loss — the protocol absorbs pool rebalancing risk using the Reserve.' },
          { title: 'Yield Source', desc: 'Earnings come from swap fees and block rewards. Savers receive a share proportional to their deposit relative to the total pool depth.' },
          { title: '100-Day Protection', desc: 'Full Impermanent Loss Protection (ILP) kicks in after 100 days. Before that, partial protection scales linearly from day 1 to day 100.' },
          { title: 'No Lock-Up', desc: 'Withdraw at any time. Protection applies proportionally to the time deposited. Early withdrawals receive partial ILP coverage based on days elapsed / 100.' },
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

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Impermanent Loss Protection (ILP)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold mb-2">What is IL?</h3>
          <p className="text-xs text-slate-500">Impermanent loss occurs when the price ratio of pooled assets changes. If one asset in a RUNE/ASSET pool appreciates significantly, arbitrageurs rebalance the pool by selling the appreciated asset — LPs end up with less of the appreciating asset than if they had held.</p>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold mb-2">How ILP Works</h3>
          <p className="text-xs text-slate-500">The protocol covers IL using RUNE from the Reserve. Coverage scales from 0% at day 1 to 100% at day 100. After 100 days, LPs are fully protected — any IL incurred on withdrawal is reimbursed from the Reserve.</p>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold mb-2">ILP Coverage</h3>
          <p className="text-xs text-slate-500">Coverage = min(days_deposited / 100, 1.0). After 100 days: 100% coverage. Partial withdrawals are covered proportionally. ILP only covers IL — not price declines in the underlying assets themselves.</p>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Savers vs Liquidity Provision</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-5 rounded-lg bg-surface-elevated border border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">Savers</h3>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Deposit single asset (no RUNE needed)</li>
            <li>• No impermanent loss exposure</li>
            <li>• Lower yield than LP</li>
            <li>• Protected by Reserve / ILP</li>
            <li>• No need to manage two positions</li>
          </ul>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-rune/20">
          <h3 className="text-sm font-semibold text-rune mb-2">Liquidity Provision</h3>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• Deposit RUNE + asset (two tokens)</li>
            <li>• Exposed to impermanent loss (partially covered by ILP after 100 days)</li>
            <li>• Higher yield than Savers</li>
            <li>• Earns both swap fees and block rewards</li>
            <li>• Active position management may be needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
