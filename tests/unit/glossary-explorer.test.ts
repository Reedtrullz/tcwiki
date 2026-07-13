import { describe, expect, it } from 'vitest';
import {
  termMatchesQuery,
  type GlossaryExplorerTerm,
} from '@/components/features/GlossaryExplorer';

const thornameTerm: GlossaryExplorerTerm = {
  id: 'thorname',
  term: 'THORName',
  definition: 'A THORChain L1 vanity-name record. It does not by itself prove route quality.',
  category: 'developer',
  confidence: 'official',
  reviewedAt: '2026-07-09',
  nextReviewDue: '2026-08-09',
  sources: [{
    label: 'THORName affiliate guide',
    url: 'https://dev.thorchain.org/affiliate-guide/thorname-guide.html',
  }],
  relatedLinks: [{
    href: '/glossary#term-affiliate-fee',
    label: 'Glossary: Term Affiliate Fee',
  }],
};

describe('termMatchesQuery', () => {
  it('does not combine unrelated fields into a false-positive match', () => {
    expect(termMatchesQuery(thornameTerm, 'not a thorchain term')).toBe(false);
  });

  it('still searches terms, definitions, source labels, and proof links', () => {
    expect(termMatchesQuery(thornameTerm, 'thorname')).toBe(true);
    expect(termMatchesQuery(thornameTerm, 'route quality')).toBe(true);
    expect(termMatchesQuery(thornameTerm, 'affiliate guide')).toBe(true);
    expect(termMatchesQuery(thornameTerm, 'term affiliate fee')).toBe(true);
  });
});
