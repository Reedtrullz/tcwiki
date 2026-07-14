import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import {
  DEEP_DIVE_READER_PATHS,
  TASK_INTENT_GUIDES,
  getContentEntry,
} from '@/lib/content/registry';
import {
  ECOSYSTEM_PROJECT_RECORDS,
  PROTOCOL_MILESTONE_RECORDS,
  SOURCE_MAP_SECTION_RECORDS,
} from '@/lib/data/static';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import {
  appLayerSource,
  archivedLendingSource,
  archivedSaversSource,
  cosmWasmSource,
  securedAssetsDevSource,
  securedAssetsSource,
  thorSwapDocsSource,
} from '@/lib/sources';

const REVIEWED_AT = '2026-07-14';
const NEXT_REVIEW_DUE = '2026-08-14';

describe('app-layer, interface, and recovery content review', () => {
  it('refreshes the bounded official and maintained source cohort', () => {
    for (const source of [
      appLayerSource,
      cosmWasmSource,
      securedAssetsSource,
      securedAssetsDevSource,
      archivedSaversSource,
      archivedLendingSource,
      thorSwapDocsSource,
    ]) {
      expect(source.retrievedAt, source.label).toBe(REVIEWED_AT);
    }

    expect(archivedSaversSource.notes).toContain('2025-01-04');
    expect(archivedLendingSource.notes).toContain('2025-01-04');
    expect(thorSwapDocsSource.notes).toContain('multi-protocol');
  });

  it('refreshes the content, reader-path, task-guide, and glossary cohort together', () => {
    for (const id of [
      'deep-dive-app-layer',
      'deep-dive-savers',
      'deep-dive-streaming-swaps-refunds',
    ]) {
      const entry = getContentEntry(id);
      expect(entry.reviewedAt, id).toBe(REVIEWED_AT);
      expect(entry.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const id of ['app-layer-integrations', 'historical-recovery']) {
      const path = DEEP_DIVE_READER_PATHS.find((candidate) => candidate.id === id);
      expect(path?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(path?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const id of [
      'learn-thorchain',
      'swap-refund-lifecycle',
      'source-choice',
      'app-layer-and-secured-assets',
      'choose-interface',
    ]) {
      const guide = TASK_INTENT_GUIDES.find((candidate) => candidate.id === id);
      expect(guide?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(guide?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const termName of [
      'Mimir override',
      'Inbound address',
      'Memo',
      'Secured asset',
      'Synthetic asset',
      'App Layer',
      'CosmWasm',
      'Savers',
    ]) {
      const term = GLOSSARY_TERMS.find((candidate) => candidate.term === termName);
      expect(term?.reviewedAt, termName).toBe(REVIEWED_AT);
      expect(term?.nextReviewDue, termName).toBe(NEXT_REVIEW_DUE);
    }
  });

  it('preserves source conflicts and separates syntax from current availability', () => {
    const mimir = GLOSSARY_TERMS.find((term) => term.term === 'Mimir override');
    const inbound = GLOSSARY_TERMS.find((term) => term.term === 'Inbound address');
    const memo = GLOSSARY_TERMS.find((term) => term.term === 'Memo');
    const secured = GLOSSARY_TERMS.find((term) => term.term === 'Secured asset');
    const synth = GLOSSARY_TERMS.find((term) => term.term === 'Synthetic asset');

    expect(mimir?.definition).toContain('exist without a matching constant');
    expect(inbound?.definition).toContain('must not be cached or reused across churns');
    expect(memo?.definition).toContain('deprecated handlers can remain documented');
    expect(secured?.definition).toContain('Trade Assets or Trade Accounts');
    expect(synth?.definition).toContain('documented memo handlers do not prove');

    const appLayer = readFileSync('content/deep-dives/app-layer.mdx', 'utf8');
    const savers = readFileSync('content/deep-dives/savers.mdx', 'utf8');
    const refunds = readFileSync('content/deep-dives/streaming-swaps-refunds.mdx', 'utf8');

    expect(appLayer).toContain('cannot touch vault logic');
    expect(appLayer).toContain('high-level secured-assets page says they replace Trade Assets');
    expect(appLayer).toContain('developer guide says they replace Trade Accounts');
    expect(appLayer).toContain('does not turn static memo examples into current user instructions');
    expect(savers).toContain('permanently deprecated on January 4, 2025');
    expect(savers).toContain('A documented handler does not override');
    expect(refunds).toContain('Documented syntax proves a message shape, not current feature availability');
    expect(refunds).toContain('re-fetch the inbound address rather than caching');
  });

  it('corrects the THORSwap and historical-record boundaries', () => {
    const combinedArchiveUrl = 'https://docs.thorchain.org/thornodes/archived';
    const thorSwap = ECOSYSTEM_PROJECT_RECORDS.find((record) => record.data.id === 'thorswap');
    expect(thorSwap?.freshness).toEqual(expect.objectContaining({
      checkedAt: REVIEWED_AT,
      nextReviewDue: NEXT_REVIEW_DUE,
    }));
    expect(thorSwap?.sources).toContainEqual(thorSwapDocsSource);
    expect(thorSwap?.data.description).toContain('multi-protocol');
    expect(thorSwap?.data.verifyBeforeUse.join(' ')).toContain('which protocol actually provides the selected route');
    expect(thorSwap?.sources.map((source) => source.url)).not.toContain(combinedArchiveUrl);

    const historicalMap = SOURCE_MAP_SECTION_RECORDS.find((record) => record.data.id === 'historical-features-and-recovery');
    expect(historicalMap?.freshness.checkedAt).toBe(REVIEWED_AT);
    expect(historicalMap?.data.nonClaims).toContain(
      'That a memo handler still appearing in developer documentation proves the corresponding product or action is enabled.'
    );
    expect(historicalMap?.sources.map((source) => source.url)).not.toContain(combinedArchiveUrl);

    expect(getContentEntry('deep-dive-savers').sources.map((source) => source.url)).not.toContain(combinedArchiveUrl);

    const saversMilestone = PROTOCOL_MILESTONE_RECORDS.find((record) => record.data.title === 'Savers and Lending Deprecated');
    expect(saversMilestone?.data.date).toBe('2025-01-04');
    expect(saversMilestone?.sources).toEqual(expect.arrayContaining([archivedSaversSource, archivedLendingSource]));
    expect(saversMilestone?.sources.map((source) => source.url)).not.toContain(combinedArchiveUrl);

    const exploitMilestone = PROTOCOL_MILESTONE_RECORDS.find((record) => record.data.title === 'GG20 Vault Exploit and Emergency Halt');
    expect(exploitMilestone?.data.description).toContain('roughly $10M from one vault');
    expect(exploitMilestone?.data.description).toContain('v3.19.1 patched the incident class');
    expect(exploitMilestone?.data.description).toContain('migration away from GG20 remained planned');
  });

  it('keeps the corrected boundaries searchable', () => {
    const appLayer = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-app-layer');
    const savers = SEARCH_DOCUMENTS.find((doc) => doc.id === 'deep-dive-savers');
    const thorSwap = SEARCH_DOCUMENTS.find((doc) => doc.id === 'ecosystem:thorswap');
    const mimir = SEARCH_DOCUMENTS.find((doc) => doc.id === 'glossary:mimir-override');

    expect(appLayer?.content).toContain('source terminology divergence');
    expect(appLayer?.content).toContain('memo syntax is not availability');
    expect(savers?.content).toContain('January 4 2025');
    expect(thorSwap?.content).toContain('NEAR Intents');
    expect(thorSwap?.content).toContain('which protocol actually provides the selected route');
    expect(mimir?.content).toContain('exist without a matching constant');
  });
});
