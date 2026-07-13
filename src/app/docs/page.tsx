import Link from 'next/link';
import { PageContainer } from '@/components/layout/PageContainer';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { SourceMapExplorer } from '@/components/features/SourceMapExplorer';
import { SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { getContentEntry, SOURCE_CHOICE_DECISIONS } from '@/lib/content/registry';
import { createRouteMetadata } from '@/lib/metadata';
import type { SourceMapExplorerChoice, SourceMapExplorerDecision, SourceMapExplorerSection } from '@/lib/source-map-explorer';

export const metadata = createRouteMetadata({
  title: 'THORChain Source Map | THORChain Wiki',
  description: 'Source map for official THORChain docs, Midgard, THORNode, developer references, analytics, and historical protocol context.',
  path: '/docs',
});

const entry = getContentEntry('docs');

const sourceTriageChoices = [
  {
    id: 'current-state',
    label: 'Current state',
    question: 'Is something live, paused, quoteable, or enabled right now?',
    startWith: 'Network diagnostics',
    href: '/network#network-diagnostics',
    avoid: 'Durable uptime, future availability, or safety claims.',
  },
  {
    id: 'integration-docs',
    label: 'Integration docs',
    question: 'Are you explaining API behavior, fees, memos, or asset notation?',
    startWith: 'Developer Integration',
    href: '#developer-integration',
    avoid: 'Current halt or route availability without live evidence.',
  },
  {
    id: 'app-layer',
    label: 'App Layer',
    question: 'Is the claim about a contract, secured asset, or trade-account flow?',
    startWith: 'App Layer Claim Checks',
    href: '/deep-dives/app-layer#what-to-verify-before-claiming',
    avoid: 'Contract safety, wallet support, redemption capacity, or current availability from docs alone.',
  },
  {
    id: 'dynamic-fees',
    label: 'Dynamic fees',
    question: 'Is the claim about ADR-026, partner floors, or fee-revenue evidence?',
    startWith: 'Dynamic Fee Experiment',
    href: '#dynamic-fee-experiment',
    avoid: 'Durable revenue lift, route competitiveness, or attribution proof.',
  },
  {
    id: 'runepool-pol',
    label: 'RUNEPool/POL',
    question: 'Is the claim about RUNEPool value, PnL, POL scope, or action availability?',
    startWith: 'RUNEPool/POL Snapshot',
    href: '/economics#runepool-pol-live',
    avoid: 'Future yield, safety, route health, or deposits/withdrawals without live controls.',
  },
  {
    id: 'tcy-actions',
    label: 'TCY actions',
    question: 'Is the claim about claiming, staking, trading, or distributions right now?',
    startWith: 'Current TCY Controls',
    href: '/tcy#tcy-current-controls',
    avoid: 'User eligibility, recovery value, par redemption, or an official interface being live.',
  },
  {
    id: 'rune-numbers',
    label: 'RUNE numbers',
    question: 'Is the claim about RUNE supply, live metrics, security constants, price, or value?',
    startWith: 'RUNE Tokenomics And Value',
    href: '#rune-tokenomics-and-value',
    avoid: 'Price targets, fair value, market cap, exchange float, or investment suitability.',
  },
  {
    id: 'history-recovery',
    label: 'History and recovery',
    question: 'Is the claim about Savers, Lending, TCY, incidents, or recovery?',
    startWith: 'Historical Features',
    href: '#historical-features-and-recovery',
    avoid: 'Current solvency, product availability, or recovery completion.',
  },
  {
    id: 'third-party-surfaces',
    label: 'Third-party surfaces',
    question: 'Are you checking a wallet, interface, explorer, or SDK listing?',
    startWith: 'Interface Sources',
    href: '#third-party-interfaces-wallets',
    avoid: 'Wallet safety, app uptime, endorsement, or quote quality.',
  },
  {
    id: 'community-context',
    label: 'Community context',
    question: 'Are you looking for sentiment, debate, or implementation chatter?',
    startWith: 'Community Channels',
    href: '#community-channels',
    avoid: 'Canonical protocol proof or representative sentiment.',
  },
] satisfies SourceMapExplorerChoice[];

const sourceMapExplorerSections: SourceMapExplorerSection[] = SOURCE_MAP_SECTION_RECORDS.map((record) => ({
  id: record.data.id,
  title: record.data.title,
  decision: record.data.decision,
  use: record.data.use,
  caveat: record.data.caveat,
  claimExamples: record.data.claimExamples,
  nonClaims: record.data.nonClaims,
  linkLabels: record.data.links.flatMap((link) => [link.label, link.notes ?? '', link.url]),
}));

const sourceMapRecordsByAnchor = new Map(SOURCE_MAP_SECTION_RECORDS.map((record) => [record.data.id, record]));

function docsAnchorFromHref(href: string) {
  const [, hash] = href.split('#');
  if (!hash) {
    return null;
  }

  return hash;
}

function sourcePostureForDecision(decision: SourceMapExplorerDecision) {
  const candidateAnchors = [
    docsAnchorFromHref(decision.startWith.href),
    ...decision.nextChecks.map((check) => docsAnchorFromHref(check.href)),
  ].filter((anchor): anchor is string => anchor !== null);
  const record = candidateAnchors
    .map((anchor) => sourceMapRecordsByAnchor.get(anchor))
    .find((candidate) => candidate !== undefined);
  const primarySource = record?.sources[0];

  if (!record || !primarySource) {
    return undefined;
  }

  return {
    confidence: record.freshness.confidence,
    checkedAt: record.freshness.checkedAt,
    nextReviewDue: record.freshness.nextReviewDue ?? record.freshness.checkedAt,
    primarySource: {
      label: primarySource.label,
      url: primarySource.url,
    },
  };
}

const sourceMapExplorerDecisions: SourceMapExplorerDecision[] = SOURCE_CHOICE_DECISIONS.map((decision) => ({
  ...decision,
  sourcePosture: sourcePostureForDecision(decision),
}));

export default function DocsPage() {
  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Source Map</h1>
      <p className="text-slate-400 max-w-3xl mb-6">
        A source map for official docs, developer references, live APIs, historical records, external analytics, and community channels. Pick sources by the kind of claim you need to make.
      </p>

      <section id="source-map-chooser" className="mb-12 scroll-mt-24">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          What Are You Trying To Prove?
        </h2>
        <div className="mb-7">
          <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fast Source Triage</p>
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
                Start with the source family that matches the claim. A good source for one claim can still be weak evidence for another.
              </p>
            </div>
            <span className="w-fit rounded-md border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-200">
              Match source to claim
            </span>
          </div>
        </div>
        <RouteSourcePosture
          entry={entry}
          className="mb-7"
          useFor={[
            'Choosing the right source family for protocol, API, incident, analytics, or community-context claims.',
            'Separating official docs, live API snapshots, external analytics, and social context.',
          ]}
          verifyBeforeClaiming={[
            'That any single source proves current operational state, implementation status, or production safety.',
            'That community discussion or external analytics are canonical protocol evidence.',
          ]}
        />
        <SourceMapExplorer
          triageChoices={sourceTriageChoices}
          decisions={sourceMapExplorerDecisions}
          sections={sourceMapExplorerSections}
        />
      </section>

      <div className="mb-12 space-y-10">
        {SOURCE_MAP_SECTION_RECORDS.map((record) => (
          <section key={record.data.id} id={record.data.id} className="scroll-mt-24 border-t border-border pt-7">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{record.data.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-slate-200">{record.data.decision}</p>
              </div>
              <FreshnessMeta freshness={record.freshness} sources={record.sources} compact />
            </div>
            <p className="mb-2 text-sm leading-relaxed text-slate-400">{record.data.use}</p>
            <p className="mb-5 text-sm leading-relaxed text-amber-300/80">{record.data.caveat}</p>
            {record.data.id === 'developer-integration' && (
              <div className="mb-5 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Implementation Workflow</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  Need a step-by-step query plan? Use the build/query guide for endpoint choice, inbound-address checks, quotes, units, source warnings, and failover posture before wiring a product flow.
                </p>
                <Link href="/deep-dives/build-query-data#query-plan" className="mt-3 inline-flex text-sm font-semibold text-accent underline-offset-4 hover:underline">
                  Open build/query guide
                </Link>
              </div>
            )}
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Use For Claims</h3>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
                  {record.data.claimExamples.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">Do Not Use Alone To Claim</h3>
                <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-slate-300">
                  {record.data.nonClaims.map((claim) => (
                    <li key={claim}>{claim}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Sources</p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {record.data.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-accent/20 group"
                >
                  <span className="text-sm text-slate-300 transition-colors group-hover:text-accent">{link.label}</span>
                  {link.notes && (
                    <span className="mt-1 block text-[11px] leading-relaxed text-slate-400">{link.notes}</span>
                  )}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
