import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
const { createCloudflareManifest, verifyCloudflareManifest, assertReleaseTargets } = await import('../../scripts/lib/cloudflare-artifact.mjs');
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-artifact-')); roots.push(root);
  mkdirSync(join(root, 'dist/server'), { recursive: true }); mkdirSync(join(root, 'dist/client'), { recursive: true });
  writeFileSync(join(root, 'dist/server/do-entry.mjs'), 'entry'); writeFileSync(join(root, 'dist/server/index.js'), 'module');
  writeFileSync(join(root, 'dist/client/style.css'), 'asset'); writeFileSync(join(root, 'wrangler.do.jsonc'), '{}');
  return root;
}
it('binds every module, asset and config and rejects added/deleted/changed inputs', () => {
  const root = fixture(); const manifest = createCloudflareManifest(root, 'a'.repeat(40));
  expect(createCloudflareManifest(root, 'a'.repeat(40))).toEqual(manifest);
  expect(() => verifyCloudflareManifest(root, manifest)).not.toThrow();
  for (const file of ['dist/server/index.js', 'dist/client/style.css', 'wrangler.do.jsonc']) {
    const original = file.includes('index') ? 'module' : file.includes('style') ? 'asset' : '{}';
    writeFileSync(join(root, file), 'changed');
    expect(createCloudflareManifest(root, 'a'.repeat(40)).digest).not.toBe(manifest.digest);
    expect(() => verifyCloudflareManifest(root, manifest)).toThrow(/artifact/i);
    writeFileSync(join(root, file), original);
  }
  writeFileSync(join(root, 'dist/server/added.js'), 'added'); expect(() => verifyCloudflareManifest(root, manifest)).toThrow();
  rmSync(join(root, 'dist/server/added.js')); rmSync(join(root, 'dist/server/index.js'));
  expect(() => verifyCloudflareManifest(root, manifest)).toThrow();
});
it('rejects tampered identity/policy and conflicting production targets', () => {
  const root = fixture(); const manifest = createCloudflareManifest(root, 'a'.repeat(40));
  expect(() => verifyCloudflareManifest(root, { ...manifest, commit: 'b'.repeat(40) })).toThrow();
  expect(() => verifyCloudflareManifest(root, { ...manifest, vars: { ...manifest.vars, CSP_ENFORCE: '0' } })).toThrow();
  expect(() => assertReleaseTargets('1', '1')).toThrow(/exclusive/);
  expect(() => assertReleaseTargets('bad', '0')).toThrow();
  expect(() => assertReleaseTargets('1', '0')).not.toThrow();
  expect(() => assertReleaseTargets('0', '1')).not.toThrow();
  expect(() => assertReleaseTargets('0', '0')).not.toThrow();
});
