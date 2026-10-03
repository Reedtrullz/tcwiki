import { isValidElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import NetworkPage from '@/app/network/page';
import ThornodeAPI, { deriveNetworkStatus } from '@/lib/api/thornode';
import { formatEvidenceTimestamp } from '@/lib/utils';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import type { LiveDataResult, NetworkStatus } from '@/lib/types';

vi.mock('next/server', () => ({ connection: vi.fn() }));
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

function sample(blockTime: string): LiveDataResult<NetworkStatus> {
  return { status: 'ok', checkedAt: '2026-10-03T05:00:00.000Z', source: { label: 'Fixture THORNode', url: 'https://thornode.thorchain.network/thorchain/mimir?height=100' },
    collection: { startedAt: '2026-10-03T04:59:59.000Z', completedAt: '2026-10-03T05:00:00.000Z', durationMs: 1000 },
    data: { ...deriveNetworkStatus({ HALTTRADING: 0 }, [{ chain: 'BTC', halted: false, global_trading_paused: false, chain_trading_paused: false, chain_lp_actions_paused: false }], '3.20.3', 100), thorchainBlockTime: blockTime } };
}

describe('one bounded server operational seed', () => {
  it('renders evidence receipt time in explicit UTC without server-local date formatting', () => {
    vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(() => { throw new Error('Locale-dependent receipt'); });
    expect(formatEvidenceTimestamp('2026-10-03T07:00:00+02:00')).toBe('2026-10-03T05:00:00.000Z');
    expect(formatEvidenceTimestamp('invalid')).toBe('Unavailable');
    expect(renderToStaticMarkup(<LiveSourceMeta result={sample('2026-10-03T05:00:00.000Z')} />)).toContain('Checked 2026-10-03T05:00:00.000Z');
  });
  it('collects once and seeds the existing network hook with source/time and the app deadline', async () => {
    vi.useFakeTimers(); vi.setSystemTime('2026-10-03T05:00:01.000Z');
    const initial = sample('2026-10-03T05:00:00.000Z');
    const collect = vi.spyOn(ThornodeAPI, 'getNetworkStatus').mockResolvedValue(initial);
    const element = await NetworkPage();
    expect(collect).toHaveBeenCalledOnce();
    const context = collect.mock.calls[0][0];
    expect(context?.deadlineAtMs).toBeGreaterThan(Date.now());
    expect(context?.deadlineAtMs).toBeLessThanOrEqual(Date.now() + 12000);
    expect(isValidElement<{ initialStatusResult: LiveDataResult<NetworkStatus> }>(element)).toBe(true);
    if (!isValidElement<{ initialStatusResult: LiveDataResult<NetworkStatus> }>(element)) throw new Error('Expected network client');
    expect(element.props.initialStatusResult).toMatchObject({ source: initial.source, checkedAt: initial.checkedAt, assessedAt: '2026-10-03T05:00:01.000Z', data: { thorchainBlockAgeSeconds: 1 } });
  });
  it('reassesses a retained old seed before render rather than promoting it to current', async () => {
    vi.useFakeTimers(); vi.setSystemTime('2026-10-03T05:00:45.000Z');
    vi.spyOn(ThornodeAPI, 'getNetworkStatus').mockResolvedValue(sample('2026-10-03T05:00:00.000Z'));
    const element = await NetworkPage();
    if (!isValidElement<{ initialStatusResult: LiveDataResult<NetworkStatus> }>(element)) throw new Error('Expected network client');
    expect(element.props.initialStatusResult.data?.sourceWarningDetails?.some(detail => detail.category === 'freshness')).toBe(true);
    expect(element.props.initialStatusResult.data?.state).not.toBe('operational');
    expect(element.props.initialStatusResult.checkedAt).toBe('2026-10-03T05:00:00.000Z');
  });
  it('returns source-qualified unavailable context and a native no-script path when collection throws', async () => {
    vi.spyOn(ThornodeAPI, 'getNetworkStatus').mockRejectedValue(new Error('private unexpected exception'));
    const element = await NetworkPage();
    if (!isValidElement<{ initialStatusResult: LiveDataResult<NetworkStatus>; children: React.ReactNode }>(element)) throw new Error('Expected network client');
    expect(element.props.initialStatusResult.status).toBe('degraded');
    expect(element.props.initialStatusResult.data).toBeUndefined();
    const html = renderToStaticMarkup(element.props.children);
    expect(html).toContain('<noscript>');
    expect(html).toContain('action="/search"');
    expect(html).toContain('https://thornode.thorchain.network/thorchain');
    expect(html).not.toContain('private unexpected exception');
  });
});
