import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

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
const MAX_EVIDENCE_MESSAGE_LENGTH = 500;
const EVIDENCE_CHECK_NAME = 'live-chain-snapshot';
const EVIDENCE_SCHEMA_VERSION = 1;

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

function sortedChains(chains) {
  return [...chains].sort();
}

function boundedMessage(message) {
  const singleLine = String(message).replace(/\s+/g, ' ').trim();
  if (singleLine.length <= MAX_EVIDENCE_MESSAGE_LENGTH) {
    return singleLine;
  }

  return `${singleLine.slice(0, MAX_EVIDENCE_MESSAGE_LENGTH - 3)}...`;
}

function errorMessage(error) {
  return boundedMessage(error instanceof Error ? error.message : 'unknown error');
}

function sourceEvidence(source) {
  return {
    label: source.label,
    url: source.url,
    cosmosUrl: source.cosmosUrl,
  };
}

function providerSnapshotEvidence(snapshot, status = 'usable') {
  const liveChains = sortedChains(snapshot.liveChains);
  return {
    source: sourceEvidence(snapshot.source),
    status: status === 'usable' && snapshot.warnings.length > 0 ? 'warning' : status,
    latestHeight: snapshot.latestHeight,
    snapshotHeight: snapshot.snapshotHeight,
    blockTime: snapshot.blockTime,
    blockAgeSeconds: snapshot.blockAgeSeconds,
    liveChains,
    chainSignature: liveChains.join(','),
    warnings: [...snapshot.warnings],
  };
}

function providerErrorEvidence(source, message) {
  return {
    source: sourceEvidence(source),
    status: 'error',
    error: boundedMessage(message),
  };
}

function evidenceSourcePolicy() {
  return {
    latestBlockPath: LATEST_BLOCK_PATH,
    pinnedSnapshot: 'latest_height_minus_1',
    inboundAddressesPath: '/inbound_addresses?height={snapshotHeight}',
    requiredInboundOperationFields: [...INBOUND_OPERATION_FIELDS],
    providerAgreement: 'all usable providers must expose the same live chain set',
    driftRule: 'curated supported chains must match the selected pinned live chain set',
    failureSemantics: 'stale/far-future blocks, malformed inbound rows, provider disagreement, and curated/live drift fail the check',
  };
}

function ciEvidence(env) {
  return {
    eventName: env.GITHUB_EVENT_NAME ?? null,
    runId: env.GITHUB_RUN_ID ?? null,
    runAttempt: env.GITHUB_RUN_ATTEMPT ?? null,
    sha: env.GITHUB_SHA ?? null,
    ref: env.GITHUB_REF ?? null,
    workflow: env.GITHUB_WORKFLOW ?? null,
    repository: env.GITHUB_REPOSITORY ?? null,
  };
}

function failureMessageForNoUsableProvider(providerErrors) {
  return `No THORNode inbound_addresses source returned a usable pinned snapshot (${providerErrors.join('; ')}).`;
}

function failureMessageForProviderDisagreement(snapshots) {
  return `THORNode inbound_addresses sources disagree on live chain set: ${snapshots
    .map((snapshot) => `${snapshot.source.label}=[${chainSetSignature(snapshot.liveChains)}]`)
    .join('; ')}.`;
}

function failureMessageForDrift(selectedSnapshot, drift) {
  const parts = [];
  if (drift.missingFromLive.length > 0) {
    parts.push(`Curated but missing live: ${drift.missingFromLive.join(', ')}`);
  }
  if (drift.missingFromCurated.length > 0) {
    parts.push(`Live but missing curated: ${drift.missingFromCurated.join(', ')}`);
  }

  return `THORChain inbound_addresses chain snapshot drift detected via ${selectedSnapshot.source.label}. ${parts.join(' ')}`;
}

function baseEvidence({ checkedAt, curatedChains, providers, providerErrors, warnings }) {
  const sortedCuratedChains = sortedChains(curatedChains);
  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    kind: 'thorchain-live-chain-snapshot-drift',
    check: EVIDENCE_CHECK_NAME,
    generatedAt: checkedAt,
    checkedAt,
    status: 'fail',
    exitCode: 1,
    failureReason: 'unknown',
    failureMessage: null,
    summary: 'Live chain snapshot check did not complete.',
    command: 'check-live-chain-snapshot',
    ci: ciEvidence(process.env),
    sourcePolicy: evidenceSourcePolicy(),
    selectedSource: null,
    selected: null,
    latestHeight: null,
    snapshotHeight: null,
    blockTime: null,
    blockAgeSeconds: null,
    curated: {
      source: 'src/lib/data/static.ts#CHAIN_RECORDS',
      count: sortedCuratedChains.length,
      chains: sortedCuratedChains,
    },
    curatedChains: sortedCuratedChains,
    liveChains: [],
    drift: {
      missingFromLive: [],
      missingFromCurated: [],
    },
    warnings,
    providerErrors,
    providers,
  };
}

