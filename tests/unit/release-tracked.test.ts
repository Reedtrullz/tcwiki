import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

interface ReleaseTrackedAuditResult {
  referencedFiles: string[];
  missingFiles: string[];
  untrackedFiles: string[];
}

const {
  auditReleaseTrackedFiles,
  collectLocalProofImportsFromText,
  collectLocalScriptImportsFromText,
  collectReleaseReferencedFilesFromText,
  formatReleaseTrackedFailure,
} = await import('../../scripts/lib/release-tracked.mjs') as {
  auditReleaseTrackedFiles: (options: {
    root: string;
    sourceFiles?: string[];
    trackedFiles?: Iterable<string>;
  }) => ReleaseTrackedAuditResult;
  collectLocalProofImportsFromText: (text: string, importerPath: string, root: string) => string[];
  collectLocalScriptImportsFromText: (text: string, importerPath: string) => string[];
  collectReleaseReferencedFilesFromText: (text: string) => string[];
  formatReleaseTrackedFailure: (result: ReleaseTrackedAuditResult) => string;
};

const tempRoots: string[] = [];

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'tcwiki-release-tracked-'));
  tempRoots.push(root);
  return root;
}

function write(root: string, path: string, content: string) {
  const fullPath = join(root, path);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

describe('release proof trackedness audit', () => {
  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('extracts release proof scripts and spec files from command text', () => {
    expect(collectReleaseReferencedFilesFromText(
      'node scripts/require-node22.mjs && playwright test tests/runtime.spec.ts tests/home.spec.ts --project=chromium'
    )).toEqual([
      'scripts/require-node22.mjs',
      'tests/home.spec.ts',
      'tests/runtime.spec.ts',
    ]);

    expect(collectReleaseReferencedFilesFromText(`
      scripts/check-production-readiness-host.sh
      deploy/systemd/tcwiki-readiness-monitor.service
      deploy/systemd/tcwiki-readiness-monitor.timer
    `)).toEqual([
      'deploy/systemd/tcwiki-readiness-monitor.service',
      'deploy/systemd/tcwiki-readiness-monitor.timer',
      'scripts/check-production-readiness-host.sh',
    ]);
  });

  it('extracts local script dependencies from ESM imports', () => {
    expect(collectLocalScriptImportsFromText(
      "import './require-node22.mjs';\nimport { run } from './lib/release-tracked.mjs';",
      'scripts/check-release-tracked.mjs'
    )).toEqual([
      'scripts/lib/release-tracked.mjs',
      'scripts/require-node22.mjs',
    ]);
  });

  it('resolves extensionless local TypeScript proof imports', () => {
    const root = makeRoot();
    write(root, 'tests/helpers/layout-safety.ts', 'export const readLayoutSafety = () => true;');

    expect(collectLocalProofImportsFromText(
      "import { readLayoutSafety } from './helpers/layout-safety';",
      'tests/network.spec.ts',
      root,
    )).toEqual(['tests/helpers/layout-safety.ts']);
  });

  it('reports missing and untracked referenced proof files separately', () => {
    const root = makeRoot();
    write(root, 'package.json', JSON.stringify({
      scripts: {
        smoke: 'node scripts/require-node22.mjs && playwright test tests/runtime.spec.ts tests/missing.spec.ts',
      },
    }));
    write(root, 'scripts/require-node22.mjs', "import './lib/node-version.mjs';");
    write(root, 'scripts/lib/node-version.mjs', 'export {};');
    write(root, 'tests/runtime.spec.ts', 'test("ok", () => {});');

    const result = auditReleaseTrackedFiles({
      root,
      sourceFiles: ['package.json'],
      trackedFiles: ['package.json', 'scripts/require-node22.mjs'],
    });

    expect(result.missingFiles).toEqual(['tests/missing.spec.ts']);
    expect(result.untrackedFiles).toEqual(['scripts/lib/node-version.mjs', 'tests/runtime.spec.ts']);
    expect(formatReleaseTrackedFailure(result)).toContain('local-only proof files');
  });

  it('passes when every referenced proof file exists and is tracked', () => {
    const root = makeRoot();
    write(root, 'package.json', JSON.stringify({
      scripts: {
        smoke: 'node scripts/require-node22.mjs && node scripts/smoke-docker-runtime.mjs',
      },
    }));
    write(root, 'scripts/require-node22.mjs', 'export {};');
    write(root, 'scripts/smoke-docker-runtime.mjs', 'export {};');

    const result = auditReleaseTrackedFiles({
      root,
      sourceFiles: ['package.json'],
      trackedFiles: ['package.json', 'scripts/require-node22.mjs', 'scripts/smoke-docker-runtime.mjs'],
    });

    expect(result.missingFiles).toEqual([]);
    expect(result.untrackedFiles).toEqual([]);
  });

  it('reports untracked helpers imported by a tracked browser spec', () => {
    const root = makeRoot();
    write(root, 'package.json', JSON.stringify({
      scripts: {
        smoke: 'playwright test tests/network.spec.ts',
      },
    }));
    write(root, 'tests/network.spec.ts', "import { mock } from './helpers/thornode-mocks';\nmock();");
    write(root, 'tests/helpers/thornode-mocks.ts', 'export const mock = () => undefined;');

    const result = auditReleaseTrackedFiles({
      root,
      sourceFiles: ['package.json'],
      trackedFiles: ['package.json', 'tests/network.spec.ts'],
    });

    expect(result.untrackedFiles).toEqual(['tests/helpers/thornode-mocks.ts']);
  });
});
