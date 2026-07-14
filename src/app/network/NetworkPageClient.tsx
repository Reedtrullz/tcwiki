'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMidgardHealth, useNetworkData, useNetworkStatus } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { getNetworkCurrentOnlyStateLabel, getSecuredAssetsSummaryPaused } from '@/lib/network-status-summary';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';
import { nodeLeavingSource, nodeManagingSource, nodeOperationsSource, nodeRisksRewardsSource } from '@/lib/sources';

const networkRelatedChecks: RelatedCheck[] = [
  {
    label: 'Source map',
    href: '/docs#current-protocol-state',
    badge: 'proof boundary',
    description: 'Separate current THORNode operational evidence from docs, historical reports, and community context.',
  },
  {
    label: 'Live-source failover',
    href: '/docs#runtime-live-data-failover',
    badge: 'source health',
    description: 'Review how provider warnings, stale snapshots, and degraded source labels should be interpreted.',
  },
  {
    label: 'Stats dashboard',
    href: '/stats#stats-look-here-first',
    badge: 'metrics',
    description: 'Compare operational availability with Midgard headline metrics and earnings coverage.',
  },
  {
    label: 'Mimir halt guide',
    href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
    badge: 'guide',
    description: 'Read how halt keys, source warnings, and scoped pauses should be interpreted.',
  },
];

interface NetworkPageClientProps {
  children?: ReactNode;
}

interface CurrentOperationRow {
  label: string;
  value: string | number;
  detail?: string;
}

interface CurrentOperationGroup {
  title: string;
  summary: string;
  source: 'Midgard' | 'THORNode' | 'Static + THORNode';
  rows: CurrentOperationRow[];
}

function formatOptionalCount(value: number | null | undefined) {
  return value ?? 'Unavailable';
}

function operationBadgeVariant(value: CurrentOperationRow['value']) {
  const label = String(value);
  if (label === 'Control enabled' || label === 'No disable flag' || label.startsWith('No active')) {
    return 'success';
  }
  if (label === 'Paused' || label === 'Disabled' || label === 'Mimir warning' || label === 'Source warning') {
    return 'warning';
  }
  if (label === 'Unavailable' || label === 'Unknown') {
    return 'danger';
  }
  if (label === 'Checking' || label === 'Not monitored' || label.startsWith('Check')) {
    return 'default';
  }
  return 'info';
}

