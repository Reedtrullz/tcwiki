import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useLivePresentation } from '@/lib/hooks/useLivePresentation';
import { assessLivePresentation } from '@/lib/live-presentation';
import { liveOk } from '@/lib/trust';
import { reassessThornodeResult } from '@/lib/api/thornode';
import type { NetworkStatus } from '@/lib/types';
const now = Date.parse('2026-10-03T00:00:00Z');
const source = { label: 'Receipt provider', url: 'https://example.com/network' };
const options = { kind: 'aggregate' as const };
describe('browser live evidence presentation', () => {
  it('keeps values, provider and observation time after a failed refresh', () => {
    const result = { ...liveOk({ total: 0 }, source), checkedAt: new Date(now).toISOString() };
    const assessed = assessLivePresentation(result, 'offline', false, options, now);
    expect(assessed).toMatchObject({ status: 'degraded', data: { total: 0 }, source, checkedAt: result.checkedAt, presentation: { state: 'last-good' } });
    expect(result.status).toBe('ok');
  });
  it('labels missed aggregate refresh opportunities without discarding the sample', () => {
    const result = { ...liveOk({ total: 4 }, source), checkedAt: new Date(now).toISOString() };
    expect(assessLivePresentation(result, undefined, true, options, now).presentation?.state).toBe('refreshing');
    expect(assessLivePresentation(result, undefined, false, options, now + 120001)).toMatchObject({ data: { total: 4 }, presentation: { state: 'stale' }, status: 'degraded' });
    expect(assessLivePresentation(result, undefined, false, options, now + 1000).presentation?.state).toBe('current');
  });
  it('preserves historical interval meaning regardless of receipt age', () => {
    const result = { ...liveOk([{ startTime: '1', endTime: '2' }], source), checkedAt: new Date(now).toISOString() };
    expect(assessLivePresentation(result, undefined, false, { kind: 'historical' }, now + 86400000)).toMatchObject({ status: 'ok', presentation: { state: 'historical' } });
  });
  it('treats missing results and invalid aggregate receipt times as unavailable evidence', () => {
    expect(assessLivePresentation(undefined, 'offline', false, options, now).presentation?.state).toBe('unavailable');
    const result = { ...liveOk({ total: 0 }, source), checkedAt: 'invalid' };
    expect(assessLivePresentation(result, undefined, false, options, now).presentation?.state).toBe('stale');
  });
  it('reuses block age assessment and marks failed operational reads conservatively', () => {
    const data = { state: 'operational', sourceWarnings: [], sourceWarningDetails: [], thorchainBlockTime: new Date(now).toISOString() } as unknown as NetworkStatus;
    const result = { ...liveOk(data, source), checkedAt: new Date(now).toISOString(), collection: { startedAt: new Date(now).toISOString(), completedAt: new Date(now).toISOString(), durationMs: 0 } };
    const assessed = assessLivePresentation(result, undefined, false, { kind: 'operational', reassess: reassessThornodeResult }, now + 31000);
    expect(assessed.presentation?.state).toBe('stale');
    expect(assessed.data?.sourceWarningDetails).toEqual(expect.arrayContaining([expect.objectContaining({ category: 'freshness', severity: 'critical' })]));
    const failed = assessLivePresentation(result, 'offline', false, { kind: 'operational', reassess: reassessThornodeResult }, now);
    expect(failed.data?.state).toBe('degraded');
    expect(failed.data?.sourceWarningDetails).toEqual(expect.arrayContaining([expect.objectContaining({ keys: ['browser-refresh'], severity: 'critical' })]));
  });
});

// Node 22 and Workers expose navigator without browser connectivity fields.
// This reproduction catches server-only offline markup and hydration drift.
it('does not infer browser connectivity from a server navigator', () => {
  vi.stubGlobal('navigator', { userAgent: 'Node.js/22' });
  function Probe() {
    const live = useLivePresentation(undefined, undefined, true, false, options, () => undefined);
    return createElement('span', null, live.result?.presentation?.state ?? 'Loading');
  }
  try { expect(renderToStaticMarkup(createElement(Probe))).toBe('<span>Loading</span>'); }
  finally { vi.unstubAllGlobals(); }
});
