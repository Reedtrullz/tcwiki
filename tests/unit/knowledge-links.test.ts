import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CONTENT_ENTRIES, TASK_INTENT_GUIDES } from '@/lib/content/registry';
import { SECURITY_INCIDENT_RECORDS } from '@/lib/data/static';

const { validateKnowledgeLinks } = await import('../../scripts/lib/knowledge-links.mjs');
const claims = SECURITY_INCIDENT_RECORDS.find(record => record.data.id === 'memoless-spam-2026-08')!.claims!;
const taskHref = TASK_INTENT_GUIDES.find(guide => guide.id === 'build-query')!.href;
const input = { entries: CONTENT_ENTRIES, claims, taskHref, readSource: (path: string) => readFileSync(path, 'utf8') };

describe('knowledge link and generation boundaries', () => {
  it('rejects a deleted registered route, section or superseded claim', () => {
    expect(() => validateKnowledgeLinks(input)).not.toThrow();
    expect(() => validateKnowledgeLinks({ ...input, entries: CONTENT_ENTRIES.filter(entry => entry.href !== '/governance') })).toThrow(/Deleted knowledge route/);
    expect(() => validateKnowledgeLinks({ ...input, readSource: () => '# Builder guide\n\n## Unrelated heading\n' })).toThrow(/Deleted knowledge section/);
    expect(() => validateKnowledgeLinks({ ...input, claims: claims.filter(claim => claim.id !== 'memoless-august-cycle') })).toThrow(/Deleted knowledge claim/);
  });
  it('regenerates identically and checks exact public output without changing it', () => {
    const before = ['public/knowledge/v1.json', 'public/llms.txt'].map(path => readFileSync(path, 'utf8'));
    for (const argument of [[], ['--check']]) {
      const result = spawnSync(process.execPath, ['scripts/generate-knowledge.mjs', ...argument], { encoding: 'utf8', timeout: 15000 });
      expect(result.status, result.stderr).toBe(0);
      expect(['public/knowledge/v1.json', 'public/llms.txt'].map(path => readFileSync(path, 'utf8'))).toEqual(before);
    }
  });
});
