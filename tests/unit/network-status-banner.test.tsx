import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { ChainOperationalStatus, LiveDataResult, NetworkStatus } from '@/lib/types';

function chain(overrides: Partial<ChainOperationalStatus> & { chain: string }): ChainOperationalStatus {
  return {
    halted: false,
    tradingPaused: false,
    lpActionsPaused: false,
    lpDepositPaused: false,
    signingPaused: false,
    activeMimirKeys: [],
    lpDepositPauseKeys: [],
    ...overrides,
  };
}

const baseStatus: NetworkStatus = {
  state: 'operational',
  summary: 'Current-only live sources do not show active halt flags.',
  tradingPaused: false,
  signingPaused: false,
  lpPaused: false,
  loansPaused: false,
  observedChainsPaused: false,
  securedAssetsPaused: null,
  tcyClaimingPaused: null,
  tcyClaimingSwapPaused: null,
  tcyStakingPaused: null,
  tcyStakeDistributionPaused: null,
  tcyUnstakingPaused: null,
  tcyTradingPaused: null,
  tradeAccountsEnabled: null,
  runePoolEnabled: null,
  wasmPaused: null,
  poolDepositPauseKeys: [],
  activeControlKeys: [],
  activeChainKeys: [],
  activeEvidenceKeys: [],
  activePauseKeys: [],
  monitoredControls: [],
  invalidMimirKeys: [],
  sourceWarnings: [],
  chainStatuses: [
    chain({ chain: 'BTC' }),
    chain({ chain: 'ETH' }),
  ],
};

const liveResult: LiveDataResult<NetworkStatus> = {
  status: 'ok',
  checkedAt: '2026-06-19T00:00:00.000Z',
  data: baseStatus,
  source: {
    label: 'THORNode',
    url: 'https://thornode.thorchain.network',
  },
};

function renderStatus(status: NetworkStatus, variant: 'compact' | 'diagnostic' = 'diagnostic') {
  return renderToStaticMarkup(
    <NetworkStatusBanner
      result={{ ...liveResult, data: status }}
      variant={variant}
    />
  );
}

