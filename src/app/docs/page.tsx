import { PageContainer } from '@/components/layout/PageContainer';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'THORChain Source Map | THORChain Wiki',
  description: 'Source map for official THORChain docs, Midgard, THORNode, developer references, analytics, and historical protocol context.',
  path: '/docs',
});

const sections = [
  {
    title: 'Current Protocol State',
    use: 'Use these for source-backed current state, live availability, halt flags, pool metrics, and operational checks.',
    caveat: 'Live API responses are current-only snapshots. A successful response is not durable historical proof.',
    links: [
      { label: 'THORNode Mimir', href: 'https://thornode.thorchain.network/thorchain/mimir' },
      { label: 'THORNode Inbound Addresses', href: 'https://thornode.thorchain.network/thorchain/inbound_addresses' },
      { label: 'Midgard v2 Health', href: 'https://midgard.thorchain.network/v2/health' },
      { label: 'Midgard v2 Network', href: 'https://midgard.thorchain.network/v2/network' },
    ],
  },
  {
    title: 'Developer Integration',
    use: 'Use these for integration behavior, API concepts, asset notation, fees, memos, and querying guidance.',
    caveat: 'Developer docs explain intended interfaces; still check live endpoints for current halts, fees, and chain availability.',
    links: [
      { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
      { label: 'Querying THORChain', href: 'https://dev.thorchain.org/concepts/querying-thorchain.html' },
      { label: 'Fees', href: 'https://dev.thorchain.org/concepts/fees.html' },
      { label: 'Asset Notation', href: 'https://dev.thorchain.org/concepts/asset-notation.html' },
    ],
  },
  {
    title: 'Official Protocol Documentation',
    use: 'Use for high-level protocol architecture, tokenomics, node concepts, RUNE, TCY, and canonical educational context.',
    caveat: 'Static docs can lag live protocol state. Prefer dated language when describing fast-moving operational controls.',
    links: [
      { label: 'THORChain Documentation', href: 'https://docs.thorchain.org' },
      { label: 'Network Halts', href: 'https://dev.thorchain.org/concepts/network-halts.html' },
      { label: 'Tokenomics of RUNE and TCY', href: 'https://docs.thorchain.org/tokenomics-rune-tcy' },
      { label: 'CosmWasm', href: 'https://docs.thorchain.org/technical-documentation/technology/cosmwasm' },
    ],
  },
  {
    title: 'Historical Features And Recovery',
    use: 'Use for Savers/Lending deprecation, THORFi unwind, incident reports, recovery records, and source-dated historical context.',
    caveat: 'Historical records should not be converted into current availability claims without live or newly reviewed sources.',
    links: [
      { label: 'Archived Savers and Lending', href: 'https://docs.thorchain.org/thornodes/archived' },
      { label: 'TCY Developer Guide', href: 'https://dev.thorchain.org/concepts/tcy.html' },
      { label: 'THORFi Unwind Announcement', href: 'https://medium.com/thorchain/thorfi-unwind-96b46dff72c0' },
      { label: 'THORChain Exploit Report #1', href: 'https://blog.thorchain.org/thorchain-exploit-report-1' },
    ],
  },
  {
    title: 'External Analytics And Explorers',
    use: 'Use to inspect transactions, pools, nodes, and market or flow context outside this wiki.',
    caveat: 'Explorer and analytics data may use their own indexing rules. Treat them as references unless independently reconciled.',
    links: [
      { label: 'RuneScan', href: 'https://runescan.io' },
      { label: 'ViewBlock THORChain', href: 'https://viewblock.io/thorchain' },
      { label: 'Messari THORChain Reports', href: 'https://messari.io/project/thorchain' },
      { label: 'THORChain GitHub', href: 'https://github.com/thorchain' },
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
        A source map for official docs, developer references, live APIs, historical records, and external analytics. Pick sources by the kind of claim you need to make.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{section.title}</h2>
            <p className="mb-2 text-xs leading-relaxed text-slate-500">{section.use}</p>
            <p className="mb-3 text-xs leading-relaxed text-amber-300/80">{section.caveat}</p>
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
