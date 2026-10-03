import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTENT_ENTRIES, TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { SECURITY_INCIDENT_RECORDS } from '@/lib/data/static';

const exported = JSON.parse(readFileSync('public/knowledge/v1.json', 'utf8')) as {
  schemaVersion: number;
  checksum: { algorithm: string; value: string };
  entities: Array<{ id: string; summary: string; decision: string; route: string; source: { id: string; url: string } }>;
  routes: Array<{ id: string; registryId: string; href: string; reviewedAt: string; nextReviewDue: string }>;
  relationships: Array<{ type: string; from: string; to: string }>;
};

describe('metadata-only knowledge export', () => {
  it('has a checksummed v1 schema and preserves all three authored claim records', () => {
    const { checksum, ...payload } = exported;
    const expected = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
    expect(exported.schemaVersion).toBe(1);
    expect(checksum).toEqual({ algorithm: 'sha256', value: expected });
    const source = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')!;
    expect(exported.entities).toHaveLength(3);
    for (const claim of source.claims ?? []) {
      const entity = exported.entities.find(item => item.id === `claim:${claim.id}`);
      expect(entity).toMatchObject({ summary: claim.summary, decision: claim.decision, source: { url: claim.source.url } });
      expect(entity?.source.id).toMatch(/^source:[a-f0-9]{16}$/);
    }
    expect(exported.entities.find(item => item.id === 'claim:memoless-august-cycle')?.decision).toBe('needs-review');
    expect(exported.relationships).toContainEqual({ type: 'supersedes', from: 'claim:memoless-current-availability', to: 'claim:memoless-august-cycle' });
  });

  it('points to registered routes and existing claim anchors, with review dates preserved', () => {
    const registry = new Map(CONTENT_ENTRIES.map(entry => [entry.href, entry]));
    const expectedRoutes = ['/governance', '/deep-dives/build-query-data'];
    expect(exported.routes.map(route => route.href)).toEqual(expectedRoutes);
    for (const route of exported.routes) {
      expect(registry.get(route.href)).toMatchObject({ id: route.registryId, reviewedAt: route.reviewedAt, nextReviewDue: route.nextReviewDue });
      expect(route.id).toBe(`route:${route.registryId}`);
    }
    for (const entity of exported.entities) {
      const match = /^\/governance#claim-([a-z0-9-]+)$/.exec(entity.route);
      expect(match).not.toBeNull();
      expect(SECURITY_INCIDENT_RECORDS.flatMap(record => record.claims ?? []).some(claim => claim.id === match?.[1])).toBe(true);
    }
    expect(TASK_INTENT_GUIDES.find(guide => guide.id === 'build-query')?.href).toMatch(/^\/deep-dives\/build-query-data#/);
    const nodes = new Set([...exported.routes.map(route => route.id), ...exported.entities.map(entity => entity.id)]);
    for (const edge of exported.relationships) {
      expect(nodes.has(edge.from)).toBe(true);
      expect(nodes.has(edge.to)).toBe(true);
    }
  });
});
