import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { TOKENOMICS_RECORDS } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { getTokenomicsToneBadgeVariant, getTokenomicsToneLabel } from '@/lib/trust';

export const metadata = createRouteMetadata({
  title: 'RUNE | THORChain Wiki',
  description: 'Source-backed overview of RUNE as THORChain settlement, bond, liquidity, and tokenomics asset.',
  path: '/rune',
});

const entry = getContentEntry('rune');
const supplyRecord = TOKENOMICS_RECORDS.find((record) => record.data.id === 'rune-supply-framing') ?? TOKENOMICS_RECORDS[0];

const runeRelatedChecks: RelatedCheck[] = [
  {
    label: 'RUNE settlement deep dive',
    href: '/deep-dives/rune-settlement',
    badge: 'deep dive',
    description: 'Read the long-form settlement-asset explanation before using RUNE as a protocol model.',
  },
  {
    label: 'Swap Economics',
    href: '/deep-dives#deep-dive-path-swap-economics',
    badge: 'path',
    description: 'Connect RUNE settlement to CLP pricing, incentives, and security costs.',
  },
  {
    label: 'Stats decision panel',
    href: '/stats#stats-look-here-first',
    badge: 'live state',
    description: 'Check current pooled RUNE, reserve, node, and earnings-source health.',
  },
  {
    label: 'Official source map',
    href: '/docs#official-protocol-documentation',
    badge: 'proof',
    description: 'Use official docs for dated tokenomics framing and source boundaries.',
  },
];

export default function RunePage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">RUNE Token</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        RUNE is the native asset used for settlement, liquidity pairing, economic security, and protocol accounting.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'RUNE roles in settlement, liquidity pairing, node bonding, and protocol accounting.',
          'Source-backed tokenomics framing that should remain dated when figures are quoted.',
        ]}
        verifyBeforeClaiming={[
          'Current price, circulating balances, reserve balances, emissions, or market conclusions.',
          'Current minimum bond, slash parameters, Mimir overrides, or investment suitability.',
        ]}
      />
      <RelatedChecks
        checks={runeRelatedChecks}
        className="mb-12"
        title="Continue From Here"
        description="Move from the token overview into settlement mechanics, live network numbers, or official source boundaries before making current RUNE claims."
        badgeLabel="claim path"
      />

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">What is RUNE?</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { title: 'Settlement Asset', desc: 'Every external-asset swap routes through RUNE liquidity, for example BTC to RUNE to ETH.' },
          { title: 'Security Bond', desc: 'Node operators bond RUNE to secure vaults and participate in signing. Minimums and slash settings are current-only constants/Mimir facts.' },
          { title: 'Liquidity Pair', desc: 'Pools pair RUNE with external assets, creating a unified liquidity layer rather than isolated asset pairs.' },
          { title: 'Governance Context', desc: 'Operational governance is primarily node/Mimir driven. ADRs and TIPs document protocol changes; avoid treating all RUNE holders as direct voters.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Token Economics</h2>
      <p className="mb-4 text-sm text-slate-400">
        {supplyRecord.data.summary} Recheck live/source data before quoting exact balances.
      </p>
      <div className="mb-4">
        <FreshnessMeta freshness={supplyRecord.freshness} sources={supplyRecord.sources} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {supplyRecord.data.figures.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-right">{row.value}</span>
            <Badge variant={getTokenomicsToneBadgeVariant(row.tone)}>{getTokenomicsToneLabel(row.tone)}</Badge>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">How RUNE Flows</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">1. Swaps</h3>
          <p className="text-xs text-slate-400">A swap routes through RUNE-paired pools. RUNE acts as the common settlement layer between native assets.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">2. Liquidity</h3>
          <p className="text-xs text-slate-400">Liquidity providers supply pool depth and earn source-dependent fees and rewards according to current protocol rules.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">3. Security</h3>
          <p className="text-xs text-slate-400">Node operators bond RUNE. Misbehavior can put that bond at risk through slash mechanisms and churn rules.</p>
        </Card>
      </div>
    </PageContainer>
  );
}
