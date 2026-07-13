import './require-node22.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkStandaloneFreshness } from './lib/standalone-freshness.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

try {
  checkStandaloneFreshness(root);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

await import(pathToFileURL(join(root, 'scripts/start-standalone.mjs')).href);
