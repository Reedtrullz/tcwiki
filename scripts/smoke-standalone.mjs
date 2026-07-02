import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { prepareStandaloneAssets } from './prepare-standalone-assets.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const serverPath = join(root, '.next/standalone/server.js');
const port = process.env.SMOKE_PORT ?? '3010';
const baseUrl = `http://127.0.0.1:${port}`;

try {
  prepareStandaloneAssets(root);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const child = spawn(process.execPath, [serverPath], {
  cwd: root,
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: '127.0.0.1',
    APP_VERSION: process.env.APP_VERSION ?? 'standalone-smoke',
    COMMIT_SHA: process.env.COMMIT_SHA ?? 'standalone-smoke',
    IMAGE_REF: process.env.IMAGE_REF ?? 'standalone-smoke',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

async function fetchUntilReady(path) {
  return fetchUntilStatus(path, (response) => response.ok);
}

async function fetchUntilStatus(path, isExpectedStatus) {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
      if (isExpectedStatus(response)) {
        return response;
      }
      lastError = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(500);
  }
  throw lastError ?? new Error(`${path} did not become ready`);
}

function expectHeader(headers, key, expected) {
  const value = headers.get(key);
  if (!value || !value.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`Expected ${key} to include ${expected}; got ${value ?? 'missing'}`);
  }
}

try {
  const health = await fetchUntilReady('/api/health');
  const healthJson = await health.json();
  if (healthJson.status !== 'healthy' || !healthJson.commit || !healthJson.image) {
    throw new Error(`Unexpected health response: ${JSON.stringify(healthJson)}`);
  }
  expectHeader(health.headers, 'cache-control', 'no-store');

  const version = await fetchUntilReady('/api/version');
  const versionJson = await version.json();
  if (!versionJson.version || !versionJson.commit || !versionJson.image) {
    throw new Error(`Unexpected version response: ${JSON.stringify(versionJson)}`);
  }
  expectHeader(version.headers, 'cache-control', 'no-store');

  const ready = await fetchUntilStatus('/api/ready', (response) => response.status === 200 || response.status === 503);
  const readyJson = await ready.json();
  if (!['ready', 'degraded'].includes(readyJson.status) || !readyJson.version || !readyJson.sources?.midgard || !readyJson.sources?.thornode) {
    throw new Error(`Unexpected readiness response: ${JSON.stringify(readyJson)}`);
  }
  expectHeader(ready.headers, 'cache-control', 'no-store');

  const rootResponse = await fetchUntilReady('/');
  if (rootResponse.headers.has('x-powered-by')) {
    throw new Error('x-powered-by header should be disabled');
  }
  expectHeader(rootResponse.headers, 'strict-transport-security', 'max-age=31536000');
  expectHeader(rootResponse.headers, 'x-content-type-options', 'nosniff');
  expectHeader(rootResponse.headers, 'x-frame-options', 'DENY');
  expectHeader(rootResponse.headers, 'content-security-policy-report-only', 'report-uri /api/csp-report');

  console.log('Standalone smoke passed.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(output);
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
  await wait(500);
}
