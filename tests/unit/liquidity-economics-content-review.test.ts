import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GLOSSARY_TERMS } from '@/lib/content/glossary';
import {
  DEEP_DIVE_READER_PATHS,
  TASK_INTENT_GUIDES,
  getContentEntry,
} from '@/lib/content/registry';
import {
  SOURCE_MAP_SECTION_RECORDS,
  getTokenomicsRecord,
} from '@/lib/data/static';
import {
  continuousLiquidityPoolsSource,
  economicModelSource,
  liquidityProviderFaqSource,
  liquidityProvidersSource,
  nativeSwapsSource,
  networkSecurityGovernanceSource,
  runeDocsSource,
  runePoolDevSource,
  runePoolDocsSource,
  runePoolEndpointSource,
} from '@/lib/sources';

const REVIEWED_AT = '2026-07-14';
const NEXT_REVIEW_DUE = '2026-08-14';
const LIQUIFY_RUNEPOOL_URL = 'https://gateway.liquify.com/chain/thorchain_api/thorchain/runepool';

describe('liquidity and economics content review', () => {
  it('refreshes the shared official source cohort and current RUNEPool endpoint', () => {
    for (const source of [
      liquidityProvidersSource,
      continuousLiquidityPoolsSource,
      runeDocsSource,
      nativeSwapsSource,
      liquidityProviderFaqSource,
      runePoolDocsSource,
      runePoolDevSource,
      runePoolEndpointSource,
      economicModelSource,
      networkSecurityGovernanceSource,
    ]) {
      expect(source.retrievedAt, source.label).toBe(REVIEWED_AT);
    }

    expect(runePoolEndpointSource.url).toBe(LIQUIFY_RUNEPOOL_URL);
    expect(runePoolEndpointSource.notes).toContain('same Liquify provider and THORChain height');
  });

  it('refreshes the bounded route, deep-dive, reader-path, and task-guide cohort', () => {
    for (const id of [
      'economics',
      'deep-dives',
      'deep-dive-rune-settlement',
      'deep-dive-clp',
      'deep-dive-incentive-pendulum',
      'deep-dive-liquidity-actions',
      'deep-dive-runepool-pol',
    ]) {
      const entry = getContentEntry(id);
      expect(entry.reviewedAt, id).toBe(REVIEWED_AT);
      expect(entry.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const id of ['new-to-thorchain', 'swap-economics', 'liquidity-actions']) {
      const path = DEEP_DIVE_READER_PATHS.find((candidate) => candidate.id === id);
      expect(path?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(path?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    for (const id of ['rune-tokenomics', 'rune-actions', 'liquidity-actions', 'runepool-pol']) {
      const guide = TASK_INTENT_GUIDES.find((candidate) => candidate.id === id);
      expect(guide?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(guide?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }
  });

  it('keeps liquidity glossary terms on action and accounting evidence boundaries', () => {
    for (const id of [
      'clp',
      'impermanent-loss',
      'impermanent-loss-protection',
      'liquidity-provider',
      'liquidity-units',
      'asymmetric-withdrawal',
      'protocol-owned-liquidity',
      'runepool',
    ]) {
      const term = GLOSSARY_TERMS.find((candidate) => candidate.id === id);
      expect(term?.reviewedAt, id).toBe(REVIEWED_AT);
      expect(term?.nextReviewDue, id).toBe(NEXT_REVIEW_DUE);
    }

    expect(GLOSSARY_TERMS.find((term) => term.id === 'impermanent-loss-protection')?.definition).toContain('removed or ended');
    expect(GLOSSARY_TERMS.find((term) => term.id === 'runepool')?.definition).toContain('same-provider, height-pinned');
    expect(GLOSSARY_TERMS.find((term) => term.id === 'protocol-owned-liquidity')?.definition).toContain('fixed documentation count');
  });

  it('preserves conflicting supply pages as separate dated source claims', () => {
    const supply = getTokenomicsRecord('rune-supply-framing');
    const sourceMap = SOURCE_MAP_SECTION_RECORDS.find((record) => record.data.id === 'rune-tokenomics-and-value');

    expect(supply.freshness.checkedAt).toBe(REVIEWED_AT);
    expect(supply.freshness.nextReviewDue).toBe(NEXT_REVIEW_DUE);
    expect(supply.data.summary).toContain('approximate figures near 425M');
    expect(supply.data.summary).toContain('original 500M maximum');
    expect(supply.sources).toContainEqual(economicModelSource);
    expect(sourceMap?.freshness.checkedAt).toBe(REVIEWED_AT);
    expect(sourceMap?.data.caveat).toContain('`425M and burning`');
    expect(sourceMap?.data.caveat).toContain('original `500M` maximum');
    expect(sourceMap?.data.links).toContainEqual(economicModelSource);
  });

  it('removes unsupported AMM and market-regime shortcuts from the articles', () => {
    const clp = readFileSync('content/deep-dives/clp.mdx', 'utf8');
    const pendulum = readFileSync('content/deep-dives/incentive-pendulum.mdx', 'utf8');
    const liquidityActions = readFileSync('content/deep-dives/liquidity-actions.mdx', 'utf8');
    const runePool = readFileSync('content/deep-dives/runepool-pol.mdx', 'utf8');

    expect(clp).toContain("THORChain's CLP is a constant-function pool design");
    expect(clp).not.toContain('Unlike constant-product AMMs');
    expect(pendulum).not.toContain('During bull markets with high liquidity demand');
    expect(pendulum).toContain('`425M and burning`');
    expect(liquidityActions).toContain('impermanent-loss-protection section is historical');
    expect(runePool).toContain('same-provider, same-height');
    expect(runePool).toContain('`current_deposit` is `rune_deposited - rune_withdrawn` and can be negative');
  });
});
