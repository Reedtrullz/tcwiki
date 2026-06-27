import { describe, expect, it } from 'vitest';
import { deriveNetworkStatus } from '@/lib/api/thornode';

describe('deriveNetworkStatus', () => {
  it('marks network paused for global Mimir halt flags', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 1, HALTSIGNING: '1', PAUSELP: 1, PAUSELOANS: 0 },
      [{ chain: 'BTC', halted: false }],
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
        RUNEPOOLENABLED: 1,
      },
      [{ chain: 'BTC', halted: false }]
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
    expect(status.runePoolEnabled).toBe(true);
    expect(status.wasmPaused).toBeNull();
    expect(status.activeControlKeys).toEqual([
      'HALTSECUREDGLOBAL',
      'TCYCLAIMINGHALT',
      'TCYCLAIMINGSWAPHALT',
      'TCYSTAKEDISTRIBUTIONHALT',
      'HALTTCYTRADING',
      'TRADEACCOUNTSENABLED',
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
        { chain: 'BSC', halted: false, chain_trading_paused: false, chain_lp_actions_paused: false },
        { chain: 'SOL', halted: false, chain_trading_paused: false, chain_lp_actions_paused: false },
        { chain: 'ETH', halted: false, chain_trading_paused: false, chain_lp_actions_paused: false },
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
        { chain: 'BTC', halted: false, chain_trading_paused: false },
        { chain: 'ETH', halted: false, chain_trading_paused: false },
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
      [{ chain: 'BTC', halted: false }, { chain: 'ETH', halted: false }]
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
      [{ chain: 'BTC', halted: false }]
    );

    expect(status.state).toBe('paused');
    expect(status.nodePauseChainGlobal).toBe(true);
    expect(status.activeControlKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.activeEvidenceKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.activePauseKeys).toEqual(['NODEPAUSECHAINGLOBAL']);
    expect(status.monitoredControls.find((control) => control.key === 'NODEPAUSECHAINGLOBAL')?.state).toBe('active');
  });

  it('marks per-chain signing halts as paused even when global signing is open', () => {
    const status = deriveNetworkStatus(
      { HALTSIGNING: 0, HALTSIGNINGBTC: 1 },
      [{ chain: 'BTC', halted: false }]
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

  it('marks clean state operational', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 0, HALTSIGNING: 0, PAUSELP: 0 },
      [{ chain: 'BTC', halted: false, global_trading_paused: false, chain_trading_paused: false }]
    );

    expect(status.state).toBe('operational');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
  });

  it('does not treat malformed Mimir numeric values as active evidence', () => {
    const status = deriveNetworkStatus(
      {
        HALTTRADING: '',
        StreamingSwapPause: ' 1',
        HALTSIGNINGBTC: 'not-a-number',
        'PAUSELPDEPOSIT-ETH-ETH': '0x10',
        'HaltSecuredDeposit-ETH-ETH': '1e0',
        'HaltWasmContract-thor1contract': '1.0.0',
        NODEPAUSECHAINGLOBAL: ' ',
      },
      [{ chain: 'BTC', halted: false }, { chain: 'ETH', halted: false }]
    );

    expect(status.state).toBe('operational');
    expect(status.tradingPaused).toBe(false);
    expect(status.chainStatuses.find((chain) => chain.chain === 'BTC')?.signingPaused).toBe(false);
    expect(status.chainStatuses.find((chain) => chain.chain === 'ETH')?.lpDepositPaused).toBe(false);
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeChainKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.activePauseKeys).toEqual([]);
    expect(status.streamingSwapsPaused).toBeNull();
    expect(status.nodePauseChainGlobal).toBeNull();
    expect(status.securedAssetDepositPauseKeys).toEqual([]);
    expect(status.wasmContractHaltKeys).toEqual([]);
  });
});
