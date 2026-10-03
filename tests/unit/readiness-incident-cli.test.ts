import { mkdtempSync, writeFileSync, readFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { buildReadinessMonitorEvidence } from '../../scripts/lib/readiness-monitor.mjs';

it('reconciles repeated windows, changed causes and recovery against a local fake GitHub CLI', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tcwiki-monitor-cli-'));
  try {
    const shim = join(directory, 'gh');
    const state = join(directory, 'state.json');
    writeFileSync(shim, `#!/usr/bin/env node
const fs = require('node:fs'); const path = process.env.MONITOR_TEST_STATE;
const state = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {issues:[],calls:[]};
const args = process.argv.slice(2); const command = args[1];
const bodyIndex = args.indexOf('--body-file'); const body = bodyIndex >= 0 ? fs.readFileSync(args[bodyIndex + 1], 'utf8') : undefined;
state.calls.push({command,body}); let output = '';
if (command === 'list') output = JSON.stringify(state.issues.filter(issue => issue.open));
if (command === 'create') {state.issues.push({number:1,title:args[args.indexOf('--title')+1],body,open:true,url:'https://github.com/test/test/issues/1'}); output = state.issues[0].url;}
if (command === 'view') output = JSON.stringify(state.issues[0]);
if (command === 'edit') state.issues[0].body = body;
if (command === 'close') state.issues[0].open = false;
fs.writeFileSync(path, JSON.stringify(state)); process.stdout.write(output);
`);
    chmodSync(shim, 0o755);
    const artifact = join(directory, 'evidence.json');
    const run = (ready: boolean, originHealthy = true) => {
      const evidence = buildReadinessMonitorEvidence({ baseUrl: 'https://wiki.test', startedAt: '2026-10-03T00:00:00Z', completedAt: '2026-10-03T00:02:00Z', samples: [{
        origin: { healthy: originHealthy },
        readiness: { ready, observationKey: 'receipt-one', sourceEvidence: ready ? [] : [{ family: 'THORNode', feature: 'Network operations', status: 'degraded', warnings: [{ category: 'freshness' }] }] },
      }] });
      writeFileSync(artifact, JSON.stringify(evidence));
      const result = spawnSync(process.execPath, ['scripts/update-readiness-incident.mjs', artifact], { encoding: 'utf8', timeout: 5000, env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, GITHUB_REPOSITORY: 'test/test', GITHUB_RUN_ID: '1', MONITOR_TEST_STATE: state, READINESS_ARTIFACT_URL: 'https://github.com/test/test/actions/runs/1/artifacts/2' } });
      expect(result.status, result.stderr).toBe(0);
    };
    run(false); run(false); run(false, false); run(true);
    const saved = JSON.parse(readFileSync(state, 'utf8')) as { issues: Array<{ open: boolean; body: string }>; calls: Array<{ command: string; body?: string }> };
    expect(saved.issues).toHaveLength(1);
    expect(saved.issues[0].open).toBe(false);
    expect(saved.calls.filter(call => call.command === 'create')).toHaveLength(1);
    expect(saved.calls.filter(call => call.command === 'edit')).toHaveLength(2);
    expect(saved.calls.filter(call => call.command === 'comment').map(call => call.body).join('\n')).toContain('Previous window retained');
    expect(saved.calls.filter(call => call.command === 'comment').map(call => call.body).join('\n')).toContain('not continuous uptime');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