describe('NetworkStatusBanner', () => {
  it('answers ordinary swap availability before LP and maintenance controls', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      lpPaused: true,
      loansPaused: true,
      activeControlKeys: ['PAUSELP', 'PAUSELOANS', 'HALTCHURNING'],
      activePauseKeys: ['PAUSELP', 'PAUSELOANS', 'HALTCHURNING'],
      monitoredControls: [
        {
          key: 'PAUSELP',
          label: 'LP actions',
          state: 'active',
          active: true,
          description: 'Liquidity-provider actions are paused when active.',
        },
        {
          key: 'PAUSELOANS',
          label: 'Loans',
          state: 'active',
          active: true,
          description: 'Loans are paused when active.',
        },
        {
          key: 'HALTCHURNING',
          label: 'Churning',
          state: 'active',
          active: true,
          description: 'Validator churn is halted when active.',
        },
      ],
    });

    expect(html).toContain('No global swap halt; other operations paused');
    expect(html).toContain('Ordinary swaps');
    expect(html).toContain('No global swap halt detected');
    expect(html).toContain('Route still needs quote or pair-specific proof');
    expect(html).toContain('Other operations');
    expect(html).toContain('LP actions: paused');
    expect(html).toContain('Loans: paused');
    expect(html).toContain('Network-wide or global controls; separate from ordinary swap execution');
    expect(html).not.toContain('Paused operations need source review');
    expect(html).not.toContain('Swaps appear open');
  });

  it('does not call ordinary swaps open when only source warnings need review', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'degraded',
      summary: 'Current-only live sources do not show active halt flags, but source warnings need review.',
      sourceWarnings: ['Unknown operation-like Mimir keys need review: BURNSYNTHS.'],
      sourceWarningDetails: [
        {
          severity: 'review',
          category: 'unknown-operation',
          message: 'Unknown operation-like Mimir keys need review: BURNSYNTHS.',
          action: 'Review the operation-like key family before interpreting it as non-pausing.',
          keys: ['BURNSYNTHS'],
        },
      ],
    });

    expect(html).toContain('Ordinary swap status needs source review');
    expect(html).toContain('Ordinary swaps');
    expect(html).toContain('Needs source review');
    expect(html).toContain('No swap halt observed; source review needed');
    expect(html).toContain('Source warning');
    expect(html).not.toContain('Swaps appear open');
    expect(html).not.toContain('swap open');
  });

  it('names swap-limited chains in the headline area and chain matrix', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      activeChainKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      activeEvidenceKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      activePauseKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      chainStatuses: [
        chain({
          chain: 'BSC',
          tradingPaused: true,
          activeMimirKeys: ['HALTBSCTRADING'],
        }),
        chain({
          chain: 'SOL',
          halted: true,
          activeMimirKeys: ['HALTSOLCHAIN'],
        }),
        chain({ chain: 'BTC' }),
        chain({ chain: 'ETH' }),
      ],
    });

    expect(html).toContain('Some routes may be limited');
    expect(html).toContain('BSC and SOL are swap-limited.');
    expect(html).toContain('Limited chains');
    expect(html).toContain('BSC: Trading halted');
    expect(html).toContain('SOL: Chain halted');
    expect(html).toContain('Chain availability');
    expect(html).toContain('Swap in');
    expect(html).toContain('Swap out');
    expect(html).toContain('LP actions');
    expect(html).toContain('Pool deposits');
    expect(html).toContain('BTC');
    expect(html).toContain('No swap blocker');
    expect(html).toContain('No chain warnings');
    expect(html).not.toContain('Sources clean');
    expect(html).not.toContain('Direct:');
    expect(html).not.toContain('Inherited:');
    expect(html).not.toContain('evidence items');
  });

  it('renders network-wide controls once instead of repeating inherited keys per chain', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      lpPaused: true,
      activeControlKeys: ['PAUSELP'],
      activePauseKeys: ['PAUSELP'],
      chainStatuses: [
        chain({ chain: 'BTC', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
        chain({ chain: 'ETH', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
      ],
    });

    expect(html).toContain('Network-wide controls');
    expect(html).toContain('Network-wide LP pause');
    expect(html).toContain('Network-wide');
    expect(html).toContain('does not by itself mean ordinary swaps are globally halted');
    expect(html.match(/Network-wide LP pause applies/g)?.length ?? 0).toBe(1);
    expect(html.match(/No active chain-specific swap blocker observed/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(html).toContain('Network-wide');
    expect(html).toContain('No deposit pause');
    expect(html).not.toContain('Inherited: 1 key');
    expect(html).not.toContain('Direct:');
  });

  it('shows node operator action gates as a separate diagnostics panel', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      bondPaused: true,
      unbondPaused: false,
      rebondHalted: true,
      operatorRotateHalted: false,
      activeControlKeys: ['PauseBond', 'HaltRebond'],
      activePauseKeys: ['PauseBond', 'HaltRebond'],
      monitoredControls: [
        {
          key: 'PauseBond',
          label: 'Bonding',
          state: 'active',
          active: true,
          description: 'Node bond actions are paused when active.',
        },
        {
          key: 'PauseUnbond',
          label: 'Unbonding',
          state: 'inactive',
          active: false,
          description: 'Node unbond actions are paused when active.',
        },
        {
          key: 'HaltRebond',
          label: 'Rebonding',
          state: 'active',
          active: true,
          description: 'Node rebond actions are halted when active.',
        },
        {
          key: 'HaltOperatorRotate',
          label: 'Operator rotation',
          state: 'inactive',
          active: false,
          description: 'Node operator rotation is halted when active.',
        },
      ],
    });

    expect(html).toContain('id="node-operator-actions"');
    expect(html).toContain('Node operator actions');
    expect(html).toContain('Current Mimir controls for bonding, unbonding, rebonding, and operator rotation');
    expect(html).toContain('Bonding');
    expect(html).toContain('Paused');
    expect(html).toContain('PauseBond is active in current Mimir.');
    expect(html).toContain('Unbonding');
    expect(html).toContain('PauseUnbond is present and not active in current Mimir.');
    expect(html).toContain('Rebonding');
    expect(html).toContain('HaltRebond is active in current Mimir.');
    expect(html).toContain('Operator rotation');
    expect(html).toContain('HaltOperatorRotate is present and not active in current Mimir.');
    expect(html).toContain('does not prove a specific node can leave safely');
    expect(html).toContain('bonding, unbonding, rebonding, or operator-rotation availability');
  });

  it('does not render node operator diagnostics in the compact tier', () => {
    const html = renderStatus({
      ...baseStatus,
      bondPaused: true,
      activeControlKeys: ['PauseBond'],
      activePauseKeys: ['PauseBond'],
      monitoredControls: [
        {
          key: 'PauseBond',
          label: 'Bonding',
          state: 'active',
          active: true,
          description: 'Node bond actions are paused when active.',
        },
      ],
    }, 'compact');

    expect(html).not.toContain('Node operator actions');
    expect(html).not.toContain('PauseBond is active in current Mimir.');
  });

  it('keeps the node-operator deep-link anchor with an explicit unavailable state', () => {
    const html = renderStatus({
      ...baseStatus,
      monitoredControls: [],
    });

    expect(html).toContain('id="node-operator-actions"');
    expect(html).toContain('Node operator actions');
    expect(html).toContain('Unavailable');
    expect(html).toContain('No clean optional node-operation Mimir controls were returned');
  });

  it('shows secured/asym operation pauses as their own chain status lane', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      activeEvidenceKeys: ['HaltSecuredDeposit-ETH-ETH', 'PauseAsymWithdrawal-BTC-BTC'],
      activePauseKeys: ['HaltSecuredDeposit-ETH-ETH', 'PauseAsymWithdrawal-BTC-BTC'],
      chainStatuses: [
        chain({
          chain: 'ETH',
          securedAssetDepositPaused: true,
          securedAssetDepositPauseKeys: ['HaltSecuredDeposit-ETH-ETH'],
        }),
        chain({
          chain: 'BTC',
          asymWithdrawalPaused: true,
          asymWithdrawalPauseKeys: ['PauseAsymWithdrawal-BTC-BTC'],
        }),
      ],
    });

    expect(html).toContain('No global swap halt; other operations paused');
    expect(html).toContain('Limited chains');
    expect(html).toContain('None observed');
    expect(html).toContain('Secured / asym');
    expect(html).toContain('Secured deposits paused');
    expect(html).toContain('Asym withdrawals paused');
    expect(html).toContain('HaltSecuredDeposit-ETH-ETH');
    expect(html).toContain('PauseAsymWithdrawal-BTC-BTC');
  });

  it('keeps source warnings visible without hiding direct chain blockers', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'degraded',
      activeChainKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      activeEvidenceKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      activePauseKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
      sourceWarnings: ['Unknown operation-like Mimir keys need review: BURNSYNTHS, ENABLESWITCH-GAIA-AUTO.'],
      chainStatuses: [
        chain({
          chain: 'BSC',
          tradingPaused: true,
          activeMimirKeys: ['HALTBSCTRADING'],
        }),
        chain({
          chain: 'SOL',
          halted: true,
          activeMimirKeys: ['HALTSOLCHAIN'],
        }),
      ],
    });

    expect(html).toContain('Some routes limited; source review needed');
    expect(html).toContain('BSC and SOL are swap-limited.');
    expect(html).toContain('2 keys need Mimir review; exact raw keys stay in diagnostics, not the headline.');
    expect(html).toContain('Source warnings and Mimir review queue');
    expect(html).toContain('BURNSYNTHS');
    expect(html).toContain('HALTBSCTRADING');
    expect(html).toContain('HALTSOLCHAIN');
  });

  it('uses compact copy on Home and Stats without raw diagnostics or route checking', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'degraded',
      activeChainKeys: ['HALTBSCTRADING'],
      activeEvidenceKeys: ['HALTBSCTRADING'],
      activePauseKeys: ['HALTBSCTRADING'],
      sourceWarnings: ['Unknown operation-like Mimir key needs review: BURNSYNTHS.'],
      chainStatuses: [
        chain({
          chain: 'BSC',
          tradingPaused: true,
          activeMimirKeys: ['HALTBSCTRADING'],
        }),
      ],
    }, 'compact');

    expect(html).toContain('Some routes limited; source review needed');
    expect(html).toContain('BSC is swap-limited.');
    expect(html).toContain('Open diagnostics');
    expect(html).toContain('href="/network#network-diagnostics"');
    expect(html).not.toContain('BURNSYNTHS');
    expect(html).not.toContain('Operational evidence');
    expect(html).not.toContain('Check A Route');
    expect(html).not.toContain('Chain availability');
    expect(html).not.toContain('Node operator actions');
  });

  it('renders exact operational source rows inside diagnostics', () => {
    const html = renderStatus({
      ...baseStatus,
      state: 'paused',
      activeChainKeys: ['HALTBSCTRADING'],
      activeEvidenceKeys: ['HALTBSCTRADING', 'PAUSELPDEPOSIT-ETH-ETH'],
      activePauseKeys: ['HALTBSCTRADING', 'PAUSELPDEPOSIT-ETH-ETH'],
      chainStatuses: [
        chain({
          chain: 'BSC',
          tradingPaused: true,
          activeMimirKeys: ['HALTBSCTRADING'],
        }),
        chain({
          chain: 'ETH',
          lpDepositPaused: true,
          lpDepositPauseKeys: ['PAUSELPDEPOSIT-ETH-ETH'],
        }),
      ],
    });

    expect(html).toContain('Operational evidence');
    expect(html).toContain('2 source rows');
    expect(html).toContain('Scope');
    expect(html).toContain('Source');
    expect(html).toContain('Impact');
    expect(html).toContain('State');
    expect(html).toContain('HALTBSCTRADING');
    expect(html).toContain('PAUSELPDEPOSIT-ETH-ETH');
  });

  it('does not render missing status as healthy or zero', () => {
    const html = renderToStaticMarkup(
      <NetworkStatusBanner
        result={{
          status: 'ok',
          checkedAt: '2026-06-19T00:00:00.000Z',
          source: {
            label: 'THORNode',
            url: 'https://thornode.thorchain.network',
          },
        }}
      />
    );

    expect(html).toContain('Network status unavailable');
    expect(html).toContain('Current-only THORNode status is unavailable.');
    expect(html).not.toContain('Sources clean');
    expect(html).not.toContain('Live sources show no global halt flags');
  });

  it('bounds rendered review-key disclosures while keeping the source degraded', () => {
    const keys = Array.from({ length: 81 }, (_, index) => `UNKNOWNENABLEMENT${String(index + 1).padStart(2, '0')}`);
    const html = renderStatus({
      ...baseStatus,
      state: 'degraded',
      sourceWarnings: ['Unknown operation-like Mimir keys need review.'],
      sourceWarningDetails: [
        {
          severity: 'review',
          category: 'unknown-operation',
          message: 'Unknown operation-like Mimir keys need review.',
          action: 'Review the operation-like key family before interpreting it as non-pausing.',
          keys,
        },
      ],
    });

    expect(html).toContain('Ordinary swap status needs source review');
    expect(html).toContain('Show 81 keys');
    expect(html).toContain('UNKNOWNENABLEMENT01');
    expect(html).toContain('UNKNOWNENABLEMENT80');
    expect(html).not.toContain('UNKNOWNENABLEMENT81');
    expect(html).toContain('1 more keys hidden from the rendered page; source remains degraded.');
  });
});
