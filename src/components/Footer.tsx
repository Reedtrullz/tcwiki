import Link from 'next/link';

const navLinks = [
  { label: 'Protocol', href: '/protocol' },
  { label: 'Network', href: '/network' },
  { label: 'Economics', href: '/economics' },
  { label: 'Ecosystem', href: '/ecosystem' },
  { label: 'Governance', href: '/governance' },
  { label: 'Stats', href: '/stats' },
  { label: 'Docs', href: '/docs' },
];

const resourceLinks = [
  { label: 'THORChain Docs', href: 'https://docs.thorchain.org' },
  { label: 'Developer Docs', href: 'https://dev.thorchain.org' },
  { label: 'Midgard API', href: 'https://midgard.thorchain.network/v2/doc' },
  { label: 'Gateway API', href: 'https://gateway.liquify.com/chain/thorchain_midgard/v2' },
  { label: 'RuneScan', href: 'https://runescan.io' },
  { label: 'THORSwap', href: 'https://app.thorswap.finance' },
];

const communityLinks = [
  { label: 'Discord', href: 'https://discord.gg/thorchain' },
  { label: 'Twitter', href: 'https://x.com/THORChain' },
  { label: 'Telegram', href: 'https://t.me/thorchain_org' },
  { label: 'Reddit', href: 'https://reddit.com/r/THORChain' },
  { label: 'GitHub', href: 'https://github.com/thorchain' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-xs font-mono">⬡</span>
              </div>
              <span className="text-sm font-semibold">THORChain Wiki</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Community-maintained encyclopedia of THORChain protocol,
              data, and ecosystem.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Navigate</h3>
            <ul className="space-y-2">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Community</h3>
            <ul className="space-y-2">
              {communityLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>Data from Midgard API via Liquify Gateway. Not affiliated with THORChain.</p>
          <p>© {new Date().getFullYear()} THORChain Wiki</p>
        </div>
      </div>
    </footer>
  );
}
