import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const RELEASE_TRACKED_SOURCE_FILES = [
  'package.json',
  '.github/workflows/ci.yml',
  '.github/workflows/operations.yml',
  'README.md',
  'CONTRIBUTING.md',
  'docs/maintenance.md',
  'docs/operations.md',
  'ansible-playbook.yml',
  'Dockerfile',
  'playwright.config.ts',
];

const releaseFilePattern = /\b(?:scripts\/[A-Za-z0-9._/-]+\.(?:mjs|sh)|tests\/[A-Za-z0-9._/-]+\.spec\.ts|deploy\/systemd\/[A-Za-z0-9._-]+\.(?:service|timer))\b/g;
const localScriptImportPattern = /(?:import\s+(?:[^'"]+\s+from\s+)?|await\s+import\()\s*['"](\.{1,2}\/[^'"]+\.mjs)['"]/g;
const localProofImportPattern = /(?:import\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?|export\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g;

function normalizeRepoPath(path) {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\.\//, '');
}

export function collectReleaseReferencedFilesFromText(text) {
  const matches = text.match(releaseFilePattern) ?? [];
  return [...new Set(matches.map(normalizeRepoPath))].sort();
}

export function collectLocalScriptImportsFromText(text, importerPath) {
  const files = new Set();
  for (const match of text.matchAll(localScriptImportPattern)) {
    const importPath = match[1];
    const repoPath = normalizeRepoPath(join(dirname(importerPath), importPath));
    if (!repoPath.startsWith('../') && repoPath.startsWith('scripts/')) {
      files.add(repoPath);
    }
  }

  return [...files].sort();
}

function proofImportCandidates(repoPath) {
  return [
    repoPath,
    `${repoPath}.mjs`,
    `${repoPath}.js`,
    `${repoPath}.ts`,
    `${repoPath}.tsx`,
    `${repoPath}.d.ts`,
    `${repoPath}/index.mjs`,
    `${repoPath}/index.js`,
    `${repoPath}/index.ts`,
    `${repoPath}/index.tsx`,
  ];
}

export function collectLocalProofImportsFromText(text, importerPath, root) {
  if (!root) {
    throw new Error('collectLocalProofImportsFromText requires a repository root.');
  }

  const files = new Set();
  for (const match of text.matchAll(localProofImportPattern)) {
    const importPath = match[1];
    const repoPath = normalizeRepoPath(join(dirname(importerPath), importPath));
    if (!repoPath.startsWith('scripts/') && !repoPath.startsWith('tests/')) {
      continue;
    }

    const resolved = proofImportCandidates(repoPath).find((candidate) => existsSync(join(root, candidate)));
    files.add(resolved ?? repoPath);
  }

  return [...files].sort();
}

export function collectReleaseReferencedFiles(root, sourceFiles = RELEASE_TRACKED_SOURCE_FILES) {
  const files = new Set();

  for (const sourceFile of sourceFiles) {
    const sourcePath = join(root, sourceFile);
    if (!existsSync(sourcePath)) {
      continue;
    }

    const source = readFileSync(sourcePath, 'utf8');
    for (const file of collectReleaseReferencedFilesFromText(source)) {
      files.add(file);
    }
  }

  const queue = [...files];
  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || (!file.startsWith('scripts/') && !file.startsWith('tests/')) || !existsSync(join(root, file))) {
      continue;
    }

    const source = readFileSync(join(root, file), 'utf8');
    for (const importedFile of collectLocalProofImportsFromText(source, file, root)) {
      if (!files.has(importedFile)) {
        files.add(importedFile);
        queue.push(importedFile);
      }
    }
  }

  return [...files].sort();
}

export function trackedFilesFromGit(root, files) {
  if (files.length === 0) {
    return new Set();
  }

  const output = execFileSync('git', ['ls-files', '--', ...files], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Set(output.split('\n').map((line) => line.trim()).filter(Boolean));
}

export function auditReleaseTrackedFiles({ root, sourceFiles = RELEASE_TRACKED_SOURCE_FILES, trackedFiles } = {}) {
  if (!root) {
    throw new Error('auditReleaseTrackedFiles requires a repository root.');
  }

  const referencedFiles = collectReleaseReferencedFiles(root, sourceFiles);
  const trackedFileSet = trackedFiles ? new Set([...trackedFiles].map(normalizeRepoPath)) : trackedFilesFromGit(root, referencedFiles);
  const missingFiles = referencedFiles.filter((file) => !existsSync(join(root, file)));
  const untrackedFiles = referencedFiles.filter((file) => existsSync(join(root, file)) && !trackedFileSet.has(file));

  return {
    referencedFiles,
    missingFiles,
    untrackedFiles,
  };
}

export function formatReleaseTrackedFailure(result) {
  const lines = [
    'Release proof trackedness check failed.',
    'Package scripts, CI, release docs, and their local proof dependencies should not point at local-only proof files.',
  ];

  if (result.missingFiles.length > 0) {
    lines.push('', 'Missing referenced files:');
    for (const file of result.missingFiles) {
      lines.push(`- ${file}`);
    }
  }

  if (result.untrackedFiles.length > 0) {
    lines.push('', 'Referenced files that exist locally but are not tracked by git:');
    for (const file of result.untrackedFiles) {
      lines.push(`- ${file}`);
    }
  }

  lines.push('', 'Stage or remove the referenced files before treating local release evidence as ship-ready.');
  return lines.join('\n');
}
