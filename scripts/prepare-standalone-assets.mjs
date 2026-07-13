import './require-node22.mjs';
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = dirname(dirname(fileURLToPath(import.meta.url)));
let copySequence = 0;

function copyFileAtomically(source, destination) {
  mkdirSync(dirname(destination), { recursive: true });
  const tempDestination = `${destination}.tmp-${process.pid}-${copySequence++}`;

  try {
    copyFileSync(source, tempDestination);
    renameSync(tempDestination, destination);
  } catch (error) {
    rmSync(tempDestination, { force: true });
    throw error;
  }
}

function copyDirectoryContents(source, destination) {
  mkdirSync(destination, { recursive: true });

  for (const entry of readdirSync(source, { withFileTypes: true })) {
    const sourcePath = join(source, entry.name);
    const destinationPath = join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      copyFileAtomically(sourcePath, destinationPath);
    }
  }
}

function copyDirectory(source, destination, label, required) {
  if (!existsSync(source)) {
    if (required) {
      throw new Error(`${label} is missing. Run npm run build first.`);
    }
    return;
  }

  copyDirectoryContents(source, destination);
}

export function prepareStandaloneAssets(root = defaultRoot) {
  const standaloneDir = join(root, '.next/standalone');
  const serverPath = join(standaloneDir, 'server.js');

  if (!existsSync(serverPath)) {
    throw new Error('Standalone server is missing. Run npm run build first.');
  }

  copyDirectory(
    join(root, '.next/static'),
    join(standaloneDir, '.next/static'),
    'Next static assets',
    true
  );
  copyDirectory(join(root, 'public'), join(standaloneDir, 'public'), 'Public assets', false);
}
