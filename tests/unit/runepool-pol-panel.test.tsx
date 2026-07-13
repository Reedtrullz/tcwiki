import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RunepoolPolView } from '@/app/economics/RunepoolPolPanel';
import type { LiveDataResult, NetworkStatus, RunePoolPolStatus } from '@/lib/types';

const status: RunePoolPolStatus = {
  pol: {
    runeDepositedBaseUnits: '1250313135142376',
    runeWithdrawnBaseUnits: '690803512821382',
    valueRuneBaseUnits: '374089371198518',
    pnlRuneBaseUnits: '-185420251122476',
    currentDepositRuneBaseUnits: '559509622320994',
  },
  providers: {
    units: '244190152445550',
    pendingUnits: '0',
    pendingRuneBaseUnits: '0',
    valueRuneBaseUnits: '179737127677024',
    pnlRuneBaseUnits: '-105713323488637',
    currentDepositRuneBaseUnits: '285450451165661',
  },
  reserve: {
    units: '264046191162734',
    valueRuneBaseUnits: '194352243521494',
    pnlRuneBaseUnits: '-79706927633839',
    currentDepositRuneBaseUnits: '274059171155333',
  },
  polPools: [
    { key: 'POL-BTC', asset: 'BTC', value: 1, state: 'active' },
    { key: 'POL-ETH', asset: 'ETH', value: 1, state: 'active' },
    { key: 'POL-SOL', asset: 'SOL', value: 0, state: 'inactive' },
  ],
  activePolPoolCount: 2,
  depositMaturityBlocks: { key: 'RUNEPoolDepositMaturityBlocks', value: 14400, state: 'present' },
  maxReserveBackstop: { key: 'RUNEPoolMaxReserveBackstop', value: 2500000000000, state: 'present' },
  minRunePoolDepth: { key: 'MINRUNEPOOLDEPTH', value: 1000000000000, state: 'present' },
  sourceFreshness: {
    thorchainHeight: 26880000,
    thorchainBlockTime: '2026-07-06T00:00:00.000Z',
    thorchainBlockAgeSeconds: 8,
    snapshotPinned: true,
  },
  sourceWarnings: [],
  sourceWarningDetails: [],
  caveats: ['current-only', 'not-yield-proof', 'availability-separate'],
};

const networkStatus: NetworkStatus = {
  state: 'operational',
  summary: 'Network operations are available.',
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
  runePoolEnabled: true,
  runePoolDepositPaused: false,
  runePoolWithdrawPaused: true,
  wasmPaused: null,
  poolDepositPauseKeys: [],
  chainStatuses: [],
  activeControlKeys: ['RUNEPoolHaltWithdraw'],
  activeChainKeys: [],
  activeEvidenceKeys: [],
  activePauseKeys: ['RUNEPoolHaltWithdraw'],
  monitoredControls: [],
  invalidMimirKeys: [],
  sourceWarnings: [],
};

