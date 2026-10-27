import type { SourcedRecord } from '@/lib/types';

/** Optional pilot claims form review tasks without promoting their parent record. */
export function buildClaimReviewItems(records: SourcedRecord<{ id: string }>[]) {
  const ids = new Set<string>();
  return records.flatMap(record => (record.claims ?? []).map(claim => {
    for (const field of ['id', 'summary', 'observedAt', 'versionScope', 'reviewedAt', 'nextReviewDue', 'limitation'] as const) {
      if (!claim[field]?.trim()) throw new Error(`Claim evidence needs ${field}`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(claim.id)) throw new Error('Claim ID must be a stable slug');
    if (!['current-only', 'historical', 'design'].includes(claim.scope) || !['supported', 'needs-review', 'needs-live-evidence', 'superseded'].includes(claim.decision)) throw new Error('Invalid claim scope or decision');
    if (claim.decision === 'needs-live-evidence' && claim.scope !== 'current-only') throw new Error('Live evidence needs current-only scope');
    for (const value of [claim.observedAt, claim.reviewedAt, claim.nextReviewDue]) {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value) throw new Error('Invalid claim calendar date');
    }
    if (claim.nextReviewDue < claim.reviewedAt) throw new Error('Claim due date precedes review');
    const source = new URL(claim.source.url);
    if (source.protocol !== 'https:' || source.username || source.password || !claim.source.label.trim()) throw new Error('Claim needs public HTTPS source');
    let cursor = claim;
    const path = new Set<string>();
    while (cursor.supersedes) {
      if (path.has(cursor.id)) throw new Error('Cyclic claim supersession');
      path.add(cursor.id);
      const parent = record.claims?.find(candidate => candidate.id === cursor.supersedes);
      if (!parent) throw new Error(`Unresolved superseding claim ${cursor.supersedes}`);
      cursor = parent;
    }
    if (ids.has(claim.id)) throw new Error(`Duplicate claim evidence ${claim.id}`);
    ids.add(claim.id);
    if (claim.supersedes && !record.claims?.some(candidate => candidate.id === claim.supersedes)) throw new Error(`Unresolved superseding claim ${claim.supersedes}`);
    return { id: claim.id, collection: 'CLAIM_EVIDENCE', label: claim.summary,
      path: `src/lib/data/static.ts#${record.data.id}/${claim.id}`, reviewedAt: claim.reviewedAt, nextReviewDue: claim.nextReviewDue,
      sourceUrls: [claim.source.url], scope: claim.scope, decision: claim.decision };
  }));
}
