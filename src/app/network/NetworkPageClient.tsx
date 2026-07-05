'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { PageContainer } from '@/components/layout/PageContainer';
import { useMidgardHealth, useNetworkData, useNetworkStatus } from '@/lib/hooks/useMidgard';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { getNetworkCurrentOnlyStateLabel, getSecuredAssetsSummaryPaused } from '@/lib/network-status-summary';
import { RelatedChecks, type RelatedCheck } from '@/components/features/RelatedChecks';

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
    label: 'Pause search',
    href: '/search?q=Mimir%20halt&filter=task',
    badge: 'search',
    description: 'Jump to task results for halt keys, pause reasons, and user-facing availability checks.',
  },
];

interface NetworkPageClientProps {
  children?: ReactNode;
}

export default function NetworkPageClient({ children }: NetworkPageClientProps) {
  const { data: networkData, result: networkResult } = useNetworkData();
  const { result: midgardHealthResult } = useMidgardHealth();
  const { result: statusResult, isLoading: statusLoading, isDegraded: statusDegraded } = useNetworkStatus();
  const networkStatus = statusResult?.data;

  const liveStateValue = (
    paused: boolean | null | undefined,
    controlKeys: string[] = [],
    invalidKeyPatterns: RegExp[] = []
  ) => getNetworkCurrentOnlyStateLabel({
    paused,
    statusLoading,
    sourceUnavailable: statusDegraded || statusResult?.status === 'degraded' || !statusResult,
    networkStatus,
    controlKeys,
    invalidKeyPatterns,
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

      {children}

      <RelatedChecks checks={networkRelatedChecks} className="mb-12" />

      <SectionHeader>Node Types</SectionHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {[
          { type: 'Active', color: 'text-green-400', desc: 'Currently in the validator set. Active nodes observe chains, sign outbound transactions when signing is not halted, and participate in consensus.' },
          { type: 'Standby', color: 'text-amber-400', desc: 'Ready to join the active set. Promotion depends on bond ranking, node state, and churn rules.' },
          { type: 'Ready', color: 'text-slate-400', desc: 'Synced but not active. A ready node can become standby or active when it satisfies current requirements.' },
          { type: 'Whitelisted', color: 'text-blue-400', desc: 'A node address that has sent an initial BOND deposit and can continue setup before ready/standby status.' },
        ].map((node) => (
          <Card key={node.type}>
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

      <SectionHeader>Current-Only Numbers</SectionHeader>
      <p className="text-sm text-slate-400 mb-4">
        Values below are either live from Midgard or intentionally marked as current-only because constants can be overridden by Mimir.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Active Nodes', value: networkData?.activeNodeCount ?? 'Unavailable' },
          { label: 'Standby Nodes', value: networkData?.standbyNodeCount ?? 'Unavailable' },
          { label: 'Consensus Threshold', value: '2/3+' },
          { label: 'Minimum Bond', value: 'Check Mimir' },
          { label: 'Slash Rate', value: 'Check constants + Mimir' },
          { label: 'Churn Interval', value: 'Check constants + Mimir' },
          { label: 'Signing State', value: liveStateValue(networkStatus?.signingPaused, ['HALTSIGNING'], [/^HALTSIGNING[A-Z0-9]+$/, /^HALT[A-Z0-9]+SIGNING$/]) },
          { label: 'LP Actions', value: liveStateValue(lpActionsPaused, ['PAUSELP'], [/^PAUSELP[A-Z0-9]+$/]) },
          { label: 'LP Deposits', value: liveStateValue(lpDepositsPaused, ['PAUSELPDEPOSIT-*'], [/^PAUSELPDEPOSIT-/]) },
          { label: 'Asym Withdrawals', value: liveStateValue(asymWithdrawalsPaused, ['PauseAsymWithdrawal-*'], [/^PAUSEASYMWITHDRAWAL-/]) },
          { label: 'TCY Claims', value: liveStateValue(networkStatus?.tcyClaimingPaused, ['TCYCLAIMINGHALT']) },
          { label: 'TCY Claim Swaps', value: liveStateValue(networkStatus?.tcyClaimingSwapPaused, ['TCYCLAIMINGSWAPHALT']) },
          { label: 'TCY Staking', value: liveStateValue(networkStatus?.tcyStakingPaused, ['TCYSTAKINGHALT']) },
          { label: 'TCY Distributions', value: liveStateValue(networkStatus?.tcyStakeDistributionPaused, ['TCYSTAKEDISTRIBUTIONHALT']) },
          { label: 'TCY Unstaking', value: liveStateValue(networkStatus?.tcyUnstakingPaused, ['TCYUNSTAKINGHALT']) },
          { label: 'TCY Trading', value: liveStateValue(networkStatus?.tcyTradingPaused, ['HALTTCYTRADING']) },
          { label: 'Secured Assets', value: liveStateValue(securedAssetsPaused, ['HALTSECUREDGLOBAL', 'HaltSecuredDeposit-*', 'HaltSecuredWithdraw-*'], [/^HALTSECURED(?:DEPOSIT|WITHDRAW)-/]) },
          { label: 'Trade Accounts', value: liveStateValue(availabilityDisabled(networkStatus?.tradeAccountsEnabled), ['TRADEACCOUNTSENABLED']) },
          { label: 'Trade Deposits', value: liveStateValue(availabilityDisabled(networkStatus?.tradeAccountDepositsEnabled), ['TRADEACCOUNTSDEPOSITENABLED']) },
          { label: 'RUNEPool', value: liveStateValue(availabilityDisabled(networkStatus?.runePoolEnabled), ['RUNEPOOLENABLED']) },
          { label: 'Bank Sends', value: liveStateValue(availabilityDisabled(networkStatus?.bankSendEnabled), ['BANKSENDENABLED']) },
        ].map((stat) => (
          <Card key={stat.label} padding="sm" className="text-center">
            <p className="text-xl font-bold text-accent">{stat.value}</p>
            <p className="text-[11px] text-slate-400 mt-1">{stat.label}</p>
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
    </PageContainer>
  );
}