const result: LiveDataResult<RunePoolPolStatus> = {
  status: 'ok',
  checkedAt: '2026-07-06T00:00:08.000Z',
  data: status,
  sources: [
    { label: 'Liquify THORNode', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain' },
    { label: 'Liquify THORNode latest block', url: 'https://gateway.liquify.com/chain/thorchain_api/cosmos/base/tendermint/v1beta1/blocks/latest' },
    { label: 'Liquify THORNode Mimir', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/mimir?height=26880000' },
    { label: 'Liquify THORNode RUNEPool accounting', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/runepool?height=26880000' },
  ],
};

const networkResult: LiveDataResult<NetworkStatus> = {
  status: 'ok',
  checkedAt: '2026-07-06T00:00:08.000Z',
  data: networkStatus,
  source: { label: 'Liquify THORNode', url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain' },
};

describe('RunepoolPolView', () => {
  it('renders current accounting, availability, source labels, and non-claims', () => {
    const html = renderToStaticMarkup(
      <RunepoolPolView
        result={result}
        status={status}
        networkResult={networkResult}
        networkStatus={networkStatus}
      />
    );

    expect(html).toContain('RUNEPool/POL Current Snapshot');
    expect(html).toContain('Read this snapshot first');
    expect(html).toContain('Deposit halt check');
    expect(html).toContain('No tracked deposit halt');
    expect(html).toContain('Withdraw halt check');
    expect(html).toContain('Withdrawals paused');
    expect(html).toContain('wallet/interface support or future availability proof');
    expect(html).toContain('user position, wallet/interface, and checked block still matter');
    expect(html).toContain('Which value matters?');
    expect(html).toContain('Provider value/PnL');
    expect(html).toContain('Which pools count?');
    expect(html).toContain('What not to infer?');
    expect(html).toContain('No yield proof');
    expect(html).toContain('Accounting source');
    expect(html).toContain('Current-only');
    expect(html).toContain('RUNEPool');
    expect(html).toContain('Control enabled');
    expect(html).toContain('this is not deposit, withdrawal, wallet, or future-availability proof');
    expect(html).toContain('Deposits');
    expect(html).toContain('No active halt');
    expect(html).toContain('Withdrawals');
    expect(html).toContain('Paused');
    expect(html).toContain('POL pool scope');
    expect(html).toContain('Minimum RUNEPool depth');
    expect(html).toContain('10,000 RUNE');
    expect(html).toContain('2 active');
    expect(html).toContain('POL current value');
    expect(html).toContain('3,740,894 RUNE');
    expect(html).toContain('protocol-owned-liquidity bucket current value');
    expect(html).toContain('POL PnL');
    expect(html).toContain('-1,854,203 RUNE');
    expect(html).toContain('current POL bucket PnL; can be negative');
    expect(html).toContain('aggregate provider current value');
    expect(html).toContain('checked accounting only, not APY or future yield');
    expect(html).toContain('Provider pending RUNE');
    expect(html).toContain('0 RUNE');
    expect(html).toContain('pending provider RUNE, not available liquidity');
    expect(html).toContain('BTC');
    expect(html).toContain('ETH');
    expect(html).toContain('RUNEPoolDepositMaturityBlocks');
    expect(html).toContain('14,400');
    expect(html).toContain('RUNEPoolMaxReserveBackstop');
    expect(html).toContain('2,500,000,000,000');
    expect(html).toContain('Bucket Relationship');
    expect(html).toContain('Provider + reserve value');
    expect(html).toContain('Balances');
    expect(html).toContain('Provider + reserve PnL');
    expect(html).toContain('Arithmetic matches');
    expect(html).toContain('Value split');
    expect(html).toContain('Split parsed');
    expect(html).toContain('Provider share');
    expect(html).toContain('48.05%');
    expect(html).toContain('Reserve share');
    expect(html).toContain('51.95%');
    expect(html).toContain('Arithmetic checks are source-shape checks, not solvency or yield proof.');
    expect(html).toContain('Liquify THORNode RUNEPool accounting');
    expect(html).toContain('Show exact RUNEPool fields used');
    expect(html).toContain('Show source warnings and non-claims');
    expect(html).toContain('does not prove future yield');
    expect(html).not.toContain('$0.00');
  });

  it('shows unavailable values and warning posture for malformed accounting', () => {
    const warningStatus: RunePoolPolStatus = {
      ...status,
      pol: {
        ...status.pol,
        valueRuneBaseUnits: null,
        pnlRuneBaseUnits: null,
      },
      polPools: [
        { key: 'POL-BTC', asset: 'BTC', value: null, state: 'unparseable' },
      ],
      activePolPoolCount: 0,
      depositMaturityBlocks: { key: 'RUNEPoolDepositMaturityBlocks', value: null, state: 'unparseable' },
      sourceWarnings: [
        'THORNode runepool.pol.value included an invalid RUNE base-unit value.',
        'THORNode Mimir POL-BTC was unparseable for RUNEPool POL scope.',
      ],
      sourceWarningDetails: [
        {
          severity: 'warning',
          category: 'source-shape',
          message: 'THORNode runepool.pol.value included an invalid RUNE base-unit value.',
          action: 'Treat the affected RUNEPool accounting field as unavailable until THORNode returns a clean base-unit value.',
          keys: ['runepool.pol.value'],
        },
      ],
    };
    const html = renderToStaticMarkup(
      <RunepoolPolView
        result={{ ...result, data: warningStatus }}
        status={warningStatus}
        networkResult={networkResult}
        networkStatus={{ ...networkStatus, runePoolDepositPaused: null }}
      />
    );

    expect(html).toContain('Source warning');
    expect(html).toContain('2 RUNEPool source warnings');
    expect(html).toContain('need review before treating accounting as clean');
    expect(html).toMatch(/Source Posture[\s\S]*First warning: THORNode runepool\.pol\.value included an invalid RUNE base-unit value\./);
    expect(html).toContain('Show source warnings and non-claims (2)');
    expect(html).toContain('Needs review');
    expect(html).toContain('Unavailable');
    expect(html).toContain('No clean `RUNEPoolHaltDeposit` state was available');
    expect(html).toMatch(/Provider \+ reserve value[\s\S]*Unavailable/);
    expect(html).toMatch(/Value split[\s\S]*Unavailable/);
    expect(html).toContain('THORNode runepool.pol.value included an invalid RUNE base-unit value.');
    expect(html).not.toContain('0 RUNE</p><p class="mt-1 text-xs leading-relaxed text-slate-400">`pol.value`');
  });

  it('marks bucket splits review-only when provider and reserve values do not balance to POL', () => {
    const mismatchStatus: RunePoolPolStatus = {
      ...status,
      reserve: {
        ...status.reserve,
        valueRuneBaseUnits: '194352143521494',
      },
    };
    const html = renderToStaticMarkup(
      <RunepoolPolView
        result={{ ...result, data: mismatchStatus }}
        status={mismatchStatus}
        networkResult={networkResult}
        networkStatus={networkStatus}
      />
    );

    expect(html).toMatch(/Provider \+ reserve value[\s\S]*Needs review/);
    expect(html).toContain('Difference versus POL total: 1 RUNE');
    expect(html).toContain('source-shape review signal');
    expect(html).toMatch(/Value split[\s\S]*Needs review/);
    expect(html).toContain('Value split parsed, but provider plus reserve value does not match `pol.value`');
  });
});
