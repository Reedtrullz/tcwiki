import { describe, expect, it } from 'vitest';
import { assessAudit } from '../../scripts/audit-dependencies.mjs';

function fixture() {
  return {
    report: { auditReportVersion: 2, metadata: { vulnerabilities: { high: 2 } }, vulnerabilities: {
      braces: { severity: 'high', nodes: ['node_modules/braces'], via: [{ name: 'braces', url: 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm', severity: 'high', range: '<=3.0.3' }] },
      micromatch: { severity: 'high', nodes: ['node_modules/micromatch'], via: ['braces'] },
    } },
    lock: { packages: { 'node_modules/braces': { version: '3.0.3', dev: true }, 'node_modules/micromatch': { version: '4.0.8', dev: true } } },
  };
}
const now = Date.parse('2026-10-03T00:00:00Z');
describe('bounded build advisory review exception', () => {
  it('reports the known development chain explicitly without calling it a clean audit', () => {
    const { report, lock } = fixture();
    expect(assessAudit(report, lock, now)).toMatchObject({ blocked: [], excepted: ['braces', 'micromatch'] });
  });
  it('blocks the same advisory when a lockfile node is in production', () => {
    const { report, lock } = fixture(); lock.packages['node_modules/braces'].dev = false;
    expect(assessAudit(report, lock, now).blocked).toEqual(['braces', 'micromatch']);
  });
  it('blocks a second advisory on the same package and its dependent', () => {
    const { report, lock } = fixture(); report.vulnerabilities.braces.via.push({ name: 'braces', url: 'https://github.com/advisories/another', severity: 'high', range: '<=3.0.3' });
    expect(assessAudit(report, lock, now).blocked).toEqual(['braces', 'micromatch']);
  });
  it('expires exactly at the review deadline', () => {
    const { report, lock } = fixture();
    expect(assessAudit(report, lock, Date.parse('2026-10-10T00:00:00Z')).blocked).toEqual(['braces', 'micromatch']);
  });
  it('rejects absent lock nodes, changed versions, malformed reports and cycles', () => {
    const { report, lock } = fixture(); lock.packages['node_modules/braces'].version = '3.0.2';
    expect(assessAudit(report, lock, now).blocked).toContain('braces');
    delete (lock.packages as Partial<typeof lock.packages>)['node_modules/micromatch'];
    expect(assessAudit(report, lock, now).blocked).toContain('micromatch');
    expect(() => assessAudit({ error: 'registry unavailable' }, lock, now)).toThrow('Unrecognized');
    const cyclic = fixture(); cyclic.report.vulnerabilities.micromatch.via = ['micromatch'];
    expect(assessAudit(cyclic.report, cyclic.lock, now).blocked).toContain('micromatch');
  });
});
