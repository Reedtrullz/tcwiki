import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ThorNodeCoverageView } from '@/components/features/ThorNodePanel';
import type { LiveDataResult, NetworkStats, ThorchainNodeCoverageRow } from '@/lib/types';

function renderPanel(rows: ThorchainNodeCoverageRow[], midgardNetwork: NetworkStats) {
  const checkedAt = '2026-10-03T00:00:00.000Z';
  const result: LiveDataResult<ThorchainNodeCoverageRow[]> = {
    status: 'ok',
    checkedAt,
    data: rows,
    source: {
      label: 'THORChain THORNode node set',
      url: 'https://thornode.thorchain.network/thorchain/nodes',
      retrievedAt: checkedAt,
    },
  };
  const midgardResult: LiveDataResult<NetworkStats> = {
    status: 'ok',
    checkedAt,
    data: midgardNetwork,
    source: {
      label: 'THORChain Midgard',
      url: 'https://midgard.thorchain.network/v2/network',
      retrievedAt: checkedAt,
    },
  };
  return renderToStaticMarkup(
    <ThorNodeCoverageView
      rows={rows}
      result={result}
      isLoading={false}
      refresh={() => undefined}
      midgardNetwork={midgardNetwork}
      midgardResult={midgardResult}
    />
  );
}

const midgardNetwork: NetworkStats = {
  totalPooledRune: '1',
  totalReserve: '1',
  activeNodeCount: 103,
  standbyNodeCount: 70,
  bondingAPY: '0',
  liquidityAPY: '0',
  nextChurnHeight: 1,
  bondMetrics: {},
};

describe('THORNode node coverage panel', () => {
  it('relates distinct Midgard summary counts without calling a difference an outage', () => {
    const rows: ThorchainNodeCoverageRow[] = [
      { nodeAddress: 'thor1active', status: 'Active', version: '3.20.3' },
      { nodeAddress: 'thor1standby', status: 'Standby', version: 'release-x' },
      { nodeAddress: 'thor1unknown', status: 'Observer', version: undefined },
      { nodeAddress: 'thor1missing', status: undefined, version: undefined },
    ];
    const html = renderPanel(rows, midgardNetwork);

    expect(html).toContain('Rows in loaded THORNode');
    expect(html).toContain('including statuses beyond Active');
    expect(html).toContain('Midgard&#x27;s <code>/v2/nodes</code> public-key rows');
    expect(html).toContain('Separate Midgard summary');
    expect(html).toContain('103');
    expect(html).toContain('70');
    expect(html).toContain('Observer');
    expect(html).toContain('release-x');
    expect(html).toContain('Missing status');
    expect(html).toContain('Missing version');
    expect(html).toContain('A difference alone does not indicate an outage.');
    expect(html).toContain('not proof of a node&#x27;s complete build or control applicability');
    expect(html).toContain('THORNode 3.20.3');
    expect(html).toContain('https://thornode.thorchain.network/thorchain/nodes');
    expect(html).toContain('https://midgard.thorchain.network/v2/network');
  });

  it('bounds rendered rows and gives the horizontal table a labeled keyboard-focusable region', () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      nodeAddress: `thor1node${index}`,
      status: 'Active',
      version: '3.20.3',
    }));
    const html = renderPanel(rows, midgardNetwork);
    const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '';

    expect(html).toContain('Showing 20 of 25 matching rows (25 loaded).');
    expect(body.match(/<tr/g)).toHaveLength(20);
    expect(html).toContain('type="search"');
    expect(html).toContain('Search address, status, or version');
    expect(html).toContain('Rows shown');
    expect(html).toContain('tabindex="0" role="region" aria-label="Scrollable THORNode node rows"');
    expect(html).toContain('<details');
  });

  it('keeps rows with an intentionally omitted source address visible', () => {
    const html = renderPanel([{ status: 'Unknown', version: '0.0.0' }], midgardNetwork);

    expect(html).toContain('Missing address');
    expect(html).toContain('Unknown');
    expect(html).toContain('0.0.0');
  });

  it('shows provider failure without substituting an empty sample', () => {
    const html = renderToStaticMarkup(
      <ThorNodeCoverageView
        result={{ status: 'degraded', checkedAt: '2026-10-03T00:00:00.000Z', error: 'Both THORNode sources failed.' }}
        isLoading={false}
        refresh={() => undefined}
        midgardNetwork={midgardNetwork}
      />
    );

    expect(html).toContain('Both THORNode sources failed.');
    expect(html).not.toContain('Rows in loaded THORNode');
    expect(html).not.toContain('<table');
  });
});
