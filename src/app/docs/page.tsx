import { BookOpen, Code, Cpu, FileText, ExternalLink } from 'lucide-react';

const docSections = [
  {
    title: 'Getting Started',
    icon: <BookOpen className="h-8 w-8" />,
    links: [
      { label: 'What is THORChain?', href: 'https://docs.thorchain.org' },
      { label: 'Quick Start Guide', href: 'https://docs.thorchain.org/quick-start-guide' },
      { label: 'Understanding Cross-Chain Swaps', href: 'https://docs.thorchain.org/understanding-thorchain' },
    ],
  },
  {
    title: 'Technology',
    icon: <Cpu className="h-8 w-8" />,
    links: [
      { label: 'How It Works', href: 'https://docs.thorchain.org/how-it-works' },
      { label: 'Architecture (TSS, Bifrost, CLP)', href: 'https://docs.thorchain.org/technology' },
      { label: 'Consensus (Tendermint)', href: 'https://docs.thorchain.org/technology/tendermint' },
    ],
  },
  {
    title: 'For Developers',
    icon: <Code className="h-8 w-8" />,
    links: [
      { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
      { label: 'Midgard API Reference', href: 'https://midgard.ninerealms.com/v2/doc' },
      { label: 'Thornode API', href: 'https://thornode.ninerealms.com/thorchain/doc' },
      { label: 'SwapKit SDK', href: 'https://swapkit.dev' },
      { label: 'XChainJS Library', href: 'https://xchainjs.org' },
    ],
  },
  {
    title: 'Guides & Tutorials',
    icon: <FileText className="h-8 w-8" />,
    links: [
      { label: 'Running a Node', href: 'https://docs.thorchain.org/thornodes/overview' },
      { label: 'Providing Liquidity', href: 'https://docs.thorchain.org/thornodes/overview/liquidity-provision' },
      { label: 'Savers Vaults Guide', href: 'https://docs.thorchain.org/using-thorchain/savers' },
      { label: 'Building on THORChain', href: 'https://dev.thorchain.org' },
    ],
  },
];

const communityLinks = [
  { label: 'THORChain Discord', href: 'https://discord.gg/thorchain' },
  { label: 'THORChain Twitter', href: 'https://x.com/THORChain' },
  { label: 'THORChain Telegram', href: 'https://t.me/thorchain_org' },
  { label: 'THORChain Reddit', href: 'https://reddit.com/r/THORChain' },
  { label: 'GitHub (THORChain)', href: 'https://github.com/thorchain' },
  { label: 'Nine Realms', href: 'https://ninerealms.com' },
];

export default function DocsPage() {
  return (
    <div className="pt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Documentation</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Comprehensive reference for THORChain — from beginners to developers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {docSections.map(s => (
            <div key={s.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">{s.icon}<h2 className="text-xl font-bold text-gray-900 dark:text-white">{s.title}</h2></div>
              <div className="space-y-2">
                {s.links.map(l => (
                  <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{l.label}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Community & Resources</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {communityLinks.map(c => (
              <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{c.label}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8 border border-blue-200 dark:border-blue-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">API Endpoints</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{ name: 'Midgard (v2)', url: 'https://midgard.ninerealms.com/v2', desc: 'Layer 2 REST API for pool data, swaps, nodes, and network stats.' },
              { name: 'Thornode', url: 'https://thornode.ninerealms.com', desc: 'Full node RPC and REST API. Access mempool, transactions, account data.' },
              { name: 'Midgard (v1)', url: 'https://midgard.thorchain.info/v2', desc: 'Legacy Midgard endpoint. Prefer v2 for new integrations.' },
              { name: 'Nine Realms RPC', url: 'https://rpc.thorchain.info', desc: 'Public RPC endpoint for querying the THORChain network directly.' }].map(a => (
              <a key={a.name} href={a.url} target="_blank" rel="noopener noreferrer" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors">
                <h3 className="font-bold text-gray-900 dark:text-white">{a.name}</h3>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">{a.url}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{a.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
