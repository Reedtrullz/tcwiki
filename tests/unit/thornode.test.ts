import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThornodeAPI, { deriveNetworkStatus, resetThornodeEndpointForTests } from '@/lib/api/thornode';
import type { ThornodeInboundAddress } from '@/lib/types';

const makeResponse = (ok: boolean, data: unknown, status = 200, statusText = 'OK') => ({
  ok,
  status,
  statusText,
  json: vi.fn().mockResolvedValue(data),
});

interface SnapshotFixture {
  mimir: unknown;
  inbound: unknown;
  version: unknown;
  lastBlock: unknown;
}

function completeInbound(chain: string, overrides: Partial<ThornodeInboundAddress> = {}): ThornodeInboundAddress {
  return {
    chain,
    halted: false,
    global_trading_paused: false,
    chain_trading_paused: false,
    chain_lp_actions_paused: false,
    ...overrides,
  };
}

function snapshotFixture(overrides: Partial<SnapshotFixture> = {}): SnapshotFixture {
  return {
    mimir: { HALTTRADING: 0 },
    inbound: [completeInbound('BTC')],
    version: { current: '3.19.2' },
    lastBlock: [{ chain: 'THOR', thorchain: 100 }],
    ...overrides,
  };
}

function stubNetworkStatusSnapshots(liquify: SnapshotFixture, publicThornode: SnapshotFixture) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const snapshot = url.includes('gateway.liquify.com') ? liquify : publicThornode;

    if (url.endsWith('/mimir')) {
      return makeResponse(true, snapshot.mimir);
    }
    if (url.endsWith('/inbound_addresses')) {
      return makeResponse(true, snapshot.inbound);
    }
    if (url.endsWith('/version')) {
      return makeResponse(true, snapshot.version);
    }
    if (url.endsWith('/lastblock')) {
      return makeResponse(true, snapshot.lastBlock);
    }

    return makeResponse(false, {}, 404, 'Not Found');
  }));
}

