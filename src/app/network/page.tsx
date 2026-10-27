import { connection } from 'next/server';
import Link from 'next/link';
import ThornodeAPI, { createThornodeCollectionContext, reassessThornodeResult } from '@/lib/api/thornode';
import { liveDegraded } from '@/lib/trust';
import { THORNODE_PROVIDER_DEFAULTS } from '../../../scripts/lib/thornode-data-policy.mjs';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import NetworkPageClient from './NetworkPageClient';

const entry = getContentEntry('network');

export const metadata = createRouteMetadata({
  title: `${entry.title} | THORChain Wiki`,
  description: entry.description,
  path: entry.href,
});

export default async function NetworkPage() {
  // Installed Next/vinext connection() excludes this nonce-bearing page from static caching.
  await connection();
  let initialStatusResult: LiveDataResult<NetworkStatus>;
  try {
    initialStatusResult = reassessThornodeResult(await ThornodeAPI.getNetworkStatus(createThornodeCollectionContext()));
  } catch {
    initialStatusResult = liveDegraded<NetworkStatus>('The server could not retrieve an operational sample. Use the primary sources below or refresh after enabling JavaScript.', THORNODE_PROVIDER_DEFAULTS.map(({ label, url }) => ({ label, url })));
  }
  return (
    <NetworkPageClient initialStatusResult={initialStatusResult}>
      <PageSourcePosture
        entry={entry}
        className="mb-12"
        useFor={[
          'Current operational diagnostics, halt controls, node/security concepts, and source-warning posture.',
          'Separating live THORNode/Midgard evidence from dated security reports and static protocol explanations.',
        ]}
        verifyBeforeClaiming={[
          'That a paused operation, chain, signing path, LP action, TCY control, or app-layer feature is available right now.',
          'That historical incident reports prove present-day safety, solvency, signing availability, or route quality.',
        ]}
      />
      <noscript>
        <section aria-labelledby="without-javascript-heading" className="mb-8 rounded border border-border bg-surface-elevated p-4 text-sm text-slate-300">
          <h2 id="without-javascript-heading" className="font-semibold text-slate-100">Network evidence without JavaScript</h2>
          <p className="mt-2">The operation summary is one server-retrieved sample, checked at {initialStatusResult.checkedAt}. It will not refresh here. Treat it as dated context; it cannot prove that a route will execute.</p>
          <p className="mt-2">Interactive quotes and browser refresh require JavaScript. Read the primary public sources or continue with reference material.</p>
          <ul className="mt-2 space-y-1">
            {THORNODE_PROVIDER_DEFAULTS.map(({ label, url }) => <li key={url}><a href={`${url}/mimir`} rel="noopener noreferrer" className="text-accent underline">{label} current controls</a></li>)}
          </ul>
          <div className="mt-3 flex flex-wrap gap-4"><Link href="/docs#current-protocol-state" className="text-accent underline">Source map</Link><Link href="/deep-dives/mimir-halt-controls" className="text-accent underline">Read the halt guide</Link></div>
          <form action="/search" method="get" className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-xs">Search reference material<input type="search" name="q" maxLength={256} className="ml-2 rounded border border-border bg-surface p-2 text-slate-100" /></label>
            <button type="submit" className="rounded border border-border px-3 py-2 text-accent">Search</button>
          </form>
        </section>
      </noscript>
    </NetworkPageClient>
  );
}
