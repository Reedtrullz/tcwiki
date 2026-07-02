import { setTimeout as wait } from 'node:timers/promises';

const baseUrl = (process.env.CHECK_BASE_URL ?? process.argv[2] ?? '').replace(/\/$/, '');
const expectedVersion = process.env.EXPECTED_VERSION;
const expectedCommit = process.env.EXPECTED_COMMIT_SHA ??
  (expectedVersion && /^[0-9a-f]{7,40}$/i.test(expectedVersion) ? expectedVersion : undefined);
const expectedImageRef = process.env.EXPECTED_IMAGE_REF;
const requireReady = process.env.REQUIRE_READY === '1';
const enforcedCsp = process.env.CSP_ENFORCE === '1';

if (!baseUrl) {
  console.error('CHECK_BASE_URL or first argument is required.');
  process.exit(1);
}

async function fetchUntil(path, isExpectedStatus) {
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

function expectNoHeaderSubstring(headers, key, forbidden) {
  const value = headers.get(key);
  if (value?.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Expected ${key} not to include ${forbidden}; got ${value}`);
  }
}

function expectRuntimeMetadata(json) {
  if (expectedVersion && json.version !== expectedVersion) {
    throw new Error(`Expected version ${expectedVersion}; got ${json.version ?? 'missing'}`);
  }
  if (expectedCommit && json.commit !== expectedCommit) {
    throw new Error(`Expected commit ${expectedCommit}; got ${json.commit ?? 'missing'}`);
  }
  if (expectedImageRef && json.image !== expectedImageRef) {
    throw new Error(`Expected image ${expectedImageRef}; got ${json.image ?? 'missing'}`);
  }
}

const health = await fetchUntil('/api/health', (response) => response.ok);
const healthJson = await health.json();
if (healthJson.status !== 'healthy' || !healthJson.commit || !healthJson.image) {
  throw new Error(`Unexpected health response: ${JSON.stringify(healthJson)}`);
}
expectRuntimeMetadata(healthJson);
expectHeader(health.headers, 'cache-control', 'no-store');

const version = await fetchUntil('/api/version', (response) => response.ok);
const versionJson = await version.json();
if (!versionJson.version || !versionJson.commit || !versionJson.image) {
  throw new Error(`Unexpected version response: ${JSON.stringify(versionJson)}`);
}
expectRuntimeMetadata(versionJson);
expectHeader(version.headers, 'cache-control', 'no-store');

const ready = await fetchUntil(
  '/api/ready',
  (response) => requireReady ? response.status === 200 : response.status === 200 || response.status === 503
);
const readyJson = await ready.json();
if (!['ready', 'degraded'].includes(readyJson.status) || typeof readyJson.ready !== 'boolean' || !readyJson.sources?.midgard || !readyJson.sources?.thornode) {
  throw new Error(`Unexpected readiness response: ${JSON.stringify(readyJson)}`);
}
expectRuntimeMetadata(readyJson);
expectHeader(ready.headers, 'cache-control', 'no-store');
if (requireReady && (readyJson.status !== 'ready' || readyJson.ready !== true)) {
  throw new Error(`Readiness degraded: ${JSON.stringify(readyJson.reasons ?? [])}`);
}
if (!requireReady && ready.status === 503) {
  console.warn(`Readiness degraded but non-blocking for this runtime probe: ${JSON.stringify(readyJson.reasons ?? [])}`);
}

const rootResponse = await fetchUntil('/', (response) => response.ok);
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
expectNoHeaderSubstring(rootResponse.headers, cspHeader, 'unsafe-eval');
expectNoHeaderSubstring(rootResponse.headers, cspHeader, 'unsafe-inline');

console.log(`Runtime probe passed for ${baseUrl}.`);
