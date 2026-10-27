import './require-node22.mjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { buildReadinessIncidentUpdate, READINESS_INCIDENT_MARKER, READINESS_INCIDENT_TITLE } from './lib/readiness-monitor.mjs';

const [artifactPath] = process.argv.slice(2);
const repository = process.env.GITHUB_REPOSITORY;
if (!artifactPath || !repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error('Artifact path and GitHub repository are required.');
const evidence = JSON.parse(readFileSync(artifactPath, 'utf8'));
if (evidence.kind !== 'tcwiki-production-readiness-monitor' || evidence.schemaVersion !== 2 || !['pass', 'fail'].includes(evidence.status) || !evidence.incident || !evidence.observations) throw new Error('Monitor evidence is incomplete.');
const evidenceUrl = process.env.READINESS_ARTIFACT_URL || `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`;
function gh(args) {
  const result = spawnSync('gh', [...args, '--repo', repository], { encoding: 'utf8', timeout: 30000, maxBuffer: 1048576 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr ?? 'GitHub incident update failed.');
  return result.stdout;
}
const issues = JSON.parse(gh(['issue', 'list', '--state', 'open', '--search', `${READINESS_INCIDENT_TITLE} in:title`, '--limit', '100', '--json', 'number,title,body']))
  .filter(issue => issue.title === READINESS_INCIDENT_TITLE && (issue.body.includes(READINESS_INCIDENT_MARKER) || issue.body.startsWith('Three sampled production readiness checks had no ready observation.')));
const directory = dirname(artifactPath);
mkdirSync(directory, { recursive: true });
function bodyFile(name, text) { const path = join(directory, name); writeFileSync(path, `${text}\n`); return path; }
const update = buildReadinessIncidentUpdate(evidence, issues[0]?.body, evidenceUrl);
if (update.action === 'create') {
  const url = gh(['issue', 'create', '--title', READINESS_INCIDENT_TITLE, '--body-file', bodyFile('incident-body.md', update.body)]).trim();
  const created = JSON.parse(gh(['issue', 'view', url, '--json', 'body,url']));
  if (!created.body.includes(evidence.incident.fingerprint)) throw new Error('Created incident readback differs from evidence.');
  console.log(created.url);
} else if (update.action === 'update') {
  if (update.historyComment) gh(['issue', 'comment', String(issues[0].number), '--body-file', bodyFile('incident-history.md', update.historyComment)]);
  gh(['issue', 'edit', String(issues[0].number), '--body-file', bodyFile('incident-body.md', update.body)]);
} else if (update.action === 'recover') {
  for (const issue of issues) {
    gh(['issue', 'comment', String(issue.number), '--body-file', bodyFile('incident-recovery.md', update.recoveryComment)]);
    gh(['issue', 'close', String(issue.number)]);
  }
}
