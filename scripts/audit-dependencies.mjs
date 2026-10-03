import './require-node22.mjs';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const advisory = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const expires = '2026-10-10T00:00:00Z';
const buildPackages = new Set(['braces', 'micromatch', 'fast-glob', '@next/eslint-plugin-next', 'eslint-config-next', 'vite-plugin-dynamic-import', 'vite-plugin-commonjs', 'vinext', '@vinext/cloudflare']);

// Proposed for owner review when merging: only the known unpatched development
// advisory, at actual dev-only lockfile nodes. Never waive a production finding.
export function assessAudit(report, lock, now = Date.now()) {
  if (report?.auditReportVersion !== 2 || !report.vulnerabilities || !report.metadata?.vulnerabilities || !lock?.packages) throw new Error('Unrecognized npm audit or lockfile response.');
  const findings = Object.entries(report.vulnerabilities);
  const reportedCount = Object.entries(report.metadata.vulnerabilities).filter(([key]) => key !== 'total').map(([, value]) => value);
  if (findings.length === 0 && reportedCount.some(value => value > 0)) throw new Error('Audit counts contradict the empty findings.');
  const allowed = new Set();
  const visiting = new Set();
  function known(name) {
    if (allowed.has(name)) return true;
    if (visiting.has(name)) return false;
    visiting.add(name);
    const finding = report.vulnerabilities[name];
    const valid = now < Date.parse(expires) && buildPackages.has(name) && finding?.severity === 'high' &&
      Array.isArray(finding.nodes) && finding.nodes.length > 0 && finding.nodes.every(node => lock.packages[node]?.dev === true && (name !== 'braces' || lock.packages[node]?.version === '3.0.3')) &&
      Array.isArray(finding.via) && finding.via.length > 0 && finding.via.every(via => typeof via === 'string' ? known(via) : name === 'braces' && via?.url === advisory && via.name === 'braces' && via.range === '<=3.0.3' && via.severity === 'high');
    visiting.delete(name);
    if (valid) allowed.add(name);
    return valid;
  }
  const blocked = findings.filter(([, finding]) => !['info', 'low'].includes(finding?.severity)).filter(([name]) => !known(name)).map(([name]) => name);
  return { blocked, excepted: [...allowed].sort(), expires, advisory };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
  try {
    if (audit.error || ![0, 1].includes(audit.status)) throw new Error(audit.error?.message ?? `npm audit failed (${audit.status}): ${audit.stderr.trim()}`);
    const report = JSON.parse(audit.stdout);
    if (report.error) throw new Error(`npm audit could not complete: ${report.error.message ?? 'registry error'}`);
    const result = assessAudit(report, JSON.parse(readFileSync('package-lock.json', 'utf8')));
    if (result.excepted.length) console.warn(`REVIEW EXCEPTION: ${result.advisory}; dev-only packages ${result.excepted.join(', ')}; expires ${result.expires}. This is not a clean full audit.`);
    if (result.blocked.length) throw new Error(`Dependency audit blocks: ${result.blocked.join(', ')}`);
    console.log(`Full audit policy passed: ${result.excepted.length} development findings under the explicit review exception; production audit remains mandatory.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
