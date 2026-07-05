import type { RuntimeMetadataDiagnostics } from '@/lib/types';

const PLACEHOLDER_VALUES = new Set(['', 'unknown', 'development', 'standalone-smoke', 'local']);
const GIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const DIGEST_IMAGE_PATTERN = /^[^\s]+@sha256:[0-9a-f]{64}$/i;
const ALL_ZERO_HEX_PATTERN = /^0+$/;

export interface RuntimeMetadataInput {
  version: string;
  commit: string;
  image: string;
}

export function runtimeMetadataWarnings(metadata: RuntimeMetadataInput) {
  const warnings: string[] = [];
  const version = metadata.version.trim();
  const commit = metadata.commit.trim();
  const image = metadata.image.trim();

  if (PLACEHOLDER_VALUES.has(version.toLowerCase()) || ALL_ZERO_HEX_PATTERN.test(version)) {
    warnings.push('Runtime version metadata is missing or still using a local placeholder.');
  }

  if (PLACEHOLDER_VALUES.has(commit.toLowerCase()) || !GIT_SHA_PATTERN.test(commit) || ALL_ZERO_HEX_PATTERN.test(commit)) {
    warnings.push('Runtime commit metadata is missing or not a git SHA.');
  }

  const imageDigest = image.match(/@sha256:([0-9a-f]{64})$/i)?.[1] ?? '';
  if (PLACEHOLDER_VALUES.has(image.toLowerCase()) || !DIGEST_IMAGE_PATTERN.test(image) || ALL_ZERO_HEX_PATTERN.test(imageDigest)) {
    warnings.push('Runtime image metadata is missing or not an immutable sha256 digest ref.');
  }

  return warnings;
}

export function getRuntimeMetadata(): RuntimeMetadataDiagnostics {
  const metadata = {
    version: process.env.APP_VERSION ?? process.env.VERSION ?? 'development',
    commit: process.env.COMMIT_SHA ?? 'unknown',
    image: process.env.IMAGE_REF ?? 'unknown',
  };
  const warnings = runtimeMetadataWarnings(metadata);

  return {
    ...metadata,
    strict: process.env.RUNTIME_METADATA_REQUIRED === '1',
    verified: warnings.length === 0,
    warnings,
  };
}

export function runtimeMetadataResponseFields() {
  const runtime = getRuntimeMetadata();

  return {
    version: runtime.version,
    commit: runtime.commit,
    image: runtime.image,
    runtime,
  };
}
