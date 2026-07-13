import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TCY_CONTROL_DEFINITIONS, TcyControlsView } from '@/app/tcy/TcyControlsPanel';
import { OPERATIONAL_CONTROL_CATALOG } from '@/lib/operational-controls';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';

const status: NetworkStatus = {
  state: 'degraded',
  summary: 'TCY controls need review.',
  tradingPaused: false,
  signingPaused: false,
  lpPaused: false,
  loansPaused: false,
  observedChainsPaused: false,
  securedAssetsPaused: null,
  tcyClaimingPaused: false,
  tcyClaimingSwapPaused: true,
  tcyStakingPaused: false,
  tcyStakeDistributionPaused: null,
  tcyUnstakingPaused: false,
  tcyTradingPaused: true,
  tradeAccountsEnabled: null,
  runePoolEnabled: null,
  wasmPaused: null,
  poolDepositPauseKeys: [],
  chainStatuses: [],
  activeControlKeys: ['TCYCLAIMINGSWAPHALT', 'HALTTCYTRADING'],
  activeChainKeys: [],
  activeEvidenceKeys: ['TCYCLAIMINGSWAPHALT', 'HALTTCYTRADING'],
  activePauseKeys: ['TCYCLAIMINGSWAPHALT', 'HALTTCYTRADING'],
  monitoredControls: [],
  thorchainHeight: 26880000,
  thorchainSnapshotPinned: true,
  thorchainBlockAgeSeconds: 8,
  invalidMimirKeys: [],
  sourceWarnings: ['14 operation-like Mimir keys need review.'],
};

const result: LiveDataResult<NetworkStatus> = {
  status: 'ok',
  checkedAt: '2026-07-06T00:00:08.000Z',
  data: status,
  sources: [
    { label: 'Liquify THORNode', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain' },
    { label: 'Liquify THORNode Mimir', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=26880000' },
  ],
};

describe('TcyControlsView', () => {
  it('uses the shared operational-control catalog for TCY key labels and descriptions', () => {
    const tcyCatalogEntries = OPERATIONAL_CONTROL_CATALOG.filter((entry) => entry.area === 'TCY' && !entry.scoped);
    const html = renderToStaticMarkup(<TcyControlsView result={result} status={status} />);

    expect(TCY_CONTROL_DEFINITIONS.map((control) => control.keyName)).toEqual(tcyCatalogEntries.map((entry) => entry.key));
    expect(TCY_CONTROL_DEFINITIONS.map((control) => control.label)).toEqual(tcyCatalogEntries.map((entry) => entry.label));

    for (const entry of tcyCatalogEntries) {
      expect(html).toContain(entry.key);
      expect(html).toContain(entry.label);
      expect(html).toContain(entry.description);
    }
  });

  it('separates active, inactive, and review-needed TCY controls with source posture', () => {
    const html = renderToStaticMarkup(<TcyControlsView result={result} status={status} />);

    expect(html).toContain('Current TCY Controls');
    expect(html).toContain('Read these controls first');
    expect(html).toContain('Use it as a halt-control check');
    expect(html).toContain('Claim halt check');
    expect(html).toContain('Claim path halted');
    expect(html).toContain('Staking halt check');
    expect(html).toContain('Needs review');
    expect(html).toContain('Trading halt check');
    expect(html).toContain('Trading halted');
    expect(html).toContain('Source quality');
    expect(html).toContain('Non-claim');
    expect(html).not.toContain('Can I claim?');
    expect(html).not.toContain('Can I stake?');
    expect(html).not.toContain('Can I trade?');
    expect(html).toContain('No recovery proof');
    expect(html).toContain('address eligibility still need separate proof');
    expect(html).toContain('do not prove par recovery');
    expect(html).toContain('2 halted');
    expect(html).toContain('TCY claim swaps');
    expect(html).toContain('TCYCLAIMINGSWAPHALT');
    expect(html).toContain('Paused');
    expect(html).toContain('TCY trading');
    expect(html).toContain('HALTTCYTRADING');
    expect(html).toContain('Halted');
    expect(html).toContain('TCY claiming');
    expect(html).toContain('No active halt');
    expect(html).toContain('TCY distributions');
    expect(html).toContain('Needs review');
    expect(html).toContain('Do not treat this as open.');
    expect(html).toContain('Source warning');
    expect(html).toContain('height 26,880,000 / height-pinned / 8s block age');
    expect(html).toContain('1 TCY source warning');
    expect(html).toContain('need review before treating TCY controls as clean');
    expect(html).toMatch(/Source Posture[\s\S]*First warning: 14 operation-like Mimir keys need review\./);
    expect(html).toContain('Show exact TCY keys and source warnings (1)');
    expect(html).toContain('14 operation-like Mimir keys need review.');
    expect(html).toContain('does not prove an official claim interface is live');
    expect(html).toContain('/network#network-diagnostics');
  });

  it('labels clear TCY controls as halt checks rather than action availability', () => {
    const clearStatus: NetworkStatus = {
      ...status,
      state: 'operational',
      summary: 'No tracked TCY halt controls are active.',
      tcyClaimingSwapPaused: false,
      tcyStakeDistributionPaused: false,
      tcyTradingPaused: false,
      activeControlKeys: [],
      activeEvidenceKeys: [],
      activePauseKeys: [],
      sourceWarnings: [],
    };
    const clearResult: LiveDataResult<NetworkStatus> = {
      ...result,
      data: clearStatus,
    };
    const html = renderToStaticMarkup(<TcyControlsView result={clearResult} status={clearStatus} />);

    expect(html).toContain('No tracked TCY halt');
    expect(html).toContain('clears halt controls only');
    expect(html).toContain('No tracked claim halt');
    expect(html).toContain('No tracked staking halt');
    expect(html).toContain('No tracked trading halt');
    expect(html).not.toContain('No active TCY halts');
  });

  it('summarizes unknown Mimir keys in source posture while keeping exact keys in the disclosure', () => {
    const warnedStatus: NetworkStatus = {
      ...status,
      sourceWarnings: ['Unknown operation-like Mimir keys need review: PRIVATE-KEY-A, PRIVATE-KEY-B.'],
      sourceWarningDetails: [
        {
          severity: 'review',
          category: 'unknown-operation',
          message: 'Unknown operation-like Mimir keys need review: PRIVATE-KEY-A, PRIVATE-KEY-B.',
          action: 'Review the operation-like key family before interpreting it as non-pausing.',
          keys: ['PRIVATE-KEY-A', 'PRIVATE-KEY-B'],
        },
      ],
    };
    const html = renderToStaticMarkup(<TcyControlsView result={{ ...result, data: warnedStatus }} status={warnedStatus} />);

    expect(html).toMatch(/Source Posture[\s\S]*First warning: 2 operation-like Mimir keys need review\./);
    expect(html).toContain('PRIVATE-KEY-A');
    expect(html).toContain('PRIVATE-KEY-B');
  });
});
