import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const MAX_REASON_LENGTH = 500;

function boundedText(value) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length <= MAX_REASON_LENGTH ? text : `${text.slice(0, MAX_REASON_LENGTH - 3)}...`;
}

function sourceSummary(source) {
  if (!source || typeof source !== 'object') {
    return null;
  }
  return {
    label: typeof source.label === 'string' ? source.label : null,
    url: typeof source.url === 'string' ? source.url : null,
  };
}

export function summarizeReadinessResponse({ observedAt, httpStatus, json }) {
  const thornode = json.sources?.thornode;
  return {
    observedAt,
    httpStatus,
    checkedAt: json.checkedAt,
    status: json.status,
    ready: json.ready,
    version: json.version,
    commit: json.commit,
    image: json.image,
    reasons: Array.isArray(json.reasons) ? json.reasons.map(boundedText) : [],
    thornode: {
      status: thornode?.status ?? null,
      source: sourceSummary(thornode?.source),
      state: thornode?.state ?? null,
      height: thornode?.thorchainHeight ?? null,
      blockTime: thornode?.thorchainBlockTime ?? null,
      blockAgeSeconds: thornode?.thorchainBlockAgeSeconds ?? null,
      heightLagBlocks: thornode?.heightLagBlocks ?? null,
      warningCategories: Array.isArray(thornode?.sourceWarningDetails)
        ? [...new Set(thornode.sourceWarningDetails.map((detail) => detail?.category).filter((value) => typeof value === 'string'))]
        : [],
      dynamicFeeBlockAgeSeconds: thornode?.dynamicFees?.thorchainBlockAgeSeconds ?? null,
      runePoolPolBlockAgeSeconds: thornode?.runePoolPol?.thorchainBlockAgeSeconds ?? null,
    },
  };
}

export function buildReadinessMonitorEvidence({ baseUrl, startedAt, completedAt, samples }) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error('readiness monitor requires at least one sample.');
  }

  const validSamples = samples.filter((sample) => !sample.error);
  const readySamples = validSamples.filter((sample) => sample.readiness?.ready === true);
  const degradedSamples = validSamples.filter((sample) => sample.readiness?.ready === false);
  const errorSamples = samples.filter((sample) => sample.error);
  const noReadySamples = readySamples.length === 0;
  const persistentDegraded = noReadySamples && degradedSamples.length > 0;
  const status = noReadySamples ? 'fail' : 'pass';
  const failureReason = persistentDegraded
    ? 'persistent-degraded-readiness'
    : errorSamples.length === samples.length
      ? 'no-valid-readiness-samples'
      : 'none';

  return {
    schemaVersion: 1,
    kind: 'tcwiki-production-readiness-monitor',
    generatedAt: completedAt,
    startedAt,
    completedAt,
    baseUrl,
    status,
    exitCode: status === 'pass' ? 0 : 1,
    failureReason,
    summary: status === 'pass'
      ? `Production readiness was usable in ${readySamples.length} of ${samples.length} samples; ${degradedSamples.length} degraded and ${errorSamples.length} errored.`
      : persistentDegraded
        ? `Production readiness remained degraded for all ${samples.length} samples.`
      : `No production readiness sample was usable; ${degradedSamples.length} degraded and ${errorSamples.length} errored.`,
    counts: {
      total: samples.length,
      ready: readySamples.length,
      degraded: degradedSamples.length,
      errors: errorSamples.length,
    },
    samples,
  };
}

export async function writeReadinessMonitorEvidence(evidence, outputPath) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
}
