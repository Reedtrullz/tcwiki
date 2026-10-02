import './require-node22.mjs';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';

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

function reportCandidates(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isFile() && isPlatformArtifactFile(entry.name)) {
      console.log(`Candidate: ${relative(root, entryPath)} (review required; no files removed)`);
      continue;
    }

    if (entry.isDirectory() && !skipDirectories.has(entry.name)) {
      reportCandidates(entryPath);
    }
  }
}

function validateRemoval(selectedPath) {
  const path = resolve(root, selectedPath);
  const localPath = relative(root, path);
  if (isAbsolute(selectedPath) || !cleanupRoots.some((prefix) => localPath.startsWith(`${prefix}${sep}`))) {
    throw new Error(`Outside cleanup scope: ${selectedPath}`);
  }
  const name = localPath.split(sep).at(-1);
  if (!isPlatformArtifactFile(name) || !lstatSync(path).isFile()) {
    throw new Error(`Not a recognized file candidate: ${localPath}`);
  }
  if (!realpathSync(path).startsWith(`${realpathSync(root)}${sep}`)) {
    throw new Error(`Candidate escapes checkout: ${localPath}`);
  }
  // A failed Git lookup is an error, never evidence that a file is untracked.
  if (execFileSync('git', ['ls-files', '-z', '--', localPath], { cwd: root, encoding: 'utf8' }).length) {
    throw new Error(`Tracked file is protected: ${localPath}`);
  }
  if (name !== '.DS_Store') {
    const original = path.replace(/ \(\d+\)(?=\.[^.]+$)/, '');
    if (!existsSync(original) || !lstatSync(original).isFile() ||
        !realpathSync(original).startsWith(`${realpathSync(root)}${sep}`) ||
        !readFileSync(path).equals(readFileSync(original))) {
      throw new Error(`Missing or different original; preserve authored file: ${localPath}`);
    }
  }
  return path;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  for (const cleanupRoot of cleanupRoots) {
    const cleanupPath = join(root, cleanupRoot);
    if (existsSync(cleanupPath)) reportCandidates(cleanupPath);
  }
} else if (args[0] === '--remove' && args.length > 1) {
  const selectedPaths = args.slice(1).map(validateRemoval);
  for (const path of selectedPaths) {
    rmSync(path);
    console.log(`Removed reviewed candidate: ${relative(root, path)}`);
  }
} else {
  throw new Error('Usage: node scripts/clean-platform-artifacts.mjs [--remove <reviewed path> ...]');
}
