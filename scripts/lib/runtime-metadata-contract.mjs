const placeholderValues = new Set(['', 'unknown', 'development', 'standalone-smoke', 'local']);
const gitShaPattern = /^[0-9a-f]{7,40}$/i;
const digestImagePattern = /^[^\s]+@sha256:[0-9a-f]{64}$/i;
const allZeroHexPattern = /^0+$/;

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

export function runtimeMetadataWarnings(metadata) {
  const warnings = [];
  const version = String(metadata.version ?? '').trim();
  const commit = String(metadata.commit ?? '').trim();
  const image = String(metadata.image ?? '').trim();

  if (placeholderValues.has(version.toLowerCase()) || allZeroHexPattern.test(version)) {
    warnings.push('Runtime version metadata is missing or still using a local placeholder.');
  }

  if (placeholderValues.has(commit.toLowerCase()) || !gitShaPattern.test(commit) || allZeroHexPattern.test(commit)) {
    warnings.push('Runtime commit metadata is missing or not a git SHA.');
  }

  const imageDigest = image.match(/@sha256:([0-9a-f]{64})$/i)?.[1] ?? '';
  if (placeholderValues.has(image.toLowerCase()) || !digestImagePattern.test(image) || allZeroHexPattern.test(imageDigest)) {
    warnings.push('Runtime image metadata is missing or not an immutable sha256 digest ref.');
  }

  return warnings;
}

export function assertRuntimeMetadataContract(json, options = {}) {
  assert(json && typeof json === 'object', 'runtime metadata response must be an object');
  assertString(json.version, 'version');
  assertString(json.commit, 'commit');
  assertString(json.image, 'image');

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
  assert(runtime.verified === (computedWarnings.length === 0), 'runtime.verified must match metadata validation');
  assert(runtime.warnings.length === computedWarnings.length, 'runtime.warnings must match metadata validation');
  for (const warning of computedWarnings) {
    assert(runtime.warnings.includes(warning), `runtime.warnings must include ${warning}`);
  }

  if (options.requireVerified) {
    assert(computedWarnings.length === 0, `runtime metadata is not verified: ${computedWarnings.join(' ')}`);
  }
  if (options.requireStrict) {
    assert(runtime.strict === true, 'runtime.strict must be true when strict runtime metadata is required');
  }
}
