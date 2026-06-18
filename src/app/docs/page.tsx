import { PageContainer } from '@/components/layout/PageContainer';

const sections = [
  {
    title: 'Official Sources',
    links: [
      { label: 'THORChain Documentation', href: 'https://docs.thorchain.org' },
      { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
      { label: 'Network Halts', href: 'https://dev.thorchain.org/concepts/network-halts.html' },
      { label: 'Querying THORChain', href: 'https://dev.thorchain.org/concepts/querying-thorchain.html' },
    ],
  },
  {
    title: 'Current-Only Live APIs',
    links: [
      { label: 'Midgard v2 (Liquify)', href: 'https://gateway.liquify.com/chain/thorchain_midgard/v2' },
      { label: 'Midgard v2 (Direct)', href: 'https://midgard.thorchain.network/v2' },
      { label: 'THORNode Mimir', href: 'https://thornode.thorchain.network/thorchain/mimir' },
      { label: 'THORNode Inbound Addresses', href: 'https://thornode.thorchain.network/thorchain/inbound_addresses' },
    ],
  },
  {
    title: 'Deprecated / Historical Features',
    links: [
      { label: 'Archived Savers and Lending', href: 'https://docs.thorchain.org/thornodes/archived' },
      { label: 'Tokenomics of RUNE and TCY', href: 'https://docs.thorchain.org/tokenomics-rune-tcy' },
      { label: 'TCY Developer Guide', href: 'https://dev.thorchain.org/concepts/tcy.html' },
      { label: 'THORFi Unwind Announcement', href: 'https://medium.com/thorchain/thorfi-unwind-96b46dff72c0' },
    ],
  },
  {
    title: 'Technical Areas',
    links: [
      { label: 'Fees', href: 'https://dev.thorchain.org/concepts/fees.html' },
      { label: 'CosmWasm', href: 'https://docs.thorchain.org/technical-documentation/technology/cosmwasm' },
      { label: 'RUNEPool', href: 'https://docs.thorchain.org/thornodes/frequently-asked-questions/runepool' },
      { label: 'Asset Notation', href: 'https://dev.thorchain.org/concepts/asset-notation.html' },
    ],
  },
];

const community = [
  { label: 'Discord', href: 'https://discord.com/invite/thorchaincommunity' },
  { label: 'Twitter/X', href: 'https://x.com/thorchain_org' },
  { label: 'Telegram', href: 'https://t.me/thorchain_org' },
  { label: 'Reddit', href: 'https://reddit.com/r/THORChain' },
  { label: 'GitHub', href: 'https://github.com/thorchain' },
];

export default function DocsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Documentation</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        Source links for official docs, live APIs, historical features, and technical references. Current operational state should be read from live endpoints.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{section.title}</h2>
            <div className="space-y-1">
              {section.links.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="block px-4 py-2.5 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 transition-colors group">
                  <span className="text-sm text-slate-300 group-hover:text-accent transition-colors">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Community</h2>
      <div className="flex flex-wrap gap-2">
        {community.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-surface-elevated border border-border hover:border-accent/20 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            {link.label}
          </a>
        ))}
      </div>
    </PageContainer>
  );
}
