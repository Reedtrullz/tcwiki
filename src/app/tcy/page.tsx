import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageSourcePosture } from '@/components/features/PageSourcePosture';
import { PageTableOfContents, type TocItem } from '@/components/layout/PageTableOfContents';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { getTokenomicsRecord } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';

import { TcyControlsPanel } from './TcyControlsPanel';

export const metadata = createRouteMetadata({
  title: 'TCY And THORFi History | THORChain Wiki',
  description: 'Historical, source-backed context for TCY, deprecated Savers/Lending, THORFi unwind, and recovery framing.',
  path: '/tcy',
});

const entry = getContentEntry('tcy');

const tcyToc: TocItem[] = [
  { id: 'tcy-history', label: 'What happened' },
  { id: 'tcy-decision-matrix', label: 'Decision matrix' },
  { id: 'tcy-timeline', label: 'Historical timeline' },
  { id: 'tcy-what-changed', label: 'What changed' },
  { id: 'tcy-controls', label: 'Current controls' },
  { id: 'tcy-sources', label: 'Sources' },
];

const tcyRecord = getTokenomicsRecord('tcy-recovery-context');

const tcyRelatedChecks: RelatedCheck[] = [
  {
    label: 'Current TCY controls',
    href: '/tcy#tcy-controls',
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
    answer: 'No; THORFi was deprecated after the unwind.',
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
    answer: 'Check the live TCY controls first.',
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

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-10">
        <div className="min-w-0">
      <PageSourcePosture
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

      <div id="tcy-history" className="mb-12 scroll-mt-24 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="warning">Historical</Badge>
        </div>
        <p className="text-sm text-slate-300">
          {tcyRecord.data.summary}
        </p>
      </div>

      <SectionHeader id="tcy-decision-matrix" level="primary">Reader Decision Matrix</SectionHeader>
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

      <SectionHeader id="tcy-timeline" level="primary">Historical Timeline</SectionHeader>
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
            desc: 'TCY materials describe claims being dollarized for recovery accounting.',
          },
          {
            title: 'Archived products',
            desc: 'Official docs preserve Savers and Lending content for historical reference.',
          },
        ].map((card) => (
          <Card key={card.title}>
            <h3 className="text-sm font-semibold mb-1.5">{card.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{card.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader id="tcy-what-changed" level="primary">What Changed</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        <Card>
          <h3 className="text-sm font-semibold text-slate-100 mb-2">Savers and Lending</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>Archived docs mark both features as deprecated and no longer available.</li>
            <li>Historical mechanics document how these THORFi features operated during the unwind.</li>
            <li>Current claim, stake, and pause state must come from live protocol sources.</li>
          </ul>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-slate-100 mb-2">TCY</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li>TCY is the recovery-token context for the THORFi unwind.</li>
            <li>Supply, claiming, and staking details are recorded with dated source links.</li>
            <li>Full creditor recovery remains a separate dated-evidence question.</li>
          </ul>
        </Card>
      </div>

            <section id="tcy-controls" className="mb-12 scroll-mt-24">
        <details className="rounded-lg border border-border bg-surface-elevated px-4 py-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
            Current TCY / THORFi controls
          </summary>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-400">
            Live claiming, staking, pause, and redemption state. Open when you need present-tense control evidence.
          </p>
          <div className="mt-3">
            <TcyControlsPanel />
          </div>
        </details>
      </section>

      <SectionHeader id="tcy-sources" level="primary">Sources</SectionHeader>
      <div className="mb-4">
        <FreshnessMeta freshness={tcyRecord.freshness} sources={tcyRecord.sources} />
      </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[72px]">
            <PageTableOfContents items={tcyToc} />
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
