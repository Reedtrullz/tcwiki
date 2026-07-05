import { CHAIN_RECORDS, STATIC_DATA_LAST_UPDATED } from '@/lib/data/static';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';

export const metadata = createRouteMetadata({
  title: 'THORChain Protocol Overview | THORChain Wiki',
  description: 'Source-backed overview of THORChain architecture, native swaps, Bifrost, TSS vaults, Mimir, and supported-chain context.',
  path: '/protocol',
});

const entry = getContentEntry('protocol');

const protocolRelatedChecks: RelatedCheck[] = [
  {
    label: 'New to THORChain',
    href: '/deep-dives#deep-dive-path-new-to-thorchain',
    badge: 'path',
    description: 'Read settlement, pools, Bifrost, and TSS in the recommended order.',
  },
  {
    label: 'Network diagnostics',
    href: '/network#network-diagnostics',
    badge: 'live state',
    description: 'Check current halts, signing, LP controls, and source warnings.',
  },
  {
    label: 'Current source map',
    href: '/docs#current-protocol-state',
    badge: 'proof',
    description: 'Use THORNode/Midgard evidence for current operational claims.',
  },
  {
    label: 'Build/query path',
    href: '/search?q=Midgard%20API&filter=task',
    badge: 'task',
    description: 'Find API and endpoint guidance for developer or data-query work.',
  },
];

export default function ProtocolPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Protocol Overview</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        THORChain is a decentralized cross-chain liquidity protocol for native asset swaps without wrapped assets or centralized custody.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'Architecture concepts, swap lifecycle, Bifrost, TSS, Mimir, and supported-chain context.',
          'Dated educational framing for how THORChain components fit together.',
        ]}
        verifyBeforeClaiming={[
          'Current halt, signing, inbound-address, gas-rate, or Mimir state.',
          'Exact live constants, minimum bond, slash settings, or current chain availability.',
        ]}
      />
      <RelatedChecks
        checks={protocolRelatedChecks}
        className="mb-12"
        title="Continue From Here"
        description="Move from the protocol overview into the right deeper read or live-source check before making an availability, implementation, or developer claim."
        badgeLabel="claim path"
      />

      <SectionHeader>Architecture</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { title: 'Cosmos SDK', desc: 'THORChain runs its own app-chain with Tendermint-style consensus and protocol modules for swaps, pools, vaults, and Mimir.' },
          { title: 'TSS Vaults', desc: 'Threshold Signature Schemes distribute vault control across node operators. Current cryptography details should be tied to dated protocol sources.' },
          { title: 'Bifrost', desc: 'Nodes observe external-chain transactions and report them into the THORChain state machine.' },
          { title: 'Midgard + THORNode', desc: 'Midgard serves analytics and history. THORNode is the source for live operational state such as Mimir, constants, and inbound addresses.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Current-State Controls</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {[
          { title: 'Mimir', desc: 'Mimir parameters can pause trading, signing, LP actions, churning, TCY claims, RUNEPool, and other protocol behavior. Display these as current-only live data.' },
          { title: 'Network Halts', desc: 'Halts can be chain-specific or global. Interfaces should monitor halt flags before presenting swaps, LP actions, or signing state as available.' },
          { title: 'Inbound Addresses', desc: 'Routers, gas rates, chain pause flags, and inbound availability are live THORNode facts, not static wiki facts.' },
          { title: 'Constants vs Overrides', desc: 'Constants describe defaults; Mimir can override them. Current minimum bond or slash settings require reading both sources.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Swap Lifecycle</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Inbound', desc: 'A user sends a native asset to the current inbound address with a memo describing the intended action.' },
          { title: 'Execution', desc: 'The state machine prices the swap through RUNE-paired pools, applying slip/liquidity fees and current protocol rules.' },
          { title: 'Outbound or Refund', desc: 'Nodes sign the outbound transaction when signing is available; invalid or impossible transactions can refund according to protocol rules.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Key Concepts</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-12">
        {[
          { title: 'RUNE Settlement', desc: 'Every external-asset swap routes through RUNE liquidity, making RUNE the common settlement and bond asset.' },
          { title: 'Continuous Liquidity Pools', desc: 'Slip-based pricing makes larger trades pay proportionally more, protecting liquidity providers from depth-consuming trades.' },
          { title: 'App Layer and CosmWasm', desc: 'Permissioned CosmWasm contracts and secured/trade-asset concepts extend protocol functionality without changing core custody assumptions.' },
          { title: 'Minimal Governance', desc: 'Node operators and Mimir handle operational parameters; ADRs/TIPs document changes. Avoid saying ordinary RUNE holders directly govern every protocol decision.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Supported Chains</SectionHeader>
      <p className="text-sm text-slate-400 mb-4">
        This curated list mirrors chains observed in live inbound-address sources as of the {STATIC_DATA_LAST_UPDATED} review. Availability and pause state remain live/current-only.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {CHAIN_RECORDS.map((record) => {
          const chain = record.data;
          const anchor = recordAnchor('chain', chain.chain);
          return (
            <Card key={chain.chain} id={anchor} padding="sm" className="scroll-mt-24 text-center">
              <p className="text-sm font-medium">{chain.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">{chain.chain}</p>
              <Badge variant={chain.supported ? 'success' : 'warning'} className="mt-2">
                {chain.supported ? 'listed' : 'needs review'}
              </Badge>
              {chain.statusNote ? (
                <p className="mt-2 text-left text-[11px] leading-relaxed text-slate-400">
                  {chain.statusNote}
                </p>
              ) : null}
              <div className="mt-2 text-left">
                <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
              </div>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
