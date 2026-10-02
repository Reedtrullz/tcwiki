import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';

const { checkStandaloneFreshness } = await import('../../scripts/lib/standalone-freshness.mjs') as {
  checkStandaloneFreshness: (root: string) => void;
};
const roots: string[] = [];
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-standalone-freshness-'));
  roots.push(root);
  mkdirSync(join(root, '.next/standalone'), { recursive: true });
  mkdirSync(join(root, 'src/app'), { recursive: true });
  mkdirSync(join(root, 'docs'), { recursive: true });
  mkdirSync(join(root, 'public'));
  writeFileSync(join(root, 'public/asset.txt'), 'asset');
  writeFileSync(join(root, '.next/standalone/server.js'), 'server');
  writeFileSync(join(root, 'src/app/page.tsx'), 'original');
  const files: Record<string, string | null> = {
    'src/app/page.tsx': sha('original'),
    content: null, 'public/asset.txt': sha('asset'), 'next.config.ts': null, 'package-lock.json': null,
    'package.json': null, 'postcss.config.mjs': null, 'tsconfig.json': null,
    'scripts/build-standalone.mjs': null, 'scripts/lib/standalone-freshness.mjs': null,
    'scripts/prepare-standalone-assets.mjs': null, 'scripts/start-standalone.mjs': null,
    'scripts/require-node22.mjs': null, 'scripts/lib/node-version.mjs': null,
  };
  writeFileSync(join(root, '.next/standalone/.tcwiki-inputs.json'), JSON.stringify({ schemaVersion: 1, files, serverSha256: sha('server') }));
  const time = new Date(100_000);
  utimesSync(join(root, '.next/standalone/server.js'), time, time);
  utimesSync(join(root, 'src/app/page.tsx'), time, time);
  return root;
}

afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
it('fails closed when the standalone build is missing', () => {
  const root = fixture(); rmSync(join(root, '.next'), { recursive: true });
  expect(() => checkStandaloneFreshness(root)).toThrow(/Standalone build is missing/);
});
it('requires a build input receipt even when source mtimes are older', () => {
  const root = fixture(); rmSync(join(root, '.next/standalone/.tcwiki-inputs.json'));
  expect(() => checkStandaloneFreshness(root)).toThrow(/receipt is missing/);
});
it('rejects a source change with its mtime preserved', () => {
  const root = fixture(); writeFileSync(join(root, 'src/app/page.tsx'), 'changed');
  utimesSync(join(root, 'src/app/page.tsx'), new Date(100_000), new Date(100_000));
  expect(() => checkStandaloneFreshness(root)).toThrow(/src\/app\/page\.tsx/);
});
it('rejects deleted inputs and new relevant configuration', () => {
  const root = fixture(); rmSync(join(root, 'src/app/page.tsx'));
  expect(() => checkStandaloneFreshness(root)).toThrow(/src\/app\/page\.tsx/);
  writeFileSync(join(root, 'src/app/page.tsx'), 'original');
  writeFileSync(join(root, 'next.config.ts'), 'changed config');
  expect(() => checkStandaloneFreshness(root)).toThrow(/next.config\.ts/);
});
it('ignores unrelated proposal edits and source metadata documents', () => {
  const root = fixture(); writeFileSync(join(root, 'docs/proposal.md'), 'new proposal');
  writeFileSync(join(root, 'src/AGENTS.md'), 'instructions');
  expect(() => checkStandaloneFreshness(root)).not.toThrow();
});
it('rejects replacement of the recorded server artifact', () => {
  const root = fixture(); writeFileSync(join(root, '.next/standalone/server.js'), 'other server');
  expect(() => checkStandaloneFreshness(root)).toThrow(/server artifact/);
});

it('does not exclude README files that are served as public assets', () => {
  const root = fixture();
  writeFileSync(join(root, 'public/README.md'), 'new runtime asset');
  expect(() => checkStandaloneFreshness(root)).toThrow(/public\/README\.md/);
});