export default function NetworkPageClient({ children }: NetworkPageClientProps) {
  const { data: networkData, result: networkResult } = useNetworkData();
  const { result: midgardHealthResult } = useMidgardHealth();
  const { result: statusResult, isLoading: statusLoading } = useNetworkStatus();
  const networkStatus = statusResult?.data;

  const liveStateValue = (
    paused: boolean | null | undefined,
    controlKeys: string[] = [],
    invalidKeyPatterns: RegExp[] = [],
    clearLabel = 'No active halt'
  ) => getNetworkCurrentOnlyStateLabel({
    paused,
    statusLoading,
    sourceUnavailable: !statusResult || !networkStatus,
    networkStatus,
    controlKeys,
    invalidKeyPatterns,
    clearLabel,
  });
  const lpActionsPaused = networkStatus
    ? networkStatus.lpPaused || networkStatus.chainStatuses.some((chain) => chain.lpActionsPaused)
    : undefined;
  const lpDepositsPaused = networkStatus ? networkStatus.poolDepositPauseKeys.length > 0 : undefined;
  const asymWithdrawalsPaused = networkStatus ? (networkStatus.asymWithdrawalPauseKeys?.length ?? 0) > 0 : undefined;
  const securedAssetsPaused = getSecuredAssetsSummaryPaused(networkStatus);
  const availabilityDisabled = (enabled: boolean | null | undefined) => (
    enabled === undefined ? undefined : enabled === null ? null : !enabled
  );
  const enabledStateValue = (
    enabled: boolean | null | undefined,
    controlKeys: string[] = []
  ) => {
    const value = liveStateValue(availabilityDisabled(enabled), controlKeys, [], 'Control enabled');
    if (value === 'Paused') {
      return 'Disabled';
    }
    return value;
  };
  const disabledStateValue = (
    disabled: boolean | null | undefined,
    controlKeys: string[] = []
  ) => {
    const value = liveStateValue(disabled, controlKeys, [], 'No disable flag');
    if (value === 'Paused') {
      return 'Disabled';
    }
    return value;
  };
  const operationGroups: CurrentOperationGroup[] = [
    {
      title: 'Node set',
      summary: 'Live Midgard counts for validator-set shape. These are not a node-health audit.',
      source: 'Midgard',
      rows: [
        { label: 'Active nodes', value: formatOptionalCount(networkData?.activeNodeCount), detail: 'Validators currently in the active set.' },
        { label: 'Standby nodes', value: formatOptionalCount(networkData?.standbyNodeCount), detail: 'Candidates available for future churn.' },
        { label: 'Consensus threshold', value: '2/3+', detail: 'Static threshold framing; verify live node state for incidents.' },
      ],
    },
    {
      title: 'Operator constants',
      summary: 'Do not freeze these as static facts; constants and Mimir can change live.',
      source: 'Static + THORNode',
      rows: [
        { label: 'Minimum bond', value: 'Check constants + Mimir' },
        { label: 'Slash rate', value: 'Check constants + Mimir' },
        { label: 'Churn interval', value: 'Check constants + Mimir' },
      ],
    },
    {
      title: 'Swap execution',
      summary: 'The controls most likely to affect whether an ordinary swap can route or settle.',
      source: 'THORNode',
      rows: [
        { label: 'Trading', value: liveStateValue(networkStatus?.tradingPaused, ['HALTTRADING'], [/^HALT[A-Z0-9]+TRADING$/, /^HALTTRADING[A-Z0-9]+$/]) },
        { label: 'Signing', value: liveStateValue(networkStatus?.signingPaused, ['HALTSIGNING'], [/^HALTSIGNING[A-Z0-9]+$/, /^HALT[A-Z0-9]+SIGNING$/]) },
        { label: 'Chain observation', value: liveStateValue(networkStatus?.observedChainsPaused || networkStatus?.nodePauseChainGlobal, ['HALTCHAINGLOBAL', 'NODEPAUSECHAINGLOBAL']) },
        { label: 'Manual synth swaps', value: disabledStateValue(networkStatus?.manualSwapsToSynthDisabled, ['MANUALSWAPSTOSYNTHDISABLED']) },
      ],
    },
    {
      title: 'Liquidity actions',
      summary: 'LP, deposit, loan, and asym controls are separate from ordinary swap execution.',
      source: 'THORNode',
      rows: [
        { label: 'LP actions', value: liveStateValue(lpActionsPaused, ['PAUSELP'], [/^PAUSELP[A-Z0-9]+$/], 'No active pause') },
        { label: 'Pool deposits', value: liveStateValue(lpDepositsPaused, ['PAUSELPDEPOSIT-*'], [/^PAUSELPDEPOSIT-/], 'No active pause') },
        { label: 'Asym withdrawals', value: liveStateValue(asymWithdrawalsPaused, ['PauseAsymWithdrawal-*'], [/^PAUSEASYMWITHDRAWAL-/], 'No active pause') },
        { label: 'Loans', value: liveStateValue(networkStatus?.loansPaused, ['PAUSELOANS'], [], 'No active pause') },
      ],
    },
    {
      title: 'TCY and RUNEPool',
      summary: 'Recovery and RUNEPool rails can be paused independently from swaps.',
      source: 'THORNode',
      rows: [
        { label: 'TCY claims', value: liveStateValue(networkStatus?.tcyClaimingPaused, ['TCYCLAIMINGHALT'], [], 'No active pause') },
        { label: 'TCY claim swaps', value: liveStateValue(networkStatus?.tcyClaimingSwapPaused, ['TCYCLAIMINGSWAPHALT'], [], 'No active pause') },
        { label: 'TCY staking', value: liveStateValue(networkStatus?.tcyStakingPaused, ['TCYSTAKINGHALT'], [], 'No active pause') },
        { label: 'TCY distributions', value: liveStateValue(networkStatus?.tcyStakeDistributionPaused, ['TCYSTAKEDISTRIBUTIONHALT'], [], 'No active pause') },
        { label: 'TCY unstaking', value: liveStateValue(networkStatus?.tcyUnstakingPaused, ['TCYUNSTAKINGHALT'], [], 'No active pause') },
        { label: 'TCY trading', value: liveStateValue(networkStatus?.tcyTradingPaused, ['HALTTCYTRADING']) },
        { label: 'RUNEPool', value: enabledStateValue(networkStatus?.runePoolEnabled, ['RUNEPOOLENABLED']), detail: 'Enablement flag only; deposit, withdrawal, maturity, and wallet paths are separate checks.' },
        { label: 'RUNEPool deposits', value: liveStateValue(networkStatus?.runePoolDepositPaused, ['RUNEPoolHaltDeposit'], [], 'No active pause') },
        { label: 'RUNEPool withdrawals', value: liveStateValue(networkStatus?.runePoolWithdrawPaused, ['RUNEPoolHaltWithdraw'], [], 'No active pause') },
      ],
    },
    {
      title: 'App and asset rails',
      summary: 'Secured assets, trade accounts, bank sends, and WASM/app-layer controls need scoped live checks.',
      source: 'THORNode',
      rows: [
        { label: 'Secured assets', value: liveStateValue(securedAssetsPaused, ['HALTSECUREDGLOBAL', 'HaltSecuredDeposit-*', 'HaltSecuredWithdraw-*'], [/^HALTSECURED(?:DEPOSIT|WITHDRAW)-/], 'No active pause') },
        { label: 'Trade accounts', value: enabledStateValue(networkStatus?.tradeAccountsEnabled, ['TRADEACCOUNTSENABLED']), detail: 'Feature flag only; route, asset, and interface support need separate proof.' },
        { label: 'Trade deposits', value: enabledStateValue(networkStatus?.tradeAccountDepositsEnabled, ['TRADEACCOUNTSDEPOSITENABLED']), detail: 'Deposit enablement flag only; not wallet or route instructions.' },
        { label: 'WASM/app layer', value: liveStateValue(networkStatus?.wasmPaused, ['HALTWASMGLOBAL']) },
        { label: 'Bank sends', value: enabledStateValue(networkStatus?.bankSendEnabled, ['BANKSENDENABLED']), detail: 'Bank module send flag only; not transaction safety or app-layer support.' },
      ],
    },
  ];
  const currentOperationSnapshot = (
    <details className="group mb-12" aria-labelledby="current-operation-snapshot-heading">
      <summary className="list-none cursor-pointer rounded-lg border border-border bg-surface-elevated px-4 py-3 transition-colors hover:border-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
        <div className="flex items-center justify-between gap-3">
          <h2 id="current-operation-snapshot-heading" className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Current Operation Snapshot
          </h2>
          <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Additional context for node counts, operator constants, and grouped operation gates. Open when you need the secondary view.
        </p>
        <span className="sr-only">Additional context</span>
      </summary>
      <div className="pt-5">
        <p className="mb-4 text-sm text-slate-400">
          Grouped by the decision a reader is trying to make. Swap execution, LP actions,
          recovery rails, and App Layer controls are deliberately separated so one paused
          rail does not look like a global swap halt.
        </p>
        <div className="mb-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {operationGroups.map((group) => (
            <Card key={group.title} padding="sm" className="flex flex-col gap-3">
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">{group.title}</h3>
                  <Badge variant={group.source === 'THORNode' ? 'info' : 'default'}>{group.source}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{group.summary}</p>
              </div>
              <div className="divide-y divide-border/70">
                {group.rows.map((row) => (
                  <div key={`${group.title}:${row.label}`} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-300">{row.label}</p>
                      {row.detail && (
                        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{row.detail}</p>
                      )}
                    </div>
                    <Badge
                      variant={operationBadgeVariant(row.value)}
                      className="shrink-0 text-right"
                    >
                      {row.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Midgard node-count source</p>
            <LiveSourceMeta result={networkResult} healthResult={midgardHealthResult} />
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">THORNode operation-state source</p>
            <LiveSourceMeta result={statusResult} />
          </div>
        </div>
      </div>
    </details>
  );
  const nodeOperatorGuide = (
    <section id="node-operator-guide" className="mb-12 scroll-mt-24" aria-labelledby="node-operator-guide-heading">
      <SectionHeader id="node-operator-guide-heading">Node Operator Guide</SectionHeader>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-slate-400">
        Use this as an orientation map before acting. Official operator docs explain setup
        and maintenance, while this page separates current controls, node lifecycle, bond
        risk, and rewards context so a guide search does not look like live action proof.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card padding="sm" className="flex flex-col gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="info">official docs</Badge>
              <h3 className="text-sm font-semibold text-slate-100">Setup and maintenance</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Start from the official operator runbook for setup, sync, troubleshooting, and maintenance details. Treat local wiki text as a source map, not installation instructions.
            </p>
          </div>
          <a href={nodeManagingSource.url} className="mt-auto text-xs font-semibold text-accent underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
            {nodeManagingSource.label}
          </a>
        </Card>
        <Card padding="sm" className="flex flex-col gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="warning">current controls</Badge>
              <h3 className="text-sm font-semibold text-slate-100">Bond, unbond, and rotate checks</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Use live diagnostics for PauseBond, PauseUnbond, HaltRebond, HaltOperatorRotate, source warnings, and the boundary around whether a specific node can act now.
            </p>
          </div>
          <Link href="#node-operator-actions" className="mt-auto text-xs font-semibold text-accent underline-offset-4 hover:underline">
            Check node-operation controls
          </Link>
        </Card>
        <Card padding="sm" className="flex flex-col gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="default">context</Badge>
              <h3 className="text-sm font-semibold text-slate-100">Lifecycle and leaving</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Whitelisted, Standby, Ready, Active, and Disabled are distinct states. Only a Standby node outside vault migration may unbond; current state still needs direct node evidence.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2">
            <a href={nodeOperationsSource.url} className="text-xs font-semibold text-accent underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              {nodeOperationsSource.label}
            </a>
            <a href={nodeLeavingSource.url} className="text-xs font-semibold text-accent underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
              {nodeLeavingSource.label}
            </a>
          </div>
        </Card>
        <Card padding="sm" className="flex flex-col gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="default">context</Badge>
              <h3 className="text-sm font-semibold text-slate-100">Rewards and slash exposure</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Slash points reduce rewards; separately defined security events can slash bond principal. Documentation examples do not prove a node&apos;s current balance, parameters, or incident outcome.
            </p>
          </div>
          <a href={nodeRisksRewardsSource.url} className="mt-auto text-xs font-semibold text-accent underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">
            {nodeRisksRewardsSource.label}
          </a>
        </Card>
      </div>
    </section>
  );

  return (
    <PageContainer>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Network & Security</h1>
      <p className="text-slate-400 max-w-3xl mb-8">
        THORChain secures cross-chain assets through bonded node operators, threshold signatures,
        Mimir-controlled operations, solvency checks, and economic penalties.
      </p>

      <div id="network-diagnostics" className="scroll-mt-24 mb-12">
        <NetworkStatusBanner result={statusResult} isLoading={statusLoading} variant="diagnostic" showQuoteChecker />
      </div>

      {currentOperationSnapshot}

      {children}

      <RelatedChecks checks={networkRelatedChecks} className="mb-12" />

      {nodeOperatorGuide}

      <SectionHeader>Node Types</SectionHeader>
      <div className="grid grid-cols-1 gap-3 mb-12 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { type: 'Whitelisted', color: 'text-blue-400', desc: 'Bonded, but required node keys have not yet been set; operator setup is incomplete.' },
          { type: 'Standby', color: 'text-amber-400', desc: 'Bonded but not active. Current requirements are evaluated during churn; only Standby nodes outside vault migration may unbond.' },
          { type: 'Ready', color: 'text-slate-300', desc: 'Passed current preflight requirements and is eligible for churn selection; a node cannot unbond while Ready.' },
          { type: 'Active', color: 'text-green-400', desc: 'Participates in consensus, observation, and signing; it cannot unbond until churned to Standby and clear of vault migration.' },
          { type: 'Disabled', color: 'text-red-300', desc: 'Completed the permanent-leave path while Standby and cannot rejoin with the same node account.' },
        ].map((node) => (
          <Card key={node.type} data-node-status={node.type}>
            <h3 className={`text-sm font-semibold mb-1.5 ${node.color}`}>{node.type}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{node.desc}</p>
          </Card>
        ))}
      </div>

      <SectionHeader>Security Architecture</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-12">
        {[
          { title: 'Threshold Signatures', desc: 'Distributed signing protects vault keys, but implementation details and migration status should stay tied to dated source material.' },
          { title: 'Solvency Checks', desc: 'Nodes monitor vault balances and can trigger halts when observed balances diverge from expected protocol state.' },
          { title: 'Operational Mimir', desc: 'Emergency parameters can halt trading, signing, churning, chain observation, LP actions, TCY claims, and more.' },
          { title: 'Bonded Operators', desc: 'Operators bond RUNE as economic security. Minimum bond and slash constants can be overridden by Mimir.' },
          { title: 'Slash Points', desc: 'Nodes can accrue slash points for missed observations or signing failures, affecting churn and rewards.' },
          { title: 'Churning', desc: 'Validator rotation and vault rotation reduce long-lived key exposure; exact intervals are live constants or Mimir overrides.' },
        ].map((feature) => (
          <Card key={feature.title}>
            <h3 className="text-sm font-semibold mb-1.5">{feature.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
          </Card>
        ))}
      </div>

    </PageContainer>
  );
}
