import './require-node22.mjs';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { verifyCloudflareManifest } from './lib/cloudflare-artifact.mjs';

const manifest = verifyCloudflareManifest(process.cwd(), JSON.parse(readFileSync('.artifacts/cloudflare-manifest.json', 'utf8')));
console.log(`Testing built WikiDO artifact ${manifest.digest} (${manifest.commit}); runtime verified describes metadata validation only.`);
const vars = { ...manifest.vars, APP_VERSION: manifest.commit, COMMIT_SHA: manifest.commit, IMAGE_REF: `cloudflare-worker@sha256:${manifest.digest}` };
const child = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--config', 'wrangler.do.jsonc', '--port', '3015', '--ip', '127.0.0.1', ...Object.entries(vars).flatMap(([key, value]) => ['--var', `${key}:${value}`])], { stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => process.exit(code ?? 1));
