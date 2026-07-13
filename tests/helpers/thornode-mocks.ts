import type { Page, Route } from '@playwright/test';

interface SwapperFirstNetworkMockOptions {
  mimir?: Record<string, unknown>;
}

export async function fulfillJson(route: Route, value: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(value),
  });
}

export async function mockSwapperFirstNetwork(page: Page, options: SwapperFirstNetworkMockOptions = {}) {
  const pools = [
    { asset: 'BTC.BTC', assetDepth: '100000000', runeDepth: '100000000', status: 'available' },
    { asset: 'ETH.ETH', assetDepth: '100000000', runeDepth: '100000000', status: 'available' },
    { asset: 'BSC.BNB', assetDepth: '100000000', runeDepth: '100000000', status: 'available' },
    { asset: 'SOL.SOL', assetDepth: '100000000', runeDepth: '100000000', status: 'available' },
  ];

  await page.route(/\/base\/tendermint\/v1beta1\/blocks\/latest(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, {
      block: {
        header: {
          height: '101',
          time: new Date().toISOString(),
        },
      },
    });
  });
  await page.route(/\/thorchain\/mimir(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, {
      HALTBSCTRADING: 1,
      HALTSOLCHAIN: 1,
      PAUSELP: 1,
      BURNSYNTHS: 1,
      RUNEPOOLENABLED: 1,
      RUNEPoolHaltDeposit: 0,
      RUNEPoolHaltWithdraw: 0,
      RUNEPoolDepositMaturityBlocks: '14400',
      RUNEPoolMaxReserveBackstop: '2500000000000',
      'POL-BTC': 1,
      'POL-ETH': 1,
      ...options.mimir,
    });
  });
  await page.route(/\/thorchain\/inbound_addresses(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, [
      { chain: 'BTC', halted: false, global_trading_paused: false, chain_trading_paused: false, chain_lp_actions_paused: false },
      { chain: 'ETH', halted: false, global_trading_paused: false, chain_trading_paused: false, chain_lp_actions_paused: false },
      { chain: 'BSC', halted: false, global_trading_paused: false, chain_trading_paused: false, chain_lp_actions_paused: false },
      { chain: 'SOL', halted: false, global_trading_paused: false, chain_trading_paused: false, chain_lp_actions_paused: false },
    ]);
  });
  await page.route(/\/thorchain\/version(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, { current: '3.19.2' });
  });
  await page.route(/\/thorchain\/lastblock(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, [
      { chain: 'BTC', thorchain: 100, last_observed_in: 100, last_signed_out: 100 },
      { chain: 'ETH', thorchain: 100, last_observed_in: 100, last_signed_out: 100 },
      { chain: 'BSC', thorchain: 100, last_observed_in: 100, last_signed_out: 100 },
      { chain: 'SOL', thorchain: 100, last_observed_in: 100, last_signed_out: 100 },
    ]);
  });
  await page.route(/\/thorchain\/runepool(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, {
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
    });
  });
  await page.route(/\/v2\/pools\?status=available$/, async (route) => {
    await fulfillJson(route, pools);
  });
  await page.route(/\/thorchain\/quote\/swap\?.*$/, async (route) => {
    const url = new URL(route.request().url());
    const fromAsset = url.searchParams.get('from_asset');
    const amount = url.searchParams.get('amount');

    if (fromAsset === 'BSC.BNB' || fromAsset === 'SOL.SOL') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 400,
          message: `trading is halted on ${fromAsset.split('.')[0]}`,
        }),
      });
      return;
    }

    if (amount === '2000000') {
      await fulfillJson(route, {
        recommended_min_amount_in: '2000000',
        fees: {
          asset: 'ETH.ETH',
          total: '30000',
          total_bps: 25,
        },
      });
      return;
    }

    await fulfillJson(route, {
      expected_amount_out: '99000000',
      recommended_min_amount_in: '1000000',
      inbound_confirmation_seconds: 600,
      outbound_delay_seconds: 12,
      total_swap_seconds: 612,
      expiry: 1790000000,
      fees: {
        asset: 'ETH.ETH',
        total: '30000',
        total_bps: 25,
        slippage_bps: 7,
      },
    });
  });
}
