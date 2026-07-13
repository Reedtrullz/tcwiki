import { test, expect, type Locator, type Page, type Route } from '@playwright/test';

async function expectAnyVisible(locator: Locator) {
  await expect.poll(async () => {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      if (await locator.nth(index).isVisible()) {
        return true;
      }
    }
    return false;
  }).toBe(true);
}

async function fulfillJson(route: Route, value: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(value),
  });
}

async function mockDynamicFeesThornode(page: Page) {
  const currentEpoch = '1867';
  const historyByThorname: Record<string, unknown> = {
    shapeshift: {
      thorname: 'shapeshift',
      whitelist_state: '1',
      pairs: [
        {
          pair: 'BTC.BTC|ETH.ETH',
          dynamic_bps: '4',
          last_active_epoch: '1866',
          history: [
            { epoch: '1864', volume_tor: '2000000000000', fees_tor: '1200000000', bps_at_close: '6' },
            { epoch: '1865', volume_tor: '2500000000000', fees_tor: '1500000000', bps_at_close: '5' },
            { epoch: '1866', volume_tor: '3000000000000', fees_tor: '1800000000', bps_at_close: '4' },
          ],
        },
      ],
    },
    symbiosis: {
      thorname: 'symbiosis',
      whitelist_state: '2',
      pairs: [
        {
          pair: 'BTC.BTC|THOR.RUNE',
          dynamic_bps: '1',
          last_active_epoch: '1866',
          history: [
            { epoch: '1865', volume_tor: '1000000000000', fees_tor: '900000000', bps_at_close: '2' },
            { epoch: '1866', volume_tor: '1200000000000', fees_tor: '950000000', bps_at_close: '1' },
          ],
        },
      ],
    },
  };

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
      L1DynamicFeeEnabled: 1,
      L1SlipMinBPS: 10,
      L1DynamicFeeFloorBPS: 1,
      L1DynamicFeeCeilingBPS: 20,
      L1DynamicFeeStepBPS: 1,
      L1DynamicFeeDeadbandBPS: 1000,
      L1DynamicFeeWindowEpochs: 3,
      L1DynamicFeeEpochBlocks: 14400,
      'DYNAMICFEE-WHITELIST-SHAPESHIFT': 1,
      'DYNAMICFEE-WHITELIST-SYMBIOSIS': 2,
    });
  });
  await page.route(/\/thorchain\/dynamic_l1_fees(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, {
      entries: [
        {
          thorname: 'shapeshift',
          pair: 'BTC.BTC|ETH.ETH',
          dynamic_bps: '4',
          whitelist_state: '1',
          last_active_epoch: '1866',
          latest_fees_tor: '1800000000',
        },
        {
          thorname: 'symbiosis',
          pair: 'BTC.BTC|THOR.RUNE',
          dynamic_bps: '1',
          whitelist_state: '2',
          last_active_epoch: '1866',
          latest_fees_tor: '950000000',
        },
      ],
    });
  });
  await page.route(/\/thorchain\/dynamic_l1_fees_current(?:\?.*)?$/, async (route) => {
    await fulfillJson(route, {
      epoch: currentEpoch,
      entries: [
        {
          thorname: 'shapeshift',
          pair: 'BTC.BTC|ETH.ETH',
          volume_tor: '3300000000000',
          fees_tor: '1900000000',
          epoch: currentEpoch,
        },
        {
          thorname: 'odin',
          pair: 'DOGE.DOGE|THOR.RUNE',
          volume_tor: '500000000000',
          fees_tor: '250000000',
          epoch: currentEpoch,
        },
      ],
    });
  });
  await page.route(/\/thorchain\/dynamic_l1_fees\/([^/?]+)(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const thorname = decodeURIComponent(url.pathname.split('/').at(-1) ?? '').toLowerCase();
    const history = historyByThorname[thorname];

    if (history) {
      await fulfillJson(route, history);
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'not found' }),
    });
  });
}

