export const DEFAULT_THORNODE_SOURCES = [
  {
    label: 'Liquify THORNode',
    url: 'https://gateway.liquify.com/chain/thorchain_api/thorchain',
    cosmosUrl: 'https://gateway.liquify.com/chain/thorchain_api/cosmos',
  },
  {
    label: 'THORChain THORNode',
    url: 'https://thornode.thorchain.network/thorchain',
    cosmosUrl: 'https://thornode.thorchain.network/cosmos',
  },
];

export const INBOUND_OPERATION_FIELDS = [
  'halted',
  'global_trading_paused',
  'chain_trading_paused',
  'chain_lp_actions_paused',
];

const LATEST_BLOCK_PATH = '/base/tendermint/v1beta1/blocks/latest';
const BLOCK_STALE_WARNING_SECONDS = 12;
const BLOCK_STALE_DEGRADED_SECONDS = 30;
const BLOCK_FUTURE_WARNING_SECONDS = 12;
const BLOCK_FUTURE_DEGRADED_SECONDS = 30;
const FETCH_TIMEOUT_MS = 10_000;

function isPlainRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function safeIntegerFromUnknown(value, label) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const numeric = Number(value);
    if (Number.isSafeInteger(numeric)) {
      return numeric;
    }
  }

  throw new Error(`${label} did not include a safe integer height.`);
}

export function getConservativeSnapshotHeight(latestHeight) {
  if (!Number.isSafeInteger(latestHeight) || latestHeight < 0) {
    throw new Error(`latest height must be a non-negative safe integer; got ${latestHeight}.`);
  }

  return Math.max(0, latestHeight - 1);
}

export function parseLatestBlockInfo(value) {
  if (!isPlainRecord(value) || !isPlainRecord(value.block) || !isPlainRecord(value.block.header)) {
    throw new Error('latest block response did not include block.header.');
  }

  const height = safeIntegerFromUnknown(value.block.header.height, 'latest block response');
  const time = value.block.header.time;
  if (typeof time !== 'string' || Number.isNaN(Date.parse(time))) {
    throw new Error('latest block response did not include a parseable block.header.time.');
  }

  return { height, time };
}

export function getBlockAgeWarnings(blockTime, nowMs = Date.now()) {
  const blockMs = Date.parse(blockTime);
  if (Number.isNaN(blockMs)) {
    throw new Error('block time was not parseable.');
  }

  const ageSeconds = Math.round((nowMs - blockMs) / 1000);
  if (ageSeconds > BLOCK_STALE_DEGRADED_SECONDS) {
    throw new Error(`latest block timestamp is stale by ${ageSeconds} seconds.`);
  }
  if (ageSeconds < -BLOCK_FUTURE_DEGRADED_SECONDS) {
    throw new Error(`latest block timestamp is ${Math.abs(ageSeconds)} seconds in the future.`);
  }

  const warnings = [];
  if (ageSeconds > BLOCK_STALE_WARNING_SECONDS) {
    warnings.push(`latest block timestamp is ${ageSeconds} seconds old.`);
  }
  if (ageSeconds < -BLOCK_FUTURE_WARNING_SECONDS) {
    warnings.push(`latest block timestamp is ${Math.abs(ageSeconds)} seconds in the future.`);
  }

  return { ageSeconds, warnings };
}

export function supportedChainCodes(chainRecords) {
  return new Set(
    chainRecords
      .filter((record) => record?.data?.supported)
      .map((record) => typeof record.data.chain === 'string' ? record.data.chain.trim().toUpperCase() : '')
      .filter(Boolean)
  );
}

