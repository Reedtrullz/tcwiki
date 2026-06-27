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
});
