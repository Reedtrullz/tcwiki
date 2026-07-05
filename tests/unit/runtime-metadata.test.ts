import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as healthGET } from '@/app/api/health/route';
import { GET as versionGET } from '@/app/api/version/route';
import { getRuntimeMetadata, runtimeMetadataResponseFields, runtimeMetadataWarnings } from '@/lib/runtime-metadata';

const { assertRuntimeMetadataContract } = await import('../../scripts/lib/runtime-metadata-contract.mjs') as {
  assertRuntimeMetadataContract: (json: unknown, options?: { requireStrict?: boolean; requireVerified?: boolean }) => void;
};

const commitSha = '811531ee677b4a5958d5ace6597fcaaabd4ac4e6';
const imageRef = `ghcr.io/reedtrullz/tcwiki@sha256:${'a'.repeat(64)}`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('runtime metadata diagnostics', () => {
  it('marks local placeholder metadata as unverified but non-strict by default', () => {
    vi.stubEnv('APP_VERSION', 'development');
    vi.stubEnv('COMMIT_SHA', 'unknown');
    vi.stubEnv('IMAGE_REF', 'unknown');

    const runtime = getRuntimeMetadata();

    expect(runtime.strict).toBe(false);
    expect(runtime.verified).toBe(false);
    expect(runtime.warnings).toEqual([
      'Runtime version metadata is missing or still using a local placeholder.',
      'Runtime commit metadata is missing or not a git SHA.',
      'Runtime image metadata is missing or not an immutable sha256 digest ref.',
    ]);
  });

  it('verifies git SHA and immutable digest metadata', () => {
    expect(runtimeMetadataWarnings({
      version: commitSha,
      commit: commitSha,
      image: imageRef,
    })).toEqual([]);
  });

  it('rejects placeholder metadata in strict runtime probes', () => {
    const placeholderResponse = {
      version: 'development',
      commit: 'unknown',
      image: 'unknown',
      runtime: {
        version: 'development',
        commit: 'unknown',
        image: 'unknown',
        strict: false,
        verified: false,
        warnings: runtimeMetadataWarnings({
          version: 'development',
          commit: 'unknown',
          image: 'unknown',
        }),
      },
    };

    expect(() => assertRuntimeMetadataContract(placeholderResponse)).not.toThrow();
    expect(() => assertRuntimeMetadataContract(placeholderResponse, { requireVerified: true })).toThrow(/runtime metadata is not verified/);
  });

  it('rejects all-zero SHA and digest placeholders', () => {
    const zeroCommit = '0000000000000000000000000000000000000000';
    const zeroImage = `ghcr.io/reedtrullz/tcwiki@sha256:${'0'.repeat(64)}`;

    expect(runtimeMetadataWarnings({
      version: zeroCommit,
      commit: zeroCommit,
      image: zeroImage,
    })).toEqual([
      'Runtime version metadata is missing or still using a local placeholder.',
      'Runtime commit metadata is missing or not a git SHA.',
      'Runtime image metadata is missing or not an immutable sha256 digest ref.',
    ]);
  });

  it('requires strict runtime mode when requested by probes', () => {
    const verifiedButNotStrict = {
      version: commitSha,
      commit: commitSha,
      image: imageRef,
      runtime: {
        version: commitSha,
        commit: commitSha,
        image: imageRef,
        strict: false,
        verified: true,
        warnings: [],
      },
    };

    expect(() => assertRuntimeMetadataContract(verifiedButNotStrict, {
      requireVerified: true,
      requireStrict: true,
    })).toThrow(/runtime\.strict must be true/);
  });

  it('rejects runtime warning drift that does not match computed metadata warnings', () => {
    const responseWithExtraWarning = {
      version: commitSha,
      commit: commitSha,
      image: imageRef,
      runtime: {
        version: commitSha,
        commit: commitSha,
        image: imageRef,
        strict: true,
        verified: true,
        warnings: ['unexpected warning'],
      },
    };

    expect(() => assertRuntimeMetadataContract(responseWithExtraWarning)).toThrow(/runtime\.warnings must match metadata validation/);
  });

  it('surfaces runtime diagnostics on health and version endpoints', async () => {
    vi.stubEnv('APP_VERSION', commitSha);
    vi.stubEnv('COMMIT_SHA', commitSha);
    vi.stubEnv('IMAGE_REF', imageRef);
    vi.stubEnv('RUNTIME_METADATA_REQUIRED', '1');

    const health = await healthGET().json();
    const version = await versionGET().json();

    expect(health.runtime).toEqual({
      version: commitSha,
      commit: commitSha,
      image: imageRef,
      strict: true,
      verified: true,
      warnings: [],
    });
    expect(version.runtime).toEqual(health.runtime);
    expect(runtimeMetadataResponseFields()).toEqual({
      version: commitSha,
      commit: commitSha,
      image: imageRef,
      runtime: health.runtime,
    });
  });
});
