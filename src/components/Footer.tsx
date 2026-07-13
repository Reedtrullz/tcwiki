import Link from 'next/link';
import { STATIC_DATA_LAST_UPDATED } from '@/lib/data/static';
import { FOOTER_NAV_ITEMS } from '@/lib/content/registry';

const officialSourceLinks = [
  {
    label: 'THORChain Docs',
    href: 'https://docs.thorchain.org',
    description: 'Official protocol documentation.',
  },
  {
    label: 'Developer Docs',
    href: 'https://dev.thorchain.org',
    description: 'Official builder docs and API guidance.',
  },
  {
    label: 'Midgard API',
    href: 'https://midgard.thorchain.network/v2/doc',
    description: 'Official indexed dashboard API docs.',
  },
];

const thirdPartyResourceLinks = [
  {
    label: 'Gateway API',
    href: 'https://gateway.liquify.com/chain/thorchain_midgard/v2',
    description: 'Third-party gateway; verify provider and data-source posture before using it as evidence.',
    verifyLabel: 'Review data-source guide',
    verifyHref: '/deep-dives/midgard-thornode-data',
    externalLabel: 'Open Gateway API',
  },
  {
    label: 'RuneScan',
    href: 'https://runescan.io',
    description: 'Explorer surface; useful context, not protocol canon or route-availability proof.',
    verifyLabel: 'Review explorer posture',
    verifyHref: '/docs#external-analytics-and-explorers',
    externalLabel: 'Open RuneScan',
  },
  {
    label: 'THORSwap',
    href: 'https://app.thorswap.finance',
    description: 'Interface surface; verify route, recipient, fees, wallet permissions, and app state before signing.',
    verifyLabel: 'Review interface checklist',
    verifyHref: '/ecosystem#interface-use-checklist',
    externalLabel: 'Open THORSwap',
  },
];

const trustLinks = [
  {
    label: 'Source map',
    href: '/docs#source-map-chooser',
    description: 'Match source to claim.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    description: 'Check live operational state.',
  },
  {
    label: 'Interface checklist',
    href: '/ecosystem#interface-use-checklist',
    description: 'Review third-party app boundaries.',
  },
  {
    label: 'Guided answers',
    href: '/search#search-guided-answers',
    description: 'Start from common tasks and reader paths.',
  },
];

const communityLinks = [
  { label: 'Discord', href: 'https://discord.com/invite/thorchaincommunity' },
  { label: 'Twitter', href: 'https://x.com/thorchain_org' },
  { label: 'Telegram', href: 'https://t.me/thorchain_org' },
  { label: 'Reddit', href: 'https://reddit.com/r/THORChain' },
  { label: 'GitHub', href: 'https://github.com/thorchain' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-xs font-mono">⬡</span>
              </div>
              <span className="text-sm font-semibold">THORChain Wiki</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Community-maintained encyclopedia of THORChain protocol,
              data, and ecosystem.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Navigate</h3>
            <ul className="space-y-2">
              {FOOTER_NAV_ITEMS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="rounded-sm text-sm text-slate-400 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Verify First</h3>
            <ul className="space-y-3">
              {trustLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="group block rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                    <span className="block text-sm text-slate-400 group-hover:text-slate-300">{l.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{l.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Official Sources/APIs</h3>
            <ul className="space-y-3">
              {officialSourceLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="group block rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                    <span className="block text-sm text-slate-400 group-hover:text-slate-300">{l.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{l.description}</span>
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Third-Party Surfaces</h3>
            <ul className="space-y-3">
              {thirdPartyResourceLinks.map((l) => (
                <li key={l.href}>
                  <div className="rounded-sm">
                    <span className="block text-sm text-slate-400">{l.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{l.description}</span>
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      <Link href={l.verifyHref} className="rounded-sm text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
                        {l.verifyLabel}
                      </Link>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${l.label} externally`}
                        className="rounded-sm text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                      >
                        {l.externalLabel}
                      </a>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Community</h3>
            <ul className="space-y-2">
              {communityLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-sm text-sm text-slate-400 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p>Live data is current-only from Midgard/THORNode sources. Page and record review dates are authoritative; {STATIC_DATA_LAST_UPDATED} is only the base static-catalog baseline. Not affiliated with THORChain.</p>
          <p>© {new Date().getFullYear()} THORChain Wiki</p>
        </div>
      </div>
    </footer>
  );
}
