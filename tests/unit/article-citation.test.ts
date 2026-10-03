import { describe, expect, it } from 'vitest';
import { buildArticleCitation } from '@/lib/article-citation';
import { getContentEntry } from '@/lib/content/registry';

describe('portable article evidence citations', () => {
  it('carries canonical section, historical scope and actual source/review dates', () => {
    const entry = getContentEntry('deep-dive-savers');
    const citation = buildArticleCitation(entry, 'Historical explainer; verify current availability independently.', 'text', '#historical-context');
    expect(citation).toContain('https://wiki.thorchain.no/deep-dives/savers#historical-context');
    expect(citation).toContain(entry.reviewedAt);
    expect(citation).toContain('Historical explainer');
    for (const source of entry.sources) { expect(citation).toContain(source.url); if (source.retrievedAt) expect(citation).toContain(source.retrievedAt); }
    expect(citation).not.toContain(new Date().toISOString());
  });
  it('exports only citation metadata and uses a section fragment rather than a second origin', () => {
    const entry = getContentEntry('deep-dive-tss');
    const citation = buildArticleCitation(entry, 'Current execution requires fresh checks.', 'markdown', 'https://external.example');
    expect(citation).toContain(`[${entry.title}](https://wiki.thorchain.no/deep-dives/tss)`);
    expect(citation).toContain('Citation metadata only');
    expect(citation).not.toContain('external.example');
  });
});