async function mockDynamicFeesOutage(page: Page) {
  await page.route(
    /\/(?:base\/tendermint\/v1beta1\/blocks\/latest|thorchain\/(?:mimir|dynamic_l1_fees(?:\/[^/?]+)?|dynamic_l1_fees_current))(?:\?.*)?$/,
    async (route) => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'provider unavailable' }),
      });
    }
  );
}

test.describe('THORChain Wiki Dynamic Fees Smoke Tests', () => {
  test('dynamic fees page renders a loaded tracker with evidence disclosures @docker-smoke', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 760 });
    }
    const messages: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') {
        messages.push(message.text());
      }
    });

    await mockDynamicFeesThornode(page);
    await page.goto('/dynamic-fees');
    await expect(page.getByRole('heading', { name: /Dynamic L1 Fees/i })).toBeVisible();
    await expect(page.getByText(/ADR-026 replaces one global L1 minimum slip floor/i)).toBeVisible();
    await expect(page.getByText(/Current-only/i).first()).toBeVisible();
    const sourcePosture = page.getByRole('region', { name: 'Page Source Posture' });
    await expect(sourcePosture).toBeVisible();
    const sourcePosturePrecedesLiveTracker = await sourcePosture.evaluate((posture) => {
      const liveTracker = document.querySelector('#dynamic-fees-live');
      return liveTracker ? Boolean(posture.compareDocumentPosition(liveTracker) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(sourcePosturePrecedesLiveTracker).toBe(true);
    await expect(page.getByRole('heading', { name: /Look Here First/i })).toBeVisible();
    await expect(page.getByText('1. Revenue signal')).toBeVisible();
    await expect(page.getByText('4. Evidence quality')).toBeVisible();
    await expect(page.getByText(/Coverage Check/i)).toBeVisible();
    await expect(page.getByText(/Partial coverage/i)).toBeVisible();
    await expect(page.getByText(/Current epoch rows/i)).toBeVisible();
    await expect(page.getByText(/Rows with sealed record/i)).toBeVisible();
    await expect(page.getByText('Sealed history', { exact: true })).toBeVisible();
    await expect(page.getByText(/current row lack a matching \/dynamic_l1_fees record/i)).toBeVisible();
    await expect(page.getByText(/1 source warning/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Experiment source map/i })).toHaveAttribute('href', '/docs#dynamic-fee-experiment');
    await expect(page.getByRole('link', { name: /ADR-026 record/i })).toHaveAttribute('href', '/governance#governance-adr-026-dynamic-l1-fees');
    await expect(page.getByRole('heading', { name: /Historical Results/i })).toBeVisible();
    await expect(page.getByRole('img', { name: /Sealed dynamic fee history chart/i })).toBeVisible();
    await expect(page.getByText(/Pair Movement Snapshot/i)).toBeVisible();
    await expect(page.getByText(/Bps moved/i)).toBeVisible();
    await expect(page.getByText(/2 \/ 2/).first()).toBeVisible();
    await expect(page.getByText(/Moved down 2 bps/i)).toBeVisible();
    await expect(page.getByText(/Pair movement is controller evidence, not proof of revenue lift/i)).toBeVisible();
    await expect(page.getByText(/Show controller configuration/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tracked Records' })).toBeVisible();
    const recordsExplorer = page.locator('#dynamic-fee-records-explorer');
    await expect(recordsExplorer.getByText('Showing 2 of 2')).toBeVisible();
    await expectAnyVisible(page.getByText('shapeshift', { exact: true }));
    await expectAnyVisible(page.getByText('BTC.BTC|ETH.ETH', { exact: true }));
    await recordsExplorer.getByLabel(/Search tracked records/i).fill('symbiosis');
    await expect(recordsExplorer.getByText('Showing 1 of 2')).toBeVisible();
    await expectAnyVisible(recordsExplorer.getByText('symbiosis', { exact: true }));
    await expect(recordsExplorer.getByText('shapeshift', { exact: true })).toHaveCount(0);
    await recordsExplorer.getByRole('button', { name: /Clear filters/i }).click();
    await recordsExplorer.getByLabel(/Bps position/i).selectOption('floor');
    await expect(recordsExplorer.getByText('Bps: At floor')).toBeVisible();
    await expect(recordsExplorer.getByText('Showing 1 of 2')).toBeVisible();
    await expectAnyVisible(recordsExplorer.getByText('symbiosis', { exact: true }));
    await recordsExplorer.getByRole('button', { name: /Clear filters/i }).click();
    await recordsExplorer.getByLabel(/Current epoch/i).selectOption('with-current');
    await expect(recordsExplorer.getByText('Current epoch: yes')).toBeVisible();
    await expect(recordsExplorer.getByText('Showing 1 of 2')).toBeVisible();
    await expectAnyVisible(recordsExplorer.getByText('shapeshift', { exact: true }));
    await recordsExplorer.getByRole('button', { name: /Clear filters/i }).click();
    await recordsExplorer.getByLabel(/Search tracked records/i).fill('not-a-real-thorname');
    await expect(recordsExplorer.getByText('Showing 0 of 2')).toBeVisible();
    await expect(recordsExplorer.getByText(/No tracked records match these filters/i)).toBeVisible();
    await recordsExplorer.getByRole('button', { name: /Reset filters/i }).click();
    await expect(recordsExplorer.getByText('Showing 2 of 2')).toBeVisible();
    await expect(page.getByText(/Current accumulators without sealed records/i)).toBeVisible();
    await expectAnyVisible(page.getByText('DOGE.DOGE|THOR.RUNE', { exact: true }));
    await expect(page.getByText(/Show exact Mimir keys and endpoint fields/i)).toBeVisible();
    await page.getByText(/Show exact Mimir keys and endpoint fields/i).click();
    await expectAnyVisible(page.getByText(/Current dynamic fee entry odin DOGE\.DOGE\|THOR\.RUNE exists without a sealed dynamic_l1_fees record/i));
    await expect(page.getByText(/How the Experiment Works/i)).toBeVisible();
    await expect(page.getByText(/Community Read/i)).toBeVisible();
    await expect(page.getByText(/Interpretation Notes And Non-Claims/i)).toBeVisible();
    await expectAnyVisible(page.getByText(/Current records and sparse sealed history do not prove revenue lift/i));

    const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? bodyWidth;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 2);
    expect(messages.join('\n')).not.toMatch(/Application error|Unhandled Runtime Error|hydration/i);
  });

  test('dynamic fees page distinguishes terminal provider failure from loading', async ({ page }) => {
    await mockDynamicFeesOutage(page);
    await page.goto('/dynamic-fees');

    const sourceStatus = page.locator('#dynamic-fee-source-status');
    const liveTracker = page.locator('#dynamic-fees-live');
    await expect(sourceStatus.getByText('Degraded', { exact: true })).toBeVisible();
    await expect(sourceStatus).toContainText(/did not provide a usable snapshot/i);
    await expect(liveTracker.getByText('Sources unavailable', { exact: true })).toBeVisible();
    await expect(liveTracker.getByText('Coverage unavailable', { exact: true })).toBeVisible();
    await expect(page.getByText('Live proof unavailable', { exact: true })).toBeVisible();
    await expect(page.getByText(/Sources loading|Coverage loading|Live proof loading/)).toHaveCount(0);
    await expect(page.getByText(/How the Experiment Works/i)).toBeVisible();

    const sourceStatusPrecedesTracker = await sourceStatus.evaluate((source) => {
      const tracker = document.querySelector('#dynamic-fees-live');
      return tracker ? Boolean(source.compareDocumentPosition(tracker) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
    });
    expect(sourceStatusPrecedesTracker).toBe(true);
  });
});
