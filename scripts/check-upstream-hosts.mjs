import { lookup } from 'node:dns/promises';
import { MIDGARD_PROVIDER_DEFAULTS } from './lib/upstream-hosts.mjs';
import { THORNODE_PROVIDER_DEFAULTS } from './lib/thornode-data-policy.mjs';

const DNS_TIMEOUT_MS = 5000;
const HTTP_TIMEOUT_MS = 8000;

const providers = [
  ...MIDGARD_PROVIDER_DEFAULTS.map(({ label, url }) => ({ label, url, family: 'Midgard', probe: `${url}/health` })),
  ...THORNODE_PROVIDER_DEFAULTS
    .filter(({ retired }) => !retired)
    .map(({ label, url }) => ({ label, url, family: 'THORNode', probe: `${url}/version` })),
];

const hosts = [...new Set(providers.map(({ url }) => new URL(url).hostname))].sort();
const failures = [];

async function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function retry(operation, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function resolveHost(host) {
  return retry(async () => {
    const addresses = await withTimeout(lookup(host, { all: true }), DNS_TIMEOUT_MS, `DNS lookup for ${host} timed out`);
    if (!addresses.length) throw new Error(`${host} resolved to no addresses`);
    return addresses.map(({ address }) => address).join(', ');
  });
}

async function probe(url) {
  return retry(async () => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`returned HTTP ${response.status}`);
    return `HTTP ${response.status}`;
  });
}

for (const host of hosts) {
  try {
    console.log(`host ${host}: ${await resolveHost(host)}`);
  } catch (error) {
    const message = `${host} did not resolve: ${error instanceof Error ? error.message : error}`;
    failures.push(message);
    console.error(`FAIL ${message}`);
  }
}

for (const provider of providers) {
  try {
    console.log(`${provider.family} ${provider.label}: ${await probe(provider.probe)}`);
  } catch (error) {
    const message = `${provider.label} probe ${provider.probe}: ${error instanceof Error ? error.message : error}`;
    failures.push(message);
    console.error(`FAIL ${message}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} upstream host check(s) failed. Retired providers are skipped by design.`);
  process.exit(1);
}

console.log(`\nAll ${providers.length} live providers answered and ${hosts.length} host(s) resolved.`);
