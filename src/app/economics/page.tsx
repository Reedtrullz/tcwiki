import { DollarSign, BarChart3, Coins } from 'lucide-react';

export default function EconomicsPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Economics & Tokenomics</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Understanding RUNE token mechanics, fee structures, incentive systems, and the Continuous Liquidity Pool (CLP) model.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">RUNE Token</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{ title: 'Settlement Asset', icon: <DollarSign className="h-6 w-6" />, desc: 'RUNE is used as the settlement currency for all cross-chain swaps. Every swap between two non-RUNE assets routes through RUNE as the intermediary — e.g., BTC → RUNE → ETH.' },
              { title: 'Liquidity Pair', icon: <Coins className="h-6 w-6" />, desc: 'Every liquidity pool pairs RUNE against an external asset. Liquidity providers deposit both RUNE and the paired asset to earn swap fees and system income.' },
              { title: 'Security Bond', icon: <BarChart3 className="h-6 w-6" />, desc: 'Node operators must bond RUNE to participate. Larger bonds mean higher earning potential and greater stake in network security. Misbehavior results in bond slashing.' }].map(c => (
              <div key={c.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center mb-4 text-green-600 dark:text-green-400">{c.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{c.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Supply & Emission</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Token Distribution</h3>
                <div className="space-y-3">
                  {[{ label: 'Maximum Supply', value: '500,000,000 RUNE' },{ label: 'Initial Supply (BEPSwap)', value: '~230M RUNE' },{ label: 'Circulating Supply', value: '~340M RUNE' },{ label: 'Burned (Reserve)', value: '~160M RUNE remaining' }].map(r => (
                    <div key={r.label} className="flex justify-between text-sm"><span className="text-gray-600 dark:text-gray-400">{r.label}</span><span className="font-semibold text-gray-900 dark:text-white">{r.value}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Emission Mechanics</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-3">RUNE emission follows an inverse relationship with the Incentive Pendulum. When the reserve ratio is low, more RUNE is emitted to incentivize liquidity. When the ratio is high, emission slows and more system income flows to node operators.</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">Block rewards are split between node operators (67%) and liquidity providers (33%), with the exact ratio modulated by the Incentive Pendulum based on the current reserve/bonded ratio.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">CLP — Continuous Liquidity Pools</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-6">THORChain uses a novel Continuous Liquidity Pool (CLP) formula derived from Bancor-style bonding curves. Key properties:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[{ label: 'Slip-based Fee', value: 'Fees increase with trade size relative to pool depth. Larger trades pay proportionally higher fees.' },
                { label: 'Infinite Liquidity', value: 'Pools never run out — trades always execute, but at increasingly worse prices as depth is consumed.' },
                { label: 'Asymmetric Pricing', value: 'Buying and selling have different effective prices, preventing arbitrage manipulation of the pool.' },
                { label: 'Impermanent Loss Protection', value: 'LPs are protected against impermanent loss through ILP-covered RUNE insurance after 100 days of provision.' }].map(p => (
                <div key={p.label} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{p.label}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{p.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-600 dark:text-gray-400">
              <div className="mb-2"><span className="text-green-600 dark:text-green-400">Slip Fee:</span> fee = (x / (X + x)) where x = input amount, X = pool balance</div>
              <div><span className="text-green-600 dark:text-green-400">Output:</span> y = (x * Y * X) / (x + X)² where Y = paired asset balance</div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Fee Structure</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{ fee: 'Liquidity Fee', rate: 'Slip-based (dynamic)', to: 'Liquidity Providers', desc: 'Scaled by trade size. Small trades pay near-zero fees. Large trades pay proportionally more.' },
              { fee: 'Outbound Fee', rate: 'Dynamic per chain', to: 'Network Reserve', desc: 'Covers gas costs for outbound transactions. Varies by chain based on current network fees.' },
              { fee: 'Network Fee', rate: 'Flat per swap', to: 'Node Operators', desc: 'Minimum fee applied to every swap. Compensates node operators for observation and signing work.' }].map(f => (
              <div key={f.fee} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{f.fee}</h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">{f.rate}</p>
                <p className="text-xs text-gray-500 mb-3">Paid to: {f.to}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Incentive Pendulum</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400 mb-4">The Incentive Pendulum is THORChain&apos;s core economic mechanism that balances security and liquidity:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                <h3 className="font-bold text-green-600 dark:text-green-400 mb-2">Low Bond Ratio →</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">When bonded RUNE is low relative to pooled RUNE, more block rewards flow to node operators to incentivize bonding and secure the network.</p>
              </div>
              <div className="border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                <h3 className="font-bold text-purple-600 dark:text-purple-400 mb-2">High Bond Ratio →</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">When bonded RUNE is high relative to pooled RUNE, more block rewards flow to LPs to incentivize liquidity provision for deeper pools.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">System Income</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Swap fees (all types)','Block rewards','Gas reimbursements','Treasury income'].map(s => (
              <div key={s} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-sm text-gray-900 dark:text-white">{s}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
