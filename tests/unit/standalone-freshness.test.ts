import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const { checkStandaloneFreshness } = await import('../../scripts/lib/standalone-freshness.mjs') as {
  checkStandaloneFreshness: (root: string) => void;
};

const tempRoots: string[] = [];

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-standalone-freshness-'));
  tempRoots.push(root);
  mkdirSync(join(root, '.next/standalone'), { recursive: true });
  mkdirSync(join(root, 'src/app'), { recursive: true });
  return root;
}

function writeWithMtime(path: string, content: string, seconds: number) {
  writeFileSync(path, content);
  const when = new Date(seconds * 1000);
  utimesSync(path, when, when);
}

describe('standalone freshness preflight', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails closed when the standalone build is missing', () => {
    const root = makeRoot();
    rmSync(join(root, '.next'), { recursive: true, force: true });

    expect(() => checkStandaloneFreshness(root)).toThrow(/Standalone build is missing/);
  });

  it('fails when app source is newer than the standalone build', () => {
    const root = makeRoot();
    writeWithMtime(join(root, '.next/standalone/server.js'), 'server', 100);
    writeWithMtime(join(root, 'src/app/page.tsx'), 'new page', 200);

    expect(() => checkStandaloneFreshness(root)).toThrow(/src\/app\/page\.tsx/);
  });

  it('passes when the standalone build is newer than app source', () => {
    const root = makeRoot();
    writeWithMtime(join(root, 'src/app/page.tsx'), 'old page', 100);
    writeWithMtime(join(root, '.next/standalone/server.js'), 'server', 200);

    expect(() => checkStandaloneFreshness(root)).not.toThrow();
  });
});
