import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const jiti = createJiti(import.meta.url, {
  alias: {
    '@': join(root, 'src'),
  },
  moduleCache: false,
});

const { CHAIN_RECORDS } = await jiti.import(join(root, 'src/lib/data/static.ts'));

const THORNODE_SOURCES = [
  {
    label: 'Liquify THORNode',
    url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain/inbound_addresses',
  },
  {
    label: 'THORChain THORNode',
    url: 'https://thornode.thorchain.network/thorchain/inbound_addresses',
  },
];

async function fetchJson(source) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(source.url, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return await response.json();
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

async function fetchInboundAddresses() {
  const errors = [];

  for (const source of THORNODE_SOURCES) {
    try {
      const data = await fetchJson(source);
      if (!Array.isArray(data)) {
        throw new Error('response was not an array');
      }
      return { source, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      errors.push(`${source.label}: ${message}`);
    }
  }

  throw new Error(`No THORNode inbound_addresses source responded with usable data (${errors.join('; ')})`);
}

function chainSet(chains) {
  return new Set(chains.map((chain) => String(chain).toUpperCase()).filter(Boolean));
}

const curatedChains = chainSet(
  CHAIN_RECORDS
    .filter((record) => record.data.supported)
    .map((record) => record.data.chain)
);

const { source, data } = await fetchInboundAddresses();
const liveChains = chainSet(data.map((item) => item?.chain));

const missingFromLive = [...curatedChains].filter((chain) => !liveChains.has(chain)).sort();
const missingFromCurated = [...liveChains].filter((chain) => !curatedChains.has(chain)).sort();

if (missingFromLive.length > 0 || missingFromCurated.length > 0) {
  console.error('THORChain inbound_addresses chain snapshot drift detected.');
  console.error(`Source: ${source.label} (${source.url})`);
  if (missingFromLive.length > 0) {
    console.error(`Curated but missing live: ${missingFromLive.join(', ')}`);
  }
  if (missingFromCurated.length > 0) {
    console.error(`Live but missing curated: ${missingFromCurated.join(', ')}`);
  }
  process.exit(1);
}

console.log(`Live chain snapshot matches curated supported chains via ${source.label}: ${[...curatedChains].sort().join(', ')}`);
