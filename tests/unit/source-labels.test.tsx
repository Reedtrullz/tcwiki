import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EcosystemFilterList } from '@/components/features/EcosystemFilterList';
import { DeepDiveShell } from '@/components/features/DeepDiveShell';
import { FreshnessMeta } from '@/components/ui/FreshnessMeta';
import { LiveSourceMeta } from '@/components/ui/LiveSourceMeta';
import { RelatedChecks } from '@/components/features/RelatedChecks';
import { RouteSourcePosture } from '@/components/features/RouteSourcePosture';
import { GlossaryExplorer } from '@/components/features/GlossaryExplorer';
import { ProtocolChainFinder } from '@/components/features/ProtocolChainFinder';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import { CHAIN_RECORDS, ECOSYSTEM_PROJECT_RECORDS, getTokenomicsRecord, GOVERNANCE_PROPOSAL_RECORDS, PROTOCOL_MILESTONE_RECORDS, SECURITY_INCIDENT_RECORDS, SOURCE_MAP_SECTION_RECORDS } from '@/lib/data/static';
import { CONTENT_ENTRIES, DEEP_DIVE_READER_PATHS, SEARCH_PAGE_ENTRY, TASK_INTENT_GUIDES, getContentEntry } from '@/lib/content/registry';
import { continuousLiquidityPoolsSource, cosmWasmSource, liquidityProvidersSource, liveInboundSource } from '@/lib/sources';

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-route',
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('source and freshness labels', () => {
  it('keeps source retrieval and governance review freshness independently dated', () => {
    expect(liveInboundSource.retrievedAt).toBe('2026-07-04');
    expect(GOVERNANCE_PROPOSAL_RECORDS.find((record) => record.data.id === 'mimir-operational-halts')?.freshness).toEqual(
      expect.objectContaining({ checkedAt: '2026-07-13', nextReviewDue: '2026-08-13' })
    );
  });

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

    expect(html).toContain('Directory filters');
    expect(html).toContain('aria-atomic="true"');
    expect(html).toContain('Catalog listed');
    expect(html).toContain('Directory posture');
    expect(html).toContain('Directory posture describes this wiki record only');
    expect(html).not.toContain('Listed Active');
    expect(html).not.toContain('All statuses');
    expect(html).toContain('Use filters to find a surface to inspect');
    expect(html).toContain('This listing can indicate');
    expect(html).toContain('Still verify');
    expect(html).toContain('Not a safety proof');
    expect(html).toContain('Swap surface');
    expect(html).toContain('Wallet surface');
    expect(html).toContain('Use for');
    expect(html).toContain('Check before use');
    expect(html).toContain('Review quoted fees, route, slippage, recipient address, and wallet approvals');
    expect(html).toContain('Confirm the current release, download source, wallet permissions, and device security');
    expect(html).toContain('type="search"');
    expect(html).toContain('placeholder="Project, chain, route, wallet..."');
    expect(html).toContain('Check protocol route');
    expect(html).toContain('Open diagnostics');
    expect(html).toContain('Read source map');
    expect(html).toContain('Check live diagnostics');
    expect(html).toContain('Live inbound status must be checked before describing BTC swaps as open.');
  });

  it('surfaces ecosystem records that need source review as an explicit warning', () => {
    const viewblockRecord = ECOSYSTEM_PROJECT_RECORDS.find((record) => record.data.id === 'viewblock');

    expect(viewblockRecord).toBeDefined();
    if (!viewblockRecord) {
      return;
    }

    const html = renderToStaticMarkup(
      <EcosystemFilterList projectRecords={[viewblockRecord]} chainRecords={CHAIN_RECORDS.slice(0, 1)} />
    );

    expect(html).toContain('Needs source review');
    expect(html).toContain('Needs review');
    expect(html).toContain('Direct source refresh needs review');
    expect(html).toContain('Confirm the direct explorer page clears its anti-bot challenge');
    expect(html).toContain('Review before relying on this entry');
    expect(html).toContain('Review source posture');
    expect(html).toContain('Open unreviewed external source');
    expect(html).toContain('ViewBlock THORChain');
    expect(html).not.toContain('Open external project');
    expect(html).not.toContain('Check sample route');
    expect(html).not.toContain('Listed Needs review');
    expect(html).not.toContain('Status: Needs review');
    expect(html).not.toContain('All statuses');
  });

  it('keeps ecosystem filter controls and source disclosures keyboard-visible', () => {
    const html = renderToStaticMarkup(
      <EcosystemFilterList projectRecords={ECOSYSTEM_PROJECT_RECORDS.slice(0, 2)} chainRecords={CHAIN_RECORDS.slice(0, 2)} />
    );

    expect(html).toMatch(/<select[^>]+focus:ring-1 focus:ring-accent\/50/);
    expect(html).toMatch(/<input[^>]+focus:ring-1 focus:ring-accent\/50/);
    expect(html).toMatch(/Open external project[\s\S]*focus-visible:ring-2 focus-visible:ring-accent\/60/);
    expect(html).toMatch(/Check protocol route[\s\S]*focus-visible:ring-2 focus-visible:ring-accent\/60/);
    expect(html).toMatch(/Show 1 additional source[\s\S]*focus-visible:ring-2 focus-visible:ring-accent\/60/);
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

  it('renders the protocol chain finder without turning catalog records into live availability', () => {
    const html = renderToStaticMarkup(
      <ProtocolChainFinder chainRecords={CHAIN_RECORDS.slice(0, 3)} catalogReviewedAt="2026-07-06" />
    );

    expect(html).toContain('Supported Chain Finder');
    expect(html).toContain('Showing 3 of 3 catalog chain records from the 2026-07-06 review.');
    expect(html).toContain('Find supported chains');
    expect(html).toContain('Address format');
    expect(html).toContain('Review notes');
    expect(html).toContain('Catalog Boundary');
    expect(html).toContain('Listed means this chain was present in the curated inbound-address catalog.');
    expect(html).toContain('It does not prove swaps, signing, LP actions, gas, or a route are open now.');
    expect(html).toContain('Check live state');
    expect(html).toContain('Check a route');
    expect(html).toContain('Live inbound status must be checked before describing BTC swaps as open.');
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
    expect(html).toContain('Source retrieved 2026-06-18T10:00:00.000Z');
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

    expect(html).toContain('Checked 2026-07-05');
    expect(html).toContain('Review due 2026-08-05');
    expect(html).toContain('Source retrieved 2026-07-04');
    expect(html).toContain('Official root-cause report for the May 2026 GG20/TSS vault exploit.');
  });

  it('renders route-level source posture from registry metadata without hiding non-claims', () => {
    const entry = getContentEntry('protocol');
    const html = renderToStaticMarkup(
      <RouteSourcePosture
        entry={entry}
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
    expect(html).toContain(`Checked ${entry.reviewedAt}`);
    expect(html).toContain(`Review due ${entry.nextReviewDue}`);
    expect(html).toContain('THORChain Docs');
    expect(html).toContain('Source retrieved 2026-07-05');
    expect(html).toContain('+6 sources');
  });

  it('resolves tokenomics page records by exact id and fails closed when missing', () => {
    expect(getTokenomicsRecord('rune-supply-framing').data.title).toBe('RUNE Supply Framing');
    expect(getTokenomicsRecord('tcy-recovery-context').data.title).toBe('TCY Recovery Context');
    expect(() => getTokenomicsRecord('missing-tokenomics-record')).toThrow('Missing tokenomics record for missing-tokenomics-record');
  });

  it('keeps visible route source posture backed by dated source-use metadata', () => {
    for (const entry of [...CONTENT_ENTRIES, SEARCH_PAGE_ENTRY]) {
      for (const source of entry.sources) {
        expect(source.retrievedAt, `${entry.id} / ${source.label}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  it('keeps glossary source posture backed by shared dated source metadata', () => {
    for (const term of GLOSSARY_TERMS) {
      for (const source of term.sources) {
        expect(source.retrievedAt, `${term.term} / ${source.label}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }

    expect(GLOSSARY_TERMS.find((term) => term.term === 'Impermanent loss')?.sources).toEqual(
      expect.arrayContaining([liquidityProvidersSource, continuousLiquidityPoolsSource])
    );
    expect(GLOSSARY_TERMS.find((term) => term.term === 'App Layer')?.sources).toEqual(expect.arrayContaining([cosmWasmSource]));
  });

  it('backs the earliest August glossary review batch with claim-specific sources', () => {
    const expectedSources = new Map([
      ['Asgard vault', 'https://docs.thorchain.org/technical-documentation/technology/bifrost-tss-and-vaults'],
      ['Bifrost', 'https://docs.thorchain.org/technical-documentation/technology/bifrost-tss-and-vaults'],
      ['CLP', 'https://docs.thorchain.org/technical-documentation/thorchain-finance/continuous-liquidity-pools'],
      ['Current-only', 'https://dev.thorchain.org/concepts/querying-thorchain.html'],
      ['Mimir', 'https://dev.thorchain.org/concepts/network-halts.html'],
      ['TSS', 'https://docs.thorchain.org/technical-documentation/technology/bifrost-tss-and-vaults'],
    ]);

    for (const [termName, sourceUrl] of expectedSources) {
      const term = GLOSSARY_TERMS.find(({ term }) => term === termName);
      expect(term?.sources.some(({ url }) => url === sourceUrl), termName).toBe(true);
      expect(term?.reviewedAt, termName).toBe('2026-07-13');
      expect(term?.nextReviewDue, termName).toBe('2026-08-13');
    }
  });

  it('refreshes the August 4 review batch from claim-specific primary evidence', () => {
    const glossaryTerms = [
      'Affiliate fee',
      'App Layer',
      'CosmWasm',
      'Dynamic L1 fee',
      'GG20',
      'KeyVerify',
      'Outbound fee',
      'Secured asset',
      'Trade asset',
    ];

    for (const termName of glossaryTerms) {
      const term = GLOSSARY_TERMS.find(({ term }) => term === termName);
      expect(term?.reviewedAt, termName).toBe('2026-07-13');
      expect(term?.nextReviewDue, termName).toBe('2026-08-13');
    }

    const securedAsset = GLOSSARY_TERMS.find(({ term }) => term === 'Secured asset');
    expect(securedAsset?.sources.some(({ url }) => url === 'https://dev.thorchain.org/concepts/secured-assets.html')).toBe(true);

    const tradeAsset = GLOSSARY_TERMS.find(({ term }) => term === 'Trade asset');
    expect(tradeAsset?.sources.some(({ url }) => url === 'https://docs.thorchain.org/technical-documentation/thorchain-finance/trade-assets')).toBe(true);

    const keyVerify = GLOSSARY_TERMS.find(({ term }) => term === 'KeyVerify');
    expect(keyVerify?.definition).toContain('temporary recovery check');
    expect(keyVerify?.definition).toContain('before trading resumed');
    expect(keyVerify?.sources.map(({ url }) => url)).toEqual(['https://blog.thorchain.org/protocol-upgrade-v3-19-0']);

    const appLayer = GLOSSARY_TERMS.find(({ term }) => term === 'App Layer');
    expect(appLayer?.definition).toContain('Mimir-governed deployment permissioning');
    expect(appLayer?.sources.some(({ url }) => url === 'https://dev.thorchain.org/mimir.html')).toBe(true);

    expect(GOVERNANCE_PROPOSAL_RECORDS.find(({ data }) => data.id === 'mimir-operational-halts')?.freshness).toEqual(
      expect.objectContaining({ checkedAt: '2026-07-13', nextReviewDue: '2026-08-13' })
    );

    for (const id of ['dynamic-fee-experiment', 'runtime-live-data-failover', 'third-party-interfaces-wallets']) {
      expect(SOURCE_MAP_SECTION_RECORDS.find(({ data }) => data.id === id)?.freshness, id).toEqual(
        expect.objectContaining({ checkedAt: '2026-07-13', nextReviewDue: '2026-08-13' })
      );
    }

    const beginnerPath = DEEP_DIVE_READER_PATHS.find(({ id }) => id === 'new-to-thorchain');
    expect(beginnerPath).toEqual(expect.objectContaining({ reviewedAt: '2026-07-13', nextReviewDue: '2026-08-13' }));
    expect(beginnerPath?.sources.map(({ url }) => url)).toEqual([
      'https://docs.thorchain.org/native-cross-chain-swaps',
      'https://docs.thorchain.org/technical-documentation/understanding-thorchain/rune',
      'https://docs.thorchain.org/technical-documentation/thorchain-finance/continuous-liquidity-pools',
      'https://docs.thorchain.org/technical-documentation/technology/bifrost-tss-and-vaults',
      'https://dev.thorchain.org/concepts/querying-thorchain.html',
    ]);

    const swapAvailability = TASK_INTENT_GUIDES.find(({ id }) => id === 'swap-availability');
    expect(swapAvailability?.sources.map(({ url }) => url)).toEqual([
      'https://dev.thorchain.org/swap-guide/quickstart-guide.html',
      'https://dev.thorchain.org/concepts/network-halts.html',
      'https://thornode.thorchain.network/thorchain/inbound_addresses',
    ]);

    for (const id of ['fees-and-adr026', 'swap-availability', 'why-paused']) {
      expect(TASK_INTENT_GUIDES.find((guide) => guide.id === id), id).toEqual(
        expect.objectContaining({ reviewedAt: '2026-07-13', nextReviewDue: '2026-08-13' })
      );
    }
  });

  it('backs SwapKit and XChainJS listings with their maintained project sources', () => {
    const expectedSources = new Map([
      ['swapkit', 'https://swapkit.github.io/SwapKit/'],
      ['xchainjs', 'https://xchainjs.org/'],
    ]);

    for (const [projectId, sourceUrl] of expectedSources) {
      const record = ECOSYSTEM_PROJECT_RECORDS.find(({ data }) => data.id === projectId);
      expect(record?.sources.some(({ url }) => url === sourceUrl), projectId).toBe(true);
      expect(record?.freshness.checkedAt, projectId).toBe('2026-07-13');
      expect(record?.freshness.nextReviewDue, projectId).toBe('2026-08-13');
    }
  });

  it('keeps historical milestones aligned with dated primary evidence', () => {
    expect(PROTOCOL_MILESTONE_RECORDS.slice(0, 3).map(({ data, freshness, sources }) => ({
      date: data.date,
      title: data.title,
      description: data.description,
      checkedAt: freshness.checkedAt,
      nextReviewDue: freshness.nextReviewDue,
      sourceUrls: sources.map(({ url }) => url),
    }))).toEqual([
      {
        date: '2018',
        title: 'THORChain Founded',
        description: 'A pseudonymous core team founded THORChain in 2018.',
        checkedAt: '2026-07-13',
        nextReviewDue: '2026-08-13',
        sourceUrls: ['https://docs.thorchain.org/thornodes/frequently-asked-questions'],
      },
      {
        date: '2021-04-13',
        title: 'Multichain Chaosnet Launch',
        description: 'Multichain Chaosnet launches with native cross-chain swaps across five networks while safeguards remain in place on the path to mainnet.',
        checkedAt: '2026-07-13',
        nextReviewDue: '2026-08-13',
        sourceUrls: ['https://medium.com/thorchain/thorchain-launch-multichain-chaosnet-bb9f60008a03'],
      },
      {
        date: '2024-12-11',
        title: 'THORNode v3.0.0 Release',
        description: 'THORNode v3.0.0 upgrades to Cosmos SDK v0.50 and lays groundwork for future App Layer functionality.',
        checkedAt: '2026-07-13',
        nextReviewDue: '2026-08-13',
        sourceUrls: [
          'https://gitlab.com/thorchain/thornode/-/tags/v3.0.0',
          'https://blog.thorchain.org/thorchain-2024-year-end-report-q4-report/',
        ],
      },
    ]);
  });

  it('renders the search route posture without turning result ranking into proof', () => {
    const html = renderToStaticMarkup(
      <RouteSourcePosture
        entry={SEARCH_PAGE_ENTRY}
        useFor={['Finding wiki pages, glossary terms, source-map sections, task guides, and reader paths.']}
        verifyBeforeClaiming={['That a high-ranked result proves the claim without checking the result source, review date, and live evidence.']}
      />
    );

    expect(html).toContain('Search, guided reader paths, task guides');
    expect(html).toContain('Page Source Posture');
    expect(html).toContain('Finding wiki pages, glossary terms');
    expect(html).toContain('That a high-ranked result proves the claim');
    expect(html).toContain('Source retrieved 2026-07-02');
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
            label: 'Mimir halt guide',
            href: '/deep-dives/mimir-halt-controls#what-mimirs-can-prove',
            badge: 'guide',
            description: 'Read halt-key interpretation guidance.',
          },
        ]}
      />
    );

    expect(html).toContain('Related Checks');
    expect(html).toContain('Use these before turning current dashboard values into a broader claim.');
    expect(html).toContain('current-only');
    expect(html).toContain('href="/docs#current-protocol-state"');
    expect(html).toContain('href="/deep-dives/mimir-halt-controls#what-mimirs-can-prove"');
    expect(html).toContain('proof boundary');
    expect(html).toContain('Read halt-key interpretation guidance.');

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
    expect(html).toContain('Use This Article For');
    expect(html).toContain('A security explainer for threshold signing, vault-key risk, GG20 incident language');
    expect(html).toContain('Verify Elsewhere Before Claiming');
    expect(html).toContain('Current signing state, vault safety, validator upgrade coverage, active TSS implementation');
    expect(html).toContain('Verify Now');
    expect(html).toContain('Use these current-state checks before turning this explainer into a live protocol, wallet, or availability claim.');
    expect(html).toContain('Network Security');
    expect(html).toContain('Historical Recovery');
    expect(html).toContain('Verify Before Claiming');
    expect(html).toContain('Current signing, observation, trading, or chain-specific Mimir state.');
    expect(html).toContain('href="/deep-dives#deep-dive-path-network-security"');
    expect(html).toContain('href="/network#network-diagnostics"');
    expect(html).toContain('href="/docs#current-protocol-state"');
    expect(html).toContain('Wiki reviewed 2026-07-13');
    expect(html).toContain('Review due 2026-08-13');

    const historicalHtml = renderToStaticMarkup(
      <DeepDiveShell entryId="deep-dive-savers" editPath="content/deep-dives/savers.mdx">
        <h1>Savers and Lending</h1>
      </DeepDiveShell>
    );

    expect(historicalHtml).toContain('A historical-product guide for archived Savers/Lending context, THORFi unwind boundaries');
    expect(historicalHtml).toContain('whether old yield or lending behavior is being misread as live.');

    const refundHtml = renderToStaticMarkup(
      <DeepDiveShell entryId="deep-dive-streaming-swaps-refunds" editPath="content/deep-dives/streaming-swaps-refunds.mdx">
        <h1>Streaming Swaps And Refunds</h1>
      </DeepDiveShell>
    );

    expect(refundHtml).toContain('Verify Elsewhere Before Claiming: </span>Current quote result, memo, inbound address, amount thresholds, transaction evidence, and live halt/signing state.');

    const tcyHtml = renderToStaticMarkup(
      <DeepDiveShell entryId="deep-dive-tcy-recovery-timeline" editPath="content/deep-dives/tcy-recovery-timeline.mdx">
        <h1>TCY Recovery Timeline</h1>
      </DeepDiveShell>
    );

    expect(tcyHtml).toContain('A dated recovery-context guide for TCY, deprecated THORFi products, and current-state claims that need separate proof.');
    expect(tcyHtml).toContain('Current TCY claiming, staking, trading, distribution, recovery progress, solvency, market value, or ADR-028 state.');

    const clpHtml = renderToStaticMarkup(
      <DeepDiveShell entryId="deep-dive-clp" editPath="content/deep-dives/clp.mdx">
        <h1>Continuous Liquidity Pools</h1>
      </DeepDiveShell>
    );

    expect(clpHtml).toContain('A mechanism and evidence-boundary guide for CLP pricing, slip/liquidity fees, route availability, and refund non-claims.');
    expect(clpHtml).toContain('Current quote, route availability, pool depth, LP action state, source quality, transaction evidence');
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
    expect(html).toContain('Checked 2026-07-08');
    expect(html).toContain('Review due 2026-08-08');
    expect(html).toContain('Archived Savers and Lending docs');
    expect(html).toContain('RUNE and TCY tokenomics');
    expect(html).toContain('TCY Developer Guide');
    expect(html).toContain('THORFi Unwind Announcement');
    expect(html).toContain('THORChain Exploit Report #1');
    expect(html).toContain('+5 sources');
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
    expect(html).toContain('Show 2 additional endpoint reads for THORNode');
    expect(html).toContain('THORNode Mimir');
    expect(html).toContain('height=100');
    expect(html).toContain('<details');
    expect(html).toContain('break-words');
    expect(html).toContain('[overflow-wrap:anywhere]');
    expect(html).not.toContain('role="list"');
    expect(html).not.toContain('whitespace-nowrap');
  });

  it('uses the shared source wrapping contract for long live endpoint labels', () => {
    const longEndpointLabel = 'THORNode dynamic_l1_fees_current sealed accumulator endpoint with unusually long provider label';
    const html = renderToStaticMarkup(
      <LiveSourceMeta
        result={{
          status: 'ok',
          checkedAt: '2026-06-18T00:00:00.000Z',
          sources: [
            {
              label: longEndpointLabel,
              url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees_current?height=123456789',
            },
            {
              label: `${longEndpointLabel} secondary read`,
              url: 'https://thornode.thorchain.network/thorchain/dynamic_l1_fees?height=123456789',
            },
          ],
        }}
      />
    );

    expect(html).toContain(longEndpointLabel);
    expect(html).toContain('+1 endpoint read');
    expect(html).toContain(`Show 1 additional endpoint read for ${longEndpointLabel}`);
    expect(html).toContain('min-w-0 max-w-full break-words');
    expect(html).toContain('[overflow-wrap:anywhere]');
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
    expect(html).toContain('1 source warning; 1 raw key hidden from compact view');
    expect(html).toContain('warning / other');
    expect(html).toContain('Unknown operation-like Mimir keys need review.');
    expect(html).toContain('Exact key is available only in the source-specific diagnostics.');
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
