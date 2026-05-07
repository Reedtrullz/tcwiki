import { Shield, Server, Key, RefreshCw, Users, Lock } from 'lucide-react';

const secFeatures = [
  { title: 'Threshold Signature Schemes (TSS)', icon: <Key className="h-6 w-6" />, desc: 'TSS enables distributed key generation and signing across node operators without any single party holding complete control. A configurable threshold (currently 2/3) of nodes must cooperate to authorize outgoing transactions.' },
  { title: 'Rotating Vaults (Churning)', icon: <RefreshCw className="h-6 w-6" />, desc: 'Vaults rotate every ~3 days (~50,000 blocks). When a vault rotates, funds move to a fresh Asgard vault with a new TSS key distributed to the current active node set. This prevents key compromise accumulation.' },
  { title: 'Bonded Validators', icon: <Lock className="h-6 w-6" />, desc: 'Node operators must bond RUNE (currently ~300K-2M RUNE). This bond acts as a security deposit. If a node misbehaves, its bond is slashed — economic incentives align operator behavior with network security.' },
  { title: 'Byzantine Fault Tolerance', icon: <Shield className="h-6 w-6" />, desc: 'The network requires 2/3+ supermajority for consensus. As long as fewer than 1/3 of nodes by stake are malicious, the network remains secure. Tendermint consensus provides deterministic finality.' },
  { title: 'Node Churning', icon: <Users className="h-6 w-6" />, desc: 'Active nodes are periodically replaced by the highest-bonded standby nodes. This churning ensures fresh operators continuously join the active set and prevents long-term concentration of signing power.' },
  { title: 'Slash Points', icon: <Server className="h-6 w-6" />, desc: 'Nodes accumulate slash points for missing observations or failing to sign. High slash point counts can trigger forced churning or bond forfeiture, enforcing operational reliability.' },
];

const nodeTypes = [
  { type: 'Active', desc: 'Currently in the validator set. Must be online, observe chains, sign TSS transactions, and participate in consensus. Receive the highest rewards.', color: 'text-green-600 dark:text-green-400' },
  { type: 'Standby', desc: 'Ready to join the active set. Must maintain uptime and sync. Promoted to Active based on bond ranking during churn events.', color: 'text-yellow-600 dark:text-yellow-400' },
  { type: 'Ready', desc: 'Synced and configured but not bonded or with insufficient bond to be Standby. Can be promoted by bonding more RUNE.', color: 'text-gray-600 dark:text-gray-400' },
  { type: 'Whitelisted', desc: 'Approved by governance to operate as a node but not yet bonded. Must bond RUNE to advance to Ready.', color: 'text-blue-600 dark:text-blue-400' },
];

export default function NetworkPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Network & Security</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">How THORChain secures cross-chain assets through bonded validators, threshold signatures, and economic incentives.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Node Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodeTypes.map(n => (
              <div key={n.type} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className={`text-lg font-bold mb-2 ${n.color}`}>{n.type}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{n.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Security Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secFeatures.map(f => (
              <div key={f.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors">
                <div className="flex items-center mb-4 text-purple-600 dark:text-purple-400">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Minimum Bond Requirements</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Current Minimum Bond</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">~300,000 RUNE</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Subject to governance and churn dynamics. This is the minimum to be considered Standby.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Active Set Size</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">Up to ~30 nodes</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Controlled by mimir constant “MaxNodeToChurnOut”. The top N bonded nodes by RUNE are Active.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Churning Process</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <ol className="space-y-4 text-gray-600 dark:text-gray-400">
              <li className="flex gap-3"><span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">1.</span> Every ~3 days (~50,000 blocks), the oldest active node (by join time) is churned out.</li>
              <li className="flex gap-3"><span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">2.</span> The highest-bonded Standby node is promoted to the Active set.</li>
              <li className="flex gap-3"><span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">3.</span> The vault rotates — all pooled funds move to a new Asgard vault with fresh TSS keys.</li>
              <li className="flex gap-3"><span className="font-bold text-purple-600 dark:text-purple-400 shrink-0">4.</span> The churned node enters a 12-hour unbonding period before receiving its bond back.</li>
            </ol>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Key Security Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[{ label: 'Consensus Threshold', value: '67%' },{ label: 'TSS Threshold', value: '2/3' },{ label: 'Active Nodes', value: '~30' },{ label: 'Churn Interval', value: '~3 days' },{ label: 'Slash Rate', value: '1.5x' },{ label: 'Unbond Time', value: '12 hours' },{ label: 'Min Bond', value: '~300K RUNE' },{ label: 'Max Supply', value: '500M RUNE' }].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{s.value}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
