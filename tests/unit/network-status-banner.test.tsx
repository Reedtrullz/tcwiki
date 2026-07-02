import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { NetworkStatusBanner } from '@/components/features/NetworkStatusBanner';
import { LiveDataResult, NetworkStatus } from '@/lib/types';

const baseStatus: NetworkStatus = {
  state: 'paused',
  summary: 'Chain-level signing is paused.',
  tradingPaused: false,
  signingPaused: true,
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
  activeChainKeys: ['HALTSIGNINGBTC'],
  activeEvidenceKeys: ['HALTSIGNINGBTC'],
  activePauseKeys: ['HALTSIGNINGBTC'],
  monitoredControls: [],
  invalidMimirKeys: [],
  sourceWarnings: [],
  chainStatuses: [
    {
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      lpDepositPaused: false,
      signingPaused: true,
      activeMimirKeys: ['HALTSIGNINGBTC'],
      lpDepositPauseKeys: [],
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
    },
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

describe('NetworkStatusBanner', () => {
  it('renders signing-only chain pauses as warning states', () => {
    const html = renderToStaticMarkup(<NetworkStatusBanner result={liveResult} />);

    expect(html).toContain('aria-label="BTC: signing"');
    expect(html).toMatch(/aria-label="BTC: signing"[\s\S]*text-amber-400/);
    expect(html).toContain('aria-label="ETH: open"');
    expect(html).toMatch(/aria-label="ETH: open"[\s\S]*text-emerald-400/);
  });

  it('keeps chain cards compact while exposing exact Mimir evidence in a disclosure table', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        activeControlKeys: ['PAUSELPDEPOSIT-*'],
        activeChainKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN'],
        activeEvidenceKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN', 'PAUSELPDEPOSIT-ETH-ETH'],
        activePauseKeys: ['HALTBSCTRADING', 'HALTSOLCHAIN', 'PAUSELPDEPOSIT-ETH-ETH'],
        chainStatuses: [
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
            halted: true,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: ['HALTSOLCHAIN'],
            lpDepositPauseKeys: [],
          },
          {
            chain: 'ETH',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: true,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: ['PAUSELPDEPOSIT-ETH-ETH'],
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('aria-label="BSC: trading"');
    expect(html).toContain('aria-label="BSC active Mimir key count"');
    expect(html).toContain('Active monitored controls: 1 key. Supporting source keys are listed in operational evidence.');
    expect(html).toContain('Operational evidence');
    expect(html).toContain('3 keys');
    expect(html).toContain('Scope');
    expect(html).toContain('Impact');
    expect(html).toContain('HALTBSCTRADING');
    expect(html).toContain('aria-label="SOL: halted"');
    expect(html).toContain('HALTSOLCHAIN');
    expect(html).toContain('aria-label="ETH: LP deposits"');
    expect(html).toContain('aria-label="ETH active Mimir key count"');
    expect(html).toContain('Evidence: 1 key');
    expect(html).toContain('PAUSELPDEPOSIT-ETH-ETH');
    expect(html).not.toContain('PAUSELPDEPOSIT-*');
  });

  it('renders scoped secured and WASM evidence instead of only counting aggregate controls', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        activeControlKeys: ['HaltSecuredDeposit-*', 'HaltWasmContract-*'],
        activeChainKeys: [],
        activeEvidenceKeys: ['HaltSecuredDeposit-ETH', 'HaltWasmContract-thor1contract'],
        activePauseKeys: ['HaltSecuredDeposit-*', 'HaltWasmContract-*', 'HaltSecuredDeposit-ETH', 'HaltWasmContract-thor1contract'],
        securedAssetDepositPauseKeys: ['HaltSecuredDeposit-ETH'],
        wasmContractHaltKeys: ['HaltWasmContract-thor1contract'],
        scopedWasmHaltKeys: ['HaltWasmContract-thor1contract'],
        chainStatuses: [
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
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('aria-label="ETH: secured deposits"');
    expect(html).toContain('2 keys');
    expect(html).toContain('HaltSecuredDeposit-ETH');
    expect(html).toContain('Secured deposit halt');
    expect(html).toContain('HaltWasmContract-thor1contract');
    expect(html).toContain('WASM contract halt');
    expect(html).not.toContain('HaltSecuredDeposit-*');
    expect(html).not.toContain('HaltWasmContract-*');
  });

  it('renders scheduled Mimir controls without calling them active pauses', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'operational',
        summary: 'Current-only live sources do not show active halt flags.',
        signingPaused: false,
        thorchainHeight: 100,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        scheduledMimirKeys: ['HALTTRADING'],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            scheduledMimirKeys: ['HALTTRADING'],
          },
        ],
        monitoredControls: [
          {
            key: 'HALTTRADING',
            label: 'Trading',
            state: 'scheduled',
            active: false,
            description: 'Swaps and trading actions are paused when active. Scheduled for THORChain height 200.',
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Live sources show scheduled Mimir controls');
    expect(html).toContain('Scheduled monitored controls: 1 key. These are not counted as paused at THORChain height 100.');
    expect(html).toContain('Scheduled monitored Mimir keys');
    expect(html).toContain('HALTTRADING');
    expect(html).toContain('Trading: scheduled');
    expect(html).toContain('aria-label="BTC: scheduled"');
    expect(html).not.toContain('Live sources show paused operations');
    expect(html).not.toContain('Active monitored controls:');
  });

  it('renders enablement controls as enabled or disabled instead of inactive', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        monitoredControls: [
          {
            key: 'TRADEACCOUNTSENABLED',
            label: 'Trade accounts',
            state: 'disabled',
            active: true,
            description: 'Trade accounts are unavailable when disabled.',
          },
          {
            key: 'RUNEPOOLENABLED',
            label: 'RUNEPool',
            state: 'inactive',
            active: false,
            description: 'RUNEPool is unavailable when disabled.',
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Trade accounts: disabled');
    expect(html).toContain('RUNEPool: enabled');
    expect(html).not.toContain('RUNEPool: inactive');
  });

  it('renders unparseable Mimir warnings without hiding operational context', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'operational',
        summary: 'Current-only live sources do not show active halt flags, but some monitored Mimir values were unparseable.',
        signingPaused: false,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            unparseableMimirKeys: ['HALTSIGNINGBTC'],
          },
        ],
        invalidMimirKeys: ['HALTSIGNINGBTC'],
        sourceWarnings: ['1 monitored Mimir key could not be parsed.'],
        monitoredControls: [
          {
            key: 'HALTSIGNING',
            label: 'Signing',
            state: 'unparseable',
            active: false,
            description: 'Outbound signing is paused when active.',
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Live sources have unparseable Mimir controls');
    expect(html).toContain('1 monitored Mimir key could not be parsed.');
    expect(html).toContain('aria-label="BTC: Mimir warning"');
    expect(html).toContain('aria-label="BTC source warnings"');
    expect(html).toContain('Warning: 1 issue');
    expect(html).toContain('Unparseable monitored Mimir keys');
    expect(html).toContain('HALTSIGNINGBTC');
    expect(html).toContain('Signing: unparseable');
    expect(html).not.toContain('aria-label="BTC: open"');
    expect(html).not.toContain('aria-label="BTC active Mimir key count"');
    expect(html).not.toContain('Signing: inactive');
  });

  it('renders broader source warnings without calling them unparseable controls', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'operational',
        summary: 'Current-only live sources do not show active halt flags, but some Mimir source warnings need review.',
        signingPaused: false,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
          },
        ],
        invalidMimirKeys: [],
        sourceWarnings: ['Unknown chain-scoped Mimir key ignored: HALTBTCHAIN.'],
        monitoredControls: [],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Live sources have Mimir warnings to review');
    expect(html).toContain('Unknown chain-scoped Mimir key ignored: HALTBTCHAIN.');
    expect(html).not.toContain('Live sources have unparseable Mimir controls');
    expect(html).not.toContain('Unparseable monitored Mimir keys');
  });

  it('renders partial inbound-address source warnings as degraded chain state', () => {
    const warning = 'BTC inbound_addresses omitted halted, global_trading_paused, chain_trading_paused, chain_lp_actions_paused; live chain operation state is partial.';
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'degraded',
        summary: 'Current-only live sources do not show active halt flags, but source warnings need review.',
        signingPaused: false,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        invalidMimirKeys: [],
        sourceWarnings: [warning],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            sourceWarnings: [warning],
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Network status source degraded');
    expect(html).toContain('aria-label="BTC: source warning"');
    expect(html).toContain('aria-label="BTC source warnings"');
    expect(html).toContain('Warning: 1 issue');
    expect(html).toContain(warning);
    expect(html).not.toContain('aria-label="BTC: open"');
  });
});
