'use client';

import Link from 'next/link';

const footerLinks = [
  { label: 'Protocol', href: '/protocol' },
  { label: 'Network', href: '/network' },
  { label: 'Economics', href: '/economics' },
  { label: 'Ecosystem', href: '/ecosystem' },
  { label: 'Governance', href: '/governance' },
  { label: 'Statistics', href: '/stats' },
];

const resourceLinks = [
  { label: 'Official Docs', href: 'https://docs.thorchain.org' },
  { label: 'Dev Docs', href: 'https://dev.thorchain.org' },
  { label: 'Midgard API', href: 'https://midgard.ninerealms.com/v2/doc' },
  { label: 'RuneScan', href: 'https://runescan.io' },
  { label: 'ViewBlock', href: 'https://viewblock.io/thorchain' },
  { label: 'THORSwap', href: 'https://app.thorswap.finance' },
  { label: 'AsgardEX', href: 'https://www.asgardex.com' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              THORChain Wiki
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Comprehensive encyclopedia of THORChain protocol, data, and ecosystem.
              Built with ultrawork for maximum knowledge aggregation.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Navigation
            </h3>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://discord.gg/c4EhDZdFMA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/thorchain_org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Telegram
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/thorchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://reddit.com/r/thorchainofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Reddit
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            © 2025 THORChain Wiki. Data aggregated from official sources.
          </p>
          <p className="mt-2">
            Powered by{' '}
            <a
              href="https://thorchain.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              THORChain Protocol
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}