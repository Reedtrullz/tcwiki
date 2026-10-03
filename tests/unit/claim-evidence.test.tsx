import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SECURITY_INCIDENT_RECORDS } from '@/lib/data/static';
import { SEARCH_DOCUMENTS } from '@/lib/search/registry';
import { ClaimCitations } from '@/components/features/ClaimCitations';
import { buildClaimReviewItems } from '@/lib/claim-evidence';

vi.mock('next/navigation', () => ({ usePathname: () => '/governance', useSearchParams: () => new URLSearchParams(), useRouter: () => ({ replace: vi.fn() }) }));

describe('bounded memoless claim evidence pilot', () => {
  it('keeps release support separate from unverified historical cycle and live availability', () => {
    const record = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')!;
    expect(record.freshness.checkedAt).toBe('2026-08-26');
    expect(record.freshness.nextReviewDue).toBe('2026-09-25');
    expect(record.claims?.map(claim => claim.id)).toEqual(['memoless-august-cycle', 'memoless-v320-handler-work', 'memoless-current-availability']);
    expect(record.claims?.[0]).toMatchObject({ scope: 'historical', decision: 'needs-review', reviewedAt: '2026-08-26' });
    expect(record.claims?.[1]).toMatchObject({ scope: 'historical', decision: 'supported', versionScope: 'THORNode v3.20.0', reviewedAt: '2026-10-03' });
    expect(record.claims?.[2]).toMatchObject({ scope: 'current-only', decision: 'needs-live-evidence', supersedes: 'memoless-august-cycle' });
    for (const claim of record.claims ?? []) expect(claim.source.url).toMatch(/^https:\/\//);
  });
  it('renders stable citations and explicit supersession without resetting record review dates', () => {
    const record = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')!;
    const html = renderToStaticMarkup(<ClaimCitations claims={record.claims ?? []} />);
    expect(html).toContain('claim-memoless-v320-handler-work');
    expect(html).toContain('needs-live-evidence');
    expect(html).toContain('memoless-august-cycle');
    expect(html).toContain('https://gitlab.com/thorchain/thornode/-/releases/v3.20.0');
    const items = buildClaimReviewItems(SECURITY_INCIDENT_RECORDS);
    expect(items.map(item => item.id)).toContain('memoless-v320-handler-work');
    expect(items.find(item => item.id === 'memoless-v320-handler-work')?.reviewedAt).toBe('2026-10-03');
    expect(SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')?.freshness.checkedAt).toBe('2026-08-26');
  });
  it('rejects missing sources, invalid dates, duplicate IDs and unresolved or cyclic supersession', () => {
    const original = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')!;
    const claim = original.claims![1];
    for (const claims of [[claim, claim], [{ ...claim, source: { label: 'invalid', url: 'javascript:alert(1)' } }], [{ ...claim, reviewedAt: '2026-02-30' }], [{ ...claim, supersedes: 'missing' }], [{ ...claim, supersedes: claim.id }]]) {
      expect(() => buildClaimReviewItems([{ ...original, claims }])).toThrow();
    }
  });
  it('makes scope searchable while retaining existing incident identity', () => {
    const doc = SEARCH_DOCUMENTS.find(doc => doc.id === 'incident:memoless-spam-2026-08');
    expect(doc?.content).toContain('memoless-v320-handler-work');
    expect(doc?.content).toContain('needs-live-evidence');
    expect(doc?.reviewedAt).toBe('2026-08-26');
  });
});
