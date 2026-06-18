import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

describe('source and freshness labels', () => {
  it('renders confidence labels and source links', () => {
    const html = renderToStaticMarkup(
      <FreshnessMeta
        freshness={{ checkedAt: '2026-06-18', confidence: 'official' }}
        sources={[{ label: 'THORChain Docs', url: 'https://docs.thorchain.org' }]}
      />
    );

    expect(html).toContain('Official source');
    expect(html).toContain('Checked 2026-06-18');
    expect(html).toContain('THORChain Docs');
  });

  it('renders degraded and current-only live source states', () => {
    const current = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
        }}
      />
    );
    const degraded = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'degraded',
          checkedAt: '2026-06-18T00:00:00.000Z',
          error: 'Source did not respond',
        }}
      />
    );

    expect(current).toContain('Current-only');
    expect(current).toContain('Midgard');
    expect(degraded).toContain('Degraded');
  });
});
