export default function NetworkPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Network & Security</h1>
      <p className="text-slate-400 max-w-3xl mb-12">How THORChain secures cross-chain assets through bonded validators, threshold signatures, and economic incentives.</p>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Node Types</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { type: 'Active', color: 'text-green-400', desc: 'Currently in the validator set. Must be online, observe chains, sign TSS transactions, and participate in consensus. Highest rewards.' },
          { type: 'Standby', color: 'text-amber-400', desc: 'Ready to join the active set. Maintains uptime and sync. Promoted to Active based on bond ranking during churn events.' },
          { type: 'Ready', color: 'text-slate-400', desc: 'Synced but not bonded or insufficient bond for Standby. Can be promoted by bonding more RUNE.' },
          { type: 'Whitelisted', color: 'text-blue-400', desc: 'Approved by governance to operate as a node but not yet bonded. Must bond RUNE to advance to Ready.' },
        ].map((n) => (
          <div key={n.type} className="p-5 rounded-lg bg-surface-elevated border border-border">
            <h3 className={`text-sm font-semibold mb-1.5 ${n.color}`}>{n.type}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{n.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Security Architecture</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Threshold Signatures', desc: 'TSS distributes key generation and signing across operators. A 2/3 threshold of nodes must cooperate to authorize outgoing transactions.' },
          { title: 'Rotating Vaults', desc: 'Vaults rotate every ~3 days (50K blocks). Funds move to a fresh Asgard vault with new TSS keys, preventing key compromise accumulation.' },
          { title: 'Bonded Validators', desc: 'Operators bond RUNE (~300K–2M). Bond acts as security deposit. Misbehavior triggers bond slashing — economic incentives enforce honest behavior.' },
          { title: 'Byzantine Fault Tolerance', desc: '2/3+ supermajority required for consensus. As long as fewer than 1/3 of nodes by stake are malicious, the network remains secure.' },
          { title: 'Slash Points', desc: 'Nodes accumulate slash points for missing observations or failing to sign. High slash counts trigger forced churning or bond forfeiture.' },
          { title: 'Churning', desc: 'Every ~3 days, the oldest active node is replaced by the highest-bonded Standby. Vault rotates, and the churned node enters a 12h unbonding period.' },
        ].map((f) => (
          <div key={f.title} className="p-5 rounded-lg bg-surface-elevated border border-border">
            <h3 className="text-sm font-semibold mb-1.5">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Key Numbers</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Consensus Threshold', value: '67%' },
          { label: 'TSS Threshold', value: '2/3' },
          { label: 'Active Nodes', value: '~90' },
          { label: 'Churn Interval', value: '~3 days' },
          { label: 'Slash Rate', value: '1.5x' },
          { label: 'Unbond Time', value: '12 hours' },
          { label: 'Minimum Bond', value: '~300K RUNE' },
          { label: 'Max Supply', value: '500M RUNE' },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-lg bg-surface-elevated border border-border text-center">
            <p className="text-xl font-bold text-accent">{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
