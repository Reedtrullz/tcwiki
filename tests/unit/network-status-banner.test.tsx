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

    expect(html).toContain('aria-label="BTC: Signing paused"');
    expect(html).toMatch(/aria-label="BTC: Signing paused"[\s\S]*text-amber-400/);
    expect(html).toContain('aria-label="ETH: Open"');
    expect(html).toMatch(/aria-label="ETH: Open"[\s\S]*text-emerald-400/);
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

    expect(html).toContain('aria-label="BSC: Trading halted"');
    expect(html).toContain('aria-label="BSC direct source evidence count"');
    expect(html).toContain('Look here first');
    expect(html).toContain('Route scope');
    expect(html).toContain('2 swap-limited');
    expect(html).toContain('3 operation-affected');
    expect(html).toContain('Operational evidence');
    expect(html).toContain('3 evidence items');
    expect(html).toContain('Scope');
    expect(html).toContain('Source');
    expect(html).toContain('Impact');
    expect(html).toContain('State');
    expect(html).toContain('HALTBSCTRADING');
    expect(html).toContain('aria-label="SOL: Chain halted"');
    expect(html).toContain('HALTSOLCHAIN');
    expect(html).toContain('aria-label="ETH: LP deposits paused"');
    expect(html).toContain('aria-label="ETH direct source evidence count"');
    expect(html).toContain('Direct: 1 evidence item');
    expect(html).toContain('PAUSELPDEPOSIT-ETH-ETH');
    expect(html).not.toContain('PAUSELPDEPOSIT-*');
  });

  it('labels inherited global controls on per-chain cards', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'paused',
        summary: 'Current-only live sources show one or more THORChain operations paused.',
        tradingPaused: true,
        signingPaused: false,
        activeControlKeys: ['HALTTRADING'],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: ['HALTTRADING'],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: true,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            inheritedMimirKeys: ['HALTTRADING'],
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('aria-label="BTC: Global trading control"');
    expect(html).toContain('Global swap halt');
    expect(html).toContain('Global control applies before per-chain routing');
    expect(html).toContain('Inherited: 1 key');
    expect(html).toContain('HALTTRADING');
    expect(html).not.toContain('BTC direct source evidence count');
  });

  it('sorts directly affected chains before inherited-only and open chains', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        tradingPaused: true,
        signingPaused: false,
        activeControlKeys: ['HALTTRADING'],
        activeChainKeys: ['HALTBSCTRADING'],
        activeEvidenceKeys: ['HALTBSCTRADING'],
        activePauseKeys: ['HALTTRADING', 'HALTBSCTRADING'],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: false,
            tradingPaused: true,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            inheritedMimirKeys: ['HALTTRADING'],
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
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html.indexOf('aria-label="BSC: Trading halted"')).toBeLessThan(html.indexOf('aria-label="BTC: Global trading control"'));
    expect(html.indexOf('aria-label="BTC: Global trading control"')).toBeLessThan(html.indexOf('aria-label="ETH: Open"'));
  });

  it('sorts swap-limited chains before LP-only operation impacts on diagnostics', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        tradingPaused: false,
        signingPaused: false,
        activeControlKeys: ['PAUSELP'],
        activeChainKeys: ['HALTBSCTRADING', 'PAUSELPAVAX'],
        activeEvidenceKeys: ['HALTBSCTRADING', 'PAUSELPAVAX'],
        activePauseKeys: ['PAUSELP', 'HALTBSCTRADING', 'PAUSELPAVAX'],
        chainStatuses: [
          {
            chain: 'AVAX',
            halted: false,
            tradingPaused: false,
            lpActionsPaused: true,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: ['PAUSELPAVAX'],
            lpDepositPauseKeys: [],
          },
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
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Some swaps may be limited');
    expect(html).toContain('1 swap-limited');
    expect(html).toContain('2 operation-affected');
    expect(html.indexOf('aria-label="BSC: Trading halted"')).toBeLessThan(html.indexOf('aria-label="AVAX: LP actions paused"'));
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

    expect(html).toContain('aria-label="ETH: Secured deposits paused"');
    expect(html).toContain('2 evidence items');
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
    expect(html).toContain('Data quality');
    expect(html).toContain('Scheduled monitored Mimir keys');
    expect(html).toContain('HALTTRADING');
    expect(html).toMatch(/Scheduled control details[\s\S]*Trading[\s\S]*HALTTRADING[\s\S]*Scheduled for THORChain height 200\./);
    expect(html).toContain('Trading: scheduled');
    expect(html).toContain('aria-label="BTC: Scheduled control"');
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

  it('renders active pause controls as affected user actions', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        tradingPaused: true,
        lpPaused: true,
        activeControlKeys: ['HALTTRADING', 'PAUSELP', 'MANUALSWAPSTOSYNTHDISABLED'],
        activePauseKeys: ['HALTTRADING', 'PAUSELP', 'MANUALSWAPSTOSYNTHDISABLED'],
        monitoredControls: [
          {
            key: 'HALTTRADING',
            label: 'Trading',
            state: 'active',
            active: true,
            description: 'Swaps and trading actions are paused when active.',
          },
          {
            key: 'PAUSELP',
            label: 'LP actions',
            state: 'active',
            active: true,
            description: 'Liquidity-provider actions are paused when active.',
          },
          {
            key: 'MANUALSWAPSTOSYNTHDISABLED',
            label: 'Manual synth swaps',
            state: 'active',
            active: true,
            description: 'Manual swaps to synthetic assets are disabled when active.',
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} variant="compact" />);

    expect(html).toContain('Trading: halted');
    expect(html).toContain('LP actions: paused');
    expect(html).toContain('Manual synth swaps: disabled');
    expect(html).not.toContain('Trading: active');
    expect(html).not.toContain('LP actions: active');
  });

  it('keeps non-swap pauses from becoming the primary swap status', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'paused',
        summary: 'Current-only live sources show one or more THORChain operations paused.',
        tradingPaused: false,
        signingPaused: false,
        lpPaused: true,
        loansPaused: true,
        observedChainsPaused: false,
        activeControlKeys: ['PAUSELP', 'PAUSELOANS', 'HALTCHURNING'],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: ['PAUSELP', 'PAUSELOANS', 'HALTCHURNING'],
        chainStatuses: [],
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
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} variant="compact" />);

    expect(html).toContain('Swaps appear open; other operations paused');
    expect(html).toContain('Swap status');
    expect(html).toContain('Swaps appear open');
    expect(html).toContain('Other operations may be paused');
    expect(html).toContain('LP actions: paused');
    expect(html).toContain('Loans: paused');
    expect(html).not.toContain('Live sources show paused operations');
    expect(html).not.toContain('Paused operations need source review');
  });

  it('keeps source warnings visible while showing non-swap pauses as partial', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'paused',
        summary: 'Current-only live sources show one or more THORChain operations paused, with source warnings to review.',
        tradingPaused: false,
        signingPaused: false,
        lpPaused: true,
        loansPaused: true,
        observedChainsPaused: false,
        activeControlKeys: ['PAUSELP', 'PAUSELOANS'],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: ['PAUSELP', 'PAUSELOANS'],
        chainStatuses: [],
        sourceWarnings: ['Unknown operation-like Mimir key need review: BURNSYNTHS.'],
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
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} variant="compact" />);

    expect(html).toContain('Swaps appear open; other operations need review');
    expect(html).toContain('swap open');
    expect(html).toContain('Source warning');
    expect(html).toContain('1 key needs Mimir review; exact raw keys stay in diagnostics, not the headline.');
    expect(html).not.toContain('BURNSYNTHS');
    expect(html).not.toContain('Paused operations need source review');
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

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('1 monitored Mimir key could not be parsed.');
    expect(html).toContain('aria-label="BTC: Mimir warning"');
    expect(html).toContain('aria-label="BTC source warnings"');
    expect(html).toContain('Warning: 1 issue');
    expect(html).toContain('Unparseable monitored Mimir keys');
    expect(html).toContain('HALTSIGNINGBTC');
    expect(html).toContain('Signing: unparseable');
    expect(html).not.toContain('aria-label="BTC: Open"');
    expect(html).not.toContain('aria-label="BTC active Mimir key count"');
    expect(html).not.toContain('aria-label="BTC active source evidence count"');
    expect(html).not.toContain('Signing: inactive');
  });

  it('renders swap-blocking source warnings in the primary headline and source badge', () => {
    const warning = 'THORNode latest block timestamp is 21 seconds old; live operation state may be stale.';
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'paused',
        summary: 'Current-only live sources show one or more THORChain operations paused, with source warnings to review.',
        tradingPaused: true,
        signingPaused: false,
        activeControlKeys: ['HALTTRADING'],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: ['HALTTRADING'],
        chainStatuses: [],
        sourceWarnings: [warning],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Swap controls need source review');
    expect(html).toContain('swap paused');
    expect(html).toContain('Degraded');
    expect(html).toContain(warning);
    expect(html).not.toContain('Current-only</span>');
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

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('1 chain-scoped Mimir key needs review.');
    expect(html).toContain('Show 1 key');
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

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('aria-label="BTC: Source warning"');
    expect(html).toContain('aria-label="BTC source warnings"');
    expect(html).toContain('Warning: 1 issue');
    expect(html).toContain(warning);
    expect(html).not.toContain('aria-label="BTC: Open"');
  });

  it('renders ok results without data as unavailable rather than healthy', () => {
    const result: LiveDataResult<NetworkStatus> = {
      status: 'ok',
      checkedAt: '2026-06-19T00:00:00.000Z',
      source: {
        label: 'THORNode',
        url: 'https://thornode.thorchain.network',
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Network status unavailable');
    expect(html).toContain('Current-only THORNode status is unavailable.');
    expect(html).not.toContain('Live sources show no global halt flags');
  });

  it('renders unknown state as a warning state', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'unknown',
        summary: 'THORNode status could not be classified.',
        signingPaused: false,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        chainStatuses: [],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Network status unknown');
    expect(html).toContain('unknown');
    expect(html).not.toContain('Live sources show no global halt flags');
  });

  it('renders inbound-address pause booleans as first-class evidence', () => {
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        signingPaused: false,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        chainStatuses: [
          {
            chain: 'BTC',
            halted: true,
            tradingPaused: false,
            lpActionsPaused: false,
            lpDepositPaused: false,
            signingPaused: false,
            activeMimirKeys: [],
            lpDepositPauseKeys: [],
            inboundAddressEvidenceFields: ['halted'],
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('aria-label="BTC: Chain halted"');
    expect(html).toContain('Operational evidence');
    expect(html).toContain('THORNode inbound_addresses.halted');
    expect(html).toContain('Direct: 1 evidence item');
  });

  it('renders compact status without raw review keys and links to diagnostics', () => {
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
        chainStatuses: [],
        sourceWarnings: ['Unknown operation-like Mimir key need review: BURNSYNTHS.'],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} variant="compact" />);

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('1 key needs Mimir review; exact raw keys stay in diagnostics, not the headline.');
    expect(html).toContain('href="/network"');
    expect(html).toContain('Open diagnostics');
    expect(html).not.toContain('BURNSYNTHS');
    expect(html).not.toContain('Operational evidence');
    expect(html).not.toContain('Per-chain live operation state');
  });

  it('bounds rendered review-key disclosures while keeping the source degraded', () => {
    const keys = Array.from({ length: 81 }, (_, index) => `UNKNOWNENABLEMENT${String(index + 1).padStart(2, '0')}`);
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
        chainStatuses: [],
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
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('Show 81 keys');
    expect(html).toContain('UNKNOWNENABLEMENT01');
    expect(html).toContain('UNKNOWNENABLEMENT80');
    expect(html).not.toContain('UNKNOWNENABLEMENT81');
    expect(html).toContain('1 more keys hidden from the rendered page; source remains degraded.');
  });

  it('renders THORNode block freshness beside source metadata', () => {
    const staleWarning = 'THORNode latest block timestamp is 21 seconds old; live operation state may be stale.';
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'degraded',
        summary: 'Current-only live sources do not show active halt flags, but source warnings need review.',
        signingPaused: false,
        thorchainHeight: 100,
        thorchainSnapshotPinned: true,
        thorchainBlockTime: '2026-06-19T00:00:00.000Z',
        thorchainBlockAgeSeconds: 21,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        sourceWarnings: [staleWarning],
        chainStatuses: [],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('THORChain height 100');
    expect(html).toContain('Block age 21 sec');
    expect(html).toContain(staleWarning);
  });

  it('renders future THORNode block timestamps as source warnings', () => {
    const warning = 'THORNode latest block timestamp is 21 seconds in the future; live operation state may be stale.';
    const result: LiveDataResult<NetworkStatus> = {
      ...liveResult,
      data: {
        ...baseStatus,
        state: 'degraded',
        summary: 'Current-only live sources do not show active halt flags, but source warnings need review.',
        signingPaused: false,
        thorchainHeight: 100,
        thorchainBlockTime: '2026-06-19T00:00:21.000Z',
        thorchainBlockAgeSeconds: -21,
        activeChainKeys: [],
        activeEvidenceKeys: [],
        activePauseKeys: [],
        sourceWarnings: [warning],
        chainStatuses: [],
      },
    };
    const html = renderToStaticMarkup(<NetworkStatusBanner result={result} />);

    expect(html).toContain('Swap status needs source review');
    expect(html).toContain('Block age 21 sec in future');
    expect(html).toContain(warning);
    expect(html).not.toContain('Live sources show no global halt flags');
  });
});
