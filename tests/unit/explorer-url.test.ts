import { afterEach, describe, expect, it, vi } from 'vitest';
import { mergeExplorerUrl, replaceExplorerUrl } from '@/lib/explorer-url';
import { parseDynamicFeeRecordFilters } from '@/lib/data/dynamic-fees-helpers';

afterEach(() => vi.unstubAllGlobals());

describe('explorer URL contract', () => {
  it('writes only owned keys against current location and retains reader fragment and unrelated edits', () => {
    expect(mergeExplorerUrl('https://wiki.test/stats?utm=a&pool_period=30d#reader', '/stats?utm=stale&pool_q=BTC&pool_sort=volume#available-pools', ['pool_q', 'pool_sort']))
      .toBe('/stats?utm=a&pool_period=30d&pool_q=BTC&pool_sort=volume#reader');
  });
  it('removes reset owned keys and refuses cross-route or external destinations', () => {
    expect(mergeExplorerUrl('https://wiki.test/docs?source_q=x&keep=1', '/docs#source-map-chooser', ['source_q'])).toBe('/docs?keep=1#source-map-chooser');
    expect(() => mergeExplorerUrl('https://wiki.test/docs', 'https://evil.test/docs', ['q'])).toThrow();
    expect(() => mergeExplorerUrl('https://wiki.test/docs', '/network', ['q'])).toThrow();
  });
  it('uses the external native-history form and emits an editing event once per actual change', () => {
    const state = { framework: 'preserved' }, replaceState = vi.fn(), dispatchEvent = vi.fn();
    vi.stubGlobal('window', { location: { href: 'https://wiki.test/docs?keep=1#reader' }, history: { state, replaceState }, dispatchEvent });
    replaceExplorerUrl('/docs?source_q=dynamic', ['source_q']);
    expect(replaceState).toHaveBeenCalledWith(null, '', '/docs?keep=1&source_q=dynamic#reader');
    expect(dispatchEvent).toHaveBeenCalledOnce();
    expect(dispatchEvent.mock.calls[0][0].type).toBe('wiki-explorer-query-change');
    replaceExplorerUrl('/docs?keep=stale', ['source_q']);
    expect(replaceState).toHaveBeenCalledTimes(1);
  });
  it('validates namespaced fee values without losing whitespace or valid bounds filters', () => {
    expect(parseDynamicFeeRecordFilters(new URLSearchParams('fee_q=BTC+ETH+&fee_whitelist=monitor&fee_bps=above&fee_current=with-current')))
      .toEqual({ query: 'BTC ETH ', whitelist: 'monitor', bps: 'above', current: 'with-current' });
    expect(parseDynamicFeeRecordFilters(new URLSearchParams('q=unrelated&fee_whitelist=bad&fee_bps=bad&fee_current=bad')))
      .toEqual({ query: '', whitelist: 'all', bps: 'all', current: 'all' });
  });
});
