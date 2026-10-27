import { describe, expect, it } from 'vitest';
import { assessAudit } from '../../scripts/audit-dependencies.mjs';

function advisory(module_name: string, severity: string) {
  return { module_name, severity, url: `https://github.com/advisories/${module_name}`, findings: [{ version: '1.0.0', paths: [`.>${module_name}`] }] };
}

describe('full dependency audit policy (pnpm audit --json)', () => {
  it('passes a clean report', () => {
    expect(assessAudit({ advisories: {}, metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0 } } })).toEqual({ blocked: [] });
  });
  it('ignores info and low findings', () => {
    const report = { advisories: { 1: advisory('a', 'low'), 2: advisory('b', 'info') }, metadata: { vulnerabilities: { info: 1, low: 1 } } };
    expect(assessAudit(report).blocked).toEqual([]);
  });
  it('blocks moderate, high and critical findings once per package', () => {
    const report = { advisories: { 1: advisory('braces', 'high'), 2: advisory('braces', 'moderate'), 3: advisory('next', 'critical'), 4: advisory('x', 'low') }, metadata: { vulnerabilities: { low: 1, moderate: 1, high: 1, critical: 1 } } };
    expect(assessAudit(report).blocked).toEqual(['braces', 'next']);
  });
  it('no longer excepts the expired braces development advisory', () => {
    const report = { advisories: { 1: advisory('braces', 'high') }, metadata: { vulnerabilities: { high: 1 } } };
    expect(assessAudit(report).blocked).toEqual(['braces']);
  });
  it('rejects malformed reports and contradictory counts', () => {
    expect(() => assessAudit({ error: 'registry unavailable' })).toThrow('Unrecognized');
    expect(() => assessAudit({ auditReportVersion: 2, vulnerabilities: {}, metadata: { vulnerabilities: {} } })).toThrow('Unrecognized');
    expect(() => assessAudit({ advisories: {}, metadata: { vulnerabilities: { high: 1 } } })).toThrow('contradict');
  });
});
