import { describe, expect, it } from 'vitest';
import {
  getNetworkCurrentOnlyStateLabel,
  getSecuredAssetsSummaryPaused,
} from '@/lib/network-status-summary';
import type { NetworkStatus } from '@/lib/types';

function networkStatus(overrides: Partial<NetworkStatus> = {}): NetworkStatus {
  return {
    state: 'operational',
    summary: 'Current-only live sources do not show global halt flags.',
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
    chainStatuses: [],
    activeControlKeys: [],
    activeChainKeys: [],
    activeEvidenceKeys: [],
    activePauseKeys: [],
    monitoredControls: [],
    invalidMimirKeys: [],
    sourceWarnings: [],
    ...overrides,
  };
}

describe('network current-only state labels', () => {
  it('renders exact malformed Mimir controls as warnings instead of open', () => {
    const status = networkStatus({
      monitoredControls: [
        {
          key: 'HALTSIGNING',
          label: 'Signing',
          state: 'unparseable',
          active: false,
          description: 'Outbound signing is paused when active.',
        },
      ],
      invalidMimirKeys: ['HALTSIGNING'],
    });

    expect(getNetworkCurrentOnlyStateLabel({
      paused: false,
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      controlKeys: ['HALTSIGNING'],
    })).toBe('Mimir warning');
  });

  it('renders scoped malformed Mimir controls as warnings instead of open', () => {
    const status = networkStatus({
      invalidMimirKeys: ['HALTSIGNINGBTC', 'PAUSELPBTC'],
    });

    expect(getNetworkCurrentOnlyStateLabel({
      paused: false,
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      invalidKeyPatterns: [/^HALTSIGNING[A-Z0-9]+$/, /^HALT[A-Z0-9]+SIGNING$/],
    })).toBe('Mimir warning');

    expect(getNetworkCurrentOnlyStateLabel({
      paused: false,
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      invalidKeyPatterns: [/^PAUSELP[A-Z0-9]+$/],
    })).toBe('Mimir warning');
  });

  it('renders scoped secured-asset warnings and pauses in the secured-assets summary', () => {
    const status = networkStatus({
      securedAssetsPaused: null,
      securedAssetDepositPauseKeys: ['HaltSecuredDeposit-ETH-ETH'],
      invalidMimirKeys: ['HaltSecuredWithdraw-BTC-BTC'],
      monitoredControls: [
        {
          key: 'HaltSecuredWithdraw-*',
          label: 'Secured withdrawals',
          state: 'unparseable',
          active: false,
          description: 'No active secured-asset withdrawal pause keys were observed.',
        },
      ],
    });

    expect(getSecuredAssetsSummaryPaused(status)).toBe(true);
    expect(getNetworkCurrentOnlyStateLabel({
      paused: getSecuredAssetsSummaryPaused(status),
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      controlKeys: ['HALTSECUREDGLOBAL', 'HaltSecuredDeposit-*', 'HaltSecuredWithdraw-*'],
      invalidKeyPatterns: [/^HALTSECURED(?:DEPOSIT|WITHDRAW)-/],
    })).toBe('Mimir warning');
  });

  it('prioritizes optional-control Mimir warnings over not-monitored labels', () => {
    const status = networkStatus({
      monitoredControls: [
        {
          key: 'TCYCLAIMINGHALT',
          label: 'TCY claiming',
          state: 'unparseable',
          active: false,
          description: 'TCY claim actions are halted when active.',
        },
      ],
      invalidMimirKeys: ['TCYCLAIMINGHALT'],
    });

    expect(getNetworkCurrentOnlyStateLabel({
      paused: null,
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      controlKeys: ['TCYCLAIMINGHALT'],
    })).toBe('Mimir warning');
  });

  it('renders malformed LP-deposit prefix controls as warnings instead of open', () => {
    const status = networkStatus({
      invalidMimirKeys: ['PAUSELPDEPOSIT-ETH-ETH'],
      monitoredControls: [
        {
          key: 'PAUSELPDEPOSIT-*',
          label: 'Pool deposits',
          state: 'unparseable',
          active: false,
          description: '1 scoped key could not be parsed.',
        },
      ],
    });

    expect(getNetworkCurrentOnlyStateLabel({
      paused: false,
      statusLoading: false,
      sourceUnavailable: false,
      networkStatus: status,
      controlKeys: ['PAUSELPDEPOSIT-*'],
      invalidKeyPatterns: [/^PAUSELPDEPOSIT-/],
    })).toBe('Mimir warning');
  });
});
