import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ThornodeAPI, { deriveDynamicL1FeeStatus, deriveNetworkStatus, deriveRunePoolPolStatus, resetThornodeEndpointForTests } from '@/lib/api/thornode';
import type { DynamicL1FeeSourceFreshness, RunePoolSourceFreshness, ThornodeInboundAddress } from '@/lib/types';

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
  latestBlock: unknown;
}

interface DynamicFeeFixture {
  mimir: unknown;
  dynamicFees: unknown;
  currentDynamicFees: unknown;
  histories: Record<string, unknown>;
  latestBlock: unknown;
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
    lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
    latestBlock: { block: { header: { height: '101', time: new Date().toISOString() } } },
    ...overrides,
  };
}

function stubNetworkStatusSnapshots(liquify: SnapshotFixture, publicThornode: SnapshotFixture) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pathname = new URL(url).pathname;
    const snapshot = url.includes('gateway.liquify.com') ? liquify : publicThornode;

    if (pathname.endsWith('/mimir')) {
      return makeResponse(true, snapshot.mimir);
    }
    if (pathname.endsWith('/inbound_addresses')) {
      return makeResponse(true, snapshot.inbound);
    }
    if (pathname.endsWith('/version')) {
      return makeResponse(true, snapshot.version);
    }
    if (pathname.endsWith('/lastblock')) {
      return makeResponse(true, snapshot.lastBlock);
    }
    if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
      return makeResponse(true, snapshot.latestBlock);
    }

    return makeResponse(false, {}, 404, 'Not Found');
  }));
}

function dynamicFeeFixture(overrides: Partial<DynamicFeeFixture> = {}): DynamicFeeFixture {
  return {
    mimir: {
      L1DYNAMICFEEENABLED: 1,
      L1SLIPMINBPS: 10,
      'DYNAMICFEE-WHITELIST-SS': 1,
    },
    dynamicFees: {
      entries: [
        {
          thorname: 'ss',
          pair: 'THOR.RUNE|THOR.TCY',
          dynamic_bps: '1',
          whitelist_state: '1',
          last_active_epoch: '0',
          latest_fees_tor: '',
        },
      ],
    },
    currentDynamicFees: {
      epoch: '1864',
      entries: [
        {
          thorname: 'ss',
          pair: 'THOR.RUNE|THOR.TCY',
          volume_tor: '185642164687',
          fees_tor: '123938141',
          epoch: '1864',
        },
      ],
    },
    histories: {
      ss: {
        thorname: 'ss',
        whitelist_state: '1',
        pairs: [
          {
            pair: 'THOR.RUNE|THOR.TCY',
            dynamic_bps: '1',
            last_active_epoch: '0',
            history: [],
          },
        ],
      },
    },
    latestBlock: { block: { header: { height: '101', time: new Date().toISOString() } } },
    ...overrides,
  };
}

function stubDynamicFeeSnapshots(liquify: DynamicFeeFixture, publicThornode: DynamicFeeFixture) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pathname = new URL(url).pathname;
    const snapshot = url.includes('gateway.liquify.com') ? liquify : publicThornode;

    if (pathname.endsWith('/mimir')) {
      return makeResponse(true, snapshot.mimir);
    }
    if (pathname.endsWith('/dynamic_l1_fees')) {
      return makeResponse(true, snapshot.dynamicFees);
    }
    if (pathname.endsWith('/dynamic_l1_fees_current')) {
      return makeResponse(true, snapshot.currentDynamicFees);
    }
    const historyMatch = pathname.match(/\/dynamic_l1_fees\/([^/]+)$/);
    if (historyMatch) {
      const thorname = decodeURIComponent(historyMatch[1] ?? '').toLowerCase();
      const history = snapshot.histories[thorname];
      return history === undefined
        ? makeResponse(false, {}, 404, 'Not Found')
        : makeResponse(true, history);
    }
    if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
      return makeResponse(true, snapshot.latestBlock);
    }

    return makeResponse(false, {}, 404, 'Not Found');
  }));
}

interface RunePoolFixture {
  mimir: unknown;
  runepool: unknown;
  latestBlock: unknown;
}

function runePoolFixture(overrides: Partial<RunePoolFixture> = {}): RunePoolFixture {
  return {
    mimir: {
      'POL-BTC': 1,
      'POL-ETH': 0,
      RUNEPoolDepositMaturityBlocks: '14400',
      RUNEPoolMaxReserveBackstop: '2500000000000',
      MINRUNEPOOLDEPTH: '1000000000000',
    },
    runepool: {
      pol: {
        rune_deposited: '1250313135142376',
        rune_withdrawn: '690803512821382',
        value: '374089371198518',
        pnl: '-185420251122476',
        current_deposit: '559509622320994',
      },
      providers: {
        units: '244190152445550',
        pending_units: '0',
        pending_rune: '0',
        value: '179737127677024',
        pnl: '-105713323488637',
        current_deposit: '285450451165661',
      },
      reserve: {
        units: '264046191162734',
        value: '194352243521494',
        pnl: '-79706927633839',
        current_deposit: '274059171155333',
      },
    },
    latestBlock: { block: { header: { height: '101', time: new Date().toISOString() } } },
    ...overrides,
  };
}

function runePoolRunepoolRecord() {
  const runepool = runePoolFixture().runepool;
  if (typeof runepool !== 'object' || runepool === null || Array.isArray(runepool)) {
    throw new Error('Test RUNEPool fixture must be a plain object.');
  }
  return runepool as Record<string, unknown>;
}

function stubRunePoolSnapshots(liquify: RunePoolFixture, publicThornode: RunePoolFixture) {
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const pathname = new URL(url).pathname;
    const snapshot = url.includes('gateway.liquify.com') ? liquify : publicThornode;

    if (pathname.endsWith('/mimir')) {
      return makeResponse(true, snapshot.mimir);
    }
    if (pathname.endsWith('/runepool')) {
      return makeResponse(true, snapshot.runepool);
    }
    if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
      return makeResponse(true, snapshot.latestBlock);
    }

    return makeResponse(false, {}, 404, 'Not Found');
  }));
}

const dynamicFreshness: DynamicL1FeeSourceFreshness = {
  thorchainHeight: 100,
  thorchainBlockTime: '2026-07-03T00:00:00.000Z',
  thorchainBlockAgeSeconds: 6,
  snapshotPinned: true,
};

const runePoolFreshness: RunePoolSourceFreshness = {
  thorchainHeight: 100,
  thorchainBlockTime: '2026-07-06T00:00:00.000Z',
  thorchainBlockAgeSeconds: 6,
  snapshotPinned: true,
};

