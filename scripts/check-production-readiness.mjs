import './require-node22.mjs';
import { setTimeout as wait } from 'node:timers/promises';
import { assertRuntimeMetadataContract } from './lib/runtime-metadata-contract.mjs';
import { assertReadinessContract } from './lib/readiness-contract.mjs';
import { DEFAULT_THORNODE_SOURCES, latestBlockRequestUrl, parseLatestBlockInfo } from './lib/live-chain-snapshot.mjs';
import {
  fetchMonitorJson,
  buildReadinessMonitorEvidence,
  summarizeReadinessResponse,
  writeReadinessMonitorEvidence,
} from './lib/readiness-monitor.mjs';


function optionValue(args, name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) {
    return fallback;
  }
  const value = args[index + 1];
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function positiveInteger(value, label, { allowZero = false, maximum }) {
  const parsed = Number(value);
  const minimum = allowZero ? 0 : 1;
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${label} must be an integer from ${minimum} to ${maximum}.`);
  }
  return parsed;
}

async function probeProvider(source, observedAt) {
  const canonicalUrl = `${source.cosmosUrl}/base/tendermint/v1beta1/blocks/latest`;
  try {
    const { response, json } = await fetchMonitorJson(latestBlockRequestUrl(source.cosmosUrl, Date.parse(observedAt)));
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const block = parseLatestBlockInfo(json);
    return {
      source: { label: source.label, url: canonicalUrl, cosmosUrl: source.cosmosUrl },
      status: 'ok',
      height: block.height,
      blockTime: block.time,
      blockAgeSeconds: Math.round((Date.parse(observedAt) - Date.parse(block.time)) / 1000),
    };
  } catch (error) {
    return {
      source: { label: source.label, url: canonicalUrl, cosmosUrl: source.cosmosUrl },
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown provider probe error',
    };
  }
}

async function probeOrigin(baseUrl) {
  try {
    const { response, json } = await fetchMonitorJson(`${baseUrl}/api/health`);
    try { assertRuntimeMetadataContract(json, { requireVerified: true }); }
    catch (error) { return { reachable: true, healthy: false, identityValid: false, httpStatus: response.status, error: error.message }; }
    return { reachable: true, healthy: response.ok && json.status === 'healthy', identityValid: true, httpStatus: response.status, version: json.version, commit: json.commit, image: json.image };
  } catch (error) {
    return { reachable: false, healthy: false, error: error instanceof Error ? error.message : 'Origin check failed' };
  }
}

async function collectSample(baseUrl) {
  const observedAt = new Date().toISOString();
  const originPromise = probeOrigin(baseUrl);
  const directProvidersPromise = Promise.all(DEFAULT_THORNODE_SOURCES.map((source) => probeProvider(source, observedAt)));
  try {
    const { response, json } = await fetchMonitorJson(`${baseUrl}/api/ready?contract=strict`);
    assertReadinessContract(json);
    return {
      observedAt,
      origin: await originPromise,
      readiness: summarizeReadinessResponse({ observedAt, httpStatus: response.status, json }),
      directProviders: await directProvidersPromise,
    };
  } catch (error) {
    return {
      observedAt,
      origin: await originPromise,
      error: error instanceof Error ? error.message : 'Unknown readiness monitor error',
      directProviders: await directProvidersPromise,
    };
  }
}

const args = process.argv.slice(2);
const baseUrl = optionValue(args, '--base-url', process.env.CHECK_BASE_URL ?? 'https://wiki.thorchain.no').replace(/\/$/, '');
const sampleCount = positiveInteger(optionValue(args, '--samples', process.env.READINESS_MONITOR_SAMPLES ?? '3'), '--samples', { maximum: 12 });
const intervalMs = positiveInteger(optionValue(args, '--interval-ms', process.env.READINESS_MONITOR_INTERVAL_MS ?? '60000'), '--interval-ms', { allowZero: true, maximum: 900_000 });
const artifactPath = optionValue(args, '--artifact', process.env.READINESS_MONITOR_ARTIFACT ?? '.artifacts/readiness-monitor/production-readiness.json');

const startedAt = new Date().toISOString();
const samples = [];
for (let index = 0; index < sampleCount; index += 1) {
  if (index > 0 && intervalMs > 0) {
    await wait(intervalMs);
  }
  const sample = await collectSample(baseUrl);
  samples.push(sample);
  const state = sample.error ? `error: ${sample.error}` : sample.readiness.ready ? 'ready' : 'degraded';
  console.log(`Readiness sample ${index + 1}/${sampleCount} at ${sample.observedAt}: ${state}`);
}

const evidence = buildReadinessMonitorEvidence({
  baseUrl,
  startedAt,
  completedAt: new Date().toISOString(),
  samples,
});
await writeReadinessMonitorEvidence(evidence, artifactPath);
console.log(evidence.summary);
console.log(`Production readiness evidence written to ${artifactPath}`);

if (evidence.status !== 'pass') {
  process.exit(1);
}