describe('deriveNetworkStatus', () => {
  beforeEach(() => {
    resetThornodeEndpointForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('marks network paused for global Mimir halt flags', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 1, HALTSIGNING: '1', PAUSELP: 1, PAUSELOANS: 0 },
      [completeInbound('BTC')],
      '3.19.1'
    );

    expect(status.state).toBe('paused');
    expect(status.tradingPaused).toBe(true);
    expect(status.signingPaused).toBe(true);
    expect(status.lpPaused).toBe(true);
    expect(status.activeControlKeys).toEqual(['HALTTRADING', 'HALTSIGNING', 'PAUSELP']);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual(['HALTTRADING', 'HALTSIGNING', 'PAUSELP']);
    expect(status.thorNodeVersion).toBe('3.19.1');
  });

  it('tracks newer Mimir controls and marks missing optional controls as not monitored', () => {
    const status = deriveNetworkStatus(
      {
        HALTSECUREDGLOBAL: '1',
        TCYCLAIMINGHALT: 1,
        TCYCLAIMINGSWAPHALT: 1,
        TCYSTAKINGHALT: 0,
        TCYSTAKEDISTRIBUTIONHALT: 1,
        TCYUNSTAKINGHALT: 0,
        HALTTCYTRADING: 1,
        TRADEACCOUNTSENABLED: 0,
        MANUALSWAPSTOSYNTHDISABLED: 1,
        RUNEPOOLENABLED: 1,
      },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('paused');
    expect(status.securedAssetsPaused).toBe(true);
    expect(status.tcyClaimingPaused).toBe(true);
    expect(status.tcyClaimingSwapPaused).toBe(true);
    expect(status.tcyStakingPaused).toBe(false);
    expect(status.tcyStakeDistributionPaused).toBe(true);
    expect(status.tcyUnstakingPaused).toBe(false);
    expect(status.tcyTradingPaused).toBe(true);
    expect(status.tradeAccountsEnabled).toBe(false);
    expect(status.manualSwapsToSynthDisabled).toBe(true);
    expect(status.runePoolEnabled).toBe(true);
    expect(status.wasmPaused).toBeNull();
    expect(status.activeControlKeys).toEqual([
      'HALTSECUREDGLOBAL',
      'TCYCLAIMINGHALT',
      'TCYCLAIMINGSWAPHALT',
      'TCYSTAKEDISTRIBUTIONHALT',
      'HALTTCYTRADING',
      'TRADEACCOUNTSENABLED',
      'MANUALSWAPSTOSYNTHDISABLED',
    ]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual(status.activeControlKeys);
    expect(status.monitoredControls.find((control) => control.key === 'HALTWASMGLOBAL')?.state).toBe('not-monitored');
  });

  it('marks chain-level pause flags without global Mimir flags', () => {
    const status = deriveNetworkStatus(
      {},
      [
        {
          chain: 'ETH',
          halted: true,
          global_trading_paused: true,
          chain_trading_paused: true,
          chain_lp_actions_paused: true,
        },
      ]
    );

    expect(status.state).toBe('paused');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.chainStatuses[0]).toEqual({
      chain: 'ETH',
      halted: true,
      tradingPaused: true,
      lpActionsPaused: true,
      lpDepositPaused: false,
      signingPaused: false,
      activeMimirKeys: [],
      lpDepositPauseKeys: [],
    });
  });

  it('marks direct chain-specific Mimir halt and LP keys as active source evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTBSCTRADING: 1,
        HALTSOLCHAIN: '1',
        HALTSOLTRADING: 1,
        PAUSELPETH: 1,
        'PAUSELPDEPOSIT-ETH-ETH': 1,
        'PAUSELPDEPOSIT-BSC-BNB': 1,
      },
      [
        completeInbound('BSC'),
        completeInbound('SOL'),
        completeInbound('ETH'),
      ]
    );

    expect(status.state).toBe('paused');
    expect(status.activeControlKeys).toEqual(['PAUSELPDEPOSIT-*']);
    expect(status.activeChainKeys).toEqual([
      'HALTBSCTRADING',
      'HALTSOLCHAIN',
      'HALTSOLTRADING',
      'PAUSELPETH',
    ]);
    expect(status.activeEvidenceKeys).toEqual([
      'HALTBSCTRADING',
      'HALTSOLCHAIN',
      'HALTSOLTRADING',
      'PAUSELPETH',
      'PAUSELPDEPOSIT-BSC-BNB',
      'PAUSELPDEPOSIT-ETH-ETH',
    ]);
    expect(status.activePauseKeys).toEqual([
      'PAUSELPDEPOSIT-*',
      'HALTBSCTRADING',
      'HALTSOLCHAIN',
      'HALTSOLTRADING',
      'PAUSELPETH',
      'PAUSELPDEPOSIT-BSC-BNB',
      'PAUSELPDEPOSIT-ETH-ETH',
    ]);
    expect(status.poolDepositPauseKeys).toEqual(['PAUSELPDEPOSIT-BSC-BNB', 'PAUSELPDEPOSIT-ETH-ETH']);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'BSC',
        halted: false,
        tradingPaused: true,
        lpActionsPaused: false,
        lpDepositPaused: true,
        signingPaused: false,
        activeMimirKeys: ['HALTBSCTRADING'],
        lpDepositPauseKeys: ['PAUSELPDEPOSIT-BSC-BNB'],
      },
      {
        chain: 'SOL',
        halted: true,
        tradingPaused: true,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: ['HALTSOLCHAIN', 'HALTSOLTRADING'],
        lpDepositPauseKeys: [],
      },
      {
        chain: 'ETH',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: true,
        lpDepositPaused: true,
        signingPaused: false,
        activeMimirKeys: ['PAUSELPETH'],
        lpDepositPauseKeys: ['PAUSELPDEPOSIT-ETH-ETH'],
      },
    ]);
  });

  it('propagates global trading halts to every inbound chain status', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 1 },
      [
        completeInbound('BTC'),
        completeInbound('ETH'),
      ]
    );

    expect(status.chainStatuses.map((chain) => [chain.chain, chain.tradingPaused])).toEqual([
      ['BTC', true],
      ['ETH', true],
    ]);
    expect(status.activeControlKeys).toEqual(['HALTTRADING']);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toContain('HALTTRADING');
  });

  it('preserves active Mimir-only chain keys when inbound addresses omit that chain', () => {
    const status = deriveNetworkStatus(
      {
        HALTBSCTRADING: 1,
        'PAUSELPDEPOSIT-SOL-SOL': 1,
      },
      []
    );

    expect(status.chainStatuses).toEqual([
      {
        chain: 'BSC',
        halted: false,
        tradingPaused: true,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: ['HALTBSCTRADING'],
        lpDepositPauseKeys: [],
      },
      {
        chain: 'SOL',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: true,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: ['PAUSELPDEPOSIT-SOL-SOL'],
      },
    ]);
    expect(status.activeControlKeys).toEqual(['PAUSELPDEPOSIT-*']);
    expect(status.activeChainKeys).toEqual(['HALTBSCTRADING']);
    expect(status.activeEvidenceKeys).toEqual(['HALTBSCTRADING', 'PAUSELPDEPOSIT-SOL-SOL']);
    expect(status.activePauseKeys).toEqual([
      'PAUSELPDEPOSIT-*',
      'HALTBSCTRADING',
      'PAUSELPDEPOSIT-SOL-SOL',
    ]);
  });

  it('tracks expanded current Mimir halt categories and scoped prefix evidence', () => {
    const status = deriveNetworkStatus(
      {
        StreamingSwapPause: 1,
        HaltMemoless: '1',
        RUNEPoolHaltDeposit: 1,
        RUNEPoolHaltWithdraw: '1',
        PauseBond: 1,
        PauseUnbond: 1,
        HaltRebond: 1,
        HaltOperatorRotate: 1,
        HaltOracle: 1,
        'HaltSecuredDeposit-ETH-ETH': 1,
        'HaltSecuredWithdraw-BTC-BTC': 1,
        'HaltWasmDeployer-thor1deployer': 1,
        'HaltWasmCs-abc123': 1,
        'HaltWasmContract-thor1contract': 1,
      },
      [completeInbound('BTC'), completeInbound('ETH')]
    );

    expect(status.state).toBe('paused');
    expect(status.streamingSwapsPaused).toBe(true);
    expect(status.memolessTransactionsHalted).toBe(true);
    expect(status.runePoolDepositPaused).toBe(true);
    expect(status.runePoolWithdrawPaused).toBe(true);
    expect(status.bondPaused).toBe(true);
    expect(status.unbondPaused).toBe(true);
    expect(status.rebondHalted).toBe(true);
    expect(status.operatorRotateHalted).toBe(true);
    expect(status.oracleHalted).toBe(true);
    expect(status.securedAssetDepositPauseKeys).toEqual(['HaltSecuredDeposit-ETH-ETH']);
    expect(status.securedAssetWithdrawPauseKeys).toEqual(['HaltSecuredWithdraw-BTC-BTC']);
    expect(status.wasmDeployerHaltKeys).toEqual(['HaltWasmDeployer-thor1deployer']);
    expect(status.wasmCodeHashHaltKeys).toEqual(['HaltWasmCs-abc123']);
    expect(status.wasmContractHaltKeys).toEqual(['HaltWasmContract-thor1contract']);
    expect(status.scopedWasmHaltKeys).toEqual([
      'HaltWasmDeployer-thor1deployer',
      'HaltWasmCs-abc123',
      'HaltWasmContract-thor1contract',
    ]);
    expect(status.activeControlKeys).toEqual([
      'StreamingSwapPause',
      'HaltMemoless',
      'RUNEPoolHaltDeposit',
      'RUNEPoolHaltWithdraw',
      'PauseBond',
      'PauseUnbond',
      'HaltRebond',
      'HaltOperatorRotate',
      'HaltOracle',
      'HaltSecuredDeposit-*',
      'HaltSecuredWithdraw-*',
      'HaltWasmDeployer-*',
      'HaltWasmCs-*',
      'HaltWasmContract-*',
    ]);
    expect(status.activeEvidenceKeys).toEqual([
      'HaltSecuredDeposit-ETH-ETH',
      'HaltSecuredWithdraw-BTC-BTC',
      'HaltWasmDeployer-thor1deployer',
      'HaltWasmCs-abc123',
      'HaltWasmContract-thor1contract',
    ]);
    expect(status.activePauseKeys).toEqual([
      'StreamingSwapPause',
      'HaltMemoless',
      'RUNEPoolHaltDeposit',
      'RUNEPoolHaltWithdraw',
      'PauseBond',
      'PauseUnbond',
      'HaltRebond',
      'HaltOperatorRotate',
      'HaltOracle',
      'HaltSecuredDeposit-*',
      'HaltSecuredWithdraw-*',
      'HaltWasmDeployer-*',
      'HaltWasmCs-*',
      'HaltWasmContract-*',
      'HaltSecuredDeposit-ETH-ETH',
      'HaltSecuredWithdraw-BTC-BTC',
      'HaltWasmDeployer-thor1deployer',
      'HaltWasmCs-abc123',
      'HaltWasmContract-thor1contract',
    ]);
  });

  it('classifies NODEPAUSECHAINGLOBAL as both node pause control and source evidence', () => {
    const status = deriveNetworkStatus(
      { NODEPAUSECHAINGLOBAL: 1 },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('paused');
    expect(status.nodePauseChainGlobal).toBe(true);
    expect(status.activeControlKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.activeEvidenceKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.activePauseKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.monitoredControls.find((control) => control.key === 'NODEPAUSECHAINGLOBAL')?.state).toBe('active');
  });

  it('uses THORChain height semantics for future halts and expired node pauses', () => {
    const status = deriveNetworkStatus(
      {
        HALTTRADING: 200,
        HALTSIGNINGBTC: 200,
        PAUSELP: 50,
        NODEPAUSECHAINGLOBAL: 90,
        RUNEPoolHaltDeposit: 200,
        HALTWASMGLOBAL: 100,
      },
      [completeInbound('BTC')],
      '3.19.2',
      100
    );

    expect(status.state).toBe('paused');
    expect(status.tradingPaused).toBe(false);
    expect(status.signingPaused).toBe(false);
    expect(status.lpPaused).toBe(true);
    expect(status.nodePauseChainGlobal).toBe(false);
    expect(status.runePoolDepositPaused).toBe(false);
    expect(status.wasmPaused).toBe(false);
    expect(status.thorchainHeight).toBe(100);
    expect(status.activeControlKeys).toEqual(['PAUSELP']);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.scheduledMimirKeys).toEqual([
      'HALTSIGNINGBTC',
      'HALTTRADING',
      'HALTWASMGLOBAL',
      'RUNEPoolHaltDeposit',
    ]);
    expect(status.chainStatuses[0]).toEqual({
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: true,
      lpDepositPaused: false,
      signingPaused: false,
      activeMimirKeys: [],
      lpDepositPauseKeys: [],
      scheduledMimirKeys: ['HALTSIGNINGBTC'],
    });
    expect(status.monitoredControls.find((control) => control.key === 'HALTTRADING')?.state).toBe('scheduled');
    expect(status.monitoredControls.find((control) => control.key === 'NODEPAUSECHAINGLOBAL')?.state).toBe('inactive');
    expect(status.monitoredControls.find((control) => control.key === 'HALTWASMGLOBAL')?.state).toBe('scheduled');
  });

  it('treats node chain pause as active only until its expiry height', () => {
    const active = deriveNetworkStatus(
      { NODEPAUSECHAINGLOBAL: 150 },
      [completeInbound('BTC')],
      '3.19.2',
      100
    );
    const expired = deriveNetworkStatus(
      { NODEPAUSECHAINGLOBAL: 50 },
      [completeInbound('BTC')],
      '3.19.2',
      100
    );

    expect(active.state).toBe('paused');
    expect(active.nodePauseChainGlobal).toBe(true);
    expect(active.activeControlKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(active.activeEvidenceKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(active.chainStatuses[0]?.halted).toBe(true);
    expect(expired.state).toBe('operational');
    expect(expired.nodePauseChainGlobal).toBe(false);
    expect(expired.activeControlKeys).toEqual([]);
    expect(expired.activeEvidenceKeys).toEqual([]);
    expect(expired.chainStatuses[0]?.halted).toBe(false);
  });

  it('covers native THOR chain halts and additional enablement controls', () => {
    const status = deriveNetworkStatus(
      {
        HALTTHORCHAIN: 1,
        TRADEACCOUNTSDEPOSITENABLED: 0,
        BANKSENDENABLED: 0,
      },
      [],
      '3.19.2',
      100
    );

    expect(status.state).toBe('paused');
    expect(status.tradeAccountDepositsEnabled).toBe(false);
    expect(status.bankSendEnabled).toBe(false);
    expect(status.activeControlKeys).toEqual(['TRADEACCOUNTSDEPOSITENABLED', 'BANKSENDENABLED']);
    expect(status.activeChainKeys).toEqual(['HALTTHORCHAIN']);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'THOR',
        halted: true,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: ['HALTTHORCHAIN'],
        lpDepositPauseKeys: [],
      },
    ]);
  });

  it('tracks asymmetric withdrawal, secured-asset, and WASM scoped controls with exact height semantics', () => {
    const status = deriveNetworkStatus(
      {
        'PauseAsymWithdrawal-BTC': 1,
        'HaltSecuredDeposit-ETH': 50,
        'HaltSecuredWithdraw-BTC': 200,
        'HaltWasmContract-thor1contract': 100,
      },
      [completeInbound('BTC'), completeInbound('ETH')],
      '3.19.2',
      100
    );

    expect(status.state).toBe('paused');
    expect(status.asymWithdrawalPauseKeys).toEqual(['PauseAsymWithdrawal-BTC']);
    expect(status.securedAssetDepositPauseKeys).toEqual(['HaltSecuredDeposit-ETH']);
    expect(status.securedAssetWithdrawPauseKeys).toEqual([]);
    expect(status.wasmContractHaltKeys).toEqual([]);
    expect(status.activeControlKeys).toEqual(['PauseAsymWithdrawal-*', 'HaltSecuredDeposit-*']);
    expect(status.activeEvidenceKeys).toEqual(['PauseAsymWithdrawal-BTC', 'HaltSecuredDeposit-ETH']);
    expect(status.scheduledMimirKeys).toEqual(['HaltSecuredWithdraw-BTC', 'HaltWasmContract-thor1contract']);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'BTC',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: [],
        asymWithdrawalPaused: true,
        asymWithdrawalPauseKeys: ['PauseAsymWithdrawal-BTC'],
        scheduledMimirKeys: ['HaltSecuredWithdraw-BTC'],
      },
      {
        chain: 'ETH',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: [],
        securedAssetDepositPaused: true,
        securedAssetDepositPauseKeys: ['HaltSecuredDeposit-ETH'],
      },
    ]);
  });

  it('marks per-chain signing halts as paused even when global signing is open', () => {
    const status = deriveNetworkStatus(
      { HALTSIGNING: 0, HALTSIGNINGBTC: 1 },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('paused');
    expect(status.signingPaused).toBe(true);
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual(['HALTSIGNINGBTC']);
    expect(status.activeEvidenceKeys).toEqual(['HALTSIGNINGBTC']);
    expect(status.activePauseKeys).toContain('HALTSIGNINGBTC');
    expect(status.chainStatuses[0]).toEqual({
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      lpDepositPaused: false,
      signingPaused: true,
      activeMimirKeys: ['HALTSIGNINGBTC'],
      lpDepositPauseKeys: [],
    });
  });

  it('marks observed chain signing and solvency halt keys as active source evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTETHSIGNING: 1,
        SOLVENCYHALTBTCCHAIN: '1',
      },
      []
    );

    expect(status.state).toBe('paused');
    expect(status.signingPaused).toBe(true);
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual(['SOLVENCYHALTBTCCHAIN', 'HALTETHSIGNING']);
    expect(status.activeEvidenceKeys).toEqual(['SOLVENCYHALTBTCCHAIN', 'HALTETHSIGNING']);
    expect(status.activePauseKeys).toEqual(['SOLVENCYHALTBTCCHAIN', 'HALTETHSIGNING']);
    expect(status.invalidMimirKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([]);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'BTC',
        halted: true,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: ['SOLVENCYHALTBTCCHAIN'],
        lpDepositPauseKeys: [],
      },
      {
        chain: 'ETH',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: true,
        activeMimirKeys: ['HALTETHSIGNING'],
        lpDepositPauseKeys: [],
      },
    ]);
  });

  it('scopes malformed direct chain Mimir keys to the affected chain without active evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTSIGNINGBTC: 'not-a-number',
        HALTBTCTRADING: 'true',
        HALTBTCCHAIN: '',
        PAUSELPBTC: ' ',
      },
      []
    );

    expect(status.state).toBe('operational');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([
      'HALTBTCCHAIN',
      'HALTBTCTRADING',
      'HALTSIGNINGBTC',
      'PAUSELPBTC',
    ]);
    expect(status.sourceWarnings).toEqual(['4 monitored Mimir keys could not be parsed.']);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'BTC',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: [],
        unparseableMimirKeys: [
          'HALTBTCCHAIN',
          'HALTBTCTRADING',
          'HALTSIGNINGBTC',
          'PAUSELPBTC',
        ],
      },
    ]);
  });

  it('scopes malformed observed chain Mimir keys without active evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTETHSIGNING: 'paused',
        SOLVENCYHALTBTCCHAIN: 'halted',
      },
      []
    );

    expect(status.state).toBe('operational');
    expect(status.signingPaused).toBe(false);
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual(['HALTETHSIGNING', 'SOLVENCYHALTBTCCHAIN']);
    expect(status.sourceWarnings).toEqual(['2 monitored Mimir keys could not be parsed.']);
    expect(status.chainStatuses).toEqual([
      {
        chain: 'BTC',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: [],
        unparseableMimirKeys: ['SOLVENCYHALTBTCCHAIN'],
      },
      {
        chain: 'ETH',
        halted: false,
        tradingPaused: false,
        lpActionsPaused: false,
        lpDepositPaused: false,
        signingPaused: false,
        activeMimirKeys: [],
        lpDepositPauseKeys: [],
        unparseableMimirKeys: ['HALTETHSIGNING'],
      },
    ]);
  });

  it('marks clean state operational', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 0, HALTSIGNING: 0, PAUSELP: 0 },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('operational');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([]);
  });

  it('degrades when inbound_addresses omits operation fields needed to prove chains open', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 0, HALTSIGNING: 0, PAUSELP: 0 },
      [{ chain: 'BTC' }],
      '3.19.2',
      100
    );

    const warning = 'BTC inbound_addresses omitted halted, global_trading_paused, chain_trading_paused, chain_lp_actions_paused; live chain operation state is partial.';
    expect(status.state).toBe('degraded');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([warning]);
    expect(status.summary).toBe('Current-only live sources do not show active halt flags, but source warnings need review.');
    expect(status.chainStatuses[0]).toEqual({
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      lpDepositPaused: false,
      signingPaused: false,
      activeMimirKeys: [],
      lpDepositPauseKeys: [],
      sourceWarnings: [warning],
    });
  });

  it('surfaces malformed monitored Mimir numeric values without treating them as active evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTTRADING: '',
        StreamingSwapPause: ' 1',
        HALTSIGNINGBTC: 'not-a-number',
        'PAUSELPDEPOSIT-ETH-ETH': '0x10',
        'HaltSecuredDeposit-ETH-ETH': '1e0',
        'HaltWasmContract-thor1contract': '1.0.0',
        NODEPAUSECHAINGLOBAL: ' ',
        TRADEACCOUNTSENABLED: 'maybe',
        RUNEPOOLENABLED: ' ',
      },
      [completeInbound('BTC'), completeInbound('ETH')]
    );

    expect(status.state).toBe('operational');
    expect(status.tradingPaused).toBe(false);
    expect(status.chainStatuses.find((chain) => chain.chain === 'BTC')?.signingPaused).toBe(false);
    expect(status.chainStatuses.find((chain) => chain.chain === 'ETH')?.lpDepositPaused).toBe(false);
    expect(status.chainStatuses.find((chain) => chain.chain === 'BTC')?.unparseableMimirKeys).toEqual(['HALTSIGNINGBTC']);
    expect(status.chainStatuses.find((chain) => chain.chain === 'ETH')?.unparseableMimirKeys).toEqual([
      'HaltSecuredDeposit-ETH-ETH',
      'PAUSELPDEPOSIT-ETH-ETH',
    ]);
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.streamingSwapsPaused).toBeNull();
    expect(status.nodePauseChainGlobal).toBeNull();
    expect(status.securedAssetDepositPauseKeys).toEqual([]);
    expect(status.wasmContractHaltKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([
      'HaltSecuredDeposit-ETH-ETH',
      'HALTSIGNINGBTC',
      'HALTTRADING',
      'HaltWasmContract-thor1contract',
      'NODEPAUSECHAINGLOBAL',
      'PAUSELPDEPOSIT-ETH-ETH',
      'RUNEPOOLENABLED',
      'StreamingSwapPause',
      'TRADEACCOUNTSENABLED',
    ]);
    expect(status.sourceWarnings).toEqual(['9 monitored Mimir keys could not be parsed.']);
    expect(status.summary).toContain('source warnings');
    expect(status.monitoredControls.find((control) => control.key === 'HALTTRADING')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'StreamingSwapPause')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'NODEPAUSECHAINGLOBAL')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'PAUSELPDEPOSIT-*')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'HaltSecuredDeposit-*')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'HaltWasmContract-*')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'TRADEACCOUNTSENABLED')?.state).toBe('unparseable');
    expect(status.monitoredControls.find((control) => control.key === 'RUNEPOOLENABLED')?.state).toBe('unparseable');
  });

  it('treats non-integer Mimir values as unparseable instead of inactive', () => {
    const status = deriveNetworkStatus(
      {
        HALTTRADING: false,
        HALTSIGNING: true,
        PAUSELP: null,
        StreamingSwapPause: [],
        'PAUSELPDEPOSIT-ETH-ETH': { value: 1 },
        'HaltSecuredWithdraw-BTC': 1.5,
      },
      [completeInbound('BTC'), completeInbound('ETH')],
      '3.19.2',
      100
    );

    expect(status.state).toBe('operational');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([
      'HaltSecuredWithdraw-BTC',
      'HALTSIGNING',
      'HALTTRADING',
      'PAUSELP',
      'PAUSELPDEPOSIT-ETH-ETH',
      'StreamingSwapPause',
    ]);
    expect(status.chainStatuses.find((chain) => chain.chain === 'BTC')?.unparseableMimirKeys).toEqual(['HaltSecuredWithdraw-BTC']);
    expect(status.chainStatuses.find((chain) => chain.chain === 'ETH')?.unparseableMimirKeys).toEqual(['PAUSELPDEPOSIT-ETH-ETH']);
    expect(status.sourceWarnings).toEqual(['6 monitored Mimir keys could not be parsed.']);
  });

  it('warns on unknown chain-scoped Mimir keys without creating phantom chain cards', () => {
    const status = deriveNetworkStatus(
      {
        HALTBTCHAIN: 1,
        HALTFOOTRADING: 'bad',
        PAUSELPFOO: ' ',
      },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('operational');
    expect(status.chainStatuses.map((chain) => chain.chain)).toEqual(['BTC']);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.invalidMimirKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([
      'Unknown chain-scoped Mimir keys ignored: HALTBTCHAIN, HALTFOOTRADING, PAUSELPFOO.',
    ]);
    expect(status.summary).toContain('source warnings');
  });

  it('warns on unknown disabled enablement-like Mimir controls', () => {
    const status = deriveNetworkStatus(
      {
        NewFeatureEnabled: 0,
        OtherFeatureDisabled: 1,
        BenignLimit: 1,
      },
      [completeInbound('BTC')]
    );

    expect(status.state).toBe('operational');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([
      'Unknown operation-like Mimir keys need review: NewFeatureEnabled, OtherFeatureDisabled.',
    ]);
  });

  it('falls back to a complete second THORNode endpoint when the first snapshot shape is unusable', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        mimir: [],
        inbound: [completeInbound('ETH', { halted: true })],
        version: { current: 'first-provider' },
        lastBlock: [{ chain: 'THOR', thorchain: 100 }],
      }),
      snapshotFixture({
        mimir: { HALTTRADING: 0 },
        inbound: [completeInbound('BTC')],
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'THOR', thorchain: 101 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.state).toBe('operational');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.thorchainHeight).toBe(101);
    expect(result.data?.chainStatuses.map((chain) => chain.chain)).toEqual(['BTC']);
  });

  it('does not mix THORNode snapshot parts across providers', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        mimir: { HALTTRADING: 1 },
        inbound: [completeInbound('BTC', { halted: true })],
        version: { current: 'first-provider' },
        lastBlock: [{ chain: 'THOR' }],
      }),
      snapshotFixture({
        mimir: { HALTTRADING: 0 },
        inbound: [completeInbound('BTC')],
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'THOR', thorchain: 100 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.state).toBe('operational');
    expect(result.data?.tradingPaused).toBe(false);
    expect(result.data?.chainStatuses[0]?.halted).toBe(false);
    expect(result.data?.thorNodeVersion).toBe('second-provider');
  });

  it('falls back when a THORNode provider returns an unusable version shape', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        version: { current: '' },
        lastBlock: [{ chain: 'THOR', thorchain: 100 }],
      }),
      snapshotFixture({
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'THOR', thorchain: 101 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.thorchainHeight).toBe(101);
  });

  it('degrades network status when every THORNode endpoint has an unusable snapshot', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({ inbound: { chain: 'BTC', halted: false } }),
      snapshotFixture({ lastBlock: [{ chain: 'THOR' }] })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('THORNode status sources did not provide a usable snapshot');
    expect(result.error).toContain('THORNode inbound_addresses response was not a valid chain list.');
    expect(result.error).toContain('THORNode lastblock response did not include a usable THORChain height.');
    expect(result.sources?.map((source) => source.label)).toEqual(['Liquify THORNode', 'THORChain THORNode']);
  });
});