describe('deriveNetworkStatus', () => {
  beforeEach(() => {
    resetThornodeEndpointForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(status.chainStatuses[0]?.inheritedMimirKeys).toEqual(['HALTTRADING', 'HALTSIGNING', 'PAUSELP']);
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
      inboundAddressEvidenceFields: [
        'halted',
        'global_trading_paused',
        'chain_trading_paused',
        'chain_lp_actions_paused',
      ],
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

  it('does not warn on reviewed non-pausing operational Mimir families', () => {
    const status = deriveNetworkStatus(
      {
        HALTTRADING: 0,
        'EVMALLOWANCECHECK-AVAX': 1,
        'DYNAMICFEE-WHITELIST-SYMBIOSIS': 1,
      },
      [completeInbound('AVAX')]
    );

    expect(status.state).toBe('operational');
    expect(status.sourceWarnings).toEqual([]);
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
      inheritedMimirKeys: ['PAUSELP'],
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

    expect(status.state).toBe('degraded');
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

    expect(status.state).toBe('degraded');
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

    expect(status.state).toBe('degraded');
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

    expect(status.state).toBe('degraded');
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

    expect(status.state).toBe('degraded');
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

    expect(status.state).toBe('degraded');
    expect(status.activeControlKeys).toEqual([]);
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.sourceWarnings).toEqual([
      'Unknown operation-like Mimir keys need review: NewFeatureEnabled, OtherFeatureDisabled.',
    ]);
    expect(status.sourceWarningDetails).toEqual([
      {
        severity: 'review',
        category: 'unknown-operation',
        message: 'Unknown operation-like Mimir keys need review: NewFeatureEnabled, OtherFeatureDisabled.',
        action: 'Review the operation-like key family before interpreting it as non-pausing.',
        keys: ['NewFeatureEnabled', 'OtherFeatureDisabled'],
      },
    ]);
  });

  it('splits reviewed operational-support Mimir families from unknown high-impact keys', () => {
    const status = deriveNetworkStatus(
      {
        'COMPROMISEDVAULT-thor1vault': 1,
        STOPSOLVENCYCHECK: 1,
        EVMDISABLECONTRACTWHITELIST: 1,
        'ENABLESWITCH-BTC': 1,
        BURNSYNTHS: 1,
        SCHEDULEDMIGRATION: 1,
        FUNDMIGRATIONINTERVAL: 720,
        'RAGNAROK-BTC': 1,
        MimirRecallFundFoo: 1,
        MimirUpgradeContractBar: 1,
        'DYNAMICFEE-WHITELIST-SS': 1,
        'EVMALLOWANCECHECK-AVAX': 1,
      },
      [completeInbound('BTC'), completeInbound('AVAX')]
    );

	    expect(status.state).toBe('degraded');
	    expect(status.sourceWarnings).toEqual([
	      'Known operational-support Mimir keys present: BURNSYNTHS, COMPROMISEDVAULT-thor1vault, ENABLESWITCH-BTC, EVMDISABLECONTRACTWHITELIST, FUNDMIGRATIONINTERVAL, MimirRecallFundFoo, MimirUpgradeContractBar, SCHEDULEDMIGRATION.',
	      'Unknown operation-like Mimir keys need review: RAGNAROK-BTC, STOPSOLVENCYCHECK.',
	    ]);
	    expect(status.sourceWarningDetails?.[0]).toMatchObject({
	      severity: 'review',
	      category: 'mimir-support',
	      keys: [
	        'BURNSYNTHS',
	        'COMPROMISEDVAULT-thor1vault',
	        'ENABLESWITCH-BTC',
	        'EVMDISABLECONTRACTWHITELIST',
	        'FUNDMIGRATIONINTERVAL',
	        'MimirRecallFundFoo',
	        'MimirUpgradeContractBar',
        'SCHEDULEDMIGRATION',
      ],
    });
    expect(status.sourceWarningDetails?.[1]).toMatchObject({
	      severity: 'review',
	      category: 'unknown-operation',
	      keys: [
	        'RAGNAROK-BTC',
	        'STOPSOLVENCYCHECK',
	      ],
    });
  });

  it('adds inbound-address evidence fields for chain pause booleans', () => {
    const status = deriveNetworkStatus(
      {},
      [
        completeInbound('BSC', {
          halted: true,
          chain_trading_paused: true,
          chain_lp_actions_paused: true,
        }),
      ],
      '3.19.2',
      100
    );

    expect(status.state).toBe('paused');
    expect(status.activeEvidenceKeys).toEqual([]);
    expect(status.chainStatuses[0]).toMatchObject({
      chain: 'BSC',
      halted: true,
      tradingPaused: true,
      lpActionsPaused: true,
      inboundAddressEvidenceFields: ['halted', 'chain_trading_paused', 'chain_lp_actions_paused'],
    });
  });

  it('falls back to a complete second THORNode endpoint when the first snapshot shape is unusable', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        mimir: [],
        inbound: [completeInbound('ETH', { halted: true })],
        version: { current: 'first-provider' },
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      }),
      snapshotFixture({
        mimir: { HALTTRADING: 0 },
        inbound: [completeInbound('BTC')],
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.state).toBe('operational');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.thorchainHeight).toBe(100);
    expect(result.data?.chainStatuses.map((chain) => chain.chain)).toEqual(['BTC']);
  });

  it('pins THORNode status reads to the conservative snapshot height before deriving Mimir state', async () => {
    const cacheBust = Date.parse('2026-07-03T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(cacheBust);
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const pathname = new URL(url).pathname;

      if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
        return makeResponse(true, { block: { header: { height: '100', time: new Date().toISOString() } } });
      }
      if (pathname.endsWith('/mimir')) {
        return makeResponse(true, { HALTTRADING: 99 });
      }
      if (pathname.endsWith('/inbound_addresses')) {
        return makeResponse(true, [completeInbound('BTC')]);
      }
      if (pathname.endsWith('/version')) {
        return makeResponse(true, { current: '3.19.2' });
      }
      if (pathname.endsWith('/lastblock')) {
        return makeResponse(true, [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 99 }]);
      }
      return makeResponse(false, {}, 404, 'Not Found');
    });
    vi.stubGlobal('fetch', fetchSpy);

    const result = await ThornodeAPI.getNetworkStatus();
    const requestedUrls = fetchSpy.mock.calls.map(([input]) => String(input));

    expect(result.status).toBe('ok');
    expect(result.data?.state).toBe('paused');
    expect(result.data?.tradingPaused).toBe(true);
    expect(result.data?.thorchainHeight).toBe(99);
    expect(result.data?.thorchainSnapshotPinned).toBe(true);
    expect(result.source?.label).toBe('Liquify THORNode');
    expect(result.sources?.map((source) => source.url)).toEqual([
      'https://gateway.liquify.com/chain/thorchain_api/thorchain',
      'https://gateway.liquify.com/chain/thorchain_api/cosmos/base/tendermint/v1beta1/blocks/latest',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=99',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses?height=99',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/version?height=99',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/lastblock?height=99',
    ]);
    expect(requestedUrls).toContain(
      `https://gateway.liquify.com/chain/thorchain_api/cosmos/base/tendermint/v1beta1/blocks/latest?tcwiki_cache_bust=${cacheBust}`
    );
    expect(requestedUrls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=99');
    expect(requestedUrls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses?height=99');
    expect(requestedUrls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/version?height=99');
    expect(requestedUrls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/lastblock?height=99');
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
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
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
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      }),
      snapshotFixture({
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.thorchainHeight).toBe(100);
  });

  it('falls back when a THORNode provider returns an empty inbound address list', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        inbound: [],
        version: { current: 'first-provider' },
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      }),
      snapshotFixture({
        inbound: [completeInbound('BTC')],
        version: { current: 'second-provider' },
        lastBlock: [{ chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.chainStatuses.map((chain) => chain.chain)).toEqual(['BTC']);
    expect(result.data?.thorNodeVersion).toBe('second-provider');
  });

  it('degrades when every THORNode endpoint returns an empty inbound address list', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({ inbound: [] }),
      snapshotFixture({ inbound: [] })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('THORNode inbound_addresses response did not include any chain entries.');
  });

  it('prefers a clean provider over a source-warning snapshot', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    stubNetworkStatusSnapshots(
      snapshotFixture({
        latestBlock: {
          block: {
            header: {
              height: '100',
              time: '2026-07-03T11:29:00.000Z',
            },
          },
        },
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      }),
      snapshotFixture({
        version: { current: 'second-provider' },
        inbound: [completeInbound('BTC')],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.state).toBe('operational');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.sourceWarnings).toEqual([]);
  });

  it('prefers the least degraded provider when every snapshot has source warnings', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    const unknownOperationMimir = {
      BURNSYNTHS: 1,
    };
    stubNetworkStatusSnapshots(
      snapshotFixture({
        mimir: unknownOperationMimir,
        latestBlock: {
          block: {
            header: {
              height: '100',
              time: '2026-07-03T11:59:00.000Z',
            },
          },
        },
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      }),
      snapshotFixture({
        mimir: unknownOperationMimir,
        version: { current: 'less-degraded-provider' },
        latestBlock: {
          block: {
            header: {
              height: '100',
              time: '2026-07-03T11:59:55.000Z',
            },
          },
        },
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.thorNodeVersion).toBe('less-degraded-provider');
    expect(result.data?.sourceWarnings).toEqual([
      'Known operational-support Mimir key present: BURNSYNTHS.',
    ]);
    expect(result.data?.sourceWarningDetails?.[0]).toMatchObject({
      severity: 'review',
      category: 'mimir-support',
      keys: ['BURNSYNTHS'],
    });
    expect(result.data?.thorchainBlockAgeSeconds).toBe(5);
  });

  it('surfaces stale THORNode block timestamps as source warnings when every provider is stale', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    const staleLatestBlock = {
      block: {
        header: {
          height: '100',
          time: '2026-07-03T11:59:39.000Z',
        },
      },
    };
    stubNetworkStatusSnapshots(
      snapshotFixture({
        latestBlock: staleLatestBlock,
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      }),
      snapshotFixture({
        latestBlock: staleLatestBlock,
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.state).toBe('degraded');
    expect(result.data?.thorchainBlockTime).toBeDefined();
    expect(result.data?.thorchainBlockAgeSeconds).toBe(21);
    expect(result.data?.sourceWarnings).toEqual([
      'THORNode latest block timestamp is 21 seconds old; live operation state may be stale.',
    ]);
  });

  it('surfaces future THORNode block timestamps as source warnings', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T12:00:00.000Z'));
    const futureLatestBlock = {
      block: {
        header: {
          height: '100',
          time: '2026-07-03T12:00:21.000Z',
        },
      },
    };
    stubNetworkStatusSnapshots(
      snapshotFixture({
        latestBlock: futureLatestBlock,
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      }),
      snapshotFixture({
        latestBlock: futureLatestBlock,
        lastBlock: [{ chain: 'BTC', thorchain: 99, last_observed_in: 1000, last_signed_out: 98 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.state).toBe('degraded');
    expect(result.data?.thorchainBlockAgeSeconds).toBe(-21);
    expect(result.data?.sourceWarnings).toEqual([
      'THORNode latest block timestamp is 21 seconds in the future; live operation state may be stale.',
    ]);
  });

  it('falls back when pinned THORNode lastblock heights do not match the snapshot height', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        lastBlock: [
          { chain: 'BTC', thorchain: 100, last_observed_in: 1000, last_signed_out: 99 },
          { chain: 'ETH', thorchain: 110, last_observed_in: 2000, last_signed_out: 109 },
        ],
        latestBlock: { block: { header: { height: '110', time: new Date().toISOString() } } },
      }),
      snapshotFixture({ version: { current: 'second-provider' } })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.state).toBe('operational');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
  });

  it('surfaces missing per-chain lastblock evidence as a chain source warning', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        inbound: [completeInbound('BTC')],
        lastBlock: [{ chain: 'ETH', thorchain: 100, last_observed_in: 2000, last_signed_out: 99 }],
      }),
      snapshotFixture({
        inbound: [completeInbound('BTC')],
        lastBlock: [{ chain: 'ETH', thorchain: 100, last_observed_in: 2000, last_signed_out: 99 }],
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.state).toBe('degraded');
    expect(result.data?.chainStatuses[0]).toMatchObject({
      chain: 'BTC',
      sourceWarnings: ['BTC lastblock evidence omitted this chain; live observation/signing state is partial.'],
    });
    expect(result.data?.sourceWarnings).toContain('BTC lastblock evidence omitted this chain; live observation/signing state is partial.');
  });

  it('falls back when a THORNode provider returns duplicate inbound chain entries', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        inbound: [completeInbound('BTC'), completeInbound('btc')],
        version: { current: 'first-provider' },
      }),
      snapshotFixture({
        inbound: [completeInbound('ETH')],
        version: { current: 'second-provider' },
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
    expect(result.data?.chainStatuses.map((chain) => chain.chain)).toEqual(['ETH']);
  });

  it('degrades when every THORNode provider returns invalid inbound chain identities', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({ inbound: [completeInbound('')] }),
      snapshotFixture({ inbound: [completeInbound('BTC'), completeInbound('BTC')] })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('THORNode inbound_addresses response was not a valid chain list.');
    expect(result.error).toContain('THORNode inbound_addresses response included duplicate chain entries: BTC.');
  });

  it('falls back when a THORNode provider returns an unusable latest block shape', async () => {
    stubNetworkStatusSnapshots(
      snapshotFixture({
        latestBlock: { block: { header: { height: '100' } } },
        version: { current: 'first-provider' },
      }),
      snapshotFixture({
        version: { current: 'second-provider' },
      })
    );

    const result = await ThornodeAPI.getNetworkStatus();

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.thorNodeVersion).toBe('second-provider');
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
    expect(result.error).toContain('THORNode lastblock response did not include usable required chain, thorchain, last_observed_in, and last_signed_out fields.');
    expect(result.sources?.map((source) => source.label)).toEqual(['Liquify THORNode', 'THORChain THORNode']);
  });

  it('normalizes live-shaped dynamic L1 fee status without treating empty TOR fields as zero', () => {
    const status = deriveDynamicL1FeeStatus(
      {
        L1DYNAMICFEEENABLED: 1,
        L1SLIPMINBPS: 10,
        'DYNAMICFEE-WHITELIST-SS': 1,
      },
      dynamicFeeFixture().dynamicFees,
      dynamicFeeFixture().currentDynamicFees,
      dynamicFreshness
    );

    expect(status.mimir.enabled.state).toBe('active');
    expect(status.mimir.slipMinBps.value).toBe(10);
    expect(status.mimir.floorBps).toMatchObject({ value: null, defaultValue: 1, effectiveValue: 1, state: 'absent' });
    expect(status.mimir.ceilingBps).toMatchObject({ value: null, defaultValue: 20, effectiveValue: 20, state: 'absent' });
    expect(status.mimir.stepBps).toMatchObject({ value: null, defaultValue: 1, effectiveValue: 1, state: 'absent' });
    expect(status.mimir.deadbandBps).toMatchObject({ value: null, defaultValue: 1000, effectiveValue: 1000, state: 'absent' });
    expect(status.mimir.windowEpochs).toMatchObject({ value: null, defaultValue: 3, effectiveValue: 3, state: 'absent' });
    expect(status.mimir.epochBlocks).toMatchObject({ value: null, defaultValue: 14400, effectiveValue: 14400, state: 'absent' });
    expect(status.mimir.whitelistedPartners).toEqual([
      {
        key: 'DYNAMICFEE-WHITELIST-SS',
        thorname: 'ss',
        value: 1,
        whitelisted: true,
        state: 'active',
      },
    ]);
    expect(status.records).toHaveLength(1);
    expect(status.records[0]?.latestFeesTorBaseUnits).toBeNull();
    expect(status.currentEntries[0]).toMatchObject({
      thorname: 'ss',
      pair: 'THOR.RUNE|THOR.TCY',
      volumeTorBaseUnits: '185642164687',
      feesTorBaseUnits: '123938141',
    });
    expect(status.sourceWarnings).toEqual([]);
  });

  it('keeps malformed dynamic fee Mimirs visible as source warnings', () => {
    const status = deriveDynamicL1FeeStatus(
      {
        L1DYNAMICFEEENABLED: 'enabled',
        L1SLIPMINBPS: 10,
        'DYNAMICFEE-WHITELIST-SYMBIOSIS': 'yes',
      },
      dynamicFeeFixture().dynamicFees,
      dynamicFeeFixture().currentDynamicFees,
      dynamicFreshness
    );

    expect(status.mimir.enabled.state).toBe('unparseable');
    expect(status.mimir.whitelistedPartners[0]).toMatchObject({
      key: 'DYNAMICFEE-WHITELIST-SYMBIOSIS',
      thorname: 'symbiosis',
      value: null,
      whitelisted: null,
      state: 'unparseable',
    });
    expect(status.mimir.invalidKeys).toEqual(['DYNAMICFEE-WHITELIST-SYMBIOSIS', 'L1DYNAMICFEEENABLED']);
    expect(status.sourceWarnings).toEqual([
      'DYNAMICFEE-WHITELIST-SYMBIOSIS has an unsupported or unparseable dynamic fee whitelist state.',
      'L1DYNAMICFEEENABLED is unparseable; dynamic fee enablement is unknown.',
      'Sealed dynamic fee record ss THOR.RUNE|THOR.TCY has no matching DYNAMICFEE-WHITELIST Mimir key.',
    ]);
    expect(status.sourceWarningDetails).toEqual([
      expect.objectContaining({
        severity: 'warning',
        category: 'mimir-parse',
        keys: ['DYNAMICFEE-WHITELIST-SYMBIOSIS'],
      }),
      expect.objectContaining({
        severity: 'warning',
        category: 'mimir-parse',
        keys: ['L1DYNAMICFEEENABLED'],
      }),
      expect.objectContaining({
        severity: 'warning',
        category: 'source-shape',
      }),
    ]);
  });

  it('does not treat unsupported dynamic fee enablement values as enabled', () => {
    const status = deriveDynamicL1FeeStatus(
      {
        L1DynamicFeeEnabled: 2,
        L1SlipMinBPS: 10,
        L1DynamicFeeWindowEpochs: 99,
        'DYNAMICFEE-WHITELIST-SS': 1,
      },
      dynamicFeeFixture().dynamicFees,
      dynamicFeeFixture().currentDynamicFees,
      dynamicFreshness
    );

    expect(status.mimir.enabled).toMatchObject({
      key: 'L1DynamicFeeEnabled',
      value: 2,
      defaultValue: 0,
      effectiveValue: null,
      state: 'unparseable',
    });
    expect(status.mimir.windowEpochs).toMatchObject({
      value: 99,
      defaultValue: 3,
      effectiveValue: 30,
      state: 'active',
    });
    expect(status.mimir.invalidKeys).toEqual(['L1DynamicFeeEnabled']);
    expect(status.sourceWarnings).toEqual([
      'L1DynamicFeeEnabled has unsupported dynamic fee enablement value 2; expected 0 or 1.',
      'L1DynamicFeeWindowEpochs value 99 is outside ADR-026 clamp bounds; displaying effective value 30.',
    ]);
  });

  it('warns when sealed dynamic fee records disagree with whitelist Mimirs or configured bounds', () => {
    const fixture = dynamicFeeFixture({
      dynamicFees: {
        entries: [
          {
            thorname: 'ss',
            pair: 'THOR.RUNE|THOR.TCY',
            dynamic_bps: '0',
            whitelist_state: '2',
            last_active_epoch: '1864',
            latest_fees_tor: '1',
          },
          {
            thorname: 'ghost',
            pair: 'BTC.BTC|THOR.RUNE',
            dynamic_bps: '21',
            whitelist_state: '0',
            last_active_epoch: '1864',
            latest_fees_tor: '1',
          },
        ],
      },
      currentDynamicFees: { epoch: '1864', entries: [] },
    });

    const status = deriveDynamicL1FeeStatus(
      fixture.mimir as Record<string, unknown>,
      fixture.dynamicFees,
      fixture.currentDynamicFees,
      dynamicFreshness
    );

    expect(status.sourceWarnings).toEqual(expect.arrayContaining([
      'Sealed dynamic fee record ghost BTC.BTC|THOR.RUNE dynamic_bps 21 is above effective ceiling 20.',
      'Sealed dynamic fee record ghost BTC.BTC|THOR.RUNE has no matching DYNAMICFEE-WHITELIST Mimir key.',
      'Sealed dynamic fee record ghost BTC.BTC|THOR.RUNE is inactive even though ADR-026 records should be pruned when whitelist state is 0 or absent.',
      'Sealed dynamic fee record ss THOR.RUNE|THOR.TCY dynamic_bps 0 is below effective floor 1.',
      'Sealed dynamic fee record ss THOR.RUNE|THOR.TCY whitelist_state 2 disagrees with DYNAMICFEE-WHITELIST-SS=1.',
    ]));
  });

  it('rejects duplicate sealed dynamic fee records', () => {
    const fixture = dynamicFeeFixture();

    expect(() => deriveDynamicL1FeeStatus(
      fixture.mimir as Record<string, unknown>,
      {
        entries: [
          ...(fixture.dynamicFees as { entries: unknown[] }).entries,
          ...(fixture.dynamicFees as { entries: unknown[] }).entries,
        ],
      },
      fixture.currentDynamicFees,
      dynamicFreshness
    )).toThrow(/duplicate record/);
  });

  it('rejects pathologically long dynamic fee TOR amount strings', () => {
    const fixture = dynamicFeeFixture({
      currentDynamicFees: {
        epoch: '1864',
        entries: [
          {
            thorname: 'ss',
            pair: 'THOR.RUNE|THOR.TCY',
            volume_tor: '1'.repeat(81),
            fees_tor: '123938141',
            epoch: '1864',
          },
        ],
      },
    });

    expect(() => deriveDynamicL1FeeStatus(
      fixture.mimir as Record<string, unknown>,
      fixture.dynamicFees,
      fixture.currentDynamicFees,
      dynamicFreshness
    )).toThrow(/expected a TOR base-unit integer string with at most 80 digits/);
  });

  it('warns when a current accumulator has no sealed dynamic fee record', () => {
    const fixture = dynamicFeeFixture({
      currentDynamicFees: {
        epoch: '1864',
        entries: [
          {
            thorname: 'symbiosis',
            pair: 'BTC.BTC|THOR.RUNE',
            volume_tor: '10',
            fees_tor: '1',
            epoch: '1863',
          },
        ],
      },
    });

    const status = deriveDynamicL1FeeStatus(
      fixture.mimir as Record<string, unknown>,
      fixture.dynamicFees,
      fixture.currentDynamicFees,
      dynamicFreshness
    );

    expect(status.sourceWarnings).toEqual([
      'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE epoch mismatch: 1863 vs current epoch 1864.',
      'Current dynamic fee entry symbiosis BTC.BTC|THOR.RUNE exists without a sealed dynamic_l1_fees record.',
    ]);
  });

  it('fetches dynamic fee snapshots from one pinned THORNode provider', async () => {
    stubDynamicFeeSnapshots(
      dynamicFeeFixture(),
      dynamicFeeFixture({
        dynamicFees: {
          entries: [
            {
              thorname: 'symbiosis',
              pair: 'BTC.BTC|THOR.RUNE',
              dynamic_bps: '3',
              whitelist_state: '1',
              last_active_epoch: '1864',
              latest_fees_tor: '41257745',
            },
          ],
        },
        currentDynamicFees: { epoch: '1864', entries: [] },
      })
    );

    const result = await ThornodeAPI.getDynamicL1FeeStatus();
    const fetchMock = vi.mocked(fetch);
    const urls = fetchMock.mock.calls.map(([input]) => String(input));

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('Liquify THORNode');
    expect(result.data?.records.map((record) => record.thorname)).toEqual(['ss']);
    expect(result.data?.histories.map((history) => history.thorname)).toEqual(['ss']);
    expect(result.sources?.map((source) => source.url)).toEqual([
      'https://gateway.liquify.com/chain/thorchain_api/thorchain',
      'https://gateway.liquify.com/chain/thorchain_api/cosmos/base/tendermint/v1beta1/blocks/latest',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=100',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees?height=100',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees_current?height=100',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees/ss?height=100',
    ]);
    expect(urls.filter((url) => url.includes('dynamic_l1_fees')).every((url) => url.includes('gateway.liquify.com'))).toBe(true);
    expect(urls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=100');
    expect(urls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees?height=100');
    expect(urls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees/ss?height=100');
    expect(urls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees_current?height=100');
  });

  it('prefers fallback dynamic fee provider when first provider history is unavailable', async () => {
    stubDynamicFeeSnapshots(
      dynamicFeeFixture({ histories: {} }),
      dynamicFeeFixture()
    );

    const result = await ThornodeAPI.getDynamicL1FeeStatus();
    const fetchMock = vi.mocked(fetch);
    const urls = fetchMock.mock.calls.map(([input]) => String(input));

    expect(result.status).toBe('ok');
    expect(result.source?.label).toBe('THORChain THORNode');
    expect(result.data?.sourceWarnings).toEqual([]);
    expect(result.data?.histories.map((history) => history.thorname)).toEqual(['ss']);
    expect(urls).toContain('https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees/ss?height=100');
    expect(urls).toContain('https://thornode.thorchain.network/thorchain/dynamic_l1_fees/ss?height=100');
  });

  it('caps and concurrency-limits dynamic fee history fan-out', async () => {
    const thornames = Array.from({ length: 20 }, (_, index) => `partner${index.toString().padStart(2, '0')}`);
    const fixture = dynamicFeeFixture({
      mimir: {
        L1DYNAMICFEEENABLED: 1,
        L1SLIPMINBPS: 10,
        ...Object.fromEntries(thornames.map((thorname) => [`DYNAMICFEE-WHITELIST-${thorname.toUpperCase()}`, 1])),
      },
      dynamicFees: {
        entries: thornames.map((thorname) => ({
          thorname,
          pair: 'THOR.RUNE|THOR.TCY',
          dynamic_bps: '1',
          whitelist_state: '1',
          last_active_epoch: '1864',
          latest_fees_tor: '',
        })),
      },
      currentDynamicFees: { epoch: '1864', entries: [] },
      histories: Object.fromEntries(thornames.map((thorname) => [thorname, {
        thorname,
        whitelist_state: '1',
        pairs: [
          {
            pair: 'THOR.RUNE|THOR.TCY',
            dynamic_bps: '1',
            last_active_epoch: '1864',
            history: [],
          },
        ],
      }])),
    });
    const historyUrls: string[] = [];
    let activeHistoryRequests = 0;
    let maxActiveHistoryRequests = 0;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const pathname = new URL(url).pathname;
      if (!url.includes('gateway.liquify.com')) {
        return makeResponse(false, {}, 500, 'Fallback disabled');
      }

      if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
        return makeResponse(true, fixture.latestBlock);
      }
      if (pathname.endsWith('/mimir')) {
        return makeResponse(true, fixture.mimir);
      }
      if (pathname.endsWith('/dynamic_l1_fees')) {
        return makeResponse(true, fixture.dynamicFees);
      }
      if (pathname.endsWith('/dynamic_l1_fees_current')) {
        return makeResponse(true, fixture.currentDynamicFees);
      }
      const historyMatch = pathname.match(/\/dynamic_l1_fees\/([^/]+)$/);
      if (historyMatch) {
        const thorname = decodeURIComponent(historyMatch[1] ?? '').toLowerCase();
        historyUrls.push(url);
        activeHistoryRequests += 1;
        maxActiveHistoryRequests = Math.max(maxActiveHistoryRequests, activeHistoryRequests);
        await new Promise((resolve) => {
          globalThis.setTimeout(resolve, 0);
        });
        activeHistoryRequests -= 1;
        return makeResponse(true, fixture.histories[thorname]);
      }

      return makeResponse(false, {}, 404, 'Not Found');
    }));

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('ok');
    expect(historyUrls).toHaveLength(16);
    expect(maxActiveHistoryRequests).toBeLessThanOrEqual(4);
    expect(result.data?.histories).toHaveLength(16);
    expect(result.data?.sourceWarnings).toEqual([
      'Dynamic fee history fetch capped at 16 thornames; 4 additional thorname histories were not requested.',
    ]);
    expect(result.sources?.filter((source) => new URL(source.url).pathname.match(/\/dynamic_l1_fees\/[^/]+$/))).toHaveLength(16);
  });

  it('prioritizes sealed dynamic fee record histories before whitelist-only histories when capped', async () => {
    const whitelistOnlyThornames = Array.from({ length: 18 }, (_, index) => `aaa${index.toString().padStart(2, '0')}`);
    const recordThornames = ['zzrecord0', 'zzrecord1'];
    const allThornames = [...whitelistOnlyThornames, ...recordThornames];
    const fixture = dynamicFeeFixture({
      mimir: {
        L1DYNAMICFEEENABLED: 1,
        L1SLIPMINBPS: 10,
        ...Object.fromEntries(allThornames.map((thorname) => [`DYNAMICFEE-WHITELIST-${thorname.toUpperCase()}`, 1])),
      },
      dynamicFees: {
        entries: recordThornames.map((thorname) => ({
          thorname,
          pair: 'THOR.RUNE|THOR.TCY',
          dynamic_bps: '1',
          whitelist_state: '1',
          last_active_epoch: '1864',
          latest_fees_tor: '',
        })),
      },
      currentDynamicFees: { epoch: '1864', entries: [] },
      histories: Object.fromEntries(allThornames.map((thorname) => [thorname, {
        thorname,
        whitelist_state: '1',
        pairs: recordThornames.includes(thorname)
          ? [
            {
              pair: 'THOR.RUNE|THOR.TCY',
              dynamic_bps: '1',
              last_active_epoch: '1864',
              history: [],
            },
          ]
          : [],
      }])),
    });
    const historyUrls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const pathname = new URL(url).pathname;

      if (pathname.endsWith('/base/tendermint/v1beta1/blocks/latest')) {
        return makeResponse(true, fixture.latestBlock);
      }
      if (pathname.endsWith('/mimir')) {
        return makeResponse(true, fixture.mimir);
      }
      if (pathname.endsWith('/dynamic_l1_fees')) {
        return makeResponse(true, fixture.dynamicFees);
      }
      if (pathname.endsWith('/dynamic_l1_fees_current')) {
        return makeResponse(true, fixture.currentDynamicFees);
      }
      const historyMatch = pathname.match(/\/dynamic_l1_fees\/([^/]+)$/);
      if (historyMatch) {
        const thorname = decodeURIComponent(historyMatch[1] ?? '').toLowerCase();
        historyUrls.push(url);
        return makeResponse(true, fixture.histories[thorname]);
      }

      return makeResponse(false, {}, 404, 'Not Found');
    }));

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('ok');
    expect(historyUrls).toHaveLength(16);
    expect(historyUrls).toEqual(expect.arrayContaining([
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees/zzrecord0?height=100',
      'https://gateway.liquify.com/chain/thorchain_api/thorchain/dynamic_l1_fees/zzrecord1?height=100',
    ]));
    expect(result.data?.histories.map((history) => history.thorname)).toEqual(expect.arrayContaining(recordThornames));
    expect(result.data?.sourceWarnings).toEqual([
      'Dynamic fee history fetch capped at 16 thornames; 4 additional thorname histories were not requested.',
    ]);
  });

  it('does not repeat capped dynamic fee history fan-out across fallback providers', async () => {
    const thornames = Array.from({ length: 20 }, (_, index) => `partner${index.toString().padStart(2, '0')}`);
    const fixture = dynamicFeeFixture({
      mimir: {
        L1DYNAMICFEEENABLED: 1,
        L1SLIPMINBPS: 10,
        ...Object.fromEntries(thornames.map((thorname) => [`DYNAMICFEE-WHITELIST-${thorname.toUpperCase()}`, 1])),
      },
      dynamicFees: {
        entries: thornames.map((thorname) => ({
          thorname,
          pair: 'THOR.RUNE|THOR.TCY',
          dynamic_bps: '1',
          whitelist_state: '1',
          last_active_epoch: '1864',
          latest_fees_tor: '',
        })),
      },
      currentDynamicFees: { epoch: '1864', entries: [] },
      histories: Object.fromEntries(thornames.map((thorname) => [thorname, {
        thorname,
        whitelist_state: '1',
        pairs: [
          {
            pair: 'THOR.RUNE|THOR.TCY',
            dynamic_bps: '1',
            last_active_epoch: '1864',
            history: [],
          },
        ],
      }])),
    });
    stubDynamicFeeSnapshots(fixture, fixture);

    const result = await ThornodeAPI.getDynamicL1FeeStatus();
    const fetchMock = vi.mocked(fetch);
    const historyUrls = fetchMock.mock.calls
      .map(([input]) => String(input))
      .filter((url) => new URL(url).pathname.match(/\/dynamic_l1_fees\/[^/]+$/));

    expect(result.status).toBe('ok');
    expect(historyUrls).toHaveLength(16);
    expect(historyUrls.every((url) => url.includes('gateway.liquify.com'))).toBe(true);
    expect(result.data?.sourceWarnings).toEqual([
      'Dynamic fee history fetch capped at 16 thornames; 4 additional thorname histories were not requested.',
    ]);
  });

  it('includes per-thorname sealed dynamic fee history when THORNode exposes samples', async () => {
    const fixture = dynamicFeeFixture({
      histories: {
        ss: {
          thorname: 'ss',
          whitelist_state: '1',
          pairs: [
            {
              pair: 'THOR.RUNE|THOR.TCY',
              dynamic_bps: '1',
              last_active_epoch: '1864',
              history: [
                {
                  epoch: '1864',
                  volume_tor: '185642164687',
                  fees_tor: '123938141',
                  bps_at_close: '1',
                },
              ],
            },
          ],
        },
      },
    });
    stubDynamicFeeSnapshots(fixture, fixture);

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.histories[0]?.pairs[0]?.history[0]).toEqual({
      epoch: 1864,
      volumeTorBaseUnits: '185642164687',
      feesTorBaseUnits: '123938141',
      bpsAtClose: 1,
    });
    expect(result.data?.caveats).toEqual(['current-only', 'adr-experiment', 'not-historical-fee-proof']);
    expect(result.data?.sourceWarnings).toEqual([]);
  });

  it('surfaces stale dynamic fee snapshot block timestamps as source warnings', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T00:01:00.000Z'));
    const staleFixture = dynamicFeeFixture({
      latestBlock: { block: { header: { height: '101', time: '2026-07-03T00:00:00.000Z' } } },
    });
    stubDynamicFeeSnapshots(staleFixture, staleFixture);

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.sourceWarnings).toContain('THORNode latest block timestamp is 1 minute old; dynamic fee state is stale.');
    expect(result.data?.sourceWarningDetails).toEqual([
      expect.objectContaining({
        severity: 'critical',
        category: 'freshness',
        message: 'THORNode latest block timestamp is 1 minute old; dynamic fee state is stale.',
      }),
    ]);
  });

  it('surfaces future dynamic fee snapshot block timestamps as source warnings', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-03T00:00:00.000Z'));
    const futureFixture = dynamicFeeFixture({
      latestBlock: { block: { header: { height: '101', time: '2026-07-03T00:01:00.000Z' } } },
    });
    stubDynamicFeeSnapshots(futureFixture, futureFixture);

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.sourceWarnings).toContain('THORNode latest block timestamp is 1 minute in the future; dynamic fee state is stale.');
  });

  it('degrades dynamic fee status when every THORNode provider is unusable', async () => {
    stubDynamicFeeSnapshots(
      dynamicFeeFixture({ dynamicFees: { entries: [{ thorname: 'ss' }] } }),
      dynamicFeeFixture({ currentDynamicFees: { epoch: 'nope', entries: [] } })
    );

    const result = await ThornodeAPI.getDynamicL1FeeStatus();

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('THORNode dynamic fee sources did not provide a usable snapshot');
    expect(result.error).toContain('did not include a usable thorname and pair');
    expect(result.error).toContain('Invalid dynamic_l1_fees_current epoch');
    expect(result.sources?.map((source) => source.label)).toEqual(['Liquify THORNode', 'THORChain THORNode']);
  });

  it('derives RUNEPool accounting, signed PnL, POL scope, and config caveats', () => {
    const status = deriveRunePoolPolStatus(
      runePoolFixture().mimir,
      runePoolFixture().runepool,
      runePoolFreshness
    );

    expect(status.pol.valueRuneBaseUnits).toBe('374089371198518');
    expect(status.pol.pnlRuneBaseUnits).toBe('-185420251122476');
    expect(status.providers.pendingRuneBaseUnits).toBe('0');
    expect(status.reserve.currentDepositRuneBaseUnits).toBe('274059171155333');
    expect(status.polPools).toEqual([
      { key: 'POL-BTC', asset: 'BTC', value: 1, state: 'active' },
      { key: 'POL-ETH', asset: 'ETH', value: 0, state: 'inactive' },
    ]);
    expect(status.activePolPoolCount).toBe(1);
    expect(status.depositMaturityBlocks).toEqual({ key: 'RUNEPoolDepositMaturityBlocks', value: 14400, state: 'present' });
    expect(status.maxReserveBackstop).toEqual({ key: 'RUNEPoolMaxReserveBackstop', value: 2500000000000, state: 'present' });
    expect(status.minRunePoolDepth).toEqual({ key: 'MINRUNEPOOLDEPTH', value: 1000000000000, state: 'present' });
    expect(status.sourceWarnings).toEqual([]);
    expect(status.caveats).toEqual(['current-only', 'not-yield-proof', 'availability-separate']);
  });

  it('keeps malformed RUNEPool accounting unavailable instead of zero', () => {
    const malformed = runePoolFixture({
      mimir: {
        'POL-BTC': 'not-a-number',
        RUNEPoolDepositMaturityBlocks: 'oops',
      },
      runepool: {
        pol: {
          rune_deposited: '',
          rune_withdrawn: '0x10',
          value: '100000000 ',
          pnl: 'not-a-rune-amount',
          current_deposit: '1'.repeat(81),
        },
        providers: {
          units: 'abc',
          pending_units: '0',
          pending_rune: '0',
          value: '179737127677024',
          pnl: '-105713323488637',
          current_deposit: '285450451165661',
        },
        reserve: {
          units: '264046191162734',
          value: '194352243521494',
          pnl: '-79706927633839',
          current_deposit: '274059171155333',
        },
      },
    });

    const status = deriveRunePoolPolStatus(malformed.mimir, malformed.runepool, runePoolFreshness);

    expect(status.pol.runeDepositedBaseUnits).toBeNull();
    expect(status.pol.runeWithdrawnBaseUnits).toBeNull();
    expect(status.pol.valueRuneBaseUnits).toBeNull();
    expect(status.pol.pnlRuneBaseUnits).toBeNull();
    expect(status.pol.currentDepositRuneBaseUnits).toBeNull();
    expect(status.providers.units).toBeNull();
    expect(status.polPools[0]).toEqual({ key: 'POL-BTC', asset: 'BTC', value: null, state: 'unparseable' });
    expect(status.depositMaturityBlocks).toEqual({ key: 'RUNEPoolDepositMaturityBlocks', value: null, state: 'unparseable' });
    expect(status.sourceWarnings).toEqual(expect.arrayContaining([
      'THORNode Mimir POL-BTC was unparseable for RUNEPool POL scope.',
      'THORNode Mimir RUNEPoolDepositMaturityBlocks was unparseable for RUNEPool availability caveats.',
      'THORNode runepool.pol.rune_deposited did not include a usable RUNE base-unit string.',
      'THORNode runepool.pol.rune_withdrawn included an invalid RUNE base-unit value.',
      'THORNode runepool.pol.value included an invalid RUNE base-unit value.',
      'THORNode runepool.pol.pnl included an invalid RUNE base-unit value.',
      'THORNode runepool.pol.current_deposit is too large to display safely.',
      'THORNode runepool.providers.units included an invalid unit value.',
    ]));
    expect(status.sourceWarningDetails.some((detail) => detail.category === 'source-shape')).toBe(true);
    expect(status.sourceWarningDetails.some((detail) => detail.category === 'mimir-parse')).toBe(true);
  });

  it('fetches RUNEPool accounting and Mimir from the same pinned provider', async () => {
    const liquify = runePoolFixture();
    const publicThornode = runePoolFixture({
      mimir: { 'POL-SOL': 1 },
      runepool: {
        ...runePoolRunepoolRecord(),
        pol: {
          rune_deposited: '1',
          rune_withdrawn: '1',
          value: '1',
          pnl: '1',
          current_deposit: '1',
        },
      },
    });
    stubRunePoolSnapshots(liquify, publicThornode);

    const result = await ThornodeAPI.getRunePoolPolStatus();
    const fetchMock = vi.mocked(fetch);
    const urls = fetchMock.mock.calls.map(([input]) => String(input));

    expect(result.status).toBe('ok');
    expect(result.data?.pol.valueRuneBaseUnits).toBe('374089371198518');
    expect(result.data?.polPools.map((pool) => pool.key)).toContain('POL-BTC');
    expect(urls.some((url) => url.includes('/runepool?height=100'))).toBe(true);
    expect(urls.some((url) => url.includes('/mimir?height=100'))).toBe(true);
    expect(urls.filter((url) => url.includes('/runepool') || url.includes('/mimir')).every((url) => url.includes('gateway.liquify.com'))).toBe(true);
    expect(result.sources?.map((source) => source.label)).toEqual([
      'Liquify THORNode',
      'Liquify THORNode latest block',
      'Liquify THORNode Mimir',
      'Liquify THORNode RUNEPool accounting',
    ]);
  });

  it('returns the least-warning RUNEPool provider when all providers have parser warnings', async () => {
    const warningFixture = runePoolFixture({
      mimir: {
        'POL-BTC': 1,
      },
      runepool: {
        ...runePoolRunepoolRecord(),
        pol: {
          rune_deposited: '',
          rune_withdrawn: '690803512821382',
          value: '374089371198518',
          pnl: '-185420251122476',
          current_deposit: '559509622320994',
        },
      },
    });
    stubRunePoolSnapshots(warningFixture, warningFixture);

    const result = await ThornodeAPI.getRunePoolPolStatus();

    expect(result.status).toBe('ok');
    expect(result.data?.pol.runeDepositedBaseUnits).toBeNull();
    expect(result.data?.sourceWarnings).toContain('THORNode runepool.pol.rune_deposited did not include a usable RUNE base-unit string.');
    expect(result.data?.sourceWarningDetails).toEqual([
      expect.objectContaining({
        category: 'source-shape',
        message: 'THORNode runepool.pol.rune_deposited did not include a usable RUNE base-unit string.',
      }),
    ]);
  });

  it('parses swap quote success without destination-address inputs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(true, {
      expected_amount_out: '99000000',
      recommended_min_amount_in: '1000000',
      inbound_confirmation_seconds: '600',
      outbound_delay_seconds: 12,
      streaming_swap_seconds: 0,
      total_swap_seconds: 612,
      expiry: 1790000000,
      warning: 'short-lived quote',
      fees: {
        asset: 'ETH.ETH',
        affiliate: '0',
        outbound: '10000',
        liquidity: '20000',
        total: '30000',
        total_bps: '25',
        slippage_bps: 7,
      },
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });
    const firstUrl = String(fetchMock.mock.calls[0]?.[0]);

    expect(result.status).toBe('ok');
    expect(firstUrl).toContain('/quote/swap?');
    expect(firstUrl).toContain('from_asset=BTC.BTC');
    expect(firstUrl).toContain('to_asset=ETH.ETH');
    expect(firstUrl).toContain('amount=100000000');
    expect(firstUrl).not.toContain('destination');
    expect(result.data).toMatchObject({
      status: 'available',
      quote: {
        expectedAmountOut: '99000000',
        recommendedMinAmountIn: '1000000',
        inboundConfirmationSeconds: 600,
        outboundDelaySeconds: 12,
        streamingSwapSeconds: 0,
        totalSwapSeconds: 612,
        expiry: 1790000000,
        warning: 'short-lived quote',
        fees: {
          asset: 'ETH.ETH',
          total: '30000',
          totalBps: 25,
          slippageBps: 7,
        },
      },
    });
    expect(result.source?.notes).toContain('Do not cache or treat as transaction instructions.');
  });

  it('fails over transient quote-provider failures before returning a usable quote', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('gateway.liquify.com')) {
        return makeResponse(false, { message: 'service unavailable' }, 503, 'Service Unavailable');
      }

      return makeResponse(true, {
        expected_amount_out: '99000000',
        fees: { total_bps: '25' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('ok');
    expect(result.data?.status).toBe('available');
    expect(result.data?.quote?.expectedAmountOut).toBe('99000000');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('gateway.liquify.com');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('thornode.thorchain.network');
    expect(result.source?.label).toBe('THORChain THORNode swap quote');
  });

  it('parses halted-trading quote errors as limited routes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(false, {
      code: 400,
      message: 'trading is halted on SOL',
      details: [{ chain: 'SOL' }],
    }, 400, 'Bad Request')));

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'SOL.SOL',
      toAsset: 'BTC.BTC',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('ok');
    expect(result.data).toMatchObject({
      status: 'limited',
      summary: 'THORNode says this route is currently limited.',
      failure: {
        kind: 'halt',
        code: 400,
        message: 'trading is halted on SOL',
      },
    });
  });

  it('keeps explicit halted-trading errors limited even when THORNode uses a 5xx response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(false, {
      code: 503,
      message: 'trading is halted on BSC',
    }, 503, 'Service Unavailable'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BSC.BNB',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.data).toMatchObject({
      status: 'limited',
      failure: {
        kind: 'halt',
        httpStatus: 503,
        message: 'trading is halted on BSC',
      },
    });
  });

  it('classifies rate-limited quote responses as review-only, not route halts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(false, {
      code: 429,
      message: 'too many requests',
    }, 429, 'Too Many Requests'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('degraded');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.sources).toHaveLength(2);
    expect(result.data).toMatchObject({
      status: 'failed',
      summary: 'THORNode could not quote this route.',
      failure: {
        kind: 'rate-limit',
        code: 429,
        httpStatus: 429,
        message: 'too many requests',
      },
      sourceWarnings: ['THORNode quote probe rate-limit response needs review: too many requests'],
    });
    expect(result.error).toContain('quote providers did not return a usable route response');
  });

  it('classifies malformed quote error objects as review-only, not route halts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(false, {
      error: 'unexpected response shape',
    }, 500, 'Internal Server Error'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('degraded');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.data).toMatchObject({
      status: 'failed',
      failure: {
        kind: 'malformed',
        httpStatus: 500,
        message: 'THORNode did not return a usable quote error.',
      },
    });
    expect(result.error).toContain('quote providers did not return a usable route response');
  });

  it('degrades malformed quote success instead of rendering missing numeric fields as zero', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, {
      fees: {
        total_bps: 0,
      },
    })));

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('expected_amount_out');
  });

  it('rejects quote expiries outside the browser Date range', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(true, {
      expected_amount_out: '99000000',
      expiry: Number.MAX_SAFE_INTEGER,
    })));

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amountBaseUnits: '100000000',
    });

    expect(result.status).toBe('degraded');
    expect(result.data).toBeUndefined();
    expect(result.error).toContain('invalid expiry');
  });

  it('rejects invalid quote requests before contacting THORNode providers', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await ThornodeAPI.getSwapQuoteProbe({
      fromAsset: 'BTC.BTC',
      toAsset: 'BTC.BTC',
      amountBaseUnits: '0',
    });

    expect(result.status).toBe('degraded');
    expect(result.error).toContain('two different assets');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
