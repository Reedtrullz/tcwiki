const sections = [
  {
    title: 'Getting Started',
    links: [
      { label: 'THORChain Documentation', href: 'https://docs.thorchain.org' },
      { label: 'Quick Start Guide', href: 'https://docs.thorchain.org/quick-start-guide' },
      { label: 'Understanding Cross-Chain Swaps', href: 'https://docs.thorchain.org/understanding-thorchain' },
    ],
  },
  {
    title: 'For Developers',
    links: [
      { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
      { label: 'Midgard API Reference', href: 'https://midgard.thorchain.network/v2/doc' },
      { label: 'SwapKit SDK', href: 'https://swapkit.dev' },
      { label: 'XChainJS Library', href: 'https://xchainjs.org' },
    ],
  },
  {
    title: 'Running Infrastructure',
    links: [
      { label: 'Running a THORNode', href: 'https://docs.thorchain.org/thornodes/overview' },
      { label: 'Providing Liquidity', href: 'https://docs.thorchain.org/thornodes/overview/liquidity-provision' },
      { label: 'Savers Vaults Guide', href: 'https://docs.thorchain.org/using-thorchain/savers' },
    ],
  },
  {
    title: 'API Endpoints',
    links: [
      { label: 'Midgard v2 (Liquify)', href: 'https://gateway.liquify.com/chain/thorchain_midgard/v2' },
      { label: 'Midgard v2 (Direct)', href: 'https://midgard.thorchain.network/v2' },
      { label: 'Thornode (Liquify)', href: 'https://gateway.liquify.com/chain/thorchain_api' },
      { label: 'Public RPC', href: 'https://rpc.thorchain.info' },
    ],
  },
];

const community = [
  { label: 'Discord', href: 'https://discord.gg/thorchain' },
  { label: 'Twitter', href: 'https://x.com/THORChain' },
  { label: 'Telegram', href: 'https://t.me/thorchain_org' },
  { label: 'Reddit', href: 'https://reddit.com/r/THORChain' },
  { label: 'GitHub', href: 'https://github.com/thorchain' },
];

export default function DocsPage() {
  return (
    <div className="pt-[52px] py-16 px-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
      <p className="text-slate-400 max-w-3xl mb-12">Reference for THORChain — from beginners to developers and node operators.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{s.title}</h2>
            <div className="space-y-1">
              {s.links.map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors group">
                  <span className="text-sm text-slate-300 group-hover:text-accent transition-colors">{l.label}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Community</h2>
      <div className="flex flex-wrap gap-2">
        {community.map((c) => (
          <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            {c.label}
          </a>
        ))}
      </div>
    </div>
  );
}
