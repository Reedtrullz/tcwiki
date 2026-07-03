import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { dirname, join } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { prepareStandaloneAssets } from './prepare-standalone-assets.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const serverPath = join(root, '.next/standalone/server.js');
const expectedVersion = process.env.APP_VERSION ?? 'standalone-smoke';
const expectedCommit = process.env.COMMIT_SHA ?? 'standalone-smoke';
const expectedImage = process.env.IMAGE_REF ?? 'standalone-smoke';
const requireReady = process.env.REQUIRE_READY === '1';
const enforcedCsp = process.env.CSP_ENFORCE === '1';

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Could not allocate a smoke-test port.')));
        return;
      }
      const allocatedPort = String(address.port);
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(allocatedPort);
      });
    });
  });
}

const port = process.env.SMOKE_PORT ?? await getFreePort();
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
    APP_VERSION: expectedVersion,
    COMMIT_SHA: expectedCommit,
    IMAGE_REF: expectedImage,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
let childExit;
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});
child.once('exit', (code, signal) => {
  childExit = { code, signal };
});

function assertChildAlive() {
  if (childExit) {
    throw new Error(`Standalone server exited early with code ${childExit.code ?? 'null'} and signal ${childExit.signal ?? 'null'}.`);
  }
}

async function fetchUntilReady(path) {
  return fetchUntilStatus(path, (response) => response.ok);
}

async function fetchUntilStatus(path, isExpectedStatus) {
  let lastError;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    assertChildAlive();
    try {
      const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store' });
      if (isExpectedStatus(response)) {
        assertChildAlive();
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

function expectRuntimeMetadata(json) {
  if (json.version !== expectedVersion) {
    throw new Error(`Expected version ${expectedVersion}; got ${json.version ?? 'missing'}`);
  }
  if (json.commit !== expectedCommit) {
    throw new Error(`Expected commit ${expectedCommit}; got ${json.commit ?? 'missing'}`);
  }
  if (json.image !== expectedImage) {
    throw new Error(`Expected image ${expectedImage}; got ${json.image ?? 'missing'}`);
  }
}

function expectHeader(headers, key, expected) {
  const value = headers.get(key);
  if (!value || !value.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`Expected ${key} to include ${expected}; got ${value ?? 'missing'}`);
  }
}

function expectHeaderDirectives(headers, key, expectedDirectives) {
  const value = headers.get(key);
  if (!value) {
    throw new Error(`Expected ${key} to include ${expectedDirectives.join(', ')}; got missing`);
  }
  const missing = expectedDirectives.filter((directive) => !value.toLowerCase().includes(directive.toLowerCase()));
  if (missing.length > 0) {
    throw new Error(`Expected ${key} to include ${missing.join(', ')}; got ${value}`);
  }
}

try {
  const health = await fetchUntilReady('/api/health');
  const healthJson = await health.json();
  if (healthJson.status !== 'healthy' || !healthJson.commit || !healthJson.image) {
    throw new Error(`Unexpected health response: ${JSON.stringify(healthJson)}`);
  }
  expectRuntimeMetadata(healthJson);
  expectHeader(health.headers, 'cache-control', 'no-store');

  const version = await fetchUntilReady('/api/version');
  const versionJson = await version.json();
  if (!versionJson.version || !versionJson.commit || !versionJson.image) {
    throw new Error(`Unexpected version response: ${JSON.stringify(versionJson)}`);
  }
  expectRuntimeMetadata(versionJson);
  expectHeader(version.headers, 'cache-control', 'no-store');

  const ready = await fetchUntilStatus(
    '/api/ready',
    (response) => requireReady ? response.status === 200 : response.status === 200 || response.status === 503
  );
  const readyJson = await ready.json();
  if (!['ready', 'degraded'].includes(readyJson.status) || typeof readyJson.ready !== 'boolean' || !readyJson.version || !readyJson.sources?.midgard || !readyJson.sources?.thornode) {
    throw new Error(`Unexpected readiness response: ${JSON.stringify(readyJson)}`);
  }
  expectRuntimeMetadata(readyJson);
  expectHeader(ready.headers, 'cache-control', 'no-store');
  if (requireReady && (readyJson.status !== 'ready' || readyJson.ready !== true)) {
    throw new Error(`Readiness degraded: ${JSON.stringify(readyJson.reasons ?? [])}`);
  }
  if (!requireReady && ready.status === 503) {
    console.warn(`Readiness degraded but non-blocking for standalone smoke: ${JSON.stringify(readyJson.reasons ?? [])}`);
  }

  const rootResponse = await fetchUntilReady('/');
  if (rootResponse.headers.has('x-powered-by')) {
    throw new Error('x-powered-by header should be disabled');
  }
  expectHeader(rootResponse.headers, 'strict-transport-security', 'max-age=31536000');
  expectHeader(rootResponse.headers, 'x-content-type-options', 'nosniff');
  expectHeader(rootResponse.headers, 'x-frame-options', 'DENY');
  expectHeader(rootResponse.headers, 'referrer-policy', 'strict-origin-when-cross-origin');
  expectHeaderDirectives(rootResponse.headers, 'permissions-policy', [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ]);
  const cspHeader = enforcedCsp ? 'content-security-policy' : 'content-security-policy-report-only';
  expectHeader(rootResponse.headers, cspHeader, 'report-uri /api/csp-report');
  const csp = rootResponse.headers.get(cspHeader) ?? '';
  if (csp.includes('unsafe-eval')) {
    throw new Error('Production CSP policy must not include unsafe-eval.');
  }
  if (csp.includes('unsafe-inline')) {
    throw new Error('Production CSP policy must not include unsafe-inline.');
  }

  console.log(`Standalone smoke passed${enforcedCsp ? ' with enforced CSP' : ''}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(output);
  process.exitCode = 1;
} finally {
  child.kill('SIGTERM');
  await wait(500);
}
