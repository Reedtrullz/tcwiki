export default function RunePage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">RUNE Token</h1>
      <p className="text-slate-400 max-w-3xl mb-12">RUNE is the native asset of THORChain — used for settlement, security, liquidity, and governance.</p>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">What is RUNE?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { title: 'Settlement Asset', desc: 'Every swap between two external assets routes through RUNE. BTC → RUNE → ETH. This paired-asset model means every pool has deep RUNE liquidity on one side.' },
          { title: 'Security Bond', desc: 'Node operators bond RUNE to secure the network. Larger bonds increase earning potential and voting power. Misbehavior is penalized by slashing bonded RUNE — currently at 1.5x the stolen amount.' },
          { title: 'Liquidity Pair', desc: 'Every liquidity pool consists of RUNE paired with an external asset. LPs must deposit both RUNE and the paired asset. RUNE depth is shared across all pools, creating a unified liquidity layer.' },
          { title: 'Governance', desc: 'RUNE holders govern via Architecture Decision Records (ADRs). Voting power is proportional to bonded RUNE. Node operators vote on parameter changes, chain listings, and protocol upgrades.' },
        ].map((c) => (
          <div key={c.title} className="p-5 rounded-lg bg-surface-elevated border border-border">
            <h3 className="text-sm font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Token Economics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { label: 'Maximum Supply', value: '500,000,000 RUNE' },
          { label: 'Initial Supply (BEPSwap)', value: '~230,000,000 RUNE' },
          { label: 'Circulating Supply', value: '~340,000,000 RUNE' },
          { label: 'Burned (from Reserve)', value: '~160,000,000 RUNE remaining' },
          { label: 'Block Rewards', value: 'Emitted per block, modulated by Incentive Pendulum' },
          { label: 'Network Income', value: 'Swap fees + block rewards distributed to nodes & LPs' },
          { label: 'Bond Requirement', value: '~300,000 RUNE minimum for Standby nodes' },
          { label: 'Slash Penalty', value: '1.5x stolen amount from bonded RUNE' },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{r.label}</span>
            <span className="text-sm font-semibold text-right">{r.value}</span>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">How RUNE Flows</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold text-accent mb-2">1. Swaps</h3>
          <p className="text-xs text-slate-500">User swaps BTC for ETH. BTC → RUNE (buy RUNE with BTC). RUNE → ETH (sell RUNE for ETH). Net RUNE balance in pools is unchanged — RUNE acts as a transient settlement layer.</p>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold text-accent mb-2">2. Liquidity</h3>
          <p className="text-xs text-slate-500">LP deposits RUNE + asset into a pool. Earns swap fees proportional to share. Earns swap fees proportional to share of the pool.</p>
        </div>
        <div className="p-5 rounded-lg bg-surface-elevated border border-border">
          <h3 className="text-sm font-semibold text-accent mb-2">3. Security</h3>
          <p className="text-xs text-slate-500">Node operators bond RUNE. Bond size determines Active/Standby status. Earnings from block rewards proportional to bond. If node misbehaves (double-signs, steals), bond is slashed by the protocol.</p>
        </div>
      </div>


    </div>
  );
}
