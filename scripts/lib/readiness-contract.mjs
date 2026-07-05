import { runtimeMetadataWarnings } from './runtime-metadata-contract.mjs';

const allowedReadinessStatuses = new Set(['ready', 'degraded']);
const allowedSourceStatuses = new Set(['ok', 'degraded']);
const allowedWarningSeverities = new Set(['critical', 'warning', 'review']);
const allowedWarningCategories = new Set([
  'freshness',
  'pinning',
  'height-divergence',
  'source-shape',
  'mimir-parse',
  'unknown-chain',
  'unknown-operation',
  'other',
]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertString(value, path) {
  assert(typeof value === 'string' && value.length > 0, `${path} must be a non-empty string`);
}

function assertStringArray(value, path) {
  assert(Array.isArray(value), `${path} must be an array`);
  value.forEach((entry, index) => {
    assert(typeof entry === 'string', `${path}[${index}] must be a string`);
  });
}

function assertOptionalStringArray(value, path) {
  if (value !== undefined) {
    assertStringArray(value, path);
  }
}

function assertOptionalNumber(value, path) {
  if (value !== undefined) {
    assert(typeof value === 'number' && Number.isFinite(value), `${path} must be a finite number`);
  }
}

function assertOptionalBoolean(value, path) {
  if (value !== undefined) {
    assert(typeof value === 'boolean', `${path} must be boolean`);
  }
}

function assertOptionalString(value, path) {
  if (value !== undefined) {
    assertString(value, path);
  }
}

function assertSourceMeta(value, path) {
  if (value === undefined) {
    return;
  }
  assert(value && typeof value === 'object', `${path} must be an object`);
  assertString(value.label, `${path}.label`);
  assertString(value.url, `${path}.url`);
}

function assertRequiredSourceMeta(value, path) {
  assert(value !== undefined, `${path} must be present when readiness is ready`);
  assertSourceMeta(value, path);
}

function assertRuntimeMetadata(json) {
  const runtime = json.runtime;
  assert(runtime && typeof runtime === 'object', 'runtime must be an object');
  assertString(runtime.version, 'runtime.version');
  assertString(runtime.commit, 'runtime.commit');
  assertString(runtime.image, 'runtime.image');
  assert(typeof runtime.strict === 'boolean', 'runtime.strict must be boolean');
  assert(typeof runtime.verified === 'boolean', 'runtime.verified must be boolean');
  assertStringArray(runtime.warnings, 'runtime.warnings');
  assert(runtime.version === json.version, 'runtime.version must match top-level version');
  assert(runtime.commit === json.commit, 'runtime.commit must match top-level commit');
  assert(runtime.image === json.image, 'runtime.image must match top-level image');
  const computedWarnings = runtimeMetadataWarnings(json);
  assert(runtime.verified === (computedWarnings.length === 0), 'runtime.verified must match runtime metadata validation');
  assert(runtime.warnings.length === computedWarnings.length, 'runtime.warnings must match runtime metadata validation');
  for (const warning of computedWarnings) {
    assert(runtime.warnings.includes(warning), `runtime.warnings must include ${warning}`);
  }
}

function assertSourceCheck(value, path) {
  assert(value && typeof value === 'object', `${path} must be an object`);
  assert(allowedSourceStatuses.has(value.status), `${path}.status must be ok or degraded`);
  assertString(value.checkedAt, `${path}.checkedAt`);
  assertSourceMeta(value.source, `${path}.source`);
}

function assertWarningDetails(value, path) {
  assert(Array.isArray(value), `${path} must be an array`);
  value.forEach((detail, index) => {
    const detailPath = `${path}[${index}]`;
    assert(detail && typeof detail === 'object', `${detailPath} must be an object`);
    assert(allowedWarningSeverities.has(detail.severity), `${detailPath}.severity is unsupported`);
    assert(allowedWarningCategories.has(detail.category), `${detailPath}.category is unsupported`);
    assertString(detail.message, `${detailPath}.message`);
    assertString(detail.action, `${detailPath}.action`);
    assertOptionalStringArray(detail.keys, `${detailPath}.keys`);
    assertOptionalStringArray(detail.scopes, `${detailPath}.scopes`);
  });
}

function assertEmptyArray(value, path) {
  assert(Array.isArray(value), `${path} must be an array`);
  assert(value.length === 0, `${path} must be empty when readiness is ready`);
}

function assertReadySource(value, path) {
  assert(value && typeof value === 'object', `${path} must be an object`);
  assert(value.status === 'ok', `${path}.status must be ok when readiness is ready`);
  assertRequiredSourceMeta(value.source, `${path}.source`);
}

function sameSourceGroup(leftUrl, rightUrl) {
  try {
    return new URL(leftUrl).origin === new URL(rightUrl).origin;
  } catch {
    return leftUrl === rightUrl;
  }
}

function assertSameReadySourceGroup(referenceSource, candidate, path, referencePath) {
  assertReadySource(candidate, path);
  assertRequiredSourceMeta(referenceSource, referencePath);
  assert(
    sameSourceGroup(referenceSource.url, candidate.source.url),
    `${path}.source must share provider origin with ${referencePath} when readiness is ready`
  );
}

export function assertReadinessContract(json) {
  assert(json && typeof json === 'object', 'readiness response must be an object');
  assert(allowedReadinessStatuses.has(json.status), 'readiness status must be ready or degraded');
  assert(typeof json.ready === 'boolean', 'readiness ready must be boolean');
  assertString(json.checkedAt, 'checkedAt');
  assertString(json.version, 'version');
  assertString(json.commit, 'commit');
  assertString(json.image, 'image');
  assertRuntimeMetadata(json);
  assertStringArray(json.reasons, 'reasons');
  assertStringArray(json.warnings, 'warnings');
  assert(json.sources && typeof json.sources === 'object', 'sources must be an object');

  const midgard = json.sources.midgard;
  assert(midgard && typeof midgard === 'object', 'sources.midgard must be an object');
  assert(allowedSourceStatuses.has(midgard.status), 'sources.midgard.status must be ok or degraded');
  assertSourceMeta(midgard.source, 'sources.midgard.source');
  assertStringArray(midgard.healthWarnings, 'sources.midgard.healthWarnings');
  assertStringArray(midgard.sourceWarnings, 'sources.midgard.sourceWarnings');
  assertWarningDetails(midgard.sourceWarningDetails, 'sources.midgard.sourceWarningDetails');
  assert(midgard.visibleData && typeof midgard.visibleData === 'object', 'sources.midgard.visibleData must be an object');
  assertSourceCheck(midgard.visibleData.network, 'sources.midgard.visibleData.network');
  assertSourceCheck(midgard.visibleData.pools, 'sources.midgard.visibleData.pools');
  assertSourceCheck(midgard.visibleData.earnings, 'sources.midgard.visibleData.earnings');

  const thornode = json.sources.thornode;
  assert(thornode && typeof thornode === 'object', 'sources.thornode must be an object');
  assert(allowedSourceStatuses.has(thornode.status), 'sources.thornode.status must be ok or degraded');
  assert(typeof thornode.sourceCount === 'number', 'sources.thornode.sourceCount must be a number');
  assertStringArray(thornode.activeControlKeys, 'sources.thornode.activeControlKeys');
  assertStringArray(thornode.activeChainKeys, 'sources.thornode.activeChainKeys');
  assertStringArray(thornode.activeEvidenceKeys, 'sources.thornode.activeEvidenceKeys');
  assertStringArray(thornode.scheduledMimirKeys, 'sources.thornode.scheduledMimirKeys');
  assert(Array.isArray(thornode.chainStatuses), 'sources.thornode.chainStatuses must be an array');
  assert(Array.isArray(thornode.monitoredControls), 'sources.thornode.monitoredControls must be an array');
  assertStringArray(thornode.invalidMimirKeys, 'sources.thornode.invalidMimirKeys');
  assertStringArray(thornode.sourceWarnings, 'sources.thornode.sourceWarnings');
  assertWarningDetails(thornode.sourceWarningDetails, 'sources.thornode.sourceWarningDetails');

  const dynamicFees = thornode.dynamicFees;
  assert(dynamicFees && typeof dynamicFees === 'object', 'sources.thornode.dynamicFees must be an object');
  assert(allowedSourceStatuses.has(dynamicFees.status), 'sources.thornode.dynamicFees.status must be ok or degraded');
  assertSourceMeta(dynamicFees.source, 'sources.thornode.dynamicFees.source');
  if (dynamicFees.sources !== undefined) {
    assert(Array.isArray(dynamicFees.sources), 'sources.thornode.dynamicFees.sources must be an array');
    dynamicFees.sources.forEach((source, index) => assertSourceMeta(source, `sources.thornode.dynamicFees.sources[${index}]`));
  }
  assertOptionalString(dynamicFees.checkedAt, 'sources.thornode.dynamicFees.checkedAt');
  assertOptionalString(dynamicFees.error, 'sources.thornode.dynamicFees.error');
  assertOptionalString(dynamicFees.enabledState, 'sources.thornode.dynamicFees.enabledState');
  assertOptionalNumber(dynamicFees.enabledValue, 'sources.thornode.dynamicFees.enabledValue');
  assertOptionalNumber(dynamicFees.currentEpoch, 'sources.thornode.dynamicFees.currentEpoch');
  assertOptionalNumber(dynamicFees.trackedRecordCount, 'sources.thornode.dynamicFees.trackedRecordCount');
  assertOptionalNumber(dynamicFees.currentEntryCount, 'sources.thornode.dynamicFees.currentEntryCount');
  assertOptionalNumber(dynamicFees.whitelistedThornameCount, 'sources.thornode.dynamicFees.whitelistedThornameCount');
  assertOptionalNumber(dynamicFees.historyThornameCount, 'sources.thornode.dynamicFees.historyThornameCount');
  assertOptionalNumber(dynamicFees.historySampleCount, 'sources.thornode.dynamicFees.historySampleCount');
  assertOptionalNumber(dynamicFees.thorchainHeight, 'sources.thornode.dynamicFees.thorchainHeight');
  assertOptionalBoolean(dynamicFees.snapshotPinned, 'sources.thornode.dynamicFees.snapshotPinned');
  assertOptionalString(dynamicFees.thorchainBlockTime, 'sources.thornode.dynamicFees.thorchainBlockTime');
  assertOptionalNumber(dynamicFees.thorchainBlockAgeSeconds, 'sources.thornode.dynamicFees.thorchainBlockAgeSeconds');
  assertStringArray(dynamicFees.sourceWarnings, 'sources.thornode.dynamicFees.sourceWarnings');
  assertWarningDetails(dynamicFees.sourceWarningDetails, 'sources.thornode.dynamicFees.sourceWarningDetails');

  const statusIsReady = json.status === 'ready';
  assert(statusIsReady === json.ready, 'readiness status and ready flag must agree');

  if (json.ready) {
    assertEmptyArray(json.reasons, 'reasons');
    assertReadySource(midgard, 'sources.midgard');
    assertSameReadySourceGroup(midgard.source, midgard.visibleData.network, 'sources.midgard.visibleData.network', 'sources.midgard.source');
    assertSameReadySourceGroup(midgard.source, midgard.visibleData.pools, 'sources.midgard.visibleData.pools', 'sources.midgard.source');
    assertSameReadySourceGroup(midgard.source, midgard.visibleData.earnings, 'sources.midgard.visibleData.earnings', 'sources.midgard.source');
    assertEmptyArray(midgard.sourceWarnings, 'sources.midgard.sourceWarnings');
    assertEmptyArray(midgard.sourceWarningDetails, 'sources.midgard.sourceWarningDetails');
    assertReadySource(thornode, 'sources.thornode');
    assertEmptyArray(thornode.sourceWarnings, 'sources.thornode.sourceWarnings');
    assertEmptyArray(thornode.sourceWarningDetails, 'sources.thornode.sourceWarningDetails');
    assertSameReadySourceGroup(thornode.source, dynamicFees, 'sources.thornode.dynamicFees', 'sources.thornode.source');
    assertEmptyArray(dynamicFees.sourceWarnings, 'sources.thornode.dynamicFees.sourceWarnings');
    assertEmptyArray(dynamicFees.sourceWarningDetails, 'sources.thornode.dynamicFees.sourceWarningDetails');
    if (json.runtime.strict) {
      assert(json.runtime.verified, 'ready responses with strict runtime metadata must be verified');
      assertEmptyArray(json.runtime.warnings, 'runtime.warnings');
    }
  }
}
