import { describe, expect, it } from 'vitest';
import { SWAP_EVIDENCE_MAP_RECORD } from '@/lib/data/static';
import { readFileSync } from 'node:fs';

describe('maintained educational swap evidence map', () => {
  it('keeps source-chain, protocol processing and destination evidence distinct', () => {
    const stages = SWAP_EVIDENCE_MAP_RECORD.data.stages;
    expect(stages.map(stage => stage.id)).toEqual(['source-chain', 'observation', 'processing', 'outbound', 'destination-chain']);
    expect(stages[0].boundary).toMatch(/do(?:es)? not prove.*THORChain/i);
    expect(stages[2].boundary).toMatch(/refund/i);
    expect(stages[4].boundary).toMatch(/independently/i);
    expect(SWAP_EVIDENCE_MAP_RECORD.sources.every(source => source.url.startsWith('https://'))).toBe(true);
    for (const stage of stages) expect(stage.href).toMatch(/^\/deep-dives\//);
  });
  it('is a static learning map with a searchable stable heading, rather than a live outcome', () => {
    const article = readFileSync('content/deep-dives/build-query-data.mdx','utf8');
    expect(article).toContain('## Swap Execution And Evidence Map');
    expect(article).toContain('<SwapEvidenceMap');
    expect(SWAP_EVIDENCE_MAP_RECORD.data.limitation).toMatch(/not a live transaction/i);
  });
});
