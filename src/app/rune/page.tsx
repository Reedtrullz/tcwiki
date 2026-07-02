import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import type { FreshnessMeta as FreshnessMetaType, SourceMeta } from '@/lib/types';
import { createRouteMetadata } from '@/lib/metadata';

export const metadata = createRouteMetadata({
  title: 'RUNE | THORChain Wiki',
  description: 'Source-backed overview of RUNE as THORChain settlement, bond, liquidity, and tokenomics asset.',
  path: '/rune',
});

const supplyFreshness: FreshnessMetaType = {
  checkedAt: '2026-06-18',
  confidence: 'official',
  nextReviewDue: '2026-07-18',
};

const supplySources: SourceMeta[] = [
  {
    label: 'RUNE and TCY tokenomics',
    url: 'https://docs.thorchain.org/tokenomics-rune-tcy',
  },
];

export default function RunePage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">RUNE Token</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        RUNE is the native asset used for settlement, liquidity pairing, economic security, and protocol accounting.
      </p>

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
            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Token Economics</h2>
      <p className="mb-4 text-sm text-slate-500">
        The original cap context was 500M RUNE, but current official tokenomics emphasizes a reduced supply near
        425M, circulating supply near 350M, reserve near 75M, and ongoing burns. Recheck live/source data before
        quoting exact balances.
      </p>
      <div className="mb-4">
        <FreshnessMeta freshness={supplyFreshness} sources={supplySources} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { label: 'Original Cap Context', value: '500M RUNE', badge: 'historical' },
          { label: 'Current Supply Framing', value: '~425M and burning', badge: 'source-backed' },
          { label: 'Circulating Supply', value: '~350M source figure', badge: 'source-backed' },
          { label: 'Reserve', value: '~75M source figure', badge: 'source-backed' },
          { label: 'Network Income', value: 'Fees, emissions, burns, TCY share', badge: 'dynamic' },
          { label: 'Bond Requirement', value: 'Check constants + Mimir', badge: 'current-only' },
          { label: 'Slash Penalty', value: 'Check constants + Mimir', badge: 'current-only' },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-right">{row.value}</span>
            <Badge variant={row.badge === 'historical' ? 'info' : 'warning'}>{row.badge}</Badge>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">How RUNE Flows</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">1. Swaps</h3>
          <p className="text-xs text-slate-500">A swap routes through RUNE-paired pools. RUNE acts as the common settlement layer between native assets.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">2. Liquidity</h3>
          <p className="text-xs text-slate-500">Liquidity providers supply pool depth and earn source-dependent fees and rewards according to current protocol rules.</p>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-accent mb-2">3. Security</h3>
          <p className="text-xs text-slate-500">Node operators bond RUNE. Misbehavior can put that bond at risk through slash mechanisms and churn rules.</p>
        </Card>
      </div>
    </PageContainer>
  );
}