export class LiveChainSnapshotError extends Error {
  constructor(message, evidence) {
    super(message);
    this.name = 'LiveChainSnapshotError';
    this.evidence = evidence;
  }
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
  const evidence = await buildLiveChainSnapshotEvidence({
    chainRecords,
    sources,
    fetchImpl,
    nowMs,
  });

  if (evidence.status !== 'pass') {
    throw new LiveChainSnapshotError(evidence.failureMessage ?? 'Live chain snapshot check failed.', evidence);
  }

  return {
    source: evidence.selectedSource,
    liveChains: new Set(evidence.liveChains),
    latestHeight: evidence.latestHeight,
    snapshotHeight: evidence.snapshotHeight,
    blockTime: evidence.blockTime,
    blockAgeSeconds: evidence.blockAgeSeconds,
    curatedChains: new Set(evidence.curatedChains),
    providerErrors: evidence.providerErrors,
    warnings: evidence.warnings,
    evidence,
  };
}

export async function buildLiveChainSnapshotEvidence({
  chainRecords,
  sources = DEFAULT_THORNODE_SOURCES,
  fetchImpl = fetch,
  nowMs = Date.now(),
}) {
  const curatedChains = supportedChainCodes(chainRecords);
  const snapshots = [];
  const providerErrors = [];
  const providers = [];

  for (const source of sources) {
    try {
      const snapshot = await fetchProviderSnapshot(source, fetchImpl, nowMs);
      snapshots.push(snapshot);
      providers.push(providerSnapshotEvidence(snapshot));
    } catch (error) {
      const message = errorMessage(error);
      providerErrors.push(`${source.label}: ${message}`);
      providers.push(providerErrorEvidence(source, message));
    }
  }

  const warnings = snapshots.flatMap((snapshot) => snapshot.warnings.map((warning) => `${snapshot.source.label}: ${warning}`));
  const evidence = baseEvidence({
    checkedAt: new Date(nowMs).toISOString(),
    curatedChains,
    providers,
    providerErrors,
    warnings,
  });

  if (snapshots.length === 0) {
    evidence.failureReason = 'no-usable-provider';
    evidence.failureMessage = failureMessageForNoUsableProvider(providerErrors);
    evidence.summary = boundedMessage(evidence.failureMessage);
    return evidence;
  }

  const [selectedSnapshot] = snapshots;
  const selectedSignature = chainSetSignature(selectedSnapshot.liveChains);
  const disagreeingSnapshots = snapshots.filter((snapshot) => chainSetSignature(snapshot.liveChains) !== selectedSignature);
  const drift = deriveChainSnapshotDrift(curatedChains, selectedSnapshot.liveChains);

  evidence.selectedSource = sourceEvidence(selectedSnapshot.source);
  evidence.selected = providerSnapshotEvidence(selectedSnapshot);
  evidence.latestHeight = selectedSnapshot.latestHeight;
  evidence.snapshotHeight = selectedSnapshot.snapshotHeight;
  evidence.blockTime = selectedSnapshot.blockTime;
  evidence.blockAgeSeconds = selectedSnapshot.blockAgeSeconds;
  evidence.liveChains = sortedChains(selectedSnapshot.liveChains);
  evidence.drift = drift;

  if (disagreeingSnapshots.length > 0) {
    evidence.failureReason = 'provider-disagreement';
    evidence.failureMessage = failureMessageForProviderDisagreement(snapshots);
    evidence.summary = boundedMessage(evidence.failureMessage);
    for (const provider of evidence.providers) {
      if (
        (provider.status === 'usable' || provider.status === 'warning') &&
        Array.isArray(provider.liveChains) &&
        provider.chainSignature !== selectedSignature
      ) {
        provider.status = 'disagreeing';
      }
    }
    return evidence;
  }

  if (drift.missingFromLive.length > 0 || drift.missingFromCurated.length > 0) {
    evidence.failureReason = 'chain-drift';
    evidence.failureMessage = failureMessageForDrift(selectedSnapshot, drift);
    evidence.summary = boundedMessage(evidence.failureMessage);
    return evidence;
  }

  evidence.status = 'pass';
  evidence.exitCode = 0;
  evidence.failureReason = 'none';
  evidence.summary = `Live chain snapshot matches curated supported chains via ${selectedSnapshot.source.label}.`;
  return evidence;
}

export async function writeLiveChainSnapshotEvidence(evidence, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}
