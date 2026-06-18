import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const sources = [
  { label: 'Archived Savers/Lending docs', href: 'https://docs.thorchain.org/thornodes/archived' },
  { label: 'TCY tokenomics', href: 'https://docs.thorchain.org/tokenomics-rune-tcy' },
  { label: 'TCY developer guide', href: 'https://dev.thorchain.org/concepts/tcy.html' },
];

export default function TCYPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">TCY, Savers, and THORFi History</h1>
      <p className="text-slate-400 max-w-3xl mb-8">
        Savers and Lending are historical THORFi features. Official archived docs say they are deprecated
        and no longer available; TCY is the recovery-token framing that followed the unwind.
      </p>

      <div className="mb-12 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="warning">Historical</Badge>
          <Badge variant="danger">Deprecated products</Badge>
        </div>
        <p className="text-sm text-slate-300">
          Do not treat Savers or Lending as active yield products. Current availability, TCY claiming, and
          staking state are live protocol facts and should be checked from THORNode/Mimir before making any
          current claim.
        </p>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Historical Timeline</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12">
        {[
          {
            title: 'THORFi suspended',
            desc: 'The THORFi lending and Savers era moved into unwind/recovery after liability concerns in January 2025.',
          },
          {
            title: 'Claims dollarized',
            desc: 'TCY materials describe claims being dollarized for recovery accounting. Treat exact claim status as current-only.',
          },
          {
            title: 'Archived products',
            desc: 'Official docs preserve Savers and Lending content for historical reference, not as current product guidance.',
          },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">What Changed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card className="border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-300 mb-2">Savers and Lending</h3>
          <ul className="space-y-2 text-xs text-slate-500">
            <li>Archived docs mark both features as deprecated and no longer available.</li>
            <li>Historical mechanics are useful for understanding THORFi, but they are not current deposit instructions.</li>
            <li>Current claim, stake, and pause state must come from live protocol sources.</li>
          </ul>
        </Card>
        <Card className="border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">TCY</h3>
          <ul className="space-y-2 text-xs text-slate-500">
            <li>TCY is the recovery-token context for the THORFi unwind.</li>
            <li>Supply, claiming, and staking details should be dated and source-linked.</li>
            <li>The wiki should avoid financial or recovery-value advice.</li>
          </ul>
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Sources</h2>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={source.href}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-slate-400 hover:border-accent/30 hover:text-slate-200 transition-colors"
          >
            {source.label}
          </a>
        ))}
      </div>
    </PageContainer>
  );
}
