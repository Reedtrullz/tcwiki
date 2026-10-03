import Link from 'next/link';
import { MIDGARD_ENDPOINTS } from '@/lib/api/midgard';
import { THORNODE_PROVIDER_DEFAULTS } from '../../../scripts/lib/thornode-data-policy.mjs';

export function ProviderRequestDisclosure({ variant }: { variant: 'quote' | 'diagnostic' }) {
  const quote = variant === 'quote';
  return (
    <div className="mt-3 text-xs leading-relaxed text-slate-400">
      <p id={quote ? 'quote-request-disclosure' : 'diagnostic-request-disclosure'}>
        {quote
          ? 'Clicking Check route sends the selected asset pair and amount to a configured THORNode provider (Liquify or THORChain), with the other as fallback. A quote is requested only when you submit.'
          : 'Public network reads go directly from your browser to Liquify and THORChain providers on page load, periodic refresh and Refresh source. They do not submit a transaction.'}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
          {quote ? 'What the quote request shares' : 'Network request destinations and local data'}
        </summary>
        <div className="mt-2 space-y-2 rounded border border-border bg-surface p-3">
          <p>{quote
            ? 'The GET /quote/swap query contains from_asset, to_asset and amount in 1e8 base units. This wiki does not send a destination address, wallet address, affiliate or signing credentials with that query.'
            : 'Operation reads request /mimir, /inbound_addresses, /version and /lastblock, with a requested height where applicable; the Cosmos endpoint supplies /base/tendermint/v1beta1/blocks/latest. Midgard supplies /network, /health and available /pools with a bounded period. These requests carry public endpoint parameters rather than your search text.'}</p>
          <ul className="space-y-1" aria-label={quote ? 'Quote provider destinations' : 'Network provider destinations'}>
            {THORNODE_PROVIDER_DEFAULTS.map(provider => (
              <li key={provider.url} className="break-all">
                <a href={provider.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">{provider.label}</a>: {provider.url}
                {!quote && <>; Cosmos block source: {provider.cosmosUrl}</>}
              </li>
            ))}
            {!quote && MIDGARD_ENDPOINTS.map(provider => (
              <li key={provider.url} className="break-all"><a href={provider.url} target="_blank" rel="noopener noreferrer" className="text-accent underline">{provider.label}</a>: {provider.url}</li>
            ))}
          </ul>
          <p>Providers receive your browser&apos;s network address and ordinary request metadata. The cross-origin referrer policy sends the wiki origin rather than this page&apos;s query or fragment.</p>
          <p>Your pair and amount also appear in this page&apos;s shareable URL; copying it shares those values. Search and filter text is processed locally, and opening a copied wiki URL sends its query to the wiki host. Source-map evidence packets contain the displayed source links and claim guidance; raw quote details contain the provider response. Review either before sharing.</p>
          <Link href="/docs#runtime-live-data-failover" className="inline-block text-accent underline">Source choices and failover boundaries</Link>
        </div>
      </details>
    </div>
  );
}
