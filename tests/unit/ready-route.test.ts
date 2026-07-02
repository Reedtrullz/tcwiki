import { beforeEach, describe, expect, it, vi } from 'vitest';
import MidgardAPI from '@/lib/api/midgard';
import ThornodeAPI from '@/lib/api/thornode';
import { GET } from '@/app/api/ready/route';
import type { LiveDataResult, MidgardHealth, NetworkStatus, SourceHealthSeverity } from '@/lib/types';

vi.mock('@/lib/api/midgard', () => ({
  default: {
    getHealth: vi.fn(),
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

describe('/api/ready', () => {
  beforeEach(() => {
    vi.mocked(MidgardAPI.getHealth).mockReset();
    vi.mocked(ThornodeAPI.getNetworkStatus).mockReset();
  });

  it('returns ready when Midgard and THORNode are both usable', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue({
      status: 'ok',
      checkedAt: '2026-07-02T00:00:00.000Z',
      source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
      data: {
        severity: 'ok',
        reasons: [],
        checkedAt: '2026-07-02T00:00:00.000Z',
        lagBlocks: 1,
      },
    });
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue({
      status: 'ok',
      checkedAt: '2026-07-02T00:00:00.000Z',
      data: {
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
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.status).toBe('ready');
    expect(body.ready).toBe(true);
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
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ready');
    expect(body.ready).toBe(true);
    expect(body.reasons).toEqual([]);
  });

  it('returns degraded when Midgard lag is unavailable', async () => {
    vi.mocked(MidgardAPI.getHealth).mockResolvedValue(midgardHealth('unknown', ['Midgard lag unavailable.']));
    vi.mocked(ThornodeAPI.getNetworkStatus).mockResolvedValue(thornodeStatus());

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.ready).toBe(false);
    expect(body.reasons).toEqual(['Midgard lag unavailable.']);
  });
});
