import { beforeEach, describe, expect, it, vi } from 'vitest';
import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import { GET } from '@/app/api/ready/route';
import type { HistoryItem, LiveDataResult, MidgardHealth, NetworkStats, NetworkStatus, Pool, SourceHealthSeverity } from '@/lib/types';

vi.mock('@/lib/api/midgard', () => ({
  default: {
    getHealth: vi.fn(),
    getNetworkData: vi.fn(),
    getPools: vi.fn(),
    getHistory: vi.fn(),
  },
}));

vi.mock('@/lib/api/thornode', () => ({
  default: {
    getNetworkStatus: vi.fn(),
  },
}));

function midgardHealth(severity: SourceHealthSeverity, reasons: string[] = []): LiveDataResult<MidgardHealth> {
  return {
    status: 'ok',
    checkedAt: '2026-07-02T00:00:00.000Z',
    source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
    data: {
      severity,
      reasons,
      checkedAt: '2026-07-02T00:00:00.000Z',
      database: true,
      inSync: true,
      lagBlocks: severity === 'warning' ? 4 : 1,
    },
  };
}

function networkStatus(overrides: Partial<NetworkStatus> = {}): NetworkStatus {
  return {
    state: 'operational',
    summary: 'Current-only live sources do not show global halt flags.',
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
    runePoolEnabled: null,
    wasmPaused: null,
    poolDepositPauseKeys: [],
    chainStatuses: [],
    activeControlKeys: [],
    activeChainKeys: [],
    activeEvidenceKeys: [],
    activePauseKeys: [],
    monitoredControls: [],
    invalidMimirKeys: [],
    sourceWarnings: [],
    ...overrides,
  };
}

function thornodeStatus(overrides: Partial<NetworkStatus> = {}): LiveDataResult<NetworkStatus> {
  return {
    status: 'ok',
    checkedAt: '2026-07-02T00:00:00.000Z',
    data: networkStatus(overrides),
  };
}

function networkData(): LiveDataResult<NetworkStats> {
  return {
    status: 'ok',
    checkedAt: '2026-07-02T00:00:00.000Z',
    source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
    data: {
      totalPooledRune: '1',
      totalReserve: '1',
      activeNodeCount: 1,
      standbyNodeCount: 0,
      bondingAPY: '0',
      liquidityAPY: '0',
      nextChurnHeight: 1,
      bondMetrics: {},
    },
  };
}

function poolsData(): LiveDataResult<Pool[]> {
  return {
    status: 'ok',
    checkedAt: '2026-07-02T00:00:00.000Z',
    source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
    data: [{
      asset: 'BTC.BTC',
      assetDepth: '1',
      runeDepth: '1',
      status: 'available',
    }],
  };
}

function earningsData(): LiveDataResult<HistoryItem[]> {
  return {
    status: 'ok',
    checkedAt: '2026-07-02T00:00:00.000Z',
    source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
    data: [{
      startTime: '1',
      endTime: '2',
      liquidityFees: '0',
      blockRewards: '0',
      earnings: '0',
      bondingEarnings: '0',
      liquidityEarnings: '0',
      avgNodeCount: '1',
      runePriceUSD: '1',
      pools: [],
    }],
  };
}

