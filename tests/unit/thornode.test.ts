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
    expect(status.activePauseKeys).toEqual([
      'HALTSECUREDGLOBAL',
      'TCYCLAIMINGHALT',
      'TCYCLAIMINGSWAPHALT',
      'TCYSTAKEDISTRIBUTIONHALT',
      'HALTTCYTRADING',
      'TRADEACCOUNTSENABLED',
    ]);
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
    expect(status.chainStatuses[0]).toEqual({
      chain: 'ETH',
      halted: true,
      tradingPaused: true,
      lpActionsPaused: true,
      signingPaused: false,
    });
  });

  it('marks per-chain signing halts as paused even when global signing is open', () => {
    const status = deriveNetworkStatus(
      { HALTSIGNING: 0, HALTSIGNINGBTC: 1 },
      [{ chain: 'BTC', halted: false }]
    );

    expect(status.state).toBe('paused');
    expect(status.signingPaused).toBe(true);
    expect(status.activePauseKeys).toContain('HALTSIGNINGBTC');
    expect(status.chainStatuses[0]).toEqual({
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      signingPaused: true,
    });
  });

  it('marks clean state operational', () => {
    const status = deriveNetworkStatus(
      { HALTTRADING: 0, HALTSIGNING: 0, PAUSELP: 0 },
      [{ chain: 'BTC', halted: false, global_trading_paused: false, chain_trading_paused: false }]
    );

    expect(status.state).toBe('operational');
    expect(status.activePauseKeys).toEqual([]);
  });
});
