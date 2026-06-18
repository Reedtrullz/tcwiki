import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = dirname(dirname(fileURLToPath(import.meta.url)));

function copyDirectory(source, destination, label, required) {
  if (!existsSync(source)) {
    if (required) {
      throw new Error(`${label} is missing. Run npm run build first.`);
    }
    return;
  }

  rmSync(destination, { force: true, recursive: true });
  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true });
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
