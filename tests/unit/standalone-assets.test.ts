import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { prepareStandaloneAssets } from '../../scripts/prepare-standalone-assets.mjs';

const scratchRoots: string[] = [];

function createStandaloneFixture() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-standalone-assets-'));
  scratchRoots.push(root);

  mkdirSync(join(root, '.next/static/chunks'), { recursive: true });
  mkdirSync(join(root, '.next/standalone'), { recursive: true });
  mkdirSync(join(root, 'public/assets'), { recursive: true });
  writeFileSync(join(root, '.next/standalone/server.js'), 'export {};');
  writeFileSync(join(root, '.next/static/chunks/app.js'), 'console.log("fresh static");');
  writeFileSync(join(root, 'public/assets/logo.txt'), 'fresh public asset');

  return root;
}

function runPrepareInChild(root: string) {
  const scriptUrl = pathToFileURL(join(process.cwd(), 'scripts/prepare-standalone-assets.mjs')).href;
  const command = `import { prepareStandaloneAssets } from ${JSON.stringify(scriptUrl)}; prepareStandaloneAssets(process.argv[1]);`;

  return new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ['--input-type=module', '-e', command, root], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`prepareStandaloneAssets child exited ${code}: ${stderr}`));
    });
  });
}

describe('prepareStandaloneAssets', () => {
  afterEach(() => {
    for (const root of scratchRoots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('publishes standalone static and public assets idempotently', () => {
    const root = createStandaloneFixture();
    const staleStaticPath = join(root, '.next/standalone/.next/static/chunks/app.js');

    mkdirSync(join(root, '.next/standalone/.next/static/chunks'), { recursive: true });
    writeFileSync(staleStaticPath, 'stale static');

    prepareStandaloneAssets(root);
    prepareStandaloneAssets(root);

    expect(readFileSync(staleStaticPath, 'utf8')).toBe('console.log("fresh static");');
    expect(readFileSync(join(root, '.next/standalone/public/assets/logo.txt'), 'utf8')).toBe('fresh public asset');
  });

  it('tolerates concurrent standalone asset preparation from separate processes', async () => {
    const root = createStandaloneFixture();
    const staleStaticPath = join(root, '.next/standalone/.next/static/chunks/app.js');

    mkdirSync(join(root, '.next/standalone/.next/static/chunks'), { recursive: true });
    writeFileSync(staleStaticPath, 'stale static');
    writeFileSync(join(root, '.next/static/chunks/large.js'), 'x'.repeat(512 * 1024));

    await Promise.all(Array.from({ length: 6 }, () => runPrepareInChild(root)));

    expect(readFileSync(staleStaticPath, 'utf8')).toBe('console.log("fresh static");');
    expect(readFileSync(join(root, '.next/standalone/.next/static/chunks/large.js'), 'utf8')).toBe('x'.repeat(512 * 1024));
  });

  it('keeps missing required build output fail-closed', () => {
    const root = createStandaloneFixture();

    rmSync(join(root, '.next/static'), { force: true, recursive: true });

    expect(() => prepareStandaloneAssets(root)).toThrow('Next static assets is missing. Run npm run build first.');
  });
});
