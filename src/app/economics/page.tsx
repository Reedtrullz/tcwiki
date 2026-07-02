import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { TOKENOMICS_RECORDS } from '@/lib/data/static';
import { createRouteMetadata } from '@/lib/metadata';
import { getTokenomicsToneBadgeVariant, getTokenomicsToneLabel } from '@/lib/trust';

export const metadata = createRouteMetadata({
  title: 'THORChain Economics | THORChain Wiki',
  description: 'Source-backed THORChain economics covering RUNE settlement, CLP pricing, fees, incentive pendulum, RUNEPool, and protocol-owned liquidity.',
  path: '/economics',
});

const supplyRecord = TOKENOMICS_RECORDS.find((record) => record.data.id === 'rune-supply-framing') ?? TOKENOMICS_RECORDS[0];

export default function EconomicsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Economics & Tokenomics</h1>
      <p className="text-slate-400 max-w-3xl mb-12">
        RUNE settlement, CLP pricing, fees, incentive design, RUNEPool/POL, trade assets, and current-only protocol parameters.
      </p>

      <SectionHeader>RUNE Token</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Settlement Asset', desc: 'External-asset swaps route through RUNE-paired liquidity, which keeps the liquidity graph simple and shared.' },
          { title: 'Security Bond', desc: 'Node operators bond RUNE to participate. Bond size, minimum bond, and slash parameters should be checked from live constants and Mimir.' },
          { title: 'Protocol Governance Context', desc: 'THORChain governance is intentionally minimal. Node operators and Mimir govern operational parameters; ADRs/TIPs document changes.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Supply & Emission</SectionHeader>
      <p className="mb-4 text-sm text-slate-400">
        {supplyRecord.data.summary} Treat these as dated/source-backed figures, not hard-coded live balances.
      </p>
      <div className="mb-4">
        <FreshnessMeta freshness={supplyRecord.freshness} sources={supplyRecord.sources} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {supplyRecord.data.figures.slice(0, 5).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-surface-elevated border border-border">
            <span className="text-xs text-slate-400">{row.label}</span>
            <span className="text-sm font-semibold text-right">{row.value}</span>
            <Badge variant={getTokenomicsToneBadgeVariant(row.tone)}>{getTokenomicsToneLabel(row.tone)}</Badge>
          </div>
        ))}
      </div>

      <SectionHeader>Fee Structure</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {[
          { fee: 'Inbound Gas', rate: 'Chain-specific', desc: 'External-chain gas paid by the user when sending inbound transactions.' },
          { fee: 'Liquidity / Slip Fee', rate: 'Dynamic', desc: 'Scaled by trade size relative to pool depth; protects liquidity providers.' },
          { fee: 'Affiliate Fee', rate: 'Optional', desc: 'Interface- or affiliate-defined fee when a memo includes an affiliate basis-point setting.' },
          { fee: 'Outbound Fee', rate: 'Dynamic', desc: 'Covers outbound gas and protocol fee logic. Gas rate and minimums are live values.' },
        ].map((fee) => (
          <Card key={fee.fee}>
            <h3 className="text-sm font-semibold mb-2">{fee.fee}</h3>
            <p className="text-xl font-bold text-accent mb-1">{fee.rate}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{fee.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Incentive Pendulum</SectionHeader>
      <p className="mb-4 text-sm text-slate-400">
        The pendulum allocates the node/LP share of network revenue based on the network&apos;s bond-to-liquidity posture.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card className="border-rune/20">
          <h3 className="text-sm font-semibold text-rune mb-2">Low bond security</h3>
          <p className="text-xs text-slate-400">When the network needs more security relative to liquidity, rewards shift toward node operators.</p>
        </Card>
        <Card className="border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">Low pooled liquidity</h3>
          <p className="text-xs text-slate-400">When the network needs more depth, rewards shift toward liquidity providers.</p>
        </Card>
      </div>

      <SectionHeader>RUNEPool, POL, and Trade Assets</SectionHeader>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'RUNEPool', desc: 'RUNEPool lets RUNE providers participate in protocol-owned liquidity. Enabled state, provider balances, and PnL are live THORNode facts.' },
          { title: 'Protocol-Owned Liquidity', desc: 'POL changes protocol exposure and should be described with current-only balances and source labels.' },
          { title: 'Trade Assets', desc: 'Trade/secured assets are protocol accounting concepts. Enablement and halt state should be read from Mimir and docs before current claims.' },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>CLP Formula</SectionHeader>
      <Card className="font-mono text-xs text-slate-400 space-y-1">
        <p><span className="text-accent">Slip Ratio:</span> slip = x / (X + x), where x is input and X is input-side pool depth</p>
        <p><span className="text-accent">Liquidity Fee:</span> fee = (x^2 * Y) / (x + X)^2, denominated in the output asset</p>
        <p><span className="text-accent">Output Amount:</span> y = (x * X * Y) / (x + X)^2, where Y is output-side pool depth</p>
      </Card>
    </PageContainer>
  );
}
