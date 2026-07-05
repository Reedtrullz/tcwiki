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

    expect(html).toContain('Swaps appear open; other operations paused');
    expect(html).toContain('Ordinary swaps');
    expect(html).toContain('Swaps appear open');
    expect(html).toContain('Other operations');
    expect(html).toContain('LP actions: paused');
    expect(html).toContain('Loans: paused');
    expect(html).not.toContain('Paused operations need source review');
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
    expect(html).toContain('Available');
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
    expect(html).toContain('does not by itself mean ordinary swaps are globally halted');
    expect(html).not.toContain('Inherited: 1 key');
    expect(html).not.toContain('Direct:');
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
    expect(html).toContain('href="/network"');
    expect(html).not.toContain('BURNSYNTHS');
    expect(html).not.toContain('Operational evidence');
    expect(html).not.toContain('Check A Route');
    expect(html).not.toContain('Chain availability');
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
