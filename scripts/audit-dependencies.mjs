import './require-node22.mjs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Full (production + development) dependency audit. Any finding above `low`
// blocks. The former braces/micromatch development review exception
// (GHSA-vfj7-8cjw-p6xm) expired on 2026-10-10 and those packages are no longer
// in the tree, so no exception remains. Never waive a production finding here.
export function assessAudit(report) {
  if (!report || typeof report !== 'object' || !report.advisories || typeof report.advisories !== 'object' || !report.metadata?.vulnerabilities) {
    throw new Error('Unrecognized pnpm audit response.');
  }
  const advisories = Object.values(report.advisories);
  const reportedCount = Object.values(report.metadata.vulnerabilities);
  if (advisories.length === 0 && reportedCount.some(value => value > 0)) throw new Error('Audit counts contradict the empty findings.');
  const blocked = [...new Set(advisories
    .filter(advisory => !['info', 'low'].includes(advisory?.severity))
    .map(advisory => advisory?.module_name ?? 'unknown'))].sort();
  return { blocked };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const audit = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8', timeout: 60000, maxBuffer: 8 * 1024 * 1024 });
  try {
    if (audit.error || ![0, 1].includes(audit.status)) throw new Error(audit.error?.message ?? `pnpm audit failed (${audit.status}): ${audit.stderr.trim()}`);
    const report = JSON.parse(audit.stdout);
    if (report.error) throw new Error(`pnpm audit could not complete: ${report.error.message ?? report.error.code ?? 'registry error'}`);
    const result = assessAudit(report);
    if (result.blocked.length) throw new Error(`Dependency audit blocks: ${result.blocked.join(', ')}`);
    console.log('Full audit policy passed: no moderate, high or critical findings in production or development dependencies.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