export function validateInboundAddresses(value) {
  if (!Array.isArray(value)) {
    throw new Error('inbound_addresses response was not an array.');
  }

  const chains = new Set();
  const duplicates = new Set();
  const missingFields = [];

  for (const [index, item] of value.entries()) {
    if (!isPlainRecord(item)) {
      throw new Error(`inbound_addresses[${index}] was not an object.`);
    }

    if (typeof item.chain !== 'string' || item.chain.trim().length === 0) {
      throw new Error(`inbound_addresses[${index}].chain was missing or empty.`);
    }

    const chain = item.chain.trim().toUpperCase();
    if (chains.has(chain)) {
      duplicates.add(chain);
    }
    chains.add(chain);

    const missingForChain = INBOUND_OPERATION_FIELDS.filter((field) => typeof item[field] !== 'boolean');
    if (missingForChain.length > 0) {
      missingFields.push(`${chain}: ${missingForChain.join(', ')}`);
    }
  }

  if (duplicates.size > 0) {
    throw new Error(`inbound_addresses response contained duplicate chain rows: ${[...duplicates].sort().join(', ')}.`);
  }

  if (missingFields.length > 0) {
    throw new Error(`inbound_addresses response omitted operation fields: ${missingFields.join('; ')}.`);
  }

  return chains;
}

export function deriveChainSnapshotDrift(curatedChains, liveChains) {
  return {
    missingFromLive: [...curatedChains].filter((chain) => !liveChains.has(chain)).sort(),
    missingFromCurated: [...liveChains].filter((chain) => !curatedChains.has(chain)).sort(),
  };
}

function chainSetSignature(chains) {
  return [...chains].sort().join(',');
}

async function fetchJson(fetchImpl, url) {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
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

async function fetchProviderSnapshot(source, fetchImpl, nowMs) {
  const latestBlock = await fetchJson(fetchImpl, `${source.cosmosUrl}${LATEST_BLOCK_PATH}`);
  const latestBlockInfo = parseLatestBlockInfo(latestBlock);
  const snapshotHeight = getConservativeSnapshotHeight(latestBlockInfo.height);
  const { ageSeconds, warnings } = getBlockAgeWarnings(latestBlockInfo.time, nowMs);
  const inbound = await fetchJson(fetchImpl, `${source.url}/inbound_addresses?height=${snapshotHeight}`);
  const liveChains = validateInboundAddresses(inbound);

  return {
    source,
    liveChains,
    latestHeight: latestBlockInfo.height,
    snapshotHeight,
    blockTime: latestBlockInfo.time,
    blockAgeSeconds: ageSeconds,
    warnings,
  };
}

export async function checkLiveChainSnapshot({
  chainRecords,
  sources = DEFAULT_THORNODE_SOURCES,
  fetchImpl = fetch,
  nowMs = Date.now(),
}) {
  const curatedChains = supportedChainCodes(chainRecords);
  const snapshots = [];
  const providerErrors = [];

  for (const source of sources) {
    try {
      snapshots.push(await fetchProviderSnapshot(source, fetchImpl, nowMs));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      providerErrors.push(`${source.label}: ${message}`);
    }
  }

  if (snapshots.length === 0) {
    throw new Error(`No THORNode inbound_addresses source returned a usable pinned snapshot (${providerErrors.join('; ')}).`);
  }

  const [selectedSnapshot] = snapshots;
  const selectedSignature = chainSetSignature(selectedSnapshot.liveChains);
  const disagreeingSnapshots = snapshots.filter((snapshot) => chainSetSignature(snapshot.liveChains) !== selectedSignature);
  if (disagreeingSnapshots.length > 0) {
    throw new Error(
      `THORNode inbound_addresses sources disagree on live chain set: ${snapshots
        .map((snapshot) => `${snapshot.source.label}=[${chainSetSignature(snapshot.liveChains)}]`)
        .join('; ')}.`
    );
  }

  const drift = deriveChainSnapshotDrift(curatedChains, selectedSnapshot.liveChains);
  if (drift.missingFromLive.length > 0 || drift.missingFromCurated.length > 0) {
    const parts = [];
    if (drift.missingFromLive.length > 0) {
      parts.push(`Curated but missing live: ${drift.missingFromLive.join(', ')}`);
    }
    if (drift.missingFromCurated.length > 0) {
      parts.push(`Live but missing curated: ${drift.missingFromCurated.join(', ')}`);
    }
    throw new Error(`THORChain inbound_addresses chain snapshot drift detected via ${selectedSnapshot.source.label}. ${parts.join(' ')}`);
  }

  return {
    ...selectedSnapshot,
    curatedChains,
    providerErrors,
    warnings: snapshots.flatMap((snapshot) => snapshot.warnings.map((warning) => `${snapshot.source.label}: ${warning}`)),
  };
}
