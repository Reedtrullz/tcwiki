import './require-node22.mjs';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const cleanupRoots = ['content', 'docs', 'scripts', 'src', 'tests'];
const finderDuplicateFilePattern = / \(\d+\)\.(?:css|js|json|md|mdx|mjs|ts|tsx)$/;
const skipDirectories = new Set([
  '.artifacts',
  '.git',
  '.next',
  '.playwright-cli',
  'build',
  'coverage',
  'node_modules',
  'out',
  'playwright-report',
  'test-results',
]);

function isPlatformArtifactFile(name) {
  return name === '.DS_Store' || finderDuplicateFilePattern.test(name);
}

function removePlatformArtifactFile(path) {
  if (existsSync(path)) {
    rmSync(path);
  }
}

function removePlatformArtifactFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isFile() && isPlatformArtifactFile(entry.name)) {
      removePlatformArtifactFile(entryPath);
      continue;
    }

    if (entry.isDirectory() && !skipDirectories.has(entry.name)) {
      removePlatformArtifactFiles(entryPath);
    }
  }
}

for (const cleanupRoot of cleanupRoots) {
  const cleanupPath = join(root, cleanupRoot);
  if (existsSync(cleanupPath)) {
    removePlatformArtifactFiles(cleanupPath);
  }
}
