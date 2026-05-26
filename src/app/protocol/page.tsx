import { CHAINS } from '@/lib/data/static';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';

export default function ProtocolPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Protocol Overview</h1>
      <p className="text-slate-400 max-w-3xl mb-12">THORChain is a decentralized cross-chain liquidity protocol that enables native asset swaps between blockchains directly between blockchains without intermediaries.</p>

      <SectionHeader>Architecture</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { title: 'Cosmos SDK', desc: 'Built on Tendermint consensus with instant finality and IBC compatibility.' },
          { title: 'TSS Vaults', desc: 'Threshold Signature Schemes distribute signing power across node operators — no single custodian.' },
          { title: 'Bifrost Bridge', desc: 'Observes connected chains and facilitates secure cross-chain asset transfers via TSS vaults.' },
          { title: 'Midgard API', desc: 'Layer-2 REST API providing real-time network data, pools, swaps, and node info.' },
        ].map((c) => (
          <Card key={c.title}>
            <h3 className="text-sm font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Key Concepts</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {[
          { title: 'RUNE Token', desc: 'Native settlement asset. Every swap between non-RUNE assets routes through RUNE (e.g., BTC → RUNE → ETH). RUNE is also the liquidity pair in every pool, and the bond asset for node operators.' },
          { title: 'Continuous Liquidity Pools', desc: 'Slip-based fee formula where larger trades pay proportionally more. Pools never run out — trades always execute, at increasingly worse prices as depth is consumed.' },
          { title: 'Savers Vaults', desc: 'Single-sided yield provision. Deposit one asset and earn yield without needing to provide RUNE as a liquidity pair.' },
          { title: 'Incentive Pendulum', desc: 'Balances security vs liquidity. When bonded RUNE is low, more rewards flow to nodes. When pooled RUNE is low, more rewards flow to LPs.' },
          { title: 'Slip-Based Fees', desc: 'Fee = input / (pool + input). Small trades pay near-zero. Large trades pay proportionally more, protecting LPs from whale manipulation.' },
          { title: 'Minimum Governance', desc: 'Architecture Decision Records (ADRs) voted on by node operators. 67% threshold required. Covers parameter changes, chain listings, and protocol upgrades.' },
        ].map((c) => (
          <Card key={c.title}>
            <h3 className="text-sm font-semibold mb-1.5">{c.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Supported Chains</SectionHeader>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-12">
        {CHAINS.map((c) => (
          <Card key={c.chain} padding="sm" className="text-center">
            <p className="text-sm font-medium">{c.name}</p>
            <p className="text-[11px] text-slate-500 font-mono">{c.chain}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
