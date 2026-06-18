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
  activePauseKeys: ['HALTSIGNINGBTC'],
  monitoredControls: [],
  chainStatuses: [
    {
      chain: 'BTC',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      signingPaused: true,
    },
    {
      chain: 'ETH',
      halted: false,
      tradingPaused: false,
      lpActionsPaused: false,
      signingPaused: false,
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
});
