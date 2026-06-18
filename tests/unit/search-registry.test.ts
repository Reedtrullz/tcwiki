import { describe, expect, it } from 'vitest';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';

function docsMatching(term: string) {
  const needle = term.toLowerCase();
  return SEARCH_DOCUMENTS.filter((doc) =>
    `${doc.title} ${doc.content}`.toLowerCase().includes(needle)
  );
}

describe('SEARCH_DOCUMENTS', () => {
  it('includes deep-dive bodies and curated records', () => {
    expect(docsMatching('self-correcting').some((doc) => doc.slug === '/deep-dives/incentive-pendulum')).toBe(true);
    expect(docsMatching('universal settlement').some((doc) => doc.slug === '/deep-dives/rune-settlement')).toBe(true);
    expect(docsMatching('traditional multisig').some((doc) => doc.slug === '/deep-dives/tss')).toBe(true);
    expect(docsMatching('GG20 Vault Exploit').some((doc) => doc.slug === '/governance')).toBe(true);
  });

  it('does not slice curated incidents or ecosystem records', () => {
    expect(docsMatching('Post-Bybit').some((doc) => doc.slug === '/governance')).toBe(true);
    expect(docsMatching('SwapKit').some((doc) => doc.slug === '/ecosystem')).toBe(true);
  });

  it('uses stable ids even when multiple records share a slug', () => {
    const ids = new Set(SEARCH_DOCUMENTS.map((doc) => doc.id));
    expect(ids.size).toBe(SEARCH_DOCUMENTS.length);
    expect(SEARCH_DOCUMENTS.filter((doc) => doc.slug === '/governance').length).toBeGreaterThan(1);
  });
});