describe('/api/ready', () => {
  beforeEach(() => {
    vi.mocked(MidgardAPI.getHealth).mockReset();
    vi.mocked(MidgardAPI.getNetworkData).mockReset();
    vi.mocked(MidgardAPI.getPools).mockReset();
    vi.mocked(MidgardAPI.getHistory).mockReset();
    vi.mocked(ThornodeAPI.getNetworkStatus).mockReset();
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue(midgardHealth('ok'));
    vi.mocked(MidgardAPI.getNetworkData).mockResolvedValue(networkData());
    vi.mocked(MidgardAPI.getPools).mockResolvedValue(poolsData());
    vi.mocked(MidgardAPI.getHistory).mockResolvedValue(earningsData());
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus());
  });

  it('returns ready when Midgard and THORNode are both usable', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.status).toBe('ready');
    expect(body.ready).toBe(true);
    expect(body.sources.midgard.visibleData.network.status).toBe('ok');
    expect(body.sources.midgard.visibleData.pools.status).toBe('ok');
    expect(body.sources.midgard.visibleData.earnings.status).toBe('ok');
    expect(body.sources.midgard.sourceWarnings).toEqual([]);
  });

  it('returns degraded when a source is unavailable', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue({
      status: 'degraded',
      checkedAt: '2026-07-02T00:00:00.000Z',
      error: 'Midgard source did not respond',
    });
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue({
      status: 'degraded',
      checkedAt: '2026-07-02T00:00:00.000Z',
      error: 'THORNode source did not respond',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.reasons).toEqual(['Midgard source did not respond', 'THORNode source did not respond']);
  });

  it('returns degraded when visible Midgard datasets are unusable even if health is ok', async () => {
    vi.mocked(MidgardAPI.getNetworkData).mockResolvedValue({
      status: 'degraded',
      checkedAt: '2026-07-02T00:00:00.000Z',
      error: 'Midgard network response could not be normalized',
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.ready).toBe(false);
    expect(body.sources.midgard.visibleData.network.status).toBe('degraded');
    expect(body.reasons).toEqual(['Midgard network response could not be normalized']);
  });

  it('returns degraded when visible Midgard pools are empty', async () => {
    vi.mocked(MidgardAPI.getPools).mockResolvedValue({
      ...poolsData(),
      data: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.sources.midgard.visibleData.pools.status).toBe('ok');
    expect(body.sources.midgard.visibleData.pools.error).toBe('Midgard pools data did not include any available pools.');
    expect(body.reasons).toEqual(['Midgard pools data did not include any available pools.']);
  });

  it('returns degraded when visible Midgard earnings intervals are empty', async () => {
    vi.mocked(MidgardAPI.getHistory).mockResolvedValue({
      ...earningsData(),
      data: [],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.sources.midgard.visibleData.earnings.status).toBe('ok');
    expect(body.sources.midgard.visibleData.earnings.error).toBe('Midgard earnings history did not include any intervals.');
    expect(body.reasons).toEqual(['Midgard earnings history did not include any intervals.']);
  });

  it('returns structured degraded readiness when a client throws unexpectedly', async () => {
    vi.mocked(MidgardAPI.getNetworkData).mockRejectedValue(new Error('boom'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.sources.midgard.visibleData.network.status).toBe('degraded');
    expect(body.reasons).toEqual(['Midgard network data readiness check failed: boom']);
  });

  it('returns degraded when Midgard health omits database or sync evidence', async () => {
    const okHealth = midgardHealth('ok');
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue({
      ...okHealth,
      data: {
        ...okHealth.data!,
        database: undefined,
        inSync: undefined,
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ready).toBe(false);
    expect(body.sources.midgard.sourceWarnings).toEqual([
      'Midgard health did not include database status.',
      'Midgard health did not include sync status.',
    ]);
    expect(body.reasons).toEqual([
      'Midgard health did not include database status.',
      'Midgard health did not include sync status.',
    ]);
  });

  it('returns degraded when THORNode source warnings are present', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue(midgardHealth('ok'));
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus({
      invalidMimirKeys: ['HALTTRADING'],
      sourceWarnings: ['1 monitored Mimir key could not be parsed.'],
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.ready).toBe(false);
    expect(body.sources.thornode.invalidMimirKeys).toEqual(['HALTTRADING']);
    expect(body.sources.thornode.sourceWarnings).toEqual(['1 monitored Mimir key could not be parsed.']);
    expect(body.reasons).toEqual(['1 monitored Mimir key could not be parsed.']);
  });

  it('keeps Midgard warning severity ready', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue(midgardHealth('warning', ['Midgard lag is 4 blocks.']));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.ready).toBe(true);
    expect(body.reasons).toEqual([]);
  });

  it('returns degraded when Midgard lag is unavailable', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue(midgardHealth('unknown', ['Midgard lag unavailable.']));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.ready).toBe(false);
    expect(body.reasons).toEqual(['Midgard lag unavailable.']);
  });

  it('returns degraded when THORNode lastblock is behind Midgard latest height', async () => {
    const okHealth = midgardHealth('ok');
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue({
      ...okHealth,
      data: {
        ...okHealth.data!,
        latestHeight: 150,
      },
    });
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus({
      thorchainHeight: 100,
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.sources.thornode.heightLagBlocks).toBe(50);
    expect(body.sources.midgard.heightLagBlocks).toBe(0);
    expect(body.sources.thornode.sourceWarnings).toEqual(['THORNode lastblock is 50 blocks behind Midgard latest height.']);
    expect(body.reasons).toEqual(['THORNode lastblock is 50 blocks behind Midgard latest height.']);
  });

  it('returns degraded when Midgard latest height is behind THORNode lastblock', async () => {
    const okHealth = midgardHealth('ok');
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue({
      ...okHealth,
      data: {
        ...okHealth.data!,
        latestHeight: 100,
      },
    });
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus({
      thorchainHeight: 150,
    }));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.sources.midgard.heightLagBlocks).toBe(50);
    expect(body.sources.thornode.heightLagBlocks).toBe(0);
    expect(body.sources.midgard.sourceWarnings).toEqual(['Midgard latest height is 50 blocks behind THORNode lastblock.']);
    expect(body.reasons).toEqual(['Midgard latest height is 50 blocks behind THORNode lastblock.']);
  });

  it('returns degraded when Midgard health and visible datasets use different providers', async () => {
    vi.mocked(MidgardAPI.getNetworkData).mockResolvedValue({
      ...networkData(),
      source: { label: 'Liquify Midgard', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.sources.midgard.sourceWarnings).toEqual([
      'Midgard health source Midgard differs from network data source Liquify Midgard.',
    ]);
    expect(body.reasons).toEqual([
      'Midgard health source Midgard differs from network data source Liquify Midgard.',
    ]);
  });
});
