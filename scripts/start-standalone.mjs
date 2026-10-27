import './require-node22.mjs';
import { checkStandaloneFreshness } from './lib/standalone-freshness.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareStandaloneAssets } from './prepare-standalone-assets.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

checkStandaloneFreshness(root);
prepareStandaloneAssets(root);

await import(pathToFileURL(join(root, '.next/standalone/server.js')).href);
