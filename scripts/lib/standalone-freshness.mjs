import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const sourceRoots = [
  'content',
  'docs',
  'public',
  'scripts',
  'src',
  'tests',
  'Dockerfile',
  'next.config.ts',
  'package-lock.json',
  'package.json',
  'playwright.config.ts',
  'postcss.config.mjs',
  'tsconfig.json',
];

const ignoredDirectories = new Set([
  '.git',
  '.next',
  'node_modules',
  'test-results',
  'playwright-report',
]);

function newestFileMtime(path, root, newest) {
  if (!existsSync(path)) {
    return newest;
  }

  const stat = statSync(path);
  if (stat.isDirectory()) {
    const name = path.split('/').at(-1);
    if (name && ignoredDirectories.has(name)) {
      return newest;
    }

    let current = newest;
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      current = newestFileMtime(join(path, entry.name), root, current);
    }
    return current;
  }

  if (!stat.isFile()) {
    return newest;
  }

  if (!newest || stat.mtimeMs > newest.mtimeMs) {
    return {
      path: relative(root, path),
      mtimeMs: stat.mtimeMs,
    };
  }

  return newest;
}

export function checkStandaloneFreshness(root) {
  const serverPath = join(root, '.next/standalone/server.js');
  if (!existsSync(serverPath)) {
    throw new Error("Standalone build is missing. Run `npm run build` before local standalone Playwright, or set `PLAYWRIGHT_WEB_SERVER_COMMAND='npm run dev'` for source-mode browser checks.");
  }

  const serverStat = statSync(serverPath);
  let newestSource = null;
  for (const sourceRoot of sourceRoots) {
    newestSource = newestFileMtime(join(root, sourceRoot), root, newestSource);
  }

  if (newestSource && newestSource.mtimeMs > serverStat.mtimeMs) {
    throw new Error(
      `Standalone build is stale: ${newestSource.path} is newer than .next/standalone/server.js. ` +
      "Run `npm run build` before local standalone Playwright, or set `PLAYWRIGHT_WEB_SERVER_COMMAND='npm run dev'` for source-mode browser checks."
    );
  }
}
