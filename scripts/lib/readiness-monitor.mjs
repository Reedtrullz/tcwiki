import { createHash } from 'node:crypto';
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
  const sources = [
    ['THORNode', 'Network operations', thornode],
    ['THORNode', 'Dynamic fees', thornode?.dynamicFees],
    ['THORNode', 'RUNEPool/POL', thornode?.runePoolPol],
    ['Midgard', 'Aggregate metrics', json.sources?.midgard],
    ['Midgard', 'Network metrics', json.sources?.midgard?.visibleData?.network],
    ['Midgard', 'Pool choices', json.sources?.midgard?.visibleData?.pools],
    ['Midgard', 'Earnings history', json.sources?.midgard?.visibleData?.earnings],
  ].filter(([, , source]) => source).map(([family, feature, source]) => ({
    family, feature, status: source.status ?? null,
    checkedAt: source.collection?.completedAt ?? source.checkedAt ?? null,
    provider: sourceSummary(source.source),
    error: source.error ? boundedText(source.error) : null,
    warnings: Array.isArray(source.sourceWarningDetails) ? source.sourceWarningDetails.slice(0, 80).map(detail => ({
      category: detail?.category ?? 'other', severity: detail?.severity ?? 'warning', message: boundedText(detail?.message ?? '')
    })) : [],
  }));
  const receipts = sources.filter(source => source.checkedAt).map(source => [source.feature, source.provider?.url ?? null, source.checkedAt]);

  return {
    observedAt,
    sourceEvidence: sources,
    observationKey: receipts.length ? JSON.stringify(receipts) : json.checkedAt ?? null,
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
  const identityMatches = sample => !sample.origin || (!sample.origin.commit || sample.origin.commit === sample.readiness?.commit) && (!sample.origin.image || sample.origin.image === sample.readiness?.image);
  const readySamples = validSamples.filter(sample => sample.readiness?.ready === true && (!sample.origin || sample.origin.healthy === true) && identityMatches(sample));
  const degradedSamples = validSamples.filter(sample => !readySamples.includes(sample));
  const errorSamples = samples.filter((sample) => sample.error);
  const noReadySamples = readySamples.length === 0;
  const persistentDegraded = noReadySamples && degradedSamples.length > 0;
  const status = noReadySamples ? 'fail' : 'pass';
  const failureReason = persistentDegraded
    ? 'persistent-degraded-readiness'
    : errorSamples.length === samples.length
      ? 'no-valid-readiness-samples'
      : 'none';

  const keys = validSamples.map(sample => sample.readiness?.observationKey).filter(Boolean);
  const independent = new Set(keys).size;
  const affected = samples.flatMap(sample => sample.readiness?.sourceEvidence ?? []).filter(source =>
    source.status === 'degraded' || source.error || source.warnings.some(warning => !(warning.severity === 'review' && ['mimir-support', 'unknown-chain'].includes(warning.category))));
  const families = [...new Set(affected.map(source => source.family))].sort();
  const features = [...new Set(affected.map(source => source.feature))].sort();
  const categories = [...new Set(affected.flatMap(source => source.warnings.map(warning => warning.category)))].sort();
  const originFailed = samples.some(sample => sample.origin && sample.origin.healthy !== true);
  const identityFailed = samples.some(sample => sample.origin?.identityValid === false || !identityMatches(sample));
  const kind = status === 'pass' ? 'recovered' : identityFailed ? 'origin-identity' : originFailed ? 'origin-liveness'
    : features.length && !features.includes('Network operations') && !features.includes('Aggregate metrics') ? 'feature-degradation'
    : families.length ? 'source-readiness' : 'readiness-unavailable';
  const fingerprint = createHash('sha256').update(JSON.stringify([baseUrl, kind, families, features, categories])).digest('hex');
  return {
    schemaVersion: 2,
    observations: { independent, repeated: keys.length - independent, unknown: validSamples.length - keys.length },
    incident: { kind, fingerprint, families, features, categories },
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
        ? `Production readiness remained degraded for all ${samples.length} samples (${independent} distinct source receipt sets); ${kind}.`
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

// Independent monitor request deadline covers headers AND body; no retry loop.
export async function fetchMonitorJson(url, { fetchImpl = fetch, timeoutMs = 10000 } = {}) {
  const controller = new AbortController();
  let reader;
  let rejectAbort;
  const aborted = new Promise((_resolve, reject) => { rejectAbort = reject; });
  const timer = setTimeout(() => {
    const error = new Error('Monitor request/body deadline exceeded.');
    controller.abort(error); rejectAbort(error);
    void reader?.cancel().catch(() => undefined);
  }, timeoutMs);
  try {
    return await Promise.race([aborted, (async () => {
      const response = await fetchImpl(url, { cache: 'no-store', signal: controller.signal });
      if (!response.body) throw new Error('Monitor response body is missing.');
      reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8', { fatal: true });
      let text = ''; let size = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1048576) throw new Error('Monitor response exceeds 1MiB.');
        text += decoder.decode(value, { stream: true });
      }
      return { response, json: JSON.parse(text + decoder.decode()) };
    })()]);
  } finally { clearTimeout(timer); void reader?.cancel().catch(() => undefined); }
}

export const READINESS_INCIDENT_MARKER = '<!-- tcwiki-readiness-incident -->';
export const READINESS_INCIDENT_TITLE = 'Production readiness monitor degraded';
export function buildReadinessIncidentUpdate(evidence, previousBody = '', evidenceUrl = '') {
  const initial = previousBody.match(/^First observed: (.+)$/m)?.[1] ?? evidence.startedAt;
  const initialEvidence = previousBody.match(/^Initial evidence: (.+)$/m)?.[1] ?? evidenceUrl;
  const priorFingerprint = previousBody.match(/^Fingerprint: ([a-f0-9]{64})$/m)?.[1];
  const current = evidence.incident;
  const body = [READINESS_INCIDENT_MARKER, `Fingerprint: ${current.fingerprint}`, `First observed: ${initial}`, `Initial evidence: ${initialEvidence}`,
    `Latest window: ${evidence.completedAt}`, `Evidence: ${evidenceUrl}`, '', evidence.summary,
    `Origin/source classification: ${current.kind}.`,
    `Source families: ${current.families.join(', ') || 'unconfirmed'}.`,
    `Affected features: ${current.features.join(', ') || 'unconfirmed'}.`,
    `Warning categories: ${current.categories.join(', ') || 'none captured'}.`,
    `HTTP samples: ${evidence.counts.total}; distinct source receipt sets: ${evidence.observations.independent}; repeated receipts: ${evidence.observations.repeated}; unknown receipts: ${evidence.observations.unknown}.`,
    '', 'Strict readiness remains required. Metadata validation identifies the reported candidate; it does not attest deployment contents.'].join('\n');
  const historyComment = priorFingerprint && priorFingerprint !== current.fingerprint
    ? `Incident classification changed at ${evidence.completedAt}. Previous window retained below:\n\n${previousBody}` : undefined;
  return { action: evidence.status === 'pass' ? previousBody ? 'recover' : 'none' : previousBody ? 'update' : 'create', body, historyComment,
    recoveryComment: `Sampled readiness recovered at ${evidence.completedAt}; ${evidence.observations.independent} distinct source receipt sets. Evidence: ${evidenceUrl}. This records the sampled window, not continuous uptime.` };
}
