import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EcosystemFilterList } from '@/components/features/EcosystemFilterList';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { RelatedChecks } from '@/components/features/RelatedChecks';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { GlossaryExplorer } from '@/components/features/GlossaryExplorer';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS, SECURITY_INCIDENT_RECORDS } from '@/lib/data/static';
import { getContentEntry } from '@/lib/content/registry';

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

  it('renders ecosystem confidence as user-facing labels', () => {
    const html = renderToStaticMarkup(
      <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS.slice(0, 2)} chainRecords={CHAIN_RECORDS.slice(0, 2)} />
    );

    expect(html).toContain('Curated');
    expect(html).not.toContain('>curated<');
  });

  it('renders ecosystem interface safety guidance without treating listings as endorsements', () => {
    const html = renderToStaticMarkup(
      <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS.slice(0, 2)} chainRecords={CHAIN_RECORDS.slice(0, 2)} />
    );

    expect(html).toContain('Listed Active');
    expect(html).toContain('Use for');
    expect(html).toContain('Check before use');
    expect(html).toContain('Review quoted fees, route, slippage, recipient address, and wallet approvals');
    expect(html).toContain('Confirm the current release, download source, wallet permissions, and device security');
    expect(html).toContain('Live status');
    expect(html).toContain('Source map');
    expect(html).toContain('Check live diagnostics');
    expect(html).toContain('Live inbound status must be checked before describing BTC swaps as open.');
  });

  it('renders the glossary term finder with source-aware term cards', () => {
    const terms = GLOSSARY_TERMS.slice(0, 3).map((term) => ({
      ...term,
      relatedLinks: term.relatedHrefs.map((href) => ({ href, label: href })),
    }));
    const html = renderToStaticMarkup(<GlossaryExplorer terms={terms} />);

    expect(html).toContain('Term Finder');
    expect(html).toContain('Filter terms');
    expect(html).toContain('All terms');
    expect(html).toContain('Asgard vault');
    expect(html).toContain('Bifrost');
    expect(html).toContain('Checked');
    expect(html).not.toContain('No glossary terms match');
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

  it('renders incident-level freshness overrides and source retrieval dates', () => {
    const gg20Incident = SECURITY_INCIDENT_RECORDS.find((record) => record.data.id === 'gg20-vault-exploit-2026');

    expect(gg20Incident).toBeDefined();
    if (!gg20Incident) {
      throw new Error('Expected GG20 incident record to exist');
    }

    const html = renderToStaticMarkup(
      <FreshnessMeta
        freshness={gg20Incident.freshness}
        sources={gg20Incident.sources}
        compact
      />
    );

    expect(html).toContain('Checked 2026-07-04');
    expect(html).toContain('Review due 2026-08-04');
    expect(html).toContain('Retrieved 2026-07-04');
    expect(html).toContain('Official root-cause report for the May 2026 GG20/TSS vault exploit.');
  });

  it('renders route-level source posture from registry metadata without hiding non-claims', () => {
    const html = renderToStaticMarkup(
      <RouteSourcePosture
        entry={getContentEntry('protocol')}
        useFor={['Architecture concepts and swap lifecycle context.']}
        verifyBeforeClaiming={['Current halt, signing, inbound-address, or Mimir state.']}
      />
    );

    expect(html).toContain('Page Source Posture');
    expect(html).toContain('Use This Page For');
    expect(html).toContain('Verify Elsewhere Before Claiming');
    expect(html).toContain('Architecture concepts and swap lifecycle context.');
    expect(html).toContain('Current halt, signing, inbound-address, or Mimir state.');
    expect(html).toContain('Curated');
    expect(html).toContain('Checked 2026-07-05');
    expect(html).toContain('Review due 2026-08-05');
    expect(html).toContain('THORChain Docs');
    expect(html).toContain('+6 sources');
  });

  it('renders related checks as source-conscious internal links', () => {
    const html = renderToStaticMarkup(
      <RelatedChecks
        checks={[
          {
            label: 'Source map',
            href: '/docs#current-protocol-state',
            badge: 'proof boundary',
            description: 'Check what this source can prove.',
          },
          {
            label: 'Pause search',
            href: '/search?q=Mimir%20halt&filter=task',
            badge: 'search',
            description: 'Find halt-key task results.',
          },
        ]}
      />
    );

    expect(html).toContain('Related Checks');
    expect(html).toContain('Use these before turning current dashboard values into a broader claim.');
    expect(html).toContain('current-only');
    expect(html).toContain('href="/docs#current-protocol-state"');
    expect(html).toContain('href="/search?q=Mimir%20halt&amp;filter=task"');
    expect(html).toContain('proof boundary');
    expect(html).toContain('Find halt-key task results.');

    const articleHtml = renderToStaticMarkup(
      <RelatedChecks
        title="Continue From Here"
        badgeLabel="claim path"
        description="Use these links to move from concept pages to proof boundaries."
        checks={[
          {
            label: 'New to THORChain',
            href: '/deep-dives#deep-dive-path-new-to-thorchain',
            badge: 'path',
            description: 'Read the guided sequence.',
          },
        ]}
      />
    );

    expect(articleHtml).toContain('Continue From Here');
    expect(articleHtml).toContain('claim path');
    expect(articleHtml).not.toContain('current-only');
  });

  it('renders reader-path context on direct deep-dive articles', () => {
    const html = renderToStaticMarkup(
      <DeepDiveShell entryId="deep-dive-tss" editPath="content/deep-dives/tss.mdx">
        <h1>Threshold Signatures</h1>
      </DeepDiveShell>
    );

    expect(html).toContain('Reader Paths For This Article');
    expect(html).toContain('Network Security');
    expect(html).toContain('Historical Recovery');
    expect(html).toContain('Verify Before Claiming');
    expect(html).toContain('Current signing, observation, trading, or chain-specific Mimir state.');
    expect(html).toContain('href="/deep-dives#deep-dive-path-network-security"');
    expect(html).toContain('href="/network#network-diagnostics"');
    expect(html).toContain('Reviewed 2026-07-04');
  });

  it('preserves historical posture for TCY route metadata', () => {
    const html = renderToStaticMarkup(
      <RouteSourcePosture
        entry={getContentEntry('tcy')}
        useFor={['Historical THORFi unwind and TCY recovery framing.']}
        verifyBeforeClaiming={['Current TCY operations, balances, or live claims state.']}
      />
    );

    expect(html).toContain('Historical');
    expect(html).toContain('Checked 2026-07-05');
    expect(html).toContain('Review due 2026-08-05');
    expect(html).toContain('Archived Savers and Lending docs');
    expect(html).toContain('RUNE and TCY tokenomics');
    expect(html).toContain('THORChain Exploit Report #1');
    expect(html).toContain('+3 sources');
    expect(html).toContain('Historical THORFi unwind and TCY recovery framing.');
    expect(html).toContain('Current TCY operations, balances, or live claims state.');
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

  it('keeps secondary live endpoint sources behind a compact disclosure', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
          sources: [
            { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
            { label: 'THORNode Mimir', url: 'https://thornode.thorchain.network/thorchain/mimir?height=100' },
            { label: 'THORNode lastblock', url: 'https://thornode.thorchain.network/thorchain/lastblock?height=100' },
          ],
        }}
      />
    );

    expect(html).toContain('THORNode');
    expect(html).toContain('+2 endpoint reads');
    expect(html).toContain('THORNode Mimir');
    expect(html).toContain('height=100');
    expect(html).toContain('<details');
    expect(html).toContain('break-words');
    expect(html).not.toContain('role="list"');
    expect(html).not.toContain('whitespace-nowrap');
  });

  it('renders source-warning badge for warning-bearing live payloads without dumping raw warnings', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'THORNode', url: 'https://thornode.thorchain.network/thorchain' },
          data: {
            sourceWarnings: ['Unknown operation-like Mimir keys need review: VERY-LONG-KEY.'],
          },
        }}
      />
    );

    expect(html).toContain('Source warning');
    expect(html).toContain('THORNode');
    expect(html).not.toContain('Current-only');
    expect(html).not.toContain('VERY-LONG-KEY');
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

    expect(html).toContain('Source degraded');
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
    expect(html).toContain('Source degraded');
    expect(html).toContain('Fresh health result failed');
    expect(html).not.toContain('Current-only');
    expect(html).not.toContain('Stale Midgard');
    expect(html).not.toContain('Stale lag should not render.');
    expect(html).not.toContain('4 block lag');
  });

  it('warns without applying a different provider health status to the metric badge', () => {
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'Liquify Midgard network', url: 'https://gateway.liquify.com/chain/thorchain_midgard/v2/network' },
        }}
        healthResult={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          source: { label: 'THORChain Midgard health', url: 'https://midgard.thorchain.network/v2/health' },
          data: {
            provider: 'THORChain Midgard health',
            severity: 'degraded',
            reasons: ['Different provider lag.'],
            checkedAt: '2026-06-18T00:00:00.000Z',
          },
        }}
      />
    );

    expect(html).toContain('Source warning');
    expect(html).toContain('Health source differs');
    expect(html).toContain('Metric via Liquify Midgard network');
    expect(html).toContain('health via THORChain Midgard health');
    expect(html).not.toContain('Source degraded');
    expect(html).not.toContain('Current-only');
    expect(html).not.toContain('Different provider lag.');
  });
});
