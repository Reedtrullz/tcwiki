import { describe, expect, it } from 'vitest';
import {
  deriveChainAvailability,
  deriveNodeOperatorActionControls,
  deriveNetworkWideControls,
  deriveRouteAvailability,
} from '@/lib/network-diagnostics';
import type { ChainOperationalStatus, NetworkStatus, Pool, SwapQuoteProbeResult } from '@/lib/types';
import { summarizeSourceWarning } from '@/lib/source-warnings';
import { deriveNetworkStatus } from '@/lib/api/thornode';
import { getNetworkCurrentOnlyStateLabel } from '@/lib/network-status-summary';

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
  chainStatuses: [],
};

function pool(asset: string): Pool {
  return {
    asset,
    assetDepth: '100000000',
    runeDepth: '100000000',
    status: 'available',
  };
}

describe('network diagnostics view models', () => {
  it('withholds clean chain and current-only labels when control applicability is unreviewed', () => {
    const status = deriveNetworkStatus({ HALTTRADING: 0, PauseBond: 1 }, [{
      chain: 'BTC', halted: false, global_trading_paused: false,
      chain_trading_paused: false, chain_lp_actions_paused: false,
    }], undefined, 100);
    const availability = deriveChainAvailability(status);
    for (const row of availability) {
      for (const cell of [row.swapIn, row.swapOut, row.lpActions, row.poolDeposits, row.scopedOperations, row.dataQuality]) {
        expect(cell).toMatchObject({ state: 'needs-review', label: 'Review applicability' });
      }
    }
    expect(getNetworkCurrentOnlyStateLabel({
      paused: status.tradingPaused, statusLoading: false, sourceUnavailable: false, networkStatus: status,
    })).toBe('Review applicability');
  });
  it('keeps a global LP pause out of ordinary swap availability', () => {
    const status: NetworkStatus = {
      ...baseStatus,
      state: 'paused',
      lpPaused: true,
      activeControlKeys: ['PAUSELP'],
      activePauseKeys: ['PAUSELP'],
      chainStatuses: [
        chain({ chain: 'BTC', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
        chain({ chain: 'ETH', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
      ],
    };

    const availability = deriveChainAvailability(status);

    expect(availability.every((entry) => entry.swapIn.state === 'available')).toBe(true);
    expect(availability.every((entry) => entry.lpActions.state === 'limited')).toBe(true);
    expect(availability.every((entry) => entry.lpActions.label === 'Network-wide')).toBe(true);
    expect(availability.every((entry) => !entry.reasons.includes('Network-wide LP pause applies'))).toBe(true);
    expect(deriveNetworkWideControls(status)).toEqual([
      expect.objectContaining({
        key: 'PAUSELP',
        label: 'Network-wide LP pause',
      }),
    ]);
  });

  it('surfaces BSC and SOL as explicit swap-limited chains', () => {
    const availability = deriveChainAvailability({
      ...baseStatus,
      chainStatuses: [
        chain({ chain: 'ETH' }),
        chain({ chain: 'BSC', tradingPaused: true, activeMimirKeys: ['HALTBSCTRADING'] }),
        chain({ chain: 'SOL', halted: true, activeMimirKeys: ['HALTSOLCHAIN'] }),
      ],
    });

    expect(availability.map((entry) => entry.chain)).toEqual(['BSC', 'SOL', 'ETH']);
    expect(availability[0]?.swapIn.reasons).toEqual(['Trading halted']);
    expect(availability[1]?.swapIn.reasons).toEqual(['Chain halted']);
    expect(availability[2]?.swapIn).toMatchObject({
      state: 'available',
      label: 'No swap blocker',
    });
  });

  it('treats chain-specific signing pauses as swap-out blockers, not swap-in blockers', () => {
    const status: NetworkStatus = {
      ...baseStatus,
      chainStatuses: [
        chain({ chain: 'BTC', signingPaused: true, activeMimirKeys: ['HALTSIGNINGBTC'] }),
        chain({ chain: 'ETH' }),
      ],
    };
    const availability = deriveChainAvailability(status);

    expect(availability[0]?.chain).toBe('BTC');
    expect(availability[0]?.swapIn.state).toBe('available');
    expect(availability[0]?.swapOut).toMatchObject({
      state: 'limited',
      reasons: ['Signing paused'],
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', status, [pool('BTC.BTC'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'unknown',
      label: 'Quote required',
      reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
    });
    expect(deriveRouteAvailability('ETH.ETH', 'BTC.BTC', status, [pool('BTC.BTC'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'limited',
      label: 'Route likely limited',
      reasons: ['BTC: Signing paused'],
    });
  });

  it('surfaces secured-asset, trade-account, and asym-withdrawal pauses without limiting ordinary swaps', () => {
    const availability = deriveChainAvailability({
      ...baseStatus,
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
        chain({
          chain: 'BASE',
          tradeAccountWithdrawPaused: true,
          tradeAccountWithdrawPauseKeys: ['HaltTradeWithdraw-BASE'],
        }),
      ],
    });
    const eth = availability.find((entry) => entry.chain === 'ETH');
    const btc = availability.find((entry) => entry.chain === 'BTC');
    const base = availability.find((entry) => entry.chain === 'BASE');

    expect(eth?.swapIn.state).toBe('available');
    expect(eth?.swapOut.state).toBe('available');
    expect(eth?.scopedOperations).toMatchObject({
      state: 'limited',
      reasons: ['Secured deposits paused'],
    });
    expect(eth?.reasons).toContain('Secured deposit halt: HaltSecuredDeposit-ETH-ETH');
    expect(btc?.scopedOperations).toMatchObject({
      state: 'limited',
      reasons: ['Asym withdrawals paused'],
    });
    expect(base?.swapIn.state).toBe('available');
    expect(base?.swapOut.state).toBe('available');
    expect(base?.scopedOperations).toMatchObject({
      state: 'limited',
      reasons: ['Trade-account withdrawals paused'],
    });
    expect(base?.reasons).toContain('Trade-account withdrawal halt: HaltTradeWithdraw-BASE');
  });

  it('applies global swap blockers to pre-quote route fallback while keeping LP-only controls separate', () => {
    const tradingHalted: NetworkStatus = {
      ...baseStatus,
      state: 'paused',
      tradingPaused: true,
      activeControlKeys: ['HALTTRADING'],
      activePauseKeys: ['HALTTRADING'],
      chainStatuses: [
        chain({ chain: 'BTC', tradingPaused: true, inheritedMimirKeys: ['HALTTRADING'] }),
        chain({ chain: 'ETH', tradingPaused: true, inheritedMimirKeys: ['HALTTRADING'] }),
      ],
    };
    const lpPausedOnly: NetworkStatus = {
      ...baseStatus,
      state: 'paused',
      lpPaused: true,
      activeControlKeys: ['PAUSELP'],
      activePauseKeys: ['PAUSELP'],
      chainStatuses: [
        chain({ chain: 'BTC', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
        chain({ chain: 'ETH', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
      ],
    };

    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', tradingHalted, [pool('BTC.BTC'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'blocked',
      label: 'Route blocked',
      reasons: ['BTC: Network-wide trading halt', 'ETH: Network-wide trading halt'],
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', lpPausedOnly, [pool('BTC.BTC'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'unknown',
      label: 'Quote required',
      reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
    });
  });

  it('keeps scoped and feature controls out of the network-wide control row', () => {
    const status: NetworkStatus = {
      ...baseStatus,
      state: 'paused',
      activeControlKeys: ['PAUSELPDEPOSIT-*', 'TRADEACCOUNTSDEPOSITENABLED', 'PAUSELP'],
      activePauseKeys: ['PAUSELPDEPOSIT-*', 'TRADEACCOUNTSDEPOSITENABLED', 'PAUSELP'],
      chainStatuses: [
        chain({ chain: 'BTC', lpActionsPaused: true, inheritedMimirKeys: ['PAUSELP'] }),
      ],
    };

    expect(deriveNetworkWideControls(status)).toEqual([
      expect.objectContaining({
        key: 'PAUSELP',
        label: 'Network-wide LP pause',
      }),
    ]);
  });

  it('selects node operator action controls in operator-facing order', () => {
    const controls = deriveNodeOperatorActionControls({
      ...baseStatus,
      monitoredControls: [
        {
          key: 'HALTCHURNING',
          label: 'Churning',
          state: 'active',
          active: true,
          description: 'Validator/vault rotation is halted when active.',
        },
        {
          key: 'HaltOperatorRotate',
          label: 'Operator rotation',
          state: 'unparseable',
          active: false,
          description: 'Node operator rotation is halted when active.',
        },
        {
          key: 'PauseUnbond',
          label: 'Unbonding',
          state: 'not-monitored',
          active: false,
          description: 'Node unbond actions are paused when active.',
        },
        {
          key: 'PauseBond',
          label: 'Bonding',
          state: 'active',
          active: true,
          description: 'Node bond actions are paused when active.',
        },
        {
          key: 'HaltRebond',
          label: 'Rebonding',
          state: 'inactive',
          active: false,
          description: 'Node rebond actions are halted when active.',
        },
      ],
    });

    expect(controls.map((control) => control.key)).toEqual([
      'PauseBond',
      'PauseUnbond',
      'HaltRebond',
      'HaltOperatorRotate',
    ]);
    expect(controls.map((control) => control.state)).toEqual([
      'active',
      'not-monitored',
      'inactive',
      'unparseable',
    ]);
  });

  it('marks source warnings as review without hiding direct blockers', () => {
    const availability = deriveChainAvailability({
      ...baseStatus,
      chainStatuses: [
        chain({
          chain: 'BSC',
          tradingPaused: true,
          activeMimirKeys: ['HALTBSCTRADING'],
          sourceWarnings: ['BSC inbound_addresses omitted halted.'],
        }),
      ],
    });

    expect(availability[0]?.swapIn.state).toBe('limited');
    expect(availability[0]?.dataQuality.state).toBe('needs-review');
    expect(availability[0]?.reasons).toContain('Mimir halt: HALTBSCTRADING');
    expect(availability[0]?.reasons).toContain('BSC inbound_addresses omitted halted.');
  });

  it('keeps unsupported control semantics visible in diagnostics and current-only summaries', () => {
    const applicabilityWarning = {
      severity: 'review' as const,
      category: 'control-applicability' as const,
      message: 'Operational-control semantics have not been reviewed for THORNode 3.19.2.',
      action: 'Review the exact THORNode source revision before interpreting monitored control values.',
      keys: ['HALTTRADING'],
    };
    expect(summarizeSourceWarning(applicabilityWarning)).toBe(
      'Operational-control applicability needs review for this THORNode version.'
    );
  });

  it('uses quote results as the strongest route proof', () => {
    const quoteResult: SwapQuoteProbeResult = {
      request: {
        fromAsset: 'BTC.BTC',
        toAsset: 'ETH.ETH',
        amountBaseUnits: '100000000',
      },
      status: 'available',
      summary: 'THORNode returned a current swap quote for this route.',
      quote: {
        expectedAmountOut: '99000000',
        expiry: Math.floor(Date.now() / 1000) + 60,
        fees: {
          totalBps: 20,
          slippageBps: 5,
        },
        raw: {
          expected_amount_out: '99000000',
        },
      },
    };

    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', undefined, [], quoteResult)).toEqual({
      status: 'available',
      label: 'Quote returned',
      reasons: ['THORNode returned a current swap quote for this route.'],
    });
  });

  it('does not reuse quote proof for a different selected asset pair', () => {
    const quoteResult: SwapQuoteProbeResult = {
      request: {
        fromAsset: 'BTC.BTC',
        toAsset: 'ETH.ETH',
        amountBaseUnits: '100000000',
      },
      status: 'available',
      summary: 'THORNode returned a current swap quote for this route.',
      quote: {
        expectedAmountOut: '99000000',
        fees: {},
        raw: {},
      },
    };

    expect(deriveRouteAvailability('SOL.SOL', 'ETH.ETH', undefined, [], quoteResult)).toEqual({
      status: 'needs-review',
      label: 'Quote does not match selected route',
      reasons: ['The quote was for BTC.BTC -> ETH.ETH, not SOL.SOL -> ETH.ETH. Run the check again.'],
    });
  });

  it('falls back to chain and pool context before a quote is requested', () => {
    const status: NetworkStatus = {
      ...baseStatus,
      sourceWarnings: ['Unknown operation-like Mimir key needs review.'],
      chainStatuses: [
        chain({ chain: 'BSC', tradingPaused: true, activeMimirKeys: ['HALTBSCTRADING'] }),
        chain({ chain: 'ETH' }),
      ],
    };

    expect(deriveRouteAvailability('BSC.BNB', 'ETH.ETH', status, [pool('BSC.BNB'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'limited',
      label: 'Route likely limited',
      reasons: ['BSC: Trading halted'],
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', status, undefined, undefined)).toEqual({
      status: 'unknown',
      label: 'Pool list unavailable',
      reasons: ['Midgard pool choices have not loaded; run a quote probe after sources recover for current route evidence.'],
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', status, [pool('ETH.ETH')], undefined)).toEqual({
      status: 'limited',
      label: 'Pool not listed',
      reasons: ['BTC.BTC is not in the current available Midgard pool list.'],
    });
    expect(deriveRouteAvailability('THOR.RUNE', 'BTC.BTC', { ...baseStatus }, [pool('BTC.BTC')], undefined)).toEqual({
      status: 'unknown',
      label: 'Quote required',
      reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
    });
    expect(deriveRouteAvailability('ETH.ETH', 'BTC.BTC', status, [pool('ETH.ETH'), pool('BTC.BTC')], undefined)).toEqual({
      status: 'needs-review',
      label: 'Quote before trusting',
      reasons: ['No chain-specific swap blocker is visible for this pair, but source warnings still need review.'],
    });
  });

  it('turns explicit quote halts into limited routes without treating other failures as protocol blocks', () => {
    const halted: SwapQuoteProbeResult = {
      request: {
        fromAsset: 'SOL.SOL',
        toAsset: 'BTC.BTC',
        amountBaseUnits: '100000000',
      },
      status: 'limited',
      summary: 'THORNode says this route is currently limited.',
      failure: {
        kind: 'halt',
        message: 'trading is halted on SOL',
      },
    };
    const malformed: SwapQuoteProbeResult = {
      request: {
        fromAsset: 'BTC.BTC',
        toAsset: 'ETH.ETH',
        amountBaseUnits: '100000000',
      },
      status: 'failed',
      summary: 'THORNode could not quote this route.',
      failure: {
        kind: 'malformed',
        message: 'THORNode quote response missing expected_amount_out',
      },
    };

    expect(deriveRouteAvailability('SOL.SOL', 'BTC.BTC', baseStatus, [pool('SOL.SOL'), pool('BTC.BTC')], halted)).toMatchObject({
      status: 'limited',
      label: 'Quote limited',
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', baseStatus, [pool('BTC.BTC'), pool('ETH.ETH')], malformed)).toMatchObject({
      status: 'needs-review',
      label: 'Quote needs review',
    });

    const rateLimited: SwapQuoteProbeResult = {
      ...malformed,
      failure: {
        kind: 'rate-limit',
        httpStatus: 429,
        message: 'THORNode quote endpoint rate limit reached.',
      },
    };

    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', baseStatus, [pool('BTC.BTC'), pool('ETH.ETH')], rateLimited)).toMatchObject({
      status: 'needs-review',
      label: 'Quote needs review',
      reasons: ['THORNode quote endpoint rate limit reached.'],
    });
  });
});


describe('quote proof validity', () => {
  const quote: SwapQuoteProbeResult = {
    request: { fromAsset: 'BTC.BTC', toAsset: 'ETH.ETH', amountBaseUnits: '100000000' },
    status: 'available', summary: 'Quote returned',
    quote: { expectedAmountOut: '99000000', fees: {}, raw: {}, expiry: 1790000000 },
  };
  it.each([1790000000000, 1790000000001])('withdraws positive evidence at/after expiry %d', nowMs => {
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', undefined, [], quote, nowMs)).toMatchObject({ status: 'needs-review', label: 'Quote expired' });
  });
  it('keeps an unexpired quote available at the supplied clock', () => {
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', undefined, [], quote, 1789999999999).status).toBe('available');
  });
  it.each([undefined, NaN, Infinity, -1])('treats expiry %s as unknown', expiry => {
    const unknown = { ...quote, quote: { ...quote.quote!, expiry } };
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', undefined, [], unknown, 1789999999999)).toMatchObject({ status: 'needs-review', label: 'Quote expiry unknown' });
  });
});

it('keeps observed blockers but withdraws clear operation cells when block evidence ages', () => {
  const rows = deriveChainAvailability({ ...baseStatus, chainStatuses: [chain({ chain: 'BTC' }), chain({ chain: 'ETH', tradingPaused: true, activeMimirKeys: ['HALTETHTRADING'] })], sourceWarningDetails: [{ severity: 'critical', category: 'freshness', message: 'stale', action: 'refresh' }] });
  expect(rows.find(row => row.chain === 'BTC')?.swapIn).toMatchObject({ state: 'needs-review', label: 'Dated context' });
  expect(rows.find(row => row.chain === 'ETH')?.swapIn.state).toBe('limited');
});
