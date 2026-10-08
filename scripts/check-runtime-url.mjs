import './require-node22.mjs';
import { setTimeout as wait } from 'node:timers/promises';
import { assertReadinessContract } from './lib/readiness-contract.mjs';
import { assertRuntimeMetadataContract } from './lib/runtime-metadata-contract.mjs';

const baseUrl = (process.env.CHECK_BASE_URL ?? process.argv[2] ?? '').replace(/\/$/, '');
const expectedVersion = process.env.EXPECTED_VERSION;
const expectedCommit = process.env.EXPECTED_COMMIT_SHA ??
  (expectedVersion && /^[0-9a-f]{7,40}$/i.test(expectedVersion) ? expectedVersion : undefined);
const expectedImageRef = process.env.EXPECTED_IMAGE_REF;
const requireReady = process.env.REQUIRE_READY === '1';
const requireRuntimeMetadata = process.env.REQUIRE_RUNTIME_METADATA === '1' || shouldRequireRuntimeMetadata(baseUrl);
const enforcedCsp = process.env.CSP_ENFORCE === '1';
const budgetMs = Number(process.env.RUNTIME_PROBE_BUDGET_MS ?? 90_000);
if (!Number.isSafeInteger(budgetMs) || budgetMs < 250 || budgetMs > 90_000) throw new Error('RUNTIME_PROBE_BUDGET_MS must be250..90000.');
const deadline = performance.now() + budgetMs;

if (!baseUrl) {
  console.error('CHECK_BASE_URL or first argument is required.');
  process.exit(1);
}

function shouldRequireRuntimeMetadata(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1' && hostname !== '[::1]';
  } catch {
    return false;
  }
}

async function fetchUntil(path, isExpectedStatus, init = undefined) {
  let lastError;
  for (let attempt = 1; ; attempt += 1) {
    const remaining = deadline - performance.now();
    if (remaining <= 0) throw new Error('Runtime probe overall deadline exceeded.', { cause: lastError });
    const diagnostic = { path, attempt, elapsedMs: Math.floor(performance.now() - (deadline - budgetMs)), outcome: 'retry' };
    try {
      const response = await fetch(`${baseUrl}${path}`, { cache: 'no-store', ...init, signal: AbortSignal.timeout(Math.max(1, Math.floor(Math.min(5000, remaining)))) });
      diagnostic.status = response.status;
      if (await isExpectedStatus(response, diagnostic) && performance.now() < deadline) {
        diagnostic.outcome = 'match';
        return response;
      }
      lastError = new Error(`${path} returned ${response.status}`);
    } catch (error) {
      diagnostic.outcome = 'error';
      lastError = error;
    } finally {
      // Only allowlisted status/identity fields: never response bodies, URLs or headers.
      console.log(`Runtime probe attempt ${JSON.stringify(diagnostic)}`);
    }
    await wait(Math.max(0, Math.min(500, deadline - performance.now())));
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

function expectNoHeaderSubstring(headers, key, forbidden) {
  const value = headers.get(key);
  if (value?.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`Expected ${key} not to include ${forbidden}; got ${value}`);
  }
}

async function expectCspReportEndpoint() {
  const response = await fetchUntil('/api/csp-report', (candidate) => candidate.status === 204, {
    method: 'POST',
    headers: {
      'content-type': 'application/csp-report',
    },
    body: '{}',
  });
  expectHeader(response.headers, 'cache-control', 'no-store');
}

function expectRuntimeMetadata(json, diagnostic = undefined) {
  if (diagnostic) {
    if (typeof json.commit === 'string' && /^[0-9a-f]{7,40}$/i.test(json.commit)) diagnostic.commit = json.commit;
    if (typeof json.image === 'string') {
      const digest = json.image.match(/@sha256:([0-9a-f]{64})$/i)?.[1];
      if (digest) diagnostic.artifactDigest = digest;
    }
    if (typeof json.runtime?.strict === 'boolean') diagnostic.strict = json.runtime.strict;
    if (typeof json.runtime?.verified === 'boolean') diagnostic.verified = json.runtime.verified;
  }
  if (expectedVersion && json.version !== expectedVersion) {
    throw new Error(`Expected version ${expectedVersion}; got ${json.version ?? 'missing'}`);
  }
  if (expectedCommit && json.commit !== expectedCommit) {
    throw new Error(`Expected commit ${expectedCommit}; got ${json.commit ?? 'missing'}`);
  }
  if (expectedImageRef && json.image !== expectedImageRef) {
    throw new Error(`Expected image ${expectedImageRef}; got ${json.image ?? 'missing'}`);
  }
  assertRuntimeMetadataContract(json, {
    requireVerified: requireRuntimeMetadata,
    requireStrict: requireRuntimeMetadata,
  });
}

async function hasExpectedRuntime(response, diagnostic) {
  if (!response.ok) return false;
  const json = await response.clone().json();
  expectRuntimeMetadata(json, diagnostic);
  return true;
}

const health = await fetchUntil('/api/health', hasExpectedRuntime);
const healthJson = await health.json();
if (healthJson.status !== 'healthy' || !healthJson.commit || !healthJson.image) {
  throw new Error(`Unexpected health response: ${JSON.stringify(healthJson)}`);
}
expectRuntimeMetadata(healthJson);
expectHeader(health.headers, 'cache-control', 'no-store');

const version = await fetchUntil('/api/version', hasExpectedRuntime);
const versionJson = await version.json();
if (!versionJson.version || !versionJson.commit || !versionJson.image) {
  throw new Error(`Unexpected version response: ${JSON.stringify(versionJson)}`);
}
expectRuntimeMetadata(versionJson);
expectHeader(version.headers, 'cache-control', 'no-store');

const ready = await fetchUntil(
  '/api/ready',
  async (response, diagnostic) => {
    if (response.status !== 200 && (requireReady || response.status !== 503)) return false;
    // Degraded readiness (503) still needs its own exact runtime identity check.
    if (response.status === 503) {
      expectRuntimeMetadata(await response.clone().json(), diagnostic);
      return true;
    }
    return hasExpectedRuntime(response, diagnostic);
  }
);
const readyJson = await ready.json();
assertReadinessContract(readyJson);
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
const unexpectedCspHeader = enforcedCsp ? 'content-security-policy-report-only' : 'content-security-policy';
expectHeader(rootResponse.headers, cspHeader, 'report-uri /api/csp-report');
if (rootResponse.headers.has(unexpectedCspHeader)) {
  throw new Error(`Expected ${unexpectedCspHeader} to be absent when checking ${cspHeader}`);
}
expectNoHeaderSubstring(rootResponse.headers, cspHeader, 'unsafe-eval');
expectNoHeaderSubstring(rootResponse.headers, cspHeader, 'unsafe-inline');
await expectCspReportEndpoint();

if (performance.now() >= deadline) throw new Error('Runtime probe overall deadline exceeded.');
console.log(`Runtime probe passed for ${baseUrl}.`);
