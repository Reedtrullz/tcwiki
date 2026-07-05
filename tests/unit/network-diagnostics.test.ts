import { describe, expect, it } from 'vitest';
import {
  deriveChainAvailability,
  deriveNetworkWideControls,
  deriveRouteAvailability,
} from '@/lib/network-diagnostics';
import type { ChainOperationalStatus, NetworkStatus, Pool, SwapQuoteProbeResult } from '@/lib/types';

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
    expect(availability[2]?.swapIn.state).toBe('available');
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
      label: 'Ready to quote',
      reasons: ['No visible chain blocker; run a quote probe for current route evidence.'],
    });
    expect(deriveRouteAvailability('ETH.ETH', 'BTC.BTC', status, [pool('BTC.BTC'), pool('ETH.ETH')], undefined)).toEqual({
      status: 'limited',
      label: 'Route likely limited',
      reasons: ['BTC: Signing paused'],
    });
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
      label: 'Quote available',
      reasons: ['THORNode returned a current swap quote for this route.'],
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
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', status, [pool('ETH.ETH')], undefined)).toEqual({
      status: 'limited',
      label: 'Pool not listed',
      reasons: ['BTC.BTC is not in the current available Midgard pool list.'],
    });
    expect(deriveRouteAvailability('ETH.ETH', 'BTC.BTC', status, [pool('ETH.ETH'), pool('BTC.BTC')], undefined)).toEqual({
      status: 'needs-review',
      label: 'Quote before trusting',
      reasons: ['No chain-specific swap blocker is visible for this pair, but source warnings still need review.'],
    });
  });

  it('turns quote failures into blocked or limited route labels', () => {
    const halted: SwapQuoteProbeResult = {
      request: {
        fromAsset: 'SOL.SOL',
        toAsset: 'BTC.BTC',
        amountBaseUnits: '100000000',
      },
      status: 'limited',
      summary: 'THORNode says this route is currently limited.',
      failure: {
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
        message: 'THORNode quote response missing expected_amount_out',
      },
    };

    expect(deriveRouteAvailability('SOL.SOL', 'BTC.BTC', baseStatus, [pool('SOL.SOL'), pool('BTC.BTC')], halted)).toMatchObject({
      status: 'limited',
      label: 'Quote limited',
    });
    expect(deriveRouteAvailability('BTC.BTC', 'ETH.ETH', baseStatus, [pool('BTC.BTC'), pool('ETH.ETH')], malformed)).toMatchObject({
      status: 'blocked',
      label: 'Quote failed',
    });
  });
});
