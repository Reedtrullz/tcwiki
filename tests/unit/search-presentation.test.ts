import lunr from 'lunr';
import { describe, expect, it } from 'vitest';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { runSafeLunrSearch } from '@/lib/search/lunr-query';
import { rankSearchResults } from '@/lib/search/ranking';
import {
  buildSearchFilterOptions,
  classifySearchDoc,
  excludeSearchStartingPoints,
  filterSearchResults,
  getSearchSourceDisclosureRows,
  getSearchSourceRetrievalSummary,
  getSearchStartingPoints,
  getSearchTypeLabel,
  normalizeSearchFilter,
} from '@/lib/search/presentation';

const searchIndex = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('content');
  SEARCH_DOCUMENTS.forEach((doc) => this.add(doc));
});

const searchDocumentsById = new Map(SEARCH_DOCUMENTS.map((doc) => [doc.id, doc]));

function rankedResults(query: string) {
  const mapped = runSafeLunrSearch(searchIndex, query).flatMap((result) => {
    const doc = searchDocumentsById.get(result.ref);
    return doc ? [{ ...doc, score: result.score }] : [];
  });

  return rankSearchResults(query, mapped);
}

describe('search presentation helpers', () => {
  it('classifies live, source-map, task, deep-dive path, and governance results for filters', () => {
    const dynamicFeesSection = SEARCH_DOCUMENTS.find((doc) => doc.id === 'dynamic-fees');
    const sourceMap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'source-map:current-protocol-state');
    const task = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:swap-availability');
    const chain = SEARCH_DOCUMENTS.find((doc) => doc.id === 'chain:sol');
    const deepDivePath = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-path:network-security');
    const incident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:gg20-vault-exploit-2026');
    const tokenomics = SEARCH_DOCUMENTS.find((doc) => doc.id === 'tokenomics:rune-supply-framing');

    expect(dynamicFeesSection && classifySearchDoc(dynamicFeesSection)).toBe('live');
    expect(sourceMap && classifySearchDoc(sourceMap)).toBe('source-map');
    expect(task && classifySearchDoc(task)).toBe('task');
    expect(chain && classifySearchDoc(chain)).toBe('live');
    expect(deepDivePath && classifySearchDoc(deepDivePath)).toBe('deep-dive');
    expect(incident && classifySearchDoc(incident)).toBe('governance');
    expect(tokenomics && classifySearchDoc(tokenomics)).toBe('pages');
  });

  it('builds count-bearing filter options and filters without inventing zero-result groups', () => {
    const results = rankedResults('dynamic L1 fee');
    const options = buildSearchFilterOptions(results);
    const optionIds = options.map((option) => option.id);

    expect(optionIds[0]).toBe('all');
    expect(optionIds).toContain('task');
    expect(optionIds).toContain('source-map');
    expect(optionIds).toContain('live');
    expect(options.find((option) => option.id === 'all')?.count).toBe(results.length);
    expect(options.filter((option) => option.id !== 'all').every((option) => option.count > 0)).toBe(true);
    expect(filterSearchResults(results, 'source-map').every((result) => classifySearchDoc(result) === 'source-map')).toBe(true);
  });

  it('exposes needs-review matches as an explicit trust filter', () => {
    const results = rankedResults('ADR-028');
    const options = buildSearchFilterOptions(results);
    const reviewResults = filterSearchResults(results, 'needs-review');

    expect(options.find((option) => option.id === 'needs-review')).toEqual(expect.objectContaining({
      label: 'Needs Review',
      count: reviewResults.length,
    }));
    expect(reviewResults.length).toBeGreaterThan(0);
    expect(reviewResults.every((result) => result.confidence === 'needs-review')).toBe(true);
    expect(reviewResults.some((result) => result.id === 'governance:adr-028-recovery')).toBe(true);
  });

  it('keeps current-state task guides visible in the Live State filter', () => {
    const currentProtocolResults = rankedResults('current protocol state');
    const currentProtocolLiveResults = filterSearchResults(currentProtocolResults, 'live');
    const currentProtocolSourceMapResults = filterSearchResults(currentProtocolResults, 'source-map');

    expect(currentProtocolLiveResults.some((result) => result.id === 'source-map:current-protocol-state' && result.href === '/docs#current-protocol-state')).toBe(true);
    expect(currentProtocolSourceMapResults.some((result) => result.id === 'source-map:current-protocol-state')).toBe(true);

    const runeResults = rankedResults('which RUNE number');
    const runeLiveResults = filterSearchResults(runeResults, 'live');
    const runeTaskResults = filterSearchResults(runeResults, 'task');

    expect(runeLiveResults.some((result) => result.id === 'task:rune-tokenomics' && result.href === '/rune#rune-number-router')).toBe(true);
    expect(runeTaskResults.some((result) => result.id === 'task:rune-tokenomics')).toBe(true);

    const runepoolResults = rankedResults('RUNEPool live');
    const runepoolLiveResults = filterSearchResults(runepoolResults, 'live');
    const runepoolTaskResults = filterSearchResults(runepoolResults, 'task');

    expect(runepoolLiveResults.some((result) => result.id === 'task:runepool-pol' && result.href === '/economics#runepool-pol-live')).toBe(true);
    expect(runepoolTaskResults.some((result) => result.id === 'task:runepool-pol')).toBe(true);

    const tcyResults = rankedResults('current TCY controls');
    const tcyLiveResults = filterSearchResults(tcyResults, 'live');
    const tcyTaskResults = filterSearchResults(tcyResults, 'task');

    expect(tcyLiveResults.some((result) => result.id === 'task:tcy-current-controls' && result.href === '/tcy#tcy-current-controls')).toBe(true);
    expect(tcyTaskResults.some((result) => result.id === 'task:tcy-current-controls')).toBe(true);
  });

  it('selects deduped task, source-map, and reader-path starting points', () => {
    const startingPoints = getSearchStartingPoints(rankedResults('which source should I trust'));
    const remainingResults = excludeSearchStartingPoints(rankedResults('which source should I trust'), startingPoints);

    expect(startingPoints.length).toBeGreaterThan(0);
    expect(startingPoints[0].id).toBe('task:source-choice');
    expect(startingPoints.map((result) => result.id)).toContain('task:source-choice');
    expect(new Set(startingPoints.map((result) => result.href)).size).toBe(startingPoints.length);
    expect(startingPoints.every((result) => result.type === 'task' || result.type === 'source-map' || result.type === 'deep-dive-path')).toBe(true);
    expect(remainingResults.some((result) => result.id === startingPoints[0]?.id)).toBe(false);

    const pathStartingPoints = getSearchStartingPoints(rankedResults('network security path'));
    expect(pathStartingPoints[0].id).toBe('deep-dive-path:network-security');
    expect(pathStartingPoints.every((result) => result.type === 'task' || result.type === 'source-map' || result.type === 'deep-dive-path')).toBe(true);
  });

  it('suppresses weak starting points when an exact destination is already first', () => {
    expect(rankedResults('mimir halt controls')[0]?.id).toBe('deep-dive-mimir-halt-controls');
    expect(getSearchStartingPoints(rankedResults('mimir halt controls'), 3, 'mimir halt controls')).toEqual([]);

    expect(rankedResults('HALTBSCTRADING')[0]?.id).toBe('mimir:official-halt-controls');
    expect(getSearchStartingPoints(rankedResults('HALTBSCTRADING'), 3, 'HALTBSCTRADING')).toEqual([]);
    expect(rankedResults('PauseLP')[0]?.id).toBe('mimir:official-halt-controls');
    expect(getSearchStartingPoints(rankedResults('PauseLP'), 3, 'PauseLP')).toEqual([]);
    expect(rankedResults('PauseLPDeposit-BTC')[0]?.id).toBe('mimir:official-halt-controls');
    expect(getSearchStartingPoints(rankedResults('PauseLPDeposit-BTC'), 3, 'PauseLPDeposit-BTC')).toEqual([]);
    expect(rankedResults('PauseAsymWithdrawal-BTC')[0]?.id).toBe('mimir:official-halt-controls');
    expect(getSearchStartingPoints(rankedResults('PauseAsymWithdrawal-BTC'), 3, 'PauseAsymWithdrawal-BTC')).toEqual([]);
    expect(getSearchStartingPoints(rankedResults('why is BSC halted'), 3, 'why is BSC halted')[0]?.id).toBe('task:why-paused');

    expect(rankedResults('ADR-028')[0]?.id).toBe('governance:adr-028-recovery');
    expect(getSearchStartingPoints(rankedResults('ADR-028'), 3, 'ADR-028')).toEqual([]);
    expect(rankedResults('ADR026')[0]?.id).toBe('governance:adr-026-dynamic-l1-fees');
    expect(getSearchStartingPoints(rankedResults('ADR026'), 3, 'ADR026')).toEqual([]);

    expect(rankedResults('live data guide')[0]?.id).toBe('deep-dive-midgard-thornode-data');
    expect(getSearchStartingPoints(rankedResults('live data guide'), 3, 'live data guide')).toEqual([]);

    expect(rankedResults('SOL supported')[0]?.id).toBe('chain:sol');
    expect(getSearchStartingPoints(rankedResults('SOL supported'), 3, 'SOL supported')).toEqual([]);

    expect(rankedResults('THORName')[0]?.id).toBe('glossary:thorname');
    expect(getSearchStartingPoints(rankedResults('THORName'), 3, 'THORName')).toEqual([]);
    expect(rankedResults('what is thorname')[0]?.id).toBe('glossary:thorname');
    expect(getSearchStartingPoints(rankedResults('what is thorname'), 3, 'what is thorname')).toEqual([]);
    expect(rankedResults('thorname lookup')[0]?.id).toBe('glossary:thorname');
    expect(getSearchStartingPoints(rankedResults('thorname lookup'), 3, 'thorname lookup')).toEqual([]);
    expect(rankedResults('thorname guide')[0]?.id).toBe('glossary:thorname');
    expect(getSearchStartingPoints(rankedResults('thorname guide'), 3, 'thorname guide')).toEqual([]);
    expect(rankedResults('thorname affiliate')[0]?.id).toBe('glossary:thorname');
    expect(getSearchStartingPoints(rankedResults('thorname affiliate'), 3, 'thorname affiliate')).toEqual([]);

    expect(rankedResults('multi-prime modulus')[0]?.id).toBe('glossary:multi-prime-modulus');
    expect(getSearchStartingPoints(rankedResults('multi-prime modulus'), 3, 'multi-prime modulus')).toEqual([]);

    const sourceMapStarts = getSearchStartingPoints(rankedResults('source map'), 3, 'source map');
    expect(sourceMapStarts.length).toBeGreaterThan(0);
  });

  it('starts protocol vault-safety questions at TSS without hijacking wallet safety', () => {
    for (const query of [
      'vault safety',
      'is the vault safe',
      'THORChain vault safety',
      'Asgard vault safe',
      'are vaults safe',
      'are THORChain vaults safe',
    ]) {
      const vaultSafetyResults = rankedResults(query);
      const vaultSafetyStarts = getSearchStartingPoints(vaultSafetyResults, 3, query);

      expect(vaultSafetyResults[0]?.id, query).toBe('task:tss-security-claims');
      expect(vaultSafetyStarts[0]?.id, query).toBe('task:tss-security-claims');
      expect(vaultSafetyStarts.map((result) => result.id), query).not.toContain('task:choose-interface');
      expect(vaultSafetyStarts.map((result) => result.id), query).not.toContain('source-map:third-party-interfaces-wallets');
    }

    for (const query of ['wallet safety', 'is ShapeShift safe', 'Vultisig vault safety']) {
      const walletSafetyStarts = getSearchStartingPoints(rankedResults(query), 3, query);
      const startIds = walletSafetyStarts.map((result) => result.id);

      expect(walletSafetyStarts[0]?.id, query).toBe('task:choose-interface');
      expect(startIds, query).not.toContain('task:tss-security-claims');
      expect(startIds, query).not.toContain('deep-dive-path:network-security');
    }

    expect(rankedResults('Asgard vault')[0]?.id).toBe('glossary:asgard-vault');
    expect(getSearchStartingPoints(rankedResults('Asgard vault'), 3, 'Asgard vault')).toEqual([]);
    expect(rankedResults('vault signing halted')[0]?.id).toBe('task:swap-availability');
    expect(rankedResults('vault exploit')[0]?.id).toBe('incident:gg20-vault-exploit-2026');
    expect(getSearchStartingPoints(rankedResults('vault exploit'), 3, 'vault exploit')).toEqual([]);
    expect(rankedResults('GG20 attack')[0]?.id).toBe('incident:gg20-vault-exploit-2026');
    expect(getSearchStartingPoints(rankedResults('GG20 attack'), 3, 'GG20 attack')).toEqual([]);
  });

  it('starts aggregate and unknown chain-support questions at the catalog and live check', () => {
    for (const query of ['which chains are supported', 'is TON supported']) {
      const results = rankedResults(query);
      const starts = getSearchStartingPoints(results, 3, query);
      const startIds = starts.map((result) => result.id);

      expect(results[0]?.id, query).toBe('task:supported-chain-catalog');
      expect(starts[0]?.id, query).toBe('task:supported-chain-catalog');
      expect(startIds, query).toContain('task:swap-availability');
      expect(startIds, query).toContain('source-map:current-protocol-state');
      expect(startIds, query).not.toContain('task:app-layer-and-secured-assets');
      expect(startIds, query).not.toContain('source-map:third-party-interfaces-wallets');
    }

    expect(rankedResults('is BTC supported')[0]?.id).toBe('chain:btc');
    expect(getSearchStartingPoints(rankedResults('is BTC supported'), 3, 'is BTC supported')).toEqual([]);

    const interfaceStarts = getSearchStartingPoints(rankedResults('is ShapeShift supported'), 3, 'is ShapeShift supported');
    expect(interfaceStarts[0]?.id).toBe('task:choose-interface');
    expect(interfaceStarts.map((result) => result.id)).not.toContain('task:supported-chain-catalog');
  });

  it('normalizes unsupported filters back to all', () => {
    expect(normalizeSearchFilter('deep-dive')).toBe('deep-dive');
    expect(normalizeSearchFilter('needs-review')).toBe('needs-review');
    expect(normalizeSearchFilter('unsupported')).toBe('all');
    expect(normalizeSearchFilter(null)).toBe('all');
  });

  it('uses human result type labels instead of enum names', () => {
    expect(getSearchTypeLabel('task')).toBe('Task Guide');
    expect(getSearchTypeLabel('source-map')).toBe('Source Map');
    expect(getSearchTypeLabel('deep-dive-path')).toBe('Reader Path');
    expect(getSearchTypeLabel('deep-dive')).toBe('Deep Dive');
    expect(getSearchTypeLabel('chain')).toBe('Supported Chain');
    expect(getSearchTypeLabel('mimir')).toBe('Mimir Control');
    expect(getSearchTypeLabel('deep-dive-path')).not.toContain('-');
  });

  it('preserves source notes and retrieval dates for search result disclosures', () => {
    const incident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:gg20-vault-exploit-2026');
    const rows = getSearchSourceDisclosureRows(incident?.sources ?? []);

    expect(rows).toContainEqual(expect.objectContaining({
      label: 'THORChain Exploit Report #2',
      retrievedAt: '2026-07-04',
      notes: expect.stringContaining('root-cause'),
    }));
    expect(rows.every((row) => row.retrievedAt || row.notes)).toBe(true);
  });

  it('keeps source-map search results fully source-dated', () => {
    const sourceMapDocs = SEARCH_DOCUMENTS.filter((doc) => doc.type === 'source-map');

    expect(sourceMapDocs.length).toBeGreaterThan(0);
    for (const doc of sourceMapDocs) {
      expect(
        doc.sources.every((source) => Boolean(source.retrievedAt)),
        `${doc.id} should not render an undated source-map source`
      ).toBe(true);
    }
  });

  it('summarizes source retrieval dates separately from result review dates', () => {
    const incident = SEARCH_DOCUMENTS.find((doc) => doc.id === 'incident:gg20-vault-exploit-2026');
    expect(getSearchSourceRetrievalSummary(incident?.sources ?? [])).toEqual({
      label: '2026-07-04 to 2026-07-05',
      datedSourceCount: 3,
      hasUndatedSources: false,
    });

    const sourceMap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'source-map:current-protocol-state');
    expect(getSearchSourceRetrievalSummary(sourceMap?.sources ?? [])).toEqual({
      label: '2026-07-04 to 2026-07-05',
      datedSourceCount: 6,
      hasUndatedSources: false,
    });

    const availabilityTask = SEARCH_DOCUMENTS.find((doc) => doc.id === 'task:swap-availability');
    expect(getSearchSourceRetrievalSummary(availabilityTask?.sources ?? [])).toEqual({
      label: '2026-07-02',
      datedSourceCount: 2,
      hasUndatedSources: false,
    });

    expect(getSearchSourceRetrievalSummary([
      { label: 'First', url: 'https://example.com/first', retrievedAt: '2026-07-04' },
      { label: 'Second', url: 'https://example.com/second', retrievedAt: '2026-07-05' },
    ])).toEqual({
      label: '2026-07-04 to 2026-07-05',
      datedSourceCount: 2,
      hasUndatedSources: false,
    });

    expect(getSearchSourceRetrievalSummary([
      { label: 'First', url: 'https://example.com/first', retrievedAt: '2026-07-05' },
      { label: 'Second', url: 'https://example.com/second' },
    ])).toEqual({
      label: '2026-07-05; 1 source undated',
      datedSourceCount: 1,
      hasUndatedSources: true,
    });
  });
});
