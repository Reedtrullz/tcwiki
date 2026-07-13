import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { getTokenomicsRecord } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import { recordAnchor } from '@/lib/utils';
import { TcyControlsPanel } from './TcyControlsPanel';

export const metadata = createRouteMetadata({
  title: 'TCY And THORFi History | THORChain Wiki',
  description: 'Historical, source-backed context for TCY, deprecated Savers/Lending, THORFi unwind, and recovery framing.',
  path: '/tcy',
});

const entry = getContentEntry('tcy');

const tcyRecord = getTokenomicsRecord('tcy-recovery-context');
const tcyAnchor = recordAnchor('tokenomics', tcyRecord.data.id);

const tcyRelatedChecks: RelatedCheck[] = [
  {
    label: 'Current TCY controls',
    href: '/tcy#tcy-current-controls',
    badge: 'live state',
    description: 'Check current TCY halt controls before making claim, stake, distribution, unstake, or trading availability claims.',
  },
  {
    label: 'TCY timeline',
    href: '/deep-dives/tcy-recovery-timeline#what-to-check-now',
    badge: 'deep dive',
    description: 'Read the dated THORFi unwind and TCY recovery-token timeline before making current claims.',
  },
  {
    label: 'Recovery tracker',
    href: '/governance#current-recovery',
    badge: 'review',
    description: 'Check records explicitly tagged as current or needing current recovery review.',
  },
  {
    label: 'Historical source map',
    href: '/docs#historical-features-and-recovery',
    badge: 'proof',
    description: 'Separate archived feature context from present-day product availability.',
  },
  {
    label: 'Recovery claim checks',
    href: '/governance#governance-claim-checks',
    badge: 'router',
    description: 'Route TCY, exploit recovery, incident, and current-state claims through the right proof path.',
  },
];

const tcyDecisionRows = [
  {
    question: 'Was THORFi still available after the unwind?',
    answer: 'No current-product claim from this page.',
    evidence: 'Use archived Savers/Lending docs for historical mechanics and deprecation context.',
    boundary: 'Do not turn historical mechanics into current deposit, borrow, or yield instructions.',
  },
  {
    question: 'What does TCY represent?',
    answer: 'Recovery-token framing for defaulted THORFi claims.',
    evidence: 'Official TCY sources describe debt conversion into TCY and a 10% system-income share for stakers.',
    boundary: 'Do not describe TCY as governance power, a guaranteed redemption claim, or financial advice.',
  },
  {
    question: 'Can a reader claim, stake, or trade TCY right now?',
    answer: 'Treat as current-only.',
    evidence: 'Check official claim/interface sources and live TCY Mimir controls before making availability claims.',
    boundary: 'Do not infer live availability from old launch or tokenomics pages alone.',
  },
  {
    question: 'Did TCY fully recover creditors?',
    answer: 'Not proven here.',
    evidence: 'Developer docs state full debt recovery is market dependent and not guaranteed.',
    boundary: 'Do not claim par recovery, price outcome, or completeness without separate dated evidence.',
  },
];

export default function TCYPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">TCY, Savers, and THORFi History</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        Savers and Lending are historical THORFi features. Official archived docs say they are deprecated
        and no longer available; TCY is the recovery-token framing that followed the unwind.
      </p>
      <RouteSourcePosture
        entry={entry}
        className="mb-6"
        useFor={[
          'Historical THORFi, Savers, Lending, unwind, and TCY recovery-token context.',
          'Deprecated-product warnings and source-backed recovery framing.',
        ]}
        verifyBeforeClaiming={[
          'Current TCY claiming, staking, pause state, redemption value, or recovery outcome.',
          'Any current product availability or deposit/borrowing instruction.',
        ]}
      />
      <RelatedChecks
        checks={tcyRelatedChecks}
        className="mb-8"
        title="Continue From Here"
        description="Use this historical page with the recovery tracker and source map before making any current TCY, Savers, Lending, or recovery-status claim."
        badgeLabel="claim path"
      />

      <TcyControlsPanel />

      <div id={tcyAnchor} className="mb-12 scroll-mt-24 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="warning">Historical</Badge>
          <Badge variant="danger">Deprecated products</Badge>
          <Badge variant="info">Recovery not guaranteed</Badge>
        </div>
        <p className="text-sm text-slate-300">
          {tcyRecord.data.summary} Do not treat Savers or Lending as active yield products.
        </p>
        <div className="mt-3">
          <FreshnessMeta freshness={tcyRecord.freshness} sources={tcyRecord.sources} compact />
        </div>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Reader Decision Matrix</h2>
      <div className="grid grid-cols-1 gap-3 mb-12 lg:grid-cols-2">
        {tcyDecisionRows.map((row) => (
          <Card key={row.question} padding="sm">
            <h3 className="text-sm font-semibold text-slate-200">{row.question}</h3>
            <p className="mt-2 text-xs font-semibold text-accent">{row.answer}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{row.evidence}</p>
            <p className="mt-2 text-xs leading-relaxed text-amber-300">{row.boundary}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Historical Timeline</h2>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-400">
        For the source-backed date sequence, use the{' '}
        <Link href="/deep-dives/tcy-recovery-timeline" className="text-accent underline-offset-4 hover:underline">
          TCY Recovery Timeline
        </Link>
        . This page keeps the quick decision matrix visible; the deep dive separates THORFi/TCY debt recovery from later post-exploit recovery records.
      </p>
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
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">What Changed</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card className="border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-300 mb-2">Savers and Lending</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>Archived docs mark both features as deprecated and no longer available.</li>
            <li>Historical mechanics are useful for understanding THORFi, but they are not current deposit instructions.</li>
            <li>Current claim, stake, and pause state must come from live protocol sources.</li>
          </ul>
        </Card>
        <Card className="border-accent/20">
          <h3 className="text-sm font-semibold text-accent mb-2">TCY</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>TCY is the recovery-token context for the THORFi unwind.</li>
            <li>Supply, claiming, and staking details should be dated and source-linked.</li>
            <li>The wiki should avoid financial or recovery-value advice.</li>
          </ul>
        </Card>
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Sources</h2>
      <div className="mb-4">
        <FreshnessMeta freshness={tcyRecord.freshness} sources={tcyRecord.sources} />
      </div>
      <div className="flex flex-wrap gap-2">
        {tcyRecord.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
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
