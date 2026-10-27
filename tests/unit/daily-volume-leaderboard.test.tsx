import { afterEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DailyVolumeLeaderboard } from '@/components/features/DailyVolumeLeaderboard';
import { useDailyVolume } from '@/lib/hooks/useMidgard';
import { liveOk } from '@/lib/trust';

vi.mock('@/lib/hooks/useMidgard', () => ({ useDailyVolume: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });

it('renders network and selected-pool totals separately, including zero and failed source coverage', () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-02T12:00:00Z'));
  const rows = [{ startTime: '1790812800', endTime: '1790899200', totalVolume: '0', totalVolumeUSD: '0' }];
  const zero = liveOk(rows, { label: 'Pool provider', url: 'https://pool.test/v2/history/swaps' }, '2026-10-02T12:00:00Z');
  const failed = { status: 'degraded' as const, error: 'Offline', checkedAt: '2026-10-02T11:00:00Z' };
  const network = liveOk([{ ...rows[0], totalVolumeUSD: '100000' }], { label: 'Network provider', url: 'https://network.test/v2/history/swaps' }, '2026-10-02T11:59:00Z');
  vi.mocked(useDailyVolume).mockReturnValue({ data: [zero, failed, failed, failed, failed, failed], networkResult: network, result: undefined, error: undefined, isLoading: false, refresh: () => undefined, isRefreshing: false, isDegraded: true });
  const html = renderToStaticMarkup(<DailyVolumeLeaderboard />);
  expect(html).toContain('Network daily volume');
  expect(html).toContain('$1.0K');
  expect(html).toContain('Selected-pool subtotal: $0');
  expect(html).toContain('1/6 included');
  expect(html).toContain('History failed');
  expect(html).toContain('Pool provider');
  expect(html).toContain('Network provider');
  expect(html).toContain('Share of selected subtotal');
});
