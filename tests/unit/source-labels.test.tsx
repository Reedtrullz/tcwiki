import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';

describe('source and freshness labels', () => {
  it('renders confidence labels and source links', () => {
    const html = renderToStaticMarkup(
      <FreshnessMeta
        freshness={{ checkedAt: '2026-06-18', confidence: 'official' }}
        sources={[
          { label: 'THORChain Docs', url: 'https://docs.thorchain.org' },
          { label: 'THORChain Dev Docs', url: 'https://dev.thorchain.org' },
        ]}
      />
    );

    expect(html).toContain('Official source');
    expect(html).toContain('Checked 2026-06-18');
    expect(html).toContain('THORChain Docs');
    expect(html).toContain('+1 source');
    expect(html).toContain('THORChain Dev Docs');
  });

  it('renders source notes, retrieved timestamps, and reviewer metadata', () => {
    const html = renderToStaticMarkup(
      <FreshnessMeta
        freshness={{
          checkedAt: '2026-06-18',
          confidence: 'curated',
          reviewedBy: 'Protocol review desk',
        }}
        sources={[
          {
            label: 'THORNode inbound_addresses',
            url: 'https://thornode.thorchain.network/thorchain/inbound_addresses',
            retrievedAt: '2026-06-18T10:00:00.000Z',
            notes: 'Use as a current-only check for live chain availability and pause state.',
          },
          {
            label: 'THORChain Docs',
            url: 'https://docs.thorchain.org',
            notes: 'Narrative source used as a cross-check, not live availability proof.',
          },
        ]}
        compact
      />
    );

    expect(html).toContain('Reviewed by Protocol review desk');
    expect(html).toContain('Retrieved 2026-06-18T10:00:00.000Z');
    expect(html).toContain('Use as a current-only check for live chain availability and pause state.');
    expect(html).toContain('Narrative source used as a cross-check, not live availability proof.');
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

  it('renders Midgard source health alongside live source metadata', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'Midgard', url: 'https://midgard.thorchain.network/v2' },
        }}
        health={{
          provider: 'Midgard',
          severity: 'warning',
          reasons: ['Midgard lag is 4 blocks.'],
          checkedAt: '2026-06-18T00:00:00.000Z',
          lagBlocks: 4,
        }}
      />
    );

    expect(html).toContain('Midgard warning');
    expect(html).toContain('4 block lag');
    expect(html).toContain('Midgard lag is 4 blocks.');
  });

  it('renders unavailable Midgard health when the metric source itself loaded', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'Midgard network', url: 'https://midgard.thorchain.network/v2/network' },
        }}
        healthResult={{
          status: 'degraded',
          checkedAt: '2026-06-18T00:00:00.000Z',
          error: 'Midgard health did not load',
        }}
      />
    );

    expect(html).toContain('Current-only');
    expect(html).toContain('Midgard network');
    expect(html).toContain('Midgard health degraded');
    expect(html).toContain('Lag unavailable');
    expect(html).toContain('Midgard health did not load');
  });

  it('treats full Midgard health results as authoritative over legacy health props', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'Midgard network', url: 'https://midgard.thorchain.network/v2/network' },
        }}
        health={{
          provider: 'Stale Midgard',
          severity: 'warning',
          reasons: ['Stale lag should not render.'],
          checkedAt: '2026-06-18T00:00:00.000Z',
          lagBlocks: 4,
        }}
        healthResult={{
          status: 'degraded',
          checkedAt: '2026-06-18T00:00:00.000Z',
          error: 'Fresh health result failed',
        }}
      />
    );

    expect(html).toContain('Midgard health degraded');
    expect(html).toContain('Fresh health result failed');
    expect(html).not.toContain('Stale Midgard');
    expect(html).not.toContain('Stale lag should not render.');
    expect(html).not.toContain('4 block lag');
  });
});
