import type { NetworkStatusSourceWarning } from '@/lib/types';

const thornodeSources = [
  { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
  { label: 'THORNode latest block', url: 'https://thornode.thorchain.network/cosmos/base/tendermint/v1beta1/blocks/latest' },
  { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=26799999' },
  { label: 'THORNode inbound addresses', url: 'https://thornode.thorchain.network/thorchain/inbound_addresses?height=26799999' },
  { label: 'THORNode version', url: 'https://thornode.thorchain.network/thorchain/version?height=26799999' },
  { label: 'THORNode lastblock', url: 'https://thornode.thorchain.network/thorchain/lastblock?height=26799999' },
];

export const dynamicFeeSources = [
  { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
  { label: 'THORNode latest block', url: 'https://thornode.thorchain.network/cosmos/base/tendermint/v1beta1/blocks/latest' },
  { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=26799999' },
  { label: 'THORNode dynamic L1 fee records', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees?height=26799999' },
  { label: 'THORNode dynamic L1 fee current epoch', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees_current?height=26799999' },
  { label: 'THORNode dynamic L1 fee history ss', url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees/ss?height=26799999' },
];

export const runePoolPolSources = [
  { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
  { label: 'THORNode latest block', url: 'https://thornode.thorchain.network/cosmos/base/tendermint/v1beta1/blocks/latest' },
  { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=26799999' },
  { label: 'THORNode RUNEPool accounting', url: 'https://thornode.thorchain.network/thorchain/runepool?height=26799999' },
];

export function readinessResponse() {
  return {
    status: 'degraded',
    ready: false,
    checkedAt: '2026-07-04T00:00:00.000Z',
    version: 'development',
    commit: 'unknown',
    image: 'unknown',
    runtime: {
      version: 'development',
      commit: 'unknown',
      image: 'unknown',
      strict: false,
      verified: false,
      warnings: [
        'Runtime version metadata is missing or still using a local placeholder.',
        'Runtime commit metadata is missing or not a git SHA.',
        'Runtime image metadata is missing or not an immutable sha256 digest ref.',
      ],
    },
    warnings: [] as string[],
    reasons: ['THORNode dynamic fee state is stale.'],
    sources: {
      midgard: {
        status: 'ok',
        source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
        healthWarnings: [],
        sourceWarnings: [] as string[],
        sourceWarningDetails: [] as NetworkStatusSourceWarning[],
        visibleData: {
          network: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
          pools: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
          earnings: {
            status: 'ok',
            checkedAt: '2026-07-04T00:00:00.000Z',
            source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
          },
        },
      },
      thornode: {
        status: 'ok',
        source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
        sources: thornodeSources,
        sourceCount: thornodeSources.length,
        activeControlKeys: [],
        activeChainKeys: [],
        activeEvidenceKeys: [],
        scheduledMimirKeys: [],
        chainStatuses: [],
        monitoredControls: [],
        invalidMimirKeys: [],
        sourceWarnings: [] as string[],
        sourceWarningDetails: [] as NetworkStatusSourceWarning[],
        dynamicFees: {
          status: 'ok',
          checkedAt: '2026-07-04T00:00:00.000Z',
          source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
          sources: dynamicFeeSources,
          enabledState: 'active',
          enabledValue: 1,
          currentEpoch: 1864,
          trackedRecordCount: 1,
          currentEntryCount: 1,
          whitelistedThornameCount: 1,
          historyThornameCount: 1,
          historySampleCount: 4,
          thorchainHeight: 26800000,
          snapshotPinned: true,
          thorchainBlockTime: '2026-07-04T00:00:00.000Z',
          thorchainBlockAgeSeconds: 2,
          sourceWarnings: ['THORNode dynamic fee state is stale.'],
          sourceWarningDetails: [
            {
              severity: 'warning',
              category: 'freshness',
              message: 'THORNode dynamic fee state is stale.',
              action: 'Refresh the pinned THORNode snapshot.',
            },
          ],
        },
        runePoolPol: {
          status: 'ok',
          checkedAt: '2026-07-04T00:00:00.000Z',
          source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
          sources: runePoolPolSources,
          activePolPoolCount: 2,
          depositMaturityBlocksState: 'present',
          depositMaturityBlocksValue: 14400,
          maxReserveBackstopState: 'present',
          maxReserveBackstopValue: 2500000000000,
          minRunePoolDepthState: 'present',
          minRunePoolDepthValue: 1000000000000,
          thorchainHeight: 26800000,
          snapshotPinned: true,
          thorchainBlockTime: '2026-07-04T00:00:00.000Z',
          thorchainBlockAgeSeconds: 2,
          sourceWarnings: [],
          sourceWarningDetails: [],
        },
      },
    },
  };
}

export function readyResponse() {
  const response = readinessResponse();
  response.status = 'ready';
  response.ready = true;
  response.reasons = [];
  response.sources.thornode.dynamicFees.sourceWarnings = [];
  response.sources.thornode.dynamicFees.sourceWarningDetails = [];
  response.sources.thornode.runePoolPol.sourceWarnings = [];
  response.sources.thornode.runePoolPol.sourceWarningDetails = [];
  return response;
}
