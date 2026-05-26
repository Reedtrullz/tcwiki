import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function EconomicsPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Economics & Tokenomics</h1>
      <p className="text-slate-400 max-w-3xl mb-12">RUNE token mechanics, fee structures, the Continuous Liquidity Pool model, and the Incentive Pendulum.</p>

      <SectionHeader>RUNE Token</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Settlement Asset', desc: 'All cross-chain swaps route through RUNE. BTC → RUNE → ETH. RUNE is the only asset that pairs against every external token in every liquidity pool.' },
          { title: 'Security Bond', desc: 'Node operators bond RUNE to participate. Bonds range from ~300K to 2M+ RUNE. Larger bonds earn more rewards. Misbehavior results in slashing of the bond.' },
          { title: 'Governance Token', desc: 'RUNE holders govern via Architecture Decision Records (ADRs). Voting power is proportional to bonded RUNE. 67% threshold required to pass.' },
        ].map((c) => (
          <Card key={c.title}>
            <h3 className="text-sm font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Supply & Emission</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { label: 'Maximum Supply', value: '500,000,000 RUNE' },
          { label: 'Initial Supply', value: '~230M (BEPSwap)' },
          { label: 'Circulating', value: '~340M RUNE' },
          { label: 'Block Rewards Split', value: '67% Nodes / 33% LPs' },
        ].map((r) => (
          <div key={r.label} className="flex items-center justify-between p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{r.label}</span>
            <span className="text-sm font-semibold">{r.value}</span>
          </div>
        ))}
      </div>

      <SectionHeader>Fee Structure</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          { fee: 'Liquidity Fee', rate: 'Slip-based (dynamic)', to: 'LPs', desc: 'Scaled by trade size relative to pool depth. Small trades pay near-zero. Large trades pay proportionally more.' },
          { fee: 'Outbound Fee', rate: 'Dynamic per chain', to: 'Reserve', desc: 'Covers gas costs for outbound transactions. Varies by chain based on current network fees.' },
          { fee: 'Network Fee', rate: 'Flat per swap', to: 'Node operators', desc: 'Minimum fee applied to every swap. Compensates operators for observation and signing.' },
        ].map((f) => (
          <Card key={f.fee}>
            <h3 className="text-sm font-semibold mb-2">{f.fee}</h3>
            <p className="text-xl font-bold text-accent mb-1">{f.rate}</p>
            <p className="text-[11px] text-slate-500 mb-2">To: {f.to}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Incentive Pendulum</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card className="border-rune/20">
          <h3 className="text-sm font-semibold text-rune mb-2">Low Bond Ratio →</h3>
          <p className="text-xs text-slate-500">When bonded RUNE is low relative to pooled RUNE, more block rewards flow to node operators to incentivize bonding.</p>
        </Card>
        <Card className="border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">High Bond Ratio →</h3>
          <p className="text-xs text-slate-500">When bonded RUNE is high relative to pooled RUNE, more rewards flow to LPs to incentivize liquidity provision.</p>
        </Card>
      </div>

      <SectionHeader>CLP Formula</SectionHeader>
      <Card className="font-mono text-xs text-slate-400 space-y-1">
        <p><span className="text-accent">Slip Fee:</span> fee = x / (X + x)  &mdash; where x is input, X is pool balance</p>
        <p><span className="text-accent">Output Amount:</span> y = (x · Y · X) / (x + X)&sup2; &mdash; where Y is paired asset balance</p>
      </Card>
    </div>
  );
}
